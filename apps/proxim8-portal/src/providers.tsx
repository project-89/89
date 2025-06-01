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

// Import wallet adapter styles
import "@solana/wallet-adapter-react-ui/styles.css";
// Import our custom wallet styles AFTER the default ones
import "./app/styles/wallet.css";

interface ProvidersProps {
  children: React.ReactNode;
}

/**
 * Client-side providers for wallet, queries, and notifications
 * This component establishes the client-side context boundary
 */
export function Providers({ children }: ProvidersProps) {
  // Memoize endpoint to prevent unnecessary re-renders
  const endpoint = useMemo(() => SOLANA_RPC_URL, []);

  // Empty wallets array - wallet-standard handles auto-discovery
  const wallets = useMemo(() => [], []);

  // Disable autoConnect on mobile to prevent conflicts with Phantom deeplinks
  const shouldAutoConnect = useMemo(() => {
    // Only enable autoConnect on desktop
    return typeof window !== "undefined" ? !isMobile() : true;
  }, []);

  return (
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
              <WalletStateSyncer />
              {/* REMOVED <WalletConnectionManager /> */}
              {children}
            </NotificationProvider>
          </WalletModalProvider>
        </WalletProvider>
      </ConnectionProvider>
    </QueryClientProvider>
  );
}
