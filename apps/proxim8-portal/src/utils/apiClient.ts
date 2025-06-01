"use client";

/**
 * Standard API client for making requests to Next.js API routes
 * Handles error formatting, authentication, and request options
 */
import { ApiError, createApiError } from "@/types/error";

// Default request options
const DEFAULT_OPTIONS: RequestInit = {
  credentials: "include", // Always include cookies for auth
  headers: {
    "Content-Type": "application/json",
  },
};

// Track if we're currently refreshing to avoid multiple simultaneous refresh attempts
let isRefreshing = false;
let refreshPromise: Promise<boolean> | null = null;

// Helper to refresh the authentication token
async function refreshAuthToken(): Promise<boolean> {
  // If already refreshing, wait for the existing refresh to complete
  if (isRefreshing && refreshPromise) {
    return refreshPromise;
  }

  isRefreshing = true;
  refreshPromise = (async () => {
    try {
      console.log("[apiClient] Attempting to refresh authentication token");

      const response = await fetch("/api/auth/refresh", {
        method: "POST",
        credentials: "include",
      });

      if (response.ok) {
        console.log("[apiClient] Token refreshed successfully");
        return true;
      } else {
        console.log("[apiClient] Token refresh failed:", response.status);
        return false;
      }
    } catch (error) {
      console.error("[apiClient] Error refreshing token:", error);
      return false;
    } finally {
      isRefreshing = false;
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

// Helper to get auth token and add to headers
function getAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  // Add API key
  const apiKey = process.env.NEXT_PUBLIC_API_KEY || "proxim8-dev-key";
  headers["X-API-Key"] = apiKey;

  // Try to get auth token and CSRF token from cookies (for SSR compatibility)
  let authToken = null;
  let csrfToken = null;

  if (typeof document !== "undefined") {
    // Client-side - parse cookies
    const cookies = document.cookie.split(";");

    // Get auth token
    const authCookie = cookies.find((c) => c.trim().startsWith("authToken="));
    if (authCookie) {
      const encodedToken = authCookie.split("=")[1];
      authToken = decodeURIComponent(encodedToken);
    }

    // Get CSRF token
    const csrfCookie = cookies.find((c) => c.trim().startsWith("csrf_token="));
    if (csrfCookie) {
      csrfToken = csrfCookie.split("=")[1];
    }
  }

  // Add Authorization header with token if available
  if (authToken) {
    headers["Authorization"] = `Bearer ${authToken}`;
  }

  // Add CSRF token if available
  if (csrfToken) {
    headers["x-csrf-token"] = csrfToken;
  }
  return headers;
}

// Helper to make requests with automatic retry on auth failure
async function makeRequestWithRetry(
  url: string,
  options: RequestInit,
  retryOnAuth = true
): Promise<Response> {
  const response = await fetch(url, options);

  // If we get a 401 and retryOnAuth is true, try to refresh the token and retry
  if (response.status === 401 && retryOnAuth) {
    console.log("[apiClient] Received 401, attempting token refresh");

    const refreshSuccess = await refreshAuthToken();

    if (refreshSuccess) {
      console.log("[apiClient] Token refreshed, retrying original request");

      // Update headers with potentially new token
      const updatedOptions = {
        ...options,
        headers: {
          ...options.headers,
          ...getAuthHeaders(),
        },
      };

      // Retry the original request (but don't retry again if it fails)
      return makeRequestWithRetry(url, updatedOptions, false);
    } else {
      console.log(
        "[apiClient] Token refresh failed, returning original 401 response"
      );
    }
  }

  return response;
}

/**
 * Parse API response
 */
async function parseResponse<T>(response: Response): Promise<T> {
  const contentType = response.headers.get("content-type");

  if (contentType && contentType.includes("application/json")) {
    return await response.json();
  }

  throw createApiError(
    response.status,
    `Unexpected content type: ${contentType}`,
    "invalid_content_type"
  );
}

/**
 * Format error from API response
 */
async function handleApiError(response: Response): Promise<ApiError> {
  const contentType = response.headers.get("content-type");

  // Try to parse as JSON first
  if (contentType && contentType.includes("application/json")) {
    try {
      const errorData = await response.json();

      // If the response has our standard error format, use it
      if (
        errorData &&
        typeof errorData === "object" &&
        "message" in errorData
      ) {
        return createApiError(
          response.status,
          errorData.message || "Unknown error",
          errorData.code,
          errorData.details
        );
      }
    } catch (e) {
      // JSON parsing failed, fall back to text
      console.error("Error parsing JSON error response:", e);
    }
  }

  // Fall back to text
  try {
    const errorText = await response.text();
    return createApiError(response.status, errorText || response.statusText);
  } catch (e) {
    // If all else fails, create a generic error
    return createApiError(
      response.status,
      response.statusText || `Error ${response.status}`,
      "unknown_error"
    );
  }
}

/**
 * Make a GET request
 */
export async function get<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  try {
    const headers = {
      ...getAuthHeaders(),
      ...(options.headers || {}),
    };

    const response = await makeRequestWithRetry(endpoint, {
      ...DEFAULT_OPTIONS,
      ...options,
      headers,
      method: "GET",
    });

    if (!response.ok) {
      const error = await handleApiError(response);
      throw error;
    }

    return await parseResponse<T>(response);
  } catch (error) {
    console.error(`API GET error for ${endpoint}:`, error);

    // If it's already an ApiError, rethrow it
    if (error && typeof error === "object" && "status" in error) {
      throw error;
    }

    // Otherwise, wrap it
    throw createApiError(
      500,
      error instanceof Error ? error.message : "Unknown error occurred",
      "client_error"
    );
  }
}

/**
 * Make a POST request
 */
export async function post<T>(
  endpoint: string,
  data?: any,
  options: RequestInit = {}
): Promise<T> {
  try {
    const headers = {
      ...getAuthHeaders(),
      ...(options.headers || {}),
    };

    const response = await makeRequestWithRetry(endpoint, {
      ...DEFAULT_OPTIONS,
      ...options,
      headers,
      method: "POST",
      body: data ? JSON.stringify(data) : undefined,
    });

    if (!response.ok) {
      const error = await handleApiError(response);
      throw error;
    }

    return await parseResponse<T>(response);
  } catch (error) {
    console.error(`API POST error for ${endpoint}:`, error);

    // If it's already an ApiError, rethrow it
    if (error && typeof error === "object" && "status" in error) {
      throw error;
    }

    // Otherwise, wrap it
    throw createApiError(
      500,
      error instanceof Error ? error.message : "Unknown error occurred",
      "client_error"
    );
  }
}

/**
 * Make a PUT request
 */
export async function put<T>(
  endpoint: string,
  data?: any,
  options: RequestInit = {}
): Promise<T> {
  try {
    const headers = {
      ...getAuthHeaders(),
      ...(options.headers || {}),
    };

    const response = await makeRequestWithRetry(endpoint, {
      ...DEFAULT_OPTIONS,
      ...options,
      headers,
      method: "PUT",
      body: data ? JSON.stringify(data) : undefined,
    });

    if (!response.ok) {
      const error = await handleApiError(response);
      throw error;
    }

    return await parseResponse<T>(response);
  } catch (error) {
    console.error(`API PUT error for ${endpoint}:`, error);

    // If it's already an ApiError, rethrow it
    if (error && typeof error === "object" && "status" in error) {
      throw error;
    }

    // Otherwise, wrap it
    throw createApiError(
      500,
      error instanceof Error ? error.message : "Unknown error occurred",
      "client_error"
    );
  }
}

/**
 * Make a DELETE request
 */
export async function del<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  try {
    const headers = {
      ...getAuthHeaders(),
      ...(options.headers || {}),
    };

    const response = await makeRequestWithRetry(endpoint, {
      ...DEFAULT_OPTIONS,
      ...options,
      headers,
      method: "DELETE",
    });

    if (!response.ok) {
      const error = await handleApiError(response);
      throw error;
    }

    return await parseResponse<T>(response);
  } catch (error) {
    console.error(`API DELETE error for ${endpoint}:`, error);

    // If it's already an ApiError, rethrow it
    if (error && typeof error === "object" && "status" in error) {
      throw error;
    }

    // Otherwise, wrap it
    throw createApiError(
      500,
      error instanceof Error ? error.message : "Unknown error occurred",
      "client_error"
    );
  }
}
