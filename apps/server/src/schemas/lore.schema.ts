import { z } from 'zod';
import { ERROR_MESSAGES } from '../constants';
import {
  AccountIdSchema,
  PaginationParamsSchema,
  TimestampSchema,
  WalletAddressSchema,
} from './common.schema';
import { ProximNftIdSchema } from './proxim8.schema';

// Base Lore Schema
export const LoreSchema = z.object({
  id: AccountIdSchema,
  nftId: ProximNftIdSchema,
  title: z.string().min(1, ERROR_MESSAGES.INVALID_INPUT),
  content: z.string().min(1, ERROR_MESSAGES.INVALID_INPUT),
  background: z.string().min(1, ERROR_MESSAGES.INVALID_INPUT),
  traits: z.record(z.string()).default({}),
  claimed: z.boolean().default(false),
  claimedBy: WalletAddressSchema.optional(),
  claimedAt: TimestampSchema.optional(),
  createdAt: TimestampSchema,
  updatedAt: TimestampSchema,
});

// Request Schemas
export const CreateLoreRequestSchema = z.object({
  body: z.object({
    nftId: ProximNftIdSchema,
    title: z.string().min(1, ERROR_MESSAGES.INVALID_INPUT),
    content: z.string().min(1, ERROR_MESSAGES.INVALID_INPUT),
    background: z.string().min(1, ERROR_MESSAGES.INVALID_INPUT),
    traits: z.record(z.string()).optional(),
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
});

export const GetLoreRequestSchema = z.object({
  params: z.object({
    loreId: AccountIdSchema,
  }),
  query: z.object({}).optional(),
  body: z.object({}).optional(),
});

export const GetLoreByNftRequestSchema = z.object({
  params: z.object({
    nftId: ProximNftIdSchema,
  }),
  query: z.object({}).optional(),
  body: z.object({}).optional(),
});

export const GetLoreListRequestSchema = z.object({
  params: z.object({}).optional(),
  query: PaginationParamsSchema.extend({
    claimed: z.boolean().optional(),
    claimedBy: WalletAddressSchema.optional(),
    nftId: ProximNftIdSchema.optional(),
  }),
  body: z.object({}).optional(),
});

export const ClaimLoreRequestSchema = z.object({
  params: z.object({
    loreId: AccountIdSchema,
  }),
  body: z.object({
    walletAddress: WalletAddressSchema,
  }),
  query: z.object({}).optional(),
});

export const UpdateLoreRequestSchema = z.object({
  params: z.object({
    loreId: AccountIdSchema,
  }),
  body: z.object({
    title: z.string().min(1, ERROR_MESSAGES.INVALID_INPUT).optional(),
    content: z.string().min(1, ERROR_MESSAGES.INVALID_INPUT).optional(),
    background: z.string().min(1, ERROR_MESSAGES.INVALID_INPUT).optional(),
    traits: z.record(z.string()).optional(),
  }),
  query: z.object({}).optional(),
});

export const DeleteLoreRequestSchema = z.object({
  params: z.object({
    loreId: AccountIdSchema,
  }),
  query: z.object({}).optional(),
  body: z.object({}).optional(),
});

export const GetUnclaimedLoreRequestSchema = z.object({
  params: z.object({}).optional(),
  query: PaginationParamsSchema.extend({
    walletAddress: WalletAddressSchema.optional(),
  }),
  body: z.object({}).optional(),
});

export const GetClaimedLoreRequestSchema = z.object({
  params: z.object({}).optional(),
  query: PaginationParamsSchema.extend({
    walletAddress: WalletAddressSchema,
  }),
  body: z.object({}).optional(),
});

// Response Schemas
export const LoreResponseSchema = LoreSchema.extend({
  createdAt: z.number(),
  updatedAt: z.number(),
  claimedAt: z.number().optional(),
});

export const LoreListResponseSchema = z.object({
  lore: z.array(LoreResponseSchema),
  total: z.number(),
  hasMore: z.boolean(),
});

export const LoreStatsResponseSchema = z.object({
  total: z.number(),
  claimed: z.number(),
  unclaimed: z.number(),
  claimedByUser: z.number().optional(),
});

export const ClaimLoreResponseSchema = z.object({
  lore: LoreResponseSchema,
  reward: z
    .object({
      type: z.string(),
      amount: z.number(),
      description: z.string(),
    })
    .optional(),
});

// Database Document Schema (for MongoDB native operations)
export const LoreDocumentSchema = LoreSchema.extend({
  _id: z.any().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
  claimedAt: z.date().optional(),
});

// Transform function for converting MongoDB documents to API types
export function toLore(doc: any, id: string): Lore {
  const toTimestamp = (date: Date | number | undefined) => {
    if (!date) return undefined;
    if (date instanceof Date) {
      return date.getTime();
    }
    return typeof date === 'number' ? date : new Date(date).getTime();
  };

  return LoreResponseSchema.parse({
    id,
    nftId: doc.nftId,
    title: doc.title,
    content: doc.content,
    background: doc.background,
    traits: doc.traits || {},
    claimed: doc.claimed || false,
    claimedBy: doc.claimedBy,
    claimedAt: toTimestamp(doc.claimedAt),
    createdAt: toTimestamp(doc.createdAt)!,
    updatedAt: toTimestamp(doc.updatedAt)!,
  });
}

// Type exports
export type Lore = z.infer<typeof LoreResponseSchema>;
export type LoreDocument = z.infer<typeof LoreDocumentSchema>;
export type CreateLoreRequest = z.infer<typeof CreateLoreRequestSchema>;
export type GetLoreRequest = z.infer<typeof GetLoreRequestSchema>;
export type GetLoreByNftRequest = z.infer<typeof GetLoreByNftRequestSchema>;
export type GetLoreListRequest = z.infer<typeof GetLoreListRequestSchema>;
export type ClaimLoreRequest = z.infer<typeof ClaimLoreRequestSchema>;
export type UpdateLoreRequest = z.infer<typeof UpdateLoreRequestSchema>;
export type DeleteLoreRequest = z.infer<typeof DeleteLoreRequestSchema>;
export type GetUnclaimedLoreRequest = z.infer<
  typeof GetUnclaimedLoreRequestSchema
>;
export type GetClaimedLoreRequest = z.infer<typeof GetClaimedLoreRequestSchema>;
export type LoreListResponse = z.infer<typeof LoreListResponseSchema>;
export type LoreStatsResponse = z.infer<typeof LoreStatsResponseSchema>;
export type ClaimLoreResponse = z.infer<typeof ClaimLoreResponseSchema>;
