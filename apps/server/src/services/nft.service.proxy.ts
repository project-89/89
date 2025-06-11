import axios from 'axios';
import { GetUserNftsRequest, NftListResponse } from '../schemas';
import { ApiError } from '../utils';
import { ERROR_MESSAGES } from '../constants';

const PROXIM8_SERVER_URL = process.env.PROXIM8_SERVER_URL || 'http://localhost:8080';

/**
 * Proxy NFT requests to the Proxim8 server which has the actual blockchain integration
 */
export const getUserNftsFromProxim8 = async (
  request: GetUserNftsRequest
): Promise<NftListResponse> => {
  try {
    console.log(`[NFT Service Proxy] Fetching NFTs from Proxim8 server for wallet: ${request.params.walletAddress}`);

    // Build query parameters
    const queryParams = new URLSearchParams();
    
    // Add filterByCollection=true to get only Proxim8 NFTs
    queryParams.append('filterByCollection', 'true');
    
    if (request.query?.limit) {
      queryParams.append('limit', request.query.limit.toString());
    }
    if (request.query?.offset) {
      const page = Math.floor(request.query.offset / (request.query.limit || 20)) + 1;
      queryParams.append('page', page.toString());
    }

    // Make request to Proxim8 server
    const response = await axios.get(
      `${PROXIM8_SERVER_URL}/api/nft/${request.params.walletAddress}?${queryParams.toString()}`,
      {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        timeout: 30000, // 30 seconds
      }
    );

    console.log(`[NFT Service Proxy] Received response from Proxim8 server`);

    // Transform the response to match our schema
    const data = response.data;
    const nfts = data.nfts || [];

    // Transform NFTs to match our schema
    const transformedNfts = nfts.map((nft: any) => ({
      id: nft.id || nft.mint,
      nftId: nft.id || nft.mint,
      ownerWallet: request.params.walletAddress,
      tokenAddress: nft.mint,
      tokenId: nft.tokenId || nft.mint,
      blockchain: 'solana',
      metadata: {
        name: nft.name,
        description: nft.description,
        image: nft.image,
        attributes: nft.attributes,
        collection: nft.collection,
      },
      lastVerified: Date.now(),
      isValid: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }));

    return {
      nfts: transformedNfts,
      total: data.pagination?.total || transformedNfts.length,
      hasMore: data.pagination?.hasMore || false,
    };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error(`[NFT Service Proxy] Proxim8 server error:`, error.response?.data || error.message);
      if (error.response?.status === 404) {
        return { nfts: [], total: 0, hasMore: false };
      }
    }
    console.error(`[NFT Service Proxy] Error fetching NFTs from Proxim8:`, error);
    throw ApiError.from(error, 500, ERROR_MESSAGES.INTERNAL_ERROR);
  }
};