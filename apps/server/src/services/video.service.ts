import { VideoStatus } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import { ERROR_MESSAGES } from '../constants';
import {
  DeleteVideoRequest,
  GenerateVideoRequest,
  GetUserVideosRequest,
  GetVideoStatusRequest,
  PublishVideoRequest,
  RefreshVideoUrlsRequest,
  VideoGeneration,
  VideoListResponse,
  VideoStatusResponse,
} from '../schemas';
import { ApiError } from '../utils';
import { prisma } from './prisma.service';

const LOG_PREFIX = '[Video Service]';

// Helper function to safely extract metadata
const extractMetadata = (metadata: any) => {
  if (!metadata || typeof metadata !== 'object') {
    return { prompt: '', pipelineType: 'standard', options: {} };
  }

  return {
    prompt: typeof metadata.prompt === 'string' ? metadata.prompt : '',
    pipelineType:
      typeof metadata.pipelineType === 'string'
        ? metadata.pipelineType
        : 'standard',
    options: typeof metadata.options === 'object' ? metadata.options : {},
  };
};

// Helper function to convert dates to timestamps
const toTimestamp = (date: Date): number => {
  return Math.floor(date.getTime() / 1000);
};

/**
 * Generate a new video
 */
export const generateVideo = async (
  request: GenerateVideoRequest,
  walletAddress: string
): Promise<VideoGeneration> => {
  try {
    console.log(`${LOG_PREFIX} Generating video for NFT:`, request.body.nftId);

    const now = new Date();
    const jobId = uuidv4();

    // Find or create account
    const account = await prisma.account.upsert({
      where: { walletAddress },
      create: {
        walletAddress,
        createdAt: now,
        updatedAt: now,
      },
      update: {
        updatedAt: now,
      },
    });

    // Create video generation record
    const video = await prisma.video.create({
      data: {
        accountId: account.id,
        nftId: request.body.nftId,
        jobId,
        status: VideoStatus.PENDING,
        title: request.body.prompt || null,
        description: request.body.prompt || null,
        isPublic: false,
        metadata: {
          pipelineType: request.body.pipelineType || 'standard',
          options: request.body.options || null,
          prompt: request.body.prompt || null,
        },
        createdAt: now,
        updatedAt: now,
      },
      include: {
        account: {
          select: {
            walletAddress: true,
          },
        },
      },
    });

    console.log(`${LOG_PREFIX} Video generation created:`, {
      videoId: video.id,
      jobId,
    });

    // TODO: Queue video generation job in pipeline system

    // Convert to legacy format for backward compatibility
    const meta = extractMetadata(video.metadata);
    return {
      id: video.id,
      jobId: video.jobId,
      nftId: video.nftId,
      prompt: meta.prompt,
      createdBy: video.account.walletAddress,
      status: video.status.toLowerCase() as
        | 'queued'
        | 'processing'
        | 'completed'
        | 'failed',
      pipelineType: meta.pipelineType as any,
      options: meta.options,
      imagePath: undefined,
      thumbnailPath: undefined,
      videoPath: undefined,
      imageUrl: undefined,
      imageUrlExpiry: undefined,
      thumbnailUrl: video.thumbnailUrl || undefined,
      thumbnailUrlExpiry: undefined,
      videoUrl: video.videoUrl || undefined,
      videoUrlExpiry: undefined,
      isPublic: video.isPublic,
      publicVideoId: undefined,
      error: video.errorMessage || undefined,
      createdAt: toTimestamp(video.createdAt),
      updatedAt: toTimestamp(video.updatedAt),
    };
  } catch (error) {
    console.error(`${LOG_PREFIX} Error generating video:`, error);
    throw ApiError.from(error, 500, ERROR_MESSAGES.INTERNAL_ERROR);
  }
};

/**
 * Get video generation status
 */
