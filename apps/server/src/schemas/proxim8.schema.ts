import { z } from 'zod';
import { ERROR_MESSAGES } from '../constants';
import { TimestampSchema } from './common.schema';

// Common Proxim8 schemas
export const ProximNftIdSchema = z
  .string()
  .min(1, ERROR_MESSAGES.INVALID_INPUT);
export const JobIdSchema = z.string().uuid(ERROR_MESSAGES.INVALID_INPUT);
export const PipelineTypeSchema = z.enum([
  'standard',
  'image-only',
  'prompt-only',
  'video-only',
  'artistic',
]);

// Status enums
export const VideoStatusSchema = z.enum([
  'queued',
  'processing',
  'completed',
  'failed',
]);
export const NotificationTypeSchema = z.enum([
  'video_completed',
  'lore_claimed',
  'comment_received',
  'system_notification',
]);

// Storage and URL schemas
export const StoragePathSchema = z.string().optional();
export const SignedUrlSchema = z.string().url().optional();
export const UrlExpirySchema = TimestampSchema.optional();

// User preferences schema
export const UserPreferencesSchema = z.object({
  emailNotifications: z.boolean().default(true),
  darkMode: z.boolean().default(false),
  showInGallery: z.boolean().default(true),
  defaultPipelineId: z.string().optional(),
  pipelineOptions: z.record(z.any()).default({}),
});

// Social media schema
export const SocialMediaSchema = z.object({
  twitter: z.string().optional(),
  discord: z.string().optional(),
  website: z.string().url().optional(),
});

// Pipeline configuration schemas
export const PipelineStepSchema = z.object({
  id: z.string(),
  type: z.enum(['prompt', 'image', 'video']),
  config: z.record(z.unknown()),
});

export const PipelineOutputSchema = z.object({
  resolution: z.enum(['720p', '1080p']).default('1080p'),
  aspectRatio: z.enum(['16:9', '9:16', '1:1']).default('16:9'),
  style: z.string().default('cinematic'),
});

export const PipelineMiddlewareSchema = z.object({
  id: z.string(),
  name: z.string(),
  enabled: z.boolean().default(true),
  order: z.number(),
  options: z.record(z.any()).default({}),
});

// Export inferred types
export type ProximNftId = z.infer<typeof ProximNftIdSchema>;
export type JobId = z.infer<typeof JobIdSchema>;
export type PipelineType = z.infer<typeof PipelineTypeSchema>;
export type VideoStatus = z.infer<typeof VideoStatusSchema>;
export type NotificationType = z.infer<typeof NotificationTypeSchema>;
export type UserPreferences = z.infer<typeof UserPreferencesSchema>;
export type SocialMedia = z.infer<typeof SocialMediaSchema>;
export type PipelineStep = z.infer<typeof PipelineStepSchema>;
export type PipelineOutput = z.infer<typeof PipelineOutputSchema>;
export type PipelineMiddleware = z.infer<typeof PipelineMiddlewareSchema>;
