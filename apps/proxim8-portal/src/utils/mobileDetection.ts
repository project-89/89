/**
 * Mobile browser detection and Phantom deeplink utilities
 * Implements proper two-step flow: connect then sign
 */

import nacl from "tweetnacl";
import bs58 from "bs58";

export const isMobile = (): boolean => {
  if (typeof window === "undefined") return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
};

export const isIOS = (): boolean => {
  if (typeof window === "undefined") return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent);
};

export const isAndroid = (): boolean => {
  if (typeof window === "undefined") return false;
  return /Android/.test(navigator.userAgent);
};

export const isPhantomInstalled = (): boolean => {
  if (typeof window === "undefined") return false;
  return !!(window as any).phantom?.solana;
};

// Mobile debugging system - simplified for production
const MOBILE_DEBUG_KEY = "phantom_mobile_debug";

export const addMobileDebugStep = (step: string) => {
  if (typeof window === "undefined" || process.env.NODE_ENV === "production")
    return;

  try {
    const timestamp = Date.now();
    const existingDebug = localStorage.getItem(MOBILE_DEBUG_KEY);
    const debugSteps = existingDebug ? JSON.parse(existingDebug) : [];
    debugSteps.push({
      timestamp: new Date().toISOString(),
      step,
    });
    localStorage.setItem(MOBILE_DEBUG_KEY, JSON.stringify(debugSteps, null, 2));
  } catch (e) {
    // Ignore debug storage errors in production
  }
};

const clearMobileDebugSteps = () => {
  if (typeof window === "undefined") return;
  localStorage.removeItem(MOBILE_DEBUG_KEY);
};

export const getMobileDebugSteps = () => {
  if (typeof window === "undefined" || process.env.NODE_ENV === "production")
    return [];
  try {
    const debugSteps = localStorage.getItem(MOBILE_DEBUG_KEY);
    return debugSteps ? JSON.parse(debugSteps) : [];
  } catch (e) {
    return [];
  }
};

// Generate a keypair for encryption - store in sessionStorage to persist across redirects
const getDappKeyPair = () => {
  if (typeof window === "undefined") {
    console.log(
      "[getDappKeyPair] SSR context: Returning new ephemeral keypair."
    );
    return nacl.box.keyPair(); // Should ideally not be hit in client flows
  }

  console.log(
    "[getDappKeyPair] Attempting to retrieve/generate keypair on client."
  );
  let origin = "unknown";

  // Try sessionStorage first (preferred)
  try {
    const sessionStored = sessionStorage.getItem("dapp_keypair");
    if (sessionStored) {
      console.log("[getDappKeyPair] Found keypair in sessionStorage.");
      const parsed = JSON.parse(sessionStored);
      const keyPair = {
        publicKey: new Uint8Array(parsed.publicKey),
        secretKey: new Uint8Array(parsed.secretKey),
      };
      origin = "sessionStorage";
      // Also store in localStorage as backup (or refresh it)
      try {
        localStorage.setItem("dapp_keypair_backup", sessionStored);
      } catch (e) {
        console.warn(
          "[getDappKeyPair] Failed to set localStorage backup from sessionData:",
          e
        );
      }
      console.log(
        `[getDappKeyPair] Successfully retrieved and parsed from ${origin}. Public key (first 5 bytes): ${keyPair.publicKey.slice(0, 5).toString()}`
      );
      return keyPair;
    } else {
      console.log("[getDappKeyPair] Keypair NOT found in sessionStorage.");
    }
  } catch (error) {
    console.error(
      "[getDappKeyPair] Error accessing/parsing sessionStorage:",
      error
    );
  }

  // Try localStorage backup
  try {
    const localStored = localStorage.getItem("dapp_keypair_backup");
    if (localStored) {
      console.log("[getDappKeyPair] Found keypair in localStorage backup.");
      const parsed = JSON.parse(localStored);
      const keyPair = {
        publicKey: new Uint8Array(parsed.publicKey),
        secretKey: new Uint8Array(parsed.secretKey),
      };
      origin = "localStorageBackup";
      // Restore to sessionStorage
      try {
        sessionStorage.setItem("dapp_keypair", localStored);
        console.log(
          "[getDappKeyPair] Restored keypair to sessionStorage from backup."
        );
      } catch (e) {
        console.warn(
          "[getDappKeyPair] Failed to restore to sessionStorage from backup:",
          e
        );
      }
      console.log(
        `[getDappKeyPair] Successfully retrieved and parsed from ${origin}. Public key (first 5 bytes): ${keyPair.publicKey.slice(0, 5).toString()}`
      );
      return keyPair;
    } else {
      console.log("[getDappKeyPair] Keypair NOT found in localStorage backup.");
    }
  } catch (error) {
    console.error(
      "[getDappKeyPair] Error accessing/parsing localStorage backup:",
      error
    );
  }

  // Generate new keypair
  console.log(
    "[getDappKeyPair] Generating NEW keypair as it was not found in storage or storage failed."
  );
  const keyPair = nacl.box.keyPair();
  const keypairData = JSON.stringify({
    publicKey: Array.from(keyPair.publicKey),
    secretKey: Array.from(keyPair.secretKey),
  });
  origin = "newlyGenerated";

  try {
    sessionStorage.setItem("dapp_keypair", keypairData);
    localStorage.setItem("dapp_keypair_backup", keypairData);
    console.log(
      "[getDappKeyPair] Stored newly generated keypair in sessionStorage and localStorage backup."
    );
  } catch (error) {
    console.error(
      "[getDappKeyPair] Failed to store newly generated keypair:",
      error
    );
    // If storage fails, the keypair will be ephemeral for this session/instance of the util
  }
  console.log(
    `[getDappKeyPair] Created ${origin} keypair. Public key (first 5 bytes): ${keyPair.publicKey.slice(0, 5).toString()}`
  );
  return keyPair;
};

