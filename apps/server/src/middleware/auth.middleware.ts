import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { ERROR_MESSAGES } from '../constants';
import '../types/express'; // Load Request interface extension first
import { ApiError } from '../utils';

interface JWTPayload {
  accountId: string;
  walletAddress: string;
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
      const { accountId, walletAddress } = decodedToken;
      if (!accountId || !walletAddress) {
        throw new ApiError(401, ERROR_MESSAGES.INVALID_TOKEN_FORMAT);
      }

      // Set account info on request for ownership checks
      req.auth = {
        ...(req.auth || {}),
        account: {
          id: accountId,
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