export const getVideoStatus = async (
  request: GetVideoStatusRequest
): Promise<VideoStatusResponse> => {
  try {
    console.log(`${LOG_PREFIX} Getting video status:`, request.params.jobId);

    const video = await prisma.video.findUnique({
      where: { jobId: request.params.jobId },
      include: {
        account: {
          select: {
            walletAddress: true,
          },
        },
      },
    });

    if (!video) {
      throw new ApiError(404, 'Video generation not found');
    }

    return {
      jobId: video.jobId,
      status: video.status.toLowerCase() as
        | 'queued'
        | 'processing'
        | 'completed'
        | 'failed',
      progress: undefined, // TODO: Implement progress tracking
      videoUrl: video.videoUrl || undefined,
      thumbnailUrl: video.thumbnailUrl || undefined,
      imageUrl: undefined, // TODO: Implement image URL tracking
      error: video.errorMessage || undefined,
      estimatedTimeRemaining: undefined, // TODO: Implement ETA calculation
    };
  } catch (error) {
    console.error(`${LOG_PREFIX} Error getting video status:`, error);
    throw ApiError.from(error, 500, ERROR_MESSAGES.INTERNAL_ERROR);
  }
};

/**
 * Get user's video generations
 */
export const getUserVideos = async (
  request: GetUserVideosRequest,
  walletAddress: string
): Promise<VideoListResponse> => {
  try {
    console.log(`${LOG_PREFIX} Getting videos for user:`, walletAddress);

    const limit = request.query?.limit || 20;
    const offset = request.query?.offset || 0;

    // Build where clause
    const where: any = {
      account: {
        walletAddress,
      },
    };

    if (request.query?.status) {
      const statusMap: Record<string, VideoStatus> = {
        queued: VideoStatus.PENDING,
        processing: VideoStatus.PROCESSING,
        completed: VideoStatus.COMPLETED,
        failed: VideoStatus.FAILED,
      };
      where.status = statusMap[request.query.status] || VideoStatus.PENDING;
    }

    if (request.query?.nftId) {
      where.nftId = request.query.nftId;
    }

    // Get total count and paginated results in parallel
    const [total, videos] = await Promise.all([
      prisma.video.count({ where }),
      prisma.video.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit,
        include: {
          account: {
            select: {
              walletAddress: true,
            },
          },
        },
      }),
    ]);

    // Convert to legacy format
    const videoGenerations: VideoGeneration[] = videos.map((video) => {
      const meta = extractMetadata(video.metadata);
      return {
        id: video.id,
        jobId: video.jobId,
        nftId: video.nftId,
        prompt: meta.prompt,
        createdBy: video.account.walletAddress,
        status: video.status.toLowerCase() as
          | 'queued'
          | 'processing'
          | 'completed'
          | 'failed',
        pipelineType: meta.pipelineType as any,
        options: meta.options,
        imagePath: undefined,
        thumbnailPath: undefined,
        videoPath: undefined,
        imageUrl: undefined,
        imageUrlExpiry: undefined,
        thumbnailUrl: video.thumbnailUrl || undefined,
        thumbnailUrlExpiry: undefined,
        videoUrl: video.videoUrl || undefined,
        videoUrlExpiry: undefined,
        isPublic: video.isPublic,
        publicVideoId: undefined,
        error: video.errorMessage || undefined,
        createdAt: toTimestamp(video.createdAt),
        updatedAt: toTimestamp(video.updatedAt),
      };
    });

    return {
      videos: videoGenerations,
      total,
      hasMore: offset + limit < total,
    };
  } catch (error) {
    console.error(`${LOG_PREFIX} Error getting user videos:`, error);
    throw ApiError.from(error, 500, ERROR_MESSAGES.INTERNAL_ERROR);
  }
};

/**
 * Publish video to public gallery
 */
