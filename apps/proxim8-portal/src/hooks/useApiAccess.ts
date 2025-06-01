"use client";

import { useCallback } from "react";
// import { useWalletConnection } from "./useWalletConnection"; // OLD HOOK
import { useWalletAuth } from "@/stores/walletAuthStore"; // Updated import path
import { ApiError } from "@/types/error";
import {
  API_BASE_URL,
  // AUTH_API_PATH, // Reverted
  // LORE_API_PATH, // Reverted
  // NFT_API_PATH,  // Reverted
} from "@/config"; // Assuming your config is here

export interface ApiOptions {
  requireAuth?: boolean;
  headers?: Record<string, string>;
  retries?: number;
  retryDelay?: number;
}

/**
 * Hook for making authenticated API requests
 */
export const useApiAccess = () => {
  const { isAuthenticated, authenticate } = useWalletAuth(); // Using new hook

  /**
   * Make an API request with optional authentication
   */
  const fetchApi = useCallback(
    async <T>(
      endpoint: string,
      options: RequestInit = {},
      apiOptions: ApiOptions = {}
    ): Promise<T> => {
      const {
        requireAuth = false,
        headers = {},
        retries = 1,
        retryDelay = 1000,
      } = apiOptions;

      // If authentication is required but not authenticated,
      // try to authenticate first
      if (requireAuth && !isAuthenticated) {
        const success = await authenticate();
        if (!success) {
          throw new ApiError({
            status: 401,
            message: "Authentication required for this request",
          });
        }
      }

      // Set up headers for API requests
      const requestHeaders: Record<string, string> = {
        "Content-Type": "application/json",
        ...headers,
      };

      // Note: JWT authentication is handled automatically via HTTP cookies
      // No need to manually add authorization headers here

      // Retry logic implementation
      let lastError: Error | null = null;
      let attemptCount = 0;

      while (attemptCount <= retries) {
        try {
          // Make the request
          const response = await fetch(`/api${endpoint}`, {
            ...options,
            headers: {
              ...requestHeaders,
              ...(options.headers || {}),
            },
          });

          // Handle non-OK responses
          if (!response.ok) {
            // Parse error response if possible
            try {
              const errorData = await response.json();
              throw new ApiError({
                status: response.status,
                message: errorData.message || `API error: ${response.status}`,
                data: errorData,
              });
            } catch (e) {
              // If parsing fails, throw with status
              throw new ApiError({
                status: response.status,
                message: `API error: ${response.status}`,
              });
            }
          }

          // Parse JSON response
          return await response.json();
        } catch (error) {
          lastError = error instanceof Error ? error : new Error(String(error));

          // Only retry if it's not the last attempt and the error is retryable
          if (attemptCount < retries && isRetryableError(lastError)) {
            attemptCount++;
            console.log(
              `Retrying API request (${attemptCount}/${retries}): ${endpoint}`
            );

            // Wait before retrying (with exponential backoff)
            await new Promise((resolve) =>
              setTimeout(resolve, retryDelay * attemptCount)
            );
          } else {
            // If it's the last attempt or non-retryable error, rethrow
            if (error instanceof ApiError) {
              throw error;
            }
            throw new ApiError({
              status: 500,
              message: lastError.message || "Unknown API error",
            });
          }
        }
      }

      // This should never happen due to the throw in the last iteration of the loop
      throw new ApiError({
        status: 500,
        message: lastError?.message || "Unknown API error",
      });
    },
    [isAuthenticated, authenticate]
  );

  /**
   * Make a GET request
   */
  const get = useCallback(
    <T>(endpoint: string, apiOptions: ApiOptions = {}): Promise<T> => {
      return fetchApi<T>(endpoint, { method: "GET" }, apiOptions);
    },
    [fetchApi]
  );

  /**
   * Make a POST request
   */
  const post = useCallback(
    <T>(
      endpoint: string,
      data: any,
      apiOptions: ApiOptions = {}
    ): Promise<T> => {
      return fetchApi<T>(
        endpoint,
        {
          method: "POST",
          body: JSON.stringify(data),
        },
        apiOptions
      );
    },
    [fetchApi]
  );

  /**
   * Make a PUT request
   */
  const put = useCallback(
    <T>(
      endpoint: string,
      data: any,
      apiOptions: ApiOptions = {}
    ): Promise<T> => {
      return fetchApi<T>(
        endpoint,
        {
          method: "PUT",
          body: JSON.stringify(data),
        },
        apiOptions
      );
    },
    [fetchApi]
  );

  /**
   * Make a DELETE request
   */
  const del = useCallback(
    <T>(endpoint: string, apiOptions: ApiOptions = {}): Promise<T> => {
      return fetchApi<T>(endpoint, { method: "DELETE" }, apiOptions);
    },
    [fetchApi]
  );

  return {
    get,
    post,
    put,
    delete: del,
    fetchApi,
    isAuthenticated,
  };
};

/**
 * Determine if an error should trigger a retry
 */
function isRetryableError(error: Error): boolean {
  // Retry network errors, timeouts, and server errors (5xx)
  if (error instanceof ApiError) {
    // Retry only server errors (5xx), not client errors (4xx)
    return error.status >= 500 && error.status < 600;
  }

  // Retry network errors like timeouts, connection refused, etc.
  return true;
}
