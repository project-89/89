import { NextFunction, Request, Response } from 'express';
import { COLLECTIONS, DEFAULT_IP_RATE_LIMIT_CONFIG } from '../constants';
import { RateLimitConfig } from '../schemas';
// Express types are loaded globally
import { getDb } from '../utils/mongodb';

const SUSPICIOUS_IP_THRESHOLD = 10; // Number of requests needed to establish an IP as trusted
const SUSPICIOUS_TIME_WINDOW = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

export const ipRateLimit = (config: Partial<RateLimitConfig> = {}) => {
  const { windowMs } = {
    ...DEFAULT_IP_RATE_LIMIT_CONFIG,
    ...config,
  } as RateLimitConfig;

  return async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    //TODO: REVISIT THIS
    console.log('[IP Rate Limit] Not fully implemented');
    const now = new Date();
    const db = await getDb();
    const ipMetadata = await db
      .collection(COLLECTIONS.RATE_LIMITS)
      .findOne({ ip: req.ip });
    if (!ipMetadata) {
      await db.collection(COLLECTIONS.RATE_LIMITS).insertOne({
        ip: req.ip,
        createdAt: now,
        ipFrequency: {},
      });
    }

    const timeSinceCreation = now.getTime() - ipMetadata?.createdAt.getTime();

    if (timeSinceCreation > windowMs) {
      await db
        .collection(COLLECTIONS.RATE_LIMITS)
        .updateOne({ ip: req.ip }, { $set: { ipFrequency: {} } });
    }

    next();
    return;
  };
};

// TODO: Migrate checkSuspiciousIP function to MongoDB
// async function checkSuspiciousIP(...)
