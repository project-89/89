# Core Server Architecture Review

## Overview
The `/apps/server` represents a well-architected Node.js/Express API server using TypeScript with strong patterns for type safety, validation, and unified response handling. This server follows a clean layered architecture with consistent naming conventions and leverages Zod schemas for runtime validation and compile-time type inference.

## Project Structure

### Root Configuration
- **Package Management**: Uses pnpm workspaces (`"packageManager": "pnpm@10.11.0"`)
- **TypeScript Configuration**: Extends workspace root, targets ES2022, strict mode enabled
- **Environment Management**: Multi-environment support (development, test, production) via dotenv-cli
- **Build Target**: CommonJS modules with source maps and incremental compilation

### Core Dependencies
- **Runtime**: Express.js with TypeScript
- **Validation**: Zod for schema validation and type inference
- **Database**: MongoDB with native driver
- **Security**: Helmet, CORS, JWT, rate limiting
- **AI/ML**: Google Generative AI, AI SDK
- **Blockchain**: Solana Web3.js, TweetNaCl for cryptography

## Directory Architecture

```
src/
├── constants/           # Organized constants by domain
│   ├── auth/           # Authentication constants
│   ├── config/         # Configuration constants
│   ├── database/       # Database constants
│   ├── features/       # Feature-specific constants
│   └── http/           # HTTP status codes, error messages
├── schemas/            # Zod schemas for validation and type derivation
├── types/              # Additional TypeScript types
├── middleware/         # Express middleware functions
├── routes/             # Route definitions
├── endpoints/          # Request handlers
├── services/           # Business logic layer
├── utils/              # Utility functions
├── config/             # Configuration modules
├── env/                # Environment files
├── scheduled/          # Cron jobs and scheduled tasks
└── public/             # Static files
```

## Schema-Driven Type System

### Pattern: Zod Schemas as Single Source of Truth

The architecture uses Zod schemas as the foundation for both runtime validation and compile-time type inference:

```typescript
// 1. Define schemas with validation rules
export const AgentSchema = z.object({
  id: AccountIdSchema,
  name: z.string().min(3),
  description: z.string(),
  // ... more fields
});

// 2. Derive types automatically
export type Agent = z.infer<typeof AgentSchema>;

// 3. Create request/response schemas
export const RegisterAgentRequestSchema = z.object({
  body: z.object({
    name: z.string().min(3),
    description: z.string(),
    // ...
  }),
  query: z.object({}).optional(),
  params: z.object({}).optional(),
});

export type RegisterAgentRequest = z.infer<typeof RegisterAgentRequestSchema>;
```

### Schema Organization Patterns

1. **Common Schemas First**: Base schemas like `common.schema.ts` are exported first
2. **Domain-Specific Schemas**: Each business domain has its own schema file
3. **Hierarchical Composition**: Complex schemas compose simpler ones using references
4. **Request/Response Separation**: Clear separation between input validation and output schemas
5. **Database Transformation**: Separate document types for MongoDB with transformation functions

### Type Inference Benefits

- **Compile-time Safety**: TypeScript catches type mismatches
- **Runtime Validation**: Zod validates incoming requests
- **Code Completion**: IDEs provide accurate autocomplete
- **Refactoring Safety**: Changes to schemas automatically update all dependent types

## Unified Response Pattern

### Standardized API Responses

All API responses follow a consistent structure defined in `api.schema.ts`:

```typescript
// Success Response
type ApiSuccessResponse<T> = {
  success: true;
  data: T;
  message?: string;
  requestId: string;
  timestamp: number;
  details?: any[];
};

// Error Response  
type ApiErrorResponse = {
  success: false;
  error: string;
  code?: string;
  requestId: string;
  timestamp: number;
  details?: ApiErrorDetail[];
};
```

### Response Utility Functions

The `utils/response.ts` provides consistent response helpers:

- `sendSuccess()`: Creates standardized success responses
- `sendError()`: Creates standardized error responses
- `sendWarning()`: Creates success responses with warnings

### Benefits

- **Consistent Client Experience**: All endpoints return the same response structure
- **Request Tracing**: Every response includes a unique `requestId`
- **Timestamp Tracking**: Unix milliseconds for precise timing
- **Error Standardization**: Consistent error format across all endpoints

## File Naming Conventions

### Consistent Naming Patterns

1. **Domain-Based Naming**: `{domain}.{layer}.ts`
   - `agent.schema.ts` - Zod schemas for agent domain
   - `agent.routes.ts` - Express routes for agent endpoints
   - `agent.endpoint.ts` - Request handlers for agent operations
   - `agent.service.ts` - Business logic for agent operations

2. **Layer Suffixes**:
   - `.schema.ts` - Zod validation schemas and types
   - `.routes.ts` - Express route definitions
   - `.endpoint.ts` - HTTP request handlers
   - `.service.ts` - Business logic and data access
   - `.middleware.ts` - Express middleware functions

3. **Utility Naming**:
   - Descriptive names: `mongo-session.ts`, `api-key.ts`
   - Dash-separated for multi-word utilities

### Index File Strategy

Each directory exports through an `index.ts` file:

```typescript
// Clean re-exports
export * from "./common.schema";
export * from "./agent.schema";
// ... other exports
```

## Middleware Architecture

### Middleware Composition Pattern

The server uses a sophisticated middleware composition system:

