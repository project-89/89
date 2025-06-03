import { ERROR_MESSAGES } from '../constants';
import {
  CheckNftAccessRequest,
  GetNftOwnershipRequest,
  GetUserNftsRequest,
  NftAccessResponse,
  NftListResponse,
  NftOwnership,
  NftVerificationResponse,
  toNftOwnership,
  VerifyNftOwnershipRequest,
} from '../schemas';
import { ApiError } from '../utils';
import { getDb } from '../utils/mongodb';

const LOG_PREFIX = '[NFT Service]';

// Add Proxim8 collections to constants
const PROXIM8_COLLECTIONS = {
  NFT_OWNERSHIP: 'proxim8.nft-ownership',
  NFT_VERIFICATION_CACHE: 'proxim8.nft-verification-cache',
  NFT_TRANSACTIONS: 'proxim8.nft-transactions',
  NFT_ACCESS_LOGS: 'proxim8.nft-access-logs',
} as const;

/**
 * Verify NFT ownership
 */
export const verifyNftOwnership = async (
  request: VerifyNftOwnershipRequest,
  userId?: string
): Promise<NftVerificationResponse> => {
  try {
    console.log(`${LOG_PREFIX} Verifying NFT ownership:`, request.body.nftId);
    const db = await getDb();

    const { nftId, walletAddress, tokenAddress, tokenId, blockchain } =
      request.body;

    // Check if we have a recent verification cached
    const cacheFilter = {
      nftId,
      ownerWallet: walletAddress.toLowerCase(),
      lastVerified: { $gte: new Date(Date.now() - 5 * 60 * 1000) }, // 5 minutes
    };

    const cachedVerification = await db
      .collection(PROXIM8_COLLECTIONS.NFT_VERIFICATION_CACHE)
      .findOne(cacheFilter);

    if (cachedVerification) {
      console.log(`${LOG_PREFIX} Using cached verification for:`, nftId);
      return {
        nftId,
        ownerWallet: walletAddress,
        isOwner: cachedVerification.isValid,
        metadata: cachedVerification.metadata,
        lastVerified: cachedVerification.lastVerified.getTime(),
        verificationDetails: {
          method: 'cached',
          blockchain: cachedVerification.blockchain || 'solana',
          tokenAddress,
          tokenId,
        },
      };
    }

    // Perform fresh verification (this would integrate with blockchain APIs)
    // For now, we'll simulate the verification
    const isOwner = await performBlockchainVerification(
      walletAddress,
      nftId,
      tokenAddress,
      tokenId,
      blockchain
    );

    const now = new Date();

    // Cache the verification result
    await db.collection(PROXIM8_COLLECTIONS.NFT_VERIFICATION_CACHE).updateOne(
      { nftId, ownerWallet: walletAddress.toLowerCase() },
      {
        $set: {
          nftId,
          ownerWallet: walletAddress.toLowerCase(),
          tokenAddress,
          tokenId,
          blockchain: blockchain || 'solana',
          isValid: isOwner,
          lastVerified: now,
          updatedAt: now,
        },
        $setOnInsert: {
          createdAt: now,
        },
      },
      { upsert: true }
    );

    console.log(`${LOG_PREFIX} NFT ownership verified:`, nftId, isOwner);

    return {
      nftId,
      ownerWallet: walletAddress,
      isOwner,
      metadata: undefined, // Would be populated from blockchain
      lastVerified: now.getTime(),
      verificationDetails: {
        method: 'blockchain',
        blockchain: blockchain || 'solana',
        tokenAddress,
        tokenId,
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
    const db = await getDb();

    const nftDoc = await db
      .collection(PROXIM8_COLLECTIONS.NFT_OWNERSHIP)
      .findOne({ nftId: request.params.nftId });

    if (!nftDoc) {
      return null;
    }

    return toNftOwnership(nftDoc, nftDoc._id.toString());
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
    const db = await getDb();

    const limit = request.query?.limit || 20;
    const offset = request.query?.offset || 0;

    // Build query
    const query: any = {
      ownerWallet: request.params.walletAddress.toLowerCase(),
      isValid: true,
    };

    if (request.query?.blockchain) {
      query.blockchain = request.query.blockchain;
    }
    if (request.query?.collection) {
      query['metadata.collection.name'] = new RegExp(
        request.query.collection,
        'i'
      );
    }
    if (request.query?.verified !== undefined) {
      query.isValid = request.query.verified;
    }

    // Get total count
    const total = await db
      .collection(PROXIM8_COLLECTIONS.NFT_OWNERSHIP)
      .countDocuments(query);

    // Get paginated results
    const nftDocs = await db
      .collection(PROXIM8_COLLECTIONS.NFT_OWNERSHIP)
      .find(query)
      .sort({ lastVerified: -1, createdAt: -1 })
      .skip(offset)
      .limit(limit)
      .toArray();

    const nfts = nftDocs.map((doc) => toNftOwnership(doc, doc._id.toString()));

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
    const db = await getDb();

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

    // Log access check
    await db.collection(PROXIM8_COLLECTIONS.NFT_ACCESS_LOGS).insertOne({
      nftId,
      walletAddress: walletAddress.toLowerCase(),
      userId,
      action,
      hasAccess,
      reason,
      checkedAt: new Date(),
    });

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
              (acc, attr) => {
                acc[attr.trait_type] = String(attr.value);
                return acc;
              },
              {} as Record<string, string>
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
    const db = await getDb();

    // Get current ownership record
    const ownershipDoc = await db
      .collection(PROXIM8_COLLECTIONS.NFT_OWNERSHIP)
      .findOne({ nftId });

    if (!ownershipDoc) {
      return null;
    }

    // Fetch fresh metadata from blockchain (simulated)
    const freshMetadata = await fetchNftMetadataFromBlockchain(
      ownershipDoc.tokenAddress,
      ownershipDoc.tokenId,
      ownershipDoc.blockchain
    );

    const now = new Date();

    // Update metadata
    await db.collection(PROXIM8_COLLECTIONS.NFT_OWNERSHIP).updateOne(
      { nftId },
      {
        $set: {
          metadata: freshMetadata,
          lastVerified: now,
          updatedAt: now,
        },
      }
    );

    // Get updated document
    const updatedDoc = await db
      .collection(PROXIM8_COLLECTIONS.NFT_OWNERSHIP)
      .findOne({ nftId });

    if (!updatedDoc) {
      console.error(`${LOG_PREFIX} Document not found after update:`, nftId);
      return null;
    }

    console.log(`${LOG_PREFIX} NFT metadata refreshed:`, nftId);

    return toNftOwnership(updatedDoc, updatedDoc._id.toString());
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
    const db = await getDb();

    const [totalNfts, verifiedNfts, uniqueOwners, topCollections] =
      await Promise.all([
        // Total NFTs
        db.collection(PROXIM8_COLLECTIONS.NFT_OWNERSHIP).countDocuments(),

        // Verified NFTs
        db
          .collection(PROXIM8_COLLECTIONS.NFT_OWNERSHIP)
          .countDocuments({ isValid: true }),

        // Unique owners
        db
          .collection(PROXIM8_COLLECTIONS.NFT_OWNERSHIP)
          .distinct('ownerWallet', { isValid: true })
          .then((owners) => owners.length),

        // Top collections
        db
          .collection(PROXIM8_COLLECTIONS.NFT_OWNERSHIP)
          .aggregate([
            {
              $match: {
                isValid: true,
                'metadata.collection.name': { $exists: true },
              },
            },
            {
              $group: { _id: '$metadata.collection.name', count: { $sum: 1 } },
            },
            { $sort: { count: -1 } },
            { $limit: 10 },
          ])
          .toArray(),
      ]);

    return {
      totalNfts,
      verifiedNfts,
      uniqueOwners,
      topCollections: topCollections.map((col) => ({
        name: col._id,
        count: col.count,
      })),
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
  const db = await getDb();
  const availableLore = await db
    .collection('proxim8.lore')
    .findOne({ nftId, claimed: false });
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
