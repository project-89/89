import { ERROR_MESSAGES } from '../constants';
import {
  CreatePublicVideoRequest,
  DeletePublicVideoRequest,
  GetFeaturedVideosRequest,
  GetPublicVideoRequest,
  GetPublicVideosRequest,
  GetUserPublicVideosRequest,
  IncrementViewsRequest,
  LikePublicVideoRequest,
  ModeratePublicVideoRequest,
  PublicVideo,
  PublicVideoDocument,
  PublicVideoListResponse,
  SearchPublicVideosRequest,
  toPublicVideo,
  UpdatePublicVideoRequest,
} from '../schemas';
import { ApiError, idFilter } from '../utils';
import { getDb } from '../utils/mongodb';

const LOG_PREFIX = '[PublicVideo Service]';

// Add Proxim8 collections to constants
const PROXIM8_COLLECTIONS = {
  PUBLIC_VIDEOS: 'proxim8.public-videos',
  VIDEO_VIEWS: 'proxim8.video-views',
  VIDEO_LIKES: 'proxim8.video-likes',
} as const;

/**
 * Create a new public video entry
 */
export const createPublicVideo = async (
  request: CreatePublicVideoRequest,
  userId: string,
  walletAddress: string
): Promise<PublicVideo> => {
  try {
    console.log(`${LOG_PREFIX} Creating public video:`, request.body.title);
    const db = await getDb();

    const now = new Date();

    // Create public video document
    const videoDoc: Omit<PublicVideoDocument, 'id'> = {
      originalVideoId: request.body.originalVideoId,
      ownerWallet: walletAddress.toLowerCase(),
      title: request.body.title,
      description: request.body.description || '',
      tags: request.body.tags || [],
      views: 0,
      likes: 0,
      publishedAt: now,
      featuredRank: undefined,
      isActive: true,
      moderationStatus: 'pending',
      moderationNotes: undefined,
      createdAt: now,
      updatedAt: now,
    };

    // Insert into database
    const result = await db
      .collection(PROXIM8_COLLECTIONS.PUBLIC_VIDEOS)
      .insertOne(videoDoc);
    const videoId = result.insertedId.toString();

    console.log(`${LOG_PREFIX} Public video created:`, videoId);

    return toPublicVideo({ ...videoDoc, _id: result.insertedId }, videoId);
  } catch (error) {
    console.error(`${LOG_PREFIX} Error creating public video:`, error);
    throw ApiError.from(error, 500, ERROR_MESSAGES.INTERNAL_ERROR);
  }
};

/**
 * Get public video by ID
 */
export const getPublicVideo = async (
  request: GetPublicVideoRequest
): Promise<PublicVideo | null> => {
  try {
    console.log(`${LOG_PREFIX} Getting public video:`, request.params.videoId);
    const db = await getDb();

    const filter = idFilter(request.params.videoId);
    if (!filter) {
      return null;
    }

    const videoDoc = await db
      .collection(PROXIM8_COLLECTIONS.PUBLIC_VIDEOS)
      .findOne(filter);
    if (!videoDoc) {
      return null;
    }

    return toPublicVideo(videoDoc, request.params.videoId);
  } catch (error) {
    console.error(`${LOG_PREFIX} Error getting public video:`, error);
    throw ApiError.from(error, 500, ERROR_MESSAGES.INTERNAL_ERROR);
  }
};

/**
 * Get public videos with pagination and filtering
 */
