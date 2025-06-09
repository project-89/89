import mongoose, { Schema, Document } from "mongoose";

export enum NotificationType {
  VIDEO_COMPLETED = "video_completed",
  LORE_CLAIMED = "lore_claimed",
  COMMENT_RECEIVED = "comment_received",
  SYSTEM_NOTIFICATION = "system_notification",
}

export interface INotification extends Document {
  userId: string;
  walletAddress: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  data?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema: Schema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "User" },
  walletAddress: { type: String, required: true, index: true },
  type: {
    type: String,
    required: true,
    enum: Object.values(NotificationType),
  },
  title: { type: String, required: true },
  message: { type: String, required: true },
  read: { type: Boolean, default: false },
  data: { type: Schema.Types.Mixed },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Create indexes
NotificationSchema.index({ walletAddress: 1, createdAt: -1 });
NotificationSchema.index({ userId: 1, createdAt: -1 });

export default mongoose.model<INotification>(
  "Notification",
  NotificationSchema
);
