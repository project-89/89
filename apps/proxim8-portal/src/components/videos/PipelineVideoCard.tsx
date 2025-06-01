"use client";

import React, { useState } from "react";
import { VideoGeneration } from "@/services/pipeline";
import VideoStatusBadge from "./VideoStatusBadge";
import VideoCardMenu from "./VideoCardMenu";

interface PipelineVideoCardProps {
  video: VideoGeneration;
  onDelete: (id: string) => Promise<void>;
  onRefresh: (id: string) => Promise<void>;
}

/**
 * Enhanced video card component for pipeline videos with improved UI and features
 */
const PipelineVideoCard: React.FC<PipelineVideoCardProps> = ({
  video,
  onDelete,
  onRefresh,
}) => {
  const [imageError, setImageError] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Handle image error
  const handleImageError = () => {
    console.log(
      `[PipelineVideoCard] Image failed to load for video ${video.id}`
    );
    setImageError(true);
  };

  // Render the appropriate thumbnail content based on status
  const renderThumbnailContent = () => {
    if (video.thumbnailUrl && !imageError) {
      return (
        <img
          src={video.thumbnailUrl}
          alt={`Thumbnail for ${video.id}`}
          className="w-full h-full object-cover"
          onError={handleImageError}
        />
      );
    }

    if (video.status === "PROCESSING") {
      return (
        <div className="flex flex-col items-center justify-center h-full w-full">
          {/* Simple spinning circle for processing */}
          <div className="relative w-16 h-16 mb-4">
            <div className="absolute inset-0 border-4 border-t-indigo-500 border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin"></div>
          </div>
          <div className="text-indigo-400 font-medium">Processing Video</div>
          <div className="text-gray-400 text-sm mt-1">
            This may take a few minutes...
          </div>
        </div>
      );
    }

    if (video.status === "PENDING") {
      return (
        <div className="flex flex-col items-center justify-center h-full w-full">
          {/* Just the animated dots for pending */}
          <div className="flex space-x-3 mb-4">
            <div
              className="w-3 h-3 bg-blue-400 rounded-full animate-bounce"
              style={{ animationDelay: "0ms" }}
            ></div>
            <div
              className="w-3 h-3 bg-blue-400 rounded-full animate-bounce"
              style={{ animationDelay: "150ms" }}
            ></div>
            <div
              className="w-3 h-3 bg-blue-400 rounded-full animate-bounce"
              style={{ animationDelay: "300ms" }}
            ></div>
          </div>
          <div className="text-blue-400 font-medium">In Queue</div>
          <div className="text-gray-400 text-sm mt-1">
            Waiting to start processing...
          </div>
        </div>
      );
    }

    if (video.status === "FAILED") {
      return (
        <div className="flex flex-col items-center justify-center h-full w-full">
          <svg
            className="w-16 h-16 text-red-500 mb-2"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clipRule="evenodd"
            />
          </svg>
          <div className="text-red-500 font-medium">Generation Failed</div>
          <div className="text-gray-400 text-sm mt-1">
            {video.errorMessage || "An error occurred during processing"}
          </div>
        </div>
      );
    }

    if (imageError) {
      // Automatically refresh without showing status or button
      if (!isRefreshing) {
        setIsRefreshing(true);
        onRefresh(video.id).finally(() => {
          setIsRefreshing(false);
          setImageError(false); // Reset error state after refresh
        });
      }

      return (
        <div className="flex flex-col items-center justify-center h-full w-full">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-500 mb-2"></div>
          <div className="text-gray-400 font-medium">Loading...</div>
        </div>
      );
    }

    return (
      <div className="flex items-center justify-center h-full w-full text-gray-500">
        No Thumbnail
      </div>
    );
  };

  return (
    <div key={video.id} className="bg-gray-700 rounded-lg overflow-hidden">
      {/* Video Thumbnail */}
      <div className="relative aspect-video bg-gray-900">
        {renderThumbnailContent()}

        {/* Status badge */}
        <div className="absolute top-2 right-2">
          <VideoStatusBadge
            status={video.status}
            errorMessage={video.errorMessage}
          />
        </div>

        {/* Menu button */}
        <VideoCardMenu
          video={video}
          onRefresh={onRefresh}
          onDelete={onDelete}
          isRefreshing={isRefreshing}
          setIsRefreshing={setIsRefreshing}
        />
      </div>

      {/* Video Info */}
      <div className="p-3">
        <p className="font-medium text-white line-clamp-1">
          {video.prompt || "No prompt provided"}
        </p>
        <p className="text-xs text-gray-400 mt-1">
          Created: {new Date(video.createdAt).toLocaleString()}
        </p>

        {/* Action buttons */}
        <div className="mt-3 flex space-x-2">
          {video.status === "COMPLETED" && video.videoUrl && (
            <a
              href={video.videoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-1 px-3 rounded text-sm text-center"
            >
              Watch
            </a>
          )}

          {video.status === "FAILED" && (
            <button
              onClick={() => {
                // This should call the retry function
                alert("Retry functionality coming soon!");
              }}
              className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-1 px-3 rounded text-sm"
              title={video.errorMessage || "Generation failed"}
            >
              Retry
            </button>
          )}

          {(video.status === "PENDING" || video.status === "PROCESSING") && (
            <button
              className="flex-1 bg-gray-600 text-white py-1 px-3 rounded text-sm cursor-wait"
              disabled
            >
              {video.status === "PENDING" ? "Queued" : "Processing"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default PipelineVideoCard;