export const getPublicVideos = async (
  request: GetPublicVideosRequest
): Promise<PublicVideoListResponse> => {
  try {
    console.log(`${LOG_PREFIX} Getting public videos`);
    const db = await getDb();

    const limit = request.query?.limit || 20;
    const offset = request.query?.offset || 0;

    // Build query
    const query: any = { moderationStatus: 'approved' }; // Only show approved videos

    if (request.query?.ownerWallet) {
      query.ownerWallet = request.query.ownerWallet.toLowerCase();
    }
    if (request.query?.featured !== undefined) {
      if (request.query.featured) {
        query.featuredRank = { $exists: true, $ne: null };
      } else {
        query.featuredRank = { $exists: false };
      }
    }
    if (request.query?.tag) {
      query.tags = request.query.tag;
    }
    if (request.query?.moderationStatus) {
      query.moderationStatus = request.query.moderationStatus;
    }

    // Get total count
    const total = await db
      .collection(PROXIM8_COLLECTIONS.PUBLIC_VIDEOS)
      .countDocuments(query);

    // Determine sort order
    let sort: any = {
      publishedAt: request.query?.sortOrder === 'asc' ? 1 : -1,
    };
    if (request.query?.sortBy === 'views') {
      sort = {
        views: request.query?.sortOrder === 'asc' ? 1 : -1,
        publishedAt: -1,
      };
    } else if (request.query?.sortBy === 'likes') {
      sort = {
        likes: request.query?.sortOrder === 'asc' ? 1 : -1,
        publishedAt: -1,
      };
    } else if (request.query?.sortBy === 'featuredRank') {
      sort = {
        featuredRank: request.query?.sortOrder === 'asc' ? 1 : -1,
        publishedAt: -1,
      };
    }

    // Get paginated results
    const videoDocs = await db
      .collection(PROXIM8_COLLECTIONS.PUBLIC_VIDEOS)
      .find(query)
      .sort(sort)
      .skip(offset)
      .limit(limit)
      .toArray();

    const videos = videoDocs.map((doc) =>
      toPublicVideo(doc, doc._id.toString())
    );

    return {
      videos,
      total,
      hasMore: offset + limit < total,
    };
  } catch (error) {
    console.error(`${LOG_PREFIX} Error getting public videos:`, error);
    throw ApiError.from(error, 500, ERROR_MESSAGES.INTERNAL_ERROR);
  }
};

/**
 * Update public video
 */
export const updatePublicVideo = async (
  request: UpdatePublicVideoRequest,
  userId: string,
  walletAddress: string
): Promise<PublicVideo> => {
  try {
    console.log(`${LOG_PREFIX} Updating public video:`, request.params.videoId);
    const db = await getDb();

    // Get existing video
    const filter = idFilter(request.params.videoId);
    if (!filter) {
      throw new ApiError(404, 'Public video not found');
    }

    const existingDoc = await db
      .collection(PROXIM8_COLLECTIONS.PUBLIC_VIDEOS)
      .findOne(filter);
    if (!existingDoc) {
      throw new ApiError(404, 'Public video not found');
    }

    // Verify ownership
    if (existingDoc.ownerWallet !== walletAddress.toLowerCase()) {
      throw new ApiError(403, 'Not authorized to update this video');
    }

    // Build update object
    const updateData: any = {
      updatedAt: new Date(),
    };

    if (request.body.title !== undefined) {
      updateData.title = request.body.title;
    }
    if (request.body.description !== undefined) {
      updateData.description = request.body.description;
    }
    if (request.body.tags !== undefined) {
      updateData.tags = request.body.tags;
    }

    // Update document
    await db
      .collection(PROXIM8_COLLECTIONS.PUBLIC_VIDEOS)
      .updateOne(filter, { $set: updateData });

    // Return updated document
    const updatedDoc = await db
      .collection(PROXIM8_COLLECTIONS.PUBLIC_VIDEOS)
      .findOne(filter);

    console.log(`${LOG_PREFIX} Public video updated:`, request.params.videoId);

    return toPublicVideo(updatedDoc, request.params.videoId);
  } catch (error) {
    console.error(`${LOG_PREFIX} Error updating public video:`, error);
    throw ApiError.from(error, 500, ERROR_MESSAGES.INTERNAL_ERROR);
  }
};

/**
 * Delete public video
 */
