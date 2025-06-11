import { ERROR_MESSAGES } from '../constants';
import {
  ClaimLoreRequest,
  ClaimLoreResponse,
  CreateLoreRequest,
  DeleteLoreRequest,
  GetBatchAvailableLoreRequest,
  GetClaimedLoreRequest,
  GetLoreByNftRequest,
  GetLoreListRequest,
  GetLoreRequest,
  GetUnclaimedLoreRequest,
  Lore,
  LoreListResponse,
  LoreStatsResponse,
  UpdateLoreRequest,
} from '../schemas';
import { ApiError } from '../utils';
import { prisma } from './prisma.service';

const LOG_PREFIX = '[Lore Service]';

// Helper function to convert dates to timestamps
const toTimestamp = (date: Date): number => {
  return Math.floor(date.getTime() / 1000);
};

// Helper function to convert Prisma lore to API format
const toLoreResponse = (lore: any): Lore => {
  return {
    id: lore.id,
    nftId: lore.nftId,
    title: lore.title,
    content: lore.content,
    background: lore.background,
    traits: lore.traits || {},
    claimed: lore.claimed,
    claimedBy: lore.claimedBy || undefined,
    claimedAt: lore.claimedAt ? toTimestamp(lore.claimedAt) : undefined,
    createdAt: toTimestamp(lore.createdAt),
    updatedAt: toTimestamp(lore.updatedAt),
  };
};

/**
 * Create a new lore entry
 */
export const createLore = async (request: CreateLoreRequest): Promise<Lore> => {
  try {
    console.log(`${LOG_PREFIX} Creating lore for NFT:`, request.body.nftId);

    // Check if lore already exists for this NFT
    const existingLore = await prisma.lore.findFirst({
      where: { nftId: request.body.nftId },
    });

    if (existingLore) {
      throw new ApiError(409, 'Lore already exists for this NFT');
    }

    const now = new Date();

    // Create lore record
    const lore = await prisma.lore.create({
      data: {
        nftId: request.body.nftId,
        title: request.body.title,
        content: request.body.content,
        background: request.body.background,
        traits: request.body.traits || {},
        claimed: false,
        createdAt: now,
        updatedAt: now,
      },
    });

    console.log(`${LOG_PREFIX} Lore created:`, lore.id);

    return toLoreResponse(lore);
  } catch (error) {
    console.error(`${LOG_PREFIX} Error creating lore:`, error);
    throw ApiError.from(error, 500, ERROR_MESSAGES.INTERNAL_ERROR);
  }
};

/**
 * Get lore by ID
 */
export const getLore = async (
  request: GetLoreRequest
): Promise<Lore | null> => {
  try {
    console.log(`${LOG_PREFIX} Getting lore:`, request.params.loreId);

    const lore = await prisma.lore.findUnique({
      where: { id: request.params.loreId },
    });

    if (!lore) {
      return null;
    }

    return toLoreResponse(lore);
  } catch (error) {
    console.error(`${LOG_PREFIX} Error getting lore:`, error);
    throw ApiError.from(error, 500, ERROR_MESSAGES.INTERNAL_ERROR);
  }
};

/**
 * Get lore by NFT ID
 */
export const getLoreByNft = async (
  request: GetLoreByNftRequest
): Promise<Lore | null> => {
  try {
    console.log(`${LOG_PREFIX} Getting lore by NFT:`, request.params.nftId);

    const lore = await prisma.lore.findFirst({
      where: { nftId: request.params.nftId },
    });

    if (!lore) {
      return null;
    }

    return toLoreResponse(lore);
  } catch (error) {
    console.error(`${LOG_PREFIX} Error getting lore by NFT:`, error);
    throw ApiError.from(error, 500, ERROR_MESSAGES.INTERNAL_ERROR);
  }
};

/**
 * Get lore list with pagination and filtering
 */
export const getLoreList = async (
  request: GetLoreListRequest
): Promise<LoreListResponse> => {
  try {
    console.log(`${LOG_PREFIX} Getting lore list`);

    const limit = request.query?.limit || 20;
    const offset = request.query?.offset || 0;

    // Build where clause
    const where: any = {};
    if (request.query?.claimed !== undefined) {
      where.claimed = request.query.claimed;
    }
    if (request.query?.claimedBy) {
      where.claimedBy = request.query.claimedBy.toLowerCase();
    }
    if (request.query?.nftId) {
      where.nftId = request.query.nftId;
    }

    // Get total count and paginated results in parallel
    const [total, loreRecords] = await Promise.all([
      prisma.lore.count({ where }),
      prisma.lore.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit,
      }),
    ]);

    const lore = loreRecords.map(toLoreResponse);

    return {
      lore,
      total,
      hasMore: offset + limit < total,
    };
  } catch (error) {
    console.error(`${LOG_PREFIX} Error getting lore list:`, error);
    throw ApiError.from(error, 500, ERROR_MESSAGES.INTERNAL_ERROR);
  }
};

