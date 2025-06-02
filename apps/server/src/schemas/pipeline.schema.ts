import { z } from 'zod';
import { ERROR_MESSAGES } from '../constants';
import {
  AccountIdSchema,
  PaginationParamsSchema,
  TimestampSchema,
  WalletAddressSchema,
} from './common.schema';
import {
  PipelineMiddlewareSchema,
  PipelineOutputSchema,
  PipelineStepSchema,
} from './proxim8.schema';

// Base Pipeline Configuration Schema
export const PipelineConfigSchema = z.object({
  id: AccountIdSchema,
  name: z.string().min(1, ERROR_MESSAGES.INVALID_INPUT),
  description: z.string().optional(),
  isSystem: z.boolean().default(false),
  createdBy: WalletAddressSchema.optional(),
  middlewares: z.array(PipelineMiddlewareSchema).default([]),
  defaultOptions: z.record(z.any()).default({}),
  steps: z.array(PipelineStepSchema).default([]),
  output: PipelineOutputSchema.optional(),
  createdAt: TimestampSchema,
  updatedAt: TimestampSchema,
});

// Request Schemas
export const CreatePipelineConfigRequestSchema = z.object({
  body: z.object({
    name: z.string().min(1, ERROR_MESSAGES.INVALID_INPUT),
    description: z.string().optional(),
    middlewares: z.array(PipelineMiddlewareSchema).optional(),
    defaultOptions: z.record(z.any()).optional(),
    steps: z.array(PipelineStepSchema).optional(),
    output: PipelineOutputSchema.optional(),
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
});

export const GetPipelineConfigRequestSchema = z.object({
  params: z.object({
    configId: AccountIdSchema,
  }),
  query: z.object({}).optional(),
  body: z.object({}).optional(),
});

export const GetPipelineConfigsRequestSchema = z.object({
  params: z.object({}).optional(),
  query: PaginationParamsSchema.extend({
    isSystem: z.boolean().optional(),
    createdBy: WalletAddressSchema.optional(),
    name: z.string().optional(),
  }),
  body: z.object({}).optional(),
});

export const UpdatePipelineConfigRequestSchema = z.object({
  params: z.object({
    configId: AccountIdSchema,
  }),
  body: z.object({
    name: z.string().min(1, ERROR_MESSAGES.INVALID_INPUT).optional(),
    description: z.string().optional(),
    middlewares: z.array(PipelineMiddlewareSchema).optional(),
    defaultOptions: z.record(z.any()).optional(),
    steps: z.array(PipelineStepSchema).optional(),
    output: PipelineOutputSchema.optional(),
  }),
  query: z.object({}).optional(),
});

export const DeletePipelineConfigRequestSchema = z.object({
  params: z.object({
    configId: AccountIdSchema,
  }),
  query: z.object({}).optional(),
  body: z.object({}).optional(),
});

export const ClonePipelineConfigRequestSchema = z.object({
  params: z.object({
    configId: AccountIdSchema,
  }),
  body: z.object({
    name: z.string().min(1, ERROR_MESSAGES.INVALID_INPUT),
    description: z.string().optional(),
  }),
  query: z.object({}).optional(),
});

export const ValidatePipelineConfigRequestSchema = z.object({
  body: z.object({
    middlewares: z.array(PipelineMiddlewareSchema),
    steps: z.array(PipelineStepSchema),
    output: PipelineOutputSchema.optional(),
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
});

export const GetSystemPipelineConfigsRequestSchema = z.object({
  params: z.object({}).optional(),
  query: z.object({}).optional(),
  body: z.object({}).optional(),
});

// Response Schemas
export const PipelineConfigResponseSchema = PipelineConfigSchema.extend({
  createdAt: z.number(),
  updatedAt: z.number(),
});

export const PipelineConfigListResponseSchema = z.object({
  configs: z.array(PipelineConfigResponseSchema),
  total: z.number(),
  hasMore: z.boolean(),
});

export const PipelineValidationResponseSchema = z.object({
  valid: z.boolean(),
  errors: z.array(
    z.object({
      field: z.string(),
      message: z.string(),
      code: z.string(),
    })
  ),
  warnings: z.array(
    z.object({
      field: z.string(),
      message: z.string(),
      code: z.string(),
    })
  ),
});

export const SystemPipelineConfigsResponseSchema = z.object({
  configs: z.array(PipelineConfigResponseSchema),
  defaultConfig: AccountIdSchema,
});

// Database Document Schema (for MongoDB native operations)
export const PipelineConfigDocumentSchema = PipelineConfigSchema.extend({
  _id: z.any().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Transform function for converting MongoDB documents to API types
export function toPipelineConfig(doc: any, id: string): PipelineConfig {
  const toTimestamp = (date: Date | number) => {
    if (date instanceof Date) {
      return date.getTime();
    }
    return typeof date === 'number' ? date : new Date(date).getTime();
  };

  return PipelineConfigResponseSchema.parse({
    id,
    name: doc.name,
    description: doc.description,
    isSystem: doc.isSystem || false,
    createdBy: doc.createdBy,
    middlewares: doc.middlewares || [],
    defaultOptions: doc.defaultOptions || {},
    steps: doc.steps || [],
    output: doc.output,
    createdAt: toTimestamp(doc.createdAt),
    updatedAt: toTimestamp(doc.updatedAt),
  });
}

// Helper schemas for pipeline execution
export const PipelineExecutionContextSchema = z.object({
  jobId: z.string(),
  nftId: z.string(),
  prompt: z.string(),
  options: z.record(z.any()).default({}),
  userId: z.string(),
  configId: AccountIdSchema,
});

export const PipelineExecutionResultSchema = z.object({
  success: z.boolean(),
  jobId: z.string(),
  outputs: z.object({
    imagePath: z.string().optional(),
    videoPath: z.string().optional(),
    thumbnailPath: z.string().optional(),
    metadata: z.record(z.any()).optional(),
  }),
  error: z.string().optional(),
  executionTime: z.number(),
  stepsExecuted: z.array(z.string()),
});

// Type exports
export type PipelineConfig = z.infer<typeof PipelineConfigResponseSchema>;
export type PipelineConfigDocument = z.infer<
  typeof PipelineConfigDocumentSchema
>;
export type CreatePipelineConfigRequest = z.infer<
  typeof CreatePipelineConfigRequestSchema
>;
export type GetPipelineConfigRequest = z.infer<
  typeof GetPipelineConfigRequestSchema
>;
export type GetPipelineConfigsRequest = z.infer<
  typeof GetPipelineConfigsRequestSchema
>;
export type UpdatePipelineConfigRequest = z.infer<
  typeof UpdatePipelineConfigRequestSchema
>;
export type DeletePipelineConfigRequest = z.infer<
  typeof DeletePipelineConfigRequestSchema
>;
export type ClonePipelineConfigRequest = z.infer<
  typeof ClonePipelineConfigRequestSchema
>;
export type ValidatePipelineConfigRequest = z.infer<
  typeof ValidatePipelineConfigRequestSchema
>;
export type GetSystemPipelineConfigsRequest = z.infer<
  typeof GetSystemPipelineConfigsRequestSchema
>;
export type PipelineConfigListResponse = z.infer<
  typeof PipelineConfigListResponseSchema
>;
export type PipelineValidationResponse = z.infer<
  typeof PipelineValidationResponseSchema
>;
export type SystemPipelineConfigsResponse = z.infer<
  typeof SystemPipelineConfigsResponseSchema
>;
export type PipelineExecutionContext = z.infer<
  typeof PipelineExecutionContextSchema
>;
export type PipelineExecutionResult = z.infer<
  typeof PipelineExecutionResultSchema
>;
