"use client";

import { useState, useEffect } from "react";
import * as apiClient from "../utils/apiClient";
import { isAuthenticated as checkAuth } from "../services/auth";

/**
 * Hook for API access with authentication state
 */
export function useApi() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  useEffect(() => {
    // Check authentication status on mount and update state
    const checkAuthStatus = async () => {
      try {
        const authStatus = await checkAuth();
        console.log(
          `[useApi] Authentication status: ${authStatus ? "authenticated" : "not authenticated"}`
        );
        setIsAuthenticated(authStatus);
      } catch (error) {
        console.error("[useApi] Error checking auth status:", error);
        setIsAuthenticated(false);
      }
    };

    checkAuthStatus();
  }, []);

  return {
    api: apiClient,
    isAuthenticated,
  };
}
