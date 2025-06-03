# Prisma Integration Plan for Proxim8 Migration

## Overview
Integrate Prisma ORM into the core server architecture to replace:
- **Core Server**: MongoDB native driver (`mongodb` package)
- **Proxim8 Server**: Mongoose ODM

## Benefits of Prisma Integration

### 1. **Type Safety & Developer Experience**
- Auto-generated TypeScript types from schema
- IntelliSense and autocomplete for all database operations
- Compile-time error checking for queries
- No manual type definitions needed

### 2. **Unified Database Layer**
- Single ORM for both core server and Proxim8 domains
- Consistent query patterns across all services
- Better abstraction over database operations

### 3. **Modern Tooling**
- Prisma Studio for database visualization
- Schema migrations with version control
- Database introspection and schema diffing
- Built-in connection pooling

### 4. **Database Flexibility**
- Easy migration between MongoDB and SQL databases
- Support for multiple database providers
- Consistent API regardless of underlying database

## Phase 6: Prisma Integration Strategy

### Step 1: Setup Prisma in Core Server

#### 1.1 Install Prisma Dependencies
```bash
# Add Prisma CLI and client
pnpm add prisma @prisma/client

# Add Prisma MongoDB connector
pnpm add @prisma/adapter-mongodb
```

#### 1.2 Initialize Prisma Schema
```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "mongodb"
  url      = env("DATABASE_URL")
}

// Start with core entities
model Account {
  id          String   @id @default(auto()) @map("_id") @db.ObjectId
  walletAddress String @unique
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  // Relations
  profiles    Profile[]
  videos      Video[]
  notifications Notification[]
  
  @@map("accounts")
}

model Profile {
  id        String   @id @default(auto()) @map("_id") @db.ObjectId
  accountId String   @db.ObjectId
  username  String   @unique
  bio       String?
  avatar    String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  // Relations
  account   Account  @relation(fields: [accountId], references: [id])
  
  @@map("profiles")
}

// Proxim8 Models
model Video {
  id          String   @id @default(auto()) @map("_id") @db.ObjectId
  accountId   String   @db.ObjectId
  nftId       String
  jobId       String   @unique
  status      VideoStatus
  title       String?
  description String?
  videoUrl    String?
  thumbnailUrl String?
  isPublic    Boolean  @default(false)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  // Relations
  account     Account  @relation(fields: [accountId], references: [id])
  
  @@map("videos")
}

model Notification {
  id          String   @id @default(auto()) @map("_id") @db.ObjectId
  accountId   String   @db.ObjectId
  type        NotificationType
  title       String
  message     String
  data        Json?
  isRead      Boolean  @default(false)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  // Relations
  account     Account  @relation(fields: [accountId], references: [id])
  
  @@map("notifications")
}

model NFTOwnership {
  id          String   @id @default(auto()) @map("_id") @db.ObjectId
  nftId       String   @unique
  walletAddress String
  contractAddress String
  tokenId     String
  verified    Boolean  @default(false)
  lastVerified DateTime?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  @@map("nft_ownership")
}

// Enums
enum VideoStatus {
  PENDING
  PROCESSING
  COMPLETED
  FAILED
}

enum NotificationType {
  VIDEO_COMPLETED
  VIDEO_FAILED
  SYSTEM_ANNOUNCEMENT
  NFT_VERIFIED
}
```

#### 1.3 Create Prisma Client Service
```typescript
// apps/server/src/services/prisma.service.ts
import { PrismaClient } from '@prisma/client';

declare global {
  var __prisma: PrismaClient | undefined;
}

class PrismaService {
  private prisma: PrismaClient;

  constructor() {
    // Prevent multiple instances in development
    if (process.env.NODE_ENV === 'production') {
      this.prisma = new PrismaClient();
    } else {
      if (!global.__prisma) {
        global.__prisma = new PrismaClient({
          log: ['query', 'info', 'warn', 'error'],
        });
      }
      this.prisma = global.__prisma;
    }
  }

  async connect(): Promise<void> {
    await this.prisma.$connect();
    console.log('✅ Prisma connected to MongoDB');
  }

  async disconnect(): Promise<void> {
    await this.prisma.$disconnect();
    console.log('✅ Prisma disconnected from MongoDB');
  }

  get client(): PrismaClient {
    return this.prisma;
  }

  // Health check
  async isHealthy(): Promise<boolean> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return true;
    } catch {
      return false;
    }
  }
}

// Export singleton instance
export const prismaService = new PrismaService();
export const prisma = prismaService.client;
```

