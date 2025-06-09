import { Router } from 'express';
import { createZenStackHandler } from '../lib/zenstack-handler';
import { getEnhancedPrisma } from '../lib/zenstack';
import { fingerprintWriteEndpoint } from '../middleware/chains.middleware';
import { sendSuccess, sendError, ApiError } from '../utils';
import type { Request, Response } from 'express';

const router = Router();

// Mount ZenStack auto-CRUD handler at /api/model
// This provides REST endpoints for all models with access control
router.use('/api/model', ...fingerprintWriteEndpoint(), createZenStackHandler());

// Example: Custom endpoint using enhanced Prisma
router.get('/api/my-missions', ...fingerprintWriteEndpoint(), async (req: Request, res: Response) => {
  try {
    const db = getEnhancedPrisma(req);
    
    // This query automatically filters based on access policies
    const missions = await db.mission.findMany({
      where: {
        OR: [
          { status: 'available' },
          { 
            participants: {
              some: { fingerprintId: req.auth?.fingerprint?.id }
            }
          }
        ]
      },
      include: {
        objectives: true,
        participants: {
          where: { fingerprintId: req.auth?.fingerprint?.id }
        }
      }
    });

    return sendSuccess(res, missions);
  } catch (error) {
    return sendError(res, ApiError.from(error, 500, 'Failed to fetch missions'));
  }
});

// Example: Create knowledge with automatic access control
router.post('/api/my-knowledge', ...fingerprintWriteEndpoint(), async (req: Request, res: Response) => {
  try {
    const db = getEnhancedPrisma(req);
    
    // ZenStack will automatically set ownerId and enforce creation policies
    const knowledge = await db.knowledge.create({
      data: {
        ...req.body,
        ownerId: req.auth?.account?.id || req.auth?.fingerprint?.id,
      }
    });

    return sendSuccess(res, knowledge, 'Knowledge created successfully', 201);
  } catch (error: any) {
    if (error.code === 'P2002') {
      return sendError(res, new ApiError(409, 'Knowledge already exists'));
    }
    return sendError(res, ApiError.from(error, 500, 'Failed to create knowledge'));
  }
});

// Example: Update video with ownership check (handled by ZenStack)
router.patch('/api/my-videos/:id', ...fingerprintWriteEndpoint(), async (req: Request, res: Response) => {
  try {
    const db = getEnhancedPrisma(req);
    
    // ZenStack will throw if user doesn't own the video
    const video = await db.video.update({
      where: { id: req.params.id },
      data: req.body
    });

    return sendSuccess(res, video, 'Video updated successfully');
  } catch (error: any) {
    if (error.message?.includes('denied by policy')) {
      return sendError(res, new ApiError(403, 'You do not have permission to update this video'));
    }
    return sendError(res, ApiError.from(error, 500, 'Failed to update video'));
  }
});

export default router;