/**
 * Wallet-related utility functions
 */

/**
 * Validates whether a string appears to be a valid Solana wallet address
 * This is a client-side validation that checks the general format
 */
export const isValidSolanaAddress = (address: string): boolean => {
  // Check if it's the special format used in some development environments
  const isSpecialFormat = /^[a-zA-Z0-9]{43,45}$/.test(address);
  if (isSpecialFormat) {
    console.log(
      `Special wallet address format detected: ${address.substring(0, 8)}...`
    );
    return true;
  }

  // Standard Solana address format (base58 encoded, 32-44 characters)
  return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address);
};

/**
 * Format a wallet address for display (truncated with ellipsis)
 */
export const formatWalletAddress = (address: string): string => {
  if (!address) return "";

  if (address.length < 12) return address;

  return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
};
