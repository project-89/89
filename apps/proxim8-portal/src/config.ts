/**
 * Global configuration constants
 */

// Default page size for paginated results
export const DEFAULT_PAGE_SIZE = 12;

/**
 * API base URL from environment variable or default
 * This should point to the base URL of the API without trailing slash
 */
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

// Always log the API base URL on startup
if (typeof window !== "undefined") {
  console.log(`[CONFIG] API_BASE_URL: ${API_BASE_URL}`);
}

// Animation durations
export const ANIMATION_DURATION = 300; // ms

// Debounce delays
export const SEARCH_DEBOUNCE_DELAY = 300; // ms

// Solana configuration
// export const SOLANA_NETWORK =
//   process.env.NEXT_PUBLIC_SOLANA_NETWORK || "mainnet-beta";
export const SOLANA_RPC_URL =
  process.env.NEXT_PUBLIC_SOLANA_RPC_URL ||
  "https://api.mainnet-beta.solana.com";

export const SUPPORTED_WALLET_ADAPTERS = ["phantom", "solflare"];

// Application settings
export const APP_NAME =
  process.env.NEXT_PUBLIC_APP_NAME || "Proxim8 NFT Video Platform";
export const DEFAULT_NOTIFICATION_TIMEOUT = parseInt(
  process.env.NEXT_PUBLIC_NOTIFICATION_TIMEOUT || "5000"
);

// Theme settings
export const DEFAULT_THEME = "dark";

// Feature flags
export const FEATURES = {
  LORE_ENABLED: true,
  VIDEO_GENERATION: true,
  NFT_GALLERY: true,
  USER_PROFILES: true,
};

// Video generation settings
export const VIDEO_GEN_TIMEOUT = 600000; // 10 minutes
