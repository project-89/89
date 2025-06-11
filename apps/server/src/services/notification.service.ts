import { NotificationType } from '@prisma/client';
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
  NotificationListResponse,
  NotificationStatsResponse,
} from '../schemas';
import { ApiError } from '../utils';
import { prisma } from './prisma.service';

const LOG_PREFIX = '[Notification Service]';

// Helper function to map notification types
const mapNotificationType = (type: string): NotificationType => {
  const typeMap: Record<string, NotificationType> = {
    video_completed: NotificationType.VIDEO_COMPLETED,
    video_failed: NotificationType.VIDEO_FAILED,
    system_announcement: NotificationType.SYSTEM_ANNOUNCEMENT,
    nft_verified: NotificationType.NFT_VERIFIED,
    profile_update: NotificationType.PROFILE_UPDATE,
    mission_completed: NotificationType.MISSION_COMPLETED,
    VIDEO_COMPLETED: NotificationType.VIDEO_COMPLETED,
    VIDEO_FAILED: NotificationType.VIDEO_FAILED,
    SYSTEM_ANNOUNCEMENT: NotificationType.SYSTEM_ANNOUNCEMENT,
    NFT_VERIFIED: NotificationType.NFT_VERIFIED,
    PROFILE_UPDATE: NotificationType.PROFILE_UPDATE,
    MISSION_COMPLETED: NotificationType.MISSION_COMPLETED,
  };
  return typeMap[type] || NotificationType.SYSTEM_ANNOUNCEMENT;
};

// Helper function to convert dates to timestamps
const toTimestamp = (date: Date): number => {
  return Math.floor(date.getTime() / 1000);
};

// Helper function to convert Prisma notification to API format
const toNotificationResponse = (notification: any): Notification => {
  return {
    id: notification.id,
    userId: notification.account.walletAddress, // Legacy field
    walletAddress: notification.account.walletAddress,
    type: notification.type.toLowerCase(),
    title: notification.title,
    message: notification.message,
    read: notification.isRead,
    data: notification.data || undefined,
    createdAt: toTimestamp(notification.createdAt),
    updatedAt: toTimestamp(notification.updatedAt),
  };
};

/**
 * Create a new notification
 */
