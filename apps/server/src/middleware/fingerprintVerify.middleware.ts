import { NextFunction, Request, Response } from 'express';
import { COLLECTIONS, ERROR_MESSAGES } from '../constants';
import '../types/express'; // Load Request interface extension
import { ApiError } from '../utils';
import { getDb } from '../utils/mongodb';

/**
 * Middleware to verify fingerprint exists for write operations
 * Does not check ownership, only existence
 */
export const verifyFingerprintExists = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Skip OPTIONS requests
    if (req.method === 'OPTIONS') {
      return next();
    }

    // Get fingerprintId from all possible locations
    const fingerprintId =
      req.params.fingerprintId ||
      req.params.id ||
      req.body.fingerprintId ||
      req.query.fingerprintId;

    if (!fingerprintId) {
      throw new ApiError(400, ERROR_MESSAGES.MISSING_FINGERPRINT);
    }

    // Check if fingerprint exists
    const db = await getDb();
    const fingerprintDoc = await db
      .collection(COLLECTIONS.FINGERPRINTS)
      .findOne({ id: fingerprintId });

    if (!fingerprintDoc) {
      throw new ApiError(404, ERROR_MESSAGES.FINGERPRINT_NOT_FOUND);
    }

    // Set fingerprintId on request for use in route handlers
    req.auth = {
      ...req.auth,
      fingerprint: {
        id: fingerprintId,
        roles: fingerprintDoc.roles || [],
      },
    };
    next();
  } catch (error) {
    next(error);
  }
};
