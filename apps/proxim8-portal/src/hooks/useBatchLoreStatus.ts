"use client";

import { useState, useEffect, createContext, useContext } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useNftStore } from "@/stores/nftStore";
import { useWalletAuthStore } from "@/stores/walletAuthStore";
import { getBatchAvailableLore } from "@/services/lore";

interface LoreStatus {
  hasUnclaimedLore: boolean;
  unclaimedCount: number;
}

interface BatchLoreContextType {
  loreStatuses: Record<string, LoreStatus>;
  loading: boolean;
  refreshLoreStatuses: () => Promise<void>;
}

const BatchLoreContext = createContext<BatchLoreContextType | null>(null);

export function useBatchLoreStatus() {
  const context = useContext(BatchLoreContext);
  if (!context) {
    throw new Error(
      "useBatchLoreStatus must be used within a BatchLoreProvider"
    );
  }
  return context;
}

export function useBatchLoreProvider() {
  const { publicKey } = useWallet();
  const userNfts = useNftStore((state) => state.userNfts);
  const [loreStatuses, setLoreStatuses] = useState<Record<string, LoreStatus>>(
    {}
  );
  const [loading, setLoading] = useState(true);

  // Use wallet auth store to get the wallet address for mobile compatibility
  const { connected, walletAddress } = useWalletAuthStore();

  const refreshLoreStatuses = async () => {
    // Use publicKey from useWallet for desktop, or walletAddress from auth store for mobile
    const effectiveWalletAddress = publicKey?.toString() || walletAddress;

    if (!effectiveWalletAddress || userNfts.length === 0) {
      setLoreStatuses({});
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
        setLoreStatuses({});
        setLoading(false);
        return;
      }

      // Single batch request for all NFTs
      const batchResults = await getBatchAvailableLore(nftIds);
      setLoreStatuses(batchResults);
    } catch (error) {
      console.error("Error fetching batch lore statuses:", error);
      setLoreStatuses({});
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshLoreStatuses();

    // Poll every 60 seconds
    const interval = setInterval(refreshLoreStatuses, 60000);

    return () => clearInterval(interval);
  }, [publicKey, walletAddress, userNfts]);

  return {
    loreStatuses,
    loading,
    refreshLoreStatuses,
  };
}

export { BatchLoreContext };
