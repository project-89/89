import { Response } from "express";
import * as notificationService from "../services/notification";
import { RequestWithUser } from "../middleware/auth";

/**
 * Get notifications for the current user
 */
export const getNotifications = async (
  req: RequestWithUser,
  res: Response
): Promise<void> => {
  try {
    const { walletAddress } = req.user || {};

    if (!walletAddress) {
      res.status(401).json({ message: "Authentication required" });
      return;
    }

    const { limit, offset, unreadOnly } = req.query;

    const notifications = await notificationService.getNotifications(
      walletAddress,
      {
        limit: limit ? parseInt(limit as string) : undefined,
        offset: offset ? parseInt(offset as string) : undefined,
        unreadOnly: unreadOnly === "true",
      }
    );

    res.status(200).json(notifications);
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({
      message: "Server error",
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

/**
 * Mark notifications as read
 */
export const markAsRead = async (
  req: RequestWithUser,
  res: Response
): Promise<void> => {
  try {
    const { walletAddress } = req.user || {};

    if (!walletAddress) {
      res.status(401).json({ message: "Authentication required" });
      return;
    }

    const { ids } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      res.status(400).json({ message: "Notification IDs are required" });
      return;
    }

    const modifiedCount = await notificationService.markAsRead(
      ids,
      walletAddress
    );

    res.status(200).json({
      message: `Marked ${modifiedCount} notifications as read`,
      modifiedCount,
    });
  } catch (error) {
    console.error("Error marking notifications as read:", error);
    res.status(500).json({
      message: "Server error",
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

/**
 * Mark all notifications as read
 */
export const markAllAsRead = async (
  req: RequestWithUser,
  res: Response
): Promise<void> => {
  try {
    const { walletAddress } = req.user || {};

    if (!walletAddress) {
      res.status(401).json({ message: "Authentication required" });
      return;
    }

    // Get all unread notification IDs for this wallet
    const unreadNotifications = await notificationService.getNotifications(
      walletAddress,
      { unreadOnly: true, limit: 1000 }
    );

    const notificationIds = unreadNotifications.map((notif) =>
      notif._id.toString()
    );

    if (notificationIds.length === 0) {
      res.status(200).json({
        message: "No unread notifications found",
        modifiedCount: 0,
      });
      return;
    }

    const modifiedCount = await notificationService.markAsRead(
      notificationIds,
      walletAddress
    );

    res.status(200).json({
      message: `Marked ${modifiedCount} notifications as read`,
      modifiedCount,
    });
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    res.status(500).json({
      message: "Server error",
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

/**
 * Get the count of unread notifications for the current user
 */
export const getUnreadCount = async (
  req: RequestWithUser,
  res: Response
): Promise<void> => {
  try {
    const { walletAddress } = req.user || {};

    if (!walletAddress) {
      res.status(401).json({ message: "Authentication required" });
      return;
    }

    const count = await notificationService.getUnreadCount(walletAddress);

    res.status(200).json({
      count,
      success: true,
    });
  } catch (error) {
    console.error("Error getting unread notification count:", error);
    res.status(500).json({
      message: "Server error",
      error: error instanceof Error ? error.message : String(error),
      success: false,
    });
  }
};
