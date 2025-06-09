import { ZenStackMiddleware } from '@zenstackhq/server/express';
import { getEnhancedPrisma } from './zenstack';
import type { Handler } from 'express';

/**
 * Create ZenStack REST API handler
 * Automatically handles CRUD operations with access control
 */
export function createZenStackHandler(): Handler {
  return ZenStackMiddleware({
    getPrisma: (req) => getEnhancedPrisma(req),
    // ZenStack will handle errors automatically
    logger: {
      error: (message: string, code?: string) => {
        console.error('[ZenStack API Error]', message, code);
      }
    }
  });
}