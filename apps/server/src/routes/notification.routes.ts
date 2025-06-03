import { Router } from 'express';
import {
  handleBulkCreateNotifications,
  handleCreateNotification,
  handleDeleteNotification,
  handleGetNotification,
  handleGetNotificationStats,
  handleGetUserNotifications,
  handleMarkAllNotificationsRead,
  handleMarkNotificationRead,
} from '../endpoints/notification.endpoint';
import {
  proxim8AuthenticatedEndpoint,
  proxim8SystemEndpoint,
} from '../middleware/proxim8Chains.middleware';
import {
  BulkCreateNotificationsRequestSchema,
  CreateNotificationRequestSchema,
  DeleteNotificationRequestSchema,
  GetNotificationRequestSchema,
  GetUserNotificationsRequestSchema,
  MarkAllNotificationsReadRequestSchema,
  MarkNotificationReadRequestSchema,
} from '../schemas';

const router = Router();

/**
 * Create a new notification
 * Admin/system endpoint for creating notifications
 */
router.post(
  '/notifications',
  ...proxim8SystemEndpoint(CreateNotificationRequestSchema),
  handleCreateNotification
);

/**
 * Get notification by ID
 * Requires authentication and ownership verification
 */
router.get(
  '/notifications/:notificationId',
  ...proxim8AuthenticatedEndpoint(GetNotificationRequestSchema),
  handleGetNotification
);

/**
 * Get user notifications with pagination and filtering
 * Requires authentication
 */
router.get(
  '/notifications/user',
  ...proxim8AuthenticatedEndpoint(GetUserNotificationsRequestSchema),
  handleGetUserNotifications
);

/**
 * Mark notification as read/unread
 * Requires authentication and ownership verification
 */
router.patch(
  '/notifications/:notificationId/read',
  ...proxim8AuthenticatedEndpoint(MarkNotificationReadRequestSchema),
  handleMarkNotificationRead
);

/**
 * Mark all notifications as read for a user
 * Requires authentication
 */
router.post(
  '/notifications/mark-all-read',
  ...proxim8AuthenticatedEndpoint(MarkAllNotificationsReadRequestSchema),
  handleMarkAllNotificationsRead
);

/**
 * Delete notification
 * Requires authentication and ownership verification
 */
router.delete(
  '/notifications/:notificationId',
  ...proxim8AuthenticatedEndpoint(DeleteNotificationRequestSchema),
  handleDeleteNotification
);

/**
 * Bulk create notifications
 * Admin/system endpoint for bulk operations
 */
router.post(
  '/notifications/bulk',
  ...proxim8SystemEndpoint(BulkCreateNotificationsRequestSchema),
  handleBulkCreateNotifications
);

/**
 * Get notification statistics for a user
 * Requires authentication
 */
router.get(
  '/notifications/stats',
  ...proxim8AuthenticatedEndpoint(),
  handleGetNotificationStats
);

export default router;
