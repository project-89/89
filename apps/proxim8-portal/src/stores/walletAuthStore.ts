"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { AuthUser } from "@/types/auth";
import { useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";

import bs58 from "bs58";
import {
  generatePhantomDeeplink,
  generatePhantomSignDeeplink,
  clearAllMobileData,
  getAndClearCallbackSuccess,
} from "@/utils/mobileDetection";

// Platform detection
const isMobile = (): boolean => {
  if (typeof window === "undefined") return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
};

// Unified wallet and authentication state interface
interface WalletAuthState {
  // Connection state
  connected: boolean;
  walletAddress: string | null;
  platform: "desktop" | "mobile" | null;

  // Authentication state
  isAuthenticated: boolean;
  user: AuthUser | null;

  // Mobile-specific connection data (for signing)
  mobileSessionToken: string | null;
  mobilePhantomPublicKey: string | null;

  // Loading states
  isConnecting: boolean;
  isAuthenticating: boolean;

  // Error state
  error: string | null;

  // Internal state
  _hasInitialized: boolean;
  _walletAdapter: any; // Store reference to desktop wallet adapter
  _connectionCheckInterval: NodeJS.Timeout | null; // For mobile connection polling

  // Actions
  setConnected: (
    connected: boolean,
    address?: string,
    platform?: "desktop" | "mobile"
  ) => void;
  setAuthenticated: (authenticated: boolean, user?: AuthUser | null) => void;
  setLoading: (connecting?: boolean, authenticating?: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;

  // Main flow actions
  connect: () => Promise<boolean>;
  authenticate: () => Promise<boolean>;
  disconnect: () => void;

  // Platform-specific actions
  connectDesktop: () => Promise<boolean>;
  connectMobile: () => Promise<boolean>;
  authenticateDesktop: () => Promise<boolean>;
  authenticateMobile: () => Promise<boolean>;

  // Initialization and adapter management
  initialize: () => void;
  setWalletAdapter: (adapter: any) => void;
  syncWithDesktopWallet: (connected: boolean, publicKey?: any) => void;

  // Mobile-specific utilities
  checkMobileConnection: () => void;
  startMobileConnectionPolling: () => void;
  stopMobileConnectionPolling: () => void;
}

// Helper function to call auth API
const callAuthAPI = async (
  walletAddress: string,
  signature: string,
  message: string
): Promise<{ success: boolean; user?: AuthUser }> => {
  try {
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        walletAddress,
        signature,
        message,
      }),
    });

    if (!response.ok) {
      throw new Error(
        `Auth API error: ${response.status} ${response.statusText}`
      );
    }

    const data = await response.json();
    console.log(
      "[WalletAuthStore] Data received in callAuthAPI from /api/auth/login:",
      data
    );

    // If backend returns flat user fields, construct the user object here
    if (data.success && data.walletAddress) {
      const userObject: AuthUser = {
        walletAddress: data.walletAddress,
        isAdmin: data.isAdmin || false, // Ensure isAdmin has a default
        // Add any other fields from 'data' that should be part of the AuthUser type
        // For example, if the token itself or parts of it should be in your client-side user model:
        // token: data.token,
      };
      const result = { success: true, user: userObject };
      console.log(
        "[WalletAuthStore] callAuthAPI returning (success path - constructed user object):",
        result
      );
      return result;
    } else if (data.success) {
      // Handle cases where success is true but expected user data might be missing
      console.warn(
        "[WalletAuthStore] callAuthAPI: Auth success but user data (e.g., walletAddress) missing in response:",
        data
      );
      return { success: true, user: undefined }; // Explicitly return undefined for user
    } else {
      const result = { success: false };
      console.log(
        "[WalletAuthStore] callAuthAPI returning (failure path - data.success is falsy or other issue):",
        result,
        "Input data:",
        data
      );
      return result;
    }
  } catch (error) {
    console.error("[WalletAuthStore] Auth API call failed:", error);
    return { success: false };
  }
};

// Check if we're in SSR
const isServer = typeof window === "undefined";

