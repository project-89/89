import { useState, useRef, useCallback, useEffect } from "react";
import {
  useQuery,
  useQueryClient,
  UseQueryResult,
} from "@tanstack/react-query";
import { VideoGeneration, getUserVideoGenerations } from "@/services/pipeline";
import { ApiError } from "@/types/error";

// Query key factory for video generations
export const VIDEO_GENERATION_KEYS = {
  all: ["videoGenerations"] as const,
  user: () => [...VIDEO_GENERATION_KEYS.all, "user"] as const,
};

interface UseVideoPollingProps {
  connected: boolean;
  isAuthenticated: boolean;
  enabled?: boolean;
  refetchInterval?: number | false;
  onSuccess?: (data: VideoGeneration[]) => void;
  onError?: (error: ApiError) => void;
}

/**
 * Hook for polling video generations with React Query
 */
const useVideoPolling = ({
  connected,
  isAuthenticated,
  enabled = true,
  refetchInterval = false,
  onSuccess,
  onError,
}: UseVideoPollingProps) => {
  const queryClient = useQueryClient();
  const [pollingPaused, setPollingPaused] = useState(false);
  const initialFetchDone = useRef(false);

  // Determine if we should be fetching based on auth, connection, and pause state
  const shouldFetch = enabled && connected && isAuthenticated && !pollingPaused;

  // Use React Query for data fetching with automatic polling
  const {
    data,
    isLoading: loadingVideos,
    error,
    refetch,
    isFetching,
  } = useQuery<VideoGeneration[], ApiError>({
    queryKey: VIDEO_GENERATION_KEYS.user(),
    queryFn: async () => {
      try {
        console.log("[useVideoPolling] Fetching video generations");
        const videos = await getUserVideoGenerations();

        // Mark initial fetch as complete
        if (!initialFetchDone.current) {
          initialFetchDone.current = true;
        }

        return videos;
      } catch (error) {
        console.error(
          "[useVideoPolling] Error fetching video generations:",
          error
        );

        // Still mark initial fetch as done even on error
        if (!initialFetchDone.current) {
          initialFetchDone.current = true;
        }

        // Handle errors properly
        if (error instanceof ApiError) {
          throw error;
        }

        throw new ApiError({
          status: 500,
          message:
            error instanceof Error
              ? error.message
              : "Unknown error fetching video generations",
        });
      }
    },
    enabled: shouldFetch,
    refetchInterval: (() => {
      if (!shouldFetch) return false;

      // Default to 10 seconds for polling if has pending videos, otherwise no polling
      return refetchInterval === false ? 10000 : refetchInterval;
    })(),
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: shouldFetch,
  });

  // Get the videos with proper typing
  const userVideos: VideoGeneration[] = data || [];

  // Handle success and error effects
  useEffect(() => {
    // Call success callback if we have data
    if (data && onSuccess) {
      onSuccess(data);
    }

    // Reset polling state on successful fetch
    if (data) {
      setPollingPaused(false);
    }
  }, [data, onSuccess]);

  useEffect(() => {
    // Handle errors
    if (error) {
      console.error("[useVideoPolling] Error fetching user videos:", error);

      // If we get server errors, pause polling to avoid flooding
      if (error instanceof ApiError && error.status >= 400) {
        setPollingPaused(true);
      }

      // Call error callback if provided
      if (onError) {
        onError(error);
      }
    }
  }, [error, onError]);

  // Check if any videos are pending or processing
  const hasPendingVideos = userVideos.some(
    (video: VideoGeneration) =>
      video.status === "PENDING" || video.status === "PROCESSING"
  );

  // Add a newly created video to the local state immediately
  const addNewVideo = useCallback(
    (newVideo: VideoGeneration) => {
      console.log(
        "[useVideoPolling] Adding new video to local state:",
        newVideo.id
      );

      // Get current cache
      const currentVideos =
        queryClient.getQueryData<VideoGeneration[]>(
          VIDEO_GENERATION_KEYS.user()
        ) || [];

      // Check if video already exists
      if (!currentVideos.some((v) => v.id === newVideo.id)) {
        // Update cache with new video
        queryClient.setQueryData<VideoGeneration[]>(
          VIDEO_GENERATION_KEYS.user(),
          [newVideo, ...currentVideos]
        );

        // Make sure polling is active to get updates for this video
        setPollingPaused(false);
      }
    },
    [queryClient]
  );

  // Force a refresh of videos (for manual refresh)
  const refreshVideos = useCallback(() => {
    setPollingPaused(false);
    return refetch();
  }, [refetch]);

  return {
    userVideos,
    loadingVideos: loadingVideos && !initialFetchDone.current,
    isFetching,
    hasPendingVideos,
    refreshVideos,
    addNewVideo,
    pollingPaused,
    setPollingPaused,
    error,
  };
};

export default useVideoPolling;
