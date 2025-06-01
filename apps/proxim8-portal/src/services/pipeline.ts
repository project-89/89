import * as apiClient from "@/utils/apiClient";
import { useWalletAuth } from "@/stores/walletAuthStore";
import { isAxiosError } from "axios";
import { ApiClient } from "./nftService";

export interface PipelineMiddleware {
  id: string;
  name: string;
  enabled: boolean;
  order: number;
  options: Record<string, unknown>;
}

export interface PipelineConfig {
  id: string;
  name: string;
  description: string;
  isSystem: boolean;
  createdBy: string;
  middlewares: PipelineMiddleware[];
  defaultOptions: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface AvailableMiddleware {
  id: string;
  name: string;
  description: string;
  requiredOptions: string[];
  optionalOptions: string[];
}

export interface VideoGeneration {
  id: string;
  nftId: string;
  prompt: string;
  status: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";
  videoUrl?: string;
  thumbnailUrl?: string;
  errorMessage?: string;
  createdAt: string;
  updatedAt: string;
}

const PIPELINE_API_PATH = "/api/pipeline";
const VIDEO_API_PATH = "/api/video";

const clientApiAdapter: ApiClient = {
  get: apiClient.get,
  post: apiClient.post,
  put: apiClient.put,
  del: apiClient.del,
};

/**
 * Get all available pipeline configurations
 */
export const getPipelineConfigs = async (): Promise<PipelineConfig[]> => {
  return clientApiAdapter.get<PipelineConfig[]>(
    `${PIPELINE_API_PATH}/configurations`
  );
};

/**
 * Get a specific pipeline configuration
 */
export const getPipelineConfig = async (
  id: string
): Promise<PipelineConfig> => {
  return clientApiAdapter.get<PipelineConfig>(
    `${PIPELINE_API_PATH}/configurations/${id}`
  );
};

/**
 * Create a new pipeline configuration
 */
export const createPipelineConfig = async (
  config: Partial<PipelineConfig>
): Promise<PipelineConfig> => {
  return clientApiAdapter.post<PipelineConfig>(
    `${PIPELINE_API_PATH}/configurations`,
    config
  );
};

/**
 * Update an existing pipeline configuration
 */
export const updatePipelineConfig = async (
  id: string,
  config: Partial<PipelineConfig>
): Promise<PipelineConfig> => {
  return clientApiAdapter.put<PipelineConfig>(
    `${PIPELINE_API_PATH}/configurations/${id}`,
    config
  );
};

/**
 * Delete a pipeline configuration
 */
export const deletePipelineConfig = async (id: string): Promise<void> => {
  return clientApiAdapter.del<void>(
    `${PIPELINE_API_PATH}/configurations/${id}`
  );
};

/**
 * Get all available middleware options
 */
export const getAvailableMiddleware = async (): Promise<
  AvailableMiddleware[]
> => {
  return clientApiAdapter.get<AvailableMiddleware[]>(
    `${PIPELINE_API_PATH}/middleware`
  );
};

/**
 * Test a pipeline configuration with an example NFT
 */
export const testPipelineConfig = async (
  config: PipelineConfig,
  nftId: string
): Promise<{
  success: boolean;
  result?: string;
  error?: string;
}> => {
  return clientApiAdapter.post<{
    success: boolean;
    result?: string;
    error?: string;
  }>(`${PIPELINE_API_PATH}/test`, { config, nftId });
};

/**
 * Generate a video using the standard pipeline
 * @param nftId The ID of the NFT to use for generation
 * @param prompt User-provided text to influence the generation
 * @returns Information about the created video generation
 */
export const generateVideo = async (
  nftId: string,
  prompt: string
): Promise<VideoGeneration> => {
  try {
    console.log(
      `[Pipeline Service] Starting video generation for NFT: ${nftId}`
    );
    console.log(`[Pipeline Service] Prompt: ${prompt}`);

    // Get wallet address from store (for request body)
    const { walletAddress } = useWalletAuth();
    if (!walletAddress) {
      throw new Error("Wallet not connected");
    }

    console.log(
      `[Pipeline Service] Using wallet address: ${walletAddress.substring(0, 8)}...`
    );

    // Make the API call to start video generation
    // The JWT token will be automatically added by the api utility
    const response = await clientApiAdapter.post<any>(
      `${VIDEO_API_PATH}/generate`,
      {
        nftId,
        prompt,
        walletAddress, // Still include in body for server compatibility
      }
    );

    console.log(
      `[Pipeline Service] Raw generation response:`,
      JSON.stringify(response).substring(0, 500) + "..."
    );

    // Transform server response to client model
    // For generation, the server might only return a jobId and status
    const result: VideoGeneration = {
      id: response.jobId || response.id || "",
      nftId: nftId,
      prompt: prompt,
      status: transformStatus(response.status),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    console.log("result", result);

    console.log(
      `[Pipeline Service] Video generation initiated successfully, ID: ${result.id}`
    );
    return result;
  } catch (error) {
    console.error("[Pipeline Service] Error starting video generation:", error);
    throw error;
  }
};

/**
 * Fetch all video generations for the current user
 * @returns Array of video generations for the user
 */
export const getUserVideoGenerations = async (): Promise<VideoGeneration[]> => {
  try {
    // Get wallet address from store (for query params)
    const { walletAddress } = useWalletAuth();
    if (!walletAddress) {
      console.warn(
        "[Pipeline Service] No wallet connected, cannot fetch video generations"
      );
      return [];
    }

    console.log(
      `[Pipeline Service] Fetching video generations for wallet: ${walletAddress.substring(0, 8)}...`
    );

    // Make the API call to fetch user's video generations
    // The JWT token will be automatically added by the api utility
    const response = await clientApiAdapter.get<any[]>(
      `${VIDEO_API_PATH}/user?walletAddress=${walletAddress}`
    );

    console.log(
      `[Pipeline Service] Raw API response for video generations:`,
      JSON.stringify(response).substring(0, 500) + "..."
    );

    if (!Array.isArray(response)) {
      console.error(
        "[Pipeline Service] API response is not an array:",
        typeof response,
        response
      );
      // Attempt to extract videos array if response is wrapped
      if (
        response &&
        typeof response === "object" &&
        "videos" in response &&
        Array.isArray((response as any).videos)
      ) {
        console.log(
          "[Pipeline Service] Extracted videos array from response object"
        );
        return transformVideoGenerations((response as any).videos);
      }
      return [];
    }

    // Transform server response to client format
    const result = transformVideoGenerations(response);

    console.log(
      `[Pipeline Service] Retrieved ${result.length} video generations for user`
    );
    return result;
  } catch (error) {
    console.error(
      "[Pipeline Service] Error fetching user video generations:",
      error
    );
    return [];
  }
};

/**
 * Transform server video generation format to client format
 */
function transformVideoGenerations(serverVideos: any[]): VideoGeneration[] {
  return serverVideos.map((video) => ({
    id: video.jobId || video.id || "",
    nftId: video.nftId || "",
    prompt: video.prompt || "",
    status: transformStatus(video.status),
    videoUrl: video.videoUrl || undefined,
    thumbnailUrl: video.imageUrl || video.thumbnailUrl || undefined,
    errorMessage: video.error || undefined,
    createdAt: video.createdAt || new Date().toISOString(),
    updatedAt: video.updatedAt || new Date().toISOString(),
  }));
}

/**
 * Transform server status to client status
 */
function transformStatus(status?: string): VideoGeneration["status"] {
  if (!status) return "PENDING";

  // Map server status values to client status values
  switch (status.toLowerCase()) {
    case "queued":
      return "PENDING";
    case "processing":
      return "PROCESSING";
    case "completed":
      return "COMPLETED";
    case "failed":
      return "FAILED";
    default:
      return "PENDING";
  }
}

/**
 * Get a video generation by ID
 * @param id The ID of the video generation to retrieve
 * @returns The video generation information, or null if not found
 */
export const getVideoGeneration = async (
  id: string
): Promise<VideoGeneration | null> => {
  try {
    console.log(
      `[Pipeline Service] Fetching video generation status for ID: ${id}`
    );

    // Get wallet address from store (for query params)
    const { walletAddress } = useWalletAuth();
    if (!walletAddress) {
      console.warn(
        "[Pipeline Service] No wallet connected, may not be able to fetch video generation"
      );
    }

    if (walletAddress) {
      console.log(
        `[Pipeline Service] Using wallet address: ${walletAddress.substring(0, 8)}...`
      );
    }

    // Make the API call to fetch the video generation status
    // The JWT token will be automatically added by the api utility
    const response = await clientApiAdapter.get<any>(
      `${VIDEO_API_PATH}/status/${id}?walletAddress=${walletAddress || ""}`
    );

    console.log(
      `[Pipeline Service] Raw video generation response:`,
      JSON.stringify(response).substring(0, 500) + "..."
    );

    // Transform server response to client format
    const result = transformVideoGenerations([response])[0];

    console.log(
      `[Pipeline Service] Video generation status retrieved successfully:`,
      result
    );
    return result;
  } catch (error) {
    if (isAxiosError(error) && error.response?.status === 404) {
      console.warn(
        `[Pipeline Service] Video generation not found for ID: ${id}`
      );
      return null;
    }
    console.error(
      `[Pipeline Service] Error fetching video generation for ID: ${id}:`,
      error
    );
    throw error;
  }
};

/**
 * Get all available pipeline configurations for the UI
 * This is called during SSR to get the initial configs
 */
export const getAvailablePipelineConfigs = async (): Promise<
  PipelineConfig[]
> => {
  try {
    console.log("Fetching pipeline configurations for SSR");

    // Default pipeline configuration to return if API fails
    const defaultConfig: PipelineConfig = {
      id: "default",
      name: "Standard Video Generator",
      description: "Default pipeline for generating videos from NFTs",
      isSystem: true,
      createdBy: "system",
      middlewares: [
        {
          id: "text-to-video",
          name: "Text to Video Generator",
          enabled: true,
          order: 1,
          options: {
            model: "default",
            maxDuration: 10,
          },
        },
      ],
      defaultOptions: {
        frameRate: 24,
        resolution: "1080p",
        format: "mp4",
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      // Try to fetch from the API
      const configs = await getPipelineConfigs();
      console.log(
        `Successfully fetched ${configs.length} pipeline configurations`
      );
      return configs.length > 0 ? configs : [defaultConfig];
    } catch (error) {
      console.error("Error fetching pipeline configurations:", error);
      console.log("Using default pipeline configuration");
      return [defaultConfig];
    }
  } catch (e) {
    console.error("Critical error in getAvailablePipelineConfigs:", e);
    return [];
  }
};

/**
 * Delete a video generation by ID
 * @param id The ID of the video generation to delete
 * @returns Success status of the deletion operation
 */
export const deleteVideoGeneration = async (id: string): Promise<boolean> => {
  try {
    console.log(`[Pipeline Service] Deleting video generation with ID: ${id}`);

    // Get wallet address from store (for verification)
    const { walletAddress } = useWalletAuth();
    if (!walletAddress) {
      console.warn(
        "[Pipeline Service] No wallet connected, cannot delete video generation"
      );
      return false;
    }

    // Make the API call to delete the video generation
    // The JWT token will be automatically added by the api utility
    const response = await clientApiAdapter.del<{
      success: boolean;
      message: string;
    }>(`${VIDEO_API_PATH}/${id}`);

    if (response && response.success) {
      console.log(
        `[Pipeline Service] Successfully deleted video with ID: ${id}`
      );
      return true;
    } else {
      console.error(
        `[Pipeline Service] Failed to delete video with ID: ${id}:`,
        response
      );
      return false;
    }
  } catch (error) {
    console.error(`[Pipeline Service] Error deleting video generation:`, error);
    return false;
  }
};

/**
 * Refresh the signed URLs for a video generation
 * @param id ID of the video to refresh
 * @returns Updated video generation with fresh URLs
 */
export const refreshVideoUrls = async (
  id: string
): Promise<VideoGeneration | null> => {
  try {
    console.log(`[Pipeline Service] Refreshing URLs for video: ${id}`);

    // Get wallet address from store (for verification)
    const { walletAddress } = useWalletAuth();
    if (!walletAddress) {
      console.warn(
        "[Pipeline Service] No wallet connected, cannot refresh video URLs"
      );
      return null;
    }

    // Call the refresh endpoint
    const response = await clientApiAdapter.get<any>(
      `${VIDEO_API_PATH}/refresh/${id}?walletAddress=${walletAddress}`
    );

    if (!response) {
      console.error(
        `[Pipeline Service] Failed to refresh URLs for video: ${id}`
      );
      return null;
    }

    // Transform server response to client format
    const result = transformVideoGenerations([response])[0];

    console.log(
      `[Pipeline Service] Successfully refreshed URLs for video: ${id}`
    );
    return result;
  } catch (error) {
    console.error(`[Pipeline Service] Error refreshing video URLs:`, error);
    return null;
  }
};
