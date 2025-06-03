# Middleware Migration Analysis

## Current State Comparison

### Core Server Auth Middleware
- **File**: `apps/server/src/middleware/auth.middleware.ts`
- **JWT Payload**: `{ accountId: string, walletAddress: string }`
- **Request Extension**: `req.auth.account.id` and wallet info
- **Error Handling**: Uses `ApiError` with unified error constants
- **Verification**: Simple JWT verification with `JWT_SECRET`

### Old Proxim8 Server Auth Middleware
- **File**: `apps/proxim8-server/src/middleware/jwtAuth.ts`
- **JWT Payload**: `{ walletAddress: string, isAdmin: boolean, keyId?: string }`
- **Request Extension**: `req.user = { walletAddress, isAdmin }`
- **Features**:
  - Token blacklisting via `isTokenBlacklisted()`
  - Key rotation support with `getSigningKeyById()`
  - Admin role checking with `adminOnly()` middleware
  - Fallback verification for legacy tokens
- **Production**: Currently in use and battle-tested

## Key Differences & Considerations

### 1. **JWT Payload Structure**
- **Core**: Uses `accountId` + `walletAddress`
- **Proxim8**: Uses `walletAddress` + `isAdmin` + optional `keyId`
- **Issue**: Different payload structures mean tokens aren't compatible

### 2. **Advanced Features in Proxim8**
- **Token Blacklisting**: Critical security feature for logout/revocation
- **Key Rotation**: Advanced security for key compromise scenarios
- **Admin Roles**: Built-in admin authorization
- **Legacy Support**: Handles tokens without `keyId`

### 3. **Error Handling**
- **Core**: Uses `ApiError` and `sendError()` patterns
- **Proxim8**: Uses direct `res.json()` responses

### 4. **Request Extensions**
- **Core**: Uses `req.auth.account.id` structure
- **Proxim8**: Uses `req.user` structure

## Migration Strategy

### Option 1: Adapt Core Server Auth (Recommended)
Extend the core server's auth middleware to support Proxim8's production requirements.

**Benefits:**
- Maintains architectural consistency
- Uses unified error handling
- Integrates with existing middleware chains

**Implementation:**
1. Extend core auth to support Proxim8 JWT payload
2. Add token blacklisting service
3. Add key rotation support
4. Add admin role checking
5. Maintain backward compatibility

### Option 2: Migrate Proxim8 Auth to Core Patterns
Adapt the Proxim8 auth middleware to follow core server patterns.

**Benefits:**
- Keeps proven production features
- Minimal risk to existing functionality

**Implementation:**
1. Update error handling to use `ApiError`
2. Update request extension to use `req.auth`
3. Integrate with core middleware chains

## Recommended Implementation Plan

### Phase 5A: Enhanced Core Auth Middleware

Create an enhanced version of the core auth that supports both patterns:

```typescript
// Enhanced JWT payload supporting both systems
interface EnhancedJWTPayload {
  // Core server fields
  accountId?: string;
  walletAddress: string;
  
  // Proxim8 fields
  isAdmin?: boolean;
  keyId?: string;
  
  // Standard JWT fields
  iat?: number;
  exp?: number;
}
```

### Phase 5B: Support Services Migration

Migrate essential Proxim8 auth services:
1. **Token Blacklisting Service**
2. **Key Rotation Service** 
3. **Admin Role Middleware**

### Phase 5C: Middleware Chain Updates

Update the Proxim8 routes to use appropriate middleware chains:
- **Public endpoints**: `publicEndpoint()`
- **Authenticated endpoints**: `protectedEndpoint()`
- **Admin endpoints**: `adminEndpoint()`

## Required Services to Migrate

### 1. Token Blacklisting Service
```typescript
// From proxim8-server/src/services/tokenBlacklist
export const isTokenBlacklisted = (token: string): Promise<boolean>
```

### 2. Key Rotation Service  
```typescript
// From proxim8-server/src/services/tokenRotation
export const getSigningKeyById = (keyId: string): Promise<KeyData | null>
```

### 3. Admin Authorization
Need to integrate admin role checking with core server's role system.

## Implementation Priority

### Critical (Must Have)
1. **JWT Token Compatibility** - Support Proxim8's existing token format
2. **Token Blacklisting** - Security requirement for production
3. **Admin Authorization** - Required for admin endpoints

### Important (Should Have)
1. **Key Rotation Support** - Advanced security feature
2. **Error Handling Migration** - Consistency with core patterns
3. **Request Structure Migration** - Use `req.auth` instead of `req.user`

### Optional (Nice to Have)
1. **Legacy Token Support** - May be needed for production transition
2. **Metrics Integration** - Use core server's `withMetrics()`

## Next Steps

1. **Create Enhanced Auth Middleware** - Support both JWT formats
2. **Migrate Token Blacklisting** - Essential security service
3. **Update Route Middleware Chains** - Use core server patterns
4. **Create Admin Middleware** - Integrate with core role system
5. **Test Compatibility** - Ensure existing tokens work

## Migration Notes

- **Zero Downtime**: Must maintain compatibility with existing production tokens
- **Security First**: Token blacklisting and admin auth are non-negotiable
- **Gradual Migration**: Can migrate endpoints one by one
- **Testing**: Thorough testing required due to auth being critical infrastructure 