/**
 * Generate Phantom deeplink for wallet connection
 */
export const generatePhantomDeeplink = (
  baseUrl: string,
  callbackUrl: string
): string => {
  try {
    const dappKeyPair = getDappKeyPair();
    const dappEncryptionPublicKey = bs58.encode(dappKeyPair.publicKey);

    // Clean URLs - ensure no trailing slashes
    const cleanBaseUrl = baseUrl.replace(/\/$/, "");
    const cleanCallbackUrl = callbackUrl.startsWith("http")
      ? callbackUrl
      : `${cleanBaseUrl}${callbackUrl}`;

    // Don't modify the callback URL with session IDs - keep it clean
    // Session management should be handled differently
    const finalCallbackUrl = cleanCallbackUrl;

    // Build the required parameters exactly as Phantom expects
    const params = new URLSearchParams({
      dapp_encryption_public_key: dappEncryptionPublicKey,
      cluster: "mainnet-beta",
      app_url: cleanBaseUrl,
      redirect_link: finalCallbackUrl,
    });

    // Use custom scheme for mobile app
    const deeplink = `phantom://v1/connect?${params.toString()}`;

    console.log("[Phantom] Generated deeplink:", deeplink);
    console.log("[Phantom] Parameters:", {
      dapp_encryption_public_key: dappEncryptionPublicKey,
      cluster: "mainnet-beta",
      app_url: cleanBaseUrl,
      redirect_link: finalCallbackUrl,
    });

    return deeplink;
  } catch (error) {
    console.error("Error generating Phantom deeplink:", error);

    // Fallback - still avoid session modifications
    const fallbackParams = new URLSearchParams({
      dapp_encryption_public_key: "fallback",
      cluster: "mainnet-beta",
      app_url: baseUrl,
      redirect_link: callbackUrl,
    });

    return `phantom://v1/connect?${fallbackParams.toString()}`;
  }
};

/**
 * Handle callback from Phantom
 */
