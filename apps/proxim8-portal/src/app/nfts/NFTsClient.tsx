"use client";

import { useState, useEffect } from "react";
// import { useWallet } from "@solana/wallet-adapter-react"; // REMOVE THIS
import NFTCardStatic from "@/components/nft/NFTCardStatic";
import { useNFTs } from "@/hooks/useNFTs";
import { useNftStore } from "@/stores/nftStore";
import { NFTMetadata } from "@/types/nft";

interface NFTsClientProps {
  initialUserNFTs: NFTMetadata[];
}

export default function NFTsClient({ initialUserNFTs }: NFTsClientProps) {
  // const { publicKey, connected } = useWallet(); // REMOVE THIS
  const [displayedNfts, setDisplayedNfts] = useState<NFTMetadata[]>([]);
  // isLoading and error will now come from useNFTs primarily
  // const [isLoading, setIsLoading] = useState(false);
  // const [error, setError] = useState<string | null>(null);

  const { setUserNfts } = useNftStore();

  const {
    nfts: walletNfts,
    loading: walletNftsLoading, // Use this for loading state
    error: walletNftsError, // Use this for error state
    refetch,
    connected, // Now from useNFTs (derived from useWalletAuthStore)
    publicKey, // Now from useNFTs (derived from useWalletAuthStore)
  } = useNFTs(initialUserNFTs);

  // Debug logging for useNFTs result
  console.log("[NFTsClient] useNFTs returned:", {
    walletNftsLength: walletNfts?.length || 0,
    walletNftsLoading,
    walletNftsError,
    connected, // Log the value from useNFTs
    publicKey, // Log the value from useNFTs
    displayedNftsLength: displayedNfts?.length || 0,
  });

  useEffect(() => {
    if (walletNfts && walletNfts.length > 0) {
      console.log(
        `[NFTsClient] Storing ${walletNfts.length} NFTs in the store`
      );
      setUserNfts(walletNfts);
      setDisplayedNfts(walletNfts);
    } else if (!walletNftsLoading && connected) {
      // If not loading, connected, but no NFTs
      setDisplayedNfts([]); // Clear displayed NFTs if wallet is empty
      setUserNfts([]);
    }
  }, [walletNfts, setUserNfts, walletNftsLoading, connected]);

  // No longer need separate isLoading and error state management here
  // useEffect(() => {
  //   setIsLoading(walletNftsLoading);
  // }, [walletNftsLoading]);
  //
  // useEffect(() => {
  //   setError(walletNftsError || null);
  // }, [walletNftsError]);

  useEffect(() => {
    if (connected && publicKey) {
      refetch();
    } else {
      setDisplayedNfts(initialUserNFTs); // Show initial if not connected
      setUserNfts(initialUserNFTs); // Also update store with initial if not connected
    }
  }, [connected, publicKey, refetch, initialUserNFTs, setUserNfts]);

  if (!connected) {
    return (
      <div>
        <div className="py-10 text-center">
          <p className="text-lg text-gray-400 mb-4">
            Connect your wallet to view your NFTs
          </p>
        </div>

        {initialUserNFTs.length > 0 && (
          <>
            <h2 className="text-2xl font-bold text-white mb-4">
              Featured NFTs
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 py-6">
              {initialUserNFTs.map((nft: NFTMetadata, index: number) => (
                <NFTCardStatic
                  owner={nft.owner}
                  key={nft.tokenId || `nft-${index}`}
                  tokenId={nft.tokenId}
                  name={nft.name || `NFT #${index + 1}`}
                  mint={nft.mint}
                  id={nft.id}
                  collection={nft.collection}
                  image={nft.image || ""}
                  description={nft.description}
                  attributes={nft.attributes}
                />
              ))}
            </div>
          </>
        )}
      </div>
    );
  }

  if (walletNftsLoading) {
    // Use walletNftsLoading directly
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (walletNftsError) {
    // Use walletNftsError directly
    return (
      <div className="py-10 text-center">
        <p className="text-red-500 mb-4">{walletNftsError}</p>
        <button
          onClick={() => refetch()}
          className="px-4 py-2 bg-indigo-600 rounded text-white"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!displayedNfts || displayedNfts.length === 0) {
    return (
      <div className="py-10 text-center">
        <p className="text-lg text-gray-400 mb-4">
          No Proxim8 NFTs found in your wallet
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 py-6">
      {displayedNfts.map((nft: NFTMetadata, index: number) => (
        <NFTCardStatic
          owner={nft.owner}
          key={nft.tokenId || `nft-${index}`}
          tokenId={nft.tokenId}
          name={nft.name || `NFT #${index + 1}`}
          mint={nft.mint}
          id={nft.id}
          collection={nft.collection}
          image={nft.image || ""}
          description={nft.description}
          attributes={nft.attributes}
        />
      ))}
    </div>
  );
}
