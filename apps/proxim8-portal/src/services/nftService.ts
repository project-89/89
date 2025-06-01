/**
 * Shared NFT Service Implementation
 *
 * This file contains shared implementations for NFT-related API calls
 * that can be used by both client and server environments.
 */

import { NFTMetadata } from "@/types/nft";
import { ApiError } from "@/types/error";

// Constants
export const NFT_API_PATH = "/api/nft";
export const NFTS_API_PATH = "/api/nfts";

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
 * Get NFTs by wallet - implementation
 */
export async function getNFTsByWalletImpl(
  apiClient: ApiClient,
  walletAddress: string
): Promise<NFTMetadata[]> {
  console.log(`Fetching NFTs for wallet: ${walletAddress}`);
  try {
    const nfts = await apiClient.get<NFTMetadata[]>(
      `${NFT_API_PATH}/${walletAddress}`
    );

    if (!nfts || nfts.length === 0) {
      console.log(`No NFTs found for wallet: ${walletAddress}`);
      return [];
    }

    return nfts;
  } catch (error) {
    console.error(`Error fetching NFTs for wallet ${walletAddress}:`, error);
    return [];
  }
}

/**
 * Get specific NFT details by ID - implementation
 */
export async function getNFTByIdImpl(
  apiClient: ApiClient,
  walletAddress: string,
  nftId: string
): Promise<NFTMetadata | null> {
  console.log(`Fetching NFT ${nftId} for wallet: ${walletAddress}`);
  try {
    return await apiClient.get<NFTMetadata>(
      `${NFT_API_PATH}/${walletAddress}/${nftId}`
    );
  } catch (error) {
    console.error(`Error fetching NFT ${nftId}:`, error);
    return null;
  }
}

/**
 * Check NFT ownership - implementation
 */
export async function checkNFTOwnershipImpl(
  apiClient: ApiClient,
  walletAddress: string,
  nftId: string
): Promise<{ owned: boolean }> {
  try {
    await apiClient.get<{ owned: boolean }>(
      `${NFT_API_PATH}/${walletAddress}/${nftId}/verify`
    );
    return { owned: true };
  } catch (error) {
    // If we get a 404, it means the user doesn't own the NFT
    if (error instanceof ApiError && error.status === 404) {
      return { owned: false };
    }

    console.error(`Error verifying NFT ownership:`, error);
    return { owned: false };
  }
}

/**
 * Get eligible NFTs for video generation - implementation
 */
export async function getEligibleNFTsImpl(
  apiClient: ApiClient,
  walletAddress: string
): Promise<NFTMetadata[]> {
  try {
    return await apiClient.get<NFTMetadata[]>(
      `${NFT_API_PATH}/${walletAddress}/eligible`
    );
  } catch (error) {
    console.error(`Error fetching eligible NFTs:`, error);
    return [];
  }
}

/**
 * Get public NFTs that are available to all users - implementation
 */
export async function getPublicNFTsImpl(
  apiClient: ApiClient
): Promise<NFTMetadata[]> {
  try {
    return await apiClient.get<NFTMetadata[]>(NFTS_API_PATH);
  } catch (error) {
    console.error(`Error fetching public NFTs:`, error);
    return [];
  }
}

/**
 * Get a single NFT by ID - implementation
 */
export async function getNFTImpl(
  apiClient: ApiClient,
  id: string
): Promise<NFTMetadata | null> {
  try {
    console.log(`[getNFT] Fetching NFT with ID: ${id}`);

    const data = await apiClient.get<NFTMetadata>(`${NFTS_API_PATH}/${id}`, {
      headers: {
        "Cache-Control": "no-cache",
      },
    });

    console.log(`[getNFT] Successfully fetched NFT data:`, data);
    return data;
  } catch (error) {
    console.error(`[getNFT] Error fetching NFT:`, error);
    return null;
  }
}

/**
 * Get NFT by mint address - server-side implementation
 */
export async function getServerNFTByMintImpl(
  apiClient: ApiClient,
  id: string,
  apiKey?: string
): Promise<NFTMetadata | null> {
  try {
    console.log(`[Server] Fetching NFT with ID/mint: ${id}`);

    // For server-side, we might need to add an API key
    const config = apiKey
      ? {
          headers: {
            "Cache-Control": "no-cache",
            "X-API-Key": apiKey,
          },
        }
      : {
          headers: {
            "Cache-Control": "no-cache",
          },
        };

    const data = await apiClient.get<NFTMetadata>(
      `${NFT_API_PATH}/mint/${id}`,
      config
    );

    console.log(`[Server] Successfully fetched NFT: ${data.name}`);

    // Ensure the NFT has both an id and mint field
    if (data && !data.mint) {
      data.mint = id;
    }
    if (data && !data.id) {
      data.id = id;
    }

    return data;
  } catch (error) {
    console.error(`[Server] Error fetching NFT:`, error);
    return null;
  }
}
