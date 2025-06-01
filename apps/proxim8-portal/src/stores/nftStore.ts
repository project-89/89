"use client";

import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { NFTMetadata } from "@/types/nft";
import { useWalletAuthStore } from "./walletAuthStore";
import { QueryObserverResult, useQuery } from "@tanstack/react-query";
import { getNFTsByWallet, getNFT } from "@/services/nft";

interface NFTState {
  // The currently selected NFT for operations like video generation
  selectedNft: NFTMetadata | null;

  // User's owned NFTs
  userNfts: NFTMetadata[];

  // Any filter or sorting state
  filters: {
    collection?: string;
    search?: string;
    sortBy: "name" | "dateAcquired" | "rarity";
    sortDirection: "asc" | "desc";
  };

  // Recently viewed NFTs (limited list)
  recentlyViewed: NFTMetadata[];

  // State for currently generating NFT videos
  generatingNfts: string[]; // Array of NFT IDs

  // Actions
  setSelectedNft: (nft: NFTMetadata | null) => void;
  setUserNfts: (nfts: NFTMetadata[]) => void;
  addRecentlyViewed: (nft: NFTMetadata) => void;
  updateFilters: (filters: Partial<NFTState["filters"]>) => void;
  addGeneratingNft: (nftId: string) => void;
  removeGeneratingNft: (nftId: string) => void;

  // Clear all state (used for logout)
  reset: () => void;
}

// Maximum number of recently viewed NFTs to keep
const MAX_RECENTLY_VIEWED = 10;

// Create the store
export const useNftStore = create<NFTState>()(
  immer((set) => ({
    selectedNft: null,
    userNfts: [],
    filters: {
      sortBy: "dateAcquired",
      sortDirection: "desc",
    },
    recentlyViewed: [],
    generatingNfts: [],

    setSelectedNft: (nft) =>
      set((state) => {
        state.selectedNft = nft;
        return state;
      }),

    setUserNfts: (nfts) =>
      set((state) => {
        state.userNfts = nfts;
        return state;
      }),

    addRecentlyViewed: (nft) =>
      set((state) => {
        // Remove if already exists
        state.recentlyViewed = state.recentlyViewed.filter(
          (item: NFTMetadata) => item.id !== nft.id
        );
        // Add to beginning
        state.recentlyViewed.unshift(nft);
        // Limit list size
        if (state.recentlyViewed.length > MAX_RECENTLY_VIEWED) {
          state.recentlyViewed = state.recentlyViewed.slice(
            0,
            MAX_RECENTLY_VIEWED
          );
        }
        return state;
      }),

    updateFilters: (filters) =>
      set((state) => {
        state.filters = { ...state.filters, ...filters };
        return state;
      }),

    addGeneratingNft: (nftId) =>
      set((state) => {
        if (!state.generatingNfts.includes(nftId)) {
          state.generatingNfts.push(nftId);
        }
        return state;
      }),

    removeGeneratingNft: (nftId) =>
      set((state) => {
        state.generatingNfts = state.generatingNfts.filter(
          (id: string) => id !== nftId
        );
        return state;
      }),

    reset: () =>
      set((state) => {
        state.selectedNft = null;
        state.userNfts = [];
        state.filters = {
          sortBy: "dateAcquired",
          sortDirection: "desc",
        };
        state.recentlyViewed = [];
        state.generatingNfts = [];
        return state;
      }),
  }))
);

/**
 * React hook to fetch NFTs for the current user
 * Uses React Query for caching and optimized fetching
 */
export function useUserNfts(): {
  nfts: NFTMetadata[];
  isLoading: boolean;
  isError: boolean;
  error: unknown;
  refetch: () => Promise<QueryObserverResult<NFTMetadata[], Error>>;
} {
  const isAuthenticated = useWalletAuthStore((state) => state.isAuthenticated);
  const walletAddress = useWalletAuthStore(
    (state) => state.user?.walletAddress
  );

  const {
    data = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["userNfts", walletAddress],
    queryFn: async () => {
      if (!isAuthenticated || !walletAddress) {
        return [];
      }

      return await getNFTsByWallet(walletAddress);
    },
    enabled: isAuthenticated && !!walletAddress,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return { nfts: data, isLoading, isError, error, refetch };
}

/**
 * React hook to fetch a single NFT by ID
 */
export function useNftById(id?: string) {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["nft", id],
    queryFn: async () => {
      if (!id) return null;
      return await getNFT(id);
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return { nft: data, isLoading, isError, error };
}

/**
 * Utility function to find an NFT by ID from the store
 */
export const findNftById = (id: string): NFTMetadata | null => {
  const state = useNftStore.getState();
  return (
    state.userNfts.find(
      (nft: NFTMetadata) => nft.id === id || nft.mint === id
    ) || null
  );
};