const store = create<WalletAuthState>()(
  persist(
    (set, get) => ({
      // Initial state
      connected: false,
      walletAddress: null,
      platform: null,
      isAuthenticated: false,
      user: null,
      mobileSessionToken: null,
      mobilePhantomPublicKey: null,
      isConnecting: false,
      isAuthenticating: false,
      error: null,
      _hasInitialized: false,
      _walletAdapter: null,
      _connectionCheckInterval: null,

      // Basic state setters
      setConnected: (connected, address, platform) => {
        const currentState = get();
        set({
          connected,
          walletAddress: address || null,
          platform: platform || currentState.platform,
          error: connected ? null : currentState.error, // Clear errors on successful connection
          mobileSessionToken:
            platform === "mobile" && connected
              ? currentState.mobileSessionToken
              : null,
          mobilePhantomPublicKey:
            platform === "mobile" && connected
              ? currentState.mobilePhantomPublicKey
              : null,
        });
      },

      setAuthenticated: (authenticated, user) => {
        set({
          isAuthenticated: authenticated,
          user: user || null,
          error: authenticated ? null : get().error, // Clear errors on successful auth
        });
      },

      setLoading: (connecting, authenticating) => {
        const updates: Partial<WalletAuthState> = {};
        if (connecting !== undefined) updates.isConnecting = connecting;
        if (authenticating !== undefined)
          updates.isAuthenticating = authenticating;
        set(updates);
      },

      setError: (error) => {
        set({
          error,
          isConnecting: false,
          isAuthenticating: false,
        });
      },

      clearError: () => set({ error: null }),

      // Wallet adapter management
      setWalletAdapter: (adapter) => {
        set({ _walletAdapter: adapter });
      },

      syncWithDesktopWallet: (desktopAdapterConnected, desktopPublicKey) => {
        const currentState = get();

        if (currentState.platform === "mobile") {
          if (desktopAdapterConnected && desktopPublicKey) {
            console.warn(
              `[WalletAuthStore] Desktop wallet attempted to connect while a mobile session is active. Ignoring. Desktop PK: ${desktopPublicKey.toString()}`
            );
          }
          return;
        }

        const newAddress = desktopPublicKey
          ? desktopPublicKey.toString()
          : null;

        if (desktopAdapterConnected && newAddress) {
          // Adapter is passively connected (e.g., auto-connect by adapter library)
          // Update store to reflect this, including setting our 'connected' to true.
          if (
            currentState.walletAddress !== newAddress ||
            currentState.platform !== "desktop" ||
            !currentState.connected || // If our store thought it wasn't connected
            currentState.isAuthenticated // Or if it was mistakenly authenticated from persistence
          ) {
            set((state) => ({
              ...state,
              walletAddress: newAddress,
              platform: "desktop",
              connected: true, // Set our application-level connected state to true
              isAuthenticated: false, // Always reset auth on passive desktop wallet detection
              user: null, // Always reset user
            }));
            console.log(
              `[WalletAuthStore] Desktop wallet passively detected & synced: ${newAddress}. Store connected: true, isAuthenticated: false.`
            );
          }
        } else if (
          !desktopAdapterConnected &&
          currentState.platform === "desktop"
        ) {
          // Adapter disconnected passively
          if (currentState.connected || currentState.walletAddress) {
            set((state) => ({
              ...state,
              connected: false,
              walletAddress: null,
              isAuthenticated: false,
              user: null,
              platform: null, // Explicitly set platform to null on desktop disconnect
            }));
            console.log(
              `[WalletAuthStore] Desktop wallet disconnected. Store state cleared for desktop (including platform).`
            );
          }
        }
      },

      // Mobile connection utilities
      checkMobileConnection: () => {
        if (typeof window === "undefined") return;

        const currentState = get(); // Define currentState here to be accessible by .then/.catch

        // If already connected and authenticated on mobile, stop polling and exit.
        if (
          currentState.platform === "mobile" &&
          currentState.connected &&
          currentState.isAuthenticated
        ) {
          console.log(
            "[WalletAuthStore] checkMobileConnection: Already connected and authenticated on mobile. Ensuring polling is stopped."
          );
          currentState.stopMobileConnectionPolling();
          return;
        }

        console.log(
          "[WalletAuthStore] checkMobileConnection: Poller/Initializer running."
        );

        // Prioritize checking for fresh callback data first
        const callbackResult = getAndClearCallbackSuccess();
        console.log(
          "[WalletAuthStore] checkMobileConnection: getAndClearCallbackSuccess() returned:",
          callbackResult
        );

        if (
          callbackResult &&
          callbackResult.type === "connect" &&
          callbackResult.data
        ) {
          const { publicKey, sessionToken, phantomEncryptionPublicKey } =
            callbackResult.data;
          if (publicKey) {
            set({
              connected: true,
              walletAddress: publicKey,
              platform: "mobile",
              mobileSessionToken: sessionToken || null,
              mobilePhantomPublicKey: phantomEncryptionPublicKey || null,
              isConnecting: false,
              isAuthenticating: false,
              error: null,
            });
            console.log(
              `[WalletAuthStore] Mobile connection successful via callback: ${publicKey}`
            );
            currentState.stopMobileConnectionPolling();

            // Now that connection is established and state is updated,
            // The home page (via initialize/setTimeout) will handle triggering authentication.
            // const afterConnectState = get(); // Get the fresh state after set()
            // console.log("[WalletAuthStore] Auto-auth check conditions:", {
            //   platform: afterConnectState.platform,
            //   isAuthenticated: afterConnectState.isAuthenticated,
            //   isAuthenticating: afterConnectState.isAuthenticating,
            //   shouldTrigger:
            //     afterConnectState.platform === "mobile" &&
            //     !afterConnectState.isAuthenticated &&
            //     !afterConnectState.isAuthenticating,
            // });

            // if (
            //   afterConnectState.platform === "mobile" && // We just connected on mobile
            //   !afterConnectState.isAuthenticated && // And we are not yet authenticated
            //   !afterConnectState.isAuthenticating // And not already trying to authenticate
            // ) {
            //   console.log(
            //     "[WalletAuthStore] DEFERRED: Mobile authentication trigger after connect is now handled by initialize()."
            //   );
            //   // afterConnectState.authenticate(); // DO NOT trigger here anymore
            // }
            return; // Done with connect callback processing
          }
        } else if (
          callbackResult &&
          callbackResult.type === "sign" &&
          callbackResult.data
        ) {
          console.log(
            "[WalletAuthStore] Processing 'sign' callback data in checkMobileConnection:",
            callbackResult.data
          );
          // For "sign" type, callbackResult.data will now contain: { signature, message, state, timestamp }
          // publicKey will be sourced from currentState.walletAddress
          const { signature, message } = callbackResult.data as {
            signature: string;
            message: string;
          };

          // Ensure currentState.walletAddress is available
          if (!currentState.walletAddress) {
            console.error(
              "[WalletAuthStore] 'sign' callback: Missing walletAddress in current state. Cannot proceed with authentication."
            );
            set((state) => ({
              ...state,
              isAuthenticating: false,
              error: "Cannot authenticate: Wallet address not found in state.",
            }));
            currentState.stopMobileConnectionPolling();
            return;
          }

          if (currentState.walletAddress && signature && message) {
            // Use currentState.walletAddress
            // isAuthenticating should have been set to true by authenticateMobile
            callAuthAPI(currentState.walletAddress, signature, message) // Use currentState.walletAddress
              .then((authApiResult) => {
                if (authApiResult.success && authApiResult.user) {
                  set((state) => ({
                    ...state,
                    isAuthenticated: true,
                    user: authApiResult.user,
                    isAuthenticating: false,
                    error: null,
                  }));
                  console.log(
                    "[WalletAuthStore] Mobile authentication successful via sign callback."
                  );
                  currentState.stopMobileConnectionPolling();
                } else {
                  set((state) => ({
                    ...state,
                    isAuthenticated: false,
                    user: null,
                    isAuthenticating: false,
                    error: "Mobile authentication failed (API).",
                  }));
                  console.error(
                    "[WalletAuthStore] Mobile authentication failed via sign callback (API). Response:",
                    authApiResult
                  );
                  currentState.stopMobileConnectionPolling();
                }
              })
              .catch((error) => {
                console.error(
                  "[WalletAuthStore] Error during callAuthAPI from sign callback:",
                  error
                );
                set((state) => ({
                  ...state,
                  isAuthenticated: false,
                  user: null,
                  isAuthenticating: false,
                  error: "Mobile authentication error (Exception).",
                }));
                currentState.stopMobileConnectionPolling();
              });
          } else {
            console.error(
              "[WalletAuthStore] 'sign' callback data missing required fields (publicKey, signature, or message)."
            );
            set((state) => ({
              ...state,
              isAuthenticating: false,
              error: "Invalid sign callback data.",
            }));
            // Stop polling if it was running for auth and data is invalid.
            if (
              currentState._connectionCheckInterval &&
              currentState.isAuthenticating
            ) {
              currentState.stopMobileConnectionPolling();
            }
          }
          // The function returns here; state updates are async.
          return;
        }

        // REMOVED Fallback logic that used isMobileConnected/getMobileConnection
        // If no callbackResult, the polling found nothing new. Current store state is preserved.
        // If connected state is lost due to an unexpected issue (e.g. localStorage corruption for the store itself),
        // user would have to reconnect. Explicit disconnection or wallet changes on desktop are handled elsewhere.
      },

      startMobileConnectionPolling: () => {
        const currentState = get();
        if (currentState._connectionCheckInterval) return;

        console.log("[WalletAuthStore] Starting mobile connection polling");

        const interval = setInterval(() => {
          get().checkMobileConnection();
        }, 1000); // Check every second

        set({ _connectionCheckInterval: interval });
      },

      stopMobileConnectionPolling: () => {
        const currentState = get();
        if (currentState._connectionCheckInterval) {
          clearInterval(currentState._connectionCheckInterval);
          set({ _connectionCheckInterval: null });
          console.log("[WalletAuthStore] Stopped mobile connection polling");
        }
      },

      // Main flow actions
      connect: async () => {
        const mobileCheck = isMobile(); // Use the isMobile function defined in this file
        console.log(
          "[WalletAuthStore] connect action: isMobile() check returned:",
          mobileCheck
        );
        const platform = mobileCheck ? "mobile" : "desktop";
        // // FORCED MOBILE FOR TESTING
        // const platform = "mobile";
        console.log(
          "[WalletAuthStore] connect action: Determined platform:",
          platform,
          "Calling relevant connect method."
        );

        if (platform === "mobile") {
          console.log(
            "[WalletAuthStore] connect action: Calling connectMobile()"
          );
          return get().connectMobile();
        } else {
          // This branch will not be taken with the forced platform
          console.log(
            "[WalletAuthStore] connect action: Calling connectDesktop()"
          );
          return get().connectDesktop();
        }
      },

      authenticate: async () => {
        const currentState = get(); // Get current state once
        const platform = currentState.platform;
        console.log(
          "[WalletAuthStore] authenticate action: Platform is:",
          platform,
          "Calling relevant authenticate method."
        );

        if (platform === "mobile") {
          return currentState.authenticateMobile();
        } else if (platform === "desktop") {
          return currentState.authenticateDesktop();
        } else {
          console.error(
            `[WalletAuthStore] authenticate: Cannot authenticate. Platform is '${platform}', which is unknown or not set.`
          );
          currentState.setError(
            "Authentication cannot proceed: platform unknown."
          );
          return false;
        }
      },

      disconnect: async () => {
        console.log("[WalletAuthStore] disconnect: Initiated.");
        const currentState = get();

        get().stopMobileConnectionPolling();

        if (currentState.platform === "mobile") {
          clearAllMobileData();
        }

        if (
          currentState._walletAdapter &&
          currentState.platform === "desktop"
        ) {
          try {
            // Check if disconnect is a function before calling it
            if (typeof currentState._walletAdapter.disconnect === "function") {
              await currentState._walletAdapter.disconnect();
              console.log(
                "[WalletAuthStore] disconnect: Desktop adapter disconnected."
              );
            } else {
              console.warn(
                "[WalletAuthStore] disconnect: Desktop adapter does not have a disconnect method."
              );
            }
          } catch (error) {
            console.error(
              "[WalletAuthStore] Error disconnecting desktop wallet:",
              error
            );
          }
        }

        // Call backend to clear HttpOnly auth cookie
        try {
          console.log(
            "[WalletAuthStore] disconnect: Calling /api/auth/logout to clear session cookie."
          );
          const logoutResponse = await fetch("/api/auth/logout", {
            method: "POST",
          });
          if (logoutResponse.ok) {
            console.log(
              "[WalletAuthStore] disconnect: Logout API call successful."
            );
          } else {
            console.warn(
              "[WalletAuthStore] disconnect: Logout API call failed.",
              logoutResponse.status,
              await logoutResponse.text()
            );
          }
        } catch (error) {
          console.error(
            "[WalletAuthStore] disconnect: Error calling logout API:",
            error
          );
        }

        // Clear all client-side store state
        set({
          connected: false,
          walletAddress: null,
          platform: null,
          isAuthenticated: false,
          user: null,
          mobileSessionToken: null,
          mobilePhantomPublicKey: null,
          isConnecting: false,
          isAuthenticating: false,
          error: null,
          _walletAdapter: null, // Clear adapter reference
          _connectionCheckInterval: null, // Clear any polling interval
          // _hasInitialized: false, // Optional: reset if you want initialize to run fully again on next visit
        });
        console.log(
          "[WalletAuthStore] disconnect: Client-side store state cleared."
        );

        if (typeof window !== "undefined") {
          sessionStorage.removeItem("auth_attempted");
          // Clear wallet-auth-store from localStorage to ensure clean state
          localStorage.removeItem("wallet-auth-store");
          console.log(
            "[WalletAuthStore] disconnect: Cleared localStorage wallet-auth-store and sessionStorage auth_attempted."
          );
        }
      },

      // Desktop-specific implementations
      connectDesktop: async () => {
        console.log("[WalletAuthStore] connectDesktop: CALLED");
        const currentState = get();
        const adapter = currentState._walletAdapter;

        console.log(
          "[WalletAuthStore] connectDesktop: Adapter current status:",
          {
            adapterExists: !!adapter,
            adapterConnected: adapter?.connected,
            adapterConnecting: adapter?.connecting,
            adapterPublicKey: adapter?.publicKey?.toString(),
          }
        );

        if (!adapter) {
          // Simplified check: if no adapter, can't proceed.
          console.error(
            "[WalletAuthStore] connectDesktop: No adapter available AT ALL."
          );
          get().setError("Wallet adapter not initialized. Please refresh.");
          return false;
        }

        // If adapter says it has a public key, consider it pre-connected for this flow's purpose.
        if (adapter.publicKey) {
          console.log(
            "[WalletAuthStore] connectDesktop: Adapter already has a publicKey. Treating as already connected by adapter.",
            adapter.publicKey.toString()
          );
          // Update our store if it doesn't match
          if (
            !currentState.connected ||
            currentState.walletAddress !== adapter.publicKey.toString()
          ) {
            set((state) => ({
              ...state,
              connected: true,
              walletAddress: adapter.publicKey.toString(),
              platform: "desktop",
              isAuthenticated: false,
              user: null,
              isConnecting: false,
            }));
            console.log(
              "[WalletAuthStore] connectDesktop: Store updated to reflect pre-existing adapter connection."
            );
          }
          return true; // Successfully "connected" from our store's perspective
        }

        if (currentState.isConnecting) {
          console.log("[WalletAuthStore] connectDesktop: Already connecting.");
          return false;
        }

        get().setLoading(true, undefined);
        get().clearError();

        try {
          // The adapter.connect() might not be needed if the wallet auto-connects or is already connected
          // However, calling it ensures the adapter is in a connected state if it wasn't.
          // Some adapters might throw if already connected, others might no-op.
          if (adapter.connecting) {
            console.log(
              "[WalletAuthStore] connectDesktop: Adapter is already in the process of connecting."
            );
            // Potentially wait for it or trust syncWithDesktopWallet will catch it.
            // For now, let's assume it will resolve.
          } else if (!adapter.connected) {
            console.log(
              "[WalletAuthStore] connectDesktop: Adapter not connected, calling adapter.connect()."
            );
            await adapter.connect();
          }

          // After attempting connection, re-check adapter state
          if (adapter.connected && adapter.publicKey) {
            const newAddress = adapter.publicKey.toString();
            console.log(
              `[WalletAuthStore] connectDesktop: Adapter connected successfully. Wallet: ${newAddress}`
            );
            set((state) => ({
              ...state,
              connected: true,
              walletAddress: newAddress,
              platform: "desktop",
              isAuthenticated: false, // Explicitly set to false on connect
              user: null, // Clear user on new connect
              isConnecting: false,
            }));
            return true;
          } else {
            console.error(
              "[WalletAuthStore] connectDesktop: Adapter connection failed or public key not available post-connect attempt."
            );
            get().setError(
              "Failed to connect to desktop wallet. The wallet may have rejected the connection or is unavailable."
            );
            get().setLoading(false, undefined);
            return false;
          }
        } catch (error) {
          const errorMessage =
            error instanceof Error
              ? error.message
              : "Desktop connection failed";
          console.error(
            "[WalletAuthStore] connectDesktop: Error during connection process:",
            error
          );
          get().setError(errorMessage);
          get().setLoading(false, undefined);
          return false;
        }
      },

      authenticateDesktop: async () => {
        console.log("[WalletAuthStore] authenticateDesktop: CALLED");
        const currentState = get();
        console.log(
          "[WalletAuthStore] authenticateDesktop: Initial current state:",
          {
            connected: currentState.connected,
            walletAddress: currentState.walletAddress,
            platform: currentState.platform,
            isAuthenticated: currentState.isAuthenticated,
            isAuthenticating: currentState.isAuthenticating,
            adapterExists: !!currentState._walletAdapter,
            adapterPublicKey:
              currentState._walletAdapter?.publicKey?.toString(),
            adapterSignMessageExists:
              typeof currentState._walletAdapter?.signMessage === "function",
          }
        );

        if (
          !currentState.connected ||
          !currentState.walletAddress ||
          currentState.platform !== "desktop"
        ) {
          get().setError("No desktop wallet connected");
          return false;
        }

        if (currentState.isAuthenticating) {
          return false; // Already authenticating
        }

        get().setLoading(undefined, true);
        get().clearError();

        try {
          // Check if we already tried auth in this session (to prevent loops)
          if (typeof window !== "undefined") {
            const hasTriedAuth = sessionStorage.getItem("auth_attempted");
            console.log(
              "[WalletAuthStore] authenticateDesktop: sessionStorage 'auth_attempted' check:",
              { hasTriedAuth, isAuthenticated: currentState.isAuthenticated }
            );
            if (hasTriedAuth && currentState.isAuthenticated) {
              console.log(
                "[WalletAuthStore] authenticateDesktop: Bailing out because auth_attempted is set and already authenticated."
              );
              get().setLoading(undefined, false);
              return true;
            }
          }

          // Get the wallet adapter for signing
          const adapter = currentState._walletAdapter;
          if (!adapter || !adapter.signMessage || !adapter.publicKey) {
            get().setError("Wallet not ready for signing");
            console.error(
              "[WalletAuthStore] authenticateDesktop: Wallet not ready for signing. Adapter:",
              {
                adapterExists: !!adapter,
                adapterSignMessageExists:
                  typeof adapter?.signMessage === "function",
                adapterPublicKey: adapter?.publicKey?.toString(),
              }
            );
            return false;
          }

          // Generate auth message
          const timestamp = Date.now();
          const message = `Sign this message to authenticate with Proxim8: ${timestamp}`;

          // Sign the message
          const messageBytes = new TextEncoder().encode(message);
          console.log(
            "[WalletAuthStore] authenticateDesktop: Attempting to call adapter.signMessage()..."
          );
          const signatureBytes = await adapter.signMessage(messageBytes);
          console.log(
            "[WalletAuthStore] authenticateDesktop: adapter.signMessage() successful. Signature bytes received."
          );
          const signature = bs58.encode(signatureBytes);

          // Call auth API
          const authResult = await callAuthAPI(
            currentState.walletAddress,
            signature,
            message
          );

          if (authResult.success && authResult.user) {
            get().setAuthenticated(true, authResult.user);

            // Mark auth as attempted to prevent loops
            if (typeof window !== "undefined") {
              sessionStorage.setItem("auth_attempted", "true");
            }

            console.log("[WalletAuthStore] Desktop authentication successful");
            return true;
          } else {
            get().setError("Authentication failed");
            return false;
          }
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : "Authentication failed";
          get().setError(errorMessage);
          console.error(
            "[WalletAuthStore] Desktop authentication error:",
            error
          );
          return false;
        } finally {
          get().setLoading(undefined, false);
        }
      },

      // Mobile implementations
      connectMobile: async () => {
        const currentState = get();
        console.log("[WalletAuthStore] connectMobile: Entered function.");

        if (currentState.isConnecting) {
          console.log(
            "[WalletAuthStore] connectMobile: Already connecting, exiting."
          );
          return false; // Already connecting
        }

        // Check if already connected via the store's state - THIS IS THE AUTHORITATIVE CHECK
        if (
          currentState.connected &&
          currentState.platform === "mobile" &&
          currentState.walletAddress
        ) {
          console.log(
            "[WalletAuthStore] connectMobile: Already connected in store:",
            currentState.walletAddress
          );
          get().setLoading(false, undefined); // Ensure loading is false if already connected
          return true;
        }

        get().setLoading(true, undefined);
        get().clearError();
        console.log(
          "[WalletAuthStore] connectMobile: Set loading true, cleared error."
        );

        try {
          // Generate Phantom deeplink for connection
          if (typeof window === "undefined") {
            console.error(
              "[WalletAuthStore] connectMobile: Cannot connect on server side."
            );
            throw new Error("Cannot connect on server side");
          }

          const baseUrl = window.location.origin;
          const callbackUrl = "/wallet-callback";
          console.log(
            `[WalletAuthStore] connectMobile: baseUrl: ${baseUrl}, callbackUrl: ${callbackUrl}`
          );

          const deeplink = generatePhantomDeeplink(baseUrl, callbackUrl);
          console.log(
            "[WalletAuthStore] connectMobile: Generated deeplink:",
            deeplink
          );

          if (
            !deeplink ||
            typeof deeplink !== "string" ||
            !deeplink.startsWith("phantom://")
          ) {
            console.error(
              "[WalletAuthStore] connectMobile: Invalid or empty deeplink generated:",
              deeplink
            );
            get().setError("Failed to generate wallet connection link.");
            get().setLoading(false, undefined);
            return false;
          }

          // Start polling for connection result
          get().startMobileConnectionPolling();
          console.log(
            "[WalletAuthStore] connectMobile: Started mobile connection polling."
          );

          // Open Phantom app
          console.log(
            "[WalletAuthStore] connectMobile: Attempting to open Phantom app with deeplink..."
          );
          window.open(deeplink, "_self");
          console.log(
            "[WalletAuthStore] connectMobile: window.open call completed."
          );

          // Don't set loading to false here - let the polling handle it
          return true;
        } catch (error) {
          const errorMessage =
            error instanceof Error
              ? error.message
              : "Failed to connect mobile wallet";
          get().setError(errorMessage);
          console.error(
            "[WalletAuthStore] connectMobile: Error caught:",
            error
          );
          get().setLoading(false, undefined);
          return false;
        }
      },

      authenticateMobile: async () => {
        const currentState = get();
        console.log(
          "[WalletAuthStore] authenticateMobile: Entered function. Current state:",
          {
            connected: currentState.connected,
            walletAddress: currentState.walletAddress,
            platform: currentState.platform,
            mobileSessionToken: currentState.mobileSessionToken,
            mobilePhantomPublicKey: currentState.mobilePhantomPublicKey,
            isAuthenticating: currentState.isAuthenticating,
          }
        );

        if (
          !currentState.connected ||
          !currentState.walletAddress ||
          currentState.platform !== "mobile"
        ) {
          get().setError("No mobile wallet connected for authentication.");
          return false;
        }

        if (
          !currentState.mobileSessionToken ||
          !currentState.mobilePhantomPublicKey
        ) {
          get().setError(
            "Missing session token or Phantom public key for mobile signing. Please reconnect."
          );
          console.error(
            "[WalletAuthStore authenticateMobile] Critical: Missing mobileSessionToken or mobilePhantomPublicKey for signing.",
            {
              tokenExists: !!currentState.mobileSessionToken,
              phantomPkExists: !!currentState.mobilePhantomPublicKey,
            }
          );
          return false;
        }

        if (currentState.isAuthenticating) {
          return false; // Already authenticating
        }

        get().setLoading(undefined, true);
        get().clearError();

        try {
          const timestamp = Date.now();
          const message = `Sign this message to authenticate with Proxim8: ${timestamp}`;

          if (typeof window === "undefined") {
            throw new Error("Cannot authenticate on server side");
          }

          const baseUrl = window.location.origin;
          const callbackUrl = "/wallet-callback"; // This will be for the SIGN callback
          console.log(
            `[WalletAuthStore authenticateMobile] baseUrl: ${baseUrl}, callbackUrl (for sign): ${callbackUrl}`
          );

          const signDeeplink = generatePhantomSignDeeplink(
            message,
            baseUrl,
            callbackUrl,
            currentState.mobileSessionToken, // Must be valid
            currentState.mobilePhantomPublicKey // Must be valid
          );
          console.log(
            "[WalletAuthStore authenticateMobile] Generated SIGN deeplink:",
            signDeeplink
          );

          if (!signDeeplink || !signDeeplink.startsWith("phantom://")) {
            console.error(
              "[WalletAuthStore authenticateMobile] Invalid or empty SIGN deeplink generated.",
              signDeeplink
            );
            get().setError("Failed to generate wallet signing link.");
            get().setLoading(undefined, false);
            return false;
          }

          // Start polling for auth result (sign callback)
          get().startMobileConnectionPolling();

          // Open Phantom app for signing
          console.log("[WalletAuthStore] Opening Phantom for authentication");
          window.open(signDeeplink, "_self");

          // The actual auth completion will be handled by callback processing
          // Don't set loading to false here - let the callback handler do it
          return true;
        } catch (error) {
          const errorMessage =
            error instanceof Error
              ? error.message
              : "Failed to authenticate mobile wallet";
          get().setError(errorMessage);
          console.error(
            "[WalletAuthStore authenticateMobile] Mobile authentication error caught:",
            error
          );
          get().setLoading(undefined, false);
          return false;
        }
      },

      // Initialization function to detect existing connections
      initialize: () => {
        if (useWalletAuthStore.getState()._hasInitialized) return;
        useWalletAuthStore.setState({ _hasInitialized: true });

        const currentDetectedPlatform = isMobile() ? "mobile" : "desktop";
        // Get potentially persisted state or state possibly set by an early syncWithDesktopWallet
        const currentState = useWalletAuthStore.getState();

        console.log(
          `[WalletAuthStore] initialize: Starting. Detected: ${currentDetectedPlatform}. Current store state before desktop/mobile specific logic: platform=${currentState.platform}, connected=${currentState.connected}, walletAddress=${currentState.walletAddress}`
        );

        if (currentDetectedPlatform === "desktop") {
          useWalletAuthStore.setState((state) => ({
            ...state, // Preserve existing state like connected and walletAddress if set by sync
            platform: "desktop",
            // connected: false, // DO NOT blindly set connected: false. Let syncWithDesktopWallet handle this based on adapter.
            isAuthenticated: false, // ALWAYS reset authentication for a new desktop session
            user: null, // ALWAYS reset user
            mobileSessionToken: null, // Clear any stale mobile data
            mobilePhantomPublicKey: null,
            error: null, // Clear any errors from previous session
          }));
          console.log(
            `[WalletAuthStore] initialize: Desktop session. Ensured isAuthenticated is false. Platform set to 'desktop'. Current connected: ${useWalletAuthStore.getState().connected}`
          );
        } else {
          // Mobile logic (relatively unchanged, but ensure it also respects prior connection state if applicable)
          if (currentState.platform !== "mobile") {
            useWalletAuthStore.setState((state) => ({
              ...state,
              platform: "mobile",
              connected: false,
              walletAddress: null,
              isAuthenticated: false,
              user: null,
              error: null,
            }));
            console.log(
              `[WalletAuthStore] initialize: Mobile session. Platform aligned to 'mobile'. State reset from '${currentState.platform}'.`
            );
          } else {
            useWalletAuthStore.setState((state) => ({
              ...state,
              platform: "mobile",
            }));
          }
          console.log(
            "[WalletAuthStore] initialize: Platform is mobile. Running mobile connection checks."
          );
          useWalletAuthStore.getState().checkMobileConnection();
          useWalletAuthStore.getState().startMobileConnectionPolling();
        }

        // Auto-authentication logic for early connections (e.g. mobile callback, or if desktop autoconnect was on)
        setTimeout(() => {
          const state = useWalletAuthStore.getState(); // Get raw store state
          console.log(
            `[WalletAuthStore] initialize (post-timeout auto-auth check): State before deciding to call authenticate: connected=${state.connected}, authenticated=${state.isAuthenticated}, platform='${state.platform}', isAuthenticating=${state.isAuthenticating}, currentDetectedPlatform=${currentDetectedPlatform}`
          );
          if (
            state.connected &&
            !state.isAuthenticated &&
            !state.isAuthenticating
          ) {
            if (
              state.platform === "desktop" &&
              currentDetectedPlatform === "desktop"
            ) {
              console.log(
                `!!!!!!!!!! [WalletAuthStore] initialize (setTimeout): Desktop platform - Condition MET to call authenticate(). connected=${state.connected}, !isAuth=${!state.isAuthenticated}, !isAuthING=${!state.isAuthenticating}, platform=${state.platform}. CALLING state.authenticate() NOW. !!!!!!!!!!!`
              );
              state.authenticate();
            } else if (
              state.platform === "mobile" &&
              currentDetectedPlatform === "mobile"
            ) {
              console.log(
                `[WalletAuthStore] initialize (setTimeout): Mobile platform - Condition MET to call authenticate(). connected=${state.connected}, !isAuth=${!state.isAuthenticated}, !isAuthING=${!state.isAuthenticating}, platform=${state.platform}. CALLING state.authenticate() NOW.`
              );
              state.authenticate();
            } else {
              console.warn(
                `[WalletAuthStore] initialize (setTimeout): Auto-auth condition SKIPPED. Store platform '${state.platform}' !== initial detected platform '${currentDetectedPlatform}', or not desktop.`
              );
            }
          } else if (
            state.platform === "mobile" &&
            state.connected &&
            state.isAuthenticated
          ) {
            console.log(
              "[WalletAuthStore] initialize (post-timeout auto-auth check): Mobile already connected & authenticated. Ensuring polling stops."
            );
            state.stopMobileConnectionPolling();
          } else {
            console.log(
              "[WalletAuthStore] initialize (post-timeout auto-auth check): Conditions for early auto-auth not met."
            );
          }
        }, 250);

        console.log(
          `[WalletAuthStore] initialize: Completed. Store platform is now '${useWalletAuthStore.getState().platform}'.`
        );
      },
    }),
    {
      name: "wallet-auth-store",
      storage: createJSONStorage(
        () =>
          isServer
            ? {
                getItem: () => null,
                setItem: () => null,
                removeItem: () => null,
              }
            : localStorage // Using localStorage for persistence across page refreshes
      ),
      partialize: (state) => ({
        // Only persist essential state
        connected: state.connected,
        walletAddress: state.walletAddress,
        platform: state.platform,
        isAuthenticated: state.isAuthenticated,
        user: state.user,
        mobileSessionToken: state.mobileSessionToken,
        mobilePhantomPublicKey: state.mobilePhantomPublicKey,
        _hasInitialized: state._hasInitialized,
        // Don't persist loading states, errors, adapter references, or intervals
        // isAuthenticating should NOT be persisted as it's a transient state
      }),
    }
  )
);

