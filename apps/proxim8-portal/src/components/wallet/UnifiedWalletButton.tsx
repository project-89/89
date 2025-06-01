"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useWalletAuth } from "@/stores/walletAuthStore";
import { ChevronDownIcon } from "@heroicons/react/24/solid";
import { useWallet } from "@solana/wallet-adapter-react";
import Image from "next/image";

// Client-side utility to check if the current platform is mobile based on userAgent
const checkIfMobilePlatform = (): boolean => {
  if (typeof navigator === "undefined") return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
};

/**
 * Unified wallet button that extends WalletMultiButton with mobile support
 * This replaces all other wallet button components in the app
 */
export function UnifiedWalletButton() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isClientMobile, setIsClientMobile] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Get all wallet and auth state from our unified store
  const {
    connected,
    walletAddress,
    isAuthenticated,
    isConnecting,
    isAuthenticating,
    error,
    // isMobile, // This is state.platform === 'mobile', not used for initial UI decision
    connect,
    authenticate,
    disconnect,
    clearError,
  } = useWalletAuth();

  // Initialize on client-side and determine if it's a mobile platform
  useEffect(() => {
    setIsClientMobile(checkIfMobilePlatform());
    setIsLoaded(true);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    }

    if (showDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showDropdown]);

  if (!isLoaded) {
    return (
      <button
        className="wallet-adapter-button wallet-adapter-button-trigger"
        disabled
      >
        Loading...
      </button>
    );
  }

  // Use the built-in WalletMultiButton for desktop but wrap it for custom styling
  if (!isClientMobile) {
    // When connected, show our custom circular design
    if (connected && isAuthenticated) {
      return (
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="w-10 h-10 rounded-full bg-primary-500/20 border border-primary-500/50 flex items-center justify-center text-primary-500 hover:bg-primary-500/30 hover:border-primary-500 transition-all duration-200 group"
            title={walletAddress as string}
          >
            <svg
              className="w-5 h-5 group-hover:scale-110 transition-transform"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
              />
            </svg>
          </button>

          {/* Dropdown Menu */}
          {showDropdown && (
            <div className="absolute right-0 mt-2 w-56 bg-gray-900 border border-gray-700 rounded-lg shadow-lg overflow-hidden z-50">
              {/* Header */}
              <div className="bg-gray-800 px-4 py-3 border-b border-gray-700">
                <p className="font-orbitron text-sm text-primary-500 font-semibold">
                  WALLET CONNECTED
                </p>
                <p className="font-space-mono text-xs text-gray-400 mt-1">
                  {walletAddress?.slice(0, 8)}...{walletAddress?.slice(-8)}
                </p>
              </div>

              {/* Actions */}
              <div className="p-2">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(walletAddress || "");
                    setShowDropdown(false);
                  }}
                  className="w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-gray-800 rounded font-space-mono"
                >
                  Copy Address
                </button>
                <button
                  onClick={() => {
                    clearError();
                    disconnect();
                    setShowDropdown(false);
                  }}
                  className="w-full text-left px-3 py-2 text-sm text-red-400 hover:bg-gray-800 rounded font-space-mono"
                >
                  Disconnect
                </button>
              </div>
            </div>
          )}
        </div>
      );
    }

    // When not connected, use the standard button to get the modal
    return <WalletMultiButton />;
  }

  // Mobile mode: Custom implementation
  // The rest of the logic remains the same as it uses actions from useWalletAuth

  // NOT CONNECTED
  if (!connected) {
    const connectButtonText = isConnecting ? "Connecting..." : "Connect Wallet";
    return (
      <div>
        <button
          disabled={isConnecting}
          onClick={() => {
            clearError();
            connect(); // This connect() will internally do the regex check again
          }}
          className="wallet-adapter-button wallet-adapter-button-trigger"
        >
          {connectButtonText}
        </button>
        {error && <div className="mt-2 text-red-500 text-sm">{error}</div>}
      </div>
    );
  }

  // CONNECTING or AUTHENTICATING
  if (isConnecting || isAuthenticating) {
    return (
      <div>
        <button
          disabled={true}
          className="wallet-adapter-button wallet-adapter-button-trigger"
        >
          {isConnecting ? "Connecting..." : "Authenticating..."}
        </button>
        {error && <div className="mt-2 text-red-500 text-sm">{error}</div>}
      </div>
    );
  }

  // CONNECTED but NOT AUTHENTICATED
  if (!isAuthenticated) {
    return (
      <div>
        <button
          disabled={isAuthenticating}
          onClick={() => {
            clearError();
            authenticate();
          }}
          className="wallet-adapter-button wallet-adapter-button-trigger"
        >
          Authenticate Wallet
        </button>
        {error && (
          <div className="mt-2">
            <div className="text-red-500 text-sm mb-2">{error}</div>
            <button
              onClick={() => {
                clearError();
                disconnect();
              }}
              className="px-3 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600"
            >
              Disconnect and Reconnect
            </button>
          </div>
        )}
      </div>
    );
  }

  // CONNECTED and AUTHENTICATED - Show circular avatar with dropdown
  const displayAddress = walletAddress;

  // Generate a better avatar based on wallet address
  const generateAvatar = (address: string) => {
    // Use the first 2 alphanumeric characters for better uniqueness
    const cleanAddress = address?.replace(/[^a-zA-Z0-9]/g, "") || "AA";
    const firstTwo = cleanAddress.slice(0, 2).toUpperCase();

    // Create a wallet icon instead of just characters
    return {
      chars: firstTwo,
      // We'll use an icon instead
    };
  };

  const avatar = generateAvatar(displayAddress || "");

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="w-10 h-10 rounded-full bg-primary-500/20 border border-primary-500/50 flex items-center justify-center text-primary-500 hover:bg-primary-500/30 hover:border-primary-500 transition-all duration-200 group"
        title={displayAddress as string}
      >
        <svg
          className="w-5 h-5 group-hover:scale-110 transition-transform"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
          />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {showDropdown && (
        <div className="absolute right-0 mt-2 w-56 bg-gray-900 border border-gray-700 rounded-lg shadow-lg overflow-hidden z-50">
          {/* Header */}
          <div className="bg-gray-800 px-4 py-3 border-b border-gray-700">
            <p className="font-orbitron text-sm text-primary-500 font-semibold">
              WALLET CONNECTED
            </p>
            <p className="font-space-mono text-xs text-gray-400 mt-1">
              {displayAddress?.slice(0, 8)}...{displayAddress?.slice(-8)}
            </p>
          </div>

          {/* Actions */}
          <div className="p-2">
            <button
              onClick={() => {
                navigator.clipboard.writeText(displayAddress || "");
                setShowDropdown(false);
              }}
              className="w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-gray-800 rounded font-space-mono"
            >
              Copy Address
            </button>
            <button
              onClick={() => {
                clearError();
                disconnect();
                setShowDropdown(false);
              }}
              className="w-full text-left px-3 py-2 text-sm text-red-400 hover:bg-gray-800 rounded font-space-mono"
            >
              Disconnect
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
