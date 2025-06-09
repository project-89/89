import { Response } from "express";
import { PublicKey } from "@solana/web3.js";
import nacl from "tweetnacl";
import bs58 from "bs58";
import jwt from "jsonwebtoken";
import { logger } from "../utils/logger";
import { checkAdminStatus } from "../services/adminService";
import config from "../config";
import { blacklistToken } from "../services/tokenBlacklist";
import { getActiveSigningKey } from "../services/tokenRotation";
import { RequestWithUser } from "../middleware/auth";

// JWT configuration
const JWT_EXPIRES_IN = "24h";

/**
 * Verify a signature from a Solana wallet
 */
const verifySignature = (
  message: string,
  signature: string,
  publicKey: string
): boolean => {
  try {
    // Validate inputs
    if (!message || !signature || !publicKey) {
      logger.error(
        `Missing signature verification parameters: message=${!!message}, signature=${!!signature}, publicKey=${!!publicKey}`
      );
      return false;
    }

    // Log inputs for debugging (shortened for security)
    logger.debug(
      `Verifying signature - Message: ${message.substring(0, 20)}...`
    );
    logger.debug(`Signature (first 8 bytes): ${signature.substring(0, 8)}...`);
    logger.debug(`Public key: ${publicKey}`);

    // Validate public key format
    let publicKeyObj: PublicKey;
    try {
      publicKeyObj = new PublicKey(publicKey);

      // Additional check if the key is on curve
      if (!PublicKey.isOnCurve(publicKeyObj.toBuffer())) {
        logger.error(`Invalid public key: ${publicKey} - not on curve`);
        return false;
      }
    } catch (keyError) {
      logger.error(`Invalid public key format: ${publicKey} - ${keyError}`);
      return false;
    }

    // Decode signature
    let signatureBytes: Uint8Array;
    try {
      signatureBytes = bs58.decode(signature);
      logger.debug(
        `Signature decoded successfully (${signatureBytes.length} bytes)`
      );
    } catch (sigError) {
      logger.error(`Invalid signature format: ${sigError}`);
      return false;
    }

    // Convert message to bytes
    const messageBytes = new TextEncoder().encode(message);

    // Convert public key to bytes
    const publicKeyBytes = publicKeyObj.toBytes();

    // Verify signature
    const isValid = nacl.sign.detached.verify(
      messageBytes,
      signatureBytes,
      publicKeyBytes
    );

    logger.debug(`Signature verification result: ${isValid}`);
    return isValid;
  } catch (error) {
    logger.error(`Error verifying signature: ${error}`);
    return false;
  }
};

/**
 * Generate a JWT token for authenticated users
 */
const generateToken = async (
  walletAddress: string,
  isAdmin: boolean
): Promise<string> => {
  try {
    // Try to get the active signing key
    const keyData = await getActiveSigningKey();

    // If no active key, fall back to config secret
    if (!keyData) {
      logger.warn("No active signing key found, using fallback JWT secret");
      return jwt.sign(
        {
          walletAddress,
          isAdmin,
        },
        config.jwtSecret,
        {
          expiresIn: JWT_EXPIRES_IN,
        }
      );
    }

    // Use the active key to sign the token
    return jwt.sign(
      {
        walletAddress,
        isAdmin,
        keyId: keyData.id, // Include the key ID in the token payload
      },
      keyData.key,
      {
        expiresIn: JWT_EXPIRES_IN,
      }
    );
  } catch (error) {
    logger.error(`Error generating token: ${error}`);
    // Fall back to config secret
    return jwt.sign(
      {
        walletAddress,
        isAdmin,
      },
      config.jwtSecret,
      {
        expiresIn: JWT_EXPIRES_IN,
      }
    );
  }
};

/**
 * Login handler - verify signature and issue JWT token
 */
