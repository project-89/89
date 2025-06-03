import { ERROR_MESSAGES } from '../constants';
import {
  CheckUsernameAvailabilityRequest,
  CreateProxim8UserRequest,
  DeleteProxim8UserRequest,
  GetProxim8UserRequest,
  GetProxim8UsersRequest,
  Proxim8User,
  Proxim8UserDocument,
  Proxim8UserListResponse,
  UpdateProxim8UserRequest,
  UsernameAvailabilityResponse,
  toProxim8User,
} from '../schemas';
import { ApiError, idFilter } from '../utils';
import { getDb } from '../utils/mongodb';

const LOG_PREFIX = '[Proxim8User Service]';

// Add Proxim8 collections to constants
const PROXIM8_COLLECTIONS = {
  USERS: 'proxim8.users',
} as const;

/**
 * Create a new Proxim8 user
 */
export const createProxim8User = async (
  request: CreateProxim8UserRequest
): Promise<Proxim8User> => {
  try {
    console.log(
      `${LOG_PREFIX} Creating user for wallet:`,
      request.body.walletAddress
    );
    const db = await getDb();

    // Check if user already exists
    const existingUser = await getProxim8UserByWallet(
      request.body.walletAddress
    );
    if (existingUser) {
      throw new ApiError(409, 'User already exists');
    }

    // Check username availability if provided
    if (request.body.username) {
      const isAvailable = await checkUsernameAvailable(request.body.username);
      if (!isAvailable) {
        throw new ApiError(409, 'Username already taken');
      }
    }

    const now = new Date();

    // Create user document
    const userDoc: Omit<Proxim8UserDocument, 'id'> = {
      walletAddress: request.body.walletAddress.toLowerCase(),
      username: request.body.username,
      profileImage: request.body.profileImage,
      bio: request.body.bio,
      social: request.body.social,
      preferences: request.body.preferences || {
        emailNotifications: true,
        darkMode: false,
        showInGallery: true,
        pipelineOptions: {},
      },
      createdAt: now,
      updatedAt: now,
    };

    // Insert into database
    const result = await db
      .collection(PROXIM8_COLLECTIONS.USERS)
      .insertOne(userDoc);
    const userId = result.insertedId.toString();

    console.log(`${LOG_PREFIX} User created:`, userId);

    return toProxim8User({ ...userDoc, _id: result.insertedId }, userId);
  } catch (error) {
    console.error(`${LOG_PREFIX} Error creating user:`, error);
    throw ApiError.from(error, 500, ERROR_MESSAGES.INTERNAL_ERROR);
  }
};

/**
 * Get Proxim8 user by ID
 */
export const getProxim8User = async (
  request: GetProxim8UserRequest
): Promise<Proxim8User | null> => {
  try {
    console.log(`${LOG_PREFIX} Getting user by ID:`, request.params.userId);
    const db = await getDb();

    const filter = idFilter(request.params.userId);
    if (!filter) {
      return null;
    }

    const userDoc = await db
      .collection(PROXIM8_COLLECTIONS.USERS)
      .findOne(filter);
    if (!userDoc) {
      return null;
    }

    return toProxim8User(userDoc, request.params.userId);
  } catch (error) {
    console.error(`${LOG_PREFIX} Error getting user:`, error);
    throw ApiError.from(error, 500, ERROR_MESSAGES.INTERNAL_ERROR);
  }
};

/**
 * Get Proxim8 user by wallet address
 */
export const getProxim8UserByWallet = async (
  walletAddress: string
): Promise<Proxim8User | null> => {
  try {
    console.log(`${LOG_PREFIX} Getting user by wallet:`, walletAddress);
    const db = await getDb();

    const userDoc = await db.collection(PROXIM8_COLLECTIONS.USERS).findOne({
      walletAddress: walletAddress.toLowerCase(),
    });

    if (!userDoc) {
      return null;
    }

    return toProxim8User(userDoc, userDoc._id.toString());
  } catch (error) {
    console.error(`${LOG_PREFIX} Error getting user by wallet:`, error);
    throw ApiError.from(error, 500, ERROR_MESSAGES.INTERNAL_ERROR);
  }
};

/**
 * Update Proxim8 user
 */
export const updateProxim8User = async (
  request: UpdateProxim8UserRequest,
  userId: string
): Promise<Proxim8User> => {
  try {
    console.log(`${LOG_PREFIX} Updating user:`, request.params.userId);
    const db = await getDb();

    // Get existing user
    const existingUser = await getProxim8User({
      params: { userId: request.params.userId },
    });
    if (!existingUser) {
      throw new ApiError(404, 'User not found');
    }

    // Check username availability if updating username
    if (
      request.body.username &&
      request.body.username !== existingUser.username
    ) {
      const isAvailable = await checkUsernameAvailable(request.body.username);
      if (!isAvailable) {
        throw new ApiError(409, 'Username already taken');
      }
    }

    const now = new Date();
    const updateData: any = {
      updatedAt: now,
    };

    // Add fields that are being updated
    if (request.body.username) updateData.username = request.body.username;
    if (request.body.profileImage)
      updateData.profileImage = request.body.profileImage;
    if (request.body.bio !== undefined) updateData.bio = request.body.bio;
    if (request.body.social) updateData.social = request.body.social;
    if (request.body.preferences) {
      updateData.preferences = {
        ...existingUser.preferences,
        ...request.body.preferences,
      };
    }

    // Update user
    const filter = idFilter(request.params.userId);
    if (!filter) {
      throw new ApiError(404, 'User not found');
    }

    await db
      .collection(PROXIM8_COLLECTIONS.USERS)
      .updateOne(filter, { $set: updateData });

    // Get updated user
    const updatedDoc = await db
      .collection(PROXIM8_COLLECTIONS.USERS)
      .findOne(filter);
    return toProxim8User(updatedDoc, request.params.userId);
  } catch (error) {
    console.error(`${LOG_PREFIX} Error updating user:`, error);
    throw ApiError.from(error, 500, ERROR_MESSAGES.INTERNAL_ERROR);
  }
};

