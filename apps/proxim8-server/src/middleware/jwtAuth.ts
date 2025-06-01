import { Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { logger } from "../utils/logger";
import config from "../config";
import { isTokenBlacklisted } from "../services/tokenBlacklist";
import { getSigningKeyById } from "../services/tokenRotation";
import { RequestWithUser } from "./auth";

// Add a type for JWT payload
interface JwtPayload {
  walletAddress: string;
  isAdmin: boolean;
  keyId?: string; // Optional, may not be present in older tokens
  iat: number;
  exp: number;
}

/**
 * Authentication middleware using JWT
 * Verifies the token and attaches user info to the request object
 */
export const jwtAuth = async (
  req: RequestWithUser,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({ message: "Authentication required" });
      return;
    }

    // Extract token from "Bearer <token>"
    const token = authHeader.split(" ")[1];

    // Check if token is blacklisted
    const blacklisted = await isTokenBlacklisted(token);
    if (blacklisted) {
      logger.warn(
        `Attempt to use blacklisted token: ${token.substring(0, 10)}...`
      );
      res.status(401).json({ message: "Token has been revoked" });
      return;
    }

    // First, decode token without verification to get the key ID
    let decoded: JwtPayload;
    try {
      const decodedPayload = jwt.decode(token) as JwtPayload;

      // If token has a key ID, verify using that key
      if (decodedPayload && decodedPayload.keyId) {
        const keyData = await getSigningKeyById(decodedPayload.keyId);

        if (keyData) {
          // Verify with the specific key
          decoded = jwt.verify(token, keyData.key) as JwtPayload;
        } else {
          // Key not found, try with config secret as fallback
          logger.warn(
            `Signing key ${decodedPayload.keyId} not found, trying fallback`
          );
          decoded = jwt.verify(token, config.jwtSecret) as JwtPayload;
        }
      } else {
        // No key ID, verify with config secret
        decoded = jwt.verify(token, config.jwtSecret) as JwtPayload;
      }

      // Attach user info to request - only include walletAddress and isAdmin
      req.user = {
        walletAddress: decoded.walletAddress,
        isAdmin: decoded.isAdmin,
      };

      // Token is valid, proceed
      next();
    } catch (error) {
      logger.warn(`Invalid token: ${error}`);
      res.status(401).json({ message: "Invalid or expired token" });
    }
  } catch (error) {
    logger.error(`Auth middleware error: ${error}`);
    res.status(500).json({ message: "Authentication error" });
  }
};

/**
 * Admin-only middleware
 * Requires jwtAuth middleware to run first
 */
export const adminOnly = (
  req: RequestWithUser,
  res: Response,
  next: NextFunction
): void => {
  try {
    // Check if user exists and is admin
    if (!req.user || !req.user.isAdmin) {
      res.status(403).json({ message: "Admin access required" });
      return;
    }

    // User is admin, proceed
    next();
  } catch (error) {
    logger.error(`Admin middleware error: ${error}`);
    res.status(500).json({ message: "Authorization error" });
  }
};
