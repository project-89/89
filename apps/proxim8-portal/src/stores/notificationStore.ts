"use client";

import { create } from "zustand";
import { useWalletAuth } from "./walletAuthStore";
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  getUnreadCount,
  Notification,
} from "../services/notification";
import { ApiError } from "@/types/error";

interface NotificationState {
  // State
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
  lastFetch: number;

  // Actions
  fetchNotifications: () => Promise<void>;
  markNotificationAsRead: (notificationId: string) => Promise<void>;
  markAllNotificationsAsRead: () => Promise<void>;
  resetNotifications: () => void;
}

export const useNotificationStore = create<NotificationState>()((set, get) => ({
  // Initial state
  notifications: [],
  unreadCount: 0,
  loading: false,
  error: null,
  lastFetch: 0,

  // Fetch all notifications
  fetchNotifications: async () => {
    const { walletAddress } = useWalletAuth();

    // Skip if no wallet is connected
    if (!walletAddress) {
      console.log("[NotificationStore] Not fetching - wallet not connected");
      return;
    }

    set({ loading: true, error: null });

    try {
      console.log("[NotificationStore] Fetching notifications");
      // JWT auth handled by the centralized API utility
      const result = await getNotifications(
        50, // Get up to 50 notifications
        0,
        false // Get all notifications, not just unread
      );

      // Validate the response has the expected format
      if (result && Array.isArray(result.notifications)) {
        console.log(
          `[NotificationStore] Received ${result.notifications.length} notifications`
        );
        set({ notifications: result.notifications });
      } else {
        console.error("[NotificationStore] Invalid response format:", result);
        // Set to empty array to prevent undefined errors
        set({
          notifications: [],
          error: "Invalid notifications data format",
        });
      }

      // Get the unread count directly from an API call
      try {
        const countResult = await getUnreadCount();
        if (countResult && typeof countResult.count === "number") {
          set({ unreadCount: countResult.count });
        } else {
          set({ unreadCount: 0 });
        }
      } catch (countErr) {
        console.error(
          "[NotificationStore] Error fetching unread count:",
          countErr
        );
        set({ unreadCount: 0 });
      }

      set({ lastFetch: Date.now() });
    } catch (err) {
      console.error("[NotificationStore] Error fetching notifications:", err);

      const errorMessage =
        err instanceof ApiError ? err.message : "Failed to load notifications";

      set({
        error: errorMessage,
        notifications: [],
      });
    } finally {
      set({ loading: false });
    }
  },

  // Mark a single notification as read
  markNotificationAsRead: async (notificationId: string) => {
    const { walletAddress } = useWalletAuth();

    if (!walletAddress) return;

    try {
      // JWT auth handled by the centralized API utility
      await markAsRead([notificationId]);

      // Update local state
      set((state) => ({
        notifications: state.notifications.map((n) =>
          n.id === notificationId ? { ...n, read: true } : n
        ),
        unreadCount: Math.max(0, state.unreadCount - 1),
      }));
    } catch (err) {
      console.error(
        "[NotificationStore] Error marking notification as read:",
        err
      );

      const errorMessage =
        err instanceof ApiError
          ? err.message
          : "Failed to mark notification as read";

      set({ error: errorMessage });
    }
  },

  // Mark all notifications as read
  markAllNotificationsAsRead: async () => {
    const { walletAddress } = useWalletAuth();
    const { unreadCount } = get();

    if (!walletAddress || unreadCount === 0) return;

    try {
      // JWT auth handled by the centralized API utility
      await markAllAsRead();

      // Update local state
      set((state) => ({
        notifications: state.notifications.map((n) => ({ ...n, read: true })),
        unreadCount: 0,
      }));
    } catch (err) {
      console.error(
        "[NotificationStore] Error marking all notifications as read:",
        err
      );

      const errorMessage =
        err instanceof ApiError
          ? err.message
          : "Failed to mark all notifications as read";

      set({ error: errorMessage });
    }
  },

  // Reset notification state (used when wallet disconnects)
  resetNotifications: () => {
    set({
      notifications: [],
      unreadCount: 0,
      lastFetch: 0,
      error: null,
    });
  },
}));
