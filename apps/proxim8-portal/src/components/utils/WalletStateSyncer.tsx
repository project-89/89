"use client";

import { useEffect, useRef } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletAuth } from "@/stores/walletAuthStore";

export function WalletStateSyncer() {
  const {
    connected: adapterConnected,
    publicKey: adapterPublicKey,
    connecting,
  } = useWallet();
  const {
    syncWithDesktopWallet,
    platform,
    connected: storeConnected,
    walletAddress,
  } = useWalletAuth();

  // Add debouncing to prevent rapid-fire updates
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);
  const lastSyncState = useRef<{
    connected: boolean;
    publicKey: string | null;
  }>({
    connected: false,
    publicKey: null,
  });

  useEffect(() => {
    // Only sync if the current platform in store is not mobile (or null/desktop)
    // This prevents desktop adapter events from interfering with an active mobile session.
    if (platform !== "mobile") {
      const currentPublicKey = adapterPublicKey?.toString() || null;

      // Check if the state actually changed
      if (
        lastSyncState.current.connected === adapterConnected &&
        lastSyncState.current.publicKey === currentPublicKey
      ) {
        // No change, skip sync
        return;
      }

      // Clear existing timer
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }

      // Debounce the sync call by 100ms to prevent bouncing
      debounceTimer.current = setTimeout(() => {
        console.log(
          "[WalletStateSyncer] Syncing wallet state - Adapter:",
          {
            connected: adapterConnected,
            publicKey: currentPublicKey,
            connecting,
          },
          "Store:",
          { connected: storeConnected, address: walletAddress, platform }
        );

        syncWithDesktopWallet(adapterConnected, adapterPublicKey);

        // Update last sync state
        lastSyncState.current = {
          connected: adapterConnected,
          publicKey: currentPublicKey,
        };
      }, 100);
    }

    // Cleanup on unmount
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [
    adapterConnected,
    adapterPublicKey,
    platform,
    syncWithDesktopWallet,
    connecting,
  ]);

  // Initial sync effect to handle auto-connect scenarios
  useEffect(() => {
    // If adapter is connected but store is not, and we're on desktop, trigger immediate sync
    if (
      platform === "desktop" &&
      adapterConnected &&
      adapterPublicKey &&
      !storeConnected &&
      !connecting
    ) {
      console.log(
        "[WalletStateSyncer] Initial sync: Adapter connected but store not synced"
      );
      syncWithDesktopWallet(adapterConnected, adapterPublicKey);
    }
  }, [
    platform,
    adapterConnected,
    adapterPublicKey,
    storeConnected,
    connecting,
    syncWithDesktopWallet,
  ]);

  return null; // This component does not render anything
}
