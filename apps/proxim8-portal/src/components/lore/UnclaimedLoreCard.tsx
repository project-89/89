"use client";

import React from "react";
import { Lore } from "@/types/lore";
import { NFTMetadata } from "@/types/nft";
import Proxim8Avatar from "@/components/proxim8/Proxim8Avatar";

interface UnclaimedLoreCardProps {
  lore: Lore & { claimed: boolean; nftData?: any };
  nft?: NFTMetadata;
  onClaim: (loreId: string, nftId?: string) => void;
  claiming?: boolean;
  claimingId?: string | null;
}

export default function UnclaimedLoreCard({
  lore,
  nft,
  onClaim,
  claiming = false,
  claimingId,
}: UnclaimedLoreCardProps) {
  const isThisClaiming = claiming && claimingId === lore.id;

  // Determine lore type
  const getLoreType = () => {
    // Check direct type field
    if (lore.type) return lore.type;

    // Check metadata
    if (lore.metadata?.type) return lore.metadata.type;

    // Check traits for various type indicators
    if (lore.traits?.type) return lore.traits.type;
    if (lore.traits?.attributeName) {
      const attrName = lore.traits.attributeName.toLowerCase();
      if (attrName === "bio" || attrName === "biography") return "bio";
      if (attrName === "prompt") return "prompt";
      if (attrName === "memory") return "memory";
    }
    if (lore.traits?.attribute) {
      const attr = lore.traits.attribute.toLowerCase();
      if (attr === "bio" || attr === "biography") return "bio";
      if (attr === "prompt") return "prompt";
      if (attr === "memory") return "memory";
    }

    // Infer from title or content
    const lowerTitle = lore.title?.toLowerCase() || "";
    if (lowerTitle.includes("bio") || lowerTitle.includes("biography"))
      return "bio";
    if (lowerTitle.includes("prompt") || lowerTitle.includes("activation"))
      return "prompt";
    if (lowerTitle.includes("memory") || lowerTitle.includes("fragment"))
      return "memory";
    if (lowerTitle.includes("image") || lowerTitle.includes("visual"))
      return "image";

    return "text";
  };

  const loreType = getLoreType();
  const typeLabels: Record<string, string> = {
    text: "Text",
    bio: "Bio",
    prompt: "Prompt",
    memory: "Memory",
    image: "Image",
    video: "Video",
    audio: "Audio",
  };

  return (
    <div className="bg-gray-900/70 backdrop-blur-sm border border-gray-700/50 rounded-lg overflow-hidden hover:border-gray-600 transition-all">
      <div className="p-4">
        <div className="flex items-center gap-3">
          {/* Proxim8 Avatar */}
          {(nft || lore.nftData) && (
            <Proxim8Avatar
              nft={nft || lore.nftData}
              size="sm"
              showName={false}
            />
          )}

          <div className="flex-1 min-w-0">
            {/* Top row - NFT name and claim button */}
            <div className="flex items-start justify-between gap-2 mb-1">
              <div className="flex-1 min-w-0">
                {(nft || lore.nftData) && (
                  <p className="font-space-mono text-xs text-gray-500 truncate">
                    {nft?.name ||
                      lore.nftData?.name ||
                      `PROXIM8 #${lore.nftId}`}
                  </p>
                )}
                <h3 className="font-orbitron text-sm font-medium text-gray-200 truncate">
                  {lore.title || "Memory Fragment"}
                </h3>
                {/* Lore type indicator with attribute name if available */}
                <p className="font-space-mono text-xs text-gray-500">
                  {lore.traits?.attributeName ||
                    lore.traits?.attribute ||
                    typeLabels[loreType] ||
                    "Unknown"}{" "}
                  Lore
                </p>
              </div>

              {/* Claim button - compact */}
              <button
                onClick={() => onClaim(lore.id, lore.nftId)}
                disabled={claiming}
                className="font-space-mono text-xs px-3 py-1.5 bg-gray-800 border border-gray-700 rounded hover:bg-gray-700 hover:border-gray-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
              >
                {isThisClaiming ? "Claiming..." : "Claim"}
              </button>
            </div>

            {/* Preview text - single line */}
            <p className="font-space-mono text-xs text-gray-400 line-clamp-1">
              {lore.content || "Encrypted memory awaiting recovery..."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
