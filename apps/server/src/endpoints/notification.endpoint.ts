import { Request, Response } from 'express';
import { ERROR_MESSAGES } from '../constants';
import {
  BulkCreateNotificationsRequest,
  GetUserNotificationsRequest,
  MarkAllNotificationsReadRequest,
  MarkNotificationReadRequest,
} from '../schemas';
import {
  bulkCreateNotifications,
  getNotificationStats,
  getUserNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from '../services/notification.service';
import { ApiError, sendError, sendSuccess } from '../utils';

/**
 * MIGRATED: Removed pure CRUD handlers
 * 
 * DELETED:
 * - handleCreateNotification → Use POST /api/model/notification
 * - handleGetNotification → Use GET /api/model/notification/:id
 * - handleDeleteNotification → Use DELETE /api/model/notification/:id
 * 
 * KEPT: Business logic handlers only
 */

/**
 * Get user notifications with pagination and filtering
 */
export async function handleGetUserNotifications(req: Request, res: Response) {
  try {
    // TODO: Get user from auth middleware
    const userId = 'temp-user-id'; // Placeholder until auth is integrated
    const notifications = await getUserNotifications(
      req as unknown as GetUserNotificationsRequest,
      userId
    );
    sendSuccess(res, notifications, 'Notifications retrieved successfully');
  } catch (error) {
    const apiError = ApiError.from(error, 500, ERROR_MESSAGES.INTERNAL_ERROR);
    sendError(res, apiError, apiError.statusCode);
  }
}

/**
 * Mark notification as read/unread
 */
export async function handleMarkNotificationRead(req: Request, res: Response) {
  try {
    // TODO: Get user from auth middleware
    const userId = 'temp-user-id'; // Placeholder until auth is integrated
    const notification = await markNotificationRead(
      req as unknown as MarkNotificationReadRequest,
      userId
    );
    sendSuccess(res, notification, 'Notification updated successfully');
  } catch (error) {
    const apiError = ApiError.from(error, 500, ERROR_MESSAGES.INTERNAL_ERROR);
    sendError(res, apiError, apiError.statusCode);
  }
}

/**
 * Mark all notifications as read for a user
 */
export async function handleMarkAllNotificationsRead(
  req: Request,
  res: Response
) {
  try {
    // TODO: Get user from auth middleware
    const userId = 'temp-user-id'; // Placeholder until auth is integrated
    const count = await markAllNotificationsRead(
      req as unknown as MarkAllNotificationsReadRequest,
      userId
    );
    sendSuccess(res, { count }, `${count} notifications marked as read`);
  } catch (error) {
    const apiError = ApiError.from(error, 500, ERROR_MESSAGES.INTERNAL_ERROR);
    sendError(res, apiError, apiError.statusCode);
  }
}

/**
 * Bulk create notifications
 */
export async function handleBulkCreateNotifications(
  req: Request,
  res: Response
) {
  try {
    const count = await bulkCreateNotifications(
      req as unknown as BulkCreateNotificationsRequest
    );
    sendSuccess(res, { count }, `${count} notifications created successfully`);
  } catch (error) {
    const apiError = ApiError.from(error, 500, ERROR_MESSAGES.INTERNAL_ERROR);
    sendError(res, apiError, apiError.statusCode);
  }
}

/**
 * Get notification statistics for a user
 */
export async function handleGetNotificationStats(req: Request, res: Response) {
  try {
    // TODO: Get user from auth middleware
    const userId = 'temp-user-id'; // Placeholder until auth is integrated
    const walletAddress = 'temp-wallet'; // Placeholder until auth is integrated
    const stats = await getNotificationStats(userId, walletAddress);
    sendSuccess(res, stats, 'Notification stats retrieved successfully');
  } catch (error) {
    const apiError = ApiError.from(error, 500, ERROR_MESSAGES.INTERNAL_ERROR);
    sendError(res, apiError, apiError.statusCode);
  }
}