/**
 * Claim lore (requires NFT ownership verification)
 */
export const claimLore = async (
  request: ClaimLoreRequest
): Promise<ClaimLoreResponse> => {
  try {
    console.log(`${LOG_PREFIX} Claiming lore:`, request.params.loreId);

    // Get lore
    const lore = await prisma.lore.findUnique({
      where: { id: request.params.loreId },
    });

    if (!lore) {
      throw new ApiError(404, 'Lore not found');
    }

    // Check if already claimed
    if (lore.claimed) {
      throw new ApiError(409, 'Lore has already been claimed');
    }

    // TODO: Verify NFT ownership before allowing claim
    // This would integrate with the NFT service to verify ownership
    const walletAddress = request.body.walletAddress.toLowerCase();

    const now = new Date();

    // Update lore as claimed
    const updatedLore = await prisma.lore.update({
      where: { id: request.params.loreId },
      data: {
        claimed: true,
        claimedBy: walletAddress,
        claimedAt: now,
        updatedAt: now,
      },
    });

    console.log(`${LOG_PREFIX} Lore claimed:`, request.params.loreId);

    // TODO: Calculate and create rewards based on lore type/rarity
    const reward = {
      type: 'experience',
      amount: 100,
      description: 'Experience points for claiming lore',
    };

    return {
      lore: toLoreResponse(updatedLore),
      reward,
    };
  } catch (error) {
    console.error(`${LOG_PREFIX} Error claiming lore:`, error);
    throw ApiError.from(error, 500, ERROR_MESSAGES.INTERNAL_ERROR);
  }
};

/**
 * Update lore entry
 */
export const updateLore = async (request: UpdateLoreRequest): Promise<Lore> => {
  try {
    console.log(`${LOG_PREFIX} Updating lore:`, request.params.loreId);

    // Check if lore exists
    const existingLore = await prisma.lore.findUnique({
      where: { id: request.params.loreId },
    });

    if (!existingLore) {
      throw new ApiError(404, 'Lore not found');
    }

    const now = new Date();
    const updateData: any = {
      updatedAt: now,
    };

    // Update only provided fields
    if (request.body.title !== undefined) {
      updateData.title = request.body.title;
    }
    if (request.body.content !== undefined) {
      updateData.content = request.body.content;
    }
    if (request.body.background !== undefined) {
      updateData.background = request.body.background;
    }
    if (request.body.traits !== undefined) {
      updateData.traits = request.body.traits;
    }

    // Update lore
    const updatedLore = await prisma.lore.update({
      where: { id: request.params.loreId },
      data: updateData,
    });

    console.log(`${LOG_PREFIX} Lore updated:`, request.params.loreId);

    return toLoreResponse(updatedLore);
  } catch (error) {
    console.error(`${LOG_PREFIX} Error updating lore:`, error);
    throw ApiError.from(error, 500, ERROR_MESSAGES.INTERNAL_ERROR);
  }
};

/**
 * Delete lore entry
 */
export const deleteLore = async (
  request: DeleteLoreRequest
): Promise<boolean> => {
  try {
    console.log(`${LOG_PREFIX} Deleting lore:`, request.params.loreId);

    // Check if lore exists
    const existingLore = await prisma.lore.findUnique({
      where: { id: request.params.loreId },
    });

    if (!existingLore) {
      throw new ApiError(404, 'Lore not found');
    }

    // Delete lore
    await prisma.lore.delete({
      where: { id: request.params.loreId },
    });

    console.log(`${LOG_PREFIX} Lore deleted:`, request.params.loreId);

    return true;
  } catch (error) {
    console.error(`${LOG_PREFIX} Error deleting lore:`, error);
    throw ApiError.from(error, 500, ERROR_MESSAGES.INTERNAL_ERROR);
  }
};

/**
 * Get unclaimed lore for user
 */