export const deletePublicVideo = async (
  request: DeletePublicVideoRequest,
  userId: string,
  walletAddress: string
): Promise<boolean> => {
  try {
    console.log(`${LOG_PREFIX} Deleting public video:`, request.params.videoId);
    const db = await getDb();

    // Get existing video
    const filter = idFilter(request.params.videoId);
    if (!filter) {
      return false;
    }

    const existingDoc = await db
      .collection(PROXIM8_COLLECTIONS.PUBLIC_VIDEOS)
      .findOne(filter);
    if (!existingDoc) {
      return false;
    }

    // Verify ownership
    if (existingDoc.ownerWallet !== walletAddress.toLowerCase()) {
      throw new ApiError(403, 'Not authorized to delete this video');
    }

    // Delete the video
    const result = await db
      .collection(PROXIM8_COLLECTIONS.PUBLIC_VIDEOS)
      .deleteOne(filter);

    if (result.deletedCount > 0) {
      // Also clean up related data
      await Promise.all([
        db.collection(PROXIM8_COLLECTIONS.VIDEO_VIEWS).deleteMany({
          videoId: request.params.videoId,
        }),
        db.collection(PROXIM8_COLLECTIONS.VIDEO_LIKES).deleteMany({
          videoId: request.params.videoId,
        }),
      ]);

      console.log(
        `${LOG_PREFIX} Public video deleted:`,
        request.params.videoId
      );
      return true;
    }

    return false;
  } catch (error) {
    console.error(`${LOG_PREFIX} Error deleting public video:`, error);
    throw ApiError.from(error, 500, ERROR_MESSAGES.INTERNAL_ERROR);
  }
};

/**
 * Like/unlike public video
 */
export const likePublicVideo = async (
  request: LikePublicVideoRequest,
  userId?: string,
  walletAddress?: string
): Promise<{ liked: boolean; totalLikes: number }> => {
  try {
    console.log(
      `${LOG_PREFIX} Toggling like for video:`,
      request.params.videoId
    );
    const db = await getDb();

    const videoFilter = idFilter(request.params.videoId);
    if (!videoFilter) {
      throw new ApiError(404, 'Public video not found');
    }

    // Check if video exists
    const videoDoc = await db
      .collection(PROXIM8_COLLECTIONS.PUBLIC_VIDEOS)
      .findOne(videoFilter);
    if (!videoDoc) {
      throw new ApiError(404, 'Public video not found');
    }

    let liked = false;
    let totalLikes = videoDoc.likes || 0;

    if (walletAddress) {
      // Check if user already liked
      const existingLike = await db
        .collection(PROXIM8_COLLECTIONS.VIDEO_LIKES)
        .findOne({
          videoId: request.params.videoId,
          userWallet: walletAddress.toLowerCase(),
        });

      if (request.body.like) {
        // User wants to like
        if (!existingLike) {
          await db.collection(PROXIM8_COLLECTIONS.VIDEO_LIKES).insertOne({
            videoId: request.params.videoId,
            userWallet: walletAddress.toLowerCase(),
            userId: userId,
            createdAt: new Date(),
          });
          totalLikes += 1;
          liked = true;
        } else {
          liked = true; // Already liked
        }
      } else {
        // User wants to unlike
        if (existingLike) {
          await db.collection(PROXIM8_COLLECTIONS.VIDEO_LIKES).deleteOne({
            videoId: request.params.videoId,
            userWallet: walletAddress.toLowerCase(),
          });
          totalLikes = Math.max(0, totalLikes - 1);
          liked = false;
        }
      }

      // Update video likes count
      await db
        .collection(PROXIM8_COLLECTIONS.PUBLIC_VIDEOS)
        .updateOne(videoFilter, {
          $set: { likes: totalLikes, updatedAt: new Date() },
        });
    }

    console.log(
      `${LOG_PREFIX} Like toggled for video:`,
      request.params.videoId
    );

    return { liked, totalLikes };
  } catch (error) {
    console.error(`${LOG_PREFIX} Error toggling like:`, error);
    throw ApiError.from(error, 500, ERROR_MESSAGES.INTERNAL_ERROR);
  }
};

/**
 * Record video view
 */
