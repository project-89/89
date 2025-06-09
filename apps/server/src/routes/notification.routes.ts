import { Router } from 'express';
import {
  handleBulkCreateNotifications,
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
  GetUserNotificationsRequestSchema,
  MarkAllNotificationsReadRequestSchema,
  MarkNotificationReadRequestSchema,
} from '../schemas';

const router = Router();

/**
 * MIGRATED: Removed CRUD routes
 * 
 * DELETED ROUTES - Use auto-CRUD instead:
 * - POST /notifications → POST /api/model/notification
 * - GET /notifications/:id → GET /api/model/notification/:id
 * - DELETE /notifications/:id → DELETE /api/model/notification/:id
 * 
 * KEPT: Business logic routes only
 */

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
