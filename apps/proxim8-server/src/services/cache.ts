import { createClient, RedisClientType } from "redis";

// Redis client connection options - using standard node-redis configuration for Google Cloud Redis
const redisOptions = {
  socket: {
    host: process.env.REDIS_HOST || "redis",
    port: parseInt(process.env.REDIS_PORT || "6379"),
    reconnectStrategy: (retries: number) => {
      // Exponential backoff with max delay of 10 seconds
      return Math.min(retries * 100, 10000);
    },
  },
  // For Google Cloud Memorystore Redis with AUTH enabled
  password: process.env.REDIS_PASSWORD || undefined,
};

// Create Redis client
let redisClient: RedisClientType;

/**
 * Initialize Redis client connection
 */
export const initRedisClient = async (): Promise<void> => {
  try {
    redisClient = createClient(redisOptions);

    redisClient.on("error", (err) => {
      console.error("Redis connection error:", err);
    });

    redisClient.on("connect", () => {
      console.log("Redis client connected");
    });

    redisClient.on("reconnecting", () => {
      console.log("Redis client reconnecting");
    });

    await redisClient.connect();

    // Test the connection with a simple ping
    await redisClient.ping();
    console.log("Redis connection test successful");
  } catch (error: any) {
    console.error("Failed to initialize Redis:", error);
    console.log("Redis configuration:", {
      host: process.env.REDIS_HOST || "redis",
      port: process.env.REDIS_PORT || "6379",
      hasPassword: !!process.env.REDIS_PASSWORD,
    });
    // Don't throw error - let the application continue with fallback mechanisms
    console.warn("Continuing without Redis - fallback mechanisms will be used");
  }
};

/**
 * Get data from cache
 * @param key Cache key
 * @returns Cached data or null if not found
 */
export const getCache = async <T>(key: string): Promise<T | null> => {
  try {
    if (!redisClient?.isOpen) {
      console.warn("Redis client not connected. Skipping cache retrieval.");
      return null;
    }

    const data = await redisClient.get(key);
    return data ? (JSON.parse(data) as T) : null;
  } catch (error: any) {
    console.error(`Error getting cache for key ${key}:`, error);
    return null;
  }
};

/**
 * Set data in cache
 * @param key Cache key
 * @param data Data to cache
 * @param expiryInSeconds Time in seconds until the cache expires (default: 1 hour)
 * @returns True if successful, false otherwise
 */
export const setCache = async <T>(
  key: string,
  data: T,
  expiryInSeconds = 3600
): Promise<boolean> => {
  try {
    if (!redisClient?.isOpen) {
      console.warn("Redis client not connected. Skipping cache set.");
      return false;
    }

    await redisClient.set(key, JSON.stringify(data), {
      EX: expiryInSeconds,
    });
    return true;
  } catch (error: any) {
    console.error(`Error setting cache for key ${key}:`, error);
    return false;
  }
};

/**
 * Delete a specific key from cache
 * @param key Cache key to delete
 * @returns True if successful, false otherwise
 */
export const deleteCache = async (key: string): Promise<boolean> => {
  try {
    if (!redisClient?.isOpen) {
      console.warn("Redis client not connected. Skipping cache deletion.");
      return false;
    }

    await redisClient.del(key);
    return true;
  } catch (error: any) {
    console.error(`Error deleting cache for key ${key}:`, error);
    return false;
  }
};

/**
 * Clear cache by pattern (e.g., 'user:*' to clear all user-related caches)
 * @param pattern Pattern of keys to clear
 * @returns Number of keys deleted
 */
export const clearCacheByPattern = async (pattern: string): Promise<number> => {
  try {
    if (!redisClient?.isOpen) {
      console.warn(
        "Redis client not connected. Skipping cache pattern deletion."
      );
      return 0;
    }

    let cursor = 0;
    let keysDeleted = 0;

    do {
      const { cursor: newCursor, keys } = await redisClient.scan(cursor, {
        MATCH: pattern,
        COUNT: 100,
      });

      cursor = newCursor;

      if (keys.length > 0) {
        await redisClient.del(keys);
        keysDeleted += keys.length;
      }
    } while (cursor !== 0);

    return keysDeleted;
  } catch (error: any) {
    console.error(`Error clearing cache by pattern ${pattern}:`, error);
    return 0;
  }
};

/**
 * Get the Redis client instance (for advanced use cases)
 * @returns Redis client instance
 */
export const getRedisClient = (): RedisClientType => {
  if (!redisClient?.isOpen) {
    throw new Error("Redis client not connected");
  }
  return redisClient;
};

/**
 * Create a cache key with a namespace
 * @param namespace Namespace for the cache (e.g., 'user', 'video')
 * @param id Identifier for the cached item
 * @param suffix Optional suffix for the key
 * @returns Formatted cache key
 */
export const createCacheKey = (
  namespace: string,
  id: string,
  suffix?: string
): string => {
  return `${namespace}:${id}${suffix ? ":" + suffix : ""}`;
};

/**
 * Close Redis connection
 */
export const closeRedisConnection = async (): Promise<void> => {
  if (redisClient?.isOpen) {
    await redisClient.quit();
    console.log("Redis connection closed");
  }
};