/**
 * Delete Proxim8 user
 */
export const deleteProxim8User = async (
  request: DeleteProxim8UserRequest
): Promise<boolean> => {
  try {
    console.log(`${LOG_PREFIX} Deleting user:`, request.params.userId);
    const db = await getDb();

    const filter = idFilter(request.params.userId);
    if (!filter) {
      throw new ApiError(404, 'User not found');
    }

    const result = await db
      .collection(PROXIM8_COLLECTIONS.USERS)
      .deleteOne(filter);

    // TODO: Clean up related data (videos, notifications, etc.)

    return result.deletedCount > 0;
  } catch (error) {
    console.error(`${LOG_PREFIX} Error deleting user:`, error);
    throw ApiError.from(error, 500, ERROR_MESSAGES.INTERNAL_ERROR);
  }
};

/**
 * List Proxim8 users with pagination and filtering
 */
export const getProxim8Users = async (
  request: GetProxim8UsersRequest
): Promise<Proxim8UserListResponse> => {
  try {
    console.log(`${LOG_PREFIX} Getting users list`);
    const db = await getDb();

    const limit = request.query?.limit || 20;
    const offset = request.query?.offset || 0;

    // Build query
    const query: any = {};
    if (request.query?.username) {
      query.username = new RegExp(request.query.username, 'i');
    }
    if (request.query?.walletAddress) {
      query.walletAddress = request.query.walletAddress.toLowerCase();
    }

    // Get total count
    const total = await db
      .collection(PROXIM8_COLLECTIONS.USERS)
      .countDocuments(query);

    // Get paginated results
    const userDocs = await db
      .collection(PROXIM8_COLLECTIONS.USERS)
      .find(query)
      .sort({ createdAt: -1 })
      .skip(offset)
      .limit(limit)
      .toArray();

    const users = userDocs.map((doc) => toProxim8User(doc, doc._id.toString()));

    return {
      users,
      total,
      hasMore: offset + limit < total,
    };
  } catch (error) {
    console.error(`${LOG_PREFIX} Error getting users:`, error);
    throw ApiError.from(error, 500, ERROR_MESSAGES.INTERNAL_ERROR);
  }
};

/**
 * Check username availability
 */
export const checkUsernameAvailability = async (
  request: CheckUsernameAvailabilityRequest
): Promise<UsernameAvailabilityResponse> => {
  try {
    console.log(
      `${LOG_PREFIX} Checking username availability:`,
      request.query.username
    );
    const available = await checkUsernameAvailable(request.query.username);

    let suggestions: string[] = [];
    if (!available) {
      // Generate username suggestions
      const baseUsername = request.query.username;
      suggestions = await generateUsernameSuggestions(baseUsername);
    }

    return {
      username: request.query.username,
      available,
      suggestions: suggestions.length > 0 ? suggestions : undefined,
    };
  } catch (error) {
    console.error(`${LOG_PREFIX} Error checking username availability:`, error);
    throw ApiError.from(error, 500, ERROR_MESSAGES.INTERNAL_ERROR);
  }
};

/**
 * Check if username is available (internal helper)
 */
const checkUsernameAvailable = async (username: string): Promise<boolean> => {
  const db = await getDb();
  const existingUser = await db.collection(PROXIM8_COLLECTIONS.USERS).findOne({
    username: username,
  });
  return !existingUser;
};

/**
 * Generate username suggestions (internal helper)
 */
const generateUsernameSuggestions = async (
  baseUsername: string
): Promise<string[]> => {
  const suggestions: string[] = [];
  const db = await getDb();

  // Try adding numbers
  for (let i = 1; i <= 5; i++) {
    const suggestion = `${baseUsername}${i}`;
    const exists = await db.collection(PROXIM8_COLLECTIONS.USERS).findOne({
      username: suggestion,
    });
    if (!exists) {
      suggestions.push(suggestion);
      if (suggestions.length >= 3) break;
    }
  }

  // Try adding random suffix if needed
  if (suggestions.length < 3) {
    for (let i = 0; i < 5; i++) {
      const randomSuffix = Math.floor(Math.random() * 9999)
        .toString()
        .padStart(3, '0');
      const suggestion = `${baseUsername}_${randomSuffix}`;
      const exists = await db.collection(PROXIM8_COLLECTIONS.USERS).findOne({
        username: suggestion,
      });
      if (!exists) {
        suggestions.push(suggestion);
        if (suggestions.length >= 3) break;
      }
    }
  }

  return suggestions;
};

// Export collection constants
export { PROXIM8_COLLECTIONS };
