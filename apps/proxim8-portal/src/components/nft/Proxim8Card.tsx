"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import NFTImage from "../common/NFTImage";
import { useNftStore } from "@/stores/nftStore";
import { NFTMetadata } from "@/types/nft";
import { useBatchLoreStatus } from "@/hooks/useBatchLoreStatus";
import { useAnalytics } from "@/hooks/useAnalytics";

export default function Proxim8Card({
  tokenId,
  name,
  image,
  description,
  attributes = [],
  mint,
  id,
  collection,
  owner,
}: NFTMetadata) {
  const router = useRouter();
  const { track } = useAnalytics();
  const setSelectedNft = useNftStore((state) => state.setSelectedNft);
  const [isHovered, setIsHovered] = useState(false);
  const { loreStatuses } = useBatchLoreStatus();

  // Get lore status from batch context (no individual API calls!)
  const nftKey = tokenId || id;
  const loreStatus = loreStatuses[nftKey] || { hasUnclaimedLore: false, unclaimedCount: 0 };
  const hasUnclaimedLore = loreStatus.hasUnclaimedLore;
  const loreCount = loreStatus.unclaimedCount;

  // Debug logging for mobile troubleshooting
  if (process.env.NODE_ENV === 'development' && hasUnclaimedLore) {
    console.log(`[Proxim8Card] NFT ${nftKey} has unclaimed lore:`, {
      hasUnclaimedLore,
      loreCount,
      loreStatus,
      allLoreStatuses: Object.keys(loreStatuses).length
    });
  }

  // Extract key attributes
  const personalityAttr = attributes.find(
    (attr) => attr.trait_type?.toLowerCase() === "personality"
  );
  const timelineAttr = attributes.find(
    (attr) => attr.trait_type?.toLowerCase() === "timeline impact"
  );
  const missionReadyAttr = attributes.find(
    (attr) => attr.trait_type?.toLowerCase() === "mission ready"
  );

  const handleCardClick = () => {
    track('proxim8_card_clicked', {
      nft_id: tokenId || id,
      nft_name: name,
      has_unclaimed_lore: hasUnclaimedLore,
      lore_count: loreCount
    });

    const nftData: NFTMetadata = {
      tokenId,
      name,
      image,
      description,
      attributes,
      mint,
      id,
      collection,
      owner,
    };
    setSelectedNft(nftData);
    // Navigate to agent page
    router.push(`/agent/${tokenId || id}`);
  };

  const handleCreateVideo = (e: React.MouseEvent) => {
    e.stopPropagation();
    track('create_video_clicked', {
      nft_id: tokenId || id,
      nft_name: name
    });

    const nftData: NFTMetadata = {
      tokenId,
      name,
      image,
      description,
      attributes,
      mint,
      id,
      collection,
      owner,
    };
    setSelectedNft(nftData);
    router.push("/pipeline");
  };

  // Truncate description to ~180 characters
  const truncatedDescription = description && description.length > 180 
    ? description.slice(0, 177) + "..." 
    : description;

  return (
    <>
      <div
        className="relative group cursor-pointer transition-all duration-300 hover:-translate-y-1"
        onClick={handleCardClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Card content */}
        <div className={`relative bg-gray-900/60 backdrop-blur-sm border ${hasUnclaimedLore ? 'border-primary-500' : 'border-gray-700/50'} rounded-lg overflow-hidden hover:border-primary-500 transition-all duration-300 hover:shadow-xl`}>
          {/* Image section */}
          <div className="relative aspect-square overflow-hidden bg-black">
            <NFTImage
              src={image}
              alt={name || "Proxim8 NFT"}
              width={400}
              height={400}
              priority={false}
              className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-110"
            />
            
            {/* Lore indicator badge */}
            {hasUnclaimedLore && (
              <div className="absolute top-3 right-3 bg-primary-500 text-white text-xs font-semibold rounded-full w-6 h-6 flex items-center justify-center animate-pulse">
                {loreCount > 9 ? '9+' : loreCount}
              </div>
            )}
            
            {/* Subtle overlay on hover */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            
            {/* Floating lore button */}
            {hasUnclaimedLore && (
              <div className="absolute top-3 left-3 right-12">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    track('claim_lore_from_card_clicked', {
                      nft_id: tokenId || id,
                      nft_name: name,
                      lore_count: loreCount
                    });
                    handleCardClick();
                  }}
                  className="w-full font-space-mono text-xs py-2 px-3 bg-primary-500/90 backdrop-blur-sm border border-primary-400 rounded hover:bg-primary-500 transition-all text-white shadow-lg"
                >
                  CLAIM {loreCount} NEW LORE
                </button>
              </div>
            )}
          </div>

          {/* Info section - Simplified */}
          <div className="p-4">
            <h3 className="font-orbitron text-lg font-bold text-primary-500 mb-2 group-hover:text-primary-400 transition-colors">
              {name || `PROXIM8 #${tokenId}`}
            </h3>
            
            <p className="font-space-mono text-sm text-gray-400 leading-relaxed min-h-[60px]">
              {truncatedDescription || (personalityAttr?.value) || "Digital agent from 2089. Click to access memories."}
            </p>

            {/* Single action */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                track('access_agent_data_clicked', {
                  nft_id: tokenId || id,
                  nft_name: name,
                  has_unclaimed_lore: hasUnclaimedLore
                });
                handleCardClick();
              }}
              className="w-full font-space-mono text-sm py-2.5 px-3 bg-gray-800/50 border border-gray-700 rounded hover:bg-gray-700/50 hover:border-primary-500/50 transition-all mt-4"
            >
              ACCESS AGENT DATA →
            </button>
          </div>
        </div>
      </div>

    </>
  );
}