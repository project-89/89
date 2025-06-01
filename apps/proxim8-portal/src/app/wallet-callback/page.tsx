"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  handlePhantomCallback,
  handlePhantomSignCallback,
  storeCallbackSuccess,
} from "@/utils/mobileDetection";

export const dynamic = "force-dynamic";

function LoadingFallback() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gray-50">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
      <p className="text-gray-700 text-lg">Loading wallet callback...</p>
    </div>
  );
}

function WalletCallbackHandler() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<{
    loading: boolean;
    success?: boolean;
    message?: string;
    type?: "connect" | "sign";
    autoCloseAttempted?: boolean;
  }>({ loading: true });

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
      setTimeout(() => {
        try {
          window.close();
        } catch (e) {
          console.warn("[WalletCallbackPage] Failed to auto-close tab:", e);
          // If window.close() fails, the user will see the status message and the manual button (if applicable).
        }
      }, 2000); // Attempt to close after 2 seconds
    }
  }, [status.loading, status.autoCloseAttempted]);

  if (status.loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-700 text-lg">Processing wallet response...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gray-50 text-center">
      <div className="bg-white shadow-lg rounded-lg p-8 max-w-md w-full">
        <div
          className={`w-16 h-16 mx-auto mb-6 rounded-full flex items-center justify-center ${status.success ? "bg-green-100" : "bg-red-100"}`}
        >
          {status.success ? (
            <svg
              className="w-8 h-8 text-green-600"
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
              className="w-8 h-8 text-red-600"
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

        <h1
          className={`text-2xl font-semibold mb-3 ${status.success ? "text-gray-800" : "text-red-700"}`}
        >
          {status.success
            ? status.type === "connect"
              ? "Connected!"
              : "Signature Submitted!"
            : "Error"}
        </h1>

        <p className="text-gray-600 mb-8 text-base">{status.message}</p>

        {status.success && (
          <p className="text-sm text-gray-500">
            This window will attempt to close automatically.
          </p>
        )}

        {!status.success && (
          <button
            onClick={() => {
              try {
                window.close();
              } catch (e) {
                alert("Please manually close this tab and return to the app.");
              }
            }}
            className="mt-4 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors text-base font-medium"
          >
            Close Tab
          </button>
        )}
      </div>
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
