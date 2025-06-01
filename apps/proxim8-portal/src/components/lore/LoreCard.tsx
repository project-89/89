import React from "react";
import { Lore } from "@/types/lore";
import { NFTMetadata } from "@/types/nft";
import Proxim8Avatar from "@/components/proxim8/Proxim8Avatar";

interface LoreCardProps {
  lore: Lore;
  nft?: NFTMetadata;
  onClick?: () => void;
}

export default function LoreCard({ lore, nft, onClick }: LoreCardProps) {
  // Determine lore type from metadata, traits, or content
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
    const lowerTitle = lore.title.toLowerCase();
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
  const category =
    lore.category || lore.metadata?.category || lore.traits?.category;
  const rarity = lore.rarity || lore.metadata?.rarity || lore.traits?.rarity;

  // Type display configuration
  const typeConfig: Record<string, { label: string; color: string }> = {
    text: { label: "Text", color: "text-gray-400" },
    bio: { label: "Biography", color: "text-blue-400" },
    prompt: { label: "Prompt", color: "text-purple-400" },
    memory: { label: "Memory", color: "text-cyan-400" },
    image: { label: "Image", color: "text-green-400" },
    video: { label: "Video", color: "text-red-400" },
    audio: { label: "Audio", color: "text-yellow-400" },
  };

  const rarityColors: Record<string, string> = {
    common: "text-gray-400",
    uncommon: "text-green-400",
    rare: "text-blue-400",
    legendary: "text-purple-400",
    mythic: "text-orange-400",
  };

  return (
    <div
      className="bg-gray-900/70 border border-gray-700/30 rounded-lg overflow-hidden hover:border-gray-600 hover:bg-gray-900/50 transition-all cursor-pointer group"
      onClick={onClick}
    >
      <div className="p-4">
        <div className="flex items-start gap-3">
          {/* Proxim8 Avatar on the left */}
          {nft && <Proxim8Avatar nft={nft} size="sm" showName={false} />}

          <div className="flex-1">
            {/* Header with NFT name and metadata */}
            <div className="mb-2">
              {/* Top row - NFT name and date */}
              <div className="flex items-start justify-between gap-2 mb-1">
                {nft && (
                  <p className="font-space-mono text-xs text-gray-500">
                    {nft.name || `PROXIM8 #${nft.tokenId}`}
                  </p>
                )}
                <p className="font-space-mono text-xs text-gray-500 flex-shrink-0">
                  {new Date(
                    lore.claimedAt || lore.updatedAt
                  ).toLocaleDateString()}
                </p>
              </div>

              {/* Title and type */}
              <h3 className="font-orbitron text-sm font-medium text-gray-200 mb-1">
                {lore.title}
              </h3>

              {/* Metadata badges */}
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className={`font-space-mono text-xs ${typeConfig[loreType]?.color || "text-gray-400"}`}
                >
                  {typeConfig[loreType]?.label || "Unknown"}
                </span>
                {category && (
                  <>
                    <span className="text-gray-600">•</span>
                    <span className="font-space-mono text-xs text-gray-400 capitalize">
                      {category}
                    </span>
                  </>
                )}
                {rarity && (
                  <>
                    <span className="text-gray-600">•</span>
                    <span
                      className={`font-space-mono text-xs capitalize ${rarityColors[rarity] || "text-gray-400"}`}
                    >
                      {rarity}
                    </span>
                  </>
                )}
              </div>
            </div>

            <div className="font-space-mono text-xs text-gray-400 leading-relaxed line-clamp-3 relative">
              {lore.content}
            </div>

            {/* Click to read indicator */}
            <p className="font-space-mono text-xs text-gray-500 mt-2 group-hover:text-gray-400 transition-colors">
              Click to read full lore
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