export const handlePhantomCallback = (
  searchParams: URLSearchParams
): {
  success: boolean;
  message: string;
  data?: {
    publicKey: string;
    phantomEncryptionPublicKey?: string;
    sessionToken?: string;
  };
} => {
  try {
    // Check for any error parameters first
    const errorCode = searchParams.get("errorCode");
    const errorMessage = searchParams.get("errorMessage");

    if (errorCode || errorMessage) {
      return {
        success: false,
        message: `Phantom Error: ${errorMessage || `Code ${errorCode}`}`,
      };
    }

    // Check for connection success parameters (encrypted response)
    const phantomEncryptionPublicKeyFromParam = searchParams.get(
      "phantom_encryption_public_key"
    );
    const dataParam = searchParams.get("data");
    const nonceParam = searchParams.get("nonce");

    if (!phantomEncryptionPublicKeyFromParam || !dataParam || !nonceParam) {
      // Also check for any direct parameters (fallback/older versions?)
      const publicKey =
        searchParams.get("publicKey") || searchParams.get("public_key");
      if (publicKey) {
        // This fallback path might not provide sessionToken or full phantomEncryptionPublicKey
        // It's less secure and might be for older Phantom versions or non-encrypted responses.
        // The main store should be aware if data is incomplete.
        return {
          success: true,
          message: "Successfully connected to Phantom (direct response)",
          data: {
            publicKey: publicKey,
            // phantomEncryptionPublicKey and sessionToken might be missing here
          },
        };
      }

      return {
        success: false,
        message: "Missing required encrypted parameters from Phantom response",
      };
    }

    // Get our stored keypair for decryption
    const dappKeyPair = getDappKeyPair();

    // Validate the keys before proceeding (using renamed param variables)
    try {
      const phantomPublicKeyBytes = bs58.decode(
        phantomEncryptionPublicKeyFromParam
      );
      const dataBytes = bs58.decode(dataParam);
      const nonceBytes = bs58.decode(nonceParam);

      if (phantomPublicKeyBytes.length !== 32) {
        throw new Error(
          `Invalid Phantom public key length: ${phantomPublicKeyBytes.length}, expected 32`
        );
      }
      if (nonceBytes.length !== 24) {
        throw new Error(
          `Invalid nonce length: ${nonceBytes.length}, expected 24`
        );
      }
    } catch (decodeError) {
      return {
        success: false,
        message: `Failed to decode parameters: ${decodeError instanceof Error ? decodeError.message : "Unknown error"}`,
      };
    }

    // Generate shared secret for decryption
    try {
      const sharedSecret = nacl.box.before(
        bs58.decode(phantomEncryptionPublicKeyFromParam),
        dappKeyPair.secretKey
      );

      // Decrypt the data
      const decryptedData = nacl.box.open.after(
        bs58.decode(dataParam),
        bs58.decode(nonceParam),
        sharedSecret
      );

      if (!decryptedData) {
        return {
          success: false,
          message:
            "Failed to decrypt response from Phantom - keypair mismatch or corrupted data",
        };
      }

      const decryptedString = Buffer.from(decryptedData).toString("utf8");
      const connectData = JSON.parse(decryptedString);

      // DO NOT store the connection info here directly in localStorage.
      // Return it for the store to handle.
      // const connectionInfo = {
      //   connected: true,
      //   publicKey: connectData.public_key,
      //   timestamp: Date.now(),
      //   phantomPublicKey: phantomEncryptionPublicKeyFromParam,
      //   sessionToken: connectData.session || connectData.sessionToken,
      // };
      // localStorage.setItem(
      //   "phantom_mobile_connection",
      //   JSON.stringify(connectionInfo)
      // );

      // Store session data (session token from connectData.session) for future use if needed by other parts,
      // but walletAuthStore should ideally own this if it's critical for auth.
      // For now, we keep these sessionStorage items as they might be used by generatePhantomSignDeeplink
      // which expects connectionInfo.sessionToken and connectionInfo.phantomPublicKey from getConnection().
      // This needs to be reconciled with walletAuthStore owning this state.
      try {
        if (connectData.session) {
          sessionStorage.setItem(
            "phantom_session_token_temp",
            connectData.session
          );
        }
        sessionStorage.setItem(
          "phantom_public_key_temp",
          phantomEncryptionPublicKeyFromParam
        );
        // Storing shared_secret in sessionStorage is a security risk if not handled carefully.
        // It's used by generatePhantomSignDeeplink indirectly via getDappKeyPair and nacl.box.before.
        // This part is complex due to dependencies from generatePhantomSignDeeplink.
        // sessionStorage.setItem(
        //   "shared_secret_temp",
        //   JSON.stringify(Array.from(sharedSecret)) // Storing secret material is risky
        // );
      } catch (quotaError) {
        // Session storage failed
      }

      return {
        success: true,
        message: "Successfully connected to Phantom",
        data: {
          publicKey: connectData.public_key,
          phantomEncryptionPublicKey: phantomEncryptionPublicKeyFromParam,
          sessionToken: connectData.session || connectData.sessionToken,
        },
      };
    } catch (decryptionError) {
      return {
        success: false,
        message: `Decryption error: ${decryptionError instanceof Error ? decryptionError.message : "Unknown error"}`,
      };
    }
  } catch (error) {
    return {
      success: false,
      message: `Error processing callback: ${error instanceof Error ? error.message : "Unknown error"}`,
    };
  }
};

