import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { ERROR_MESSAGES } from '../constants';
import { getSigningKeyById } from '../services/keyRotation.service';
import { isTokenBlacklisted } from '../services/tokenBlacklist.service';
// Express types are loaded globally
import { ApiError } from '../utils';

// Enhanced JWT payload supporting both systems
interface EnhancedJWTPayload {
  // Core server fields
  accountId?: string;
  walletAddress: string;

  // Proxim8 fields
  isAdmin?: boolean;
  keyId?: string;

  // Standard JWT fields
  iat?: number;
  exp?: number;
}

/**
 * Enhanced middleware to validate JWT token supporting both core and Proxim8 formats
 * Includes token blacklisting and key rotation support
 */
export const validateProxim8AuthToken = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      throw new ApiError(401, ERROR_MESSAGES.TOKEN_REQUIRED);
    }

    const token = authHeader.split(' ')[1];

    // Check if token is blacklisted
    const blacklisted = await isTokenBlacklisted(token);
    if (blacklisted) {
      console.warn(
        `Attempt to use blacklisted token: ${token.substring(0, 10)}...`
      );
      throw new ApiError(401, 'Token has been revoked');
    }

    // Get JWT secret from environment
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new ApiError(500, 'JWT_SECRET environment variable is required');
    }

    try {
      let decodedToken: EnhancedJWTPayload;

      // First, decode token without verification to check for key ID
      const unverifiedPayload = jwt.decode(token) as EnhancedJWTPayload;

      // If token has a key ID, try to verify using that key
      if (unverifiedPayload && unverifiedPayload.keyId) {
        const keyData = await getSigningKeyById(unverifiedPayload.keyId);

        if (keyData) {
          // Verify with the specific key
          decodedToken = jwt.verify(token, keyData.key) as EnhancedJWTPayload;
        } else {
          // Key not found, try with config secret as fallback
          console.warn(
            `Signing key ${unverifiedPayload.keyId} not found, trying fallback`
          );
          decodedToken = jwt.verify(token, jwtSecret) as EnhancedJWTPayload;
        }
      } else {
        // No key ID, verify with config secret
        decodedToken = jwt.verify(token, jwtSecret) as EnhancedJWTPayload;
      }

      // Extract wallet address (required in both formats)
      const { walletAddress, accountId, isAdmin } = decodedToken;
      if (!walletAddress) {
        throw new ApiError(401, ERROR_MESSAGES.INVALID_TOKEN_FORMAT);
      }

      // Set auth info on request following core server patterns
      req.auth = {
        ...(req.auth || {}),
        wallet: {
          address: walletAddress,
        },
        // Set account info if available (core server format)
        ...(accountId && {
          account: {
            id: accountId,
          },
        }),
        // Store Proxim8-specific fields for backward compatibility
        proxim8: {
          walletAddress,
          isAdmin: isAdmin || false,
        },
      };

      next();
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        throw new ApiError(401, ERROR_MESSAGES.INVALID_TOKEN);
      }
      throw error;
    }
  } catch (error) {
    next(error);
  }
};

/**
 * Admin-only middleware for Proxim8 endpoints
 * Requires validateProxim8AuthToken middleware to run first
 */
export const requireProxim8Admin = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    // Check if user exists and is admin
    if (!req.auth?.proxim8?.isAdmin) {
      throw new ApiError(403, 'Admin access required');
    }

    // User is admin, proceed
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware to extract user info for backward compatibility
 * Sets req.user for endpoints that expect the old format
 */
export const setLegacyUserInfo = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    if (req.auth?.proxim8) {
      // Set legacy user format for backward compatibility
      (req as any).user = {
        walletAddress: req.auth.proxim8.walletAddress,
        isAdmin: req.auth.proxim8.isAdmin,
      };
    }

    next();
  } catch (error) {
    next(error);
  }
};
