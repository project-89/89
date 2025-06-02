import { z } from 'zod';
import {
  AccountIdSchema,
  PaginationParamsSchema,
  TimestampSchema,
  WalletAddressSchema,
} from './common.schema';
import { ProximNftIdSchema } from './proxim8.schema';

// NFT Metadata Schema
export const NftMetadataSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  image: z.string().url(),
  attributes: z
    .array(
      z.object({
        trait_type: z.string(),
        value: z.union([z.string(), z.number()]),
      })
    )
    .optional(),
  collection: z
    .object({
      name: z.string(),
      family: z.string().optional(),
    })
    .optional(),
  properties: z
    .object({
      category: z.string().optional(),
      creators: z
        .array(
          z.object({
            address: WalletAddressSchema,
            share: z.number(),
          })
        )
        .optional(),
    })
    .optional(),
});

// NFT Ownership Schema
export const NftOwnershipSchema = z.object({
  id: AccountIdSchema,
  nftId: ProximNftIdSchema,
  ownerWallet: WalletAddressSchema,
  tokenAddress: z.string(),
  tokenId: z.string(),
  blockchain: z.enum(['solana', 'ethereum', 'polygon']).default('solana'),
  metadata: NftMetadataSchema.optional(),
  lastVerified: TimestampSchema,
  isValid: z.boolean().default(true),
  createdAt: TimestampSchema,
  updatedAt: TimestampSchema,
});

