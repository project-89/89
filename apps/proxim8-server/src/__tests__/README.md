# Training System Tests

This directory contains comprehensive tests for the Training Missions system in the Proxim8 Pipeline.

## Test Structure

### 1. Unit Tests

#### `controllers/__tests__/trainingController.test.ts`
Tests the Express controller endpoints with mocked dependencies:
- `GET /api/training/missions` - Fetch all missions with user progress
- `GET /api/training/missions/:missionId` - Get mission details
- `POST /api/training/missions/:missionId/deploy` - Deploy a mission
- `GET /api/training/deployments/:deploymentId/status` - Get deployment status

#### `services/game/__tests__/missionService.test.ts`
Tests the core business logic:
- Proxim8 compatibility calculations
- Mission deployment logic
- Phase outcome generation
- Mission completion and rewards
- Real-time progress tracking

### 2. Integration Tests

#### `routes/__tests__/training.integration.test.ts`
End-to-end tests using a real MongoDB memory server:
- Complete request/response cycles
- Database operations
- Authentication flows
- Error handling scenarios
- Data persistence verification

### 3. API Relay Tests

#### `client/src/app/api/training/__tests__/training.api.test.ts`
Tests the Next.js API relay endpoints:
- Request forwarding to Express server
- Authentication token handling
- Error propagation
- Input validation

## Running Tests

### Prerequisites

1. Install dependencies:
```bash
cd server
npm install
```

2. Ensure you have the required test dependencies:
- `jest`
- `ts-jest` 
- `supertest`
- `mongodb-memory-server`
- `@types/supertest`

### Test Commands

```bash
# Run all tests
npm test

# Run tests in watch mode (development)
npm run test:watch

# Run tests with coverage report
npm run test:coverage

# Run development test script
npm run test:dev
```

### Running Specific Test Suites

```bash
# Run only controller tests
npm test controllers

# Run only service tests
npm test services

# Run only integration tests
npm test integration

# Run specific test file
npm test -- training.integration.test.ts
```

## Test Coverage

The tests cover:

### ✅ **Authentication & Authorization**
- JWT token validation
- Cookie-based authentication
- User-specific data access
- Unauthorized access prevention

### ✅ **Mission Management**
- Mission template loading
- User progress tracking
- Sequential mission unlocking
- Completion status management

### ✅ **Deployment System**
- Proxim8 availability checking
- Compatibility calculations
- Deployment validation
- Duplicate deployment prevention

### ✅ **Real-time Progress**
- Phase-based progression
- Time-based reveals
- Mission completion detection
- Status updates

### ✅ **Agent Progression**
- Experience and level updates
- Timeline point rewards
- Rank calculations
- Proxim8 management

### ✅ **Error Handling**
- Database connection failures
- Invalid input validation
- Missing resource handling
- Network errors

### ✅ **Data Persistence**
- MongoDB operations
- Model relationships
- Transaction consistency
- Data integrity

## Test Environment

The tests use:
- **MongoDB Memory Server** for isolated database testing
- **Jest mocks** for external service dependencies
- **Supertest** for HTTP request testing
- **TypeScript** for type safety

## Environment Variables

Test-specific environment variables:
```bash
NODE_ENV=test
JWT_SECRET=test-jwt-secret-for-testing-only
API_KEY=test-api-key
DEBUG_TESTS=true  # Enable console logs during testing
```

## Mock Services

The following external services are mocked in tests:
- Google Veo video generation API
- Google Gemini AI text generation
- Google Cloud Storage
- Redis cache
- External NFT APIs

## Test Data

Tests use:
- In-memory MongoDB instances
- Mock Proxim8 NFT data
- Simulated user accounts
- Predefined mission templates
- Generated deployment scenarios

## Debugging Tests

1. Enable debug logs:
```bash
DEBUG_TESTS=true npm test
```

2. Run specific test with verbose output:
```bash
npm test -- --verbose training.integration.test.ts
```

3. Use Jest's debugging capabilities:
```bash
node --inspect-brk node_modules/.bin/jest --runInBand
```

## Contributing

When adding new features to the training system:

1. **Write tests first** (TDD approach)
2. **Update existing tests** if behavior changes
3. **Maintain test coverage** above 80%
4. **Include both unit and integration tests**
5. **Test error scenarios** and edge cases
6. **Document test reasoning** in comments

## Common Test Patterns

### Setting up test data:
```typescript
beforeEach(async () => {
  await TrainingMissionDeployment.deleteMany({});
  await Agent.deleteMany({});
  // Create test agent with Proxim8s...
});
```

### Testing authenticated endpoints:
```typescript
const authToken = jwt.sign(mockUser, 'test-secret');
const response = await request(app)
  .get('/api/training/missions')
  .set('Authorization', `Bearer ${authToken}`)
  .expect(200);
```

### Mocking external services:
```typescript
MockMissionService.deployMission.mockResolvedValue(mockDeployment);
```

### Testing database operations:
```typescript
const deployment = await TrainingMissionDeployment.findOne({
  deploymentId: 'test-deployment'
});
expect(deployment).toBeTruthy();
```

This comprehensive test suite ensures the Training Missions system functions correctly across all layers of the application architecture.