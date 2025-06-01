"use client";

import { useEffect } from "react";
import { useWalletAuth } from "@/stores/walletAuthStore";
import { useNotificationStore } from "@/stores/notificationStore";

interface NotificationProviderProps {
  children: React.ReactNode;
  pollingInterval?: number;
}

/**
 * Provider component that initializes notification polling
 * This replaces the context-based implementation with a Zustand store
 */
export function NotificationProvider({
  children,
  pollingInterval = 120000, // Default to 2 minutes
}: NotificationProviderProps) {
  const { walletAddress } = useWalletAuth();
  const { fetchNotifications, resetNotifications, lastFetch } =
    useNotificationStore();

  // Initialize notifications when wallet connects
  // and reset when wallet disconnects
  useEffect(() => {
    if (walletAddress) {
      // Fetch notifications on initial mount or if it's been a while
      if (Date.now() - lastFetch > 60000 || lastFetch === 0) {
        fetchNotifications();
      }
    } else {
      // Reset notifications when wallet disconnects
      resetNotifications();
    }
  }, [walletAddress, fetchNotifications, resetNotifications, lastFetch]);

  // Set up polling for notifications
  useEffect(() => {
    // Only set up polling if wallet is connected
    if (!walletAddress) return;

    // Set up polling interval
    const interval = setInterval(() => {
      fetchNotifications();
    }, pollingInterval);

    // Clean up on unmount
    return () => {
      clearInterval(interval);
    };
  }, [walletAddress, fetchNotifications, pollingInterval]);

  // Just render children - the store handles state
  return <>{children}</>;
}
