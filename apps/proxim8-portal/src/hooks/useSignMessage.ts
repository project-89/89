"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import bs58 from "bs58";
import { useCallback } from "react";

/**
 * Hook to sign messages with the connected wallet
 */
export const useSignMessage = () => {
  // Get wallet functionality directly to avoid unnecessary re-renders
  const wallet = useWallet();

  /**
   * Sign a message using the connected wallet
   * @param message The message to sign
   * @returns The base58 encoded signature or null if signature fails
   */
  const sign = useCallback(
    async (message: string): Promise<string | null> => {
      // Check if wallet is ready for signing
      if (!wallet.signMessage || !wallet.publicKey) {
        console.log(
          "[useSignMessage] Cannot sign - wallet not connected or signMessage not available"
        );
        return null;
      }

      try {
        // Encode the message to Uint8Array
        const messageBytes = new TextEncoder().encode(message);

        // Sign the message
        const signature = await wallet.signMessage(messageBytes);

        // Return the signature as a base58 string
        return bs58.encode(signature);
      } catch (error) {
        console.error("[useSignMessage] Error signing message:", error);
        return null;
      }
    },
    [wallet.signMessage, wallet.publicKey]
  );

  return {
    signMessage: sign,
    publicKey: wallet.publicKey,
    walletAddress: wallet.publicKey ? wallet.publicKey.toBase58() : null,
  };
};