export const useWalletAuthStore = store;
export default store;

// Convenience hooks for common use cases
export const useWalletAuth = () => {
  const storeState = useWalletAuthStore();
  const { wallet } = useWallet(); // Get the 'wallet' object from useWallet()

  const {
    connected,
    walletAddress,
    platform,
    isAuthenticated,
    user,
    isConnecting,
    isAuthenticating,
    error,
    _hasInitialized,
    _walletAdapter, // Current adapter from our store for comparison & use in returned methods if needed
    connect,
    authenticate,
    disconnect,
    clearError,
    syncWithDesktopWallet,
    setWalletAdapter,
  } = storeState;

  useEffect(() => {
    const currentAdapterFromHook = wallet?.adapter || null; // Get adapter from wallet object, can be null

    if (currentAdapterFromHook && _walletAdapter !== currentAdapterFromHook) {
      console.log(
        "[useWalletAuth effect] Wallet adapter instance changed/received. Setting in store:",
        currentAdapterFromHook.name
      );
      setWalletAdapter(currentAdapterFromHook);
    } else if (!currentAdapterFromHook && _walletAdapter) {
      console.log(
        "[useWalletAuth effect] Adapter from useWallet() is null, but store had one. Clearing from store."
      );
      setWalletAdapter(null);
    }
    // Depends on the `wallet` object from useWallet (which contains the adapter),
    // the store's current _walletAdapter for comparison, and the action to set it.
  }, [wallet, _walletAdapter, setWalletAdapter]);

  // Initialize on first mount of any component using the hook, only on client
  if (
    typeof window !== "undefined" &&
    !_hasInitialized // Directly use the destructured _hasInitialized
  ) {
    // Call initialize on the store instance if it hasn't been called.
    // initialize is part of storeState, so it's storeState.initialize()
    storeState.initialize();
  }

  // Effect for automatic authentication on desktop after connection
  useEffect(() => {
    if (typeof window !== "undefined" && _hasInitialized) {
      console.log(
        "[useWalletAuth effect] Checking conditions for DESKTOP auth:",
        {
          platform,
          connected,
          isAuthenticated,
          isAuthenticating,
          _hasInitialized,
        }
      );
      if (
        platform === "desktop" &&
        connected &&
        !isAuthenticated &&
        !isAuthenticating
      ) {
        console.log(
          "[useWalletAuth effect] Desktop is connected, not authenticated, and not currently authenticating. Triggering authenticate()."
        );
        authenticate(); // Directly use the destructured authenticate action
      }
    }
  }, [
    connected,
    isAuthenticated,
    isAuthenticating,
    platform,
    authenticate, // Destructured action
    _hasInitialized,
  ]);

  // Effect for automatic authentication on MOBILE after connection
  useEffect(() => {
    if (typeof window !== "undefined" && _hasInitialized) {
      console.log(
        "[useWalletAuth effect] Checking conditions for MOBILE auth:",
        {
          platform,
          connected,
          isAuthenticated,
          isAuthenticating,
          _hasInitialized,
        }
      );
      if (
        platform === "mobile" &&
        connected &&
        !isAuthenticated &&
        !isAuthenticating
      ) {
        console.log(
          "[useWalletAuth effect] Mobile is connected, not authenticated, and not currently authenticating. Triggering authenticate()."
        );
        authenticate(); // This will call authenticateMobile via the generic authenticate action
      }
    }
  }, [
    connected,
    isAuthenticated,
    isAuthenticating,
    platform,
    authenticate,
    _hasInitialized,
  ]);

  return {
    // State
    connected,
    walletAddress,
    platform,
    isAuthenticated,
    user,
    isConnecting,
    isAuthenticating,
    error,

    // Actions
    connect,
    authenticate,
    disconnect,
    clearError,

    // Internal methods
    syncWithDesktopWallet,
    setWalletAdapter,

    // Computed values
    isLoading: isConnecting || isAuthenticating,
    isMobile: platform === "mobile",
    isDesktop: platform === "desktop",
  };
};
