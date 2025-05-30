import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

// Use environment variables for encryption keys
const getEncryptionKey = () => {
  const key =
    process.env.ENCRYPTION_API_KEY ||
    process.env.FIREBASE_CONFIG_ENCRYPTION_API_KEY ||
    '';
  if (!key) {
    throw new Error('ENCRYPTION_API_KEY environment variable is required');
  }
  const buffer = Buffer.from(key, 'base64');
  if (buffer.length !== 32) {
    throw new Error(
      'ENCRYPTION_API_KEY must be a 32-byte base64 encoded string'
    );
  }
  return buffer;
};

const getEncryptionIv = () => {
  const iv =
    process.env.ENCRYPTION_API_IV ||
    process.env.FIREBASE_CONFIG_ENCRYPTION_API_IV ||
    '';
  if (!iv) {
    throw new Error('ENCRYPTION_API_IV environment variable is required');
  }
  const buffer = Buffer.from(iv, 'base64');
  if (buffer.length !== 16) {
    throw new Error(
      'ENCRYPTION_API_IV must be a 16-byte base64 encoded string'
    );
  }
  return buffer;
};

/**
 * Generates a secure API key using cryptographic random bytes
 * @returns A base64 encoded string without URL-unsafe characters
 */
export const generateApiKey = (): string => {
  const bytes = randomBytes(32);
  return bytes.toString('base64').replace(/[+/=]/g, '');
};

/**
 * Encrypts an API key for client storage
 * @param apiKey Plain API key
 * @returns Encrypted API key safe for client storage
 */
export const encryptApiKey = (apiKey: string): string => {
  const cipher = createCipheriv(
    'aes-256-cbc',
    getEncryptionKey(),
    getEncryptionIv()
  );
  let encrypted = cipher.update(apiKey, 'utf8', 'base64');
  encrypted += cipher.final('base64');
  return encrypted;
};

/**
 * Decrypts an API key from client storage
 * @param encryptedKey Encrypted API key from client
 * @returns Original API key
 */
export const decryptApiKey = (encryptedKey: string): string => {
  const decipher = createDecipheriv(
    'aes-256-cbc',
    getEncryptionKey(),
    getEncryptionIv()
  );
  let decrypted = decipher.update(encryptedKey, 'base64', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
};

/**
 * Validates an API key format
 * @param key The API key to validate
 * @returns boolean indicating if the key format is valid
 */
export const isValidApiKeyFormat = (key: string): boolean => {
  if (!key || typeof key !== 'string') return false;
  return /^[A-Za-z0-9\-_]{32,}$/.test(key);
};
