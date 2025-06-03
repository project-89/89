import { ERROR_MESSAGES } from '../constants';
import {
  BulkCreateNotificationsRequest,
  CreateNotificationRequest,
  DeleteNotificationRequest,
  GetNotificationRequest,
  GetUserNotificationsRequest,
  MarkAllNotificationsReadRequest,
  MarkNotificationReadRequest,
  Notification,
  NotificationDocument,
  NotificationListResponse,
  NotificationStatsResponse,
  toNotification,
} from '../schemas';
import { ApiError, idFilter } from '../utils';
import { getDb } from '../utils/mongodb';

const LOG_PREFIX = '[Notification Service]';

// Add Proxim8 collections to constants
const PROXIM8_COLLECTIONS = {
  NOTIFICATIONS: 'proxim8.notifications',
} as const;

/**
 * Create a new notification
 */
export const createNotification = async (
  request: CreateNotificationRequest
): Promise<Notification> => {
  try {
    console.log(`${LOG_PREFIX} Creating notification:`, request.body.type);
    const db = await getDb();

    const now = new Date();

    // Create notification document
    const notificationDoc: Omit<NotificationDocument, 'id'> = {
      userId: request.body.userId,
      walletAddress: request.body.walletAddress.toLowerCase(),
      type: request.body.type,
      title: request.body.title,
      message: request.body.message,
      read: false,
      data: request.body.data,
      createdAt: now,
      updatedAt: now,
    };

    // Insert into database
    const result = await db
      .collection(PROXIM8_COLLECTIONS.NOTIFICATIONS)
      .insertOne(notificationDoc);
    const notificationId = result.insertedId.toString();

    console.log(`${LOG_PREFIX} Notification created:`, notificationId);

    return toNotification(
      { ...notificationDoc, _id: result.insertedId },
      notificationId
    );
  } catch (error) {
    console.error(`${LOG_PREFIX} Error creating notification:`, error);
    throw ApiError.from(error, 500, ERROR_MESSAGES.INTERNAL_ERROR);
  }
};

/**
 * Get notification by ID
 */
export const getNotification = async (
  request: GetNotificationRequest
): Promise<Notification | null> => {
  try {
    console.log(
      `${LOG_PREFIX} Getting notification:`,
      request.params.notificationId
    );
    const db = await getDb();

    const filter = idFilter(request.params.notificationId);
    if (!filter) {
      return null;
    }

    const notificationDoc = await db
      .collection(PROXIM8_COLLECTIONS.NOTIFICATIONS)
      .findOne(filter);
    if (!notificationDoc) {
      return null;
    }

    return toNotification(notificationDoc, request.params.notificationId);
  } catch (error) {
    console.error(`${LOG_PREFIX} Error getting notification:`, error);
    throw ApiError.from(error, 500, ERROR_MESSAGES.INTERNAL_ERROR);
  }
};

/**
 * Get user notifications with pagination and filtering
 */
export const getUserNotifications = async (
  request: GetUserNotificationsRequest,
  userId?: string
): Promise<NotificationListResponse> => {
  try {
    console.log(`${LOG_PREFIX} Getting user notifications`);
    const db = await getDb();

    const limit = request.query?.limit || 20;
    const offset = request.query?.offset || 0;

    // Build query
    const query: any = {};

    // User identification - use either userId or walletAddress
    if (userId) {
      query.userId = userId;
    } else if (request.query?.userId) {
      query.userId = request.query.userId;
    } else if (request.query?.walletAddress) {
      query.walletAddress = request.query.walletAddress.toLowerCase();
    } else {
      throw new ApiError(400, 'User identification required');
    }

    // Additional filters
    if (request.query?.read !== undefined) {
      query.read = request.query.read;
    }
    if (request.query?.type) {
      query.type = request.query.type;
    }

    // Get total count and unread count
    const total = await db
      .collection(PROXIM8_COLLECTIONS.NOTIFICATIONS)
      .countDocuments(query);
    const unreadQuery = { ...query, read: false };
    const unreadCount = await db
      .collection(PROXIM8_COLLECTIONS.NOTIFICATIONS)
      .countDocuments(unreadQuery);

    // Get paginated results
    const notificationDocs = await db
      .collection(PROXIM8_COLLECTIONS.NOTIFICATIONS)
      .find(query)
      .sort({ createdAt: -1 })
      .skip(offset)
      .limit(limit)
      .toArray();

    const notifications = notificationDocs.map((doc) =>
      toNotification(doc, doc._id.toString())
    );

    return {
      notifications,
      total,
      unreadCount,
      hasMore: offset + limit < total,
    };
  } catch (error) {
    console.error(`${LOG_PREFIX} Error getting user notifications:`, error);
    throw ApiError.from(error, 500, ERROR_MESSAGES.INTERNAL_ERROR);
  }
};

