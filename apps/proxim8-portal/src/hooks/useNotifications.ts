"use client";

import { useNotificationStore } from "@/stores/notificationStore";

/**
 * Hook for accessing notification state and actions
 * This provides a similar API to the old context-based implementation
 * for easier migration
 */
export function useNotifications() {
  const {
    notifications,
    unreadCount,
    loading,
    error,
    fetchNotifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
  } = useNotificationStore();

  return {
    notifications,
    unreadCount,
    loading,
    error,
    fetchNotifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
  };
}