export const login = async (
  req: RequestWithUser,
  res: Response
): Promise<void> => {
  try {
    const { walletAddress, signature, message } = req.body;

    logger.debug(`Login attempt for wallet: ${walletAddress || "undefined"}`);

    // Validate required parameters
    if (!walletAddress || !signature || !message) {
      logger.warn(
        `Login missing required parameters: walletAddress=${!!walletAddress}, signature=${!!signature}, message=${!!message}`
      );
      res.status(400).json({
        success: false,
        error: "Missing required authentication parameters",
      });
      return;
    }

    // Validate wallet address format
    try {
      // Otherwise, enforce standard Solana public key validation
      new PublicKey(walletAddress);
    } catch (error) {
      logger.warn(
        `Invalid wallet address format during login: ${walletAddress}`
      );
      res.status(400).json({
        success: false,
        error: "Invalid wallet address format",
      });
      return;
    }

    // Validate signature format
    try {
      bs58.decode(signature);
    } catch (error) {
      logger.warn(`Invalid signature format during login`);
      res.status(400).json({
        success: false,
        error: "Invalid signature format",
      });
      return;
    }

    // Verify the signature
    const isValidSignature = verifySignature(message, signature, walletAddress);

    if (!isValidSignature) {
      logger.warn(`Invalid signature for wallet: ${walletAddress}`);
      res.status(401).json({
        success: false,
        error: "Invalid signature",
      });
      return;
    }

    logger.info(
      `Successful signature verification for wallet: ${walletAddress}`
    );

    // Check if user is an admin
    let isAdmin = false;
    try {
      const adminCheck = await checkAdminStatus(walletAddress);
      isAdmin = adminCheck.isAdmin;
      logger.debug(`Admin status for ${walletAddress}: ${isAdmin}`);
    } catch (error) {
      logger.error(
        `Failed to check admin status for ${walletAddress}: ${error}`
      );
      // Continue with non-admin status
    }

    // Generate JWT token
    try {
      const token = await generateToken(walletAddress, isAdmin);

      // Log success (don't log the actual token)
      logger.info(`Generated authentication token for ${walletAddress}`);

      // Return the token
      res.status(200).json({
        success: true,
        token,
        walletAddress,
        isAdmin,
      });
    } catch (tokenError) {
      logger.error(
        `Failed to generate token for ${walletAddress}: ${tokenError}`
      );
      res.status(500).json({
        success: false,
        error: "Failed to generate authentication token",
      });
    }
  } catch (error) {
    logger.error(`Authentication error: ${error}`);
    res.status(500).json({
      success: false,
      error: "Authentication failed",
      details: error instanceof Error ? error.message : undefined,
    });
  }
};

/**
 * Verify JWT token and return user info
 */
export const getMe = async (
  req: RequestWithUser,
  res: Response
): Promise<void> => {
  try {
    // User information is attached by the auth middleware
    const { walletAddress, isAdmin } = req.user as {
      walletAddress: string;
      isAdmin: boolean;
    };

    res.status(200).json({
      success: true,
      walletAddress,
      isAdmin,
    });
  } catch (error) {
    logger.error(`Error getting user profile: ${error}`);
    res.status(500).json({
      success: false,
      error: "Failed to get user profile",
    });
  }
};

/**
 * Refresh JWT token
 */
export const refreshToken = async (
  req: RequestWithUser,
  res: Response
): Promise<void> => {
  try {
    // User is already authenticated via middleware
    const { walletAddress, isAdmin } = req.user as {
      walletAddress: string;
      isAdmin: boolean;
    };

    // Generate a new token
    const token = await generateToken(walletAddress, isAdmin);

    res.status(200).json({
      success: true,
      token,
      walletAddress,
      isAdmin,
    });
  } catch (error) {
    logger.error(`Error refreshing token: ${error}`);
    res.status(500).json({
      success: false,
      error: "Failed to refresh token",
    });
  }
};

/**
 * Logout handler - invalidate JWT token
 */
export const logout = async (
  req: RequestWithUser,
  res: Response
): Promise<void> => {
  try {
    // Get the token from the Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(400).json({
        success: false,
        error: "No token provided",
      });
      return;
    }

    // Extract token from "Bearer <token>"
    const token = authHeader.split(" ")[1];

    // Blacklist the token
    const blacklisted = await blacklistToken(token);

    if (blacklisted) {
      logger.info(`User ${req.user?.walletAddress} logged out successfully`);
      res.status(200).json({
        success: true,
        message: "Logged out successfully",
      });
    } else {
      throw new Error("Failed to blacklist token");
    }
  } catch (error) {
    logger.error(`Logout error: ${error}`);
    res.status(500).json({
      success: false,
      error: "Logout failed",
    });
  }
};

/**
 * Validate token endpoint
 * Checks if a token is valid and not blacklisted
 */
export const validateToken = async (
  req: RequestWithUser,
  res: Response
): Promise<void> => {
  try {
    // Token already validated by jwtAuth middleware
    // If we reach here, the token is valid and not blacklisted

    // Return user info from the token
    res.status(200).json({
      success: true,
      user: {
        walletAddress: req.user?.walletAddress,
        isAdmin: req.user?.isAdmin,
      },
      message: "Token is valid",
    });
  } catch (error) {
    logger.error(`Token validation error: ${error}`);
    res.status(500).json({
      success: false,
      error: "Token validation failed",
    });
  }
};
