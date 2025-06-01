import { setCache, getCache } from "./cache";
import { logger } from "../utils/logger";
import { PublicKey } from "@solana/web3.js";
import axios from "axios";

// Cache key prefix for NFT ownership
const OWNERSHIP_CACHE_PREFIX = "nft:ownership:";
const CACHE_TTL_MINUTES = 30; // 30 minutes cache

// Helius configuration
const HELIUS_API_KEY = process.env.HELIUS_API_KEY;
const SOLANA_RPC_URL = `https://mainnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}`;
const PROXIM8_COLLECTION = new PublicKey(
  "5QBfYxnihn5De4UEV3U1To4sWuWoWwHYJsxpd3hPamaf"
);

/**
 * Fetch NFT IDs owned by a wallet (lightweight version)
 */
async function fetchWalletNFTIds(walletAddress: string): Promise<string[]> {
  try {
    const response = await axios.post(
      SOLANA_RPC_URL,
      {
        jsonrpc: "2.0",
        id: "owner-query",
        method: "getAssetsByOwner",
        params: {
          ownerAddress: walletAddress,
          page: 1,
          limit: 1000,
        },
      },
      {
        timeout: 30000,
        headers: { "Content-Type": "application/json" },
      }
    );

    if (!response.data?.result?.items) {
      return [];
    }

    // Filter for Proxim8 collection and extract IDs only
    const proxim8NFTIds = response.data.result.items
      .filter((asset: any) => {
        const collectionGrouping = asset.grouping?.find(
          (g: { group_key: string; group_value: string }) =>
            g.group_key === "collection"
        );
        return (
          collectionGrouping?.group_value === PROXIM8_COLLECTION.toBase58()
        );
      })
      .map((asset: any) => asset.id);

    return proxim8NFTIds;
  } catch (error) {
    logger.error(`Error fetching NFT IDs for ${walletAddress}:`, error);
    return [];
  }
}

/**
 * Cache a user's NFT list for faster ownership checks
 */
export async function cacheUserNFTs(walletAddress: string): Promise<string[]> {
  try {
    logger.info(`Caching NFTs for wallet: ${walletAddress}`);

    // Fetch user's NFT IDs (this will hit Helius)
    const nftIds = await fetchWalletNFTIds(walletAddress);

    // Cache the list for 30 minutes
    await setCache(
      `${OWNERSHIP_CACHE_PREFIX}${walletAddress}`,
      nftIds,
      CACHE_TTL_MINUTES * 60
    );

    logger.info(`Cached ${nftIds.length} NFTs for wallet: ${walletAddress}`);
    return nftIds;
  } catch (error) {
    logger.error(`Failed to cache NFTs for ${walletAddress}:`, error);
    return [];
  }
}

/**
 * Check if a wallet owns a specific NFT (cached)
 */
export async function doesWalletOwnNFT(
  walletAddress: string,
  nftId: string
): Promise<boolean> {
  try {
    // Try to get from cache first
    let nftIds = await getCache<string[]>(
      `${OWNERSHIP_CACHE_PREFIX}${walletAddress}`
    );

    // If not in cache, fetch and cache
    if (!nftIds) {
      logger.debug(`Cache miss for wallet ${walletAddress}, fetching NFTs`);
      nftIds = await cacheUserNFTs(walletAddress);
    }

    const owns = nftIds.includes(nftId);
    logger.debug(`Ownership check: ${walletAddress} owns ${nftId}? ${owns}`);

    return owns;
  } catch (error) {
    logger.error(`Error checking NFT ownership for ${walletAddress}:`, error);
    return false;
  }
}

/**
 * Invalidate cached NFTs for a wallet (call when ownership might have changed)
 */
export async function invalidateWalletCache(
  walletAddress: string
): Promise<void> {
  try {
    // We can't directly delete from Redis via our cache service,
    // but we can set an empty array with 0 TTL to effectively delete
    await setCache(`${OWNERSHIP_CACHE_PREFIX}${walletAddress}`, [], 0);
    logger.info(`Invalidated NFT cache for wallet: ${walletAddress}`);
  } catch (error) {
    logger.error(`Failed to invalidate cache for ${walletAddress}:`, error);
  }
}

/**
 * Get all cached NFTs for a wallet (without making API calls)
 */
export async function getCachedNFTs(
  walletAddress: string
): Promise<string[] | null> {
  try {
    return await getCache<string[]>(
      `${OWNERSHIP_CACHE_PREFIX}${walletAddress}`
    );
  } catch (error) {
    logger.error(`Error getting cached NFTs for ${walletAddress}:`, error);
    return null;
  }
}