export const incrementVideoViews = async (
  request: IncrementViewsRequest,
  userId?: string
): Promise<{ viewRecorded: boolean; totalViews: number }> => {
  try {
    console.log(
      `${LOG_PREFIX} Recording view for video:`,
      request.params.videoId
    );
    const db = await getDb();

    const videoFilter = idFilter(request.params.videoId);
    if (!videoFilter) {
      throw new ApiError(404, 'Public video not found');
    }

    // Check if video exists
    const videoDoc = await db
      .collection(PROXIM8_COLLECTIONS.PUBLIC_VIDEOS)
      .findOne(videoFilter);
    if (!videoDoc) {
      throw new ApiError(404, 'Public video not found');
    }

    let viewRecorded = false;
    let totalViews = videoDoc.views || 0;

    // Check if this is a unique view (limit one view per wallet per day)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let viewFilter: any = {
      videoId: request.params.videoId,
      viewedAt: { $gte: today },
    };

    if (request.body.viewerWallet) {
      viewFilter.viewerWallet = request.body.viewerWallet.toLowerCase();
    } else if (userId) {
      viewFilter.userId = userId;
    } else {
      // For anonymous users, we'll record the view without deduplication
      viewFilter = null;
    }

    const existingView = viewFilter
      ? await db.collection(PROXIM8_COLLECTIONS.VIDEO_VIEWS).findOne(viewFilter)
      : null;

    if (!existingView) {
      // Record new view
      await db.collection(PROXIM8_COLLECTIONS.VIDEO_VIEWS).insertOne({
        videoId: request.params.videoId,
        viewerWallet: request.body.viewerWallet?.toLowerCase(),
        userId: userId,
        viewedAt: new Date(),
      });

      totalViews += 1;
      viewRecorded = true;

      // Update video views count
      await db
        .collection(PROXIM8_COLLECTIONS.PUBLIC_VIDEOS)
        .updateOne(videoFilter, {
          $set: { views: totalViews, updatedAt: new Date() },
        });
    }

    console.log(
      `${LOG_PREFIX} View recorded for video:`,
      request.params.videoId
    );

    return { viewRecorded, totalViews };
  } catch (error) {
    console.error(`${LOG_PREFIX} Error recording view:`, error);
    throw ApiError.from(error, 500, ERROR_MESSAGES.INTERNAL_ERROR);
  }
};

/**
 * Moderate public video (admin only)
 */
export const moderatePublicVideo = async (
  request: ModeratePublicVideoRequest,
  moderatorId: string
): Promise<PublicVideo> => {
  try {
    console.log(`${LOG_PREFIX} Moderating video:`, request.params.videoId);
    const db = await getDb();

    const filter = idFilter(request.params.videoId);
    if (!filter) {
      throw new ApiError(404, 'Public video not found');
    }

    const updateData: any = {
      moderationStatus: request.body.status,
      moderationNotes: request.body.notes,
      updatedAt: new Date(),
    };

    if (request.body.featuredRank !== undefined) {
      updateData.featuredRank = request.body.featuredRank;
    }

    // Update video
    const result = await db
      .collection(PROXIM8_COLLECTIONS.PUBLIC_VIDEOS)
      .updateOne(filter, { $set: updateData });

    if (result.matchedCount === 0) {
      throw new ApiError(404, 'Public video not found');
    }

    // Get updated document
    const updatedDoc = await db
      .collection(PROXIM8_COLLECTIONS.PUBLIC_VIDEOS)
      .findOne(filter);

    console.log(`${LOG_PREFIX} Video moderated:`, request.params.videoId);

    return toPublicVideo(updatedDoc, request.params.videoId);
  } catch (error) {
    console.error(`${LOG_PREFIX} Error moderating video:`, error);
    throw ApiError.from(error, 500, ERROR_MESSAGES.INTERNAL_ERROR);
  }
};

/**
 * Get featured public videos
 */
