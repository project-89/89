import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { ERROR_MESSAGES } from '../constants';
// Express types are loaded globally
import { ApiError } from '../utils';

interface JWTPayload {
  id: string; // Change from accountId to id to match auth routes
  accountId?: string; // Make optional for backwards compatibility
  walletAddress: string;
  roleId?: string;
  isAdmin?: boolean;
  iat?: number;
  exp?: number;
}

/**
 * Middleware to validate JWT token and set accountId and walletAddress on request
 */
export const validateAuthToken = async (
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

    // Get JWT secret from environment
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new ApiError(500, 'JWT_SECRET environment variable is required');
    }

    try {
      const decodedToken = jwt.verify(token, jwtSecret) as JWTPayload;

      // Extract account info from token claims
      const { id, accountId, walletAddress, roleId, isAdmin } = decodedToken;
      
      // Use id field from token (new format) or accountId (old format)
      const actualAccountId = id || accountId;
      
      if (!actualAccountId || !walletAddress) {
        throw new ApiError(401, ERROR_MESSAGES.INVALID_TOKEN_FORMAT);
      }

      // Set account info on request for ownership checks
      req.auth = {
        ...(req.auth || {}),
        account: {
          id: actualAccountId,
        },
        wallet: {
          address: walletAddress,
        },
        proxim8: {
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
