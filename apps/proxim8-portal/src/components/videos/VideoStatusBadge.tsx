"use client";

import React from "react";
import { getStatusColor, getStatusIcon } from "@/utils/videoUtils";

interface VideoStatusBadgeProps {
  status: string;
  errorMessage?: string;
}

/**
 * Component for displaying a video's status with appropriate styling and error tooltips
 */
const VideoStatusBadge: React.FC<VideoStatusBadgeProps> = ({
  status,
  errorMessage,
}) => {
  return (
    <div className="px-2 py-1 rounded-full bg-gray-800/80 flex items-center group">
      {getStatusIcon(status)}
      <span
        className={`ml-1 text-xs ${getStatusColor(status)}`}
        title={status === "FAILED" ? errorMessage || "Unknown error" : ""}
      >
        {status}
      </span>

      {/* Tooltip for failed videos with error details */}
      {status === "FAILED" && errorMessage && (
        <div className="absolute bottom-full right-0 mb-2 w-48 p-2 bg-gray-900 text-red-300 text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-75 z-10 pointer-events-none">
          <div className="font-semibold mb-1">Error details:</div>
          <div>{errorMessage}</div>
        </div>
      )}
    </div>
  );
};

export default VideoStatusBadge;