export const getUnclaimedLore = async (
  request: GetUnclaimedLoreRequest,
  walletAddress?: string
): Promise<LoreListResponse> => {
  try {
    console.log(`${LOG_PREFIX} Getting unclaimed lore`);

    const limit = request.query?.limit || 20;
    const offset = request.query?.offset || 0;

    // Determine wallet address to use
    let targetWalletAddress: string | undefined;
    if (walletAddress) {
      targetWalletAddress = walletAddress;
    } else if (request.query?.walletAddress) {
      targetWalletAddress = request.query.walletAddress.toLowerCase();
    }

    const where: any = {
      claimed: false,
    };

    // If wallet address provided, we could filter by NFTs owned by this wallet
    // This would require joining with NFT ownership data
    // For now, return all unclaimed lore

    // Get total count and paginated results in parallel
    const [total, loreRecords] = await Promise.all([
      prisma.lore.count({ where }),
      prisma.lore.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit,
      }),
    ]);

    const lore = loreRecords.map(toLoreResponse);

    return {
      lore,
      total,
      hasMore: offset + limit < total,
    };
  } catch (error) {
    console.error(`${LOG_PREFIX} Error getting unclaimed lore:`, error);
    throw ApiError.from(error, 500, ERROR_MESSAGES.INTERNAL_ERROR);
  }
};

/**
 * Get claimed lore by user
 */
export const getClaimedLore = async (
  request: GetClaimedLoreRequest
): Promise<LoreListResponse> => {
  try {
    console.log(
      `${LOG_PREFIX} Getting claimed lore for:`,
      request.query.walletAddress
    );

    const limit = request.query?.limit || 20;
    const offset = request.query?.offset || 0;

    const where = {
      claimed: true,
      claimedBy: request.query.walletAddress.toLowerCase(),
    };

    // Get total count and paginated results in parallel
    const [total, loreRecords] = await Promise.all([
      prisma.lore.count({ where }),
      prisma.lore.findMany({
        where,
        orderBy: { claimedAt: 'desc' },
        skip: offset,
        take: limit,
      }),
    ]);

    const lore = loreRecords.map(toLoreResponse);

    return {
      lore,
      total,
      hasMore: offset + limit < total,
    };
  } catch (error) {
    console.error(`${LOG_PREFIX} Error getting claimed lore:`, error);
    throw ApiError.from(error, 500, ERROR_MESSAGES.INTERNAL_ERROR);
  }
};

/**
 * Get lore statistics
 */
export const getLoreStats = async (
  walletAddress?: string
): Promise<LoreStatsResponse> => {
  try {
    console.log(`${LOG_PREFIX} Getting lore stats`);

    // Get total and claimed counts in parallel
    const [total, claimed] = await Promise.all([
      prisma.lore.count(),
      prisma.lore.count({ where: { claimed: true } }),
    ]);

    const unclaimed = total - claimed;

    let claimedByUser = 0;
    if (walletAddress) {
      claimedByUser = await prisma.lore.count({
        where: {
          claimed: true,
          claimedBy: walletAddress.toLowerCase(),
        },
      });
    }

    return {
      total,
      claimed,
      unclaimed,
      claimedByUser: walletAddress ? claimedByUser : undefined,
    };
  } catch (error) {
    console.error(`${LOG_PREFIX} Error getting lore stats:`, error);
    throw ApiError.from(error, 500, ERROR_MESSAGES.INTERNAL_ERROR);
  }
};

/**
 * Get batch available lore for multiple NFTs
 * Reduces API calls from n individual requests to 1 batch request
 */
export const getBatchAvailableLore = async (
  request: GetBatchAvailableLoreRequest
): Promise<Record<string, { hasUnclaimedLore: boolean; unclaimedCount: number }>> => {
  try {
    console.log(`${LOG_PREFIX} Getting batch available lore`);

    const { nftIds } = request.body;

    if (!Array.isArray(nftIds) || nftIds.length === 0) {
      throw new ApiError(400, 'nftIds array is required');
    }

    // Limit batch size to prevent abuse
    if (nftIds.length > 100) {
      throw new ApiError(400, 'Maximum 100 NFT IDs per batch request');
    }

    // Get unclaimed lore counts for all NFT IDs
    const loreCountPromises = nftIds.map(async (nftId) => {
      const count = await prisma.lore.count({
        where: {
          nftId,
          claimed: false,
        },
      });
      return { nftId, count };
    });

    const loreCounts = await Promise.all(loreCountPromises);

    // Build response object
    const response: Record<string, { hasUnclaimedLore: boolean; unclaimedCount: number }> = {};
    loreCounts.forEach(({ nftId, count }) => {
      response[nftId] = {
        hasUnclaimedLore: count > 0,
        unclaimedCount: count,
      };
    });

    return response;
  } catch (error) {
    console.error(`${LOG_PREFIX} Error getting batch available lore:`, error);
    throw ApiError.from(error, 500, ERROR_MESSAGES.INTERNAL_ERROR);
  }
};
