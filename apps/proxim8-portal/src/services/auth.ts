import { AuthResponse, AuthUser } from "@/types/auth";
import * as apiClient from "@/utils/apiClient";

// API endpoint path for Next.js API routes
const AUTH_API_PATH = "/api/auth";

/**
 * Handle user login/authentication via wallet signature
 */
export const login = async (
  walletAddress: string,
  signature: string,
  message: string
): Promise<AuthResponse> => {
  try {
    console.log(
      `[Auth] Logging in wallet: ${walletAddress.substring(0, 8)}...`
    );

    // Call the Next.js API route
    const data = await apiClient.post<AuthResponse>(`${AUTH_API_PATH}/login`, {
      walletAddress,
      signature,
      message,
    });

    console.log(`[Auth] Login successful:`, data);
    return data;
  } catch (error) {
    console.error("[Auth] Login error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
};

/**
 * Logout from the application
 */
export const logout = async (): Promise<boolean> => {
  try {
    // Call the logout API route
    await apiClient.post(`${AUTH_API_PATH}/logout`, {});
    console.log("[Auth Service] Logged out successfully");
    return true;
  } catch (error) {
    console.error("[Auth Service] Logout error:", error);
    return false;
  }
};

/**
 * Check if the user is authenticated and get user info
 */
export const isAuthenticated = async (): Promise<boolean> => {
  try {
    const data = await apiClient.get<{
      authenticated: boolean;
      walletAddress: string | null;
      isAdmin: boolean;
    }>(`${AUTH_API_PATH}/status`);
    return data.authenticated === true;
  } catch (error) {
    console.error("[Auth] Error checking authentication status:", error);
    return false;
  }
};

/**
 * Get the current authenticated user info
 */
export const getUser = async (): Promise<AuthUser | null> => {
  try {
    const data = await apiClient.get<{
      authenticated: boolean;
      walletAddress: string | null;
      isAdmin: boolean;
    }>(`${AUTH_API_PATH}/status`);

    if (data.authenticated && data.walletAddress) {
      return {
        walletAddress: data.walletAddress,
        isAdmin: data.isAdmin || false,
      };
    }

    return null;
  } catch (error) {
    console.error("[Auth] Error getting user data:", error);
    return null;
  }
};

/**
 * Check authentication status and get user info in one call
 */
export const getAuthStatus = async (): Promise<{
  authenticated: boolean;
  user: AuthUser | null;
}> => {
  try {
    const data = await apiClient.get<{
      authenticated: boolean;
      walletAddress: string | null;
      isAdmin: boolean;
    }>(`${AUTH_API_PATH}/status`);

    if (data.authenticated && data.walletAddress) {
      return {
        authenticated: true,
        user: {
          walletAddress: data.walletAddress,
          isAdmin: data.isAdmin || false,
        },
      };
    }

    return {
      authenticated: false,
      user: null,
    };
  } catch (error) {
    console.error("[Auth] Error checking auth status:", error);
    return {
      authenticated: false,
      user: null,
    };
  }
};