export const getFeaturedPublicVideos = async (
  request: GetFeaturedVideosRequest
): Promise<PublicVideoListResponse> => {
  try {
    console.log(`${LOG_PREFIX} Getting featured public videos`);
    const db = await getDb();

    const limit = request.query?.limit || 20;
    const offset = request.query?.offset || 0;

    // Build query for featured videos
    const query: any = {
      moderationStatus: 'approved',
      featuredRank: { $exists: true, $ne: null },
    };

    if (request.query?.tag) {
      query.tags = request.query.tag;
    }

    // Get total count
    const total = await db
      .collection(PROXIM8_COLLECTIONS.PUBLIC_VIDEOS)
      .countDocuments(query);

    // Get paginated results sorted by featured rank
    const videoDocs = await db
      .collection(PROXIM8_COLLECTIONS.PUBLIC_VIDEOS)
      .find(query)
      .sort({ featuredRank: 1, publishedAt: -1 })
      .skip(offset)
      .limit(limit)
      .toArray();

    const videos = videoDocs.map((doc) =>
      toPublicVideo(doc, doc._id.toString())
    );

    return {
      videos,
      total,
      hasMore: offset + limit < total,
    };
  } catch (error) {
    console.error(`${LOG_PREFIX} Error getting featured videos:`, error);
    throw ApiError.from(error, 500, ERROR_MESSAGES.INTERNAL_ERROR);
  }
};

/**
 * Get user's public videos
 */
export const getUserPublicVideos = async (
  request: GetUserPublicVideosRequest
): Promise<PublicVideoListResponse> => {
  try {
    console.log(
      `${LOG_PREFIX} Getting videos for user:`,
      request.params.walletAddress
    );
    const db = await getDb();

    const limit = request.query?.limit || 20;
    const offset = request.query?.offset || 0;

    // Build query
    const query: any = {
      ownerWallet: request.params.walletAddress.toLowerCase(),
      moderationStatus: 'approved',
    };

    if (request.query?.tag) {
      query.tags = request.query.tag;
    }

    // Get total count
    const total = await db
      .collection(PROXIM8_COLLECTIONS.PUBLIC_VIDEOS)
      .countDocuments(query);

    // Determine sort order
    let sort: any = {
      publishedAt: request.query?.sortOrder === 'asc' ? 1 : -1,
    };
    if (request.query?.sortBy === 'views') {
      sort = {
        views: request.query?.sortOrder === 'asc' ? 1 : -1,
        publishedAt: -1,
      };
    } else if (request.query?.sortBy === 'likes') {
      sort = {
        likes: request.query?.sortOrder === 'asc' ? 1 : -1,
        publishedAt: -1,
      };
    }

    // Get paginated results
    const videoDocs = await db
      .collection(PROXIM8_COLLECTIONS.PUBLIC_VIDEOS)
      .find(query)
      .sort(sort)
      .skip(offset)
      .limit(limit)
      .toArray();

    const videos = videoDocs.map((doc) =>
      toPublicVideo(doc, doc._id.toString())
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
 * Search public videos
 */
export const searchPublicVideos = async (
  request: SearchPublicVideosRequest
): Promise<PublicVideoListResponse> => {
  try {
    console.log(`${LOG_PREFIX} Searching videos:`, request.query?.q);
    const db = await getDb();

    const limit = request.query?.limit || 20;
    const offset = request.query?.offset || 0;
    const searchQuery = request.query?.q || '';

    // Build search query
    const query: any = {
      moderationStatus: 'approved',
      $or: [
        { title: { $regex: searchQuery, $options: 'i' } },
        { description: { $regex: searchQuery, $options: 'i' } },
        { tags: { $regex: searchQuery, $options: 'i' } },
      ],
    };

    if (request.query?.tag) {
      query.tags = request.query.tag;
    }
    if (request.query?.ownerWallet) {
      query.ownerWallet = request.query.ownerWallet.toLowerCase();
    }

    // Get total count
    const total = await db
      .collection(PROXIM8_COLLECTIONS.PUBLIC_VIDEOS)
      .countDocuments(query);

    // Get paginated results
    const videoDocs = await db
      .collection(PROXIM8_COLLECTIONS.PUBLIC_VIDEOS)
      .find(query)
      .sort({ publishedAt: -1 })
      .skip(offset)
      .limit(limit)
      .toArray();

    const videos = videoDocs.map((doc) =>
      toPublicVideo(doc, doc._id.toString())
    );

    return {
      videos,
      total,
      hasMore: offset + limit < total,
    };
  } catch (error) {
    console.error(`${LOG_PREFIX} Error searching videos:`, error);
    throw ApiError.from(error, 500, ERROR_MESSAGES.INTERNAL_ERROR);
  }
};

// Export collection constants
export { PROXIM8_COLLECTIONS };
