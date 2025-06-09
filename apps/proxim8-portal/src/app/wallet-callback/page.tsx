"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  handlePhantomCallback,
  handlePhantomSignCallback,
  storeCallbackSuccess,
} from "@/utils/mobileDetection";
import { PortalHeader } from "@/components/nav/PortalHeader";

export const dynamic = "force-dynamic";

function LoadingFallback() {
  const [backgroundNumber] = useState(() => Math.floor(Math.random() * 19) + 1);

  return (
    <div className="min-h-screen bg-black text-gray-200 relative overflow-hidden flex flex-col pt-24">
      <PortalHeader />
      
      {/* Background Image */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-30"
        style={{
          backgroundImage: `url('/background-${backgroundNumber}.png')`,
        }}
      />

      {/* Vignette Overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 0%, transparent 40%, rgba(0,0,0,0.6) 100%)",
        }}
      />
      
      <div className="relative z-10 flex-1 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="font-space-mono text-sm text-gray-400">INITIALIZING QUANTUM BRIDGE...</p>
        </div>
      </div>
    </div>
  );
}

function WalletCallbackHandler() {
  const searchParams = useSearchParams();
  const [backgroundNumber] = useState(() => Math.floor(Math.random() * 19) + 1);
  const [isLoaded, setIsLoaded] = useState(false);
  const [status, setStatus] = useState<{
    loading: boolean;
    success?: boolean;
    message?: string;
    type?: "connect" | "sign";
    autoCloseAttempted?: boolean;
  }>({ loading: true });

  useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const processCallback = async () => {
      const state = searchParams.get("state");
      const callbackType = searchParams.get("type") || "connect";

      try {
        console.log("[WalletCallbackPage] Processing callback with state:", {
          state,
          callbackType,
        });
        const urlParams = new URLSearchParams(searchParams.toString());
        let result;

        if (callbackType === "sign") {
          const dappKeyForSign = urlParams.get("dapp_key_for_sign");
          if (!dappKeyForSign) {
            console.error(
              "[WalletCallbackPage] Missing 'dapp_key_for_sign' in sign callback URL params."
            );
            setStatus({
              loading: false,
              success: false,
              message:
                "Critical error: Missing required callback parameter (dapp_key_for_sign).",
              type: "sign",
            });
            return;
          }
          result = handlePhantomSignCallback(urlParams, dappKeyForSign);
          console.log("[WalletCallbackPage] Sign callback result:", result);

          if (result.success && result.signature && state) {
            const authDataKey = `phantom-auth-${state}`;
            const storedAuthData = localStorage.getItem(authDataKey);

            if (storedAuthData) {
              const authData = JSON.parse(storedAuthData);
              if (authData.expires > Date.now()) {
                // The publicKey will be sourced from walletAuthStore.walletAddress during processing
                const authResultForStore = {
                  signature: result.signature,
                  message: authData.message,
                  state: state,
                  timestamp: Date.now(),
                };
                console.log(
                  "[WalletCallbackPage] Storing successful SIGN callback data for store (publicKey will be from store state):",
                  authResultForStore
                );
                storeCallbackSuccess("sign", authResultForStore);

                setStatus({
                  loading: false,
                  success: true,
                  message:
                    "Signature submitted! Finalizing authentication in the app...",
                  type: "sign",
                });
              } else {
                throw new Error("Authentication session expired.");
              }
            } else {
              throw new Error(
                "No authentication session found for this state."
              );
            }
          } else {
            setStatus({
              loading: false,
              success: false,
              message:
                result.message ||
                "Failed to process signature. Please try again.",
              type: "sign",
            });
          }
        } else {
          // "connect" callback
          result = handlePhantomCallback(urlParams);
          console.log(
            "[WalletCallbackPage] Connection callback result:",
            result
          );

          if (result.success && result.data?.publicKey) {
            console.log(
              "[WalletCallbackPage] Storing successful CONNECT callback data for store:",
              result.data
            );
            storeCallbackSuccess("connect", result.data);
            setStatus({
              loading: false,
              success: true,
              message: "Connection successful! Returning to app...",
              type: "connect",
            });
          } else {
            setStatus({
              loading: false,
              success: false,
              message:
                result.message || "Failed to connect wallet. Please try again.",
              type: "connect",
            });
          }
        }
      } catch (error) {
        console.error("[WalletCallbackPage] Error processing callback:", error);
        setStatus({
          loading: false,
          success: false,
          message: `Error: ${error instanceof Error ? error.message : String(error)}`,
        });
      }
    };

    // Ensure searchParams is available before processing
    // This is a common check when dealing with Suspense and searchParams
    if (searchParams.toString()) {
      processCallback();
    } else {
      // Optionally, handle the case where searchParams might not be ready yet,
      // though Suspense should prevent this component from rendering until they are.
      // Adding a small delay or a re-check could be a defensive measure if issues persist.
      console.log("[WalletCallbackHandler] Waiting for searchParams...");
      // You might not need this 'else' block if Suspense behaves as expected.
    }
    // Update useEffect dependency to include searchParams to re-run if they change.
    // However, for a callback page, it typically processes once.
    // If searchParams can genuinely change and require reprocessing, keep it.
    // If not, an empty dependency array `[]` might be more appropriate after initial Suspense resolution.
  }, [searchParams]);

  useEffect(() => {
    if (!status.loading && !status.autoCloseAttempted) {
      setStatus((prev) => ({ ...prev, autoCloseAttempted: true }));
      // setTimeout(() => {
      try {
        window.close();
      } catch (e) {
        console.warn("[WalletCallbackPage] Failed to auto-close tab:", e);
        // If window.close() fails, the user will see the status message and the manual button (if applicable).
      }
      // }, 0); // Attempt to close after 2 seconds
    }
  }, [status.loading, status.autoCloseAttempted]);

  if (status.loading) {
    return (
      <div className="min-h-screen bg-black text-gray-200 relative overflow-hidden flex flex-col pt-24">
        <PortalHeader />
        
        {/* Background Image */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-opacity duration-1000 ease-out"
          style={{
            backgroundImage: `url('/background-${backgroundNumber}.png')`,
            opacity: isLoaded ? 1 : 0.3,
          }}
        />

        {/* Vignette Overlay */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse at center, transparent 0%, transparent 40%, rgba(0,0,0,0.6) 100%)",
          }}
        />
        
        <div className="relative z-10 flex-1 flex items-center justify-center p-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500 mx-auto mb-4"></div>
            <p className="font-space-mono text-sm text-gray-400">PROCESSING QUANTUM AUTHENTICATION...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-gray-200 relative overflow-hidden flex flex-col pt-24">
      <PortalHeader />
      
      {/* Background Image */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-opacity duration-1000 ease-out"
        style={{
          backgroundImage: `url('/background-${backgroundNumber}.png')`,
          opacity: isLoaded ? 1 : 0.3,
        }}
      />

      {/* Vignette Overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 0%, transparent 40%, rgba(0,0,0,0.6) 100%)",
        }}
      />
      
      {/* Main Content Area */}
      <main className="relative z-10 flex-1 flex flex-col justify-center px-4 py-8">
        <div className="w-full max-w-md mx-auto">
          <div
            className={`bg-gray-900/60 backdrop-blur-sm border border-gray-700/50 rounded-lg p-8 hover:border-primary-500/30 transition-all duration-1000 ease-out ${
              isLoaded ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
            }`}
          >
          {/* Status Icon */}
          <div
            className={`w-16 h-16 mx-auto mb-6 rounded-full flex items-center justify-center border-2 ${
              status.success 
                ? "border-primary-500 bg-primary-500/10" 
                : "border-red-400 bg-red-400/10"
            }`}
          >
            {status.success ? (
              <svg
                className="w-8 h-8 text-primary-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            ) : (
              <svg
                className="w-8 h-8 text-red-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            )}
          </div>

          {/* Title */}
          <h1
            className={`font-orbitron text-2xl font-bold mb-4 ${
              status.success ? "text-primary-500" : "text-red-400"
            }`}
          >
            {status.success
              ? status.type === "connect"
                ? "QUANTUM BRIDGE ESTABLISHED"
                : "AUTHENTICATION CONFIRMED"
              : "CONNECTION FAILURE"}
          </h1>

          {/* Message */}
          <p className="font-space-mono text-sm text-gray-300 mb-6 leading-relaxed">
            {status.success 
              ? status.type === "connect"
                ? "Your consciousness has been linked to the resistance network. Welcome, Agent."
                : "Your identity signature has been verified by the quantum substrate."
              : "Unable to establish secure connection to the resistance network."
            }
          </p>

          {/* Technical details */}
          <div className="border-t border-gray-700 pt-4 mb-6">
            <p className="font-space-mono text-xs text-gray-400 mb-2">
              STATUS: <span className={status.success ? "text-primary-500" : "text-red-400"}>
                {status.success ? "AUTHENTICATED" : "ERROR"}
              </span>
            </p>
            <p className="font-space-mono text-xs text-gray-500">
              {status.message}
            </p>
          </div>

          {/* Auto-close notification */}
          {status.success && (
            <p className="font-space-mono text-xs text-gray-500 mb-4">
              Returning to command center...
            </p>
          )}

          {/* Manual close button for errors */}
          {!status.success && (
            <button
              onClick={() => {
                try {
                  window.close();
                } catch (e) {
                  alert("Please manually close this tab and return to the command center.");
                }
              }}
              className="font-space-mono px-6 py-3 bg-red-400/20 border border-red-400 rounded hover:bg-red-400/30 transition-all text-red-400 text-sm"
            >
              CLOSE BRIDGE
            </button>
          )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default function WalletCallbackPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <WalletCallbackHandler />
    </Suspense>
  );
}
