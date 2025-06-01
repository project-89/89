"use client";

import React from "react";
import Link from "next/link";
import { Video } from "@/types";
import { EyeIcon, HeartIcon, ClockIcon } from "@heroicons/react/24/outline";

interface VideoCardInteractiveProps {
  video: Video;
  showPublicBadge?: boolean;
  enhanced?: boolean;
  onLike?: () => void;
  onSave?: () => void;
}

export default function VideoCardInteractive({
  video,
  showPublicBadge = true,
  enhanced = false,
  onLike,
  onSave,
}: VideoCardInteractiveProps) {
  // Get thumbnail URL based on whether it's a public video
  const getThumbnailUrl = () => {
    if (video.isPublic && video.publicId) {
      return `/api/public/videos/${video.publicId}/thumbnail`;
    }
    return video.thumbnail || "/images/video-placeholder.jpg";
  };

  // Format view count
  const formatViews = (views: number) => {
    if (!views && views !== 0) return "0 views";
    if (views === 0) return "0 views";
    if (views === 1) return "1 view";

    if (views < 1000) return `${views} views`;
    if (views < 1000000) return `${(views / 1000).toFixed(1)}K views`;
    return `${(views / 1000000).toFixed(1)}M views`;
  };

  // Format the date to a readable string
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <Link
      href={`/videos/${video.id}`}
      className={`block transition-all duration-200 hover:shadow-lg hover:transform hover:scale-[1.02] rounded-lg overflow-hidden ${
        enhanced
          ? "group bg-[#12151a] hover:bg-[#1a1e24] border border-gray-800 hover:border-blue-500/30 flex flex-col"
          : "bg-gray-800"
      }`}
    >
      <div className="aspect-video bg-gray-900 relative">
        <img
          src={getThumbnailUrl()}
          alt={video.title || "Video thumbnail"}
          className={`w-full h-full object-cover ${
            enhanced
              ? "group-hover:scale-105 transition-transform duration-500"
              : ""
          }`}
        />

        {enhanced && (
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <div className="bg-accent-blue/80 rounded-full p-3">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="white"
              >
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
          </div>
        )}

        <div className="absolute top-2 right-2 flex space-x-2">
          {video.isPublic && showPublicBadge && (
            <span className="bg-green-600 text-white text-xs px-2 py-1 rounded">
              Public
            </span>
          )}
        </div>

        {!enhanced && (
          <div className="absolute bottom-2 right-2 bg-black bg-opacity-70 px-2 py-1 rounded text-xs text-white">
            {formatViews(video.views || 0)}
          </div>
        )}
      </div>

      <div className="p-3">
        <h3
          className={`font-medium text-white ${enhanced ? "text-lg line-clamp-2" : "truncate"}`}
        >
          {video.title || "Untitled Video"}
        </h3>

        {enhanced ? (
          <p className="text-gray-400 text-sm line-clamp-2 mb-4 flex-1">
            {video.description || "No description"}
          </p>
        ) : (
          <p className="text-gray-400 text-sm mt-1 truncate">
            {video.ownerWallet
              ? video.ownerWallet.substring(0, 8)
              : "Unknown creator"}
          </p>
        )}

        {enhanced ? (
          <div className="flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <EyeIcon className="h-4 w-4 mr-1" />
                <span>{video.views || 0}</span>
              </div>
              <div className="flex items-center">
                <HeartIcon className="h-4 w-4 mr-1" />
                <span>{video.likes || 0}</span>
              </div>
            </div>
            <div className="flex items-center">
              <ClockIcon className="h-4 w-4 mr-1" />
              <span>
                {formatDate(video.createdAt || new Date().toISOString())}
              </span>
            </div>
          </div>
        ) : (
          <p className="text-gray-400 text-sm mt-1">
            {new Date(video.createdAt).toLocaleDateString()}
          </p>
        )}
      </div>
    </Link>
  );
}