export const publishVideo = async (
  request: PublishVideoRequest,
  walletAddress: string
): Promise<VideoGeneration> => {
  try {
    console.log(`${LOG_PREFIX} Publishing video:`, request.params.videoId);

    // Get video with account info
    const video = await prisma.video.findUnique({
      where: { id: request.params.videoId },
      include: {
        account: {
          select: {
            walletAddress: true,
          },
        },
      },
    });

    if (!video) {
      throw new ApiError(404, 'Video not found');
    }

    // Verify ownership
    if (video.account.walletAddress !== walletAddress) {
      throw new ApiError(403, 'Not authorized to publish this video');
    }

    // Verify video is completed
    if (video.status !== VideoStatus.COMPLETED) {
      throw new ApiError(400, 'Video must be completed before publishing');
    }

    // TODO: Create public video entry and get publicVideoId
    const publicVideoId = uuidv4(); // Placeholder

    // Update video to public
    const updatedVideo = await prisma.video.update({
      where: { id: request.params.videoId },
      data: {
        isPublic: true,
        updatedAt: new Date(),
      },
      include: {
        account: {
          select: {
            walletAddress: true,
          },
        },
      },
    });

    // Convert to legacy format
    const meta = extractMetadata(updatedVideo.metadata);
    return {
      id: updatedVideo.id,
      jobId: updatedVideo.jobId,
      nftId: updatedVideo.nftId,
      prompt: meta.prompt,
      createdBy: updatedVideo.account.walletAddress,
      status: updatedVideo.status.toLowerCase() as
        | 'queued'
        | 'processing'
        | 'completed'
        | 'failed',
      pipelineType: meta.pipelineType as any,
      options: meta.options,
      imagePath: undefined,
      thumbnailPath: undefined,
      videoPath: undefined,
      imageUrl: undefined,
      imageUrlExpiry: undefined,
      thumbnailUrl: updatedVideo.thumbnailUrl || undefined,
      thumbnailUrlExpiry: undefined,
      videoUrl: updatedVideo.videoUrl || undefined,
      videoUrlExpiry: undefined,
      isPublic: updatedVideo.isPublic,
      publicVideoId,
      error: updatedVideo.errorMessage || undefined,
      createdAt: toTimestamp(updatedVideo.createdAt),
      updatedAt: toTimestamp(updatedVideo.updatedAt),
    };
  } catch (error) {
    console.error(`${LOG_PREFIX} Error publishing video:`, error);
    throw ApiError.from(error, 500, ERROR_MESSAGES.INTERNAL_ERROR);
  }
};

/**
 * Delete video generation
 */
export const deleteVideo = async (
  request: DeleteVideoRequest,
  walletAddress: string
): Promise<boolean> => {
  try {
    console.log(`${LOG_PREFIX} Deleting video:`, request.params.videoId);

    // Get video with account info
    const video = await prisma.video.findUnique({
      where: { id: request.params.videoId },
      include: {
        account: {
          select: {
            walletAddress: true,
          },
        },
      },
    });

    if (!video) {
      throw new ApiError(404, 'Video not found');
    }

    // Verify ownership
    if (video.account.walletAddress !== walletAddress) {
      throw new ApiError(403, 'Not authorized to delete this video');
    }

    // Delete video
    await prisma.video.delete({
      where: { id: request.params.videoId },
    });

    // TODO: Clean up storage files
    // TODO: Remove from public gallery if published

    return true;
  } catch (error) {
    console.error(`${LOG_PREFIX} Error deleting video:`, error);
    throw ApiError.from(error, 500, ERROR_MESSAGES.INTERNAL_ERROR);
  }
};

/**
 * Refresh video URLs (generate new signed URLs)
 */
