"use client";

import React, { useState, useCallback, useMemo } from "react";
import { useWalletAuth } from "@/stores/walletAuthStore";
import {
  HeartIcon,
  BookmarkIcon,
  ShareIcon,
} from "@heroicons/react/24/outline";
import { HeartIcon as HeartIconSolid } from "@heroicons/react/24/solid";
import { BookmarkIcon as BookmarkIconSolid } from "@heroicons/react/24/solid";

interface VideoInteractionsProps {
  videoId: string;
  initialLikes: number;
  initialIsLiked?: boolean;
  initialIsSaved?: boolean;
  onShare?: () => void;
}

const VideoInteractions = React.memo(
  ({
    videoId,
    initialLikes,
    initialIsLiked = false,
    initialIsSaved = false,
    onShare,
  }: VideoInteractionsProps) => {
    const { isAuthenticated } = useWalletAuth();
    const [isLiked, setIsLiked] = useState(initialIsLiked);
    const [isSaved, setIsSaved] = useState(initialIsSaved);
    const [likes, setLikes] = useState(initialLikes);
    const [isSharing, setIsSharing] = useState(false);
    const [shareError, setShareError] = useState("");
    const [selectedPlatform, setSelectedPlatform] = useState<string | null>(
      null
    );
    const [shareMessage, setShareMessage] = useState("");

    const handleLike = useCallback(async () => {
      if (!isAuthenticated) {
        alert("Please sign in to like videos");
        return;
      }

      try {
        const response = await fetch(`/api/videos/${videoId}/like`, {
          method: isLiked ? "DELETE" : "POST",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          throw new Error("Failed to update like status");
        }

        setIsLiked(!isLiked);
        setLikes(isLiked ? likes - 1 : likes + 1);
      } catch (error) {
        console.error("Error updating like:", error);
      }
    }, [isAuthenticated, videoId, isLiked, likes]);

    const handleSave = useCallback(async () => {
      if (!isAuthenticated) {
        alert("Please sign in to save videos");
        return;
      }

      try {
        const response = await fetch(`/api/videos/${videoId}/save`, {
          method: isSaved ? "DELETE" : "POST",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          throw new Error("Failed to update save status");
        }

        setIsSaved(!isSaved);
      } catch (error) {
        console.error("Error updating save:", error);
      }
    }, [isAuthenticated, videoId, isSaved]);

    const handleShareClick = useCallback(() => {
      if (onShare) {
        onShare();
        return;
      }

      setIsSharing(!isSharing);
      setShareError("");
    }, [onShare, isSharing]);

    const handleShare = useCallback(
      async (platform: string) => {
        if (!isAuthenticated) {
          alert("Please sign in to share videos");
          return;
        }

        setSelectedPlatform(platform);
        setShareError("");

        try {
          const response = await fetch("/api/videos/share", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              videoId,
              platform,
              message: shareMessage,
            }),
          });

          if (!response.ok) {
            const data = await response.json();
            throw new Error(data.error || "Failed to share video");
          }

          // Reset sharing state after successful share
          setIsSharing(false);
          setSelectedPlatform(null);
          setShareMessage("");
        } catch (error: unknown) {
          console.error("Error sharing video:", error);
          setShareError(
            error instanceof Error ? error.message : "Failed to share video"
          );
        }
      },
      [isAuthenticated, videoId, shareMessage]
    );

    const handleMessageChange = useCallback(
      (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setShareMessage(e.target.value);
      },
      []
    );

    const likeButtonClasses = useMemo(
      () =>
        `flex items-center gap-2 px-3 py-2 rounded-md hover:bg-gray-700 transition-colors ${
          isLiked ? "text-red-500" : "text-gray-300"
        }`,
      [isLiked]
    );

    const saveButtonClasses = useMemo(
      () =>
        `flex items-center gap-2 px-3 py-2 rounded-md hover:bg-gray-700 transition-colors ${
          isSaved ? "text-yellow-500" : "text-gray-300"
        }`,
      [isSaved]
    );

    const shareButtonClasses =
      "flex items-center gap-2 px-3 py-2 rounded-md hover:bg-gray-700 transition-colors text-gray-300";

    return (
      <div className="video-interactions bg-gray-800 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <button onClick={handleLike} className={likeButtonClasses}>
            {isLiked ? (
              <HeartIconSolid className="w-5 h-5" />
            ) : (
              <HeartIcon className="w-5 h-5" />
            )}
            <span>{likes}</span>
          </button>

          <button onClick={handleSave} className={saveButtonClasses}>
            {isSaved ? (
              <BookmarkIconSolid className="w-5 h-5" />
            ) : (
              <BookmarkIcon className="w-5 h-5" />
            )}
            <span>Save</span>
          </button>

          <button onClick={handleShareClick} className={shareButtonClasses}>
            <ShareIcon className="w-5 h-5" />
            <span>Share</span>
          </button>
        </div>

        {isSharing && (
          <div className="mt-4 p-4 bg-gray-700 rounded-lg">
            <h3 className="font-medium mb-3">Share this video</h3>

            {shareError && (
              <div className="mb-3 text-sm text-red-400">{shareError}</div>
            )}

            <div className="mb-3">
              <textarea
                className="w-full px-3 py-2 bg-gray-800 rounded-md text-sm"
                rows={2}
                placeholder="Add a message (optional)"
                value={shareMessage}
                onChange={handleMessageChange}
              />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <button
                onClick={() => handleShare("twitter")}
                disabled={selectedPlatform === "twitter"}
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  selectedPlatform === "twitter"
                    ? "bg-blue-700 text-white cursor-wait"
                    : "bg-blue-600 hover:bg-blue-700 text-white"
                }`}
              >
                Twitter
              </button>
              <button
                onClick={() => handleShare("discord")}
                disabled={selectedPlatform === "discord"}
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  selectedPlatform === "discord"
                    ? "bg-indigo-700 text-white cursor-wait"
                    : "bg-indigo-600 hover:bg-indigo-700 text-white"
                }`}
              >
                Discord
              </button>
              <button
                onClick={() => handleShare("telegram")}
                disabled={selectedPlatform === "telegram"}
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  selectedPlatform === "telegram"
                    ? "bg-blue-700 text-white cursor-wait"
                    : "bg-blue-500 hover:bg-blue-600 text-white"
                }`}
              >
                Telegram
              </button>
              <button
                onClick={() => handleShare("email")}
                disabled={selectedPlatform === "email"}
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  selectedPlatform === "email"
                    ? "bg-gray-700 text-white cursor-wait"
                    : "bg-gray-600 hover:bg-gray-700 text-white"
                }`}
              >
                Email
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }
);

VideoInteractions.displayName = "VideoInteractions";

export default VideoInteractions;
