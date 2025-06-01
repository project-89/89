/**
 * Shared Video Service Implementation
 *
 * This file contains shared implementations for video-related API calls
 * that can be used by both client and server environments.
 */

import { Video } from "@/types";
import { VideoGenerationResponse } from "@/types/video";
import { ApiError } from "@/types/error";

// Constants
export const VIDEO_API_PATH = "/api/videos";

// Helper function to build query params
export const buildQueryParams = (
  params: Record<string, string | number | boolean>
) => {
  const urlParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      urlParams.append(key, String(value));
    }
  });

  return urlParams.toString();
};

// Type definition for API client that works with both client and server implementations
export interface ApiClient {
  get<T>(url: string, config?: any): Promise<T>;
  post<T>(url: string, data?: any, config?: any): Promise<T>;
  put<T>(url: string, data?: any, config?: any): Promise<T>;
  del<T>(url: string, config?: any): Promise<T>;
}

/**
 * Get public videos - implementation
 */
export async function getPublicVideosImpl(
  apiClient: ApiClient,
  type: string = "recent",
  page: number = 1,
  limit: number = 10
): Promise<Video[]> {
  try {
    const params = buildQueryParams({ type, page, limit });
    return await apiClient.get<Video[]>(`${VIDEO_API_PATH}/public?${params}`);
  } catch (error) {
    // Handle 404 as empty array (consistent behavior between client/server)
    if (error instanceof ApiError && error.status === 404) {
      console.log("No public videos found (404) - returning empty array");
      return [];
    }

    console.error("Error fetching public videos:", error);
    // Return empty array instead of throwing to prevent rendering errors
    return [];
  }
}

/**
 * Get video by ID - implementation
 */
export async function getVideoByIdImpl(
  apiClient: ApiClient,
  videoId: string
): Promise<Video> {
  try {
    return await apiClient.get<Video>(`${VIDEO_API_PATH}/${videoId}`);
  } catch (error) {
    console.error(`Error fetching video with ID ${videoId}:`, error);
    throw error;
  }
}

/**
 * Get user videos - implementation
 * Note: When on server, this typically returns empty array unless auth token is properly passed
 */
export async function getUserVideosImpl(
  apiClient: ApiClient,
  isServerSide: boolean = false,
  page: number = 1,
  limit: number = 10
): Promise<{ videos: Video[]; total: number }> {
  try {
    // If server-side and we know we can't have auth, return empty immediately
    if (isServerSide) {
      return { videos: [], total: 0 };
    }

    const params = buildQueryParams({ page, limit });
    return await apiClient.get<{ videos: Video[]; total: number }>(
      `${VIDEO_API_PATH}/user?${params}`
    );
  } catch (error) {
    console.error("Error fetching user videos:", error);
    return { videos: [], total: 0 };
  }
}

/**
 * Refresh video URL - implementation
 */
export async function refreshVideoUrlImpl(
  apiClient: ApiClient,
  videoId: string
): Promise<{ url: string; expiryTime: Date }> {
  try {
    return await apiClient.get<{ url: string; expiryTime: Date }>(
      `${VIDEO_API_PATH}/${videoId}/refresh-url`
    );
  } catch (error) {
    console.error(`Error refreshing video URL for ${videoId}:`, error);
    throw error;
  }
}

/**
 * Generate video - implementation
 */
export async function generateVideoImpl(
  apiClient: ApiClient,
  nftId: string,
  pipelineConfigId: string,
  options: Record<string, unknown>
): Promise<VideoGenerationResponse> {
  try {
    return await apiClient.post<VideoGenerationResponse>(
      `${VIDEO_API_PATH}/generate`,
      { nftId, pipelineConfigId, options }
    );
  } catch (error) {
    console.error("Error generating video:", error);
    throw error;
  }
}
