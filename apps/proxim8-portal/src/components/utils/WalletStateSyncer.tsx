"use client";

import { useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletAuth } from "@/stores/walletAuthStore";

export function WalletStateSyncer() {
  const { connected: adapterConnected, publicKey: adapterPublicKey } =
    useWallet();
  const { syncWithDesktopWallet, platform } = useWalletAuth(); // Get platform to avoid syncing if mobile is active

  useEffect(() => {
    // Only sync if the current platform in store is not mobile (or null/desktop)
    // This prevents desktop adapter events from interfering with an active mobile session.
    if (platform !== "mobile") {
      // console.log(
      //   "[WalletStateSyncer] Detected adapter change. Adapter connected:",
      //   adapterConnected,
      //   "Adapter PublicKey:",
      //   adapterPublicKey?.toString()
      // );
      syncWithDesktopWallet(adapterConnected, adapterPublicKey);
    }
  }, [adapterConnected, adapterPublicKey, syncWithDesktopWallet, platform]);

  return null; // This component does not render anything
}
