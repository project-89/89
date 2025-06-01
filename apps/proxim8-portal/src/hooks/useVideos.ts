import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getPublicVideos,
  getVideoById,
  getVideosByTag,
  getUserVideos,
} from "@/services";
import { Video } from "@/types"; // Import Video from types
import { useWalletAuth } from "@/stores/walletAuthStore";
import { ApiError } from "@/types/error";

// Define type-safe query keys
export const VIDEO_KEYS = {
  all: ["videos"] as const,
  lists: () => [...VIDEO_KEYS.all, "list"] as const,
  list: (filters: string) => [...VIDEO_KEYS.lists(), filters] as const,
  details: () => [...VIDEO_KEYS.all, "detail"] as const,
  detail: (id: string) => [...VIDEO_KEYS.details(), id] as const,
  tags: () => [...VIDEO_KEYS.all, "tag"] as const,
  tag: (tag: string) => [...VIDEO_KEYS.tags(), tag] as const,
  user: () => [...VIDEO_KEYS.all, "user"] as const,
  userList: (page: number, limit: number) =>
    [...VIDEO_KEYS.user(), `page-${page}-limit-${limit}`] as const,
};

// Extended Video interface for client-side state
export interface ExtendedVideo extends Video {
  isLiked?: boolean;
  isSaved?: boolean;
  stats: {
    likes: number;
    views: number;
    shares?: number;
  };
}

// Interface for query options
export interface VideoQueryOptions {
  enabled?: boolean;
  staleTime?: number;
  cacheTime?: number;
  refetchOnWindowFocus?: boolean;
}

/**
 * Custom hook for fetching public videos with pagination and filtering
 */
export function usePublicVideos(
  filter: string = "latest",
  page: number = 1,
  limit: number = 10,
  options: VideoQueryOptions = {}
) {
  const queryClient = useQueryClient();
  const queryKey = VIDEO_KEYS.list(`${filter}-page-${page}-limit-${limit}`);
  const previousQueryKey = VIDEO_KEYS.list(
    `${filter}-page-${page - 1}-limit-${limit}`
  );

  const previousQueryData = queryClient.getQueryData<Video[]>(previousQueryKey);

  return useQuery<Video[], ApiError>({
    queryKey,
    queryFn: async () => {
      try {
        return await getPublicVideos(filter, page, limit);
      } catch (error) {
        console.error(`Error fetching public videos:`, error);
        if (error instanceof ApiError) {
          throw error;
        }
        throw new ApiError({
          status: 500,
          message:
            error instanceof Error
              ? error.message
              : "Unknown error fetching videos",
        });
      }
    },
    placeholderData: previousQueryData, // Use previous page data while loading new page
    staleTime: options.staleTime ?? 1000 * 60 * 5, // 5 minutes by default
    ...options,
  });
}

/**
 * Custom hook for fetching videos by tag
 */
export function useVideosByTag(
  tag: string,
  page: number = 1,
  limit: number = 10,
  options: VideoQueryOptions = {}
) {
  const queryClient = useQueryClient();
  const queryKey = VIDEO_KEYS.tag(`${tag}-page-${page}-limit-${limit}`);
  const previousQueryKey = VIDEO_KEYS.tag(
    `${tag}-page-${page - 1}-limit-${limit}`
  );

  const previousQueryData = queryClient.getQueryData<Video[]>(previousQueryKey);

  return useQuery<Video[], ApiError>({
    queryKey,
    queryFn: async () => {
      try {
        return await getVideosByTag(tag, page, limit);
      } catch (error) {
        console.error(`Error fetching videos by tag:`, error);
        if (error instanceof ApiError) {
          throw error;
        }
        throw new ApiError({
          status: 500,
          message:
            error instanceof Error
              ? error.message
              : "Unknown error fetching videos by tag",
        });
      }
    },
    enabled: !!tag, // Only run query if tag is provided
    placeholderData: previousQueryData,
    staleTime: options.staleTime ?? 1000 * 60 * 5, // 5 minutes by default
    ...options,
  });
}

/**
 * Custom hook for fetching a single video by ID
 */
export function useVideoDetails(
  videoId: string,
  options: VideoQueryOptions = {}
) {
  const { isAuthenticated } = useWalletAuth();

  return useQuery<Video, ApiError>({
    queryKey: VIDEO_KEYS.detail(videoId),
    queryFn: async () => {
      try {
        return await getVideoById(videoId);
      } catch (error) {
        console.error(`Error fetching video details:`, error);
        if (error instanceof ApiError) {
          throw error;
        }
        throw new ApiError({
          status: 500,
          message:
            error instanceof Error
              ? error.message
              : "Unknown error fetching video details",
        });
      }
    },
    enabled: !!videoId && options.enabled !== false,
    staleTime: options.staleTime ?? 1000 * 60 * 5, // 5 minutes by default
    ...options,
  });
}

/**
 * Custom hook for fetching user's videos
 */
