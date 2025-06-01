"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletAuth } from "@/stores/walletAuthStore";
import { useSearchParams } from "next/navigation";
import { getNFTsByWallet, getNFT } from "@/services/nft";

import { useNftStore, findNftById, useUserNfts } from "@/stores/nftStore";
import PipelineVideoGrid from "@/components/videos/PipelineVideoGrid";
import VideoGenerationForm from "@/components/videos/VideoGenerationForm";
// import { NFTMetadata } from "@/types/nft";
import useVideoPolling from "@/hooks/useVideoPolling";
import { NFTMetadata } from "@/types/nft";

interface Props {}

export default function PipelineClient({}: Props) {
  const { publicKey } = useWallet();
  const {
    walletAddress: authWalletAddress,
    connected: authConnected,
    isAuthenticated,
    isAuthenticating,
    authenticate,
  } = useWalletAuth();
  const searchParams = useSearchParams();
  const nftIdFromUrl = searchParams.get("nftId");

  // Get NFT state from the NFT store
  const { selectedNft: storeSelectedNft, setSelectedNft } = useNftStore();

  // Use our custom video polling hook
  const { refreshVideos, addNewVideo } = useVideoPolling({
    connected: authConnected,
    isAuthenticated,
  });

  // State
  const [loadingPreselectedNft, setLoadingPreselectedNft] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isForceAuthenticating, setIsForceAuthenticating] = useState(false);

  // Try to get the NFT from the store or URL
  useEffect(() => {
    const getNftFromStore = async () => {
      // First priority: NFT from the store
      if (storeSelectedNft) {
        console.log("Using selected NFT from store:", storeSelectedNft.name);
        return;
      }

      // Second priority: NFT ID from URL
      if (nftIdFromUrl) {
        console.log("Attempting to find NFT by ID in store:", nftIdFromUrl);

        // Check if it's in the store
        const nftFromStore = findNftById(nftIdFromUrl);

        if (nftFromStore) {
          console.log("Found NFT in store:", nftFromStore.name);
          setSelectedNft(nftFromStore); // Update the store selection
          return;
        }

        // If not in store, fetch from API
        setLoadingPreselectedNft(true);

        try {
          console.log(
            "NFT not found in store, fetching from API:",
            nftIdFromUrl
          );
          const nft = await getNFT(nftIdFromUrl);

          if (!nft) {
            console.log(
              `NFT not found with ID: ${nftIdFromUrl}. Continuing without a selected NFT.`
            );
            setLoadingPreselectedNft(false);
            return;
          }

          console.log("Fetched NFT from API:", nft.name);
          setSelectedNft(nft); // Update the store selection
        } catch (error) {
          console.error("Error fetching NFT:", error);
          console.warn(
            `Will continue without a selected NFT: ${error instanceof Error ? error.message : "Unknown error"}`
          );
        } finally {
          setLoadingPreselectedNft(false);
        }
      }
      // If no NFT is selected, that's fine - the user can select one from the dropdown
    };

    getNftFromStore();
  }, [nftIdFromUrl, storeSelectedNft, findNftById, setSelectedNft]);

  // Fetch user's NFTs using the hook from nftStore
  const {
    nfts: userNfts,
    isLoading: nftsLoading,
    isError: nftsError,
    error: nftsErrorData,
    refetch: refetchNfts,
  } = useUserNfts();

  // Combined loading state
  const isLoadingContent = nftsLoading || loadingPreselectedNft;

  // Force authentication function
  const forceAuthenticate = async () => {
    console.log("[PipelineClient] Forcing authentication");
    try {
      // Set authenticating state
      setIsForceAuthenticating(true);

      // Use the global authentication with force flag
      const success = await authenticate();

      console.log("[PipelineClient] Force authentication result:", success);

      if (success) {
        // If authentication was successful, reactive updates should occur.
        console.log(
          "[PipelineClient] Authentication successful. Expecting reactive updates."
        );
        refetchNfts(); // Optionally refetch NFTs if direct refresh is desired post-auth
      } else {
        console.error("[PipelineClient] Authentication failed");
      }
    } catch (error) {
      console.error("[PipelineClient] Authentication failed:", error);
    } finally {
      setIsForceAuthenticating(false);
    }
  };

  // Handle video generation completion
  const handleGenerationComplete = useCallback(() => {
    // Reset any filters to show all videos, especially the newly created one
    setStatusFilter("all");
  }, []);

  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl">
      {!authConnected && (
        <div className="bg-gradient-to-r from-indigo-900 to-purple-900 rounded-lg p-8 mb-6 text-center shadow-xl">
          <h2 className="text-2xl font-bold mb-4">Connect Your Wallet</h2>
          <p className="mb-6">
            Connect your wallet to generate videos from your Proxim8 NFTs.
          </p>
        </div>
      )}

      {isLoadingContent ? (
        <div className="bg-gray-800 rounded-lg p-6 flex items-center justify-center h-64">
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mb-4"></div>
            <p className="text-white text-lg">Loading...</p>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Video Generation Form */}
          <div>
            <VideoGenerationForm
              userNfts={userNfts}
              onGenerationComplete={handleGenerationComplete}
              preselectedNft={storeSelectedNft}
              refreshVideos={refreshVideos}
              addNewVideo={addNewVideo}
            />
          </div>

          {/* User's Videos Section */}
          {authConnected && (
            <div className="bg-gray-800 rounded-lg p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Your Videos</h2>

                {/* Status filter */}
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-400">Filter:</span>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="bg-gray-700 text-white border border-gray-600 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="all">All</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="PROCESSING">Processing</option>
                    <option value="PENDING">Pending</option>
                    <option value="FAILED">Failed</option>
                  </select>
                </div>
              </div>

              {!isAuthenticated && (
                <div className="bg-indigo-900/30 rounded-lg p-4 mb-4 border border-indigo-500">
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-white">
                      <span className="inline-block mr-2">
                        <svg
                          className="w-5 h-5 text-yellow-400"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                      </span>
                      Your wallet is connected, but we need a signature to
                      authenticate and load your videos.
                    </p>
                  </div>
                  <button
                    onClick={forceAuthenticate}
                    disabled={isForceAuthenticating}
                    className={`bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded w-full flex items-center justify-center ${
                      isForceAuthenticating
                        ? "opacity-75 cursor-not-allowed"
                        : ""
                    }`}
                  >
                    {isForceAuthenticating ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white mr-3"></div>
                        Authenticating...
                      </>
                    ) : (
                      "Sign to Authenticate"
                    )}
                  </button>
                </div>
              )}

              {isAuthenticating && !isForceAuthenticating && (
                <div className="bg-gray-700 rounded-lg p-4 mb-4 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-indigo-500 mr-3"></div>
                  <p className="text-white">Authenticating...</p>
                </div>
              )}

              {/* Use our new VideoGrid component */}
              <PipelineVideoGrid
                connected={authConnected}
                isAuthenticated={isAuthenticated}
                statusFilter={statusFilter}
                refreshVideos={refreshVideos}
                addNewVideo={addNewVideo}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
