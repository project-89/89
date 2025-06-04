import { ERROR_MESSAGES } from '../constants';
import {
  CheckNftAccessRequest,
  GetNftOwnershipRequest,
  GetUserNftsRequest,
  NftAccessResponse,
  NftListResponse,
  NftOwnership,
  NftVerificationResponse,
  VerifyNftOwnershipRequest,
} from '../schemas';
import { ApiError } from '../utils';
import { prisma } from './prisma.service';

const LOG_PREFIX = '[NFT Service]';

// Add Proxim8 collections to constants
const PROXIM8_COLLECTIONS = {
  NFT_OWNERSHIP: 'proxim8.nft-ownership',
  NFT_VERIFICATION_CACHE: 'proxim8.nft-verification-cache',
  NFT_TRANSACTIONS: 'proxim8.nft-transactions',
  NFT_ACCESS_LOGS: 'proxim8.nft-access-logs',
} as const;

// Helper function to convert dates to timestamps
const toTimestamp = (date: Date): number => {
  return Math.floor(date.getTime() / 1000);
};

// Helper function to convert Prisma NFT ownership to API format
const toNftOwnershipResponse = (nftOwnership: any): NftOwnership => {
  return {
    id: nftOwnership.id,
    nftId: nftOwnership.nftId,
    ownerWallet: nftOwnership.walletAddress,
    tokenAddress: nftOwnership.contractAddress,
    tokenId: nftOwnership.tokenId,
    blockchain: nftOwnership.blockchain,
    isValid: nftOwnership.verified,
    metadata: (nftOwnership.metadata as any) || undefined,
    lastVerified: nftOwnership.lastVerified
      ? toTimestamp(nftOwnership.lastVerified)
      : 0,
    createdAt: toTimestamp(nftOwnership.createdAt),
    updatedAt: toTimestamp(nftOwnership.updatedAt),
  };
};

/**
 * Verify NFT ownership
 */
export const verifyNftOwnership = async (
  request: VerifyNftOwnershipRequest,
  userId?: string
): Promise<NftVerificationResponse> => {
  try {
    console.log(`${LOG_PREFIX} Verifying NFT ownership:`, request.body.nftId);

    const { nftId, walletAddress, tokenAddress, tokenId, blockchain } =
      request.body;

    // Find or create account
    const now = new Date();
    const account = await prisma.account.upsert({
      where: { walletAddress: walletAddress.toLowerCase() },
      create: {
        walletAddress: walletAddress.toLowerCase(),
        createdAt: now,
        updatedAt: now,
      },
      update: {
        updatedAt: now,
      },
    });

    // Check if we have a recent verification cached (within 5 minutes)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

    const cachedOwnership = await prisma.nFTOwnership.findFirst({
      where: {
        nftId,
        accountId: account.id,
        lastVerified: {
          gte: fiveMinutesAgo,
        },
      },
    });

    if (cachedOwnership) {
      console.log(`${LOG_PREFIX} Using cached verification for:`, nftId);
      return {
        nftId,
        ownerWallet: walletAddress,
        isOwner: cachedOwnership.verified,
        metadata: cachedOwnership.metadata as any,
        lastVerified: toTimestamp(cachedOwnership.lastVerified!),
        verificationDetails: {
          method: 'cached',
          blockchain: cachedOwnership.blockchain,
          tokenAddress: cachedOwnership.contractAddress,
          tokenId: cachedOwnership.tokenId,
        },
      };
    }

    // Perform fresh verification (this would integrate with blockchain APIs)
    const isOwner = await performBlockchainVerification(
      walletAddress,
      nftId,
      tokenAddress,
      tokenId,
      blockchain
    );

    // Upsert NFT ownership record
    const ownership = await prisma.nFTOwnership.upsert({
      where: {
        nftId_accountId: {
          nftId,
          accountId: account.id,
        },
      },
      create: {
        nftId,
        accountId: account.id,
        walletAddress: walletAddress.toLowerCase(),
        contractAddress: tokenAddress || '',
        tokenId: tokenId || '',
        blockchain: blockchain || 'solana',
        verified: isOwner,
        lastVerified: now,
        createdAt: now,
        updatedAt: now,
      },
      update: {
        contractAddress: tokenAddress || undefined,
        tokenId: tokenId || undefined,
        blockchain: blockchain || 'solana',
        verified: isOwner,
        lastVerified: now,
        updatedAt: now,
      },
    });

    console.log(`${LOG_PREFIX} NFT ownership verified:`, nftId, isOwner);

    return {
      nftId,
      ownerWallet: walletAddress,
      isOwner,
      metadata: ownership.metadata as any,
      lastVerified: toTimestamp(now),
      verificationDetails: {
        method: 'blockchain',
        blockchain: blockchain || 'solana',
        tokenAddress: tokenAddress || '',
        tokenId: tokenId || '',
      },
    };
  } catch (error) {
    console.error(`${LOG_PREFIX} Error verifying NFT ownership:`, error);
    throw ApiError.from(error, 500, ERROR_MESSAGES.INTERNAL_ERROR);
  }
};

