"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Proxim8Card from "@/components/nft/Proxim8Card";
import { useNFTs } from "@/hooks/useNFTs";
import { useNftStore } from "@/stores/nftStore";
import { NFTMetadata } from "@/types/nft";

interface MyProxim8sClientProps {
  initialUserNFTs: NFTMetadata[];
}

export default function MyProxim8sClient({
  initialUserNFTs,
}: MyProxim8sClientProps) {
  const router = useRouter();
  const [displayedNfts, setDisplayedNfts] = useState<NFTMetadata[]>([]);
  const [backgroundNumber] = useState(() => Math.floor(Math.random() * 19) + 1);
  const { setUserNfts } = useNftStore();

  const {
    nfts: walletNfts,
    loading: walletNftsLoading,
    error: walletNftsError,
    refetch,
    connected,
    publicKey,
  } = useNFTs(initialUserNFTs);

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
        <div className="bg-gray-900/60 backdrop-blur-sm border border-gray-700/50 rounded-lg p-4 mb-8 flex items-center justify-between">
          <div className="font-space-mono text-sm">
            <span className="text-gray-400">AGENTS DETECTED: </span>
            <span className="text-primary-500 font-bold">
              {displayedNfts.length}
            </span>
          </div>
          <div className="font-space-mono text-sm">
            <span className="text-gray-400">TIMELINE STATUS: </span>
            <span className="text-red-400 font-bold">CRITICAL</span>
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
              onClick={() => refetch()}
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
              onClick={() => router.push("/")}
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
              onClick={() => window.open("https://launchmynft.io/sol/16033", "_blank")}
              className="font-space-mono px-8 py-3 bg-primary-500/80 text-white border border-primary-400/50 rounded hover:bg-primary-500 hover:border-primary-400 transition-all"
            >
              ACQUIRE AGENTS
            </button>
          </div>
        )}

        {/* NFT Grid */}
        {displayedNfts.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {displayedNfts.map((nft: NFTMetadata, index: number) => (
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
        )}
      </div>
    </div>
  );
}
