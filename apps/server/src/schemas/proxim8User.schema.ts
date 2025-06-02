import { z } from 'zod';
import {
  AccountIdSchema,
  PaginationParamsSchema,
  TimestampSchema,
  WalletAddressSchema,
} from './common.schema';
import { SocialMediaSchema, UserPreferencesSchema } from './proxim8.schema';

// Base Proxim8 User Schema
export const Proxim8UserSchema = z.object({
  id: AccountIdSchema,
  walletAddress: WalletAddressSchema,
  username: z.string().min(3).max(30).optional(),
  profileImage: z.string().url().optional(),
  bio: z.string().max(500).optional(),
  social: SocialMediaSchema.optional(),
  preferences: UserPreferencesSchema,
  createdAt: TimestampSchema,
  updatedAt: TimestampSchema,
});

// Request Schemas
export const CreateProxim8UserRequestSchema = z.object({
  body: z.object({
    walletAddress: WalletAddressSchema,
    username: z.string().min(3).max(30).optional(),
    profileImage: z.string().url().optional(),
    bio: z.string().max(500).optional(),
    social: SocialMediaSchema.optional(),
    preferences: UserPreferencesSchema.optional(),
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
});

export const UpdateProxim8UserRequestSchema = z.object({
  params: z.object({
    userId: AccountIdSchema,
  }),
  body: z.object({
    username: z.string().min(3).max(30).optional(),
    profileImage: z.string().url().optional(),
    bio: z.string().max(500).optional(),
    social: SocialMediaSchema.optional(),
    preferences: UserPreferencesSchema.partial().optional(),
  }),
  query: z.object({}).optional(),
});

export const GetProxim8UserRequestSchema = z.object({
  params: z.object({
    userId: AccountIdSchema,
  }),
  query: z.object({}).optional(),
  body: z.object({}).optional(),
});

export const GetProxim8UserByWalletRequestSchema = z.object({
  params: z.object({
    walletAddress: WalletAddressSchema,
  }),
  query: z.object({}).optional(),
  body: z.object({}).optional(),
});

export const GetProxim8UsersRequestSchema = z.object({
  params: z.object({}).optional(),
  query: PaginationParamsSchema.extend({
    username: z.string().optional(),
    walletAddress: WalletAddressSchema.optional(),
  }),
  body: z.object({}).optional(),
});

export const DeleteProxim8UserRequestSchema = z.object({
  params: z.object({
    userId: AccountIdSchema,
  }),
  query: z.object({}).optional(),
  body: z.object({}).optional(),
});

export const CheckUsernameAvailabilityRequestSchema = z.object({
  params: z.object({}).optional(),
  query: z.object({
    username: z.string().min(3).max(30),
  }),
  body: z.object({}).optional(),
});

// Response Schemas
export const Proxim8UserResponseSchema = Proxim8UserSchema.extend({
  createdAt: z.number(),
  updatedAt: z.number(),
});

export const Proxim8UserListResponseSchema = z.object({
  users: z.array(Proxim8UserResponseSchema),
  total: z.number(),
  hasMore: z.boolean(),
});

export const UsernameAvailabilityResponseSchema = z.object({
  username: z.string(),
  available: z.boolean(),
  suggestions: z.array(z.string()).optional(),
});

// Database Document Schema (for MongoDB native operations)
export const Proxim8UserDocumentSchema = Proxim8UserSchema.extend({
  _id: z.any().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Transform function for converting MongoDB documents to API types
export function toProxim8User(doc: any, id: string): Proxim8User {
  const toTimestamp = (date: Date | number) => {
    if (date instanceof Date) {
      return date.getTime();
    }
    return typeof date === 'number' ? date : new Date(date).getTime();
  };

  return Proxim8UserResponseSchema.parse({
    id,
    walletAddress: doc.walletAddress,
    username: doc.username,
    profileImage: doc.profileImage,
    bio: doc.bio,
    social: doc.social,
    preferences: doc.preferences || {
      emailNotifications: true,
      darkMode: false,
      showInGallery: true,
      pipelineOptions: {},
    },
    createdAt: toTimestamp(doc.createdAt),
    updatedAt: toTimestamp(doc.updatedAt),
  });
}

// Type exports
export type Proxim8User = z.infer<typeof Proxim8UserResponseSchema>;
export type Proxim8UserDocument = z.infer<typeof Proxim8UserDocumentSchema>;
export type CreateProxim8UserRequest = z.infer<
  typeof CreateProxim8UserRequestSchema
>;
export type UpdateProxim8UserRequest = z.infer<
  typeof UpdateProxim8UserRequestSchema
>;
export type GetProxim8UserRequest = z.infer<typeof GetProxim8UserRequestSchema>;
export type GetProxim8UserByWalletRequest = z.infer<
  typeof GetProxim8UserByWalletRequestSchema
>;
export type GetProxim8UsersRequest = z.infer<
  typeof GetProxim8UsersRequestSchema
>;
export type DeleteProxim8UserRequest = z.infer<
  typeof DeleteProxim8UserRequestSchema
>;
export type CheckUsernameAvailabilityRequest = z.infer<
  typeof CheckUsernameAvailabilityRequestSchema
>;
export type Proxim8UserListResponse = z.infer<
  typeof Proxim8UserListResponseSchema
>;
export type UsernameAvailabilityResponse = z.infer<
  typeof UsernameAvailabilityResponseSchema
>;
