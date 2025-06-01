"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { NFTMetadata } from "@/types/nft";
import { generateVideo } from "@/services/pipeline";
import { useClickOutside } from "@/hooks/useClickOutside";
import useVideoPolling from "@/hooks/useVideoPolling";
import Image from "next/image";
import { ValidationError } from "@/types/error";

// Improved typing for NFT object
interface NFT {
  id?: string;
  mint?: string;
  name?: string;
  image?: string;
}

interface VideoGenerationFormProps {
  userNfts: NFT[];
  onGenerationComplete?: () => void;
  preselectedNft?: NFT | null;
  refreshVideos?: () => void;
  addNewVideo?: (video: any) => void;
}

// NFT Dropdown Component
const NFTSelector = ({
  userNfts,
  selectedNftId,
  onSelectNft,
  getSelectedNft,
}: {
  userNfts: NFT[];
  selectedNftId: string;
  onSelectNft: (id: string) => void;
  getSelectedNft: () => NFT | undefined;
}) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  return (
    <div>
      <label className="block text-white font-medium mb-2">Select NFT</label>
      <div ref={dropdownRef} className="relative">
        {/* Dropdown Header - Shows Selected NFT */}
        <div
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className="flex items-center w-full p-3 bg-gray-700 text-white rounded-lg cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500 hover:bg-gray-600"
          aria-haspopup="listbox"
          aria-expanded={dropdownOpen}
          role="combobox"
        >
          {selectedNftId ? (
            <>
              {getSelectedNft()?.image && (
                <div className="w-10 h-10 rounded overflow-hidden mr-3 flex-shrink-0">
                  <img
                    src={getSelectedNft()?.image}
                    alt={getSelectedNft()?.name || "NFT"}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <div className="flex-1 overflow-hidden">
                <p className="font-medium truncate">
                  {getSelectedNft()?.name || "Unnamed NFT"}
                </p>
                <p className="text-xs text-gray-400 truncate">
                  ID: {selectedNftId}
                </p>
              </div>
            </>
          ) : (
            <span className="text-gray-400">Select an NFT</span>
          )}
          <svg
            className={`w-5 h-5 text-gray-400 ml-2 transform transition-transform duration-200 ${dropdownOpen ? "rotate-180" : ""}`}
            fill="currentColor"
            viewBox="0 0 20 20"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
              clipRule="evenodd"
            ></path>
          </svg>
        </div>

        {/* Dropdown Options */}
        {dropdownOpen && (
          <div
            className="absolute z-10 w-full mt-1 bg-gray-700 rounded-lg shadow-lg max-h-60 overflow-y-auto"
            role="listbox"
          >
            {userNfts.map((nft, index) => {
              const nftId = nft.mint || nft.id || `nft-${index}`;
              const displayName = nft.name || `NFT #${index + 1}`;
              const isSelected = nftId === selectedNftId;

              return (
                <div
                  key={nftId}
                  onClick={() => {
                    onSelectNft(nftId);
                    setDropdownOpen(false);
                  }}
                  className={`flex items-center p-3 cursor-pointer hover:bg-gray-600 ${
                    isSelected ? "bg-indigo-600" : ""
                  }`}
                  role="option"
                  aria-selected={isSelected}
                >
                  {nft.image && (
                    <div className="w-10 h-10 rounded overflow-hidden mr-3 flex-shrink-0">
                      <img
                        src={nft.image}
                        alt={displayName}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div className="flex-1 overflow-hidden">
                    <p
                      className={`font-medium truncate ${isSelected ? "text-white" : "text-gray-200"}`}
                    >
                      {displayName}
                    </p>
                    <p
                      className={`text-xs truncate ${isSelected ? "text-gray-200" : "text-gray-400"}`}
                    >
                      ID: {nftId}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

// Prompt Input Component with validation
const PromptInput = ({
  value,
  onChange,
  error,
}: {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  error?: string;
}) => {
  return (
    <div>
      <label className="block text-white font-medium mb-2">Prompt</label>
      <textarea
        value={value}
        onChange={onChange}
        placeholder="Describe what you want in the video (e.g., 'My character exploring a neon cyberpunk city at night')"
        className={`w-full bg-gray-700 text-white p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[120px] resize-y ${
          error ? "border border-red-500" : ""
        }`}
        aria-invalid={!!error}
        aria-describedby={error ? "prompt-error" : undefined}
      />
      {error ? (
        <p id="prompt-error" className="text-red-400 text-sm mt-1">
          {error}
        </p>
      ) : (
        <p className="text-gray-400 text-sm mt-1">
          Be descriptive about the scene, environment, actions, and mood you
          want in your video.
        </p>
      )}
    </div>
  );
};

// Result Display Component
const GenerationResult = ({
  result,
}: {
  result: {
    success: boolean;
    message: string;
    videoId?: string;
  } | null;
}) => {
  if (!result) return null;

  return (
    <div
      className={`p-4 rounded-lg ${
        result.success
          ? "bg-green-900/50 border border-green-600"
          : "bg-red-900/50 border border-red-600"
      }`}
      role="alert"
    >
      <p className={result.success ? "text-green-300" : "text-red-300"}>
        {result.message}
      </p>
      {result.success && result.videoId && (
        <p className="text-gray-300 text-sm mt-2">Video ID: {result.videoId}</p>
      )}
    </div>
  );
};

// Empty State Component
const EmptyState = () => (
  <div className="text-center py-8">
    <p className="text-gray-400 mb-4">
      No Proxim8 NFTs found in your wallet. You need to own at least one Proxim8
      NFT to generate videos.
    </p>
    <a
      href="/nfts"
      className="inline-block bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg"
    >
      View NFT Collection
    </a>
  </div>
);

/**
 * Main Form component for generating a new video from an NFT and prompt
 */
const VideoGenerationForm: React.FC<VideoGenerationFormProps> = ({
  userNfts,
  onGenerationComplete,
  preselectedNft,
  refreshVideos,
  addNewVideo,
}) => {
  // Form state
  const [promptText, setPromptText] = useState<string>("");
  const [promptError, setPromptError] = useState<string>("");
  const [selectedNftId, setSelectedNftId] = useState<string>(
    preselectedNft?.id ||
      preselectedNft?.mint ||
      (userNfts.length > 0 ? userNfts[0].id || userNfts[0].mint || "" : "")
  );

  // Processing state
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generationResult, setGenerationResult] = useState<{
    success: boolean;
    message: string;
    videoId?: string;
  } | null>(null);

  // Get refreshVideos from the useVideoPolling hook
  const { refreshVideos: useVideoPollingRefreshVideos } = useVideoPolling({
    connected: true,
    isAuthenticated: true,
  });

  // Update selectedNftId if preselectedNft changes
  useEffect(() => {
    if (preselectedNft?.id || preselectedNft?.mint) {
      // Use the most reliable ID we have for the NFT
      const nftId = preselectedNft.id || preselectedNft.mint;
      setSelectedNftId(nftId || "");
    }
  }, [preselectedNft]);

  // Helper function to get selected NFT object
  const getSelectedNft = useCallback(() => {
    if (
      preselectedNft?.id === selectedNftId ||
      preselectedNft?.mint === selectedNftId
    ) {
      return preselectedNft;
    }
    return userNfts.find(
      (nft) => nft.id === selectedNftId || nft.mint === selectedNftId
    );
  }, [preselectedNft, selectedNftId, userNfts]);

  // Handle prompt change with validation
  const handlePromptChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const value = e.target.value;
      setPromptText(value);

      // Clear error when user types
      if (promptError) {
        setPromptError("");
      }
    },
    [promptError]
  );

  // Form validation
  const validateForm = useCallback(() => {
    let isValid = true;

    // Validate prompt
    if (!promptText.trim()) {
      setPromptError("Please enter a prompt for your video");
      isValid = false;
    } else if (promptText.trim().length < 10) {
      setPromptError(
        "Please provide a more detailed prompt (at least 10 characters)"
      );
      isValid = false;
    }

    return isValid;
  }, [promptText]);

  // Handle generate video
  const handleGenerateVideo = async (event: React.FormEvent) => {
    event.preventDefault();

    // Validate form before submission
    if (!validateForm()) {
      return;
    }

    setGenerating(true);
    setError(null);
    setGenerationResult(null);

    try {
      // Call the real API
      const result = await generateVideo(selectedNftId, promptText);

      // Immediately add new video to local state for instant UI feedback
      if (addNewVideo) {
        addNewVideo(result);
      }

      // Also refresh videos to ensure we have the latest data
      if (refreshVideos) {
        refreshVideos();
      }

      setGenerationResult({
        success: true,
        message:
          "Video generation started successfully! You'll receive a notification when it's ready.",
        videoId: result.id,
      });

      // Call the callback if provided
      if (onGenerationComplete) {
        onGenerationComplete();
      }

      // Reset form after successful submission
      setPromptText("");
    } catch (error) {
      console.error("Error generating video:", error);

      if (error instanceof ValidationError) {
        // Handle validation errors specifically
        setPromptError(error.message);
      } else {
        // Handle general errors
        setGenerationResult({
          success: false,
          message: `Error generating video: ${error instanceof Error ? error.message : "Unknown error"}`,
        });
      }
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="bg-gray-800 rounded-lg p-6">
      {userNfts.length > 0 ? (
        <form onSubmit={handleGenerateVideo} className="space-y-6">
          {/* NFT Selector Component */}
          <NFTSelector
            userNfts={userNfts}
            selectedNftId={selectedNftId}
            onSelectNft={setSelectedNftId}
            getSelectedNft={getSelectedNft}
          />

          {/* Prompt Input Component */}
          <PromptInput
            value={promptText}
            onChange={handlePromptChange}
            error={promptError}
          />

          {/* Generate Button */}
          <div>
            <button
              type="submit"
              disabled={generating || !selectedNftId || !promptText.trim()}
              className={`w-full py-3 rounded-lg font-medium ${
                generating || !selectedNftId || !promptText.trim()
                  ? "bg-gray-600 cursor-not-allowed"
                  : "bg-indigo-600 hover:bg-indigo-700"
              } text-white transition-colors`}
              aria-busy={generating}
            >
              {generating ? "Generating..." : "Generate Video"}
            </button>
          </div>

          {/* Error Display */}
          {error && (
            <div
              className="bg-red-900/50 border border-red-600 p-3 rounded-lg"
              role="alert"
            >
              <p className="text-red-300">{error}</p>
            </div>
          )}

          {/* Generation Result Component */}
          <GenerationResult result={generationResult} />
        </form>
      ) : (
        <EmptyState />
      )}
    </div>
  );
};

// Export a memoized version of the component
export default React.memo(VideoGenerationForm);