export const createNotification = async (
  request: CreateNotificationRequest
): Promise<Notification> => {
  try {
    console.log(`${LOG_PREFIX} Creating notification:`, request.body.type);

    const now = new Date();

    // Find or create account
    const account = await prisma.account.upsert({
      where: { walletAddress: request.body.walletAddress.toLowerCase() },
      create: {
        walletAddress: request.body.walletAddress.toLowerCase(),
        createdAt: now,
        updatedAt: now,
      },
      update: {
        updatedAt: now,
      },
    });

    // Create notification
    const notification = await prisma.notification.create({
      data: {
        accountId: account.id,
        type: mapNotificationType(request.body.type),
        title: request.body.title,
        message: request.body.message,
        data: request.body.data || null,
        isRead: false,
        createdAt: now,
        updatedAt: now,
      },
      include: {
        account: {
          select: {
            walletAddress: true,
          },
        },
      },
    });

    console.log(`${LOG_PREFIX} Notification created:`, notification.id);

    return toNotificationResponse(notification);
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

    const notification = await prisma.notification.findUnique({
      where: { id: request.params.notificationId },
      include: {
        account: {
          select: {
            walletAddress: true,
          },
        },
      },
    });

    if (!notification) {
      return null;
    }

    return toNotificationResponse(notification);
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
  walletAddress?: string
): Promise<NotificationListResponse> => {
  try {
    console.log(`${LOG_PREFIX} Getting user notifications`);

    const limit = request.query?.limit || 20;
    const offset = request.query?.offset || 0;

    // Determine wallet address to use
    let targetWalletAddress: string;
    if (walletAddress) {
      targetWalletAddress = walletAddress;
    } else if (request.query?.walletAddress) {
      targetWalletAddress = request.query.walletAddress.toLowerCase();
    } else {
      throw new ApiError(400, 'User identification required');
    }

    // Build where clause
    const where: any = {
      account: {
        walletAddress: targetWalletAddress,
      },
    };

    // Additional filters
    if (request.query?.read !== undefined) {
      where.isRead = request.query.read;
    }
    if (request.query?.type) {
      where.type = mapNotificationType(request.query.type);
    }

    // Get total count and unread count in parallel
    const [total, unreadCount, notifications] = await Promise.all([
      prisma.notification.count({ where }),
      prisma.notification.count({
        where: {
          ...where,
          isRead: false,
        },
      }),
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit,
        include: {
          account: {
            select: {
              walletAddress: true,
            },
          },
        },
      }),
    ]);

    const notificationResponses = notifications.map(toNotificationResponse);

    return {
      notifications: notificationResponses,
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
  walletAddress?: string
): Promise<Notification> => {
  try {
    console.log(
      `${LOG_PREFIX} Marking notification read:`,
      request.params.notificationId
    );

    // Get notification with account info
    const notification = await prisma.notification.findUnique({
      where: { id: request.params.notificationId },
      include: {
        account: {
          select: {
            walletAddress: true,
          },
        },
      },
    });

    if (!notification) {
      throw new ApiError(404, 'Notification not found');
    }

    // Verify ownership if walletAddress provided
    if (walletAddress && notification.account.walletAddress !== walletAddress) {
      throw new ApiError(403, 'Not authorized to modify this notification');
    }

    // Update notification
    const updatedNotification = await prisma.notification.update({
      where: { id: request.params.notificationId },
      data: {
        isRead: request.body.read,
        readAt: request.body.read ? new Date() : null,
        updatedAt: new Date(),
      },
      include: {
        account: {
          select: {
            walletAddress: true,
          },
        },
      },
    });

    return toNotificationResponse(updatedNotification);
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
  walletAddress?: string
): Promise<number> => {
  try {
    console.log(`${LOG_PREFIX} Marking all notifications read`);

    // Determine wallet address to use
    let targetWalletAddress: string;
    if (walletAddress) {
      targetWalletAddress = walletAddress;
    } else if (request.body.walletAddress) {
      targetWalletAddress = request.body.walletAddress.toLowerCase();
    } else {
      throw new ApiError(400, 'User identification required');
    }

    // Update all unread notifications for the user
    const result = await prisma.notification.updateMany({
      where: {
        account: {
          walletAddress: targetWalletAddress,
        },
        isRead: false,
      },
      data: {
        isRead: true,
        readAt: new Date(),
        updatedAt: new Date(),
      },
    });

    console.log(`${LOG_PREFIX} Marked ${result.count} notifications as read`);
    return result.count;
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
  walletAddress?: string
): Promise<boolean> => {
  try {
    console.log(
      `${LOG_PREFIX} Deleting notification:`,
      request.params.notificationId
    );

    // Get notification with account info
    const notification = await prisma.notification.findUnique({
      where: { id: request.params.notificationId },
      include: {
        account: {
          select: {
            walletAddress: true,
          },
        },
      },
    });

    if (!notification) {
      throw new ApiError(404, 'Notification not found');
    }

    // Verify ownership if walletAddress provided
    if (walletAddress && notification.account.walletAddress !== walletAddress) {
      throw new ApiError(403, 'Not authorized to delete this notification');
    }

    // Delete notification
    await prisma.notification.delete({
      where: { id: request.params.notificationId },
    });

    return true;
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

    const now = new Date();

    // Get or create accounts for all wallet addresses
    const walletAddresses = [
      ...new Set(
        request.body.notifications.map((n) => n.walletAddress.toLowerCase())
      ),
    ];

    // Upsert all accounts
    const accounts = await Promise.all(
      walletAddresses.map((walletAddress) =>
        prisma.account.upsert({
          where: { walletAddress },
          create: {
            walletAddress,
            createdAt: now,
            updatedAt: now,
          },
          update: {
            updatedAt: now,
          },
        })
      )
    );

    // Create a map of wallet address to account ID
    const walletToAccountId = new Map(
      accounts.map((account) => [account.walletAddress, account.id])
    );

    // Prepare notification data
    const notificationData = request.body.notifications.map((notification) => ({
      accountId: walletToAccountId.get(
        notification.walletAddress.toLowerCase()
      )!,
      type: mapNotificationType(notification.type),
      title: notification.title,
      message: notification.message,
      data: notification.data || null,
      isRead: false,
      createdAt: now,
      updatedAt: now,
    }));

    // Bulk create notifications
    const result = await prisma.notification.createMany({
      data: notificationData,
    });

    console.log(`${LOG_PREFIX} Created ${result.count} notifications`);
    return result.count;
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

    // Determine wallet address to use (userId is legacy, use walletAddress)
    let targetWalletAddress: string;
    if (walletAddress) {
      targetWalletAddress = walletAddress;
    } else {
      throw new ApiError(400, 'User identification required');
    }

    const where = {
      account: {
        walletAddress: targetWalletAddress,
      },
    };

    // Get total and unread counts in parallel
    const [total, unreadCount] = await Promise.all([
      prisma.notification.count({ where }),
      prisma.notification.count({
        where: {
          ...where,
          isRead: false,
        },
      }),
    ]);

    // Get count by type using groupBy
    const typeGroups = await prisma.notification.groupBy({
      by: ['type'],
      where,
      _count: {
        type: true,
      },
    });

    const byType: Record<string, number> = {};
    typeGroups.forEach((group) => {
      byType[group.type.toLowerCase()] = group._count.type;
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
