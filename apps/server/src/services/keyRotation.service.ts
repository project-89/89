import crypto from 'crypto';

interface KeyData {
  id: string;
  key: string;
  createdAt: number;
  expiresAt: number;
}

// In-memory storage for signing keys
const signingKeys = new Map<string, KeyData>();
let activeKeyId: string | null = null;

/**
 * Generate a new signing key
 * @param expiryDays Number of days until the key expires (default: 30)
 * @returns The generated key data
 */
const generateKey = (expiryDays = 30): KeyData => {
  const id = crypto.randomUUID();
  const key = crypto.randomBytes(64).toString('hex');
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
export const initializeKeyRotation = async (): Promise<void> => {
  try {
    if (!activeKeyId) {
      // No active key, initialize the system
      const keyData = generateKey();

      signingKeys.set(keyData.id, keyData);
      activeKeyId = keyData.id;

      console.log(`Initialized key rotation system with key ID: ${keyData.id}`);
    } else {
      console.log(
        `Key rotation system already initialized, active key ID: ${activeKeyId}`
      );
    }
  } catch (error) {
    console.error(`Error initializing key rotation: ${error}`);
    // Create fallback key instead of throwing error
    const fallbackKey = generateKey();
    signingKeys.set(fallbackKey.id, fallbackKey);
    activeKeyId = fallbackKey.id;
    console.warn(
      `Key rotation initialization failed, using fallback key ID: ${fallbackKey.id}`
    );
  }
};

/**
 * Get the current active signing key
 * @returns The active signing key data, or null if not found
 */
export const getActiveSigningKey = async (): Promise<KeyData | null> => {
  try {
    if (!activeKeyId) {
      // Initialize if not already done
      await initializeKeyRotation();
    }

    if (!activeKeyId) {
      return null;
    }

    const keyData = signingKeys.get(activeKeyId);
    if (!keyData) {
      console.warn(
        `Active signing key ${activeKeyId} not found, creating new key`
      );
      await initializeKeyRotation();
      return activeKeyId ? signingKeys.get(activeKeyId) || null : null;
    }

    // Check if key is expired
    if (Date.now() > keyData.expiresAt) {
      console.warn(
        `Active signing key ${activeKeyId} has expired, rotating key`
      );
      const newKeyId = await rotateSigningKey();
      return newKeyId ? signingKeys.get(newKeyId) || null : null;
    }

    return keyData;
  } catch (error) {
    console.error(`Error getting active signing key: ${error}`);
    return null;
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
    signingKeys.set(newKey.id, newKey);

    // Update the active key ID
    activeKeyId = newKey.id;

    console.log(`Rotated signing key to new key ID: ${newKey.id}`);
    return newKey.id;
  } catch (error) {
    console.error(`Error rotating signing key: ${error}`);
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
    const keyData = signingKeys.get(keyId);

    if (!keyData) {
      console.warn(`Signing key ${keyId} not found`);
      return null;
    }

    return keyData;
  } catch (error) {
    console.error(`Error getting signing key by ID ${keyId}: ${error}`);
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
    const keyData = signingKeys.get(keyId);

    if (!keyData) {
      return true; // Consider non-existent keys as expired
    }

    return Date.now() > keyData.expiresAt;
  } catch (error) {
    console.error(`Error checking if key ${keyId} is expired: ${error}`);
    return true; // Consider error case as expired for security
  }
};

/**
 * Clean up expired keys
 * @returns Number of keys cleaned up
 */
export const cleanupExpiredKeys = async (): Promise<number> => {
  try {
    const now = Date.now();
    let cleanedCount = 0;

    for (const [keyId, keyData] of signingKeys.entries()) {
      if (now > keyData.expiresAt && keyId !== activeKeyId) {
        signingKeys.delete(keyId);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      console.log(`Cleaned up ${cleanedCount} expired signing keys`);
    }

    return cleanedCount;
  } catch (error) {
    console.error(`Error cleaning up expired keys: ${error}`);
    return 0;
  }
};

/**
 * Get key rotation statistics
 */
export const getKeyRotationStats = (): {
  totalKeys: number;
  activeKeyId: string | null;
  expiredKeys: number;
} => {
  const now = Date.now();
  let expiredCount = 0;

  for (const [, keyData] of signingKeys.entries()) {
    if (now > keyData.expiresAt) {
      expiredCount++;
    }
  }

  return {
    totalKeys: signingKeys.size,
    activeKeyId,
    expiredKeys: expiredCount,
  };
};