/**
 * Mark notification as read/unread
 */
export const markNotificationRead = async (
  request: MarkNotificationReadRequest,
  userId?: string
): Promise<Notification> => {
  try {
    console.log(
      `${LOG_PREFIX} Marking notification read:`,
      request.params.notificationId
    );
    const db = await getDb();

    // Get notification first to verify ownership
    const filter = idFilter(request.params.notificationId);
    if (!filter) {
      throw new ApiError(404, 'Notification not found');
    }

    const notificationDoc = await db
      .collection(PROXIM8_COLLECTIONS.NOTIFICATIONS)
      .findOne(filter);
    if (!notificationDoc) {
      throw new ApiError(404, 'Notification not found');
    }

    // Verify ownership if userId provided
    if (userId && notificationDoc.userId !== userId) {
      throw new ApiError(403, 'Not authorized to modify this notification');
    }

    // Update notification
    const now = new Date();
    await db.collection(PROXIM8_COLLECTIONS.NOTIFICATIONS).updateOne(filter, {
      $set: {
        read: request.body.read,
        updatedAt: now,
      },
    });

    // Get updated notification
    const updatedDoc = await db
      .collection(PROXIM8_COLLECTIONS.NOTIFICATIONS)
      .findOne(filter);
    return toNotification(updatedDoc, request.params.notificationId);
  } catch (error) {
    console.error(`${LOG_PREFIX} Error marking notification read:`, error);
    throw ApiError.from(error, 500, ERROR_MESSAGES.INTERNAL_ERROR);
  }
};

/**
 * Mark all notifications as read for a user
 */
export const markAllNotificationsRead = async (
  request: MarkAllNotificationsReadRequest,
  userId?: string
): Promise<number> => {
  try {
    console.log(`${LOG_PREFIX} Marking all notifications read`);
    const db = await getDb();

    // Build query for user identification
    const query: any = {};
    if (userId) {
      query.userId = userId;
    } else if (request.body.userId) {
      query.userId = request.body.userId;
    } else if (request.body.walletAddress) {
      query.walletAddress = request.body.walletAddress.toLowerCase();
    } else {
      throw new ApiError(400, 'User identification required');
    }

    // Only update unread notifications
    query.read = false;

    // Update all unread notifications
    const now = new Date();
    const result = await db
      .collection(PROXIM8_COLLECTIONS.NOTIFICATIONS)
      .updateMany(query, {
        $set: {
          read: true,
          updatedAt: now,
        },
      });

    console.log(
      `${LOG_PREFIX} Marked ${result.modifiedCount} notifications as read`
    );
    return result.modifiedCount;
  } catch (error) {
    console.error(`${LOG_PREFIX} Error marking all notifications read:`, error);
    throw ApiError.from(error, 500, ERROR_MESSAGES.INTERNAL_ERROR);
  }
};

/**
 * Delete notification
 */
