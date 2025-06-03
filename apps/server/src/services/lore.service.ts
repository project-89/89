import { ERROR_MESSAGES } from '../constants';
import {
  ClaimLoreRequest,
  ClaimLoreResponse,
  CreateLoreRequest,
  DeleteLoreRequest,
  GetClaimedLoreRequest,
  GetLoreByNftRequest,
  GetLoreListRequest,
  GetLoreRequest,
  GetUnclaimedLoreRequest,
  Lore,
  LoreDocument,
  LoreListResponse,
  LoreStatsResponse,
  toLore,
  UpdateLoreRequest,
} from '../schemas';
import { ApiError, idFilter } from '../utils';
import { getDb } from '../utils/mongodb';

const LOG_PREFIX = '[Lore Service]';

// Add Proxim8 collections to constants
const PROXIM8_COLLECTIONS = {
  LORE: 'proxim8.lore',
} as const;

/**
 * Create a new lore entry
 */
export const createLore = async (request: CreateLoreRequest): Promise<Lore> => {
  try {
    console.log(`${LOG_PREFIX} Creating lore for NFT:`, request.body.nftId);
    const db = await getDb();

    // Check if lore already exists for this NFT
    const existingLore = await db.collection(PROXIM8_COLLECTIONS.LORE).findOne({
      nftId: request.body.nftId,
    });

    if (existingLore) {
      throw new ApiError(409, 'Lore already exists for this NFT');
    }

    const now = new Date();

    // Create lore document
    const loreDoc: Omit<LoreDocument, 'id'> = {
      nftId: request.body.nftId,
      title: request.body.title,
      content: request.body.content,
      background: request.body.background,
      traits: request.body.traits || {},
      claimed: false,
      claimedBy: undefined,
      claimedAt: undefined,
      createdAt: now,
      updatedAt: now,
    };

    // Insert into database
    const result = await db
      .collection(PROXIM8_COLLECTIONS.LORE)
      .insertOne(loreDoc);
    const loreId = result.insertedId.toString();

    console.log(`${LOG_PREFIX} Lore created:`, loreId);

    return toLore({ ...loreDoc, _id: result.insertedId }, loreId);
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
    const db = await getDb();

    const filter = idFilter(request.params.loreId);
    if (!filter) {
      return null;
    }

    const loreDoc = await db
      .collection(PROXIM8_COLLECTIONS.LORE)
      .findOne(filter);
    if (!loreDoc) {
      return null;
    }

    return toLore(loreDoc, request.params.loreId);
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
    const db = await getDb();

    const loreDoc = await db.collection(PROXIM8_COLLECTIONS.LORE).findOne({
      nftId: request.params.nftId,
    });

    if (!loreDoc) {
      return null;
    }

    return toLore(loreDoc, loreDoc._id.toString());
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
    const db = await getDb();

    const limit = request.query?.limit || 20;
    const offset = request.query?.offset || 0;

    // Build query
    const query: any = {};
    if (request.query?.claimed !== undefined) {
      query.claimed = request.query.claimed;
    }
    if (request.query?.claimedBy) {
      query.claimedBy = request.query.claimedBy.toLowerCase();
    }
    if (request.query?.nftId) {
      query.nftId = request.query.nftId;
    }

    // Get total count
    const total = await db
      .collection(PROXIM8_COLLECTIONS.LORE)
      .countDocuments(query);

    // Get paginated results
    const loreDocs = await db
      .collection(PROXIM8_COLLECTIONS.LORE)
      .find(query)
      .sort({ createdAt: -1 })
      .skip(offset)
      .limit(limit)
      .toArray();

    const lore = loreDocs.map((doc) => toLore(doc, doc._id.toString()));

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
    const db = await getDb();

    // Get lore
    const filter = idFilter(request.params.loreId);
    if (!filter) {
      throw new ApiError(404, 'Lore not found');
    }

    const loreDoc = await db
      .collection(PROXIM8_COLLECTIONS.LORE)
      .findOne(filter);
    if (!loreDoc) {
      throw new ApiError(404, 'Lore not found');
    }

    // Check if already claimed
    if (loreDoc.claimed) {
      throw new ApiError(409, 'Lore already claimed');
    }

    // TODO: Verify NFT ownership using NFT service
    // For now, we'll assume ownership is verified

    // Update lore as claimed
    const now = new Date();
    await db.collection(PROXIM8_COLLECTIONS.LORE).updateOne(filter, {
      $set: {
        claimed: true,
        claimedBy: request.body.walletAddress.toLowerCase(),
        claimedAt: now,
        updatedAt: now,
      },
    });

    // Get updated lore
    const updatedDoc = await db
      .collection(PROXIM8_COLLECTIONS.LORE)
      .findOne(filter);
    const updatedLore = toLore(updatedDoc, request.params.loreId);

    // TODO: Calculate and distribute rewards
    const reward = {
      type: 'experience',
      amount: 100,
      description: 'Lore discovery bonus',
    };

    // TODO: Create notification for successful claim

    console.log(`${LOG_PREFIX} Lore claimed by:`, request.body.walletAddress);

    return {
      lore: updatedLore,
      reward,
    };
  } catch (error) {
    console.error(`${LOG_PREFIX} Error claiming lore:`, error);
    throw ApiError.from(error, 500, ERROR_MESSAGES.INTERNAL_ERROR);
  }
};

