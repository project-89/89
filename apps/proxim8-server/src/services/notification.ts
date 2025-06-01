import Notification, {
  NotificationType,
  INotification,
} from "../models/Notification";
import User from "../models/User";

/**
 * Create a new notification
 */
export const createNotification = async (
  walletAddress: string,
  type: NotificationType,
  title: string,
  message: string,
  data?: Record<string, any>
): Promise<INotification> => {
  try {
    // Get user ID from wallet address
    const user = await User.findOne({ walletAddress });
    const userId = user?._id;

    // Create the notification
    const notification = new Notification({
      userId,
      walletAddress,
      type,
      title,
      message,
      data,
      read: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Save to database
    await notification.save();

    // TODO: In a real implementation, emit an event or push to a websocket
    console.log(`Created notification for ${walletAddress}: ${title}`);

    return notification;
  } catch (error) {
    console.error("Error creating notification:", error);
    throw new Error(
      `Failed to create notification: ${error instanceof Error ? error.message : String(error)}`
    );
  }
};

/**
 * Get notifications for a wallet address
 */
export const getNotifications = async (
  walletAddress: string,
  options: {
    limit?: number;
    offset?: number;
    unreadOnly?: boolean;
  } = {}
): Promise<INotification[]> => {
  const { limit = 20, offset = 0, unreadOnly = false } = options;

  try {
    // Prepare query
    const query: any = { walletAddress };

    if (unreadOnly) {
      query.read = false;
    }

    // Execute query
    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .skip(offset)
      .limit(limit);

    return notifications;
  } catch (error) {
    console.error("Error fetching notifications:", error);
    throw new Error(
      `Failed to fetch notifications: ${error instanceof Error ? error.message : String(error)}`
    );
  }
};

/**
 * Mark notifications as read
 */
export const markAsRead = async (
  notificationIds: string[],
  walletAddress: string
): Promise<number> => {
  try {
    // Update all specified notifications for this wallet address
    const result = await Notification.updateMany(
      {
        _id: { $in: notificationIds },
        walletAddress,
      },
      {
        $set: {
          read: true,
          updatedAt: new Date(),
        },
      }
    );

    return result.modifiedCount;
  } catch (error) {
    console.error("Error marking notifications as read:", error);
    throw new Error(
      `Failed to mark notifications as read: ${error instanceof Error ? error.message : String(error)}`
    );
  }
};

/**
 * Create a video completion notification
 */
export const notifyVideoCompleted = async (
  walletAddress: string,
  videoId: string,
  videoTitle: string,
  videoUrl: string
): Promise<INotification> => {
  return createNotification(
    walletAddress,
    NotificationType.VIDEO_COMPLETED,
    "Video Generation Complete",
    `Your video "${videoTitle}" has been successfully generated!`,
    {
      videoId,
      videoUrl,
    }
  );
};

/**
 * Create a lore claimed notification
 */
export const notifyLoreClaimed = async (
  walletAddress: string,
  nftId: string,
  loreTitle: string
): Promise<INotification> => {
  return createNotification(
    walletAddress,
    NotificationType.LORE_CLAIMED,
    "Lore Claimed",
    `You've successfully claimed the lore "${loreTitle}" for your NFT!`,
    {
      nftId,
      loreTitle,
    }
  );
};

/**
 * Create a system notification
 */
export const notifySystem = async (
  walletAddress: string,
  title: string,
  message: string,
  data?: Record<string, any>
): Promise<INotification> => {
  return createNotification(
    walletAddress,
    NotificationType.SYSTEM_NOTIFICATION,
    title,
    message,
    data
  );
};

/**
 * Get the count of unread notifications for a wallet address
 */
export const getUnreadCount = async (
  walletAddress: string
): Promise<number> => {
  try {
    // Count unread notifications
    const count = await Notification.countDocuments({
      walletAddress,
      read: false,
    });

    return count;
  } catch (error) {
    console.error("Error counting unread notifications:", error);
    throw new Error(
      `Failed to count unread notifications: ${error instanceof Error ? error.message : String(error)}`
    );
  }
};
