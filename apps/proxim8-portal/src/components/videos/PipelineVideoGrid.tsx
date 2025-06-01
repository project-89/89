"use client";

import React, { useRef } from "react";
import {
  // VideoGeneration,
  deleteVideoGeneration,
  refreshVideoUrls,
} from "@/services/pipeline";
import PipelineVideoCard from "./PipelineVideoCard";
import useScrollPosition from "@/hooks/useScrollPosition";
import useVideoPolling from "@/hooks/useVideoPolling";

interface PipelineVideoGridProps {
  connected: boolean;
  isAuthenticated: boolean;
  statusFilter?: string;
  refreshVideos?: () => void;
  addNewVideo?: (video: any) => void;
}

/**
 * Grid component for displaying video generations with filtering and smart updates
 */
const PipelineVideoGrid: React.FC<PipelineVideoGridProps> = ({
  connected,
  isAuthenticated,
  statusFilter = "all",
  refreshVideos: externalRefreshVideos,
  // addNewVideo: externalAddNewVideo,
}) => {
  const gridRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Use our custom hook for scroll position tracking
  const scrollPositionRef = useScrollPosition();

  // Use our custom video polling hook
  const {
    userVideos,
    loadingVideos,
    // hasPendingVideos,
    refreshVideos: internalRefreshVideos,
    addNewVideo: internalAddNewVideo,
    // pollingPaused,
    // setPollingPaused,
  } = useVideoPolling({
    connected,
    isAuthenticated,
  });

  // Use external refreshVideos if provided, otherwise use internal one
  const refreshVideos = externalRefreshVideos || internalRefreshVideos;

  // Use external addNewVideo if provided, otherwise use internal one
  // const addNewVideo = externalAddNewVideo || internalAddNewVideo;

  // Filter videos based on status
  const filteredVideos =
    statusFilter === "all"
      ? userVideos
      : userVideos.filter((video) => video.status === statusFilter);

  // Handle video deletion
  const handleDeleteVideo = async (id: string) => {
    if (!id) return;

    // Confirm with user before deleting
    if (
      !confirm(
        "Are you sure you want to delete this video? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      // Perform the actual deletion on the server
      const success = await deleteVideoGeneration(id);

      if (success) {
        console.log(`Video ${id} successfully deleted`);
        // Refresh the video list after deletion
        refreshVideos();
      } else {
        console.error(`Failed to delete video ${id}`);
      }
    } catch (error) {
      console.error("Error deleting video:", error);
    }
  };

  // Handle URL refresh for a video
  const handleRefreshVideo = async (id: string) => {
    console.log(`[PipelineVideoGrid] Starting refresh for video ${id}`);
    try {
      const refreshedVideo = await refreshVideoUrls(id);

      if (refreshedVideo) {
        console.log(
          `[PipelineVideoGrid] Successfully refreshed URLs for video ${id}`
        );
        // Refresh the video list after URL refresh
        refreshVideos();
      } else {
        console.error(
          `[PipelineVideoGrid] Failed to refresh URLs for video ${id}`
        );
      }
    } catch (error) {
      console.error("[PipelineVideoGrid] Error refreshing video URLs:", error);
    }
  };

  // Restore scroll position after render
  React.useEffect(() => {
    // Use a small timeout to ensure the DOM has updated
    const timeoutId = setTimeout(() => {
      window.scrollTo({
        top: scrollPositionRef.current,
        behavior: "instant",
      });
    }, 0);

    return () => clearTimeout(timeoutId);
  }, [filteredVideos]);

  if (loadingVideos) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
        <span className="ml-3 text-indigo-300">Loading your videos...</span>
      </div>
    );
  }

  if (userVideos.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-400">You haven't generated any videos yet.</p>
      </div>
    );
  }

  if (filteredVideos.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-400">
          No videos with status "{statusFilter.toLowerCase()}" found.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4" ref={containerRef}>
      {/* Video grid - responsive design for different screen sizes */}
      <div
        ref={gridRef}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
      >
        {filteredVideos.map((video) => (
          <PipelineVideoCard
            key={`${video.id}-${video.status}`}
            video={video}
            onDelete={handleDeleteVideo}
            onRefresh={handleRefreshVideo}
          />
        ))}
      </div>
    </div>
  );
};

export default PipelineVideoGrid;
