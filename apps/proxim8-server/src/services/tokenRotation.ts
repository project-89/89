import { setCache, getCache } from "./cache";
import crypto from "crypto";
import { logger } from "../utils/logger";

// Redis key prefix for token keys
const KEY_PREFIX = "jwt:key:";
// Key for active key ID
const ACTIVE_KEY_ID = "jwt:activeKeyId";

interface KeyData {
  id: string;
  key: string;
  createdAt: number;
  expiresAt: number;
}

// In-memory fallback for when Redis is not available
let fallbackKey: KeyData | null = null;
let redisAvailable = true;

/**
 * Generate a new signing key
 * @param expiryDays Number of days until the key expires (default: 30)
 * @returns The generated key data
 */
const generateKey = (expiryDays = 30): KeyData => {
  const id = crypto.randomUUID();
  const key = crypto.randomBytes(64).toString("hex");
  const now = Date.now();
  const expiresAt = now + expiryDays * 24 * 60 * 60 * 1000; // Convert days to milliseconds

  return {
    id,
    key,
    createdAt: now,
    expiresAt,
  };
};

/**
 * Initialize the token rotation system
 * If no signing keys exist, generate an initial key
 */
export const initializeTokenRotation = async (): Promise<void> => {
  try {
    const activeKeyId = await getCache<string>(ACTIVE_KEY_ID);
    if (!activeKeyId) {
      // No active key, initialize the system
      const keyData = generateKey();

      // Try to store the key in Redis
      const redisStoreSuccess = await setCache(
        `${KEY_PREFIX}${keyData.id}`,
        keyData,
        // Store the key for 30 days + 1 day grace period
        31 * 24 * 60 * 60
      );

      if (redisStoreSuccess) {
        // Set this as the active key in Redis
        await setCache(ACTIVE_KEY_ID, keyData.id);
        logger.info(
          `Initialized token rotation system with key ID: ${keyData.id} (Redis)`
        );
      } else {
        // Redis failed, use fallback
        redisAvailable = false;
        fallbackKey = keyData;
        logger.warn(
          `Redis unavailable, initialized token rotation with fallback key ID: ${keyData.id}`
        );
      }
    } else {
      logger.info(
        `Token rotation system already initialized, active key ID: ${activeKeyId}`
      );
    }
  } catch (error) {
    logger.error(`Error initializing token rotation: ${error}`);
    // Create fallback key instead of throwing error
    redisAvailable = false;
    fallbackKey = generateKey();
    logger.warn(
      `Token rotation initialization failed, using fallback key ID: ${fallbackKey.id}`
    );
  }
};

/**
 * Get the current active signing key
 * @returns The active signing key data, or null if not found
 */
export const getActiveSigningKey = async (): Promise<KeyData | null> => {
  try {
    // If Redis is not available, use fallback
    if (!redisAvailable || !fallbackKey === false) {
      if (fallbackKey) {
        return fallbackKey;
      }
      // Create fallback key if none exists
      fallbackKey = generateKey();
      logger.warn(`Created new fallback signing key: ${fallbackKey.id}`);
      return fallbackKey;
    }

    // Get the active key ID from Redis
    const activeKeyId = await getCache<string>(ACTIVE_KEY_ID);
    if (!activeKeyId) {
      logger.warn("No active signing key found in Redis, using fallback");
      // Fall back to fallback key or create one
      if (!fallbackKey) {
        fallbackKey = generateKey();
        logger.warn(`Created new fallback signing key: ${fallbackKey.id}`);
      }
      return fallbackKey;
    }

    // Get the key data from Redis
    const keyData = await getCache<KeyData>(`${KEY_PREFIX}${activeKeyId}`);
    if (!keyData) {
      logger.warn(
        `Active signing key ${activeKeyId} not found in cache, using fallback`
      );
      // Fall back to fallback key or create one
      if (!fallbackKey) {
        fallbackKey = generateKey();
        logger.warn(`Created new fallback signing key: ${fallbackKey.id}`);
      }
      return fallbackKey;
    }

    return keyData;
  } catch (error) {
    logger.error(`Error getting active signing key: ${error}`);
    // Use fallback key on error
    if (!fallbackKey) {
      fallbackKey = generateKey();
      logger.warn(
        `Created new fallback signing key after error: ${fallbackKey.id}`
      );
    }
    return fallbackKey;
  }
};

/**
 * Rotate the signing key
 * Generates a new key and sets it as active
 * @param expiryDays Number of days until the new key expires (default: 30)
 * @returns The new key ID, or null if rotation failed
 */
export const rotateSigningKey = async (
  expiryDays = 30
): Promise<string | null> => {
  try {
    // Generate a new key
    const newKey = generateKey(expiryDays);

    // Store the new key
    await setCache(
      `${KEY_PREFIX}${newKey.id}`,
      newKey,
      // Store the key for expiryDays + 1 day grace period
      (expiryDays + 1) * 24 * 60 * 60
    );

    // Update the active key ID
    await setCache(ACTIVE_KEY_ID, newKey.id);

    logger.info(`Rotated signing key to new key ID: ${newKey.id}`);
    return newKey.id;
  } catch (error) {
    logger.error(`Error rotating signing key: ${error}`);
    return null;
  }
};

/**
 * Get a signing key by ID
 * @param keyId The ID of the key to retrieve
 * @returns The signing key data, or null if not found
 */
export const getSigningKeyById = async (
  keyId: string
): Promise<KeyData | null> => {
  try {
    let keyData: KeyData | null = null;

    if (redisAvailable) {
      try {
        keyData = await getCache<KeyData>(`${KEY_PREFIX}${keyId}`);
        if (keyData) {
          // logger.debug(`Key ${keyId} found in Redis.`);
          return keyData;
        }
      } catch (redisError) {
        logger.warn(
          `Redis error in getSigningKeyById for key ${keyId}: ${redisError}. Proceeding to check fallbackKey.`
        );
        // Ensure keyData is null so fallback is checked
        keyData = null;
      }
    } else {
      logger.warn(
        `Redis unavailable in getSigningKeyById for key ${keyId}. Proceeding to check fallbackKey.`
      );
    }

    // If key not found in Redis (or Redis was unavailable), check fallbackKey
    if (fallbackKey && fallbackKey.id === keyId) {
      // logger.info(`Returning fallbackKey for keyId: ${keyId}`);
      return fallbackKey;
    }

    logger.warn(
      `Key ${keyId} not found in Redis cache or as the current fallbackKey.`
    );
    return null;
  } catch (error) {
    // This catch block is for unexpected errors in the logic itself, not for Redis errors handled above.
    logger.error(
      `Unexpected error in getSigningKeyById for key ${keyId}: ${error}. Attempting to check fallbackKey as a last resort.`
    );
    if (fallbackKey && fallbackKey.id === keyId) {
      logger.info(
        `Returning fallbackKey for keyId: ${keyId} after an unexpected error.`
      );
      return fallbackKey;
    }
    return null;
  }
};

/**
 * Check if a key is expired
 * @param keyId The ID of the key to check
 * @returns True if the key is expired, false otherwise
 */
export const isKeyExpired = async (keyId: string): Promise<boolean> => {
  try {
    const keyData = await getSigningKeyById(keyId);
    if (!keyData) return true;

    return Date.now() > keyData.expiresAt;
  } catch (error) {
    logger.error(`Error checking if key ${keyId} is expired: ${error}`);
    return true;
  }
};
