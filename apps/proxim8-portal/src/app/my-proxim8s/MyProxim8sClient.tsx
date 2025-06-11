"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Proxim8Card from "@/components/nft/Proxim8Card";
import { useNFTs } from "@/hooks/useNFTs";
import { useNftStore } from "@/stores/nftStore";
import { useBatchLoreStatus } from "@/hooks/useBatchLoreStatus";
import { NFTMetadata } from "@/types/nft";
import { useAnalytics } from "@/hooks/useAnalytics";

interface MyProxim8sClientProps {
  initialUserNFTs: NFTMetadata[];
}

export default function MyProxim8sClient({
  initialUserNFTs,
}: MyProxim8sClientProps) {
  const router = useRouter();
  const { track } = useAnalytics();
  const [displayedNfts, setDisplayedNfts] = useState<NFTMetadata[]>([]);
  // Use a deterministic background number based on the initial NFTs to avoid hydration mismatch
  const backgroundNumber = useMemo(() => {
    // Use the length of initial NFTs to deterministically select a background
    // This ensures the same value on server and client
    const seed = initialUserNFTs.length || 0;
    return (seed % 19) + 1;
  }, [initialUserNFTs]);
  const { setUserNfts } = useNftStore();

  const {
    nfts: walletNfts,
    loading: walletNftsLoading,
    error: walletNftsError,
    refetch,
    connected,
    publicKey,
  } = useNFTs(initialUserNFTs);

  // Get lore statuses for sorting and status display
  const { loreStatuses } = useBatchLoreStatus();

  // Sort NFTs to prioritize those with unclaimed lore and calculate lore stats
  const { sortedNfts, loreStats } = useMemo(() => {
    if (!displayedNfts || displayedNfts.length === 0) {
      return { sortedNfts: [], loreStats: { withLore: 0, totalLoreCount: 0 } };
    }

    // Calculate lore statistics first
    let withLore = 0;
    let totalLoreCount = 0;
    
    displayedNfts.forEach(nft => {
      const nftKey = nft.tokenId || nft.id;
      const loreStatus = loreStatuses[nftKey] || { hasUnclaimedLore: false, unclaimedCount: 0 };
      if (loreStatus.hasUnclaimedLore) {
        withLore++;
        totalLoreCount += loreStatus.unclaimedCount;
      }
    });

    // Sort NFTs: those with lore first, then by lore count (highest first)
    const sorted = [...displayedNfts].sort((a, b) => {
      const aKey = a.tokenId || a.id;
      const bKey = b.tokenId || b.id;
      const aLoreStatus = loreStatuses[aKey] || { hasUnclaimedLore: false, unclaimedCount: 0 };
      const bLoreStatus = loreStatuses[bKey] || { hasUnclaimedLore: false, unclaimedCount: 0 };

      // Primary sort: those with lore first
      if (aLoreStatus.hasUnclaimedLore !== bLoreStatus.hasUnclaimedLore) {
        return bLoreStatus.hasUnclaimedLore ? 1 : -1;
      }

      // Secondary sort: higher lore count first (for those that both have lore)
      if (aLoreStatus.hasUnclaimedLore && bLoreStatus.hasUnclaimedLore) {
        return bLoreStatus.unclaimedCount - aLoreStatus.unclaimedCount;
      }

      // Maintain original order for NFTs without lore
      return 0;
    });

    // Debug logging for development
    if (process.env.NODE_ENV === 'development' && displayedNfts.length > 0) {
      console.log('[MyProxim8sClient] Lore sorting results:', {
        totalNfts: displayedNfts.length,
        withLore,
        totalLoreCount,
        sortedOrder: sorted.slice(0, 5).map(nft => ({
          id: nft.tokenId || nft.id,
          name: nft.name,
          hasLore: loreStatuses[nft.tokenId || nft.id]?.hasUnclaimedLore || false,
          loreCount: loreStatuses[nft.tokenId || nft.id]?.unclaimedCount || 0
        }))
      });
    }

    return {
      sortedNfts: sorted,
      loreStats: { withLore, totalLoreCount }
    };
  }, [displayedNfts, loreStatuses]);

  // Debug log to track the connected state issue on mobile (remove in production)
  // console.log("[MyProxim8sClient] State debug:", {
  //   connected,
  //   publicKey,
  //   walletNftsLoading,
  //   walletNftsLength: walletNfts?.length || 0,
  //   hasInitialData: initialUserNFTs?.length || 0,
  // });

  useEffect(() => {
    if (walletNfts && walletNfts.length > 0) {
      setUserNfts(walletNfts);
      setDisplayedNfts(walletNfts);
    } else if (!walletNftsLoading && connected) {
      setDisplayedNfts([]);
      setUserNfts([]);
    }
  }, [walletNfts, setUserNfts, walletNftsLoading, connected]);

  useEffect(() => {
    if (connected && publicKey) {
      refetch();
    } else {
      setDisplayedNfts(initialUserNFTs);
      setUserNfts(initialUserNFTs);
    }
  }, [connected, publicKey, refetch, initialUserNFTs, setUserNfts]);

  return (
    <div className="min-h-screen bg-black text-gray-200 relative overflow-hidden pt-24">
      {/* Background Image with vignette */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-30"
        style={{
          backgroundImage: `url('/background-${backgroundNumber}.png')`,
        }}
      />

      {/* Vignette Overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 0%, transparent 40%, rgba(0,0,0,0.6) 100%)",
        }}
      />

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-12">
          <h1 className="font-orbitron text-4xl font-bold mb-4">
            YOUR PROXIM8 AGENTS
          </h1>
          <p className="font-space-mono text-base font-medium text-gray-300 max-w-3xl">
            Each Proxim8 is a unique AI consciousness from 2089, sent back to
            help alter the timeline. View their memories, analyze their
            capabilities, and prepare them for critical missions.
          </p>
        </div>

        {/* Status bar */}
        <div className="bg-gray-900/60 backdrop-blur-sm border border-gray-700/50 rounded-lg p-4 mb-8">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="font-space-mono text-sm">
              <span className="text-gray-400">AGENTS DETECTED: </span>
              <span className="text-primary-500 font-bold">
                {displayedNfts.length}
              </span>
            </div>
            <div className="font-space-mono text-sm">
              <span className="text-gray-400">LORE AVAILABLE: </span>
              <span className={`font-bold ${loreStats.withLore > 0 ? 'text-accent-blue' : 'text-gray-500'}`}>
                {loreStats.withLore > 0 ? (
                  <>
                    {loreStats.withLore} AGENT{loreStats.withLore !== 1 ? 'S' : ''} 
                    <span className="text-primary-500 ml-1">
                      ({loreStats.totalLoreCount} FRAGMENT{loreStats.totalLoreCount !== 1 ? 'S' : ''})
                    </span>
                  </>
                ) : (
                  'NONE'
                )}
              </span>
            </div>
            <div className="font-space-mono text-sm">
              <span className="text-gray-400">TIMELINE STATUS: </span>
              <span className="text-red-400 font-bold">CRITICAL</span>
            </div>
          </div>
        </div>

        {/* Loading state */}
        {walletNftsLoading && (
          <div className="flex justify-center items-center py-20">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500 mb-4 mx-auto"></div>
              <p className="font-space-mono text-sm text-gray-400">
                SCANNING TIMELINE FOR AGENTS...
              </p>
            </div>
          </div>
        )}

        {/* Error state */}
        {walletNftsError && (
          <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-6 text-center">
            <p className="font-space-mono text-red-400 mb-4">
              {walletNftsError}
            </p>
            <button
              onClick={() => {
                track('retry_scan_clicked', { error: walletNftsError });
                refetch();
              }}
              className="font-space-mono px-6 py-2 bg-red-500/20 border border-red-500/50 rounded hover:bg-red-500/30 transition-all text-red-400"
            >
              RETRY SCAN
            </button>
          </div>
        )}

        {/* Not connected state */}
        {!connected && !walletNftsLoading && (
          <div className="bg-gray-900/60 backdrop-blur-sm border border-gray-700/50 rounded-lg p-12 text-center">
            <h3 className="font-orbitron text-2xl font-bold text-primary-500 mb-4">
              AUTHENTICATION REQUIRED
            </h3>
            <p className="font-space-mono text-base text-gray-300 mb-6">
              Connect your wallet to access your Proxim8 agents and begin
              timeline operations.
            </p>
            <button
              onClick={() => {
                track('return_to_portal_clicked', { from_page: 'my_proxim8s' });
                router.push("/");
              }}
              className="font-space-mono px-8 py-3 bg-primary-500/20 border border-primary-500/50 rounded hover:bg-primary-500/30 hover:border-primary-500 transition-all text-primary-500"
            >
              RETURN TO PORTAL
            </button>
          </div>
        )}

        {/* Empty state */}
        {connected && !walletNftsLoading && displayedNfts.length === 0 && (
          <div className="bg-gray-900/60 backdrop-blur-sm border border-gray-700/50 rounded-lg p-12 text-center">
            <h3 className="font-orbitron text-2xl font-bold text-gray-500 mb-4">
              NO AGENTS DETECTED
            </h3>
            <p className="font-space-mono text-base text-gray-400 mb-6">
              Your wallet contains no Proxim8 agents. Acquire agents to begin
              altering the timeline.
            </p>
            <button
              onClick={() => {
                track('acquire_agents_clicked', { 
                  from_page: 'my_proxim8s_empty_state',
                  has_wallet_connected: connected
                });
                window.open("https://launchmynft.io/sol/16033", "_blank");
              }}
              className="font-space-mono px-8 py-3 bg-primary-500/80 text-white border border-primary-400/50 rounded hover:bg-primary-500 hover:border-primary-400 transition-all"
            >
              ACQUIRE AGENTS
            </button>
          </div>
        )}

        {/* NFT Grid */}
        {displayedNfts.length > 0 && (
          <div>
            {/* Visual indicator for lore-enabled agents */}
            {loreStats.withLore > 0 && (
              <div className="mb-6 bg-accent-blue/10 border border-accent-blue/30 rounded-lg p-4">
                <p className="font-space-mono text-sm text-accent-blue mb-2">
                  ⚡ PRIORITY AGENTS - LORE AVAILABLE
                </p>
                <p className="font-space-mono text-xs text-gray-300">
                  Agents with recovered memory fragments are displayed first. Claim their lore to unlock critical timeline intelligence.
                </p>
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {sortedNfts.map((nft: NFTMetadata, index: number) => (
                <Proxim8Card
                  key={nft.tokenId || `nft-${index}`}
                  tokenId={nft.tokenId}
                  name={nft.name || `Proxim8 #${index + 1}`}
                  mint={nft.mint}
                  id={nft.id}
                  collection={nft.collection}
                  image={nft.image || ""}
                  description={nft.description}
                  attributes={nft.attributes}
                  owner={nft.owner}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
