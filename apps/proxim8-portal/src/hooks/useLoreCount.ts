"use client";

import { useState, useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useNftStore } from "@/stores/nftStore";
import { useWalletAuthStore } from "@/stores/walletAuthStore";
import { getBatchAvailableLore } from "@/services/lore";

export function useLoreCount() {
  const { publicKey } = useWallet();
  const userNfts = useNftStore((state) => state.userNfts);
  const { connected, walletAddress } = useWalletAuthStore();
  const [unclaimedCount, setUnclaimedCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLoreCounts = async () => {
      // Use publicKey from useWallet for desktop, or walletAddress from auth store for mobile
      const effectiveWalletAddress = publicKey?.toString() || walletAddress;

      if (!effectiveWalletAddress || userNfts.length === 0) {
        setUnclaimedCount(0);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        // Extract NFT IDs for batch request
        const nftIds = userNfts
          .map((nft) => nft.tokenId || nft.id)
          .filter(Boolean);

        if (nftIds.length === 0) {
          setUnclaimedCount(0);
          setLoading(false);
          return;
        }

        // Single batch request instead of n individual requests
        const batchResults = await getBatchAvailableLore(nftIds);

        // Calculate total unclaimed count
        const totalUnclaimed = Object.values(batchResults).reduce(
          (sum, result) => sum + (result.unclaimedCount || 0),
          0
        );

        setUnclaimedCount(totalUnclaimed);
      } catch (error) {
        console.error("Error fetching lore counts:", error);
        setUnclaimedCount(0);
      } finally {
        setLoading(false);
      }
    };

    fetchLoreCounts();

    // Increased interval from 30s to 60s to reduce server load
    const interval = setInterval(fetchLoreCounts, 60000);

    return () => clearInterval(interval);
  }, [publicKey, walletAddress, userNfts]);

  return { unclaimedCount, loading };
}