/**
 * Check if connected
 */
// export const isConnected = (): boolean => {
//   if (typeof window === "undefined") return false;
//
//   const stored = localStorage.getItem("phantom_mobile_connection");
//   if (!stored) return false;
//
//   try {
//     const connection: PhantomConnection = JSON.parse(stored);
//     return connection.connected && !!connection.publicKey;
//   } catch {
//     return false;
//   }
// };

/**
 * Get connection info
 */
// export const getConnection = (): PhantomConnection | null => {
//   if (typeof window === "undefined") return null;
//
//   const stored = localStorage.getItem("phantom_mobile_connection");
//   if (!stored) return null;
//
//   try {
//     return JSON.parse(stored);
//   } catch {
//     return null;
//   }
// };

/**
 * Disconnect
 */
// export const disconnect = (): void => {
//   if (typeof window === "undefined") return;
//
//   localStorage.removeItem(MOBILE_SESSION_KEY);
//   localStorage.removeItem(MOBILE_CONNECTION_KEY);
// };

/**
 * Clear all mobile connection data
 */
export function clearAllMobileData() {
  if (typeof window === "undefined") return;

  // console.log("[clearAllMobileData] Clearing mobile wallet data...");

  // dApp-specific keypair for Phantom communication (essential for deeplinks)
  sessionStorage.removeItem("dapp_keypair");
  localStorage.removeItem("dapp_keypair_backup");

  // Temporary keys used during callback flows
  sessionStorage.removeItem("phantom_session_token_temp"); // If set by older handlePhantomCallback
  sessionStorage.removeItem("phantom_public_key_temp"); // If set by older handlePhantomCallback
  localStorage.removeItem("temp_phantom_public_key_for_sign_callback"); // Used by sign flow
  localStorage.removeItem("phantom_callback_success"); // Used by getAndClearCallbackSuccess for inter-tab

  // Message context for signing (wallet-callback might use state-specific key, but clear this too)
  sessionStorage.removeItem("phantom_sign_message");
  localStorage.removeItem("phantom_sign_message");

  // Fallback deeplink storage (if this logic is still active/needed)
  sessionStorage.removeItem("phantom_universal_fallback");
  sessionStorage.removeItem("phantom_intent_fallback");
  sessionStorage.removeItem("phantom_sign_universal_fallback");
  sessionStorage.removeItem("phantom_sign_intent_fallback");

  // Obsolete keys from prior state systems (remove these lines):
  // localStorage.removeItem("phantom_mobile_connection");
  // sessionStorage.removeItem("phantom_mobile_connection");
  // localStorage.removeItem("phantom_dapp_keypair"); // Older key name
  // sessionStorage.removeItem("phantom_dapp_keypair"); // Older key name
  // localStorage.removeItem("phantom_dapp_keypair_backup"); // Older key name
  // sessionStorage.removeItem("phantom_session"); // Old session token key
  // sessionStorage.removeItem("shared_secret"); // Storing derived secret is risky
  // sessionStorage.removeItem("phantom_needs_auth");
  // sessionStorage.removeItem("phantom_connection_success");
  // sessionStorage.removeItem("phantom_connected_wallet");
  // sessionStorage.removeItem("phantom_sign_success");
  // sessionStorage.removeItem("phantom_signature");
  // sessionStorage.removeItem("phantom_has_signed");
  // localStorage.removeItem("phantom_has_signed");
  // sessionStorage.removeItem("auth_attempted");
  // sessionStorage.removeItem("phantom_last_redirect");
  // sessionStorage.removeItem("phantom_auth_attempts");
  // sessionStorage.removeItem("phantom_session_id");

  // Clear debug data
  clearMobileDebugSteps();
  // console.log("[clearAllMobileData] Mobile data cleared.");
}

