import { z } from 'zod';
import { ERROR_MESSAGES } from '../constants';
import {
  AccountIdSchema,
  PaginationParamsSchema,
  TimestampSchema,
  WalletAddressSchema,
} from './common.schema';
import { NotificationTypeSchema } from './proxim8.schema';

// Base Notification Schema
export const NotificationSchema = z.object({
  id: AccountIdSchema,
  userId: AccountIdSchema.optional(),
  walletAddress: WalletAddressSchema,
  type: NotificationTypeSchema,
  title: z.string().min(1, ERROR_MESSAGES.INVALID_INPUT),
  message: z.string().min(1, ERROR_MESSAGES.INVALID_INPUT),
  read: z.boolean().default(false),
  data: z.record(z.any()).optional(),
  createdAt: TimestampSchema,
  updatedAt: TimestampSchema,
});

// Request Schemas
export const CreateNotificationRequestSchema = z.object({
  body: z.object({
    userId: AccountIdSchema.optional(),
    walletAddress: WalletAddressSchema,
    type: NotificationTypeSchema,
    title: z.string().min(1, ERROR_MESSAGES.INVALID_INPUT),
    message: z.string().min(1, ERROR_MESSAGES.INVALID_INPUT),
    data: z.record(z.any()).optional(),
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
});

export const GetNotificationRequestSchema = z.object({
  params: z.object({
    notificationId: AccountIdSchema,
  }),
  query: z.object({}).optional(),
  body: z.object({}).optional(),
});

export const GetUserNotificationsRequestSchema = z.object({
  params: z.object({}).optional(),
  query: PaginationParamsSchema.extend({
    read: z.boolean().optional(),
    type: NotificationTypeSchema.optional(),
    userId: AccountIdSchema.optional(),
    walletAddress: WalletAddressSchema.optional(),
  }),
  body: z.object({}).optional(),
});

export const MarkNotificationReadRequestSchema = z.object({
  params: z.object({
    notificationId: AccountIdSchema,
  }),
  body: z.object({
    read: z.boolean().default(true),
  }),
  query: z.object({}).optional(),
});

export const MarkAllNotificationsReadRequestSchema = z.object({
  params: z.object({}).optional(),
  body: z.object({
    walletAddress: WalletAddressSchema.optional(),
    userId: AccountIdSchema.optional(),
  }),
  query: z.object({}).optional(),
});

export const DeleteNotificationRequestSchema = z.object({
  params: z.object({
    notificationId: AccountIdSchema,
  }),
  query: z.object({}).optional(),
  body: z.object({}).optional(),
});

export const BulkCreateNotificationsRequestSchema = z.object({
  body: z.object({
    notifications: z.array(
      z.object({
        userId: AccountIdSchema.optional(),
        walletAddress: WalletAddressSchema,
        type: NotificationTypeSchema,
        title: z.string().min(1, ERROR_MESSAGES.INVALID_INPUT),
        message: z.string().min(1, ERROR_MESSAGES.INVALID_INPUT),
        data: z.record(z.any()).optional(),
      })
    ),
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
});

// Response Schemas
export const NotificationResponseSchema = NotificationSchema.extend({
  createdAt: z.number(),
  updatedAt: z.number(),
});

export const NotificationListResponseSchema = z.object({
  notifications: z.array(NotificationResponseSchema),
  total: z.number(),
  unreadCount: z.number(),
  hasMore: z.boolean(),
});

export const NotificationStatsResponseSchema = z.object({
  total: z.number(),
  unreadCount: z.number(),
  byType: z.record(z.number()),
});

// Database Document Schema (for MongoDB native operations)
export const NotificationDocumentSchema = NotificationSchema.extend({
  _id: z.any().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Transform function for converting MongoDB documents to API types
export function toNotification(doc: any, id: string): Notification {
  const toTimestamp = (date: Date | number) => {
    if (date instanceof Date) {
      return date.getTime();
    }
    return typeof date === 'number' ? date : new Date(date).getTime();
  };

  return NotificationResponseSchema.parse({
    id,
    userId: doc.userId,
    walletAddress: doc.walletAddress,
    type: doc.type,
    title: doc.title,
    message: doc.message,
    read: doc.read || false,
    data: doc.data,
    createdAt: toTimestamp(doc.createdAt),
    updatedAt: toTimestamp(doc.updatedAt),
  });
}

// Type exports
export type Notification = z.infer<typeof NotificationResponseSchema>;
export type NotificationDocument = z.infer<typeof NotificationDocumentSchema>;
export type CreateNotificationRequest = z.infer<
  typeof CreateNotificationRequestSchema
>;
export type GetNotificationRequest = z.infer<
  typeof GetNotificationRequestSchema
>;
export type GetUserNotificationsRequest = z.infer<
  typeof GetUserNotificationsRequestSchema
>;
export type MarkNotificationReadRequest = z.infer<
  typeof MarkNotificationReadRequestSchema
>;
export type MarkAllNotificationsReadRequest = z.infer<
  typeof MarkAllNotificationsReadRequestSchema
>;
export type DeleteNotificationRequest = z.infer<
  typeof DeleteNotificationRequestSchema
>;
export type BulkCreateNotificationsRequest = z.infer<
  typeof BulkCreateNotificationsRequestSchema
>;
export type NotificationListResponse = z.infer<
  typeof NotificationListResponseSchema
>;
export type NotificationStatsResponse = z.infer<
  typeof NotificationStatsResponseSchema
>;
