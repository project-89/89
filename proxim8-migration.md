# Proxim8 Server Migration Plan

## Overview
This document provides detailed step-by-step instructions for migrating the `proxim8-server` into the core server architecture documented in `core-server.md`. The migration will follow established patterns for type safety, validation, unified responses, and consistent file organization.

## Pre-Migration Analysis

### Current Proxim8 Server Structure
```
proxim8-server/src/
├── config/              # Configuration (needs refactoring)
├── controllers/         # Business logic (maps to endpoints + services)
├── middleware/          # Express middleware (needs alignment)
├── models/              # Mongoose models (needs Zod schema conversion)
├── routes/              # Express routes (needs restructuring)
├── services/            # Business services (needs organization)
├── types/               # TypeScript types (needs Zod integration)
├── utils/               # Utilities (needs alignment)
├── db.ts               # Database connection (needs integration)
└── index.ts            # Server entry (needs restructuring)
```

### Domains Identified in Proxim8
1. **Video** - Video generation, status, publishing
2. **NFT** - NFT validation and ownership
3. **Lore** - Game lore and rewards
4. **Auth** - Authentication and authorization
5. **Notification** - User notifications
6. **Pipeline** - Video processing pipelines
7. **User** - User management
8. **PublicVideo** - Public video sharing

## Migration Steps

### Phase 1: Schema Creation and Type System

#### Step 1.1: Create Zod Schemas
Create schema files in `apps/server/src/schemas/` following the established pattern:

**Files to create:**
- `proxim8.schema.ts` - Common proxim8-specific schemas
- `video.schema.ts` - Video generation and management
- `nft.schema.ts` - NFT validation and ownership  
- `lore.schema.ts` - Game lore system
- `notification.schema.ts` - User notifications
- `pipeline.schema.ts` - Video processing pipelines
- `publicVideo.schema.ts` - Public video sharing

**Template for each schema file:**
```typescript
import { z } from 'zod';
import { AccountIdSchema, TimestampSchema } from './common.schema';

// Base schemas
export const VideoStatusSchema = z.enum(['queued', 'processing', 'completed', 'failed']);

// Main entity schema
export const VideoGenerationSchema = z.object({
  id: z.string(),
  jobId: z.string(),
  nftId: z.string(),
  prompt: z.string(),
  createdBy: AccountIdSchema,
  status: VideoStatusSchema,
  // ... other fields
  createdAt: TimestampSchema,
  updatedAt: TimestampSchema,
});

// Request schemas
export const GenerateVideoRequestSchema = z.object({
  body: z.object({
    nftId: z.string().min(1),
    prompt: z.string().min(1),
    pipelineType: z.string().optional(),
    options: z.record(z.any()).optional(),
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
});

// Response schemas
export const VideoGenerationResponseSchema = VideoGenerationSchema.extend({
  createdAt: z.number(),
  updatedAt: z.number(),
});

// Type exports
export type VideoGeneration = z.infer<typeof VideoGenerationSchema>;
export type GenerateVideoRequest = z.infer<typeof GenerateVideoRequestSchema>;
export type VideoGenerationResponse = z.infer<typeof VideoGenerationResponseSchema>;
```

#### Step 1.2: Update Schema Index
Add new schema exports to `apps/server/src/schemas/index.ts`:
```typescript
// Add at the end
export * from "./proxim8.schema";
export * from "./video.schema";
export * from "./nft.schema";
export * from "./lore.schema";
export * from "./notification.schema";
export * from "./pipeline.schema";
export * from "./publicVideo.schema";
```

### Phase 2: Service Layer Migration

#### Step 2.1: Create Service Files
Create service files in `apps/server/src/services/` following the established pattern:

**Files to create:**
- `video.service.ts` - Video generation and management
- `nft.service.ts` - NFT validation and ownership
- `lore.service.ts` - Game lore system
- `notification.service.ts` - User notifications
- `pipeline.service.ts` - Video processing pipelines
- `publicVideo.service.ts` - Public video sharing

**Migration tasks for each service:**
1. Extract business logic from controllers
2. Replace Mongoose model usage with MongoDB native operations
3. Add proper error handling with `ApiError`
4. Use unified response patterns
5. Add input validation using Zod schemas
6. Convert Mongoose documents to API types using transformation functions