/**
 * Check if we're in a mobile browser
 */
export const shouldUseMobileWallet = (): boolean => {
  return isMobile();
};

/**
 * Generate Phantom deeplink for signing a message (mobile authentication)
 */
export const generatePhantomSignDeeplink = (
  message: string,
  baseUrl: string,
  callbackUrl: string,
  sessionToken: string,
  phantomEncryptPublicKey: string
): string => {
  try {
    // Validate we have the session token from the connection - already checked by caller (walletAuthStore)
    if (!sessionToken) {
      throw new Error(
        "No session token provided for signing. Please reconnect your wallet."
      );
    }

    // Validate we have Phantom's public key for encryption - already checked by caller (walletAuthStore)
    if (!phantomEncryptPublicKey) {
      throw new Error(
        "Missing Phantom's encryption public key for signing. Please reconnect your wallet."
      );
    }

    // Generate unique state parameter for CSRF protection and session tracking
    const state = crypto.randomUUID();
    const expirationTime = Date.now() + 300_000; // 5 minutes

    // Store state and auth context in localStorage for cross-tab access
    localStorage.setItem(
      `phantom-auth-${state}`,
      JSON.stringify({
        message,
        timestamp: Date.now(),
        expires: expirationTime,
        type: "sign",
        sessionId: state,
      })
    );

    // Get our dApp keypair (same one used for connection)
    const dappKeyPair = getDappKeyPair();
    const dappPublicKeyB58 = bs58.encode(dappKeyPair.publicKey);

    // Generate a unique nonce for this signing request
    const nonce = nacl.randomBytes(24);
    const nonceB58 = bs58.encode(nonce);

    // Encode the message to base58 as required by Phantom
    const messageBytes = Buffer.from(message, "utf8");
    const messageB58 = bs58.encode(messageBytes);

    // Create the payload object that needs to be encrypted
    const payload = {
      message: messageB58,
      session: sessionToken,
      display: "utf8",
    };

    // Create shared secret for encryption
    const phantomPublicKeyBytes = bs58.decode(phantomEncryptPublicKey);
    const sharedSecret = nacl.box.before(
      phantomPublicKeyBytes,
      dappKeyPair.secretKey
    );

    // Encrypt the payload
    const payloadString = JSON.stringify(payload);
    const payloadBytes = Buffer.from(payloadString, "utf8");

    const encryptedPayload = nacl.box.after(payloadBytes, nonce, sharedSecret);
    if (!encryptedPayload) {
      throw new Error("Failed to encrypt payload");
    }

    const encryptedPayloadB58 = bs58.encode(encryptedPayload);

    // Clean callback URL and add state parameter
    const cleanCallbackUrl = callbackUrl.startsWith("http")
      ? callbackUrl
      : `${baseUrl.replace(/\/$/, "")}${callbackUrl}`;

    const callbackUrlWithState = new URL(cleanCallbackUrl);
    callbackUrlWithState.searchParams.set("state", state);
    callbackUrlWithState.searchParams.set("type", "sign");
    callbackUrlWithState.searchParams.set(
      "dapp_key_for_sign",
      phantomEncryptPublicKey
    );

    const finalCallbackUrl = callbackUrlWithState.toString();

    // Build the signing deeplink parameters
    const params = new URLSearchParams({
      dapp_encryption_public_key: dappPublicKeyB58,
      nonce: nonceB58,
      redirect_link: finalCallbackUrl,
      payload: encryptedPayloadB58,
    });

    // Store the original message separately for easy access during auth (legacy support)
    sessionStorage.setItem("phantom_sign_message", message);
    localStorage.setItem("phantom_sign_message", message);

    // Always use custom scheme for better same-tab behavior
    const deeplink = `phantom://v1/signMessage?${params.toString()}`;

    return deeplink;
  } catch (error) {
    console.error("Error generating sign deeplink:", error);
    throw error;
  }
};

