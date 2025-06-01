/**
 * Server-side API utilities for safe use in Server Components
 * Does NOT rely on client hooks, browser APIs, or Zustand state
 */

import { ServerApiClient } from "@/utils/serverApiClient";
import { ApiError } from "@/types/error";

// Import the FetchOptions type from serverApiClient
type FetchOptions = {
  method?: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  headers?: Record<string, string>;
  body?: any;
  cache?: RequestCache;
  next?: {
    revalidate?: number;
    tags?: string[];
  };
};

// Base API configuration
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

// Create a singleton instance of the ServerApiClient
const apiClient = new ServerApiClient(API_URL);

// Convert RequestInit to FetchOptions
const convertConfig = (config?: RequestInit): FetchOptions | undefined => {
  if (!config) return undefined;

  const fetchOptions: FetchOptions = {};

  // Convert method to typed method
  if (config.method) {
    const method = config.method.toUpperCase();
    if (["GET", "POST", "PUT", "DELETE", "PATCH"].includes(method)) {
      fetchOptions.method = method as
        | "GET"
        | "POST"
        | "PUT"
        | "DELETE"
        | "PATCH";
    }
  }

  // Convert headers
  if (config.headers) {
    const headers: Record<string, string> = {};
    if (config.headers instanceof Headers) {
      config.headers.forEach((value, key) => {
        headers[key] = value;
      });
    } else if (typeof config.headers === "object") {
      Object.assign(headers, config.headers);
    }
    fetchOptions.headers = headers;
  }

  // Copy other properties
  if (config.body) fetchOptions.body = config.body;
  if (config.cache) fetchOptions.cache = config.cache;

  return fetchOptions;
};

// Server-side API utility methods with typed responses
export const serverApi = {
  /**
   * Perform a GET request
   * @param url - The endpoint URL (without the base URL)
   * @param config - Optional fetch configuration
   * @returns Promise with the typed response
   * @throws ApiError if the request fails
   */
  get: async <T>(url: string, config?: RequestInit): Promise<T> => {
    try {
      return await apiClient.get<T>(url, convertConfig(config));
    } catch (error) {
      console.error(`[Server API] GET request failed: ${url}`, error);
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError({
        status: 500,
        message:
          error instanceof Error ? error.message : "Unknown error occurred",
        error: error instanceof Error ? error : undefined,
      });
    }
  },

  /**
   * Perform a POST request
   * @param url - The endpoint URL (without the base URL)
   * @param data - The data to send in the request body
   * @param config - Optional fetch configuration
   * @returns Promise with the typed response
   * @throws ApiError if the request fails
   */
  post: async <T>(
    url: string,
    data?: any,
    config?: RequestInit
  ): Promise<T> => {
    try {
      return await apiClient.post<T>(url, data, convertConfig(config));
    } catch (error) {
      console.error(`[Server API] POST request failed: ${url}`, error);
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError({
        status: 500,
        message:
          error instanceof Error ? error.message : "Unknown error occurred",
        error: error instanceof Error ? error : undefined,
      });
    }
  },

  /**
   * Perform a PUT request
   * @param url - The endpoint URL (without the base URL)
   * @param data - The data to send in the request body
   * @param config - Optional fetch configuration
   * @returns Promise with the typed response
   * @throws ApiError if the request fails
   */
  put: async <T>(url: string, data?: any, config?: RequestInit): Promise<T> => {
    try {
      return await apiClient.put<T>(url, data, convertConfig(config));
    } catch (error) {
      console.error(`[Server API] PUT request failed: ${url}`, error);
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError({
        status: 500,
        message:
          error instanceof Error ? error.message : "Unknown error occurred",
        error: error instanceof Error ? error : undefined,
      });
    }
  },

  /**
   * Perform a DELETE request
   * @param url - The endpoint URL (without the base URL)
   * @param config - Optional fetch configuration
   * @returns Promise with the typed response
   * @throws ApiError if the request fails
   */
  delete: async <T>(url: string, config?: RequestInit): Promise<T> => {
    try {
      return await apiClient.delete<T>(url, convertConfig(config));
    } catch (error) {
      console.error(`[Server API] DELETE request failed: ${url}`, error);
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError({
        status: 500,
        message:
          error instanceof Error ? error.message : "Unknown error occurred",
        error: error instanceof Error ? error : undefined,
      });
    }
  },
};