export const deleteNotification = async (
  request: DeleteNotificationRequest,
  userId?: string
): Promise<boolean> => {
  try {
    console.log(
      `${LOG_PREFIX} Deleting notification:`,
      request.params.notificationId
    );
    const db = await getDb();

    // Get notification first to verify ownership
    const filter = idFilter(request.params.notificationId);
    if (!filter) {
      throw new ApiError(404, 'Notification not found');
    }

    const notificationDoc = await db
      .collection(PROXIM8_COLLECTIONS.NOTIFICATIONS)
      .findOne(filter);
    if (!notificationDoc) {
      throw new ApiError(404, 'Notification not found');
    }

    // Verify ownership if userId provided
    if (userId && notificationDoc.userId !== userId) {
      throw new ApiError(403, 'Not authorized to delete this notification');
    }

    // Delete notification
    const result = await db
      .collection(PROXIM8_COLLECTIONS.NOTIFICATIONS)
      .deleteOne(filter);

    return result.deletedCount > 0;
  } catch (error) {
    console.error(`${LOG_PREFIX} Error deleting notification:`, error);
    throw ApiError.from(error, 500, ERROR_MESSAGES.INTERNAL_ERROR);
  }
};

/**
 * Bulk create notifications
 */
export const bulkCreateNotifications = async (
  request: BulkCreateNotificationsRequest
): Promise<number> => {
  try {
    console.log(
      `${LOG_PREFIX} Bulk creating ${request.body.notifications.length} notifications`
    );
    const db = await getDb();

    const now = new Date();

    // Prepare notification documents
    const notificationDocs = request.body.notifications.map((notification) => ({
      userId: notification.userId,
      walletAddress: notification.walletAddress.toLowerCase(),
      type: notification.type,
      title: notification.title,
      message: notification.message,
      read: false,
      data: notification.data,
      createdAt: now,
      updatedAt: now,
    }));

    // Insert all notifications
    const result = await db
      .collection(PROXIM8_COLLECTIONS.NOTIFICATIONS)
      .insertMany(notificationDocs);

    console.log(`${LOG_PREFIX} Created ${result.insertedCount} notifications`);
    return result.insertedCount;
  } catch (error) {
    console.error(`${LOG_PREFIX} Error bulk creating notifications:`, error);
    throw ApiError.from(error, 500, ERROR_MESSAGES.INTERNAL_ERROR);
  }
};

/**
 * Get notification statistics for a user
 */
export const getNotificationStats = async (
  userId?: string,
  walletAddress?: string
): Promise<NotificationStatsResponse> => {
  try {
    console.log(`${LOG_PREFIX} Getting notification stats`);
    const db = await getDb();

    // Build user query
    const userQuery: any = {};
    if (userId) {
      userQuery.userId = userId;
    } else if (walletAddress) {
      userQuery.walletAddress = walletAddress.toLowerCase();
    } else {
      throw new ApiError(400, 'User identification required');
    }

    // Get total count
    const total = await db
      .collection(PROXIM8_COLLECTIONS.NOTIFICATIONS)
      .countDocuments(userQuery);

    // Get unread count
    const unreadCount = await db
      .collection(PROXIM8_COLLECTIONS.NOTIFICATIONS)
      .countDocuments({
        ...userQuery,
        read: false,
      });

    // Get count by type
    const typeAggregation = await db
      .collection(PROXIM8_COLLECTIONS.NOTIFICATIONS)
      .aggregate([
        { $match: userQuery },
        { $group: { _id: '$type', count: { $sum: 1 } } },
      ])
      .toArray();

    const byType: Record<string, number> = {};
    typeAggregation.forEach((item) => {
      byType[item._id] = item.count;
    });

    return {
      total,
      unreadCount,
      byType,
    };
  } catch (error) {
    console.error(`${LOG_PREFIX} Error getting notification stats:`, error);
    throw ApiError.from(error, 500, ERROR_MESSAGES.INTERNAL_ERROR);
  }
};

// Export collection constants
export { PROXIM8_COLLECTIONS };
