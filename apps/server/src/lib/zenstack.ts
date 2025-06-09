import { enhance } from '@zenstackhq/runtime';
import { PrismaClient } from '../generated/prisma';
import type { Request } from 'express';

// Create base Prisma client
const prisma = new PrismaClient();

/**
 * Get ZenStack enhanced Prisma client with access control
 * @param req Express request with auth context
 * @returns Enhanced Prisma client
 */
export function getEnhancedPrisma(req: Request) {
  // Map Express auth context to ZenStack user object
  // ZenStack expects a flat object for auth()
  const user = {
    // IDs for ownership checks
    fingerprintId: req.auth?.fingerprint?.id,
    accountId: req.auth?.account?.id,
    agentId: req.auth?.agent?.id,
    walletAddress: req.auth?.wallet?.address,
    
    // Admin flag
    isAdmin: req.auth?.proxim8?.isAdmin || false,
    
    // Additional context if needed
    isAgentActive: req.auth?.agent?.isActive || false,
  };

  // Enhance Prisma client with access control
  return enhance(prisma, { user });
}

/**
 * Get enhanced Prisma client for system operations (bypasses access control)
 */
export function getSystemPrisma() {
  // Admin context bypasses all access control
  return enhance(prisma, { 
    user: { 
      proxim8: { isAdmin: true } 
    } 
  });
}

export { prisma as basePrisma };