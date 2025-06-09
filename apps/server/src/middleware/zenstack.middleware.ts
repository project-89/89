import { ZenStackMiddleware } from '@zenstackhq/server/express';
import { Request, Response, NextFunction } from 'express';
import { getEnhancedPrisma } from '../lib/zenstack';

/**
 * Create ZenStack middleware for auto-CRUD endpoints
 * This middleware handles all CRUD operations with access control
 */
export function createZenStackMiddleware() {
  return ZenStackMiddleware({
    // Get the enhanced Prisma client based on the current user
    getPrisma: (req: Request) => {
      return getEnhancedPrisma(req);
    },
    
    // Optional: Add logging
    logger: {
      error: (message: string, code?: string) => {
        console.error('[ZenStack Error]', message, code);
      }
    }
  });
}

/**
 * Middleware to log ZenStack requests for debugging
 */
export function zenStackLogger(req: Request, res: Response, next: NextFunction) {
  console.log('[ZenStack Request]', {
    method: req.method,
    path: req.path,
    model: req.params.model,
    operation: req.params.operation,
    auth: {
      accountId: req.auth?.account?.id,
      fingerprintId: req.auth?.fingerprint?.id,
      isAdmin: req.auth?.proxim8?.isAdmin,
    },
  });
  next();
}