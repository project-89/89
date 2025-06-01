"use client";

import React, { useState, useEffect } from "react";
import { useNotifications } from "../../context/NotificationContext";
import { Notification } from "../../services/notification";
import { NotificationToast } from "./NotificationToast";
import { DEFAULT_NOTIFICATION_TIMEOUT } from "../../config";

export const NotificationToastManager: React.FC = () => {
  const { notifications } = useNotifications();
  const [activeToasts, setActiveToasts] = useState<Notification[]>([]);
  const [processedIds, setProcessedIds] = useState<Set<string>>(new Set());

  // Process new notifications
  useEffect(() => {
    // Check if notifications is defined
    if (!notifications || !Array.isArray(notifications)) {
      console.log("[Notifications] No notifications data available");
      return;
    }

    // Only show notifications that are less than a minute old
    const currentTime = new Date();
    const recentNotifications = notifications.filter((notification) => {
      const notificationTime = new Date(notification.createdAt);
      const timeDiff = currentTime.getTime() - notificationTime.getTime();
      return timeDiff < 60000; // Less than 1 minute old
    });

    // Find unprocessed notifications
    const newNotifications = recentNotifications.filter(
      (notification) => !processedIds.has(notification.id) && !notification.read
    );

    if (newNotifications.length > 0) {
      // Add new notifications to active toasts (limit to 3 active at a time)
      setActiveToasts((prev) => {
        const combined = [...prev, ...newNotifications];
        return combined.slice(-3); // Keep only the 3 most recent
      });

      // Add to processed IDs
      setProcessedIds((prev) => {
        const newIds = new Set(prev);
        newNotifications.forEach((notification) => {
          newIds.add(notification.id);
        });
        return newIds;
      });
    }
  }, [notifications]);

  const removeToast = (id: string) => {
    setActiveToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  return (
    <div className="fixed right-0 top-0 mt-20 mr-4 z-50 flex flex-col items-end space-y-4">
      {activeToasts.map((notification) => (
        <NotificationToast
          key={notification.id}
          notification={notification}
          onClose={() => removeToast(notification.id)}
          autoHideDuration={DEFAULT_NOTIFICATION_TIMEOUT}
        />
      ))}
    </div>
  );
};