/**
 * Update lore (admin function)
 */
export const updateLore = async (request: UpdateLoreRequest): Promise<Lore> => {
  try {
    console.log(`${LOG_PREFIX} Updating lore:`, request.params.loreId);
    const db = await getDb();

    // Get existing lore
    const filter = idFilter(request.params.loreId);
    if (!filter) {
      throw new ApiError(404, 'Lore not found');
    }

    const existingDoc = await db
      .collection(PROXIM8_COLLECTIONS.LORE)
      .findOne(filter);
    if (!existingDoc) {
      throw new ApiError(404, 'Lore not found');
    }

    const now = new Date();
    const updateData: any = {
      updatedAt: now,
    };

    // Add fields that are being updated
    if (request.body.title) updateData.title = request.body.title;
    if (request.body.content) updateData.content = request.body.content;
    if (request.body.background)
      updateData.background = request.body.background;
    if (request.body.traits) updateData.traits = request.body.traits;

    // Update lore
    await db
      .collection(PROXIM8_COLLECTIONS.LORE)
      .updateOne(filter, { $set: updateData });

    // Get updated lore
    const updatedDoc = await db
      .collection(PROXIM8_COLLECTIONS.LORE)
      .findOne(filter);
    return toLore(updatedDoc, request.params.loreId);
  } catch (error) {
    console.error(`${LOG_PREFIX} Error updating lore:`, error);
    throw ApiError.from(error, 500, ERROR_MESSAGES.INTERNAL_ERROR);
  }
};

/**
 * Delete lore (admin function)
 */
export const deleteLore = async (
  request: DeleteLoreRequest
): Promise<boolean> => {
  try {
    console.log(`${LOG_PREFIX} Deleting lore:`, request.params.loreId);
    const db = await getDb();

    const filter = idFilter(request.params.loreId);
    if (!filter) {
      throw new ApiError(404, 'Lore not found');
    }

    const result = await db
      .collection(PROXIM8_COLLECTIONS.LORE)
      .deleteOne(filter);

    return result.deletedCount > 0;
  } catch (error) {
    console.error(`${LOG_PREFIX} Error deleting lore:`, error);
    throw ApiError.from(error, 500, ERROR_MESSAGES.INTERNAL_ERROR);
  }
};

/**
 * Get unclaimed lore available to a wallet
 */
export const getUnclaimedLore = async (
  request: GetUnclaimedLoreRequest,
  walletAddress?: string
): Promise<LoreListResponse> => {
  try {
    console.log(`${LOG_PREFIX} Getting unclaimed lore`);
    const db = await getDb();

    const limit = request.query?.limit || 20;
    const offset = request.query?.offset || 0;

    // Build query for unclaimed lore
    const query: any = { claimed: false };

    // TODO: If walletAddress provided, filter by NFTs owned by this wallet
    // For now, return all unclaimed lore

    // Get total count
    const total = await db
      .collection(PROXIM8_COLLECTIONS.LORE)
      .countDocuments(query);

    // Get paginated results
    const loreDocs = await db
      .collection(PROXIM8_COLLECTIONS.LORE)
      .find(query)
      .sort({ createdAt: -1 })
      .skip(offset)
      .limit(limit)
      .toArray();

    const lore = loreDocs.map((doc) => toLore(doc, doc._id.toString()));

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
 * Get lore claimed by a wallet
 */
export const getClaimedLore = async (
  request: GetClaimedLoreRequest
): Promise<LoreListResponse> => {
  try {
    console.log(
      `${LOG_PREFIX} Getting claimed lore for:`,
      request.query.walletAddress
    );
    const db = await getDb();

    const limit = request.query?.limit || 20;
    const offset = request.query?.offset || 0;

    // Build query for claimed lore by this wallet
    const query = {
      claimed: true,
      claimedBy: request.query.walletAddress.toLowerCase(),
    };

    // Get total count
    const total = await db
      .collection(PROXIM8_COLLECTIONS.LORE)
      .countDocuments(query);

    // Get paginated results
    const loreDocs = await db
      .collection(PROXIM8_COLLECTIONS.LORE)
      .find(query)
      .sort({ claimedAt: -1 })
      .skip(offset)
      .limit(limit)
      .toArray();

    const lore = loreDocs.map((doc) => toLore(doc, doc._id.toString()));

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
    const db = await getDb();

    // Get total count
    const total = await db
      .collection(PROXIM8_COLLECTIONS.LORE)
      .countDocuments({});

    // Get claimed count
    const claimed = await db
      .collection(PROXIM8_COLLECTIONS.LORE)
      .countDocuments({ claimed: true });

    // Calculate unclaimed
    const unclaimed = total - claimed;

    let claimedByUser: number | undefined;
    if (walletAddress) {
      claimedByUser = await db
        .collection(PROXIM8_COLLECTIONS.LORE)
        .countDocuments({
          claimed: true,
          claimedBy: walletAddress.toLowerCase(),
        });
    }

    return {
      total,
      claimed,
      unclaimed,
      claimedByUser,
    };
  } catch (error) {
    console.error(`${LOG_PREFIX} Error getting lore stats:`, error);
    throw ApiError.from(error, 500, ERROR_MESSAGES.INTERNAL_ERROR);
  }
};

// Export collection constants
export { PROXIM8_COLLECTIONS };
