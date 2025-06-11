import axios from 'axios';
import { GetUserNftsRequest, NftListResponse } from '../schemas';
import { ApiError } from '../utils';
import { ERROR_MESSAGES } from '../constants';

// Get Helius API key from environment
const HELIUS_API_KEY = process.env.HELIUS_API_KEY || 'your-helius-key-here';

// Configure Solana RPC URL
const SOLANA_RPC_URL = `https://mainnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}`;

// Collection address for Proxim8 NFTs
const PROXIM8_COLLECTION = '5QBfYxnihn5De4UEV3U1To4sWuWoWwHYJsxpd3hPamaf';

/**
 * Normalize image URLs to ensure they're accessible
 */
function normalizeImageUrl(url: string | undefined): string {
  if (!url) return '';
  
  // Handle IPFS URLs
  if (url.startsWith('ipfs://')) {
    // Convert IPFS URLs to HTTP gateway URLs
    const ipfsHash = url.replace('ipfs://', '');
    return `https://ipfs.io/ipfs/${ipfsHash}`;
  }
  
  // Handle Arweave URLs
  if (url.includes('arweave.net') && !url.startsWith('http')) {
    return `https://arweave.net/${url}`;
  }
  
  // Return as-is if already a full URL
  return url;
}

interface HeliusAsset {
  id: string;
  content?: {
    json_uri?: string;
    metadata?: {
      name?: string;
      description?: string;
      image?: string;
      attributes?: Array<{
        trait_type: string;
        value: string | number;
      }>;
    };
    files?: Array<{
      uri?: string;
      mime?: string;
    }>;
  };
  grouping?: Array<{
    group_key: string;
    group_value: string;
  }>;
  ownership?: {
    owner?: string;
  };
}

/**
 * Checks if an asset belongs to the Proxim8 collection
 */
function isProxim8Asset(asset: HeliusAsset): boolean {
  const collectionGrouping = asset.grouping?.find(
    (g) => g.group_key === 'collection'
  );
  return collectionGrouping?.group_value === PROXIM8_COLLECTION;
}

/**
 * Get user's NFTs using Helius API
 */
export const getUserNftsFromHelius = async (
  request: GetUserNftsRequest
): Promise<NftListResponse> => {
  try {
    const walletAddress = request.params.walletAddress;
    const limit = request.query?.limit || 1000;
    const offset = request.query?.offset || 0;
    const page = Math.floor(offset / limit) + 1;

    console.log(`[NFT Service Helius] Fetching NFTs for wallet: ${walletAddress}`);

    // Query NFTs owned by the wallet using getAssetsByOwner
    const response = await axios.post(
      SOLANA_RPC_URL,
      {
        jsonrpc: '2.0',
        id: 'owner-query',
        method: 'getAssetsByOwner',
        params: {
          ownerAddress: walletAddress,
          page,
          limit,
        },
      },
      {
        timeout: 30000, // 30 second timeout
        headers: { 'Content-Type': 'application/json' },
      }
    );

    if (!response.data?.result?.items) {
      console.log(`[NFT Service Helius] No NFTs found for wallet: ${walletAddress}`);
      return { nfts: [], total: 0, hasMore: false };
    }

    const allAssets = response.data.result.items as HeliusAsset[];
    const totalAssets = response.data.result.total || allAssets.length;

    // Filter assets by Proxim8 collection
    const proxim8Assets = allAssets.filter(isProxim8Asset);
    
    console.log(
      `[NFT Service Helius] Found ${proxim8Assets.length} Proxim8 NFTs out of ${allAssets.length} total assets`
    );

    // Log first asset to understand structure
    if (proxim8Assets.length > 0) {
      console.log('[NFT Service Helius] Sample asset structure:', JSON.stringify(proxim8Assets[0], null, 2));
    }

    // Transform assets to our NFT format
    const transformedNfts = await Promise.all(
      proxim8Assets.map(async (asset, index) => {
        try {
          // Get metadata from the asset
          let metadata = asset.content?.metadata || {};
          
          // If metadata is incomplete and we have a json_uri, fetch it
          if ((!metadata.name || !metadata.image) && asset.content?.json_uri) {
            try {
              console.log(`[NFT Service Helius] Fetching metadata from json_uri for asset ${asset.id}`);
              const metadataResponse = await axios.get(asset.content.json_uri, {
                timeout: 10000, // Increased to 10 second timeout
                headers: {
                  'User-Agent': 'Mozilla/5.0 (compatible; Proxim8/1.0)',
                },
              });
              
              if (metadataResponse.data) {
                metadata = {
                  ...metadata,
                  ...metadataResponse.data,
                };
                console.log(`[NFT Service Helius] Successfully fetched metadata for ${asset.id}:`, {
                  name: metadata.name,
                  hasImage: !!metadata.image,
                  imageUrl: metadata.image?.substring(0, 50) + '...',
                });
              }
            } catch (metadataError) {
              console.warn(`[NFT Service Helius] Failed to fetch metadata from json_uri for asset ${asset.id}:`, metadataError.message);
              // Try to extract metadata from the asset directly if json_uri fails
              if (asset.content) {
                metadata = {
                  name: asset.content.metadata?.name || `Proxim8 #${asset.id.slice(-4)}`,
                  description: asset.content.metadata?.description || '',
                  image: asset.content.metadata?.image || '',
                  attributes: asset.content.metadata?.attributes || [],
                };
              }
            }
          }
          
          // Extract image from files if not in metadata
          const imageFromFiles = asset.content?.files?.find(f => f.mime?.startsWith('image/'))?.uri;
          const rawImage = metadata.image || imageFromFiles || '';
          const image = normalizeImageUrl(rawImage);
          
          const transformed = {
            id: asset.id,
            nftId: asset.id,
            ownerWallet: asset.ownership?.owner || walletAddress,
            tokenAddress: asset.id,
            tokenId: asset.id,
            blockchain: 'solana' as const,
            metadata: {
              name: metadata.name || `Proxim8 #${asset.id.slice(-4)}`,
              description: metadata.description || '',
              image: image,
              attributes: metadata.attributes || [],
            },
            lastVerified: Date.now(),
            isValid: true,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          };
          
          // Log first transformed NFT
          if (index === 0) {
            console.log('[NFT Service Helius] Transformed NFT:', JSON.stringify(transformed, null, 2));
          }
          
          return transformed;
        } catch (error) {
          console.error(`[NFT Service Helius] Error transforming asset ${asset.id}:`, error);
          return null;
        }
      })
    );

    // Filter out any failed transformations
    const validNfts = transformedNfts.filter((nft) => nft !== null);

    return {
      nfts: validNfts,
      total: proxim8Assets.length,
      hasMore: page * limit < totalAssets,
    };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error(`[NFT Service Helius] API error:`, error.response?.data || error.message);
      
      // If it's an API key issue, return empty results instead of failing
      if (error.response?.status === 401 || error.response?.status === 403) {
        console.warn('[NFT Service Helius] Invalid or missing Helius API key. Returning empty results.');
        return { nfts: [], total: 0, hasMore: false };
      }
    }
    
    console.error(`[NFT Service Helius] Error fetching NFTs:`, error);
    throw ApiError.from(error, 500, ERROR_MESSAGES.INTERNAL_ERROR);
  }
};