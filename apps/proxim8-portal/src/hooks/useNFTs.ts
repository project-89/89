import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getNFTById, getNFTsByWallet } from "@/services/nft";
import { useCallback, useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletAuthStore } from "@/stores/walletAuthStore";
import { NFTMetadata } from "@/types/nft";
import { ApiError } from "@/types/error";

/**
 * Query key factory for NFT-related queries
 * Provides consistent keys for React Query cache management
 */
export const NFT_KEYS = {
  all: ["nfts"] as const,
  lists: () => [...NFT_KEYS.all, "list"] as const,
  list: (filters: string) => [...NFT_KEYS.lists(), filters] as const,
  walletList: (address: string | undefined) =>
    [...NFT_KEYS.lists(), address || "anonymous"] as const,
  details: () => [...NFT_KEYS.all, "detail"] as const,
  detail: (id: string | undefined) =>
    [...NFT_KEYS.details(), id || "unknown"] as const,
};

/**
 * Custom hook for fetching NFTs owned by the connected wallet
 * Uses React Query for efficient data fetching and caching
 *
 * @param initialData Optional initial data to use while loading
 * @returns Query result with NFTs, loading state, and error information
 */
export function useWalletNFTs(initialData: NFTMetadata[] = []) {
  const { publicKey, connected } = useWallet();
  const queryClient = useQueryClient();

  // Invalidate NFT cache when wallet connection changes
  useEffect(() => {
    if (publicKey) {
      queryClient.invalidateQueries({
        queryKey: NFT_KEYS.walletList(publicKey.toBase58()),
      });
    }
  }, [connected, publicKey, queryClient]);

  return useQuery({
    queryKey: NFT_KEYS.walletList(publicKey?.toBase58()),
    queryFn: async () => {
      if (!publicKey || !connected) return initialData;
      try {
        // The API call will automatically include wallet address
        return await getNFTsByWallet(publicKey.toBase58());
      } catch (error) {
        console.error("[useWalletNFTs] Error fetching NFTs:", error);
        if (error instanceof ApiError) {
          throw error;
        }
        throw new ApiError({
          status: 500,
          message:
            error instanceof Error ? error.message : "Failed to fetch NFTs",
          error: error instanceof Error ? error : undefined,
        });
      }
    },
    enabled: !!publicKey && connected,
    staleTime: 60 * 1000, // 1 minute
    // Default state for success condition, prevents loading flicker
    placeholderData: initialData,
    // Retry failed NFT fetches to ensure we get data
    retry: 2,
    retryDelay: 1000,
  });
}

/**
 * Custom hook for fetching a single NFT by ID
 * Handles both authenticated and public access
 *
 * @param nftId The ID of the NFT to fetch
 * @param initialData Optional initial data to use while loading
 * @returns Query result with NFT details, loading state, and error information
 */
export function useNFTDetails(
  nftId: string | undefined,
  initialData: NFTMetadata | null = null
) {
  const { publicKey, connected } = useWallet();

  const fetchNFT = useCallback(async () => {
    if (!nftId) return initialData;

    try {
      // If wallet is connected, try to fetch with wallet
      if (publicKey && connected) {
        try {
          return await getNFTById(publicKey.toBase58(), nftId);
        } catch (e) {
          console.error("[useNFTDetails] Error fetching NFT with wallet:", e);
          // Fall back to public access
          return await getNFTById("public", nftId);
        }
      } else {
        // No wallet connected, try to get public NFT data
        return await getNFTById("public", nftId);
      }
    } catch (error) {
      console.error("[useNFTDetails] Error fetching NFT:", error);
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError({
        status: 500,
        message:
          error instanceof Error
            ? error.message
            : "Failed to fetch NFT details",
        error: error instanceof Error ? error : undefined,
      });
    }
  }, [nftId, publicKey, connected, initialData]);

  return useQuery({
    queryKey: NFT_KEYS.detail(nftId),
    queryFn: fetchNFT,
    enabled: !!nftId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    placeholderData: initialData,
    // Retry failed NFT fetches
    retry: 1,
    retryDelay: 1000,
  });
}

/**
 * Custom hook to check if the connected wallet owns a specific NFT
 *
 * @param nftId The ID of the NFT to check ownership for
 * @param initialData Optional initial NFT data to use while loading
 * @returns Object with ownership status, loading state, and NFT data
 */
export function useNFTOwnership(
  nftId: string | undefined,
  initialData: NFTMetadata | null = null
) {
  const { data: nft, isLoading, error } = useNFTDetails(nftId, initialData);
  const { publicKey } = useWallet();

  const isOwner = !!publicKey && !!nft && nft.owner === publicKey.toBase58();

  return {
    isOwner,
    isLoading,
    error,
    nft,
  };
}

/**
 * Custom hook for fetching NFTs with consistent React Query state management
 * This replaces the old useState-based implementation with React Query
 *
 * @param initialData Optional initial data to use while loading
 * @returns Query result with NFTs, refetch function, and state information
 */
export function useNFTs(initialData: NFTMetadata[] = []) {
  const store = useWalletAuthStore();
  const walletAddress = store.user?.walletAddress;
  const isAuthenticated = store.isAuthenticated;
  const isConnected = store.connected; // Or more accurately, store.isAuthenticated for app-level auth

  const result = useQuery({
    queryKey: NFT_KEYS.walletList(walletAddress || undefined),
    queryFn: async () => {
      console.log(
        "[useNFTs] Query function called with walletAddress:",
        walletAddress
      );

      if (!walletAddress) {
        console.log("[useNFTs] No wallet address, returning initial data");
        return initialData;
      }

      try {
        console.log("[useNFTs] Fetching NFTs for wallet:", walletAddress);
        const fetchedNfts = await getNFTsByWallet(walletAddress);
        console.log(
          "[useNFTs] Successfully fetched NFTs:",
          fetchedNfts?.length || 0
        );
        return fetchedNfts || [];
      } catch (error) {
        console.error("[useNFTs] Error fetching NFTs:", error);
        if (error instanceof ApiError) {
          throw error;
        }
        throw new ApiError({
          status: 500,
          message:
            error instanceof Error ? error.message : "Failed to fetch NFTs",
          error: error instanceof Error ? error : undefined,
        });
      }
    },
    enabled: !!walletAddress && isAuthenticated, // Query enabled if authenticated and has address
    staleTime: 60 * 1000, // 1 minute
    placeholderData: initialData,
    retry: 2,
    retryDelay: 1000,
  });

  // Return a backwards-compatible interface
  return {
    nfts: result.data || [],
    loading: result.isLoading,
    error: result.error ? (result.error as ApiError).message : null, // Ensure error is string or null
    refetch: result.refetch,
    // Provide the connection status from our new store
    connected: isAuthenticated, // App considers user "connected" for NFTs if authenticated
    publicKey: walletAddress, // This is the wallet address string
    // Include other React Query properties that don't conflict with our custom ones
    isSuccess: result.isSuccess,
    isError: result.isError,
    isFetching: result.isFetching,
    status: result.status,
    fetchStatus: result.fetchStatus,
    dataUpdatedAt: result.dataUpdatedAt,
  };
}
