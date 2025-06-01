/**
 * Shared Lore Service Implementation
 *
 * This file contains shared implementations for Lore-related API calls
 * that can be used by both client and server environments.
 */

import { Lore, LoreReward, UserLore } from "@/types";

// Constants
export const LORE_API_PATH = "/api/lore";

// Helper function to build query params
export const buildQueryParams = (
  params: Record<string, string | number | boolean>
) => {
  const urlParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      urlParams.append(key, String(value));
    }
  });

  return urlParams.toString();
};

// Type definition for API client that works with both client and server implementations
export interface ApiClient {
  get<T>(url: string, config?: any): Promise<T>;
  post<T>(url: string, data?: any, config?: any): Promise<T>;
  put<T>(url: string, data?: any, config?: any): Promise<T>;
  del<T>(url: string, config?: any): Promise<T>;
}

/**
 * Get lore for a specific NFT - implementation
 */
export async function getLoreByNftIdImpl(
  apiClient: ApiClient,
  nftId: string
): Promise<Lore[]> {
  console.log(`[API] Fetching lore for NFT ID: ${nftId}`);
  return apiClient.get<Lore[]>(`${LORE_API_PATH}/nft/${nftId}`);
}

/**
 * Get only claimed lore for a specific NFT - implementation
 * More secure as it doesn't expose unclaimed lore content
 */
export async function getClaimedLoreByNftIdImpl(
  apiClient: ApiClient,
  nftId: string
): Promise<Lore[]> {
  console.log(`[API] Fetching claimed lore for NFT ID: ${nftId}`);
  return apiClient.get<Lore[]>(`${LORE_API_PATH}/nft/${nftId}/claimed`);
}

/**
 * Check if unclaimed lore is available for a specific NFT - implementation
 * Only returns availability status, no content
 */
export async function getAvailableLoreByNftIdImpl(
  apiClient: ApiClient,
  nftId: string
): Promise<{ hasUnclaimedLore: boolean; unclaimedCount: number }> {
  return apiClient.get<{ hasUnclaimedLore: boolean; unclaimedCount: number }>(
    `${LORE_API_PATH}/nft/${nftId}/available`
  );
}

/**
 * Claim lore for an NFT - implementation
 */
export async function claimLoreImpl(
  apiClient: ApiClient,
  nftId: string
): Promise<Lore> {
  return apiClient.post<Lore>(`${LORE_API_PATH}/nft/${nftId}/claim`, {});
}

/**
 * Create or update lore for an NFT - implementation
 */
export async function createOrUpdateLoreImpl(
  apiClient: ApiClient,
  nftId: string,
  loreData: Partial<Lore>
): Promise<Lore> {
  return apiClient.post<Lore>(`${LORE_API_PATH}/nft/${nftId}`, loreData);
}

/**
 * Get all claimed lore - implementation
 */
export async function getClaimedLoreImpl(
  apiClient: ApiClient,
  page: number = 1,
  limit: number = 10,
  search: string = ""
): Promise<{ lore: Lore[]; total: number }> {
  const params = buildQueryParams({ page, limit, search });
  return apiClient.get<{ lore: Lore[]; total: number }>(
    `${LORE_API_PATH}/claimed?${params}`
  );
}

/**
 * Get lore claimed by a specific wallet - implementation
 */
export async function getLoreByWalletImpl(
  apiClient: ApiClient,
  page: number = 1,
  limit: number = 10
): Promise<{ lore: Lore[]; total: number }> {
  const params = buildQueryParams({ page, limit });
  return apiClient.get<{ lore: Lore[]; total: number }>(
    `${LORE_API_PATH}/user?${params}`
  );
}

/**
 * Get initial lore for an NFT - implementation
 * This is the gated lore that comes with the NFT
 */
export async function getInitialLoreImpl(
  apiClient: ApiClient,
  nftId: string
): Promise<string> {
  try {
    const response = await apiClient.get<{ lore: string }>(
      `${LORE_API_PATH}/initial/${nftId}`
    );
    return response?.lore || "";
  } catch (error) {
    console.error(`Error fetching initial lore for NFT ${nftId}:`, error);
    return "";
  }
}

/**
 * Get all lore relevant to the user's NFTs in a single call - implementation
 */
export async function getUserNftLoreImpl(
  apiClient: ApiClient
): Promise<LoreReward[]> {
  try {
    console.log(`[API] Fetching all lore for user`);
    const url = `${LORE_API_PATH}/user-nfts`;
    const response = await apiClient.get<LoreReward[]>(url);

    if (!Array.isArray(response)) {
      console.error(
        "[getUserNftLore] Expected array response but got:",
        response
      );
      return [];
    }

    console.log(`[API] Successfully fetched ${response.length} lore items`);
    return response;
  } catch (error) {
    console.error(`[API] Error fetching user lore:`, error);
    // Propagate the error up so component can handle it appropriately
    throw error;
  }
}

