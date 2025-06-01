"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import NFTImage from "../common/NFTImage";
import AttributeTag from "../common/AttributeTag";
import { useNftStore } from "@/stores/nftStore";
import NFTDetailModal from "./NFTDetailModal";
import { NFTMetadata } from "@/types/nft";

export default function NFTCardInteractive({
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
  const setSelectedNft = useNftStore((state) => state.setSelectedNft);
  const [showModal, setShowModal] = useState(false);

  // Find the personality attribute if it exists
  const personalityAttr = attributes.find(
    (attr) => attr.trait_type?.toLowerCase() === "personality"
  );

  // Handle click to show details modal
  const handleCardClick = () => {
    try {
      // Store the selected NFT in Zustand state
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

      // Set the selected NFT in the store
      setSelectedNft(nftData);

      // Show the modal
      setShowModal(true);
    } catch (error) {
      console.error("Error handling NFT click:", error);
    }
  };

  // Handle creating a video via pipeline
  const handleCreateVideo = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent the modal from opening
    try {
      // Set the complete NFT object in the store
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

      // Navigate to pipeline page without query parameter
      // This ensures we'll use the store value instead of URL param
      router.push("/pipeline");
    } catch (error) {
      console.error("Navigation error:", error);
    }
  };

  return (
    <>
      <div onClick={handleCardClick} className="block h-full cursor-pointer">
        <div className="bg-gray-800 rounded-lg overflow-hidden hover:shadow-lg hover:shadow-indigo-500/20 transition-shadow flex flex-col h-full group">
          {/* Fixed aspect ratio container */}
          <div className="relative w-full pt-[100%]">
            <div className="absolute inset-0">
              <NFTImage
                src={image}
                alt={name || "NFT"}
                aspectRatio="square"
                className="absolute inset-0 w-full h-full object-cover"
              />
              {/* Overlay with actions that appears on hover */}
              {/* <div className="absolute inset-0 bg-black bg-opacity-60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-opacity">
                <button
                  onClick={handleCreateVideo}
                  className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-md text-white font-medium"
                >
                  Create Video
                </button>
              </div> */}
            </div>
          </div>

          {/* Content with fixed layout */}
          <div className="p-4 flex-grow flex flex-col">
            {/* Header section with fixed height */}
            <div className="mb-3">
              <h3 className="font-semibold text-lg line-clamp-1">{name}</h3>
            </div>

            {/* Description or personality section - truncated to one line */}
            <div className="min-h-[3em] mt-2">
              {personalityAttr ? (
                <p className="text-gray-300 text-sm line-clamp-1">
                  <span className="font-medium">Personality:</span>{" "}
                  {personalityAttr.value}
                </p>
              ) : description ? (
                <p className="text-gray-300 text-sm line-clamp-1">
                  {description}
                </p>
              ) : (
                <div className="text-gray-300 text-sm opacity-0">-</div>
              )}
            </div>

            {/* Spacer to push attributes to bottom */}
            <div className="flex-grow"></div>

            {/* Attributes section */}
            <div className="min-h-[2em] mt-2">
              {attributes.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {attributes
                    .filter(
                      (attr) => attr.trait_type?.toLowerCase() !== "personality"
                    )
                    .slice(0, 3)
                    .map((attr, idx) => (
                      <AttributeTag
                        key={idx}
                        trait={attr.trait_type}
                        value={attr.value}
                      />
                    ))}
                  {attributes.length > 3 && (
                    <span className="text-xs text-gray-400 mt-1">
                      +{attributes.length - 3} more
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* NFT Detail Modal */}
      {showModal && (
        <NFTDetailModal
          nft={{
            tokenId,
            owner,
            mint,
            id,
            collection,
            name,
            description,
            attributes,
            image,
          }}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  );
}
