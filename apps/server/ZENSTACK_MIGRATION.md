# ZenStack Migration Strategy

## Overview
We're adopting a hybrid approach where authentication middleware stays, but authorization moves to ZenStack.

## What Changes

### 1. Keep These Middlewares:
- `verifyFingerprintExists` - Establishes fingerprint context
- `validateAuthToken` - Validates JWT tokens
- `validateRequest` - Schema validation
- `withMetrics` - Performance monitoring
- `verifyAgent` - Establishes agent context

### 2. Remove/Replace These:
- `verifyAccountOwnership` - Replace with ZenStack ownership policies
- `requireRole` - Replace with ZenStack role-based policies
- Manual permission checks in endpoints

### 3. Middleware Chains Update:

```typescript
// Before
export const protectedEndpoint = (schema?: ZodSchema) => {
  const chain: RequestHandler[] = [
    withMetrics(validateAuthToken, "authValidation"),
    withMetrics(verifyAccountOwnership, "ownershipVerification"), // Remove this
  ];
  if (schema) chain.push(withMetrics(validateRequest(schema), "schemaValidation"));
  return chain;
};

// After
export const authenticatedEndpoint = (schema?: ZodSchema) => {
  const chain: RequestHandler[] = [
    withMetrics(validateAuthToken, "authValidation"),
    // No ownership verification - ZenStack handles it
  ];
  if (schema) chain.push(withMetrics(validateRequest(schema), "schemaValidation"));
  return chain;
};
```

## Migration Steps

### Phase 1: Setup (Complete)
- [x] Install ZenStack
- [x] Create schema.zmodel with policies
- [x] Create enhanced Prisma client
- [x] Create example routes

### Phase 2: Parallel Implementation
1. Keep existing routes working
2. Create new ZenStack versions alongside
3. Test thoroughly
4. Switch frontend to new endpoints
5. Remove old endpoints

### Phase 3: Endpoint Migration

#### Mission Routes
```typescript
// Old: apps/server/src/routes/mission.routes.ts
router.get("/missions/available", ...fingerprintWriteEndpoint(), handleGetAvailableMissions);

// New: Use ZenStack
router.get("/v2/missions/available", ...fingerprintWriteEndpoint(), async (req, res) => {
  const db = getEnhancedPrisma(req);
  const missions = await db.mission.findMany({
    where: { status: 'available' }
  });
  return sendSuccess(res, missions);
});
```

#### Agent Routes
```typescript
// Old: Manual ownership check
router.patch("/agents/:id", ...protectedEndpoint(), async (req, res) => {
  // Manual check if user owns agent
  if (agent.accountId !== req.auth.accountId) {
    return sendError(res, new ApiError(403, "Forbidden"));
  }
  // Update logic
});

// New: ZenStack handles ownership
router.patch("/v2/agents/:id", ...authenticatedEndpoint(), async (req, res) => {
  const db = getEnhancedPrisma(req);
  // This will fail if user doesn't own the agent
  const agent = await db.agent.update({
    where: { id: req.params.id },
    data: req.body
  });
  return sendSuccess(res, agent);
});
```

## Benefits

1. **Cleaner Code**: Remove all manual authorization checks
2. **Consistency**: Authorization rules in one place
3. **Type Safety**: Policies are type-checked
4. **Performance**: ZenStack optimizes queries with authorization
5. **Maintainability**: Change policies without touching endpoints

## Example Policy Translations

### Current Middleware Logic → ZenStack Policy

```typescript
// Current: verifyAccountOwnership middleware
if (resource.accountId !== req.auth.accountId) {
  throw new ApiError(403, "Forbidden");
}

// ZenStack Policy:
model Resource {
  @@allow('all', accountId == auth().account?.id)
}
```

```typescript
// Current: requireRole('admin') middleware
if (!req.auth.roles?.includes('admin')) {
  throw new ApiError(403, "Admin access required");
}

// ZenStack Policy:
@@allow('all', auth().roles.some(r => r == 'admin'))
```

## Testing Strategy

1. **Unit Tests**: Test policies in isolation
2. **Integration Tests**: Test full request flow
3. **Policy Tests**: Verify access control scenarios
4. **Migration Tests**: Ensure old and new endpoints return same data

## Rollback Plan

If issues arise:
1. Frontend can switch back to old endpoints
2. Keep both implementations until stable
3. ZenStack can be disabled by using `basePrisma` instead of `getEnhancedPrisma`