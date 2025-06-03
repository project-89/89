import { Request, Response } from 'express';
import { ERROR_MESSAGES } from '../constants';
import {
  DeleteVideoRequest,
  GenerateVideoRequest,
  GetUserVideosRequest,
  GetVideoStatusRequest,
  PublishVideoRequest,
  RefreshVideoUrlsRequest,
} from '../schemas';
import {
  deleteVideo,
  generateVideo,
  getUserVideos,
  getVideoStatus,
  publishVideo,
  refreshVideoUrls,
} from '../services/video.service';
import { ApiError, sendError, sendSuccess } from '../utils';

/**
 * Generate a new video for an NFT
 */
export async function handleGenerateVideo(req: Request, res: Response) {
  try {
    // TODO: Get user from auth middleware
    const userId = 'temp-user-id'; // Placeholder until auth is integrated
    const video = await generateVideo(
      req as unknown as GenerateVideoRequest,
      userId
    );
    sendSuccess(res, video, 'Video generation job created successfully', 201);
  } catch (error) {
    const apiError = ApiError.from(error, 500, ERROR_MESSAGES.INTERNAL_ERROR);
    sendError(res, apiError, apiError.statusCode);
  }
}

/**
 * Get video generation status
 */
export async function handleGetVideoStatus(req: Request, res: Response) {
  try {
    const status = await getVideoStatus(
      req as unknown as GetVideoStatusRequest
    );
    sendSuccess(res, status, 'Video status retrieved successfully');
  } catch (error) {
    const apiError = ApiError.from(error, 500, ERROR_MESSAGES.INTERNAL_ERROR);
    sendError(res, apiError, apiError.statusCode);
  }
}

/**
 * Get user's video generations
 */
export async function handleGetUserVideos(req: Request, res: Response) {
  try {
    // TODO: Get user from auth middleware
    const userId = 'temp-user-id'; // Placeholder until auth is integrated
    const videos = await getUserVideos(
      req as unknown as GetUserVideosRequest,
      userId
    );
    sendSuccess(res, videos, 'User videos retrieved successfully');
  } catch (error) {
    const apiError = ApiError.from(error, 500, ERROR_MESSAGES.INTERNAL_ERROR);
    sendError(res, apiError, apiError.statusCode);
  }
}

/**
 * Publish video to public gallery
 */
export async function handlePublishVideo(req: Request, res: Response) {
  try {
    // TODO: Get user from auth middleware
    const userId = 'temp-user-id'; // Placeholder until auth is integrated
    const video = await publishVideo(
      req as unknown as PublishVideoRequest,
      userId
    );
    sendSuccess(res, video, 'Video published successfully');
  } catch (error) {
    const apiError = ApiError.from(error, 500, ERROR_MESSAGES.INTERNAL_ERROR);
    sendError(res, apiError, apiError.statusCode);
  }
}

/**
 * Delete video generation
 */
export async function handleDeleteVideo(req: Request, res: Response) {
  try {
    // TODO: Get user from auth middleware
    const userId = 'temp-user-id'; // Placeholder until auth is integrated
    const deleted = await deleteVideo(
      req as unknown as DeleteVideoRequest,
      userId
    );
    sendSuccess(res, { deleted }, 'Video deleted successfully');
  } catch (error) {
    const apiError = ApiError.from(error, 500, ERROR_MESSAGES.INTERNAL_ERROR);
    sendError(res, apiError, apiError.statusCode);
  }
}

/**
 * Refresh video URLs (generate new signed URLs)
 */
export async function handleRefreshVideoUrls(req: Request, res: Response) {
  try {
    // TODO: Get user from auth middleware
    const userId = 'temp-user-id'; // Placeholder until auth is integrated
    const video = await refreshVideoUrls(
      req as unknown as RefreshVideoUrlsRequest,
      userId
    );
    sendSuccess(res, video, 'Video URLs refreshed successfully');
  } catch (error) {
    const apiError = ApiError.from(error, 500, ERROR_MESSAGES.INTERNAL_ERROR);
    sendError(res, apiError, apiError.statusCode);
  }
}
