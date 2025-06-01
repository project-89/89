import { setCache, getCache } from "./cache";
import jwt from "jsonwebtoken";
import { logger } from "../utils/logger";

// Redis key prefix for blacklisted tokens
const BLACKLIST_PREFIX = "jwt:blacklist:";

/**
 * Add a token to the blacklist
 * @param token The JWT token to blacklist
 * @param expiryInSeconds Time until the token expires (in seconds)
 */
export const blacklistToken = async (
  token: string,
  expiryInSeconds?: number
): Promise<boolean> => {
  try {
    // If no expiry time is provided, decode the token to get its expiry time
    if (!expiryInSeconds) {
      try {
        const decoded = jwt.decode(token) as { exp?: number };
        if (decoded && decoded.exp) {
          // Calculate time until token expires (in seconds)
          const currentTime = Math.floor(Date.now() / 1000);
          expiryInSeconds = decoded.exp - currentTime;

          // If token is already expired, no need to blacklist
          if (expiryInSeconds <= 0) {
            return true;
          }
        } else {
          // If token doesn't have an expiry, default to 24 hours
          expiryInSeconds = 86400; // 24 hours in seconds
        }
      } catch (error) {
        logger.error(`Failed to decode token for blacklisting: ${error}`);
        // Default to 24 hours if we can't decode the token
        expiryInSeconds = 86400;
      }
    }

    // Store token in Redis with calculated expiration time
    // We store the current timestamp as the value to know when it was blacklisted
    return await setCache(
      `${BLACKLIST_PREFIX}${token}`,
      Date.now(),
      expiryInSeconds
    );
  } catch (error) {
    logger.error(`Error blacklisting token: ${error}`);
    return false;
  }
};

/**
 * Check if a token is blacklisted
 * @param token The JWT token to check
 * @returns True if the token is blacklisted, false otherwise
 */
export const isTokenBlacklisted = async (token: string): Promise<boolean> => {
  try {
    const result = await getCache<number>(`${BLACKLIST_PREFIX}${token}`);
    return result !== null;
  } catch (error) {
    logger.error(`Error checking blacklisted token: ${error}`);
    return false;
  }
};

/**
 * Clear expired tokens from the blacklist
 * Note: Redis handles this automatically based on the key expiry time,
 * so this method is mainly for testing or manual cleanup
 */
export const clearExpiredBlacklistedTokens = async (): Promise<void> => {
  // Redis automatically removes expired keys, so we don't need to do anything here
  logger.info("Redis automatically handles expired token removal");
};