1. **Base Middleware**: Applied globally (CORS, helmet, body parsing)
2. **Endpoint Middleware**: Composed for specific endpoint types
3. **Validation Middleware**: Automatic Zod schema validation
4. **Rate Limiting**: IP-based and fingerprint-based limiting
5. **Authentication**: JWT and role-based access control

### Middleware Chains

Different endpoint types use pre-configured middleware chains:

```typescript
// Example from routes
router.post(
  "/agents/register",
  specialAccessEndpoint(RegisterAgentRequestSchema),
  handleRegisterAgent,
);

router.get(
  "/agents/:agentId", 
  agentEndpoint(GetAgentRequestSchema), 
  handleGetAgent
);
```

### Configuration-Driven Setup

Middleware configuration is centralized and environment-aware:

- Rate limiting configured via environment variables
- CORS origins dynamically configured
- Metrics collection with named middleware

## Service Layer Patterns

### Separation of Concerns

- **Endpoints**: Handle HTTP concerns (request/response)
- **Services**: Contain business logic and data access
- **Utils**: Pure functions and utilities
- **Middleware**: Cross-cutting concerns

### Service Organization

Services are organized by domain with clear responsibilities:

- **Data Access**: MongoDB operations
- **Business Logic**: Domain-specific operations  
- **External Integrations**: API calls and third-party services
- **Validation**: Additional business rule validation

## Error Handling Strategy

### Unified Error System

The `ApiError` class provides structured error handling:

```typescript
class ApiError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public name = 'ApiError'
  ) {
    super(message);
  }
}
```

### Error Propagation

1. **Service Layer**: Throws `ApiError` with appropriate status codes
2. **Endpoint Layer**: Catches errors and uses `sendError()` utility
3. **Global Handler**: Catches unhandled errors with consistent formatting

## Database Integration Patterns

### MongoDB Integration

- **Native Driver**: Uses MongoDB native driver for performance
- **Connection Management**: Centralized database initialization
- **Document Transformation**: Clean separation between DB documents and API types
- **Session Management**: Utility functions for MongoDB sessions

### Data Access Patterns

- **Service Layer Access**: Only services access the database directly
- **Transformation Functions**: Convert between DB documents and API types
- **Query Utilities**: Reusable query building and filtering utilities

## Environment and Configuration

### Multi-Environment Support

- **Environment Files**: Separate `.env` files for each environment
- **Runtime Scripts**: Environment-specific npm scripts
- **Configuration Loading**: Conditional config loading based on `NODE_ENV`

### Configuration Organization

Constants are organized hierarchically:

```
constants/
├── auth/          # Authentication configuration
├── config/        # CORS, rate limits, etc.
├── database/      # DB collections, cache settings
├── features/      # Feature-specific constants
└── http/          # HTTP status codes, error messages
```

## Security Patterns

### Defense in Depth

1. **Input Validation**: Zod schema validation on all inputs
2. **Rate Limiting**: Multiple layers (IP, fingerprint, endpoint-specific)
3. **CORS Configuration**: Strict origin validation
4. **Helmet**: Security headers
5. **Authentication**: JWT with role-based access
6. **Error Disclosure**: Sanitized error messages

### Rate Limiting Strategy

- **Global IP Limits**: Prevent abuse
- **Fingerprint Limits**: Device-specific limiting
- **Endpoint-Specific**: Health checks and metrics have separate limits
- **Environment Awareness**: Disabled in development mode

## Monitoring and Observability

### Request Tracking

- **Request IDs**: UUID for each request
- **Timestamps**: Unix milliseconds for precise timing
- **Metrics Middleware**: Performance monitoring wrapper

### Health Checks

- **Health Endpoint**: Simple health check with version info
- **Browser Detection**: Different responses for browsers vs API clients
- **Operational Status**: Service availability reporting

## Testing and Development

### Development Workflow

- **Hot Reload**: TSX watch mode for development
- **Environment Switching**: Easy environment switching via npm scripts
- **TypeScript Compilation**: Strict type checking
- **Linting**: ESLint with Google style guide

### Build and Deployment

- **TypeScript Compilation**: Compiles to CommonJS in `dist/`
- **Source Maps**: Enabled for debugging
- **Clean Builds**: Rimraf for clean build process

## Key Architectural Strengths

1. **Type Safety**: End-to-end type safety from request to response
2. **Consistency**: Uniform patterns across all domains
3. **Maintainability**: Clear separation of concerns and naming conventions
4. **Scalability**: Modular architecture supports easy extension
5. **Security**: Multiple layers of protection
6. **Developer Experience**: Excellent tooling and hot reload
7. **Error Handling**: Comprehensive error handling and reporting

## Integration Guidelines for New Servers

When integrating another server into this architecture:

1. **Follow Schema Patterns**: Use Zod schemas for all validation and type inference
2. **Adopt Naming Conventions**: Use consistent `.schema.ts`, `.routes.ts`, `.endpoint.ts`, `.service.ts` pattern
3. **Use Unified Responses**: Leverage `sendSuccess()` and `sendError()` utilities
4. **Implement Middleware Chains**: Use existing middleware patterns for validation and auth
5. **Organize by Domain**: Group related functionality using the established directory structure
6. **Export Through Index**: Use index files for clean imports
7. **Follow Error Patterns**: Use `ApiError` class and consistent error handling
8. **Maintain Environment Support**: Support multiple environments with appropriate configuration

This architecture provides a solid foundation for building scalable, maintainable, and secure API servers with excellent developer experience and operational characteristics. 