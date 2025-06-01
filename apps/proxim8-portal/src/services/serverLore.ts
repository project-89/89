import { serverApi } from "./serverApi";
import { Lore, LoreReward, UserLore } from "@/types";
import {
  ApiClient,
  getServerLoreImpl,
  getLoreByIdImpl,
  getClaimedLoreImpl,
  getInitialLoreImpl,
  getServerAvailableRewardsImpl,
  getServerUserLoreImpl,
} from "./loreService";

// Create server API adapter that satisfies the ApiClient interface
const serverApiAdapter: ApiClient = {
  get: serverApi.get.bind(serverApi),
  post: serverApi.post.bind(serverApi),
  put: serverApi.put.bind(serverApi),
  del: serverApi.delete.bind(serverApi),
};

/**
 * Get server-side lore data with pagination
 */
export const getServerLore = async (
  page: number = 1,
  limit: number = 10
): Promise<{ lore: Lore[]; total: number }> => {
  return getServerLoreImpl(serverApiAdapter, page, limit);
};

/**
 * Get a specific lore entry by ID
 */
export const getServerLoreById = async (
  loreId: string
): Promise<Lore | null> => {
  return getLoreByIdImpl(serverApiAdapter, loreId);
};

/**
 * Get server-side claimed lore data with pagination
 */
export const getServerClaimedLore = async (
  page: number = 1,
  limit: number = 10
): Promise<{ lore: Lore[]; total: number }> => {
  return getClaimedLoreImpl(serverApiAdapter, page, limit);
};

/**
 * Get initial lore for an NFT
 */
export const getServerInitialLore = async (nftId: string): Promise<string> => {
  return getInitialLoreImpl(serverApiAdapter, nftId);
};

/**
 * Get available lore rewards
 */
export const getServerAvailableRewards = async (): Promise<LoreReward[]> => {
  return getServerAvailableRewardsImpl(serverApiAdapter);
};

/**
 * Get user lore (claimed rewards, etc)
 */
export const getServerUserLore = async (
  walletAddress: string
): Promise<UserLore> => {
  return getServerUserLoreImpl(serverApiAdapter, walletAddress);
};
