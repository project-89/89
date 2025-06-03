import { Router } from 'express';
import {
  handleDeleteVideo,
  handleGenerateVideo,
  handleGetUserVideos,
  handleGetVideoStatus,
  handlePublishVideo,
  handleRefreshVideoUrls,
} from '../endpoints/video.endpoint';
import {
  proxim8AuthenticatedEndpoint,
  proxim8PublicEndpoint,
} from '../middleware/proxim8Chains.middleware';
import {
  DeleteVideoRequestSchema,
  GenerateVideoRequestSchema,
  GetUserVideosRequestSchema,
  GetVideoStatusRequestSchema,
  PublishVideoRequestSchema,
  RefreshVideoUrlsRequestSchema,
} from '../schemas';

const router = Router();

/**
 * Generate a new video for an NFT
 * Requires authentication and NFT ownership verification
 */
router.post(
  '/videos/generate',
  ...proxim8AuthenticatedEndpoint(GenerateVideoRequestSchema),
  handleGenerateVideo
);

/**
 * Get video generation status
 * Public endpoint - can check status with jobId
 */
router.get(
  '/videos/status/:jobId',
  ...proxim8PublicEndpoint(GetVideoStatusRequestSchema),
  handleGetVideoStatus
);

/**
 * Get user's video generations
 * Requires authentication
 */
router.get(
  '/videos/user',
  ...proxim8AuthenticatedEndpoint(GetUserVideosRequestSchema),
  handleGetUserVideos
);

/**
 * Publish video to public gallery
 * Requires authentication and ownership verification
 */
router.post(
  '/videos/:videoId/publish',
  ...proxim8AuthenticatedEndpoint(PublishVideoRequestSchema),
  handlePublishVideo
);

/**
 * Delete video generation
 * Requires authentication and ownership verification
 */
router.delete(
  '/videos/:videoId',
  ...proxim8AuthenticatedEndpoint(DeleteVideoRequestSchema),
  handleDeleteVideo
);

/**
 * Refresh video URLs (generate new signed URLs)
 * Requires authentication and ownership verification
 */
router.post(
  '/videos/:videoId/refresh-urls',
  ...proxim8AuthenticatedEndpoint(RefreshVideoUrlsRequestSchema),
  handleRefreshVideoUrls
);

export default router;
