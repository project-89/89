"use client";

import { useState, useEffect, useCallback } from "react";
import { LoreReward } from "../../types";
import { getUserNftLore, claimReward } from "../../services/lore";
import {
  useWalletAuth,
  useWalletAuthStore,
} from "../../stores/walletAuthStore";
import { toast } from "react-toastify";
import { getNFTsByWallet } from "../../services/nft";

interface LoreDisplayProps {
  initialLoreRewards?: LoreReward[];
  initialNfts?: any[];
}

/**
 * A component to display all lore associated with the user's NFTs
 * with filters for available vs claimed lore
 */
export default function LoreDisplay({
  initialLoreRewards = [],
  initialNfts = [],
}: LoreDisplayProps) {
  const [userLore, setUserLore] = useState<LoreReward[]>(initialLoreRewards);
  const [loading, setLoading] = useState(initialLoreRewards.length === 0);
  const [claimingId, setClaimingId] = useState<string | null>(null);
  const [showClaimed, setShowClaimed] = useState(false);
  const { connected, walletAddress } = useWalletAuthStore();
  const { isAuthenticated, isLoading: authLoading } = useWalletAuth();
  const [nfts, setNfts] = useState<any[]>(initialNfts);

  // Memoize fetchLore to prevent unnecessary recreation
  const fetchLore = useCallback(async () => {
    if (!connected || !walletAddress) {
      console.log("[LoreDisplay] Not connected or missing wallet address");
      return;
    }

    // If we already have data from server-side props, don't fetch again
    if (initialLoreRewards.length > 0 && initialNfts.length > 0) {
      console.log("[LoreDisplay] Using server-provided initial data");
      return;
    }

    setLoading(true);
    console.log(`[LoreDisplay] Fetching lore for wallet: ${walletAddress}`);

    try {
      // Fetch NFTs first (this is a public endpoint)
      const userNfts = await getNFTsByWallet(walletAddress);
      setNfts(userNfts);

      // Only fetch user lore if authenticated (requires JWT)
      if (isAuthenticated) {
        console.log("[LoreDisplay] User is authenticated, fetching lore data");
        const loreData = await getUserNftLore();
        console.log(
          `[LoreDisplay] Fetched ${loreData.length} lore items and ${userNfts.length} NFTs`
        );
        setUserLore(loreData);
      } else {
        console.log(
          "[LoreDisplay] User not authenticated, skipping lore fetch"
        );
        setUserLore([]);
      }
    } catch (error) {
      console.error("[LoreDisplay] Error fetching lore:", error);
      // Better error handling with specific error message
      setTimeout(() => {
        // Ensure toast is called after current render cycle
        if (error instanceof Error) {
          toast.error(`Failed to load lore: ${error.message}`);
        } else {
          toast.error("Failed to load lore for your NFTs");
        }
      }, 0);
    } finally {
      setLoading(false);
    }
  }, [
    connected,
    walletAddress,
    isAuthenticated,
    initialLoreRewards.length,
    initialNfts.length,
  ]);

  // Handle claiming lore
  const handleClaimLore = useCallback(
    async (loreId: string, nftId?: string) => {
      if (!connected || !walletAddress) {
        toast.error("Please connect your wallet to claim lore");
        return;
      }

      if (!isAuthenticated) {
        toast.error("Please log in to claim lore");
        return;
      }

      setClaimingId(loreId);
      console.log(
        `[LoreDisplay] Starting claim for lore ${loreId}, NFT ${nftId || "unknown"}`
      );

      try {
        console.log(
          `[LoreDisplay] Claiming lore ${loreId} for NFT ${nftId || "unknown"}`
        );
        const result = await claimReward(loreId, nftId);
        console.log("[LoreDisplay] Claim result:", result);

        // If we get a non-null result or there's no error thrown, consider it successful
        toast.success("Lore claimed successfully!");

        // Update the claimed status in the local state immediately
        setUserLore((prevLore) =>
          prevLore.map((item) =>
            item.id === loreId
              ? {
                  ...item,
                  claimed: true,
                  claimedAt: new Date().toISOString(),
                }
              : item
          )
        );

        // No need for full page refresh - we've already updated the local state
      } catch (error) {
        console.error("[LoreDisplay] Error claiming lore:", error);
        setTimeout(() => {
          // Ensure toast is called after current render cycle
          if (error instanceof Error) {
            toast.error(`Failed to claim: ${error.message}`);
          } else {
            toast.error("Failed to claim lore. Please try again.");
          }
        }, 0);
      } finally {
        setClaimingId(null);
      }
    },
    [connected, walletAddress, isAuthenticated]
  );

  // Trigger fetch when component mounts or wallet/auth changes
  useEffect(() => {
    if (connected && walletAddress && !authLoading) {
      fetchLore();
    }
  }, [connected, walletAddress, isAuthenticated, authLoading, fetchLore]);

  // Filter lore based on claimed status
  const filteredLore = userLore.filter((lore) =>
    showClaimed ? lore.claimed : !lore.claimed
  );

  // Handle filter button clicks
  const showAvailableLore = () => setShowClaimed(false);
  const showClaimedLore = () => setShowClaimed(true);

  // Calculate counts once
  const availableCount = userLore.filter((lore) => !lore.claimed).length;
  const claimedCount = userLore.filter((lore) => lore.claimed).length;

  if (!connected) {
    return (
      <div className="bg-gray-800 rounded-lg p-6 mb-8">
        <p className="text-gray-400">
          Connect your wallet to view lore for your Proxim8
        </p>
      </div>
    );
  }

  if (authLoading || loading) {
    return (
      <div className="bg-gray-800 rounded-lg p-6 mb-8">
        <div className="animate-pulse flex flex-col space-y-4">
          <div className="h-10 bg-gray-700 rounded w-3/4"></div>
          <div className="h-24 bg-gray-700 rounded"></div>
          <div className="h-10 bg-gray-700 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="bg-gray-800 rounded-lg p-6 mb-8">
        <p className="text-gray-400">
          Please log in to view and claim lore for your Proxim8 NFTs
        </p>
        <div className="mt-4">
          <p className="text-sm text-gray-500">
            You have {nfts.length} Proxim8 NFT{nfts.length !== 1 ? "s" : ""} in
            your wallet
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-lg p-6 mb-8">
      {/* Filter buttons */}
      <div className="flex mb-6">
        <button
          onClick={showAvailableLore}
          className={`mr-2 px-4 py-2 text-sm font-medium rounded-md ${
            !showClaimed
              ? "bg-indigo-600 text-white"
              : "bg-gray-700 text-gray-300 hover:bg-gray-600"
          }`}
        >
          Available ({availableCount})
        </button>
        <button
          onClick={showClaimedLore}
          className={`px-4 py-2 text-sm font-medium rounded-md ${
            showClaimed
              ? "bg-indigo-600 text-white"
              : "bg-gray-700 text-gray-300 hover:bg-gray-600"
          }`}
        >
          Claimed ({claimedCount})
        </button>
      </div>

      {filteredLore.length === 0 ? (
        <div className="bg-gray-700 rounded-lg p-4 text-center">
          <p className="text-gray-400">
            {showClaimed
              ? "You haven't claimed any lore yet."
              : "No available lore found for your NFTs. Check back later!"}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredLore.map((lore) => (
            <div
              key={lore.id}
              className="bg-gray-700 rounded-lg p-4 hover:bg-gray-600 transition-colors"
            >
              {/* Mobile Layout: Vertical stacking */}
              <div className="md:hidden">
                {/* Top: NFT image centered */}
                <div className="flex justify-center mb-4">
                  <div className="h-24 w-24 rounded-lg overflow-hidden bg-gray-600 relative">
                    <img
                      src={
                        nfts.find((nft) => {
                          if (nft.name === lore.title) {
                            return nft.image;
                          }
                          return false;
                        })?.image
                      }
                      alt={lore.title || "NFT"}
                      className="w-full h-full object-cover"
                      onError={() => {}}
                    />
                  </div>
                </div>

                {/* Middle: Name and content centered */}
                <div className="text-center mb-4">
                  <div className="flex items-center justify-center mb-2">
                    <h4 className="font-semibold text-white mr-2">
                      {lore.title}
                    </h4>
                    {lore.background && (
                      <span className="text-xs px-2 py-0.5 rounded bg-purple-600 text-white">
                        {lore.background.replace(/_/g, " ")}
                      </span>
                    )}
                  </div>
                  <div className="text-gray-300 text-sm">
                    {lore.type !== "image" && lore.content ? (
                      lore.content.length > 150 ? (
                        `${lore.content.substring(0, 150)}...`
                      ) : (
                        lore.content
                      )
                    ) : (
                      <span className="italic text-gray-400">
                        Image content
                      </span>
                    )}
                  </div>
                </div>

                {/* Bottom: Claim button full width */}
                <div className="w-full">
                  {lore.claimed && lore.claimedAt ? (
                    <div className="w-full bg-green-600/20 border border-green-500 rounded-md p-3 text-center">
                      <div className="text-green-400 font-medium mb-1">
                        ✓ Claimed
                      </div>
                      <div className="text-gray-400 text-xs">
                        {new Date(lore.claimedAt).toLocaleDateString()}
                      </div>
                    </div>
                  ) : (
                    <button
                      className={`w-full py-3 text-sm font-medium rounded-md transition-colors
                        ${
                          claimingId === lore.id
                            ? "bg-gray-500 cursor-not-allowed"
                            : "bg-indigo-600 hover:bg-indigo-700 text-white"
                        }`}
                      onClick={() => {
                        console.log("Claiming lore:", lore.id, lore);
                        handleClaimLore(lore.id, lore.nftId);
                      }}
                      disabled={claimingId === lore.id}
                    >
                      {claimingId === lore.id ? "Claiming..." : "Claim Lore"}
                    </button>
                  )}
                </div>
              </div>

              {/* Desktop Layout: Horizontal layout (existing) */}
              <div className="hidden md:flex items-center justify-between">
                {/* NFT Avatar - Exactly like in VideoGenerationForm */}
                <div className="flex-shrink-0">
                  <div className="h-16 w-16 rounded-full overflow-hidden bg-gray-600 relative">
                    <img
                      src={
                        nfts.find((nft) => {
                          if (nft.name === lore.title) {
                            return nft.image;
                          }
                          return false;
                        })?.image
                      }
                      alt={lore.title || "NFT"}
                      className="w-full h-full object-cover"
                      onError={() => {}}
                    />
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 mx-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-white">{lore.title}</h4>
                    <div className="flex items-center">
                      {lore.background && (
                        <span className="text-xs px-2 py-0.5 rounded bg-purple-600 text-white mr-2">
                          {lore.background.replace(/_/g, " ")}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-gray-300 text-sm">
                    {lore.type !== "image" && lore.content ? (
                      lore.content.length > 150 ? (
                        `${lore.content.substring(0, 150)}...`
                      ) : (
                        lore.content
                      )
                    ) : (
                      <span className="italic text-gray-400">
                        Image content
                      </span>
                    )}
                  </div>
                </div>

                {/* Claim button or claimed status */}
                <div className="flex-shrink-0">
                  {lore.claimed && lore.claimedAt ? (
                    <div className="text-gray-400 text-xs">
                      Claimed on {new Date(lore.claimedAt).toLocaleDateString()}
                    </div>
                  ) : (
                    <button
                      className={`px-4 py-2 text-sm font-medium rounded-md 
                        ${
                          claimingId === lore.id
                            ? "bg-gray-500 cursor-not-allowed"
                            : "bg-indigo-600 hover:bg-indigo-700 text-white"
                        }`}
                      onClick={() => {
                        console.log("Claiming lore:", lore.id, lore);
                        handleClaimLore(lore.id, lore.nftId);
                      }}
                      disabled={claimingId === lore.id}
                    >
                      {claimingId === lore.id ? "Claiming..." : "Claim Lore"}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
