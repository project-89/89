/**
 * Services Index - Organized exports for all service modules
 * This file helps organize and simplify imports throughout the application
 */

// Video services
export * from "./video";
export {
  getServerVideoById,
  getServerPublicVideos,
  getServerUserVideos,
} from "./serverVideo";

// NFT services
export * from "./nft";
export { getServerNFT, getServerNFTsByWallet } from "./serverNft";

// Lore services
export * from "./lore";
export {
  getServerLore,
  getServerLoreById,
  getServerClaimedLore,
  getServerInitialLore,
  getServerAvailableRewards,
  getServerUserLore,
} from "./serverLore";

// Add other service exports here as they are refactored
// Example:
// export * from './lore';
// export { getServerLoreById, getServerLoreByNft } from './serverLore';
