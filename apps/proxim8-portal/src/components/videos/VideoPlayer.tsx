"use client";

import React, { useRef, useEffect, useState } from "react";
import { refreshVideoUrl } from "@/services/video";
import { ErrorBoundary } from "react-error-boundary";

interface VideoPlayerProps {
  videoId?: string;
  url: string;
  thumbnail: string;
  isPublic?: boolean;
  publicId?: string;
  expiryTime?: Date;
}

// Fallback component for error boundary
function VideoErrorFallback({
  error,
  resetErrorBoundary,
}: {
  error: Error;
  resetErrorBoundary: () => void;
}) {
  return (
    <div className="relative aspect-video bg-gray-800 rounded-lg overflow-hidden flex items-center justify-center">
      <div className="text-center p-4">
        <p className="text-red-400 mb-2">Error loading video</p>
        <button
          onClick={resetErrorBoundary}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
        >
          Try again
        </button>
      </div>
    </div>
  );
}

function VideoPlayerInner({
  videoId,
  url,
  thumbnail,
  isPublic = false,
  publicId,
  expiryTime,
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoUrl, setVideoUrl] = useState<string>(url);
  const [isUrlExpired, setIsUrlExpired] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [hasError, setHasError] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Update the videoUrl when the url prop changes
  useEffect(() => {
    setVideoUrl(url);
    setHasError(false);
  }, [url]);

  // Check for URL expiration
  useEffect(() => {
    if (!expiryTime || isPublic) return;

    const checkExpiry = () => {
      const now = new Date();
      const expiry = new Date(expiryTime);

      // If URL will expire in the next 5 minutes, refresh it
      if (expiry.getTime() - now.getTime() < 5 * 60 * 1000) {
        setIsUrlExpired(true);
      }
    };

    checkExpiry();
    const interval = setInterval(checkExpiry, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [expiryTime, isPublic]);

  // Refresh URL if expired
  useEffect(() => {
    if (isUrlExpired && !isRefreshing && !isPublic && videoId) {
      const refreshUrl = async () => {
        setIsRefreshing(true);
        try {
          const newUrlData = await refreshVideoUrl(videoId);
          setVideoUrl(newUrlData.url);
          setIsUrlExpired(false);
          setHasError(false);

          if (videoRef.current) {
            // Store current play position
            const currentTime = videoRef.current.currentTime;
            const isPlaying = !videoRef.current.paused;

            // Update video source
            videoRef.current.src = newUrlData.url;
            videoRef.current.load();

            // Restore position and play state
            videoRef.current.currentTime = currentTime;
            if (isPlaying) {
              videoRef.current.play().catch((e) => {
                console.error("Error playing video after refresh:", e);
                setHasError(true);
              });
            }
          }
        } catch (error) {
          console.error("Error refreshing video URL:", error);
          setHasError(true);
        } finally {
          setIsRefreshing(false);
        }
      };

      refreshUrl();
    }
  }, [isUrlExpired, isRefreshing, videoId, isPublic]);

  // Use public URL if it's a public video
  const finalVideoUrl =
    isPublic && publicId ? `/api/public/videos/${publicId}/stream` : videoUrl;

  const finalThumbnailUrl =
    isPublic && publicId
      ? `/api/public/videos/${publicId}/thumbnail`
      : thumbnail;

  // Reload the video when the URL changes
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.load();
    }
  }, [finalVideoUrl]);

  // Handle video loading events
  const handleVideoLoaded = () => {
    setIsLoading(false);
  };

  const handleVideoError = () => {
    setHasError(true);
    setIsLoading(false);
  };

  return (
    <div className="relative aspect-video bg-gray-800 rounded-lg overflow-hidden">
      {/* Loading overlay */}
      {isLoading && !hasError && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-10">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      )}

      {/* Refresh overlay */}
      {isRefreshing && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-10">
          <span className="text-white">Refreshing video...</span>
        </div>
      )}

      {/* Error state */}
      {hasError && !isRefreshing && (
        <div className="absolute inset-0 bg-black bg-opacity-70 flex flex-col items-center justify-center z-10">
          <p className="text-white mb-3">Error loading video</p>
          <button
            onClick={() => {
              setHasError(false);
              setIsLoading(true);
              if (videoRef.current) {
                videoRef.current.load();
              }
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Try again
          </button>
        </div>
      )}

      <video
        ref={videoRef}
        className="w-full h-full"
        controls
        poster={finalThumbnailUrl}
        preload="metadata"
        onLoadedData={handleVideoLoaded}
        onError={handleVideoError}
      >
        <source src={finalVideoUrl} type="video/mp4" />
        Your browser does not support the video tag.
      </video>
    </div>
  );
}

export default function VideoPlayer(props: VideoPlayerProps) {
  return (
    <ErrorBoundary
      FallbackComponent={VideoErrorFallback}
      onReset={() => {
        // Reset the component state here if needed
      }}
    >
      <VideoPlayerInner {...props} />
    </ErrorBoundary>
  );
}