**Service template:**
```typescript
import { MongoClient } from 'mongodb';
import { ApiError } from '../utils';
import { 
  VideoGeneration,
  GenerateVideoRequest,
  VideoGenerationDocument,
  toVideoGeneration 
} from '../schemas';

export const generateVideo = async (
  request: GenerateVideoRequest['body'],
  userId: string
): Promise<VideoGeneration> => {
  try {
    // Business logic here
    const document = await collection.insertOne({
      // ... document data
    });
    
    return toVideoGeneration(document, document.insertedId.toString());
  } catch (error) {
    throw ApiError.from(error, 500, 'Failed to generate video');
  }
};
```

#### Step 2.2: Update Service Index
Add service exports to `apps/server/src/services/index.ts`:
```typescript
// Add proxim8 services
export * from './video.service';
export * from './nft.service';
export * from './lore.service';
export * from './notification.service';
export * from './pipeline.service';
export * from './publicVideo.service';
```

### Phase 3: Endpoint Creation

#### Step 3.1: Create Endpoint Files
Create endpoint files in `apps/server/src/endpoints/` following the established pattern:

**Files to create:**
- `video.endpoint.ts`
- `nft.endpoint.ts`
- `lore.endpoint.ts`
- `notification.endpoint.ts`
- `pipeline.endpoint.ts`
- `publicVideo.endpoint.ts`

**Migration tasks:**
1. Convert controller functions to endpoint handlers
2. Use `sendSuccess()` and `sendError()` utilities
3. Apply proper type annotations from schemas
4. Add error handling with `ApiError`
5. Remove direct response object manipulation

**Endpoint template:**
```typescript
import { Request, Response } from 'express';
import { ApiError, sendError, sendSuccess } from '../utils';
import { GenerateVideoRequest } from '../schemas';
import { generateVideo } from '../services';
import { ERROR_MESSAGES } from '../constants';

export async function handleGenerateVideo(
  req: Request<{}, {}, GenerateVideoRequest['body']>,
  res: Response,
) {
  try {
    const video = await generateVideo(req.body, req.user.id);
    sendSuccess(res, video, 'Video generation started successfully');
  } catch (error) {
    const apiError = ApiError.from(error, 500, ERROR_MESSAGES.FAILED_TO_GENERATE_VIDEO);
    sendError(res, apiError, apiError.statusCode);
  }
}
```

#### Step 3.2: Update Endpoint Index
Add endpoint exports to `apps/server/src/endpoints/index.ts`:
```typescript
// Add proxim8 endpoints
export * from './video.endpoint';
export * from './nft.endpoint';
export * from './lore.endpoint';
export * from './notification.endpoint';
export * from './pipeline.endpoint';
export * from './publicVideo.endpoint';
```

### Phase 4: Route Creation

#### Step 4.1: Create Route Files
Create route files in `apps/server/src/routes/` following the established pattern:

**Files to create:**
- `video.routes.ts`
- `nft.routes.ts`
- `lore.routes.ts`
- `notification.routes.ts`
- `pipeline.routes.ts`
- `publicVideo.routes.ts`

**Migration tasks:**
1. Convert existing routes to use new middleware patterns
2. Apply proper middleware chains (validation, auth, rate limiting)
3. Use schema validation middleware
4. Map routes to new endpoint handlers

**Route template:**
```typescript
import { Router } from 'express';
import {
  handleGenerateVideo,
  handleGetVideoStatus,
  // ... other handlers
} from '../endpoints';
import {
  GenerateVideoRequestSchema,
  GetVideoStatusRequestSchema,
  // ... other schemas
} from '../schemas';
import { authenticatedEndpoint } from '../middleware';

const router = Router();

router.post(
  '/videos/generate',
  authenticatedEndpoint(GenerateVideoRequestSchema),
  handleGenerateVideo,
);

router.get(
  '/videos/status/:jobId',
  authenticatedEndpoint(GetVideoStatusRequestSchema),
  handleGetVideoStatus,
);

export default router;
```

