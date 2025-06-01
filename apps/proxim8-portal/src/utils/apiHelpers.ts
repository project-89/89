import { API_BASE_URL } from "@/config";

// Get API key from environment
const API_KEY = process.env.NEXT_PUBLIC_API_KEY || "";

/**
 * Creates headers with API key for server requests
 * Note: JWT authentication is handled automatically via HTTP cookies
 */
export function createServerHeaders(): HeadersInit {
  console.log(
    `[Server API Debug] Creating headers with API key: ${API_KEY.substring(0, 4)}...`
  );

  if (!API_KEY) {
    console.warn(
      "[Server API Debug] No API key found in environment variables"
    );
  }

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    "X-API-Key": API_KEY,
  };

  console.log("[Server API Debug] Final headers:", headers);
  return headers;
}

/**
 * Fetches data from the server API with proper headers
 * Authentication is handled automatically via JWT cookies
 */
export async function fetchFromServer(
  endpoint: string,
  options: RequestInit = {}
) {
  const url = `${API_BASE_URL}${endpoint}`;
  console.log(`[Server API Debug] Fetching from server: ${url}`);

  // Merge the default headers with any provided headers
  const headers = {
    ...createServerHeaders(),
    ...(options.headers || {}),
  };

  console.log(`[Server API Debug] Request method: ${options.method || "GET"}`);
  console.log(`[Server API Debug] Request headers:`, headers);

  if (options.body) {
    console.log(`[Server API Debug] Request body:`, options.body);
  }

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: "include", // Include cookies for JWT authentication
  });

  console.log(`[Server API Debug] Response status: ${response.status}`);

  if (!response.ok) {
    console.error(
      `[Server API Debug] Response error: ${response.status} ${response.statusText}`
    );

    try {
      const errorData = await response.json();
      console.error("[Server API Debug] Error response data:", errorData);
      throw new Error(errorData.message || `API Error: ${response.status}`);
    } catch (e) {
      console.error("[Server API Debug] Could not parse error response:", e);
      throw new Error(`API Error: ${response.status}`);
    }
  }

  const responseData = await response.json();
  console.log("[Server API Debug] Response data:", responseData);
  return responseData;
}
