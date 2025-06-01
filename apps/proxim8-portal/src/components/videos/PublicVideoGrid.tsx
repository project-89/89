import React from "react";
import { Video } from "@/types";
import VideoCard from "./VideoCard";

interface PublicVideoGridProps {
  videos: Video[];
  title?: string;
  loading?: boolean;
  emptyMessage?: string;
}

export function PublicVideoGrid({
  videos,
  title,
  loading = false,
  emptyMessage = "No videos found",
}: PublicVideoGridProps) {
  return (
    <div className="w-full">
      {title && <h2 className="text-2xl font-bold text-white mb-6">{title}</h2>}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(8)].map((_, index) => (
            <div
              key={`skeleton-${index}`}
              className="bg-[#12151a] rounded-lg overflow-hidden animate-pulse"
            >
              <div className="aspect-video bg-gray-800" />
              <div className="p-4">
                <div className="h-6 bg-gray-800 rounded mb-3 w-3/4" />
                <div className="h-4 bg-gray-800 rounded mb-2 w-full" />
                <div className="h-4 bg-gray-800 rounded mb-4 w-2/3" />
                <div className="flex justify-between">
                  <div className="h-3 bg-gray-800 rounded w-1/4" />
                  <div className="h-3 bg-gray-800 rounded w-1/4" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : videos.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {videos.map((video) => (
            <VideoCard
              key={video.id}
              video={video}
              enhanced={true}
              showPublicBadge={true}
            />
          ))}
        </div>
      ) : (
        <div className="bg-[#12151a] border border-gray-800 rounded-lg p-8 text-center">
          <p className="text-gray-400">{emptyMessage}</p>
        </div>
      )}
    </div>
  );
}
