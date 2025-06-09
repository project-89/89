# ZenStack Migration Guide

## Overview

We've successfully integrated ZenStack into the server, which provides automatic CRUD endpoints with built-in access control. This guide explains how to use the new endpoints.

## What Changed

1. **Auto-CRUD Endpoints**: All models now have automatic REST endpoints at `/api/model/{modelName}`
2. **Access Control**: Authorization is handled automatically based on the schema policies
3. **Removed Manual Ownership Checks**: The `protectedEndpoint()` middleware now delegates to `authenticatedEndpoint()`

## API Endpoints

### Base URL Pattern
```
/api/model/{modelName}
```

Where `{modelName}` is the lowercase model name (e.g., `account`, `profile`, `video`, etc.)

### Standard Operations

#### 1. List/Find Many
```
GET /api/model/{modelName}
Query params:
  - where: JSON filter object
  - include: Relations to include
  - orderBy: Sort order
  - skip: Pagination offset
  - take: Pagination limit
```

#### 2. Find One
```
GET /api/model/{modelName}/{id}
Query params:
  - include: Relations to include
```

#### 3. Create
```
POST /api/model/{modelName}
Body: JSON object with model fields
```

#### 4. Update
```
PATCH /api/model/{modelName}/{id}
Body: JSON object with fields to update
```

#### 5. Delete
```
DELETE /api/model/{modelName}/{id}
```

## Examples

### Before (Manual Endpoints)
```typescript
// Get user's videos
GET /api/videos/user
Authorization: Bearer <token>

// Update video
PATCH /api/videos/:id
Authorization: Bearer <token>
Body: { title: "New Title" }
```

### After (ZenStack Auto-CRUD)
```typescript
// Get user's videos (filtered automatically by ownership)
GET /api/model/video
Authorization: Bearer <token>

// Update video (ownership checked automatically)
PATCH /api/model/video/{id}
Authorization: Bearer <token>
Body: { title: "New Title" }
```

## Frontend Code Migration

### Before
```typescript
// services/video.ts
export async function getUserVideos() {
  const response = await fetch('/api/videos/user', {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.json();
}

export async function updateVideo(id: string, data: any) {
  const response = await fetch(`/api/videos/${id}`, {
    method: 'PATCH',
    headers: { 
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  });
  return response.json();
}
```

### After
```typescript
// services/video.ts
export async function getUserVideos() {
  // ZenStack automatically filters by ownership
  const response = await fetch('/api/model/video', {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.json();
}

export async function updateVideo(id: string, data: any) {
  const response = await fetch(`/api/model/video/${id}`, {
    method: 'PATCH',
    headers: { 
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  });
  return response.json();
}
```

## Advanced Queries

### Filtering
```typescript
// Get completed videos
GET /api/model/video?where={"status":"COMPLETED"}

// Get videos with specific NFT
GET /api/model/video?where={"nftId":"123"}
```

### Including Relations
```typescript
// Get profile with social profiles
GET /api/model/profile/{id}?include={"socialProfiles":true}

// Get agent with knowledge and missions
GET /api/model/agent/{id}?include={"knowledge":true,"missions":true}
```

### Sorting and Pagination
```typescript
// Get latest 10 videos
GET /api/model/video?orderBy={"createdAt":"desc"}&take=10

// Get page 2 of notifications (20 per page)
GET /api/model/notification?skip=20&take=20&orderBy={"createdAt":"desc"}
```

## Access Control

ZenStack automatically enforces access control based on the schema policies:

1. **Public Models**: Some models like `PublicVideo` and `NFT` are readable by anyone
2. **Owner-Only**: Models like `Video`, `Profile` are only accessible by their owners
3. **Admin Override**: Admins can access all resources
4. **Relationship-Based**: Access through relationships (e.g., accessing knowledge through agent ownership)

## Error Handling

ZenStack returns standard HTTP status codes:

- `200 OK` - Success
- `201 Created` - Resource created
- `400 Bad Request` - Invalid request
- `403 Forbidden` - Access denied by policy
- `404 Not Found` - Resource not found
- `500 Internal Server Error` - Server error

Example error response:
```json
{
  "error": {
    "message": "Access denied by policy",
    "code": "FORBIDDEN"
  }
}
```

## Custom Business Logic Endpoints

For operations that require custom business logic beyond CRUD, we still have dedicated endpoints:

- `/api/videos/generate` - Generate video with AI
- `/api/missions/deploy` - Deploy a mission
- `/api/knowledge/compress` - Compress knowledge data
- `/api/notifications/mark-all-read` - Bulk operations

## Migration Checklist

When migrating frontend code:

1. [ ] Replace manual CRUD endpoints with `/api/model/{modelName}`
2. [ ] Remove explicit ownership filters (ZenStack handles it)
3. [ ] Update error handling for 403 Forbidden responses
4. [ ] Test authorization edge cases
5. [ ] Update API documentation

## Benefits

1. **Less Code**: No need for manual CRUD endpoints
2. **Consistent API**: All models follow the same pattern
3. **Automatic Authorization**: No manual ownership checks
4. **Type Safety**: Generated from Prisma schema
5. **Better Performance**: Optimized queries with access control