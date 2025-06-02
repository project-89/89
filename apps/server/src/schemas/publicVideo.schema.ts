import { z } from 'zod';
import { ERROR_MESSAGES } from '../constants';
import {
  AccountIdSchema,
  PaginationParamsSchema,
  TimestampSchema,
  WalletAddressSchema,
} from './common.schema';

// Base Public Video Schema
export const PublicVideoSchema = z.object({
  id: AccountIdSchema,
  originalVideoId: AccountIdSchema,
  ownerWallet: WalletAddressSchema,
  title: z
    .string()
    .min(1, ERROR_MESSAGES.INVALID_INPUT)
    .max(100, 'Title too long'),
  description: z.string().max(500, 'Description too long').default(''),
  tags: z.array(z.string()).max(10, 'Too many tags').default([]),
  views: z.number().default(0),
  likes: z.number().default(0),
  publishedAt: TimestampSchema,
  featuredRank: z.number().optional(),
  isActive: z.boolean().default(true),
  moderationStatus: z
    .enum(['pending', 'approved', 'rejected'])
    .default('pending'),
  moderationNotes: z.string().optional(),
  createdAt: TimestampSchema,
  updatedAt: TimestampSchema,
});

// Request Schemas
export const CreatePublicVideoRequestSchema = z.object({
  body: z.object({
    originalVideoId: AccountIdSchema,
    title: z
      .string()
      .min(1, ERROR_MESSAGES.INVALID_INPUT)
      .max(100, 'Title too long'),
    description: z.string().max(500, 'Description too long').optional(),
    tags: z.array(z.string()).max(10, 'Too many tags').optional(),
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
});

export const GetPublicVideoRequestSchema = z.object({
  params: z.object({
    videoId: AccountIdSchema,
  }),
  query: z.object({}).optional(),
  body: z.object({}).optional(),
});

export const GetPublicVideosRequestSchema = z.object({
  params: z.object({}).optional(),
  query: PaginationParamsSchema.extend({
    ownerWallet: WalletAddressSchema.optional(),
    tag: z.string().optional(),
    sortBy: z
      .enum(['views', 'likes', 'publishedAt', 'featuredRank'])
      .default('publishedAt'),
    sortOrder: z.enum(['asc', 'desc']).default('desc'),
    moderationStatus: z.enum(['pending', 'approved', 'rejected']).optional(),
    featured: z.boolean().optional(),
  }),
  body: z.object({}).optional(),
});

export const UpdatePublicVideoRequestSchema = z.object({
  params: z.object({
    videoId: AccountIdSchema,
  }),
  body: z.object({
    title: z
      .string()
      .min(1, ERROR_MESSAGES.INVALID_INPUT)
      .max(100, 'Title too long')
      .optional(),
    description: z.string().max(500, 'Description too long').optional(),
    tags: z.array(z.string()).max(10, 'Too many tags').optional(),
  }),
  query: z.object({}).optional(),
});

export const DeletePublicVideoRequestSchema = z.object({
  params: z.object({
    videoId: AccountIdSchema,
  }),
  query: z.object({}).optional(),
  body: z.object({}).optional(),
});

export const LikePublicVideoRequestSchema = z.object({
  params: z.object({
    videoId: AccountIdSchema,
  }),
  body: z.object({
    like: z.boolean().default(true),
  }),
  query: z.object({}).optional(),
});

export const IncrementViewsRequestSchema = z.object({
  params: z.object({
    videoId: AccountIdSchema,
  }),
  body: z.object({
    viewerWallet: WalletAddressSchema.optional(),
  }),
  query: z.object({}).optional(),
});

export const GetFeaturedVideosRequestSchema = z.object({
  params: z.object({}).optional(),
  query: PaginationParamsSchema.extend({
    tag: z.string().optional(),
  }),
  body: z.object({}).optional(),
});

export const GetUserPublicVideosRequestSchema = z.object({
  params: z.object({
    walletAddress: WalletAddressSchema,
  }),
  query: PaginationParamsSchema.extend({
    tag: z.string().optional(),
    sortBy: z.enum(['views', 'likes', 'publishedAt']).default('publishedAt'),
    sortOrder: z.enum(['asc', 'desc']).default('desc'),
  }),
  body: z.object({}).optional(),
});

export const ModeratePublicVideoRequestSchema = z.object({
  params: z.object({
    videoId: AccountIdSchema,
  }),
  body: z.object({
    status: z.enum(['approved', 'rejected']),
    notes: z.string().optional(),
    featuredRank: z.number().optional(),
  }),
  query: z.object({}).optional(),
});

export const SearchPublicVideosRequestSchema = z.object({
  params: z.object({}).optional(),
  query: PaginationParamsSchema.extend({
    q: z.string().min(1, 'Search query required'),
    tag: z.string().optional(),
    ownerWallet: WalletAddressSchema.optional(),
  }),
  body: z.object({}).optional(),
});

// Response Schemas
export const PublicVideoResponseSchema = PublicVideoSchema.extend({
  createdAt: z.number(),
  updatedAt: z.number(),
  publishedAt: z.number(),
});

export const PublicVideoListResponseSchema = z.object({
  videos: z.array(PublicVideoResponseSchema),
  total: z.number(),
  hasMore: z.boolean(),
});

export const PublicVideoStatsResponseSchema = z.object({
  totalVideos: z.number(),
  totalViews: z.number(),
  totalLikes: z.number(),
  topTags: z.array(
    z.object({
      tag: z.string(),
      count: z.number(),
    })
  ),
  featuredCount: z.number(),
});

export const VideoEngagementResponseSchema = z.object({
  videoId: AccountIdSchema,
  views: z.number(),
  likes: z.number(),
  userLiked: z.boolean().optional(),
});

// Database Document Schema (for MongoDB native operations)
export const PublicVideoDocumentSchema = PublicVideoSchema.extend({
  _id: z.any().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
  publishedAt: z.date(),
});

// Transform function for converting MongoDB documents to API types
export function toPublicVideo(doc: any, id: string): PublicVideo {
  const toTimestamp = (date: Date | number) => {
    if (date instanceof Date) {
      return date.getTime();
    }
    return typeof date === 'number' ? date : new Date(date).getTime();
  };

  return PublicVideoResponseSchema.parse({
    id,
    originalVideoId: doc.originalVideoId,
    ownerWallet: doc.ownerWallet,
    title: doc.title,
    description: doc.description || '',
    tags: doc.tags || [],
    views: doc.views || 0,
    likes: doc.likes || 0,
    publishedAt: toTimestamp(doc.publishedAt),
    featuredRank: doc.featuredRank,
    isActive: doc.isActive !== undefined ? doc.isActive : true,
    moderationStatus: doc.moderationStatus || 'pending',
    moderationNotes: doc.moderationNotes,
    createdAt: toTimestamp(doc.createdAt),
    updatedAt: toTimestamp(doc.updatedAt),
  });
}

// Type exports
export type PublicVideo = z.infer<typeof PublicVideoResponseSchema>;
export type PublicVideoDocument = z.infer<typeof PublicVideoDocumentSchema>;
export type CreatePublicVideoRequest = z.infer<
  typeof CreatePublicVideoRequestSchema
>;
export type GetPublicVideoRequest = z.infer<typeof GetPublicVideoRequestSchema>;
export type GetPublicVideosRequest = z.infer<
  typeof GetPublicVideosRequestSchema
>;
export type UpdatePublicVideoRequest = z.infer<
  typeof UpdatePublicVideoRequestSchema
>;
export type DeletePublicVideoRequest = z.infer<
  typeof DeletePublicVideoRequestSchema
>;
export type LikePublicVideoRequest = z.infer<
  typeof LikePublicVideoRequestSchema
>;
export type IncrementViewsRequest = z.infer<typeof IncrementViewsRequestSchema>;
export type GetFeaturedVideosRequest = z.infer<
  typeof GetFeaturedVideosRequestSchema
>;
export type GetUserPublicVideosRequest = z.infer<
  typeof GetUserPublicVideosRequestSchema
>;
export type ModeratePublicVideoRequest = z.infer<
  typeof ModeratePublicVideoRequestSchema
>;
export type SearchPublicVideosRequest = z.infer<
  typeof SearchPublicVideosRequestSchema
>;
export type PublicVideoListResponse = z.infer<
  typeof PublicVideoListResponseSchema
>;
export type PublicVideoStatsResponse = z.infer<
  typeof PublicVideoStatsResponseSchema
>;
export type VideoEngagementResponse = z.infer<
  typeof VideoEngagementResponseSchema
>;