/**
 * Get NFT ownership record
 */
export const getNftOwnership = async (
  request: GetNftOwnershipRequest
): Promise<NftOwnership | null> => {
  try {
    console.log(`${LOG_PREFIX} Getting NFT ownership:`, request.params.nftId);

    const ownership = await prisma.nFTOwnership.findFirst({
      where: { nftId: request.params.nftId },
    });

    if (!ownership) {
      return null;
    }

    return toNftOwnershipResponse(ownership);
  } catch (error) {
    console.error(`${LOG_PREFIX} Error getting NFT ownership:`, error);
    throw ApiError.from(error, 500, ERROR_MESSAGES.INTERNAL_ERROR);
  }
};

/**
 * Get user's NFTs
 */
export const getUserNfts = async (
  request: GetUserNftsRequest
): Promise<NftListResponse> => {
  try {
    console.log(
      `${LOG_PREFIX} Getting user NFTs:`,
      request.params.walletAddress
    );

    const limit = request.query?.limit || 20;
    const offset = request.query?.offset || 0;

    // Build where clause
    const where: any = {
      walletAddress: request.params.walletAddress.toLowerCase(),
      verified: true,
    };

    if (request.query?.blockchain) {
      where.blockchain = request.query.blockchain;
    }
    if (request.query?.verified !== undefined) {
      where.verified = request.query.verified;
    }

    // Get total count and NFTs in parallel
    const [total, nftOwnerships] = await Promise.all([
      prisma.nFTOwnership.count({ where }),
      prisma.nFTOwnership.findMany({
        where,
        orderBy: [{ lastVerified: 'desc' }, { createdAt: 'desc' }],
        skip: offset,
        take: limit,
      }),
    ]);

    const nfts = nftOwnerships.map(toNftOwnershipResponse);

    return {
      nfts,
      total,
      hasMore: offset + limit < total,
    };
  } catch (error) {
    console.error(`${LOG_PREFIX} Error getting user NFTs:`, error);
    throw ApiError.from(error, 500, ERROR_MESSAGES.INTERNAL_ERROR);
  }
};

/**
 * Check NFT access for specific actions
 */
export const checkNftAccess = async (
  request: CheckNftAccessRequest,
  userId?: string
): Promise<NftAccessResponse> => {
  try {
    console.log(
      `${LOG_PREFIX} Checking NFT access:`,
      request.body.nftId,
      request.body.action
    );

    const { nftId, walletAddress, action } = request.body;

    // First verify ownership
    const ownership = await verifyNftOwnership({
      body: { nftId, walletAddress },
      params: {},
      query: {},
    });

    if (!ownership.isOwner) {
      return {
        nftId,
        walletAddress,
        hasAccess: false,
        action,
        reason: 'NFT ownership not verified',
      };
    }

    // Check action-specific rules
    let hasAccess = false;
    let reason: string | undefined;

    switch (action) {
      case 'video_generation':
        // Check if NFT is eligible for video generation
        hasAccess = await checkVideoGenerationEligibility(nftId, walletAddress);
        if (!hasAccess) {
          reason = 'NFT not eligible for video generation';
        }
        break;

      case 'lore_claim':
        // Check if lore is available for this NFT
        hasAccess = await checkLoreClaimEligibility(nftId, walletAddress);
        if (!hasAccess) {
          reason = 'No available lore for this NFT';
        }
        break;

      case 'public_share':
        // Most NFTs can be shared publicly
        hasAccess = true;
        break;

      default:
        hasAccess = false;
        reason = 'Unknown action';
    }

    console.log(`${LOG_PREFIX} NFT access checked:`, nftId, action, hasAccess);

    return {
      nftId,
      walletAddress,
      hasAccess,
      action,
      reason,
      metadata: ownership.metadata
        ? {
            collection: ownership.metadata.collection?.name,
            traits: ownership.metadata.attributes?.reduce(
              (acc: Record<string, string>, attr: any) => {
                acc[attr.trait_type] = String(attr.value);
                return acc;
              },
              {}
            ),
          }
        : undefined,
    };
  } catch (error) {
    console.error(`${LOG_PREFIX} Error checking NFT access:`, error);
    throw ApiError.from(error, 500, ERROR_MESSAGES.INTERNAL_ERROR);
  }
};

