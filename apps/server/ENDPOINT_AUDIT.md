# Endpoint Audit & Migration Plan

## Step 1: Categorize All Endpoints

### Pure CRUD Endpoints (Can be replaced by ZenStack auto-CRUD)

#### ✅ Agent Routes (`/agents`)
- `GET /agents` → `/api/model/agent`
- `GET /agents/:id` → `/api/model/agent/:id`
- `POST /agents` → `/api/model/agent`
- `PATCH /agents/:id` → `/api/model/agent/:id`
- `DELETE /agents/:id` → `/api/model/agent/:id`

#### ✅ Knowledge Routes (`/knowledge`)
- `GET /knowledge` → `/api/model/knowledge`
- `GET /knowledge/:id` → `/api/model/knowledge/:id`
- `POST /knowledge` → `/api/model/knowledge`
- `PATCH /knowledge/:id` → `/api/model/knowledge/:id`
- `DELETE /knowledge/:id` → `/api/model/knowledge/:id`

#### ✅ Profile Routes (`/profiles`)
- `GET /profiles` → `/api/model/profile`
- `GET /profiles/:id` → `/api/model/profile/:id`
- `PATCH /profiles/:id` → `/api/model/profile/:id`

### Complex Business Logic Endpoints (Keep & Refactor)

#### 🔄 Mission Routes
- `POST /missions/:id/join` - Complex logic for joining missions
- `POST /missions/:id/complete` - Mission completion logic
- `POST /missions/:id/failure` - Failure recording with dispute logic
- `GET /missions/recommendations` - AI-based recommendations

#### 🔄 Agent Routes  
- `POST /agents/:id/activate` - Activation logic with verification
- `POST /agents/:id/missions/assign` - Mission assignment logic
- `GET /agents/:id/compatibility` - Complex compatibility calculations

#### 🔄 Knowledge Routes
- `POST /knowledge/compress` - AI compression logic
- `POST /knowledge/decompress` - AI decompression logic
- `POST /knowledge/:id/share` - Sharing with permissions
- `POST /knowledge/transfer` - Transfer between agents

#### 🔄 Training Routes
- `POST /training/missions/:id/deploy` - Complex deployment logic
- `GET /training/missions/:id/deployment/status` - Real-time status
- `POST /training/missions/:id/phase/:phaseId/complete` - Phase progression

### Statistics/Aggregation Endpoints (Keep & Enhance)

#### 📊 Stats Routes
- `GET /stats/leaderboard` - Complex aggregation
- `GET /stats/analytics` - Time-series data
- `GET /stats/summary` - Multi-model aggregation

#### 📊 Tag Routes
- `GET /tags/trending` - Trend calculation
- `GET /tags/leaderboard` - Complex scoring

## Step 2: Migration Strategy

### Phase 1: Replace Pure CRUD (Week 1)
```typescript
// Before: 50 lines of CRUD code
router.get('/agents/:id', ...middleware, async (req, res) => {
  const agent = await db.agent.findUnique({ where: { id: req.params.id }});
  if (!agent) return res.status(404).json({ error: 'Not found' });
  if (agent.ownerId !== req.auth.accountId) return res.status(403).json({ error: 'Forbidden' });
  return res.json(agent);
});

// After: 0 lines - use auto-CRUD
// GET /api/model/agent/:id handles everything
```

### Phase 2: Refactor Complex Endpoints (Week 2-3)
```typescript
// Before: Manual authorization checks
router.post('/missions/:id/join', ...middleware, async (req, res) => {
  const db = getPrisma();
  // Manual checks...
  const mission = await db.mission.findUnique({...});
  if (!canJoin(mission, req.auth)) throw new Error('Cannot join');
  // Complex logic...
});

// After: ZenStack handles authorization
router.post('/missions/:id/join', ...middleware, async (req, res) => {
  const db = getEnhancedPrisma(req);
  // ZenStack auto-checks permissions
  const mission = await db.mission.findUnique({...});
  if (!mission) throw new Error('Mission not found or access denied');
  // Same complex logic, but cleaner
});
```

### Phase 3: Enhance Aggregation Endpoints (Week 4)
```typescript
// Use enhanced Prisma for pre-filtered data
router.get('/stats/leaderboard', ...middleware, async (req, res) => {
  const db = getEnhancedPrisma(req);
  // Data is already filtered by permissions
  const stats = await db.$queryRaw`
    SELECT ... FROM stats 
    WHERE user_id IN (SELECT id FROM users WHERE ...)
  `;
});
```

## Step 3: Endpoint Classification

### 🗑️ Delete These Files (Pure CRUD)
- `src/endpoints/profile.endpoint.ts` (mostly CRUD)
- Parts of `agent.endpoint.ts` (CRUD methods)
- Parts of `knowledge.endpoint.ts` (CRUD methods)

### ♻️ Refactor These Files (Complex Logic)
- `src/endpoints/mission.endpoint.ts`
- `src/endpoints/training.endpoint.ts`
- `src/endpoints/stats.endpoint.ts`

### 🆕 Create These Files (New Patterns)
- `src/endpoints/mission.business.ts` (complex mission logic)
- `src/endpoints/agent.business.ts` (activation, assignment)
- `src/endpoints/knowledge.ai.ts` (compression, decompression)

## Step 4: Testing Strategy

### Before Switching
1. Create parallel endpoints (v1 and v2)
2. Compare responses for identical inputs
3. Load test both versions
4. Monitor error rates

### Validation Script
```typescript
// scripts/validate-migration.ts
async function validateEndpoint(oldPath: string, newPath: string) {
  const oldResponse = await fetch(oldPath);
  const newResponse = await fetch(newPath);
  
  assert.deepEqual(
    oldResponse.body,
    newResponse.body,
    `Mismatch for ${oldPath}`
  );
}
```

## Step 5: Frontend Migration

### Update API Calls
```typescript
// Old
const agents = await fetch('/api/agents');

// New  
const agents = await fetch('/api/model/agent');
```

### Use TanStack Hooks
```typescript
// Old
const [agents, setAgents] = useState([]);
useEffect(() => {
  fetch('/api/agents').then(r => r.json()).then(setAgents);
}, []);

// New
const { data: agents } = useAgents();
```

## Benefits After Migration

1. **Less Code**: ~40% reduction in endpoint code
2. **Consistent Authorization**: No more manual checks
3. **Better Performance**: ZenStack optimizes queries
4. **Type Safety**: End-to-end type safety
5. **Easier Testing**: Test policies, not endpoints

## Rollback Plan

1. Keep old endpoints under `/v1/*`
2. New endpoints under `/v2/*`
3. Feature flag for switching
4. Monitor both for 2 weeks
5. Remove old endpoints after verification