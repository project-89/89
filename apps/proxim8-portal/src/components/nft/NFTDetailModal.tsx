"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletAuth } from "@/stores/walletAuthStore";
import { NFTMetadata } from "@/types/nft";
import { Lore } from "@/types/lore";
import {
  claimLore,
  getClaimedLoreByNftId,
  getAvailableLoreByNftId,
} from "@/services/lore";
import AttributeTag from "../common/AttributeTag";
import LoreCardStatic from "../lore/LoreCardStatic";

interface NFTDetailModalProps {
  nft: NFTMetadata;
  onClose: () => void;
}

export default function NFTDetailModal({ nft, onClose }: NFTDetailModalProps) {
  const router = useRouter();
  const { publicKey } = useWallet();
  const { isAuthenticated, authenticate } = useWalletAuth();
  const [activeTab, setActiveTab] = useState<"details" | "lore">("details");
  // const [hasOwnership, setHasOwnership] = useState(false);
  const [lore, setLore] = useState<Lore[] | null>(null);
  const [hasUnclaimedLore, setHasUnclaimedLore] = useState(false);
  const [loreLoading, setLoreLoading] = useState(false);
  const [claiming, setClaiming] = useState(false);

  // Extract key attributes
  const personalityAttribute = nft.attributes?.find(
    (attr) => attr.trait_type === "Personality"
  );
  const personalityDescription = personalityAttribute?.value;

  // Get coordinator from attributes
  const coordinatorAttribute = nft.attributes?.find(
    (attr) => attr.trait_type === "Coordinator"
  );
  const coordinator = coordinatorAttribute?.value;

  // Fetch lore when component mounts or nftId changes
  useEffect(() => {
    const fetchLoreData = async () => {
      if (!nft.tokenId) {
        console.log("No valid NFT ID found");
        return;
      }

      setLoreLoading(true);
      try {
        console.log("Fetching lore for NFT ID:", {
          ...nft,
        });

        // Fetch both claimed lore and availability status in parallel
        const [claimedLoreData, availabilityData] = await Promise.all([
          getClaimedLoreByNftId(nft.tokenId),
          getAvailableLoreByNftId(nft.tokenId),
        ]);

        console.log("Claimed lore data received:", claimedLoreData);
        console.log("Availability data received:", availabilityData);

        // Set claimed lore for display
        setLore(claimedLoreData.length > 0 ? claimedLoreData : null);

        // Set unclaimed lore availability for the claim button
        setHasUnclaimedLore(availabilityData.hasUnclaimedLore);
      } catch (error) {
        console.error("Error fetching lore:", error);
        setLore(null);
        setHasUnclaimedLore(false);
      } finally {
        setLoreLoading(false);
      }
    };

    fetchLoreData();
  }, [nft.tokenId]);

  // Handle claiming lore
  const handleClaimLore = async () => {
    if (!publicKey || !nft.tokenId) {
      return;
    }

    try {
      setClaiming(true);

      // Only login if we're not already authenticated
      // if (!isAuthenticated) {
      //   const success = await authenticate();
      //   if (!success) {
      //     setClaiming(false);
      //     return;
      //   }
      // }

      const claimedLore = await claimLore(nft.tokenId);

      // Update claimed lore display
      setLore((prevLore) =>
        prevLore ? [...prevLore, claimedLore] : [claimedLore]
      );

      // Switch to lore tab to show the newly claimed lore
      setActiveTab("lore");

      // Refresh availability status after claiming
      try {
        const availabilityData = await getAvailableLoreByNftId(nft.tokenId);
        setHasUnclaimedLore(availabilityData.hasUnclaimedLore);
      } catch (error) {
        console.error("Error refreshing lore availability:", error);
        // If there's an error, assume no more unclaimed lore
        setHasUnclaimedLore(false);
      }
    } catch (error) {
      console.error("Error claiming lore:", error);
    } finally {
      setClaiming(false);
    }
  };

  // Navigation to pipeline
  const navigateToPipeline = () => {
    const pipelineUrl = `/pipeline?nftId=${encodeURIComponent(nft.tokenId || "")}`;
    router.push(pipelineUrl);
    onClose(); // Close the modal after navigation
  };

  // Close modal when escape key is pressed
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => {
      window.removeEventListener("keydown", handleEscape);
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 p-4 overflow-y-auto">
      <div className="relative bg-gray-900 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-gray-400 hover:text-white z-10"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6">
          {/* Image Column */}
          <div className="md:col-span-1">
            <div className="bg-opacity-50 bg-gray-800 rounded-lg shadow-lg overflow-hidden">
              {nft.image && (
                <img
                  src={nft.image}
                  alt={nft.name}
                  className="w-full object-cover object-center h-auto"
                />
              )}

              {/* Action buttons for owners */}

              <div className="p-4 flex flex-col space-y-2 bg-gray-800">
                {/* <button
                  onClick={navigateToPipeline}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded-md w-full"
                >
                  Create Video
                </button> */}

                <button
                  onClick={handleClaimLore}
                  className={`bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded-md w-full disabled:opacity-50 disabled:cursor-not-allowed`}
                  disabled={claiming || !hasUnclaimedLore}
                  title={"Claim this NFT's lore"}
                >
                  {claiming ? "Claiming..." : "Claim Lore"}
                </button>
              </div>
            </div>
          </div>

          {/* Details and Tabs Column */}
          <div className="md:col-span-2">
            <div className="bg-opacity-50 bg-gray-800 rounded-lg shadow-lg overflow-hidden">
              {/* NFT title and collection */}
              <div className="p-6 border-b border-gray-700">
                <h1 className="text-3xl font-bold text-white mb-2">
                  {nft.name}
                </h1>
                <p className="text-gray-400">Proxim8 Collection</p>
              </div>

              {/* Tab navigation */}
              <div className="border-b border-gray-700">
                <div className="flex">
                  <button
                    onClick={() => setActiveTab("details")}
                    className={`px-4 py-3 font-medium ${
                      activeTab === "details"
                        ? "border-b-2 border-indigo-500 text-white"
                        : "text-gray-400 hover:text-white"
                    }`}
                  >
                    Details
                  </button>
                  <button
                    onClick={() => setActiveTab("lore")}
                    className={`px-4 py-3 font-medium ${
                      activeTab === "lore"
                        ? "border-b-2 border-indigo-500 text-white"
                        : "text-gray-400 hover:text-white"
                    }`}
                  >
                    Lore
                  </button>
                </div>
              </div>

              {/* Tab content */}
              <div className="p-6">
                {activeTab === "details" && (
                  <div>
                    {/* Description */}
                    <div className="mb-6">
                      <h2 className="text-xl font-semibold text-white mb-2">
                        Description
                      </h2>
                      <p className="text-gray-300">
                        {nft.description || "No description available"}
                      </p>
                    </div>

                    {/* Personality section */}
                    {personalityDescription && (
                      <div className="mb-6 p-4 bg-gray-700 bg-opacity-50 rounded">
                        <h3 className="text-md font-semibold text-white mb-1">
                          Personality
                        </h3>
                        <p className="text-sm text-gray-300">
                          {personalityDescription}
                        </p>
                      </div>
                    )}

                    {/* Coordinator */}
                    {coordinator && (
                      <div className="mb-6">
                        <h3 className="text-md font-semibold text-white mb-2">
                          Coordinator
                        </h3>
                        <p className="text-sm text-gray-300">{coordinator}</p>
                      </div>
                    )}

                    {/* Attributes section */}
                    {nft.attributes && nft.attributes.length > 0 && (
                      <div className="mt-6">
                        <h3 className="text-xl font-semibold text-white mb-3">
                          Attributes
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          {nft.attributes
                            .filter(
                              (attr) =>
                                attr.trait_type !== "Personality" &&
                                attr.trait_type !== "Coordinator"
                            )
                            .map((attr, idx) => (
                              <AttributeTag
                                key={idx}
                                trait={attr.trait_type}
                                value={attr.value}
                              />
                            ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === "lore" && (
                  <div>
                    <h2 className="text-xl font-semibold text-white mb-4">
                      Proxim8 Lore
                    </h2>
                    {loreLoading ? (
                      <div className="flex justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
                      </div>
                    ) : (
                      <LoreCardStatic initialLore={lore} />
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
