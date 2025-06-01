/**
 * Server API Client
 *
 * A utility for making API requests from server components
 * with proper typing and error handling.
 */

import { ApiError } from "@/types/error";

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

const API_KEY = process.env.NEXT_PUBLIC_API_KEY || "";

export class ServerApiClient {
  private baseUrl: string;
  private headers: Record<string, string>;

  constructor(baseUrl: string = "") {
    this.baseUrl = baseUrl;
    this.headers = {
      "Content-Type": "application/json",
      "X-API-Key": API_KEY,
    };
  }

  /**
   * Make a GET request
   */
  async get<T>(path: string, options?: FetchOptions): Promise<T> {
    return this.request<T>(path, {
      method: "GET",
      ...options,
    });
  }

  /**
   * Make a POST request
   */
  async post<T>(path: string, data?: any, options?: FetchOptions): Promise<T> {
    return this.request<T>(path, {
      method: "POST",
      body: data ? JSON.stringify(data) : undefined,
      ...options,
    });
  }

  /**
   * Make a PUT request
   */
  async put<T>(path: string, data?: any, options?: FetchOptions): Promise<T> {
    return this.request<T>(path, {
      method: "PUT",
      body: data ? JSON.stringify(data) : undefined,
      ...options,
    });
  }

  /**
   * Make a DELETE request
   */
  async delete<T>(path: string, options?: FetchOptions): Promise<T> {
    return this.request<T>(path, {
      method: "DELETE",
      ...options,
    });
  }

  /**
   * Make a PATCH request
   */
  async patch<T>(path: string, data?: any, options?: FetchOptions): Promise<T> {
    return this.request<T>(path, {
      method: "PATCH",
      body: data ? JSON.stringify(data) : undefined,
      ...options,
    });
  }

  /**
   * Make a request with proper error handling
   */
  private async request<T>(
    path: string,
    options: FetchOptions = {}
  ): Promise<T> {
    const url = this.buildUrl(path);
    const mergedOptions: RequestInit = {
      method: options.method || "GET",
      headers: {
        ...this.headers,
        ...options.headers,
      },
      body: options.body,
      cache: options.cache,
      next: options.next,
    };

    try {
      const response = await fetch(url, mergedOptions);

      // Handle common error status codes
      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch (e) {
          // If we can't parse JSON, use text
          const text = await response.text();
          errorData = { message: text || `Server error (${response.status})` };
        }

        throw new ApiError({
          status: response.status,
          message: errorData.message || `Error ${response.status}`,
          data: errorData,
        });
      }

      // Handle different content types
      const contentType = response.headers.get("content-type");
      if (contentType?.includes("application/json")) {
        return (await response.json()) as T;
      } else if (contentType?.includes("text/")) {
        return (await response.text()) as unknown as T;
      } else {
        // For other content types (like binary data)
        return (await response.blob()) as unknown as T;
      }
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }

      // Convert other errors to ApiError
      throw new ApiError({
        status: 0,
        message: error instanceof Error ? error.message : "Unknown error",
        error: error instanceof Error ? error : new Error("Unknown error"),
      });
    }
  }

  /**
   * Build the full URL for the request
   */
  private buildUrl(path: string): string {
    // If path is already a full URL, return it
    if (path.startsWith("http")) {
      return path;
    }

    // Otherwise, combine base URL with path
    let baseUrl = this.baseUrl;

    // Remove trailing slash from baseUrl if exists
    if (baseUrl.endsWith("/")) {
      baseUrl = baseUrl.slice(0, -1);
    }

    // Add leading slash to path if not exists
    if (!path.startsWith("/")) {
      path = `/${path}`;
    }

    return `${baseUrl}${path}`;
  }
}

// Create and export a default instance
export const serverApiClient = new ServerApiClient(
  process.env.NEXT_PUBLIC_API_URL || ""
);

// Also export the class for custom instances
export default ServerApiClient;
