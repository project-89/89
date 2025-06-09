import { logger } from "../utils/logger";

// List of admin wallet addresses
// In a real application, this would likely be stored in a database
const ADMIN_WALLETS = process.env.ADMIN_WALLETS
  ? process.env.ADMIN_WALLETS.split(",")
  : [];

/**
 * Check if a wallet is an admin
 */
export const checkAdminStatus = async (
  walletAddress: string
): Promise<{ isAdmin: boolean }> => {
  try {
    // Check if wallet is in the admin list
    const isAdmin = ADMIN_WALLETS.includes(walletAddress);

    logger.debug(`Admin check for ${walletAddress}: ${isAdmin}`);

    return { isAdmin };
  } catch (error) {
    logger.error(`Error checking admin status: ${error}`);
    throw new Error(`Failed to check admin status: ${error}`);
  }
};