/**
 * Refresh NFT metadata
 */
export const refreshNftMetadata = async (
  nftId: string,
  userId?: string
): Promise<NftOwnership | null> => {
  try {
    console.log(`${LOG_PREFIX} Refreshing NFT metadata:`, nftId);

    // Get current ownership record
    const ownership = await prisma.nFTOwnership.findFirst({
      where: { nftId },
    });

    if (!ownership) {
      return null;
    }

    // Fetch fresh metadata from blockchain (simulated)
    const freshMetadata = await fetchNftMetadataFromBlockchain(
      ownership.contractAddress,
      ownership.tokenId,
      ownership.blockchain
    );

    const now = new Date();

    // Update metadata
    const updatedOwnership = await prisma.nFTOwnership.update({
      where: { id: ownership.id },
      data: {
        metadata: freshMetadata,
        lastVerified: now,
        updatedAt: now,
      },
    });

    console.log(`${LOG_PREFIX} NFT metadata refreshed:`, nftId);

    return toNftOwnershipResponse(updatedOwnership);
  } catch (error) {
    console.error(`${LOG_PREFIX} Error refreshing NFT metadata:`, error);
    throw ApiError.from(error, 500, ERROR_MESSAGES.INTERNAL_ERROR);
  }
};

/**
 * Get NFT statistics
 */
export const getNftStats = async () => {
  try {
    console.log(`${LOG_PREFIX} Getting NFT statistics`);

    const [totalNfts, verifiedNfts, uniqueOwners] = await Promise.all([
      // Total NFTs
      prisma.nFTOwnership.count(),

      // Verified NFTs
      prisma.nFTOwnership.count({ where: { verified: true } }),

      // Unique owners
      prisma.nFTOwnership
        .findMany({
          where: { verified: true },
          select: { walletAddress: true },
          distinct: ['walletAddress'],
        })
        .then((owners) => owners.length),
    ]);

    // Top collections would require more complex metadata queries
    // For now, return empty array
    const topCollections: Array<{ name: string; count: number }> = [];

    return {
      totalNfts,
      verifiedNfts,
      uniqueOwners,
      topCollections,
    };
  } catch (error) {
    console.error(`${LOG_PREFIX} Error getting NFT stats:`, error);
    throw ApiError.from(error, 500, ERROR_MESSAGES.INTERNAL_ERROR);
  }
};

// Helper functions for blockchain integration (these would be implemented properly)

async function performBlockchainVerification(
  walletAddress: string,
  nftId: string,
  tokenAddress?: string,
  tokenId?: string,
  blockchain?: string
): Promise<boolean> {
  // This would integrate with actual blockchain APIs
  // For now, return a simulated result
  console.log(`${LOG_PREFIX} Performing blockchain verification for:`, nftId);
  return Math.random() > 0.1; // 90% success rate for simulation
}

async function checkVideoGenerationEligibility(
  nftId: string,
  walletAddress: string
): Promise<boolean> {
  // Check if NFT meets criteria for video generation
  // Could check collection whitelist, traits, etc.
  return true; // Simplified for now
}

async function checkLoreClaimEligibility(
  nftId: string,
  walletAddress: string
): Promise<boolean> {
  // Check if there's available lore for this NFT
  const availableLore = await prisma.lore.findFirst({
    where: {
      nftId,
      claimed: false,
    },
  });
  return !!availableLore;
}

async function fetchNftMetadataFromBlockchain(
  tokenAddress: string,
  tokenId: string,
  blockchain: string
) {
  // This would fetch metadata from the blockchain
  // For now, return a simulated metadata object
  return {
    name: `NFT #${tokenId}`,
    description: 'A beautiful NFT',
    image: 'https://example.com/image.png',
    attributes: [
      { trait_type: 'Color', value: 'Blue' },
      { trait_type: 'Rarity', value: 'Common' },
    ],
  };
}

// Export collection constants
export { PROXIM8_COLLECTIONS };
