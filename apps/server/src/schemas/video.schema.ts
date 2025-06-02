import { z } from 'zod';
import { ERROR_MESSAGES } from '../constants';
import {
  AccountIdSchema,
  PaginationParamsSchema,
  TimestampSchema,
  WalletAddressSchema,
} from './common.schema';
import {
  JobIdSchema,
  PipelineTypeSchema,
  ProximNftIdSchema,
  SignedUrlSchema,
  StoragePathSchema,
  UrlExpirySchema,
  VideoStatusSchema,
} from './proxim8.schema';

// Base Video Generation Schema
export const VideoGenerationSchema = z.object({
  id: AccountIdSchema,
  jobId: JobIdSchema,
  nftId: ProximNftIdSchema,
  prompt: z.string().min(1, ERROR_MESSAGES.INVALID_INPUT),
  createdBy: WalletAddressSchema,
  status: VideoStatusSchema.default('queued'),
  pipelineType: PipelineTypeSchema.default('standard'),
  options: z.record(z.any()).optional(),

  // Storage paths
  imagePath: StoragePathSchema,
  thumbnailPath: StoragePathSchema,
  videoPath: StoragePathSchema,

  // Signed URLs
  imageUrl: SignedUrlSchema,
  imageUrlExpiry: UrlExpirySchema,
  thumbnailUrl: SignedUrlSchema,
  thumbnailUrlExpiry: UrlExpirySchema,
  videoUrl: SignedUrlSchema,
  videoUrlExpiry: UrlExpirySchema,

  // Public video fields
  isPublic: z.boolean().default(false),
  publicVideoId: z.string().optional(),

  error: z.string().optional(),
  createdAt: TimestampSchema,
  updatedAt: TimestampSchema,
});

// Request Schemas
export const GenerateVideoRequestSchema = z.object({
  body: z.object({
    nftId: ProximNftIdSchema,
    prompt: z
      .string()
      .min(1, ERROR_MESSAGES.INVALID_INPUT)
      .max(1000, 'Prompt too long'),
    pipelineType: PipelineTypeSchema.optional(),
    options: z.record(z.any()).optional(),
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
});

export const GetVideoStatusRequestSchema = z.object({
  params: z.object({
    jobId: JobIdSchema,
  }),
  query: z.object({}).optional(),
  body: z.object({}).optional(),
});

export const GetUserVideosRequestSchema = z.object({
  params: z.object({}).optional(),
  query: PaginationParamsSchema.extend({
    status: VideoStatusSchema.optional(),
    nftId: ProximNftIdSchema.optional(),
  }),
  body: z.object({}).optional(),
});

export const PublishVideoRequestSchema = z.object({
  params: z.object({
    videoId: AccountIdSchema,
  }),
  body: z.object({
    title: z
      .string()
      .min(1, ERROR_MESSAGES.INVALID_INPUT)
      .max(100, 'Title too long'),
    description: z.string().max(500, 'Description too long').optional(),
    tags: z.array(z.string()).max(10, 'Too many tags').optional(),
  }),
  query: z.object({}).optional(),
});

export const DeleteVideoRequestSchema = z.object({
  params: z.object({
    videoId: AccountIdSchema,
  }),
  query: z.object({}).optional(),
  body: z.object({}).optional(),
});

export const RefreshVideoUrlsRequestSchema = z.object({
  params: z.object({
    videoId: AccountIdSchema,
  }),
  query: z.object({}).optional(),
  body: z.object({}).optional(),
});

// Response Schemas
export const VideoGenerationResponseSchema = VideoGenerationSchema.extend({
  createdAt: z.number(),
  updatedAt: z.number(),
});

export const VideoStatusResponseSchema = z.object({
  jobId: JobIdSchema,
  status: VideoStatusSchema,
  progress: z.number().min(0).max(100).optional(),
  videoUrl: SignedUrlSchema,
  thumbnailUrl: SignedUrlSchema,
  imageUrl: SignedUrlSchema,
  error: z.string().optional(),
  estimatedTimeRemaining: z.number().optional(), // seconds
});

export const VideoListResponseSchema = z.object({
  videos: z.array(VideoGenerationResponseSchema),
  total: z.number(),
  hasMore: z.boolean(),
});

// Database Document Schema (for MongoDB native operations)
export const VideoGenerationDocumentSchema = VideoGenerationSchema.extend({
  _id: z.any().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Transform function for converting MongoDB documents to API types
export function toVideoGeneration(doc: any, id: string): VideoGeneration {
  const toTimestamp = (date: Date | number) => {
    if (date instanceof Date) {
      return date.getTime();
    }
    return typeof date === 'number' ? date : new Date(date).getTime();
  };

  return VideoGenerationResponseSchema.parse({
    id,
    jobId: doc.jobId,
    nftId: doc.nftId,
    prompt: doc.prompt,
    createdBy: doc.createdBy,
    status: doc.status,
    pipelineType: doc.pipelineType,
    options: doc.options,
    imagePath: doc.imagePath,
    thumbnailPath: doc.thumbnailPath,
    videoPath: doc.videoPath,
    imageUrl: doc.imageUrl,
    imageUrlExpiry: doc.imageUrlExpiry
      ? toTimestamp(doc.imageUrlExpiry)
      : undefined,
    thumbnailUrl: doc.thumbnailUrl,
    thumbnailUrlExpiry: doc.thumbnailUrlExpiry
      ? toTimestamp(doc.thumbnailUrlExpiry)
      : undefined,
    videoUrl: doc.videoUrl,
    videoUrlExpiry: doc.videoUrlExpiry
      ? toTimestamp(doc.videoUrlExpiry)
      : undefined,
    isPublic: doc.isPublic,
    publicVideoId: doc.publicVideoId,
    error: doc.error,
    createdAt: toTimestamp(doc.createdAt),
    updatedAt: toTimestamp(doc.updatedAt),
  });
}

// Type exports
export type VideoGeneration = z.infer<typeof VideoGenerationResponseSchema>;
export type VideoGenerationDocument = z.infer<
  typeof VideoGenerationDocumentSchema
>;
export type GenerateVideoRequest = z.infer<typeof GenerateVideoRequestSchema>;
export type GetVideoStatusRequest = z.infer<typeof GetVideoStatusRequestSchema>;
export type GetUserVideosRequest = z.infer<typeof GetUserVideosRequestSchema>;
export type PublishVideoRequest = z.infer<typeof PublishVideoRequestSchema>;
export type DeleteVideoRequest = z.infer<typeof DeleteVideoRequestSchema>;
export type RefreshVideoUrlsRequest = z.infer<
  typeof RefreshVideoUrlsRequestSchema
>;
export type VideoStatusResponse = z.infer<typeof VideoStatusResponseSchema>;
export type VideoListResponse = z.infer<typeof VideoListResponseSchema>;
