"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { NFTMetadata } from "@/types/nft";
import NFTImage from "@/components/common/NFTImage";

interface Proxim8AvatarProps {
  nft: NFTMetadata;
  size?: "sm" | "md" | "lg";
  showName?: boolean;
  namePosition?: "right" | "below";
  onClick?: () => void;
  className?: string;
}

export default function Proxim8Avatar({ 
  nft, 
  size = "md",
  showName = true,
  namePosition = "right",
  onClick,
  className = ""
}: Proxim8AvatarProps) {
  const router = useRouter();
  
  const sizeClasses = {
    sm: { container: "w-10 h-10", text: "text-xs" },
    md: { container: "w-14 h-14", text: "text-sm" },
    lg: { container: "w-16 h-16", text: "text-base" }
  };
  
  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      router.push(`/agent/${nft.tokenId || nft.id}`);
    }
  };
  
  const avatarElement = (
    <div 
      className={`${sizeClasses[size].container} rounded-full overflow-hidden border border-gray-700 bg-black cursor-pointer hover:border-gray-600 transition-colors flex-shrink-0`}
      onClick={handleClick}
    >
      <NFTImage
        src={nft.image}
        alt={nft.name || "Proxim8 Agent"}
        width={size === "sm" ? 40 : size === "md" ? 56 : 64}
        height={size === "sm" ? 40 : size === "md" ? 56 : 64}
        className="object-cover w-full h-full"
      />
    </div>
  );
  
  if (!showName) {
    return avatarElement;
  }
  
  return (
    <div 
      className={`flex ${namePosition === "below" ? "flex-col" : "flex-row"} items-center gap-${namePosition === "below" ? "2" : "3"} ${className}`}
    >
      {avatarElement}
      <p 
        className={`font-space-mono ${sizeClasses[size].text} text-gray-300 hover:text-gray-200 cursor-pointer transition-colors`}
        onClick={handleClick}
      >
        {nft.name || `PROXIM8 #${nft.tokenId}`}
      </p>
    </div>
  );
}