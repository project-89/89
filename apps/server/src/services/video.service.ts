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
  VideoGenerationDocument,
  VideoListResponse,
  VideoStatusResponse,
  toVideoGeneration,
} from '../schemas';
import { ApiError, idFilter } from '../utils';
import { getDb } from '../utils/mongodb';

const LOG_PREFIX = '[Video Service]';

// Add Proxim8 collections to constants
const PROXIM8_COLLECTIONS = {
  VIDEO_GENERATIONS: 'proxim8.video-generations',
} as const;

/**
 * Generate a new video
 */
export const generateVideo = async (
  request: GenerateVideoRequest,
  createdBy: string
): Promise<VideoGeneration> => {
  try {
    console.log(`${LOG_PREFIX} Generating video for NFT:`, request.body.nftId);
    const db = await getDb();

    const now = new Date();
    const jobId = uuidv4();

    // Create video generation document
    const videoDoc: Omit<VideoGenerationDocument, 'id'> = {
      jobId,
      nftId: request.body.nftId,
      prompt: request.body.prompt,
      createdBy,
      status: 'queued',
      pipelineType: request.body.pipelineType || 'standard',
      options: request.body.options,
      imagePath: undefined,
      thumbnailPath: undefined,
      videoPath: undefined,
      imageUrl: undefined,
      imageUrlExpiry: undefined,
      thumbnailUrl: undefined,
      thumbnailUrlExpiry: undefined,
      videoUrl: undefined,
      videoUrlExpiry: undefined,
      isPublic: false,
      publicVideoId: undefined,
      error: undefined,
      createdAt: now,
      updatedAt: now,
    };

    // Insert into database
    const result = await db
      .collection(PROXIM8_COLLECTIONS.VIDEO_GENERATIONS)
      .insertOne(videoDoc);
    const videoId = result.insertedId.toString();

    console.log(`${LOG_PREFIX} Video generation created:`, { videoId, jobId });

    // TODO: Queue video generation job in pipeline system

    return toVideoGeneration({ ...videoDoc, _id: result.insertedId }, videoId);
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
    const db = await getDb();

    const videoDoc = await db
      .collection(PROXIM8_COLLECTIONS.VIDEO_GENERATIONS)
      .findOne({ jobId: request.params.jobId });

    if (!videoDoc) {
      throw new ApiError(404, 'Video generation not found');
    }

    const video = toVideoGeneration(videoDoc, videoDoc._id.toString());

    return {
      jobId: video.jobId,
      status: video.status,
      progress: undefined, // TODO: Implement progress tracking
      videoUrl: video.videoUrl,
      thumbnailUrl: video.thumbnailUrl,
      imageUrl: video.imageUrl,
      error: video.error,
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
  userId: string
): Promise<VideoListResponse> => {
  try {
    console.log(`${LOG_PREFIX} Getting videos for user:`, userId);
    const db = await getDb();

    const limit = request.query?.limit || 20;
    const offset = request.query?.offset || 0;

    // Build query
    const query: any = { createdBy: userId };
    if (request.query?.status) {
      query.status = request.query.status;
    }
    if (request.query?.nftId) {
      query.nftId = request.query.nftId;
    }

    // Get total count
    const total = await db
      .collection(PROXIM8_COLLECTIONS.VIDEO_GENERATIONS)
      .countDocuments(query);

    // Get paginated results
    const videoDocs = await db
      .collection(PROXIM8_COLLECTIONS.VIDEO_GENERATIONS)
      .find(query)
      .sort({ createdAt: -1 })
      .skip(offset)
      .limit(limit)
      .toArray();

    const videos = videoDocs.map((doc) =>
      toVideoGeneration(doc, doc._id.toString())
    );

    return {
      videos,
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
  userId: string
): Promise<VideoGeneration> => {
  try {
    console.log(`${LOG_PREFIX} Publishing video:`, request.params.videoId);
    const db = await getDb();

    // Get video
    const filter = idFilter(request.params.videoId);
    if (!filter) {
      throw new ApiError(404, 'Video not found');
    }

    const videoDoc = await db
      .collection(PROXIM8_COLLECTIONS.VIDEO_GENERATIONS)
      .findOne(filter);
    if (!videoDoc) {
      throw new ApiError(404, 'Video not found');
    }

    // Verify ownership
    if (videoDoc.createdBy !== userId) {
      throw new ApiError(403, 'Not authorized to publish this video');
    }

    // Verify video is completed
    if (videoDoc.status !== 'completed') {
      throw new ApiError(400, 'Video must be completed before publishing');
    }

    // TODO: Create public video entry and get publicVideoId
    const publicVideoId = uuidv4(); // Placeholder

    // Update video
    const now = new Date();
    await db
      .collection(PROXIM8_COLLECTIONS.VIDEO_GENERATIONS)
      .updateOne(filter, {
        $set: {
          isPublic: true,
          publicVideoId,
          updatedAt: now,
        },
      });

    // Get updated video
    const updatedDoc = await db
      .collection(PROXIM8_COLLECTIONS.VIDEO_GENERATIONS)
      .findOne(filter);
    return toVideoGeneration(updatedDoc, request.params.videoId);
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
  userId: string
): Promise<boolean> => {
  try {
    console.log(`${LOG_PREFIX} Deleting video:`, request.params.videoId);
    const db = await getDb();

    // Get video first to verify ownership
    const filter = idFilter(request.params.videoId);
    if (!filter) {
      throw new ApiError(404, 'Video not found');
    }

    const videoDoc = await db
      .collection(PROXIM8_COLLECTIONS.VIDEO_GENERATIONS)
      .findOne(filter);
    if (!videoDoc) {
      throw new ApiError(404, 'Video not found');
    }

    // Verify ownership
    if (videoDoc.createdBy !== userId) {
      throw new ApiError(403, 'Not authorized to delete this video');
    }

    // Delete video document
    const result = await db
      .collection(PROXIM8_COLLECTIONS.VIDEO_GENERATIONS)
      .deleteOne(filter);

    // TODO: Clean up storage files
    // TODO: Remove from public gallery if published

    return result.deletedCount > 0;
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
  userId: string
): Promise<VideoGeneration> => {
  try {
    console.log(`${LOG_PREFIX} Refreshing video URLs:`, request.params.videoId);
    const db = await getDb();

    // Get video
    const filter = idFilter(request.params.videoId);
    if (!filter) {
      throw new ApiError(404, 'Video not found');
    }

    const videoDoc = await db
      .collection(PROXIM8_COLLECTIONS.VIDEO_GENERATIONS)
      .findOne(filter);
    if (!videoDoc) {
      throw new ApiError(404, 'Video not found');
    }

    // Verify ownership
    if (videoDoc.createdBy !== userId) {
      throw new ApiError(403, 'Not authorized to access this video');
    }

    // TODO: Generate new signed URLs from storage paths
    const now = new Date();
    const expiryTime = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours

    const updateData = {
      // TODO: Generate actual signed URLs
      imageUrlExpiry: expiryTime,
      thumbnailUrlExpiry: expiryTime,
      videoUrlExpiry: expiryTime,
      updatedAt: now,
    };

    // Update video
    await db
      .collection(PROXIM8_COLLECTIONS.VIDEO_GENERATIONS)
      .updateOne(filter, {
        $set: updateData,
      });

    // Get updated video
    const updatedDoc = await db
      .collection(PROXIM8_COLLECTIONS.VIDEO_GENERATIONS)
      .findOne(filter);
    return toVideoGeneration(updatedDoc, request.params.videoId);
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
    const db = await getDb();

    const now = new Date();
    const updateData: any = {
      status,
      updatedAt: now,
    };

    // Add data fields if provided
    Object.keys(data).forEach((key) => {
      if (data[key as keyof typeof data] !== undefined) {
        updateData[key] = data[key as keyof typeof data];
      }
    });

    // Update video
    await db
      .collection(PROXIM8_COLLECTIONS.VIDEO_GENERATIONS)
      .updateOne({ jobId }, { $set: updateData });

    console.log(`${LOG_PREFIX} Video status updated:`, { jobId, status });
  } catch (error) {
    console.error(`${LOG_PREFIX} Error updating video status:`, error);
    throw ApiError.from(error, 500, ERROR_MESSAGES.INTERNAL_ERROR);
  }
};

// Export collection constants for use in other services
export { PROXIM8_COLLECTIONS };
