"use client";

import { useState, useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useNftStore } from "@/stores/nftStore";
import { getAvailableLoreByNftId } from "@/services/lore";

export function useLoreCount() {
  const { publicKey } = useWallet();
  const userNfts = useNftStore((state) => state.userNfts);
  const [unclaimedCount, setUnclaimedCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLoreCounts = async () => {
      if (!publicKey || userNfts.length === 0) {
        setUnclaimedCount(0);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        let totalUnclaimed = 0;
        
        // Check each NFT for unclaimed lore
        for (const nft of userNfts) {
          const availability = await getAvailableLoreByNftId(nft.tokenId || nft.id);
          if (availability.unclaimedCount > 0) {
            totalUnclaimed += availability.unclaimedCount;
          }
        }
        
        setUnclaimedCount(totalUnclaimed);
      } catch (error) {
        console.error("Error fetching lore counts:", error);
        setUnclaimedCount(0);
      } finally {
        setLoading(false);
      }
    };

    fetchLoreCounts();
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchLoreCounts, 30000);
    
    return () => clearInterval(interval);
  }, [publicKey, userNfts]);

  return { unclaimedCount, loading };
}