#### Step 4.2: Update Route Index
Add route imports to `apps/server/src/routes/index.ts`:
```typescript
// Add proxim8 route imports
import videoRoutes from './video.routes';
import nftRoutes from './nft.routes';
import loreRoutes from './lore.routes';
import notificationRoutes from './notification.routes';
import pipelineRoutes from './pipeline.routes';
import publicVideoRoutes from './publicVideo.routes';

// Mount the new routes
router.use(videoRoutes);        // /videos/*
router.use(nftRoutes);          // /nfts/*
router.use(loreRoutes);         // /lore/*
router.use(notificationRoutes); // /notifications/*
router.use(pipelineRoutes);     // /pipelines/*
router.use(publicVideoRoutes);  // /public-videos/*
```

### Phase 5: Middleware Migration

#### Step 5.1: Migrate Custom Middleware
Create middleware files in `apps/server/src/middleware/`:

**Files to migrate:**
- `nftOwnership.middleware.ts` - NFT ownership verification
- `videoOwnership.middleware.ts` - Video ownership verification
- `apiKey.middleware.ts` - API key validation (if different from existing)

**Migration tasks:**
1. Convert to core server middleware patterns
2. Use unified error responses
3. Add proper TypeScript typing
4. Integrate with existing auth system

#### Step 5.2: Update Middleware Index
Add middleware exports to `apps/server/src/middleware/index.ts`:
```typescript
export * from './nftOwnership.middleware';
export * from './videoOwnership.middleware';
```

### Phase 6: Constants and Configuration

#### Step 6.1: Migrate Constants
Add proxim8-specific constants to appropriate directories:

**Files to create/update:**
- `apps/server/src/constants/features/proxim8.ts` - Proxim8-specific constants
- `apps/server/src/constants/http/messages.ts` - Add proxim8 error messages
- Update `apps/server/src/constants/index.ts` to export new constants

#### Step 6.2: Integrate Configuration
Merge proxim8 configuration into core server config pattern:

**Tasks:**
1. Add proxim8 environment variables to `.env` files
2. Create configuration constants following core patterns
3. Remove standalone config file
4. Integrate S3/GCP storage configuration

### Phase 7: Utility Functions

#### Step 7.1: Migrate Utilities
Move utility functions to `apps/server/src/utils/`:

**Files to migrate:**
- Storage utilities (integrate with existing patterns)
- URL management utilities
- Token rotation utilities
- Cache utilities (integrate with existing cache)

**Migration tasks:**
1. Convert to core server utility patterns
2. Add proper TypeScript typing
3. Use unified error handling
4. Remove dependencies on proxim8-specific patterns

### Phase 8: Database Integration

#### Step 8.1: Database Connection Integration
**Tasks:**
1. Remove standalone database connection (`db.ts`)
2. Integrate with existing MongoDB connection in core server
3. Add proxim8 collections to existing database utilities
4. Convert Mongoose models to MongoDB native operations

#### Step 8.2: Data Migration
**Tasks:**
1. Create migration scripts for existing data (if needed)
2. Update collection names to match core server patterns
3. Add indexes for new collections

### Phase 9: Testing and Cleanup

#### Step 9.1: Integration Testing
**Tasks:**
1. Test all migrated endpoints
2. Verify middleware chains work correctly
3. Test error handling and responses
4. Verify schema validation works

#### Step 9.2: Cleanup
**Tasks:**
1. Remove original `proxim8-server` directory
2. Update any references in other parts of the monorepo
3. Update documentation
4. Remove unused dependencies from package.json

## Detailed File-by-File Migration Guide

### Controllers → Endpoints + Services

#### `videoController.ts` → `video.endpoint.ts` + `video.service.ts`

**Tasks:**
1. **Split logic**: Move business logic to service, keep HTTP handling in endpoint
2. **Convert responses**: Replace manual response objects with `sendSuccess()`/`sendError()`
3. **Add validation**: Use Zod schemas for request validation
4. **Error handling**: Convert to `ApiError` pattern
5. **Type safety**: Use generated types from schemas

