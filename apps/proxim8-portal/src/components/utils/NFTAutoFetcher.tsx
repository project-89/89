"use client";

import { useEffect, useRef } from "react";
import { useWalletAuth } from "@/stores/walletAuthStore";
import { useNFTs } from "@/hooks/useNFTs";
import { useNftStore } from "@/stores/nftStore";

/**
 * NFTAutoFetcher Component
 * 
 * This component runs globally and ensures that NFTs are fetched whenever:
 * 1. User is authenticated
 * 2. NFTs haven't been loaded yet
 * 3. Page is loaded/refreshed
 * 
 * This solves the issue where NFTs are only fetched on the root page,
 * ensuring they're available on any page the user lands on.
 */
export function NFTAutoFetcher() {
  const { isAuthenticated, walletAddress } = useWalletAuth();
  const { nfts, loading: nftsLoading, refetch } = useNFTs();
  const setUserNfts = useNftStore((state) => state.setUserNfts);
  const userNfts = useNftStore((state) => state.userNfts);
  
  // Track if we've already attempted to fetch for this session
  const hasFetchedRef = useRef(false);
  const lastWalletRef = useRef<string | null>(null);

  useEffect(() => {
    // Reset fetch flag if wallet changes
    if (walletAddress !== lastWalletRef.current) {
      hasFetchedRef.current = false;
      lastWalletRef.current = walletAddress;
    }

    // Conditions to fetch NFTs:
    // 1. User is authenticated
    // 2. We have a wallet address
    // 3. We haven't already fetched (or NFT store is empty)
    // 4. Not currently loading
    const shouldFetch = 
      isAuthenticated && 
      walletAddress && 
      (!hasFetchedRef.current || userNfts.length === 0) &&
      !nftsLoading;

    if (shouldFetch) {
      console.log("[NFTAutoFetcher] Fetching NFTs for authenticated user:", walletAddress);
      hasFetchedRef.current = true;
      
      // The useNFTs hook will automatically fetch when enabled
      // We just need to trigger a refetch if needed
      if (nfts.length === 0 && !nftsLoading) {
        refetch();
      }
    }
  }, [isAuthenticated, walletAddress, nftsLoading, userNfts.length, refetch, nfts.length]);

  // Update NFT store whenever NFTs are fetched
  useEffect(() => {
    if (nfts && nfts.length > 0 && isAuthenticated) {
      console.log("[NFTAutoFetcher] Updating NFT store with", nfts.length, "NFTs");
      setUserNfts(nfts);
    }
  }, [nfts, setUserNfts, isAuthenticated]);

  // Also handle the case where user logs out
  useEffect(() => {
    if (!isAuthenticated && userNfts.length > 0) {
      console.log("[NFTAutoFetcher] User logged out, clearing NFT store");
      setUserNfts([]);
      hasFetchedRef.current = false;
    }
  }, [isAuthenticated, userNfts.length, setUserNfts]);

  return null; // This component doesn't render anything
}