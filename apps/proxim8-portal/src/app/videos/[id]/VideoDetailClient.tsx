"use client";

import { Video } from "../../../types";
import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import * as videoService from "@/services/video";
import PublishVideoModal from "@/components/videos/PublishVideoModal";
import VideoPlayer from "@/components/videos/VideoPlayer";

interface Props {
  video: Video;
  initialError?: string | null;
}

export default function VideoDetailClient({
  video: initialVideo,
  initialError = null,
}: Props) {
  const [video, setVideo] = useState<Video>(initialVideo);
  const [likes, setLikes] = useState<number>(video.likes || 0);
  const [views, setViews] = useState<number>(video.views || 0);
  const [hasLiked, setHasLiked] = useState<boolean>(video.hasLiked || false);
  const [showPublishModal, setShowPublishModal] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Show error toast if we have an initial error from the server
  useEffect(() => {
    if (initialError) {
      toast.error(initialError);
    }
  }, [initialError]);

  // Simulate view count increase
  useEffect(() => {
    // Increment view count when component mounts
    setViews((prev) => prev + 1);
  }, []);

  const handleLike = async () => {
    setIsLoading(true);
    try {
      if (hasLiked) {
        // This would be an actual API call to unlike in a real implementation
        setLikes((prev) => Math.max(0, prev - 1));
        setHasLiked(false);
        toast.info("Removed like");
      } else {
        // This would be an actual API call to like in a real implementation
        setLikes((prev) => prev + 1);
        setHasLiked(true);
        toast.success("Added like");
      }
    } catch (error) {
      toast.error("Failed to update like status");
      console.error("Error liking video:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleShare = () => {
    // Copy the current URL to clipboard
    navigator.clipboard
      .writeText(window.location.href)
      .then(() => toast.success("Link copied to clipboard"))
      .catch(() => toast.error("Failed to copy link"));
  };

  const handlePublishSuccess = (publicId: string) => {
    setVideo({
      ...video,
      isPublic: true,
      publicId,
    });
    toast.success("Video published successfully!");
    setShowPublishModal(false);
    setIsLoading(false);
  };

  return (
    <div className="space-y-6">
      {/* Video player */}
      <div className="bg-gray-900 rounded-lg overflow-hidden aspect-video">
        {video.url ? (
          <VideoPlayer
            videoId={video.id}
            url={video.url}
            thumbnail={video.thumbnail || ""}
            isPublic={video.isPublic}
            publicId={video.publicId}
            expiryTime={
              video.metadata?.urlExpiryTime
                ? new Date(video.metadata.urlExpiryTime)
                : undefined
            }
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <p className="text-gray-500">Video not available</p>
          </div>
        )}
      </div>

      {/* Video info */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white">{video.title}</h1>

          {/* Make Public button (only show if video is not already public) */}
          {!video.isPublic && (
            <button
              onClick={() => setShowPublishModal(true)}
              disabled={isLoading}
              className={`flex items-center space-x-2 px-4 py-2 rounded ${
                isLoading
                  ? "bg-indigo-400 cursor-not-allowed"
                  : "bg-indigo-600 hover:bg-indigo-700"
              } text-white transition`}
            >
              {isLoading ? (
                <span className="animate-pulse">Processing...</span>
              ) : (
                <>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                    />
                  </svg>
                  <span>Make Public</span>
                </>
              )}
            </button>
          )}

          {/* Public badge */}
          {video.isPublic && (
            <div className="bg-green-600 text-white px-3 py-1 rounded-full text-sm flex items-center space-x-1">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                />
              </svg>
              <span>Public</span>
            </div>
          )}
        </div>
        <div className="flex items-center justify-between">
          <div className="text-gray-400">
            <span>{views} views</span>
            <span className="mx-2">•</span>
            <span>{new Date(video.createdAt).toLocaleDateString()}</span>
          </div>
          <div className="flex space-x-4">
            <button
              onClick={handleLike}
              disabled={isLoading}
              className={`flex items-center space-x-1 px-3 py-1 rounded-full ${
                hasLiked
                  ? "bg-indigo-600 text-white"
                  : "bg-gray-800 text-gray-400 hover:bg-gray-700"
              } ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" />
              </svg>
              <span>{likes}</span>
            </button>
            <button
              onClick={handleShare}
              disabled={isLoading}
              className={`flex items-center space-x-1 px-3 py-1 rounded-full bg-gray-800 text-gray-400 hover:bg-gray-700 ${
                isLoading ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" />
              </svg>
              <span>Share</span>
            </button>
          </div>
        </div>
        <div className="border-t border-gray-800 pt-4">
          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0 h-10 w-10 bg-gray-700 rounded-full flex items-center justify-center">
              <span className="text-lg font-semibold">
                {video.ownerWallet ? video.ownerWallet.substring(0, 2) : "?"}
              </span>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">
                {video.ownerWallet
                  ? `${video.ownerWallet.substring(0, 6)}...${video.ownerWallet.substring(
                      video.ownerWallet.length - 4
                    )}`
                  : "Unknown Creator"}
              </h3>
              <p className="text-gray-400 mt-2 whitespace-pre-line">
                {video.description || "No description provided."}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Publish modal */}
      {showPublishModal && (
        <PublishVideoModal
          videoId={video.id}
          title={video.title}
          onClose={() => setShowPublishModal(false)}
          onSuccess={handlePublishSuccess}
        />
      )}

      {/* Related videos could go here */}
    </div>
  );
}
