import { Response } from "express";
import { PublicKey } from "@solana/web3.js";
import axios from "axios";
import { RequestWithUser } from "../middleware/auth";
import { logger } from "../utils/logger";
import { NFTMetadata } from "../types/nft";

// Get Helius API key from environment
const HELIUS_API_KEY = process.env.HELIUS_API_KEY;

if (!HELIUS_API_KEY) {
  throw new Error("HELIUS_API_KEY is not set");
}

// Configure Solana RPC URL
const SOLANA_RPC_URL = `https://mainnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}`;

// Collection address for Proxim8 NFTs
const PROXIM8_COLLECTION = new PublicKey(
  "5QBfYxnihn5De4UEV3U1To4sWuWoWwHYJsxpd3hPamaf"
);

/**
 * Validates a Solana wallet address
 */
function validateWalletAddress(address: string): boolean {
  try {
    new PublicKey(address);
    return true;
  } catch {
    return false;
  }
}

/**
 * Checks if an asset belongs to the Proxim8 collection
 */
function isProxim8Asset(asset: any): boolean {
  const collectionGrouping = asset.grouping?.find(
    (g: { group_key: string; group_value: string }) =>
      g.group_key === "collection"
  );

  return collectionGrouping?.group_value === PROXIM8_COLLECTION.toBase58();
}

/**
 * Transforms a Helius asset into our NFTMetadata format
 */
async function transformAssetToNFT(
  asset: any,
  walletAddress: string
): Promise<NFTMetadata | null> {
  try {
    const content = asset.content || {};

    if (!content.json_uri) {
      logger.warn(`No JSON URI found for asset: ${asset.id}`);
      return null;
    }

    // Fetch metadata from the JSON URI
    const metadataResponse = await axios.get(content.json_uri, {
      headers: { "Content-Type": "application/json" },
      timeout: 10000, // 10 second timeout
    });

    if (!metadataResponse.data) {
      logger.error(`No metadata found for asset: ${asset.id}`);
      return null;
    }

    const metadata = metadataResponse.data;

    // Create NFT data object
    const nftData: NFTMetadata = {
      name: metadata.name || `NFT #${asset.id}`,
      image: metadata.image,
      attributes: metadata.attributes || [],
      properties: {
        files: metadata.image ? [{ uri: metadata.image }] : [],
      },
      description: metadata.description || "",
      mint: asset.id,
      collection: metadata.collection || "",
      tokenId: metadata.tokenId,
      id: asset.id,
      owner: walletAddress,
    };

    return nftData;
  } catch (error) {
    logger.error(
      `Error transforming asset ${asset.id}:`,
      error instanceof Error ? error.message : String(error)
    );
    return null;
  }
}

/**
 * Service function to get NFTs for a wallet address (for internal use)
 * This can be called directly by other controllers without Express req/res
 */
export const getNFTsForWallet = async (
  walletAddress: string,
  filterByCollection: boolean = true,
  page: number = 1,
  limit: number = 1000
): Promise<{ nfts: NFTMetadata[]; total: number }> => {
  // Validate wallet address
  if (!validateWalletAddress(walletAddress)) {
    throw new Error(`Invalid wallet address: ${walletAddress}`);
  }

  logger.info(
    `Fetching NFTs for wallet: ${walletAddress} (Proxim8 filter: ${filterByCollection})`
  );

  // Query NFTs owned by the wallet using getAssetsByOwner
  const response = await axios.post(
    SOLANA_RPC_URL,
    {
      jsonrpc: "2.0",
      id: "owner-query",
      method: "getAssetsByOwner",
      params: {
        ownerAddress: walletAddress,
        page,
        limit,
      },
    },
    {
      timeout: 30000, // 30 second timeout for Helius
      headers: { "Content-Type": "application/json" },
    }
  );

  if (!response.data?.result?.items) {
    logger.info(`No NFTs found for wallet: ${walletAddress}`);
    return { nfts: [], total: 0 };
  }

  const allAssets = response.data.result.items;
  const totalAssets = response.data.result.total || allAssets.length;

  // Filter assets by collection if requested
  let assetsToProcess = allAssets;
  if (filterByCollection) {
    assetsToProcess = allAssets.filter(isProxim8Asset);
    logger.info(
      `Found ${assetsToProcess.length} Proxim8 NFTs out of ${allAssets.length} total assets`
    );
  }

  // Transform assets to NFT format
  const nftPromises = assetsToProcess.map((asset: any) =>
    transformAssetToNFT(asset, walletAddress)
  );

  const nftResults = await Promise.allSettled(nftPromises);

  // Filter out failed transformations
  const validNFTs = nftResults
    .filter(
      (result): result is PromiseFulfilledResult<NFTMetadata> =>
        result.status === "fulfilled" && result.value !== null
    )
    .map((result) => result.value);

  // Log any failed transformations
  const failedCount = nftResults.length - validNFTs.length;
  if (failedCount > 0) {
    logger.warn(`Failed to transform ${failedCount} assets`);
  }

  logger.info(
    `Successfully fetched ${validNFTs.length} NFTs for wallet: ${walletAddress}`
  );

  return {
    nfts: validNFTs,
    total: filterByCollection ? assetsToProcess.length : totalAssets,
  };
};

/**
 * Get NFTs for a wallet address, filtered by the Proxim8 collection
 */
export const getNFTsByWallet = async (
  req: RequestWithUser,
  res: Response
): Promise<void> => {
  try {
    const { walletAddress } = req.params;
    const filterByCollection = req.query.filterByCollection !== "false"; // Default to true
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 1000;

    // Validate wallet address
    if (!validateWalletAddress(walletAddress)) {
      logger.error(`Invalid wallet address: ${walletAddress}`);
      res.status(400).json({ error: "Invalid wallet address" });
      return;
    }

    // Use the service function
    const { nfts, total } = await getNFTsForWallet(
      walletAddress,
      filterByCollection,
      page,
      limit
    );

    logger.info(
      `Successfully fetched ${nfts.length} NFTs for wallet: ${walletAddress}`
    );

    // Return result with pagination metadata
    res.status(200).json({
      nfts,
      pagination: {
        page,
        total,
        hasMore: nfts.length === limit && nfts.length < total,
        count: nfts.length,
      },
    });
  } catch (error) {
    logger.error(
      "Error in getNFTsByWallet controller:",
      error instanceof Error ? error.message : String(error)
    );

    res.status(500).json({
      error: "Failed to fetch NFTs",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