**Example conversion:**
```typescript
// Old controller pattern
export const generateVideo = async (req: RequestWithUser, res: Response): Promise<void> => {
  try {
    const { nftId, prompt } = req.body;
    // ... business logic
    res.status(200).json({ jobId, status: "queued" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// New pattern - Endpoint
export async function handleGenerateVideo(
  req: Request<{}, {}, GenerateVideoRequest['body']>,
  res: Response,
) {
  try {
    const video = await generateVideo(req.body, req.user.id);
    sendSuccess(res, video, 'Video generation started successfully');
  } catch (error) {
    const apiError = ApiError.from(error, 500, ERROR_MESSAGES.FAILED_TO_GENERATE_VIDEO);
    sendError(res, apiError, apiError.statusCode);
  }
}

// New pattern - Service
export const generateVideo = async (
  request: GenerateVideoRequest['body'],
  userId: string
): Promise<VideoGeneration> => {
  // Pure business logic here
};
```

### Models → Schemas

#### `VideoGeneration.ts` → `video.schema.ts`

**Tasks:**
1. **Convert Mongoose to Zod**: Replace Mongoose schema with Zod validation
2. **Add request/response schemas**: Create schemas for API input/output
3. **Type generation**: Use `z.infer` for type generation
4. **Validation rules**: Add proper validation rules
5. **Transform functions**: Create functions to convert DB documents to API types

### Routes → Routes

#### `video.ts` → `video.routes.ts`

**Tasks:**
1. **Middleware chains**: Use established middleware patterns
2. **Schema validation**: Add automatic validation middleware
3. **Endpoint mapping**: Map to new endpoint handlers
4. **Path consistency**: Follow established path patterns

## Environment Variables Migration

### Required Environment Variables
Add these to core server `.env` files:

```bash
# Proxim8 Configuration
PROXIM8_API_KEY=your-api-key
PROXIM8_JWT_SECRET=your-jwt-secret
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com

# Storage Configuration  
S3_BUCKET_NAME=proxim8-videos
S3_REGION=us-east-1
S3_ACCESS_KEY=your-access-key
S3_SECRET_KEY=your-secret-key

GCP_PROJECT_ID=argos-434718
GCP_BUCKET_NAME=proxim8-videos
GCP_KEY_FILE_PATH=/path/to/key.json

# Video Configuration
VIDEO_STORAGE=gcp
TEMP_DIR=/tmp/proxim8
```

## Dependencies Integration

### Dependencies to Add to Core Server
Update `apps/server/package.json`:

```json
{
  "dependencies": {
    // Add these proxim8-specific dependencies
    "uuid": "^9.0.0",
    "@types/uuid": "^9.0.0",
    "@aws-sdk/client-s3": "^3.0.0",
    "@google-cloud/storage": "^6.0.0",
    "redis": "^4.0.0",
    // ... other dependencies from proxim8-server
  }
}
```

## Post-Migration Validation

### Checklist
- [ ] All endpoints return unified response format
- [ ] All requests use Zod schema validation
- [ ] Error handling uses `ApiError` class
- [ ] Services use MongoDB native driver
- [ ] All files follow naming conventions
- [ ] Middleware chains work correctly
- [ ] Environment variables are properly configured
- [ ] No direct response object manipulation in services
- [ ] All types are generated from Zod schemas
- [ ] Constants are properly organized
- [ ] Original proxim8-server directory is removed

### Testing Commands
```bash
# Test the migration
cd apps/server
pnpm dev

# Test specific endpoints
curl -X POST http://localhost:3000/api/videos/generate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"nftId": "test", "prompt": "test prompt"}'

# Verify response format
# Should return: { "success": true, "data": {...}, "requestId": "...", "timestamp": ... }
```

## Expected Outcome

After migration, the proxim8 functionality will be fully integrated into the core server with:

1. **Unified Architecture**: All code follows established patterns
2. **Type Safety**: End-to-end type safety with Zod schemas  
3. **Consistent Responses**: All endpoints use unified response format
4. **Proper Error Handling**: Structured error handling throughout
5. **Clean Organization**: Files organized by domain following naming conventions
6. **Maintainable Code**: Clear separation of concerns between layers
7. **Scalable Structure**: Easy to extend with new functionality

The migration will result in a single, cohesive server that maintains all proxim8 functionality while following the architectural standards established in the core server. 