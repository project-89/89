"use client";

import * as apiClient from "@/utils/apiClient";
// import { useAuthStore } from "@/stores/authStore"; // OLD STORE
import { useWalletAuthStore } from "@/stores/walletAuthStore"; // NEW STORE
import { ApiError, createApiError } from "@/types/error";

export enum NotificationType {
  VIDEO_COMPLETED = "VIDEO_COMPLETED",
  LORE_CLAIMED = "LORE_CLAIMED",
  COMMENT_RECEIVED = "COMMENT_RECEIVED",
  SYSTEM_NOTIFICATION = "SYSTEM_NOTIFICATION",
}

export interface Notification {
  id: string;
  walletAddress: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  data?: {
    nftId?: string;
    videoId?: string;
    commentId?: string;
    [key: string]: string | number | boolean | object | undefined;
  };
  createdAt: string;
  updatedAt: string;
}

export interface NotificationResponse {
  notifications: Notification[];
  total: number;
}

export interface MarkReadResponse {
  modifiedCount: number;
}

export interface DeleteResponse {
  success: boolean;
}

export interface UnreadCountResponse {
  count: number;
}

const NOTIFICATIONS_API_PATH = "/api/notifications";

/**
 * Get notifications for the current user
 */
export const getNotifications = async (
  limit: number = 20,
  offset: number = 0,
  unreadOnly: boolean = false
): Promise<NotificationResponse> => {
  try {
    // Query parameters
    const params = new URLSearchParams({
      limit: limit.toString(),
      offset: offset.toString(),
      unreadOnly: unreadOnly.toString(),
    });

    // Make the request
    return await apiClient.get<NotificationResponse>(
      `${NOTIFICATIONS_API_PATH}?${params.toString()}`
    );
  } catch (error) {
    console.error(
      "[Notification Service] Error fetching notifications:",
      error
    );

    // Return a standardized response
    if (error && typeof error === "object" && "status" in error) {
      throw error;
    }

    throw createApiError(
      500,
      "Failed to fetch notifications",
      "notification_fetch_error"
    );
  }
};

/**
 * Mark specific notifications as read
 */
export const markAsRead = async (
  notificationIds: string[]
): Promise<MarkReadResponse> => {
  try {
    if (!notificationIds.length) {
      return { modifiedCount: 0 };
    }

    return await apiClient.post<MarkReadResponse>(
      `${NOTIFICATIONS_API_PATH}/mark-read`,
      { notificationIds }
    );
  } catch (error) {
    console.error(
      "[Notification Service] Error marking notifications as read:",
      error
    );

    if (error && typeof error === "object" && "status" in error) {
      throw error;
    }

    throw createApiError(
      500,
      "Failed to mark notifications as read",
      "notification_update_error"
    );
  }
};

/**
 * Mark all notifications as read
 */
export const markAllAsRead = async (): Promise<MarkReadResponse> => {
  try {
    return await apiClient.post<MarkReadResponse>(
      `${NOTIFICATIONS_API_PATH}/mark-all-read`,
      {}
    );
  } catch (error) {
    console.error(
      "[Notification Service] Error marking all notifications as read:",
      error
    );

    if (error && typeof error === "object" && "status" in error) {
      throw error;
    }

    throw createApiError(
      500,
      "Failed to mark all notifications as read",
      "notification_update_error"
    );
  }
};

/**
 * Delete a notification
 */
export const deleteNotification = async (
  notificationId: string
): Promise<DeleteResponse> => {
  try {
    if (!notificationId) {
      throw createApiError(
        400,
        "Notification ID is required",
        "validation_error"
      );
    }

    return await apiClient.del<DeleteResponse>(
      `${NOTIFICATIONS_API_PATH}/${notificationId}`
    );
  } catch (error) {
    console.error("[Notification Service] Error deleting notification:", error);

    if (error && typeof error === "object" && "status" in error) {
      throw error;
    }

    throw createApiError(
      500,
      "Failed to delete notification",
      "notification_delete_error"
    );
  }
};

/**
 * Get unread notifications count
 */
export const getUnreadCount = async (): Promise<UnreadCountResponse> => {
  try {
    const isAuthenticated = useWalletAuthStore.getState().isAuthenticated;

    // Return 0 if not authenticated to avoid unnecessary API calls
    if (!isAuthenticated) {
      return { count: 0 };
    }

    return await apiClient.get<UnreadCountResponse>(
      `${NOTIFICATIONS_API_PATH}/unread-count`
    );
  } catch (error) {
    console.error("[Notification Service] Error fetching unread count:", error);

    // Don't throw an error for this case, just return 0
    // This is a non-critical operation that shouldn't break the UI
    return { count: 0 };
  }
};

/**
 * Get notification settings
 */
export const getNotificationSettings = async (): Promise<any> => {
  try {
    return await apiClient.get<any>(`${NOTIFICATIONS_API_PATH}/settings`);
  } catch (error) {
    console.error(
      "[Notification Service] Error fetching notification settings:",
      error
    );

    if (error && typeof error === "object" && "status" in error) {
      throw error;
    }

    throw createApiError(
      500,
      "Failed to fetch notification settings",
      "notification_settings_error"
    );
  }
};

/**
 * Update notification settings
 */
export const updateNotificationSettings = async (
  settings: any
): Promise<any> => {
  try {
    return await apiClient.put<any>(
      `${NOTIFICATIONS_API_PATH}/settings`,
      settings
    );
  } catch (error) {
    console.error(
      "[Notification Service] Error updating notification settings:",
      error
    );

    if (error && typeof error === "object" && "status" in error) {
      throw error;
    }

    throw createApiError(
      500,
      "Failed to update notification settings",
      "notification_settings_error"
    );
  }
};
