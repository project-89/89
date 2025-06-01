"use client";

import React, { useState, useEffect } from "react";
import { Video } from "../../types";
import VideoCard from "../../components/videos/VideoCard";
import * as videoService from "../../services/video";
import { useWalletAuth } from "@/stores/walletAuthStore";

interface VideosClientProps {
  initialVideos: Video[];
  initialError: string | null;
  initialUserVideos: { videos: Video[]; total: number };
}

export default function VideosClient({
  initialVideos,
  initialError,
  initialUserVideos,
}: VideosClientProps) {
  const [activeTab, setActiveTab] = useState<"explore" | "your">("explore");
  const [videos, setVideos] = useState<Video[]>(initialVideos);
  const [error, setError] = useState<string | null>(initialError);
  const [userVideos, setUserVideos] = useState<Video[]>(
    initialUserVideos.videos
  );
  const [userVideosTotal, setUserVideosTotal] = useState<number>(
    initialUserVideos.total
  );
  const [loading, setLoading] = useState<boolean>(false);
  const [userLoading, setUserLoading] = useState<boolean>(false);

  // Use the auth store to check authentication status
  const { isAuthenticated } = useWalletAuth();

  useEffect(() => {
    // Refresh public videos if initial load had an error
    if (initialError) {
      console.log("[VideosClient] Initial error detected, refreshing videos");
      handleRefresh();
    }

    // Always log the authentication status and user videos state
    console.log(`[VideosClient] isAuthenticated: ${isAuthenticated}`);
    console.log(`[VideosClient] initialUserVideos:`, initialUserVideos);

    // Load user videos if authenticated but none were provided from server
    if (
      isAuthenticated &&
      (!initialUserVideos.videos || initialUserVideos.videos.length === 0)
    ) {
      console.log(
        "[VideosClient] User is authenticated but no initial user videos, loading from client"
      );
      loadUserVideos();
    }
  }, [isAuthenticated, initialUserVideos]);

  const handleRefresh = async () => {
    setLoading(true);
    setError(null);

    try {
      const refreshedVideos = await videoService.getPublicVideos(
        "recent",
        1,
        12
      );
      setVideos(refreshedVideos);
    } catch (err) {
      // Don't show error, just empty state
      setVideos([]);
      console.error("Error fetching videos:", err);
    } finally {
      setLoading(false);
    }
  };

  const loadUserVideos = async () => {
    if (!isAuthenticated) return;

    setUserLoading(true);
    try {
      const response = await videoService.getUserVideos(1, 12);
      setUserVideos(response.videos || []);
      setUserVideosTotal(response.total || 0);
    } catch (err) {
      console.error("Error fetching user videos:", err);
      // Don't show error for user videos, just empty state
      setUserVideos([]);
      setUserVideosTotal(0);
    } finally {
      setUserLoading(false);
    }
  };

  const renderContent = () => {
    if (activeTab === "explore") {
      if (loading) {
        return (
          <div className="flex justify-center items-center py-12">
            <div className="animate-pulse text-xl">Loading videos...</div>
          </div>
        );
      }

      if (videos.length === 0) {
        return (
          <div className="text-center py-12">
            <p className="text-xl text-gray-400 mb-4">
              No videos available yet
            </p>
            <p className="text-gray-500">
              Be the first to create and publish a video in the Proxim8
              collection!
            </p>
            <button
              onClick={handleRefresh}
              className="mt-6 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition"
            >
              Refresh
            </button>
          </div>
        );
      }

      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {videos.map((video) => (
            <VideoCard key={video.id} video={video} />
          ))}
        </div>
      );
    } else {
      if (!isAuthenticated) {
        return (
          <div className="text-center py-12">
            <p className="text-xl text-gray-400 mb-2">
              Please connect your wallet to view your videos
            </p>
          </div>
        );
      }

      if (userLoading) {
        return (
          <div className="flex justify-center items-center py-12">
            <div className="animate-pulse text-xl">Loading your videos...</div>
          </div>
        );
      }

      if (!userVideos || userVideos.length === 0) {
        console.log("Showing empty state for user videos");
        return (
          <div className="text-center py-12">
            <p className="text-xl text-gray-400 mb-4">
              You haven't created any videos yet
            </p>
            <p className="text-gray-500 mb-6">
              Create your first video from one of your NFTs to bring them to
              life
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <a
                href="/nfts"
                className="px-4 py-2 border border-green-500 text-green-500 bg-black/30 hover:bg-green-900/20 rounded transition-all flex items-center group"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 mr-2 group-hover:animate-pulse"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                </svg>
                <span className="font-mono tracking-wide">View My NFTs</span>
              </a>
              <a
                href="/create"
                className="px-4 py-2 border border-blue-400 text-blue-400 bg-black/30 hover:bg-blue-900/20 rounded transition-all flex items-center group"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 mr-2 group-hover:animate-pulse"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="font-mono tracking-wide">
                  Create New Video
                </span>
              </a>
            </div>
          </div>
        );
      }

      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {userVideos?.map((video) => (
            <VideoCard key={video.id} video={video} />
          ))}
        </div>
      );
    }
  };

  return (
    <div>
      <div className="flex border-b border-gray-700 mb-6">
        <button
          className={`pb-3 px-4 font-medium ${
            activeTab === "explore"
              ? "border-b-2 border-accent-magenta text-white"
              : "text-gray-400 hover:text-white transition"
          }`}
          onClick={() => setActiveTab("explore")}
        >
          Explore Videos
        </button>
        <button
          className={`pb-3 px-4 font-medium ${
            activeTab === "your"
              ? "border-b-2 border-accent-magenta text-white"
              : "text-gray-400 hover:text-white transition"
          }`}
          onClick={() => setActiveTab("your")}
        >
          Your Videos
          {userVideosTotal > 0 && (
            <span className="ml-2 px-2 py-0.5 text-xs bg-gray-700 rounded-full">
              {userVideosTotal}
            </span>
          )}
        </button>
      </div>

      {renderContent()}
    </div>
  );
}