### Step 2: Migrate Services to Prisma

#### 2.1 Update Service Interfaces
Replace MongoDB native operations with Prisma queries:

```typescript
// Before (MongoDB native)
const db = await getDb();
const users = await db.collection('users').find({ walletAddress }).toArray();

// After (Prisma)
const users = await prisma.account.findMany({
  where: { walletAddress },
  include: { profiles: true }
});
```

#### 2.2 Service Migration Pattern
```typescript
// apps/server/src/services/video.service.ts (Updated)
import { prisma } from './prisma.service';
import { Video, VideoStatus } from '@prisma/client';

export class VideoService {
  async createVideo(data: {
    accountId: string;
    nftId: string;
    jobId: string;
  }): Promise<Video> {
    return await prisma.video.create({
      data: {
        ...data,
        status: VideoStatus.PENDING,
      },
      include: {
        account: {
          include: {
            profiles: true
          }
        }
      }
    });
  }

  async updateVideoStatus(
    videoId: string, 
    status: VideoStatus,
    urls?: { videoUrl?: string; thumbnailUrl?: string }
  ): Promise<Video> {
    return await prisma.video.update({
      where: { id: videoId },
      data: {
        status,
        ...urls,
        updatedAt: new Date(),
      }
    });
  }

  async getUserVideos(accountId: string): Promise<Video[]> {
    return await prisma.video.findMany({
      where: { accountId },
      orderBy: { createdAt: 'desc' },
      include: {
        account: {
          select: {
            walletAddress: true
          }
        }
      }
    });
  }
}
```

### Step 3: Database Migration Strategy

#### 3.1 Schema Migration Planning
1. **Analyze Existing Data Structure**
   - Core server collections (MongoDB native)
   - Proxim8 server collections (Mongoose)
   - Identify overlapping entities

2. **Create Migration Scripts**
   - Data transformation utilities
   - Schema validation scripts
   - Rollback procedures

#### 3.2 Migration Approach
```typescript
// scripts/migrate-to-prisma.ts
import { prisma } from '../apps/server/src/services/prisma.service';
import { getDb } from '../apps/server/src/utils/mongodb';
import mongoose from 'mongoose';

export async function migrateExistingData() {
  console.log('🔄 Starting data migration to Prisma...');
  
  // 1. Connect to both systems
  const mongoDb = await getDb();
  await prisma.$connect();
  
  try {
    // 2. Migrate users/accounts
    await migrateAccounts(mongoDb);
    
    // 3. Migrate profiles
    await migrateProfiles(mongoDb);
    
    // 4. Migrate videos
    await migrateVideos(mongoDb);
    
    // 5. Migrate notifications
    await migrateNotifications(mongoDb);
    
    console.log('✅ Data migration completed successfully');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

async function migrateAccounts(mongoDb: any) {
  const accounts = await mongoDb.collection('accounts').find({}).toArray();
  
  for (const account of accounts) {
    await prisma.account.upsert({
      where: { walletAddress: account.walletAddress },
      create: {
        walletAddress: account.walletAddress,
        createdAt: account.createdAt || new Date(),
        updatedAt: account.updatedAt || new Date(),
      },
      update: {
        updatedAt: new Date(),
      }
    });
  }
  
  console.log(`✅ Migrated ${accounts.length} accounts`);
}
```

### Step 4: Update Middleware and Routes

