"use client";

import React, { useState, useRef } from "react";
import { useClickOutside } from "@/hooks/useClickOutside";
import { VideoGeneration } from "@/services/pipeline";

interface VideoCardMenuProps {
  video: VideoGeneration;
  onRefresh: (id: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  isRefreshing: boolean;
  setIsRefreshing: (value: boolean) => void;
}

/**
 * Component for video card dropdown menu with various actions
 */
const VideoCardMenu: React.FC<VideoCardMenuProps> = ({
  video,
  onRefresh,
  onDelete,
  isRefreshing,
  setIsRefreshing,
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Handle refresh of URLs
  const handleRefresh = async () => {
    setIsRefreshing(true);
    setMenuOpen(false);

    try {
      await onRefresh(video.id);
      // The component will be remounted with a new key when URL changes
    } catch (error) {
      console.log(`[VideoCardMenu] Error refreshing video ${video.id}:`, error);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Function to retry a failed video generation
  const handleRetryGeneration = async () => {
    try {
      console.log(`[VideoCardMenu] Retrying generation for video ${video.id}`);
      // This would trigger regeneration with the same prompt and NFT
      setMenuOpen(false);
      alert("Retry functionality will be implemented soon");
    } catch (error) {
      console.error(`[VideoCardMenu] Error retrying video:`, error);
    }
  };

  // Function to report a failed generation
  const handleReportFailure = async () => {
    try {
      console.log(
        `[VideoCardMenu] Reporting failed generation for video ${video.id}`
      );
      setMenuOpen(false);
      alert(
        "Thank you for reporting this issue. Our team will investigate the failure."
      );
    } catch (error) {
      console.error(`[VideoCardMenu] Error reporting video failure:`, error);
    }
  };

  // Function to make a video public
  const handleMakePublic = async () => {
    if (video.status !== "COMPLETED") {
      alert("Only completed videos can be made public.");
      return;
    }

    try {
      console.log(`[VideoCardMenu] Making video ${video.id} public`);
      setMenuOpen(false);
      alert("This feature is coming soon! Your video will be shared publicly.");
    } catch (error) {
      console.error(`[VideoCardMenu] Error making video public:`, error);
    }
  };

  return (
    <div className="absolute top-2 left-2" ref={menuRef}>
      <button
        onClick={() => setMenuOpen(!menuOpen)}
        className="w-8 h-8 rounded-full bg-gray-800/80 flex items-center justify-center hover:bg-gray-700 transition-colors"
      >
        <svg
          className="w-5 h-5 text-gray-300"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
        </svg>
      </button>

      {/* Dropdown menu with enhanced options */}
      {menuOpen && (
        <div className="absolute left-0 mt-1 w-36 bg-gray-800 rounded-md shadow-lg z-10">
          <div className="py-1">
            {/* Refresh option */}
            <button
              onClick={handleRefresh}
              className="w-full text-left px-4 py-2 text-sm text-blue-400 hover:bg-gray-700 transition-colors flex items-center"
              disabled={isRefreshing}
            >
              <svg
                className="w-4 h-4 mr-2"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z"
                  clipRule="evenodd"
                />
              </svg>
              {isRefreshing ? "Refreshing..." : "Refresh"}
            </button>

            {/* Retry option - only for failed videos */}
            {video.status === "FAILED" && (
              <button
                onClick={handleRetryGeneration}
                className="w-full text-left px-4 py-2 text-sm text-green-400 hover:bg-gray-700 transition-colors flex items-center"
              >
                <svg
                  className="w-4 h-4 mr-2"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z"
                    clipRule="evenodd"
                  />
                </svg>
                Retry Generation
              </button>
            )}

            {/* Report option - only for failed videos */}
            {video.status === "FAILED" && (
              <button
                onClick={handleReportFailure}
                className="w-full text-left px-4 py-2 text-sm text-yellow-400 hover:bg-gray-700 transition-colors flex items-center"
              >
                <svg
                  className="w-4 h-4 mr-2"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
                Report Issue
              </button>
            )}

            {/* Make Public option - only for completed videos */}
            {video.status === "COMPLETED" && (
              <button
                onClick={handleMakePublic}
                className="w-full text-left px-4 py-2 text-sm text-purple-400 hover:bg-gray-700 transition-colors flex items-center"
              >
                <svg
                  className="w-4 h-4 mr-2"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 12a2 2 0 100-4 2 2 0 000 4z"
                    clipRule="evenodd"
                  />
                  <path
                    fillRule="evenodd"
                    d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
                    clipRule="evenodd"
                  />
                </svg>
                Make Public
              </button>
            )}

            {/* Delete option - always present */}
            <button
              onClick={() => {
                onDelete(video.id);
                setMenuOpen(false);
              }}
              className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-gray-700 transition-colors flex items-center"
            >
              <svg
                className="w-4 h-4 mr-2"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              Delete
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoCardMenu;
