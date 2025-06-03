import jwt from 'jsonwebtoken';

// In-memory fallback for when Redis is not available
const inMemoryBlacklist = new Map<string, number>();

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
        console.error(`Failed to decode token for blacklisting: ${error}`);
        // Default to 24 hours if we can't decode the token
        expiryInSeconds = 86400;
      }
    }

    // Store token in memory with expiration time
    const expirationTime = Date.now() + expiryInSeconds * 1000;
    inMemoryBlacklist.set(token, expirationTime);

    // Set up cleanup for expired token
    setTimeout(() => {
      inMemoryBlacklist.delete(token);
    }, expiryInSeconds * 1000);

    return true;
  } catch (error) {
    console.error(`Error blacklisting token: ${error}`);
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
    const expirationTime = inMemoryBlacklist.get(token);

    if (!expirationTime) {
      return false;
    }

    // Check if token has expired in our blacklist
    if (Date.now() > expirationTime) {
      inMemoryBlacklist.delete(token);
      return false;
    }

    return true;
  } catch (error) {
    console.error(`Error checking blacklisted token: ${error}`);
    return false;
  }
};

/**
 * Clear expired tokens from the blacklist
 * Manual cleanup method for maintenance
 */
export const clearExpiredBlacklistedTokens = async (): Promise<number> => {
  try {
    const now = Date.now();
    let clearedCount = 0;

    for (const [token, expirationTime] of inMemoryBlacklist.entries()) {
      if (now > expirationTime) {
        inMemoryBlacklist.delete(token);
        clearedCount++;
      }
    }

    console.log(`Cleared ${clearedCount} expired blacklisted tokens`);
    return clearedCount;
  } catch (error) {
    console.error(`Error clearing expired blacklisted tokens: ${error}`);
    return 0;
  }
};

/**
 * Get blacklist statistics
 */
export const getBlacklistStats = (): { total: number; expired: number } => {
  const now = Date.now();
  let expiredCount = 0;

  for (const [, expirationTime] of inMemoryBlacklist.entries()) {
    if (now > expirationTime) {
      expiredCount++;
    }
  }

  return {
    total: inMemoryBlacklist.size,
    expired: expiredCount,
  };
};
