"use client";

// Export all stores from this central location
export * from "./walletAuthStore";
export * from "./nftStore";
export * from "./notificationStore";

// Add a helper to make sure we're not using stores during SSR
export const isServer = typeof window === "undefined";
