"use client";

import * as apiClient from "@/utils/apiClient";
// import { toast } from "react-toastify";
import { VideoGenerationResponse } from "@/types/video";
import { Video } from "@/types";
import {
  VIDEO_API_PATH,
  getPublicVideosImpl,
  getVideoByIdImpl,
  getUserVideosImpl,
  refreshVideoUrlImpl,
  generateVideoImpl,
} from "./videoService";

// Create client implementation that satisfies the ApiClient interface
const clientApiAdapter = {
  get: apiClient.get,
  post: apiClient.post,
  put: apiClient.put,
  del: apiClient.del,
};

// Get public videos with filter options
export const getPublicVideos = async (
  type: string = "recent",
  page: number = 1,
  limit: number = 10
): Promise<Video[]> => {
  return getPublicVideosImpl(clientApiAdapter, type, page, limit);
};

// Refresh a video URL when it's about to expire
export const refreshVideoUrl = async (
  videoId: string
): Promise<{ url: string; expiryTime: Date }> => {
  return refreshVideoUrlImpl(clientApiAdapter, videoId);
};

// Make a video public
export const makeVideoPublic = async (
  videoId: string,
  data: {
    title: string;
    description?: string;
    tags?: string[];
  }
): Promise<{ success: boolean; publicVideoId: string }> => {
  return apiClient.post<{ success: boolean; publicVideoId: string }>(
    `${VIDEO_API_PATH}/${videoId}/publish`,
    data
  );
};

// Get videos by tag
export const getVideosByTag = async (
  tag: string,
  page: number = 1,
  limit: number = 10
): Promise<Video[]> => {
  const params = new URLSearchParams();
  params.append("tag", tag);
  params.append("page", page.toString());
  params.append("limit", limit.toString());

  return apiClient.get<Video[]>(`${VIDEO_API_PATH}/tag?${params.toString()}`);
};

// Get video by ID
export const getVideoById = async (videoId: string): Promise<Video> => {
  return getVideoByIdImpl(clientApiAdapter, videoId);
};

// Get user's videos
export const getUserVideos = async (
  page: number = 1,
  limit: number = 10
): Promise<{ videos: Video[]; total: number }> => {
  return getUserVideosImpl(clientApiAdapter, false, page, limit);
};

// Generate video from NFT
export const generateVideo = async (
  nftId: string,
  pipelineConfigId: string,
  options: Record<string, unknown> = {}
): Promise<VideoGenerationResponse> => {
  return generateVideoImpl(clientApiAdapter, nftId, pipelineConfigId, options);
};

// Update video metadata
export const updateVideoMetadata = async (
  videoId: string,
  metadata: {
    title?: string;
    description?: string;
  }
): Promise<Video> => {
  return apiClient.put<Video>(
    `${VIDEO_API_PATH}/${videoId}/metadata`,
    metadata
  );
};

// Delete video
export const deleteVideo = async (
  videoId: string
): Promise<{ success: boolean }> => {
  return apiClient.del<{ success: boolean }>(`${VIDEO_API_PATH}/${videoId}`);
};

// Get video status
export const getVideoStatus = async (
  videoId: string
): Promise<{
  videoId: string;
  status: "processing" | "completed" | "failed";
  progress?: number;
  url?: string;
  errorMessage?: string;
}> => {
  return apiClient.get<{
    videoId: string;
    status: "processing" | "completed" | "failed";
    progress?: number;
    url?: string;
    errorMessage?: string;
  }>(`${VIDEO_API_PATH}/${videoId}/status`);
};
