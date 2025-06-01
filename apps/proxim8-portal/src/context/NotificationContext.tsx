"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletAuth } from "@/stores/walletAuthStore";
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  getUnreadCount,
  Notification,
} from "../services/notification";
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
  fetchNotifications: () => Promise<void>;
  markNotificationAsRead: (notificationId: string) => Promise<void>;
  markAllNotificationsAsRead: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined
);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error(
      "useNotifications must be used within a NotificationProvider"
    );
  }
  return context;
};

interface NotificationProviderProps {
  children: React.ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({
  children,
}) => {
  const { publicKey } = useWallet();
  const {
    connected: storeConnected,
    isAuthenticated,
    authenticate,
    isAuthenticating,
  } = useWalletAuth();

  // Always initialize with an empty array to prevent 'undefined' errors
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFetch, setLastFetch] = useState<number>(0);

  const fetchNotifications = useCallback(async () => {
    if (!publicKey || !storeConnected) {
      console.log(
        "[Notifications] Not fetching - wallet not connected or not authenticated"
      );
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log("[Notifications] Fetching notifications");
      // JWT auth handled by the centralized API utility
      const result = await getNotifications(
        50, // Get up to 50 notifications
        0,
        false // Get all notifications, not just unread
      );

      // Validate the response has the expected format
      if (result && Array.isArray(result.notifications)) {
        console.log(
          `[Notifications] Received ${result.notifications.length} notifications`
        );
        setNotifications(result.notifications);
      } else {
        console.error("[Notifications] Invalid response format:", result);
        // Set to empty array to prevent undefined errors
        setNotifications([]);
        setError("Invalid notifications data format");
      }

      // Get the unread count directly from an API call
      try {
        const countResult = await getUnreadCount();
        if (countResult && typeof countResult.count === "number") {
          setUnreadCount(countResult.count);
        } else {
          setUnreadCount(0);
        }
      } catch (countErr) {
        console.error("[Notifications] Error fetching unread count:", countErr);
        setUnreadCount(0);
      }

      setLastFetch(Date.now());
    } catch (err) {
      console.error("[Notifications] Error fetching notifications:", err);
      setError("Failed to load notifications");
      // Ensure notifications is always an array, even on error
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }, [publicKey, storeConnected]);

  const markNotificationAsRead = useCallback(
    async (notificationId: string) => {
      if (!publicKey || !storeConnected) return;

      try {
        // JWT auth handled by the centralized API utility
        await markAsRead([notificationId]);

        // Update local state
        setNotifications((prev) =>
          prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      } catch (err) {
        console.error(
          "[Notifications] Error marking notification as read:",
          err
        );
        setError("Failed to mark notification as read");
      }
    },
    [publicKey, storeConnected]
  );

  const markAllNotificationsAsRead = useCallback(async () => {
    if (!publicKey || !storeConnected || unreadCount === 0) return;

    try {
      // JWT auth handled by the centralized API utility
      await markAllAsRead();

      // Update local state
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error(
        "[Notifications] Error marking all notifications as read:",
        err
      );
      setError("Failed to mark all notifications as read");
    }
  }, [publicKey, storeConnected, unreadCount]);

  // Authenticate and fetch notifications when wallet is connected
  /* <COMMENTED_OUT>
  useEffect(() => {
    let mounted = true;

    const initializeNotifications = async () => {
      if (!mounted) return;

      // Check storeConnected, isAuthenticating before attempting to authenticate
      if (publicKey && storeConnected && !isAuthenticated && !isAuthenticating) {
        console.log(
          "[NotificationContext] Wallet adapter and store connected, not authenticated, not authenticating. Attempting to authenticate..."
        );
        const success = await authenticate();
        if (success && mounted) {
          console.log(
            "[NotificationContext] Authentication successful, fetching notifications."
          );
          fetchNotifications();
        }
      } else if (
        publicKey &&
        storeConnected &&
        isAuthenticated &&
        (Date.now() - lastFetch > 60000 || lastFetch === 0)
      ) {
        fetchNotifications();
      }
    };

    initializeNotifications();

    // Set up polling interval (every 2 minutes)
    const interval = setInterval(() => {
      if (publicKey && storeConnected && isAuthenticated) { // Also ensure authenticated for polling fetch
        fetchNotifications();
      }
    }, 120000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [
    publicKey,
    storeConnected, // Add storeConnected to dependency array
    isAuthenticated,
    authenticate,
    fetchNotifications,
    lastFetch,
    isAuthenticating,
  ]);
  </COMMENTED_OUT> */

  // Reset notifications when wallet disconnects
  useEffect(() => {
    if (!publicKey) {
      setNotifications([]);
      setUnreadCount(0);
      setLastFetch(0);
      setError(null);
    }
  }, [publicKey]);

  const value = {
    notifications,
    unreadCount,
    loading,
    error,
    fetchNotifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};
