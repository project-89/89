"use client";

import * as apiClient from "@/utils/apiClient";
import { Lore, LoreReward, UserLore } from "@/types";
import {
  ApiClient,
  getLoreByNftIdImpl,
  getClaimedLoreByNftIdImpl,
  getAvailableLoreByNftIdImpl,
  claimLoreImpl,
  createOrUpdateLoreImpl,
  getClaimedLoreImpl,
  getLoreByWalletImpl,
  getInitialLoreImpl,
  getUserNftLoreImpl,
  getUserLoreImpl,
  claimRewardImpl,
  getLoreImpl,
  getLoreByIdImpl,
  createLoreImpl,
  updateLoreImpl,
} from "./loreService";

// Create client implementation that satisfies the ApiClient interface
const clientApiAdapter: ApiClient = {
  get: apiClient.get,
  post: apiClient.post,
  put: apiClient.put,
  del: apiClient.del,
};

/**
 * Get lore for a specific NFT
 */
export const getLoreByNftId = async (nftId: string): Promise<Lore[]> => {
  return getLoreByNftIdImpl(clientApiAdapter, nftId);
};

/**
 * Get only claimed lore for a specific NFT (secure)
 * More secure as it doesn't expose unclaimed lore content
 */
export const getClaimedLoreByNftId = async (nftId: string): Promise<Lore[]> => {
  return getClaimedLoreByNftIdImpl(clientApiAdapter, nftId);
};

/**
 * Check if unclaimed lore is available for a specific NFT
 * Only returns availability status, no content
 */
export const getAvailableLoreByNftId = async (
  nftId: string
): Promise<{ hasUnclaimedLore: boolean; unclaimedCount: number }> => {
  return getAvailableLoreByNftIdImpl(clientApiAdapter, nftId);
};

/**
 * Claim lore for an NFT
 */
export const claimLore = async (nftId: string): Promise<Lore> => {
  return claimLoreImpl(clientApiAdapter, nftId);
};

/**
 * Create or update lore for an NFT
 */
export const createOrUpdateLore = async (
  nftId: string,
  loreData: Partial<Lore>
): Promise<Lore> => {
  return createOrUpdateLoreImpl(clientApiAdapter, nftId, loreData);
};

/**
 * Get all claimed lore
 */
export const getClaimedLore = async (
  page: number = 1,
  limit: number = 10,
  search: string = ""
): Promise<{ lore: Lore[]; total: number }> => {
  return getClaimedLoreImpl(clientApiAdapter, page, limit, search);
};

/**
 * Get lore claimed by a specific wallet
 */
export const getLoreByWallet = async (
  page: number = 1,
  limit: number = 10
): Promise<{ lore: Lore[]; total: number }> => {
  return getLoreByWalletImpl(clientApiAdapter, page, limit);
};

/**
 * Get initial lore for an NFT
 * This is the gated lore that comes with the NFT
 */
export const getInitialLore = async (nftId: string): Promise<string> => {
  return getInitialLoreImpl(clientApiAdapter, nftId);
};

/**
 * Get all lore relevant to the user's NFTs in a single call
 * This simplified approach replaces the multiple reward-type endpoints
 */
export const getUserNftLore = async (): Promise<LoreReward[]> => {
  return getUserNftLoreImpl(clientApiAdapter);
};

/**
 * Get the user's lore balance and history
 */
export const getUserLore = async (): Promise<UserLore> => {
  return getUserLoreImpl(clientApiAdapter);
};

/**
 * Claim a lore reward
 */
export const claimReward = async (
  rewardId: string,
  nftId?: string
): Promise<LoreReward | null> => {
  return claimRewardImpl(clientApiAdapter, rewardId, nftId);
};

/**
 * Get lore data with pagination
 */
export const getLore = async (
  page: number = 1,
  limit: number = 10
): Promise<Lore[]> => {
  return getLoreImpl(clientApiAdapter, page, limit);
};

/**
 * Get a specific lore entry by ID
 */
export const getLoreById = async (loreId: string): Promise<Lore | null> => {
  return getLoreByIdImpl(clientApiAdapter, loreId);
};

/**
 * Create lore for an NFT
 * @param nftId The ID of the NFT
 * @param data The lore data to create
 * @returns The created lore
 */
export async function createLore(
  nftId: string,
  data: { title: string; content: string }
): Promise<Lore> {
  return createLoreImpl(clientApiAdapter, nftId, data);
}

/**
 * Update lore
 * @param loreId The ID of the lore to update
 * @param data The updated lore data
 * @returns The updated lore
 */
export async function updateLore(
  loreId: string,
  data: { title: string; content: string }
): Promise<Lore> {
  return updateLoreImpl(clientApiAdapter, loreId, data);
}

/**
 * Get all claimed lore for the current user
 */
export async function getAllClaimedLore(): Promise<Lore[]> {
  const result = await getClaimedLoreImpl(clientApiAdapter, 1, 1000); // Get up to 1000 items
  return result.lore || [];
}

/**
 * Get count of available unclaimed lore for a wallet
 */
export async function getAvailableLoreCountForWallet(walletAddress: string): Promise<number> {
  try {
    const response = await clientApiAdapter.get(`/api/lore/wallet/${walletAddress}/available-count`);
    return (response as any).count || 0;
  } catch (error) {
    console.error("Error getting available lore count:", error);
    return 0;
  }
}

/**
 * Claim all available lore for a wallet
 */
export async function claimLoreForWallet(walletAddress: string): Promise<Lore[]> {
  try {
    const response = await clientApiAdapter.post(`/api/lore/wallet/${walletAddress}/claim-all`);
    return (response as any).lore || [];
  } catch (error) {
    console.error("Error claiming lore for wallet:", error);
    return [];
  }
}

/**
 * Get all lore items (claimed and unclaimed) for user's NFTs
 */
export async function getUserNftLoreItems(): Promise<Array<Lore & { claimed: boolean; nftData?: any }>> {
  try {
    const response = await clientApiAdapter.get(`/api/lore/user-nfts`);
    return (response as Array<Lore & { claimed: boolean; nftData?: any }>) || [];
  } catch (error) {
    console.error("Error getting user NFT lore:", error);
    return [];
  }
}

/**
 * Claim a specific lore item by ID
 */
export async function claimLoreById(loreId: string, nftId?: string): Promise<Lore> {
  try {
    const body = nftId ? { nftId } : {};
    const response = await clientApiAdapter.post(`/api/lore/${loreId}/claim`, body);
    return response as Lore;
  } catch (error) {
    console.error("Error claiming lore by ID:", error);
    throw error;
  }
}