/**
 * Handle signing callback from Phantom
 */
export const handlePhantomSignCallback = (
  searchParams: URLSearchParams,
  dappKeyForSign?: string
): {
  success: boolean;
  message: string;
  signature?: string;
} => {
  try {
    const errorCode = searchParams.get("errorCode");
    const errorMessage = searchParams.get("errorMessage");

    if (errorCode || errorMessage) {
      return {
        success: false,
        message: `Phantom Sign Error: ${errorMessage || `Code ${errorCode}`}`,
      };
    }

    const data = searchParams.get("data");
    const nonce = searchParams.get("nonce");

    const finalPhantomPublicKey = dappKeyForSign;

    if (!finalPhantomPublicKey) {
      return {
        success: false,
        message:
          "Critical: Dapp key for signing not provided in callback handler. Please ensure it's in the redirect URL.",
      };
    }

    if (!data || !nonce) {
      return {
        success: false,
        message:
          "Missing required signature data or nonce from Phantom response",
      };
    }

    const dappKeyPair = getDappKeyPair();

    try {
      const phantomPublicKeyBytes = bs58.decode(finalPhantomPublicKey);

      const sharedSecret = nacl.box.before(
        phantomPublicKeyBytes,
        dappKeyPair.secretKey
      );

      const decryptedData = nacl.box.open.after(
        bs58.decode(data),
        bs58.decode(nonce),
        sharedSecret
      );

      if (!decryptedData) {
        return {
          success: false,
          message: "Failed to decrypt signature from Phantom",
        };
      }

      const decryptedString = Buffer.from(decryptedData).toString("utf8");
      const signData = JSON.parse(decryptedString);

      return {
        success: true,
        message: "Successfully received signature from Phantom",
        signature: signData.signature,
      };
    } catch (decryptionError) {
      return {
        success: false,
        message: `Decryption error: ${decryptionError instanceof Error ? decryptionError.message : "Unknown error"}`,
      };
    }
  } catch (error) {
    return {
      success: false,
      message: `Error processing sign callback: ${error instanceof Error ? error.message : "Unknown error"}`,
    };
  }
};

/**
 * Get debug information for mobile troubleshooting
 */
export const getMobileWalletDebugInfo = () => {
  if (typeof window === "undefined") return null;

  const debugInfo = {
    // Browser detection
    isMobile: isMobile(),
    isIOS: isIOS(),
    isAndroid: isAndroid(),
    userAgent: navigator.userAgent,

    // Phantom detection
    isPhantomInstalled: isPhantomInstalled(),

    // Connection status
    // isConnected: isConnected(),
    // connection: getConnection(),

    // Debug steps
    debugSteps: getMobileDebugSteps(),

    // Storage data
    sessionStorage: {
      dappKeypair: !!sessionStorage.getItem("dapp_keypair"),
      phantomSession: !!sessionStorage.getItem("phantom_session"),
      sharedSecret: !!sessionStorage.getItem("shared_secret"),
      phantomSessionId: sessionStorage.getItem("phantom_session_id"),
    },

    localStorage: {
      mobileConnection: !!localStorage.getItem("phantom_mobile_connection"),
      dappKeypairBackup: !!localStorage.getItem("dapp_keypair_backup"),
      deeplinkDebugBackup: !!localStorage.getItem(
        "phantom_deeplink_debug_backup"
      ),
      signDebugBackup: !!localStorage.getItem("phantom_sign_debug_backup"),
    },

    // URL and navigation info
    currentUrl: window.location.href,
    referrer: document.referrer,

    timestamp: new Date().toISOString(),
  };

  return debugInfo;
};

