import { serverApi } from "./serverApi";
import { Video } from "../types";
import {
  VIDEO_API_PATH,
  getPublicVideosImpl,
  getVideoByIdImpl,
  getUserVideosImpl,
  ApiClient,
} from "./videoService";

// Create server API adapter that satisfies the ApiClient interface
const serverApiAdapter: ApiClient = {
  get: serverApi.get.bind(serverApi),
  post: serverApi.post.bind(serverApi),
  put: serverApi.put.bind(serverApi),
  del: serverApi.delete.bind(serverApi),
};

/**
 * Server-side function to get a video by ID
 * Safe to use in Server Components
 */
export const getServerVideoById = async (videoId: string): Promise<Video> => {
  return getVideoByIdImpl(serverApiAdapter, videoId);
};

/**
 * Server-side function to get public videos
 * Safe to use in Server Components
 */
export const getServerPublicVideos = async (
  type: string = "recent",
  page: number = 1,
  limit: number = 10
): Promise<Video[]> => {
  // Override the endpoint path for server-side calls
  const originalPath = VIDEO_API_PATH;
  try {
    console.log("[Server] Fetching public videos with API key");
    // Note: We're keeping the server-specific endpoint structure
    return await getPublicVideosImpl(serverApiAdapter, type, page, limit);
  } catch (error) {
    console.error("Error fetching public videos:", error);
    // Return empty array instead of throwing to prevent server rendering error
    return [];
  }
};

/**
 * Get videos owned by the current user (server-side)
 * Note: When called from the server, this may not have authentication
 * and could return an empty array if auth is required
 */
export async function getServerUserVideos(): Promise<{
  videos: Video[];
  total: number;
}> {
  return getUserVideosImpl(serverApiAdapter, true);
}
