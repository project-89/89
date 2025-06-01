/**
 * Global type definitions
 */

export interface Lore {
  id: string;
  nftId: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  background?: string;
  claimed?: boolean;
  claimedBy?: string;
  claimedAt?: string;
  traits?: Record<string, string>;
  metadata?: Record<string, any>;
}

export interface LoreReward {
  id: string;
  nftId: string;
  title: string;
  content: string;
  type?: "text" | "image" | "audio" | "video";
  description?: string;
  background?: string;
  claimed?: boolean;
  claimedBy?: string;
  claimedAt?: string;
  createdAt?: string;
  updatedAt?: string;
  traits?: Record<string, string>;
  requiredNftId?: string;
  nftRequired?: boolean;
  rarity?: "common" | "uncommon" | "rare" | "epic" | "legendary";
  loreAmount?: number;
  nftInfo?: {
    id: string;
    name: string;
  };
}

export interface UserLore {
  walletAddress: string;
  totalLore: number;
  lastClaimAt?: string;
  claimStreak: number;
  nftLore: {
    nftId: string;
    amount: number;
  }[];
}

export interface Video {
  id: string;
  title: string;
  description?: string;
  url: string;
  thumbnail?: string;
  createdAt: string;
  updatedAt: string;
  nftId?: string;
  ownerId?: string;
  ownerWallet?: string;
  publicId?: string;
  status?: string;
  isPublic?: boolean;
  likes?: number;
  views?: number;
  shares?: number;
  hasLiked?: boolean;
  hasSaved?: boolean;
  metadata?: Record<string, any>;
  tags?: string[];
}

export interface NFT {
  id: string;
  mint: string;
  name: string;
  image: string;
  attributes?: Array<{
    trait_type: string;
    value: string;
  }>;
  collection?: {
    name: string;
    family?: string;
  };
  videoGenerated?: boolean;
  loreGenerated?: boolean;
  hasLore?: boolean;
  initialLore?: string; // Initial lore that comes with the NFT
  loreBalance?: number; // How much lore currency this NFT has accumulated
}

// API response types for pagination
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}