#### 4.1 Prisma-Compatible Auth Middleware
```typescript
// apps/server/src/middleware/prismaAuth.middleware.ts
import { prisma } from '../services/prisma.service';

export const validateAccountExists = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const walletAddress = req.auth?.wallet?.address;
    
    if (!walletAddress) {
      throw new ApiError(401, 'Wallet address required');
    }
    
    // Use Prisma to find or create account
    const account = await prisma.account.upsert({
      where: { walletAddress },
      create: { walletAddress },
      update: { updatedAt: new Date() },
      include: {
        profiles: true
      }
    });
    
    // Attach account to request
    req.auth = {
      ...req.auth,
      account: {
        id: account.id,
        profiles: account.profiles
      }
    };
    
    next();
  } catch (error) {
    next(error);
  }
};
```

#### 4.2 Update Endpoints
```typescript
// apps/server/src/endpoints/video.endpoint.ts (Updated)
import { prisma } from '../services/prisma.service';
import { VideoStatus } from '@prisma/client';

export const handleGenerateVideo = async (req: Request, res: Response) => {
  try {
    const { nftId } = req.body;
    const accountId = req.auth?.account?.id;
    
    // Create video with Prisma
    const video = await prisma.video.create({
      data: {
        accountId,
        nftId,
        jobId: generateJobId(),
        status: VideoStatus.PENDING,
      },
      include: {
        account: {
          select: {
            walletAddress: true
          }
        }
      }
    });
    
    // Queue processing job
    await queueVideoGeneration(video.jobId, nftId);
    
    sendSuccess(res, video, 'Video generation started');
  } catch (error) {
    sendError(res, error);
  }
};
```

### Step 5: Environment & Configuration

#### 5.1 Environment Variables
```bash
# .env
DATABASE_URL="mongodb://username:password@host:port/database?authSource=admin"
PRISMA_GENERATE_DATAPROXY=false
```

#### 5.2 Package.json Scripts
```json
{
  "scripts": {
    "db:generate": "prisma generate",
    "db:push": "prisma db push",
    "db:studio": "prisma studio",
    "db:migrate": "tsx scripts/migrate-to-prisma.ts",
    "db:seed": "tsx scripts/seed.ts"
  }
}
```

## Migration Timeline

### Phase 6A: Prisma Setup (Week 1)
- [ ] Install Prisma dependencies
- [ ] Create initial schema for Proxim8 entities
- [ ] Set up Prisma client service
- [ ] Create migration scripts

### Phase 6B: Service Migration (Week 2)
- [ ] Migrate video services to Prisma
- [ ] Migrate user services to Prisma
- [ ] Migrate notification services to Prisma
- [ ] Migrate NFT services to Prisma

### Phase 6C: Data Migration (Week 3)
- [ ] Run data migration scripts
- [ ] Validate data integrity
- [ ] Update environment configurations
- [ ] Test all endpoints with Prisma

### Phase 6D: Cleanup (Week 4)
- [ ] Remove MongoDB native utilities
- [ ] Remove Mongoose dependencies
- [ ] Update all import statements
- [ ] Performance testing and optimization

## Benefits After Migration

1. **Type Safety**: Compile-time checking for all database operations
2. **Better DX**: IntelliSense and autocomplete for queries
3. **Unified API**: Consistent patterns across all services
4. **Modern Tooling**: Prisma Studio, migrations, introspection
5. **Performance**: Built-in connection pooling and query optimization
6. **Flexibility**: Easy database provider switching in the future

## Risk Mitigation

1. **Gradual Migration**: Migrate one service at a time
2. **Parallel Systems**: Run both systems during transition
3. **Data Validation**: Comprehensive testing of migrated data
4. **Rollback Plan**: Keep MongoDB utilities until migration is proven
5. **Performance Testing**: Ensure Prisma performs as well as native driver

## Next Steps

1. **Get approval for Prisma integration approach**
2. **Set up Prisma in development environment**
3. **Create initial schema for Proxim8 entities**
4. **Begin service migration starting with video domain**
5. **Plan data migration strategy for production**

This integration will significantly improve the developer experience and provide a solid foundation for future development while maintaining all the functionality we've built in the previous phases. 