export function useUserVideos(
  page: number = 1,
  limit: number = 10,
  options: VideoQueryOptions = {}
) {
  const { isAuthenticated } = useWalletAuth();
  const queryKey = VIDEO_KEYS.userList(page, limit);

  return useQuery<{ videos: Video[]; total: number }, ApiError>({
    queryKey,
    queryFn: async () => {
      try {
        return await getUserVideos(page, limit);
      } catch (error) {
        console.error(`Error fetching user videos:`, error);
        if (error instanceof ApiError) {
          throw error;
        }
        throw new ApiError({
          status: 500,
          message:
            error instanceof Error
              ? error.message
              : "Unknown error fetching user videos",
        });
      }
    },
    enabled: isAuthenticated && options.enabled !== false,
    staleTime: options.staleTime ?? 1000 * 60 * 2, // 2 minutes by default
    ...options,
  });
}

// Type for onMutate context
interface MutationContext {
  previousVideo?: ExtendedVideo;
}

/**
 * Custom hook for handling video like action with optimistic updates
 */
export function useLikeVideo() {
  const queryClient = useQueryClient();
  const { isAuthenticated } = useWalletAuth();

  return useMutation<
    { videoId: string; isLiked: boolean },
    ApiError,
    { videoId: string; isLiked: boolean },
    MutationContext
  >({
    mutationFn: async ({ videoId, isLiked }) => {
      try {
        const response = await fetch(`/api/videos/${videoId}/like`, {
          method: isLiked ? "DELETE" : "POST",
          headers: { "Content-Type": "application/json" },
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new ApiError({
            status: response.status,
            message: errorData.message || "Failed to update like status",
          });
        }

        return { videoId, isLiked: !isLiked };
      } catch (error) {
        if (error instanceof ApiError) {
          throw error;
        }
        throw new ApiError({
          status: 500,
          message:
            error instanceof Error
              ? error.message
              : "Unknown error updating like status",
        });
      }
    },

    // Optimistically update the UI before the server responds
    onMutate: async ({ videoId, isLiked }) => {
      // Cancel any outgoing refetches so they don't overwrite our optimistic update
      await queryClient.cancelQueries({ queryKey: VIDEO_KEYS.detail(videoId) });

      // Snapshot the previous value
      const previousVideo = queryClient.getQueryData<ExtendedVideo>(
        VIDEO_KEYS.detail(videoId)
      );

      // Optimistically update the like status
      if (previousVideo) {
        queryClient.setQueryData<ExtendedVideo>(VIDEO_KEYS.detail(videoId), {
          ...previousVideo,
          stats: {
            ...previousVideo.stats,
            likes: isLiked
              ? previousVideo.stats.likes - 1
              : previousVideo.stats.likes + 1,
          },
          isLiked: !isLiked,
        });
      }

      return { previousVideo };
    },

    // If the mutation fails, use the context returned from onMutate to roll back
    onError: (err, { videoId }, context) => {
      if (context?.previousVideo) {
        queryClient.setQueryData<ExtendedVideo>(
          VIDEO_KEYS.detail(videoId),
          context.previousVideo
        );
      }
      console.error("Error updating like:", err);
    },

    // Always refetch after error or success to ensure data is correct
    onSettled: (_, __, { videoId }) => {
      queryClient.invalidateQueries({ queryKey: VIDEO_KEYS.detail(videoId) });
    },
  });
}

/**
 * Custom hook for handling video save action with optimistic updates
 */
export function useSaveVideo() {
  const queryClient = useQueryClient();
  const { isAuthenticated } = useWalletAuth();

  return useMutation<
    { videoId: string; isSaved: boolean },
    ApiError,
    { videoId: string; isSaved: boolean },
    MutationContext
  >({
    mutationFn: async ({ videoId, isSaved }) => {
      try {
        const response = await fetch(`/api/videos/${videoId}/save`, {
          method: isSaved ? "DELETE" : "POST",
          headers: { "Content-Type": "application/json" },
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new ApiError({
            status: response.status,
            message: errorData.message || "Failed to update save status",
          });
        }

        return { videoId, isSaved: !isSaved };
      } catch (error) {
        if (error instanceof ApiError) {
          throw error;
        }
        throw new ApiError({
          status: 500,
          message:
            error instanceof Error
              ? error.message
              : "Unknown error updating save status",
        });
      }
    },

    // Optimistically update the UI before the server responds
    onMutate: async ({ videoId, isSaved }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: VIDEO_KEYS.detail(videoId) });

      // Snapshot the previous value
      const previousVideo = queryClient.getQueryData<ExtendedVideo>(
        VIDEO_KEYS.detail(videoId)
      );

      // Optimistically update the save status
      if (previousVideo) {
        queryClient.setQueryData<ExtendedVideo>(VIDEO_KEYS.detail(videoId), {
          ...previousVideo,
          isSaved: !isSaved,
        });
      }

      return { previousVideo };
    },

    // If the mutation fails, use the context returned from onMutate to roll back
    onError: (err, { videoId }, context) => {
      if (context?.previousVideo) {
        queryClient.setQueryData<ExtendedVideo>(
          VIDEO_KEYS.detail(videoId),
          context.previousVideo
        );
      }
      console.error("Error updating save status:", err);
    },

    // Always refetch after error or success
    onSettled: (_, __, { videoId }) => {
      queryClient.invalidateQueries({ queryKey: VIDEO_KEYS.detail(videoId) });
    },
  });
}
