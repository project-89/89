import { Router } from 'express';
import { getEnhancedPrisma } from '../lib/zenstack';
import { fingerprintWriteEndpoint, protectedEndpoint } from '../middleware/chains.middleware';
import { sendSuccess, sendError, ApiError } from '../utils';
import type { Request, Response } from 'express';

const router = Router();

// BEFORE (with manual authorization checks):
router.get('/old-way/missions/:id', ...protectedEndpoint(), async (req: Request, res: Response) => {
  try {
    const db = getEnhancedPrisma(req); // Regular Prisma
    const mission = await db.mission.findUnique({
      where: { id: req.params.id }
    });
    
    // Manual authorization check
    if (!mission) {
      return sendError(res, new ApiError(404, 'Mission not found'));
    }
    
    // Check if user can access this mission
    const canAccess = mission.status === 'available' || 
      mission.participants.some((p: any) => p.fingerprintId === req.auth?.fingerprint?.id);
    
    if (!canAccess) {
      return sendError(res, new ApiError(403, 'Access denied'));
    }
    
    return sendSuccess(res, mission);
  } catch (error) {
    return sendError(res, ApiError.from(error as Error, 500, 'Failed'));
  }
});

// AFTER (with ZenStack - authorization automatic):
router.get('/new-way/missions/:id', ...fingerprintWriteEndpoint(), async (req: Request, res: Response) => {
  try {
    const db = getEnhancedPrisma(req); // ZenStack enhanced Prisma
    
    // This will automatically return null if user doesn't have access
    // No manual authorization needed!
    const mission = await db.mission.findUnique({
      where: { id: req.params.id },
      include: { objectives: true }
    });
    
    if (!mission) {
      // Could be not found OR access denied - ZenStack returns null for both
      return sendError(res, new ApiError(404, 'Mission not found or access denied'));
    }
    
    return sendSuccess(res, mission);
  } catch (error) {
    return sendError(res, ApiError.from(error as Error, 500, 'Failed'));
  }
});

// You still need auth middleware to establish the context
// But you DON'T need authorization checks in the handler
router.post('/missions', ...protectedEndpoint(), async (req: Request, res: Response) => {
  try {
    const db = getEnhancedPrisma(req);
    
    // ZenStack will check if user has 'create' permission
    // If not, it will throw an error
    const mission = await db.mission.create({
      data: req.body
    });
    
    return sendSuccess(res, mission, 'Mission created', 201);
  } catch (error: any) {
    if (error.message?.includes('denied by policy')) {
      return sendError(res, new ApiError(403, 'You do not have permission to create missions'));
    }
    return sendError(res, ApiError.from(error as Error, 500, 'Failed'));
  }
});

// Example: Listing with automatic filtering
router.get('/my-missions', ...fingerprintWriteEndpoint(), async (req: Request, res: Response) => {
  try {
    const db = getEnhancedPrisma(req);
    
    // This will only return missions the user can see
    // No need to filter by fingerprintId manually!
    const missions = await db.mission.findMany({
      orderBy: { createdAt: 'desc' }
    });
    
    return sendSuccess(res, missions);
  } catch (error) {
    return sendError(res, ApiError.from(error as Error, 500, 'Failed'));
  }
});

export default router;