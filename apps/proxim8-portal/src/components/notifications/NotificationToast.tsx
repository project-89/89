"use client";

import React, { useState, useEffect } from "react";
import { Notification, NotificationType } from "../../services/notification";
import { useNotifications } from "../../context/NotificationContext";

interface NotificationToastProps {
  notification: Notification;
  onClose: () => void;
  autoHideDuration?: number;
}

export const NotificationToast: React.FC<NotificationToastProps> = ({
  notification,
  onClose,
  autoHideDuration = 5000,
}) => {
  const { markNotificationAsRead } = useNotifications();
  const [progress, setProgress] = useState(100);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const startTime = Date.now();
    const endTime = startTime + autoHideDuration;

    const handleProgress = () => {
      const now = Date.now();
      const remaining = endTime - now;
      const percentage = (remaining / autoHideDuration) * 100;

      if (percentage <= 0) {
        handleClose();
      } else {
        setProgress(percentage);
        requestAnimationFrame(handleProgress);
      }
    };

    const animationId = requestAnimationFrame(handleProgress);

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [autoHideDuration]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      onClose();
    }, 300); // Match animation duration
  };

  const handleMarkAsRead = () => {
    markNotificationAsRead(notification.id);
    handleClose();
  };

  // Determine icon based on notification type
  const getIcon = () => {
    switch (notification.type) {
      case NotificationType.VIDEO_COMPLETED:
        return "🎬";
      case NotificationType.LORE_CLAIMED:
        return "📚";
      case NotificationType.COMMENT_RECEIVED:
        return "💬";
      case NotificationType.SYSTEM_NOTIFICATION:
        return "🔔";
      default:
        return "📌";
    }
  };

  return (
    <div
      className={`notification-toast ${isExiting ? "toast-exit" : "toast-enter"}`}
      style={{ top: "20px" }}
    >
      <div className="notification-toast-content">
        <div className="flex items-center mb-2">
          <span className="mr-2 text-xl">{getIcon()}</span>
          <h3 className="notification-toast-title flex-1">
            {notification.title}
          </h3>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600"
            aria-label="Close"
          >
            ✕
          </button>
        </div>
        <p className="notification-toast-message">{notification.message}</p>
        {notification.data?.videoId && (
          <button
            className="mt-2 text-indigo-600 text-sm hover:text-indigo-800"
            onClick={handleMarkAsRead}
          >
            View Video
          </button>
        )}
      </div>
      <div
        className="notification-toast-progress"
        style={{ width: `${progress}%` }}
      ></div>
    </div>
  );
};