/**
 * Get the user's lore balance and history - implementation
 */
export async function getUserLoreImpl(apiClient: ApiClient): Promise<UserLore> {
  try {
    const response = await apiClient.get<UserLore>(`${LORE_API_PATH}/user`);
    return response;
  } catch (error) {
    console.error(`Error fetching user lore:`, error);
    return {
      walletAddress: "",
      totalLore: 0,
      claimStreak: 0,
      nftLore: [],
    };
  }
}

/**
 * Claim a lore reward - implementation
 */
export async function claimRewardImpl(
  apiClient: ApiClient,
  rewardId: string,
  nftId?: string
): Promise<LoreReward | null> {
  try {
    console.log(
      `[claimReward] Claiming reward ${rewardId} for NFT ${nftId || "unknown"}`
    );

    const response = await apiClient.post<LoreReward>(
      `${LORE_API_PATH}/${rewardId}/claim`,
      { nftId }
    );

    console.log("[claimReward] Claimed successfully:", response);
    return response;
  } catch (error) {
    console.error(`[claimReward] Error claiming reward ${rewardId}:`, error);
    throw error; // Rethrow to allow component to handle
  }
}

/**
 * Get lore data with pagination - implementation
 */
export async function getLoreImpl(
  apiClient: ApiClient,
  page: number = 1,
  limit: number = 10
): Promise<Lore[]> {
  try {
    const params = buildQueryParams({ page, limit });
    return await apiClient.get<Lore[]>(`${LORE_API_PATH}?${params}`);
  } catch (error) {
    console.error("Error fetching lore:", error);
    return [];
  }
}

/**
 * Get a specific lore entry by ID - implementation
 */
export async function getLoreByIdImpl(
  apiClient: ApiClient,
  loreId: string
): Promise<Lore | null> {
  try {
    return await apiClient.get<Lore>(`${LORE_API_PATH}/${loreId}`);
  } catch (error) {
    console.error(`Error fetching lore ${loreId}:`, error);
    return null;
  }
}

/**
 * Create lore for an NFT - implementation
 */
export async function createLoreImpl(
  apiClient: ApiClient,
  nftId: string,
  data: { title: string; content: string }
): Promise<Lore> {
  return apiClient.post<Lore>(`${LORE_API_PATH}`, {
    nftId,
    ...data,
  });
}

/**
 * Update lore - implementation
 */
export async function updateLoreImpl(
  apiClient: ApiClient,
  loreId: string,
  data: { title: string; content: string }
): Promise<Lore> {
  return apiClient.put<Lore>(`${LORE_API_PATH}/${loreId}`, data);
}

/**
 * Get server-side lore data with pagination - implementation
 */
export async function getServerLoreImpl(
  apiClient: ApiClient,
  page: number = 1,
  limit: number = 10
): Promise<{ lore: Lore[]; total: number }> {
  try {
    const params = buildQueryParams({ page, limit });
    const data = await apiClient.get<Lore[]>(`${LORE_API_PATH}?${params}`);
    return { lore: data || [], total: data?.length || 0 };
  } catch (error) {
    console.error("Error fetching server lore:", error);
    return { lore: [], total: 0 };
  }
}

/**
 * Get available lore rewards - implementation
 */
export async function getServerAvailableRewardsImpl(
  apiClient: ApiClient
): Promise<LoreReward[]> {
  try {
    return await apiClient.get<LoreReward[]>(
      `${LORE_API_PATH}/rewards/available`
    );
  } catch (error) {
    console.error("Error fetching available rewards:", error);
    return [];
  }
}

/**
 * Get user lore (claimed rewards, etc) - implementation
 */
export async function getServerUserLoreImpl(
  apiClient: ApiClient,
  walletAddress: string
): Promise<UserLore> {
  try {
    const response = await apiClient.get<UserLore>(
      `${LORE_API_PATH}/user/${walletAddress}`
    );
    return (
      response || {
        walletAddress,
        totalLore: 0,
        claimStreak: 0,
        nftLore: [],
      }
    );
  } catch (error) {
    console.error(`Error fetching user lore for ${walletAddress}:`, error);
    return {
      walletAddress,
      totalLore: 0,
      claimStreak: 0,
      nftLore: [],
    };
  }
}
