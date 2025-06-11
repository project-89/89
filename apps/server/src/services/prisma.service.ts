import { PrismaClient } from '@prisma/client';

declare global {
  var __prisma: PrismaClient | undefined;
}

class PrismaService {
  private prisma: PrismaClient;

  constructor() {
    // Prevent multiple instances in development
    if (process.env.NODE_ENV === 'production') {
      this.prisma = new PrismaClient({
        log: ['error', 'warn'],
      });
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
    try {
      await this.prisma.$connect();
      console.log('✅ Prisma connected to MongoDB');
    } catch (error) {
      console.error('❌ Failed to connect Prisma to MongoDB:', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    try {
      await this.prisma.$disconnect();
      console.log('✅ Prisma disconnected from MongoDB');
    } catch (error) {
      console.error('❌ Error disconnecting Prisma:', error);
      throw error;
    }
  }

  get client(): PrismaClient {
    return this.prisma;
  }

  // Health check
  async isHealthy(): Promise<boolean> {
    try {
      // For MongoDB, we'll use a simple findFirst query instead of raw SQL
      await this.prisma.account.findFirst({
        take: 1,
      });
      return true;
    } catch (error) {
      console.error('❌ Prisma health check failed:', error);
      return false;
    }
  }

  // Transaction helper
  async transaction<T>(
    callback: (
      prisma: Omit<
        PrismaClient,
        | '$connect'
        | '$disconnect'
        | '$on'
        | '$transaction'
        | '$use'
        | '$extends'
      >
    ) => Promise<T>
  ): Promise<T> {
    return await this.prisma.$transaction(callback);
  }

  // Graceful shutdown
  async gracefulShutdown(): Promise<void> {
    console.log('🔄 Initiating Prisma graceful shutdown...');
    await this.disconnect();
  }
}

// Export singleton instance
export const prismaService = new PrismaService();
export const prisma = prismaService.client;

// Handle process termination gracefully
if (typeof process !== 'undefined') {
  process.on('SIGINT', async () => {
    await prismaService.gracefulShutdown();
  });

  process.on('SIGTERM', async () => {
    await prismaService.gracefulShutdown();
  });
}

export default prismaService;