// Request Schemas
export const VerifyNftOwnershipRequestSchema = z.object({
  body: z.object({
    nftId: ProximNftIdSchema,
    walletAddress: WalletAddressSchema,
    tokenAddress: z.string().optional(),
    tokenId: z.string().optional(),
    blockchain: z.enum(['solana', 'ethereum', 'polygon']).optional(),
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
});

export const GetNftOwnershipRequestSchema = z.object({
  params: z.object({
    nftId: ProximNftIdSchema,
  }),
  query: z.object({}).optional(),
  body: z.object({}).optional(),
});

export const GetUserNftsRequestSchema = z.object({
  params: z.object({
    walletAddress: WalletAddressSchema,
  }),
  query: PaginationParamsSchema.extend({
    blockchain: z.enum(['solana', 'ethereum', 'polygon']).optional(),
    collection: z.string().optional(),
    verified: z.boolean().optional(),
  }),
  body: z.object({}).optional(),
});

export const RefreshNftMetadataRequestSchema = z.object({
  params: z.object({
    nftId: ProximNftIdSchema,
  }),
  query: z.object({}).optional(),
  body: z.object({}).optional(),
});

export const BulkVerifyNftsRequestSchema = z.object({
  body: z.object({
    nfts: z.array(
      z.object({
        nftId: ProximNftIdSchema,
        walletAddress: WalletAddressSchema,
        tokenAddress: z.string().optional(),
        tokenId: z.string().optional(),
        blockchain: z.enum(['solana', 'ethereum', 'polygon']).optional(),
      })
    ),
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
});

export const GetNftsByCollectionRequestSchema = z.object({
  params: z.object({
    collectionName: z.string(),
  }),
  query: PaginationParamsSchema.extend({
    ownerWallet: WalletAddressSchema.optional(),
    verified: z.boolean().optional(),
  }),
  body: z.object({}).optional(),
});

export const CheckNftAccessRequestSchema = z.object({
  body: z.object({
    nftId: ProximNftIdSchema,
    walletAddress: WalletAddressSchema,
    action: z.enum(['video_generation', 'lore_claim', 'public_share']),
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
});

// Response Schemas
export const NftOwnershipResponseSchema = NftOwnershipSchema.extend({
  createdAt: z.number(),
  updatedAt: z.number(),
  lastVerified: z.number(),
});

export const NftVerificationResponseSchema = z.object({
  nftId: ProximNftIdSchema,
  ownerWallet: WalletAddressSchema,
  isOwner: z.boolean(),
  metadata: NftMetadataSchema.optional(),
  lastVerified: z.number(),
  verificationDetails: z.object({
    method: z.string(),
    blockchain: z.string(),
    tokenAddress: z.string().optional(),
    tokenId: z.string().optional(),
  }),
});

export const NftListResponseSchema = z.object({
  nfts: z.array(NftOwnershipResponseSchema),
  total: z.number(),
  hasMore: z.boolean(),
});

export const BulkVerificationResponseSchema = z.object({
  results: z.array(
    z.object({
      nftId: ProximNftIdSchema,
      success: z.boolean(),
      isOwner: z.boolean().optional(),
      error: z.string().optional(),
    })
  ),
  summary: z.object({
    total: z.number(),
    verified: z.number(),
    failed: z.number(),
  }),
});

export const NftAccessResponseSchema = z.object({
  nftId: ProximNftIdSchema,
  walletAddress: WalletAddressSchema,
  hasAccess: z.boolean(),
  action: z.string(),
  reason: z.string().optional(),
  metadata: z
    .object({
      collection: z.string().optional(),
      traits: z.record(z.string()).optional(),
    })
    .optional(),
});

export const NftStatsResponseSchema = z.object({
  totalNfts: z.number(),
  verifiedNfts: z.number(),
  uniqueOwners: z.number(),
  topCollections: z.array(
    z.object({
      name: z.string(),
      count: z.number(),
    })
  ),
  blockchainDistribution: z.record(z.number()),
});

// Database Document Schema (for MongoDB native operations)
export const NftOwnershipDocumentSchema = NftOwnershipSchema.extend({
  _id: z.any().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
  lastVerified: z.date(),
});

// Transform function for converting MongoDB documents to API types
export function toNftOwnership(doc: any, id: string): NftOwnership {
  const toTimestamp = (date: Date | number) => {
    if (date instanceof Date) {
      return date.getTime();
    }
    return typeof date === 'number' ? date : new Date(date).getTime();
  };

  return NftOwnershipResponseSchema.parse({
    id,
    nftId: doc.nftId,
    ownerWallet: doc.ownerWallet,
    tokenAddress: doc.tokenAddress,
    tokenId: doc.tokenId,
    blockchain: doc.blockchain || 'solana',
    metadata: doc.metadata,
    lastVerified: toTimestamp(doc.lastVerified),
    isValid: doc.isValid !== undefined ? doc.isValid : true,
    createdAt: toTimestamp(doc.createdAt),
    updatedAt: toTimestamp(doc.updatedAt),
  });
}

// Type exports
export type NftMetadata = z.infer<typeof NftMetadataSchema>;
export type NftOwnership = z.infer<typeof NftOwnershipResponseSchema>;
export type NftOwnershipDocument = z.infer<typeof NftOwnershipDocumentSchema>;
export type VerifyNftOwnershipRequest = z.infer<
  typeof VerifyNftOwnershipRequestSchema
>;
export type GetNftOwnershipRequest = z.infer<
  typeof GetNftOwnershipRequestSchema
>;
export type GetUserNftsRequest = z.infer<typeof GetUserNftsRequestSchema>;
export type RefreshNftMetadataRequest = z.infer<
  typeof RefreshNftMetadataRequestSchema
>;
export type BulkVerifyNftsRequest = z.infer<typeof BulkVerifyNftsRequestSchema>;
export type GetNftsByCollectionRequest = z.infer<
  typeof GetNftsByCollectionRequestSchema
>;
export type CheckNftAccessRequest = z.infer<typeof CheckNftAccessRequestSchema>;
export type NftVerificationResponse = z.infer<
  typeof NftVerificationResponseSchema
>;
export type NftListResponse = z.infer<typeof NftListResponseSchema>;
export type BulkVerificationResponse = z.infer<
  typeof BulkVerificationResponseSchema
>;
export type NftAccessResponse = z.infer<typeof NftAccessResponseSchema>;
export type NftStatsResponse = z.infer<typeof NftStatsResponseSchema>;
