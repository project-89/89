"use client";

import React, { useMemo } from "react";
import {
  ConnectionProvider,
  WalletProvider,
} from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { SOLANA_RPC_URL } from "./config";
import { NotificationProvider } from "./context/NotificationContext";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./utils/queryClient";
import dynamic from "next/dynamic";
import { isMobile } from "./utils/mobileDetection";
import { WalletStateSyncer } from "@/components/utils/WalletStateSyncer";
import { NFTAutoFetcher } from "@/components/utils/NFTAutoFetcher";
import BatchLoreProvider from "./providers/BatchLoreProvider";
import { PostHogProvider } from "./providers/PostHogProvider";

// Import wallet adapter styles
import "@solana/wallet-adapter-react-ui/styles.css";
// Import our custom wallet styles AFTER the default ones
import "./app/styles/wallet.css";

interface ProvidersProps {
  children: React.ReactNode;
}

/**
 * Check if we should auto-connect based on persisted wallet state
 */
const shouldEnableAutoConnect = (): boolean => {
  if (typeof window === "undefined") return false;

  try {
    // Check if we have a persisted wallet connection that should be restored
    const persistedState = localStorage.getItem("wallet-auth-store");
    if (persistedState) {
      const parsed = JSON.parse(persistedState);
      const state = parsed?.state;

      // Only auto-connect for desktop connections that were previously connected and authenticated
      // This prevents mobile connections from interfering and reduces bouncing
      if (
        state?.connected === true &&
        state?.platform === "desktop" &&
        state?.walletAddress &&
        state?.isAuthenticated === true
      ) {
        console.log(
          "[Providers] Auto-connect enabled: Valid persisted desktop connection found"
        );
        return true;
      }
    }

    // Also check the Solana adapter's own localStorage key
    const adapterState = localStorage.getItem("proxim8-wallet-adapter");
    if (adapterState) {
      console.log(
        "[Providers] Auto-connect enabled: Solana adapter state found"
      );
      return true;
    }

    console.log(
      "[Providers] Auto-connect disabled: No valid persisted connection"
    );
    return false;
  } catch (error) {
    console.warn(
      "[Providers] Error checking persisted state, disabling auto-connect:",
      error
    );
    return false;
  }
};

/**
 * Client-side providers for wallet, queries, and notifications
 * This component establishes the client-side context boundary
 */
export function Providers({ children }: ProvidersProps) {
  // Memoize endpoint to prevent unnecessary re-renders
  const endpoint = useMemo(() => SOLANA_RPC_URL, []);

  // Empty wallets array - wallet-standard handles auto-discovery
  const wallets = useMemo(() => [], []);

  // Intelligent auto-connect: only enable when there's a valid persisted connection
  const shouldAutoConnect = useMemo(() => {
    return shouldEnableAutoConnect();
  }, []);

  return (
    <PostHogProvider>
      <QueryClientProvider client={queryClient}>
        <ConnectionProvider
          endpoint={endpoint}
          config={{
            commitment: "confirmed",
            wsEndpoint: endpoint.replace("https", "wss"),
          }}
        >
          <WalletProvider
            wallets={wallets}
            autoConnect={shouldAutoConnect}
            localStorageKey="proxim8-wallet-adapter"
            onError={(error) => {
              console.error("Wallet connection error:", error);
            }}
          >
            <WalletModalProvider>
              <NotificationProvider>
                <BatchLoreProvider>
                  <WalletStateSyncer />
                  <NFTAutoFetcher />
                  {/* REMOVED <WalletConnectionManager /> */}
                  {children}
                </BatchLoreProvider>
              </NotificationProvider>
            </WalletModalProvider>
          </WalletProvider>
        </ConnectionProvider>
      </QueryClientProvider>
    </PostHogProvider>
  );
}