/**
 * Check if the current URL indicates we're handling a Phantom callback
 */
export const isPhantomCallback = (): {
  isCallback: boolean;
  type?: "connect" | "sign";
} => {
  if (typeof window === "undefined") return { isCallback: false };

  const url = new URL(window.location.href);
  const params = url.searchParams;

  // Check for Phantom callback parameters
  const hasPhantomParams =
    params.has("phantom_encryption_public_key") ||
    params.has("errorCode") ||
    params.has("errorMessage");

  if (!hasPhantomParams) {
    return { isCallback: false };
  }

  // Determine callback type based on URL parameters
  const type = params.get("type");
  if (type === "sign") {
    return { isCallback: true, type: "sign" };
  } else {
    return { isCallback: true, type: "connect" };
  }
};

/**
 * Process Phantom callback based on type
 */
export const processPhantomCallback = () => {
  if (typeof window === "undefined") return null;

  const { isCallback, type } = isPhantomCallback();
  if (!isCallback) return null;

  const url = new URL(window.location.href);
  const searchParams = url.searchParams;

  if (type === "sign") {
    return handlePhantomSignCallback(searchParams);
  } else {
    return handlePhantomCallback(searchParams);
  }
};

/**
 * Generate a secure message for wallet authentication
 */
export const generateAuthMessage = (nonce?: string): string => {
  const timestamp = Math.floor(Date.now() / 1000);
  const randomNonce = nonce || Math.random().toString(36).substring(2, 15);
  const domain =
    typeof window !== "undefined"
      ? window.location.hostname
      : "app.proxim8.com";

  return `Sign this message to authenticate with ${domain}\n\nNonce: ${randomNonce}\nTimestamp: ${timestamp}`;
};

/**
 * Store successful callback data for cross-tab communication
 */
export const storeCallbackSuccess = (type: "connect" | "sign", data: any) => {
  if (typeof window === "undefined") return;

  const successData = {
    type,
    data,
    timestamp: Date.now(),
    url: window.location.href,
  };

  try {
    localStorage.setItem(
      "phantom_callback_success",
      JSON.stringify(successData)
    );
  } catch (error) {
    // Ignore storage errors
  }
};

/**
 * Get and clear callback success data (for cross-tab communication)
 */
export const getAndClearCallbackSuccess = (): {
  type: "connect" | "sign";
  data: any;
  timestamp: number;
} | null => {
  if (typeof window === "undefined") return null;

  try {
    const stored = localStorage.getItem("phantom_callback_success");
    if (!stored) return null;

    const successData = JSON.parse(stored);
    localStorage.removeItem("phantom_callback_success");

    return successData;
  } catch (error) {
    localStorage.removeItem("phantom_callback_success"); // Clear corrupted data
    return null;
  }
};

/**
 * Check if we need to redirect to Phantom (avoid infinite loops)
 */
export const shouldRedirectToPhantom = (): boolean => {
  if (typeof window === "undefined") return false;

  // Don't redirect if we're already processing a callback
  const { isCallback } = isPhantomCallback();
  if (isCallback) return false;

  // Don't redirect if we just came from Phantom (check referrer)
  const referrer = document.referrer;
  if (referrer.includes("phantom.app") || referrer.includes("phantom://"))
    return false;

  // Don't redirect if we recently redirected (prevent loops)
  const lastRedirect = sessionStorage.getItem("phantom_last_redirect");
  if (lastRedirect) {
    const timeSinceRedirect = Date.now() - parseInt(lastRedirect);
    if (timeSinceRedirect < 3000) {
      return false;
    }
  }

  // Don't redirect if we've already successfully authenticated this session
  const hasSignedThisSession = sessionStorage.getItem("phantom_has_signed");
  if (hasSignedThisSession) {
    return false;
  }

  // Don't redirect if we've already attempted authentication multiple times
  const authAttemptCount = parseInt(
    sessionStorage.getItem("phantom_auth_attempts") || "0"
  );
  if (authAttemptCount >= 3) {
    return false;
  }

  return true;
};