export const refreshVideoUrls = async (
  request: RefreshVideoUrlsRequest,
  walletAddress: string
): Promise<VideoGeneration> => {
  try {
    console.log(`${LOG_PREFIX} Refreshing video URLs:`, request.params.videoId);

    // Get video with account info
    const video = await prisma.video.findUnique({
      where: { id: request.params.videoId },
      include: {
        account: {
          select: {
            walletAddress: true,
          },
        },
      },
    });

    if (!video) {
      throw new ApiError(404, 'Video not found');
    }

    // Verify ownership
    if (video.account.walletAddress !== walletAddress) {
      throw new ApiError(403, 'Not authorized to access this video');
    }

    // TODO: Generate new signed URLs from storage paths
    const now = new Date();
    const expiryTime = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours

    // Update video with new URL expiry (URLs would be regenerated)
    const updatedVideo = await prisma.video.update({
      where: { id: request.params.videoId },
      data: {
        updatedAt: now,
        // TODO: Update actual URLs when storage is implemented
      },
      include: {
        account: {
          select: {
            walletAddress: true,
          },
        },
      },
    });

    // Convert to legacy format
    const meta = extractMetadata(updatedVideo.metadata);
    return {
      id: updatedVideo.id,
      jobId: updatedVideo.jobId,
      nftId: updatedVideo.nftId,
      prompt: meta.prompt,
      createdBy: updatedVideo.account.walletAddress,
      status: updatedVideo.status.toLowerCase() as
        | 'queued'
        | 'processing'
        | 'completed'
        | 'failed',
      pipelineType: meta.pipelineType as any,
      options: meta.options,
      imagePath: undefined,
      thumbnailPath: undefined,
      videoPath: undefined,
      imageUrl: undefined,
      imageUrlExpiry: updatedVideo.videoUrl ? expiryTime : undefined,
      thumbnailUrl: updatedVideo.thumbnailUrl || undefined,
      thumbnailUrlExpiry: updatedVideo.thumbnailUrl ? expiryTime : undefined,
      videoUrl: updatedVideo.videoUrl || undefined,
      videoUrlExpiry: updatedVideo.videoUrl ? expiryTime : undefined,
      isPublic: updatedVideo.isPublic,
      publicVideoId: undefined,
      error: updatedVideo.errorMessage || undefined,
      createdAt: toTimestamp(updatedVideo.createdAt),
      updatedAt: toTimestamp(updatedVideo.updatedAt),
    };
  } catch (error) {
    console.error(`${LOG_PREFIX} Error refreshing video URLs:`, error);
    throw ApiError.from(error, 500, ERROR_MESSAGES.INTERNAL_ERROR);
  }
};

/**
 * Update video generation status (internal use by pipeline system)
 */
export const updateVideoStatus = async (
  jobId: string,
  status: 'queued' | 'processing' | 'completed' | 'failed',
  data: {
    imagePath?: string;
    thumbnailPath?: string;
    videoPath?: string;
    imageUrl?: string;
    thumbnailUrl?: string;
    videoUrl?: string;
    error?: string;
  } = {}
): Promise<void> => {
  try {
    console.log(`${LOG_PREFIX} Updating video status:`, { jobId, status });

    // Map status to Prisma enum
    const statusMap: Record<string, VideoStatus> = {
      queued: VideoStatus.PENDING,
      processing: VideoStatus.PROCESSING,
      completed: VideoStatus.COMPLETED,
      failed: VideoStatus.FAILED,
    };

    const updateData: any = {
      status: statusMap[status] || VideoStatus.PENDING,
      updatedAt: new Date(),
    };

    // Add URLs if provided
    if (data.thumbnailUrl) updateData.thumbnailUrl = data.thumbnailUrl;
    if (data.videoUrl) updateData.videoUrl = data.videoUrl;
    if (data.error) updateData.errorMessage = data.error;

    // TODO: Handle imagePath, thumbnailPath, videoPath when storage is implemented

    // Update video
    await prisma.video.update({
      where: { jobId },
      data: updateData,
    });

    console.log(`${LOG_PREFIX} Video status updated:`, { jobId, status });
  } catch (error) {
    console.error(`${LOG_PREFIX} Error updating video status:`, error);
    throw ApiError.from(error, 500, ERROR_MESSAGES.INTERNAL_ERROR);
  }
};