/**
 * Mark that we're about to redirect to Phantom (prevent loops)
 */
export const markPhantomRedirect = () => {
  if (typeof window === "undefined") return;

  const timestamp = Date.now().toString();
  sessionStorage.setItem("phantom_last_redirect", timestamp);

  // Track authentication attempts
  const currentAttempts = parseInt(
    sessionStorage.getItem("phantom_auth_attempts") || "0"
  );
  sessionStorage.setItem(
    "phantom_auth_attempts",
    (currentAttempts + 1).toString()
  );
};

/**
 * Try fallback deeplink if primary method failed
 * This can be called if the custom scheme didn't open the app
 */
export const tryFallbackDeeplink = (): boolean => {
  if (typeof window === "undefined") return false;

  addMobileDebugStep("🔄 Trying fallback deeplink method...");

  try {
    // Check if we're trying to fallback for signing or connecting
    const isSigningFlow =
      sessionStorage.getItem("phantom_sign_universal_fallback") ||
      sessionStorage.getItem("phantom_sign_intent_fallback");

    if (isSigningFlow) {
      addMobileDebugStep("🔐 Attempting signing fallback...");

      if (isIOS()) {
        const signUniversalFallback = sessionStorage.getItem(
          "phantom_sign_universal_fallback"
        );
        if (signUniversalFallback) {
          addMobileDebugStep(
            `🔗 Using iOS sign universal link fallback: ${signUniversalFallback}`
          );
          window.location.href = signUniversalFallback;
          return true;
        }
      } else if (isAndroid()) {
        const signIntentFallback = sessionStorage.getItem(
          "phantom_sign_intent_fallback"
        );
        if (signIntentFallback) {
          addMobileDebugStep(
            `🔗 Using Android sign intent fallback: ${signIntentFallback}`
          );
          window.location.href = signIntentFallback;
          return true;
        }
      } else {
        const signUniversalFallback = sessionStorage.getItem(
          "phantom_sign_universal_fallback"
        );
        if (signUniversalFallback) {
          addMobileDebugStep(
            `🔗 Using universal sign link fallback: ${signUniversalFallback}`
          );
          window.location.href = signUniversalFallback;
          return true;
        }
      }

      addMobileDebugStep("❌ No signing fallback available");
      return false;
    } else {
      // Connect flow fallback (existing logic)
      addMobileDebugStep("🔗 Attempting connect fallback...");

      if (isIOS()) {
        const universalFallback = sessionStorage.getItem(
          "phantom_universal_fallback"
        );
        if (universalFallback) {
          addMobileDebugStep(
            `🔗 Using iOS universal link fallback: ${universalFallback}`
          );
          window.location.href = universalFallback;
          return true;
        }
      } else if (isAndroid()) {
        const intentFallback = sessionStorage.getItem(
          "phantom_intent_fallback"
        );
        if (intentFallback) {
          addMobileDebugStep(
            `🔗 Using Android intent fallback: ${intentFallback}`
          );
          window.location.href = intentFallback;
          return true;
        }
      } else {
        const universalFallback = sessionStorage.getItem(
          "phantom_universal_fallback"
        );
        if (universalFallback) {
          addMobileDebugStep(
            `🔗 Using universal link fallback: ${universalFallback}`
          );
          window.location.href = universalFallback;
          return true;
        }
      }

      addMobileDebugStep("❌ No connect fallback available");
      return false;
    }
  } catch (error) {
    addMobileDebugStep(`❌ Error trying fallback: ${error}`);
    return false;
  }
};

/**
 * Check if we should try fallback (called after a timeout)
 */
export const shouldTryFallback = (): boolean => {
  if (typeof window === "undefined") return false;

  // If we're still on the same page after a few seconds,
  // the deeplink probably didn't work
  const lastRedirect = sessionStorage.getItem("phantom_last_redirect");
  if (lastRedirect) {
    const timeSinceRedirect = Date.now() - parseInt(lastRedirect);
    // If it's been more than 3 seconds and we're still here, try fallback
    return timeSinceRedirect > 3000;
  }

  return false;
};
