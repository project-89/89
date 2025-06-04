import dotenv from 'dotenv';
import {
  NotificationType,
  VideoStatus,
} from '../apps/server/src/generated/prisma';
import { prisma } from '../apps/server/src/services/prisma.service';
import { getDb } from '../apps/server/src/utils/mongodb';

// Load environment variables
dotenv.config({ path: 'apps/server/src/env/.env.development' });

interface MigrationStats {
  accounts: number;
  profiles: number;
  videos: number;
  notifications: number;
  nftOwnership: number;
  errors: string[];
}

export async function migrateExistingData(): Promise<MigrationStats> {
  console.log('🔄 Starting data migration to Prisma...');

  const stats: MigrationStats = {
    accounts: 0,
    profiles: 0,
    videos: 0,
    notifications: 0,
    nftOwnership: 0,
    errors: [],
  };

  try {
    // 1. Connect to both systems
    console.log('📡 Connecting to databases...');
    const mongoDb = await getDb();
    await prisma.$connect();
    console.log('✅ Connected to both MongoDB and Prisma');

    // 2. Migrate in order (accounts first, then dependent entities)
    await migrateAccounts(mongoDb, stats);
    await migrateProfiles(mongoDb, stats);
    await migrateVideos(mongoDb, stats);
    await migrateNotifications(mongoDb, stats);
    await migrateNFTOwnership(mongoDb, stats);

    console.log('✅ Data migration completed successfully');
    console.log('📊 Migration Statistics:', {
      accounts: stats.accounts,
      profiles: stats.profiles,
      videos: stats.videos,
      notifications: stats.notifications,
      nftOwnership: stats.nftOwnership,
      totalErrors: stats.errors.length,
    });

    if (stats.errors.length > 0) {
      console.log('❌ Errors encountered during migration:');
      stats.errors.forEach((error, index) => {
        console.log(`${index + 1}. ${error}`);
      });
    }

    return stats;
  } catch (error) {
    const errorMsg = `Migration failed: ${error instanceof Error ? error.message : String(error)}`;
    console.error('❌', errorMsg);
    stats.errors.push(errorMsg);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

async function migrateAccounts(
  mongoDb: any,
  stats: MigrationStats
): Promise<void> {
  try {
    console.log('🔄 Migrating accounts...');

    // Get accounts from various collections that might have wallet addresses
    const accountsFromProfiles = await mongoDb
      .collection('profiles')
      .distinct('walletAddress');
    const accountsFromVideos = await mongoDb
      .collection('videos')
      .distinct('walletAddress');
    const accountsFromNFTs = await mongoDb
      .collection('nft_ownership')
      .distinct('walletAddress');

    // Combine and deduplicate wallet addresses
    const allWalletAddresses = [
      ...new Set([
        ...accountsFromProfiles,
        ...accountsFromVideos,
        ...accountsFromNFTs,
      ]),
    ].filter(Boolean);

    console.log(`Found ${allWalletAddresses.length} unique wallet addresses`);

    for (const walletAddress of allWalletAddresses) {
      try {
        await prisma.account.upsert({
          where: { walletAddress },
          create: {
            walletAddress,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          update: {
            updatedAt: new Date(),
          },
        });
        stats.accounts++;
      } catch (error) {
        const errorMsg = `Failed to migrate account ${walletAddress}: ${error instanceof Error ? error.message : String(error)}`;
        stats.errors.push(errorMsg);
        console.error('❌', errorMsg);
      }
    }

    console.log(`✅ Migrated ${stats.accounts} accounts`);
  } catch (error) {
    const errorMsg = `Failed to migrate accounts: ${error instanceof Error ? error.message : String(error)}`;
    stats.errors.push(errorMsg);
    console.error('❌', errorMsg);
  }
}

async function migrateProfiles(
  mongoDb: any,
  stats: MigrationStats
): Promise<void> {
  try {
    console.log('🔄 Migrating profiles...');

    const profiles = await mongoDb.collection('profiles').find({}).toArray();
    console.log(`Found ${profiles.length} profiles to migrate`);

    for (const profile of profiles) {
      try {
        // Find the corresponding account
        const account = await prisma.account.findUnique({
          where: { walletAddress: profile.walletAddress },
        });

        if (!account) {
          stats.errors.push(
            `No account found for profile with wallet: ${profile.walletAddress}`
          );
          continue;
        }

        await prisma.profile.upsert({
          where: { username: profile.username },
          create: {
            accountId: account.id,
            username: profile.username,
            bio: profile.bio || null,
            avatar: profile.avatar || null,
            isPublic: profile.isPublic ?? true,
            socialLinks: profile.socialLinks || null,
            preferences: profile.preferences || null,
            createdAt: profile.createdAt || new Date(),
            updatedAt: profile.updatedAt || new Date(),
          },
          update: {
            bio: profile.bio || null,
            avatar: profile.avatar || null,
            isPublic: profile.isPublic ?? true,
            socialLinks: profile.socialLinks || null,
            preferences: profile.preferences || null,
            updatedAt: new Date(),
          },
        });
        stats.profiles++;
      } catch (error) {
        const errorMsg = `Failed to migrate profile ${profile.username}: ${error instanceof Error ? error.message : String(error)}`;
        stats.errors.push(errorMsg);
        console.error('❌', errorMsg);
      }
    }

    console.log(`✅ Migrated ${stats.profiles} profiles`);
  } catch (error) {
    const errorMsg = `Failed to migrate profiles: ${error instanceof Error ? error.message : String(error)}`;
    stats.errors.push(errorMsg);
    console.error('❌', errorMsg);
  }
}

async function migrateVideos(
  mongoDb: any,
  stats: MigrationStats
): Promise<void> {
  try {
    console.log('🔄 Migrating videos...');

    const videos = await mongoDb.collection('videos').find({}).toArray();
    console.log(`Found ${videos.length} videos to migrate`);

    for (const video of videos) {
      try {
        // Find the corresponding account
        const account = await prisma.account.findUnique({
          where: { walletAddress: video.walletAddress },
        });

        if (!account) {
          stats.errors.push(
            `No account found for video with wallet: ${video.walletAddress}`
          );
          continue;
        }

        // Map status from string to enum
        let status: VideoStatus = VideoStatus.PENDING;
        if (video.status) {
          const statusMap: Record<string, VideoStatus> = {
            pending: VideoStatus.PENDING,
            processing: VideoStatus.PROCESSING,
            completed: VideoStatus.COMPLETED,
            failed: VideoStatus.FAILED,
            PENDING: VideoStatus.PENDING,
            PROCESSING: VideoStatus.PROCESSING,
            COMPLETED: VideoStatus.COMPLETED,
            FAILED: VideoStatus.FAILED,
          };
          status = statusMap[video.status] || VideoStatus.PENDING;
        }

        await prisma.video.create({
          data: {
            accountId: account.id,
            nftId: video.nftId,
            jobId: video.jobId,
            status: status,
            title: video.title || null,
            description: video.description || null,
            videoUrl: video.videoUrl || null,
            thumbnailUrl: video.thumbnailUrl || null,
            duration: video.duration || null,
            fileSize: video.fileSize || null,
            resolution: video.resolution || null,
            isPublic: video.isPublic ?? false,
            metadata: video.metadata || null,
            errorMessage: video.errorMessage || null,
            createdAt: video.createdAt || new Date(),
            updatedAt: video.updatedAt || new Date(),
          },
        });
        stats.videos++;
      } catch (error) {
        const errorMsg = `Failed to migrate video ${video.jobId}: ${error instanceof Error ? error.message : String(error)}`;
        stats.errors.push(errorMsg);
        console.error('❌', errorMsg);
      }
    }

    console.log(`✅ Migrated ${stats.videos} videos`);
  } catch (error) {
    const errorMsg = `Failed to migrate videos: ${error instanceof Error ? error.message : String(error)}`;
    stats.errors.push(errorMsg);
    console.error('❌', errorMsg);
  }
}

async function migrateNotifications(
  mongoDb: any,
  stats: MigrationStats
): Promise<void> {
  try {
    console.log('🔄 Migrating notifications...');

    const notifications = await mongoDb
      .collection('notifications')
      .find({})
      .toArray();
    console.log(`Found ${notifications.length} notifications to migrate`);

    for (const notification of notifications) {
      try {
        // Find the corresponding account
        const account = await prisma.account.findUnique({
          where: { walletAddress: notification.walletAddress },
        });

        if (!account) {
          stats.errors.push(
            `No account found for notification with wallet: ${notification.walletAddress}`
          );
          continue;
        }

        // Map notification type
        let type: NotificationType = NotificationType.SYSTEM_ANNOUNCEMENT;
        if (notification.type) {
          const typeMap: Record<string, NotificationType> = {
            video_completed: NotificationType.VIDEO_COMPLETED,
            video_failed: NotificationType.VIDEO_FAILED,
            system_announcement: NotificationType.SYSTEM_ANNOUNCEMENT,
            nft_verified: NotificationType.NFT_VERIFIED,
            profile_update: NotificationType.PROFILE_UPDATE,
            mission_completed: NotificationType.MISSION_COMPLETED,
            VIDEO_COMPLETED: NotificationType.VIDEO_COMPLETED,
            VIDEO_FAILED: NotificationType.VIDEO_FAILED,
            SYSTEM_ANNOUNCEMENT: NotificationType.SYSTEM_ANNOUNCEMENT,
            NFT_VERIFIED: NotificationType.NFT_VERIFIED,
            PROFILE_UPDATE: NotificationType.PROFILE_UPDATE,
            MISSION_COMPLETED: NotificationType.MISSION_COMPLETED,
          };
          type =
            typeMap[notification.type] || NotificationType.SYSTEM_ANNOUNCEMENT;
        }

        await prisma.notification.create({
          data: {
            accountId: account.id,
            type: type,
            title: notification.title,
            message: notification.message,
            data: notification.data || null,
            isRead: notification.isRead ?? false,
            readAt: notification.readAt || null,
            createdAt: notification.createdAt || new Date(),
            updatedAt: notification.updatedAt || new Date(),
          },
        });
        stats.notifications++;
      } catch (error) {
        const errorMsg = `Failed to migrate notification ${notification._id}: ${error instanceof Error ? error.message : String(error)}`;
        stats.errors.push(errorMsg);
        console.error('❌', errorMsg);
      }
    }

    console.log(`✅ Migrated ${stats.notifications} notifications`);
  } catch (error) {
    const errorMsg = `Failed to migrate notifications: ${error instanceof Error ? error.message : String(error)}`;
    stats.errors.push(errorMsg);
    console.error('❌', errorMsg);
  }
}

async function migrateNFTOwnership(
  mongoDb: any,
  stats: MigrationStats
): Promise<void> {
  try {
    console.log('🔄 Migrating NFT ownership records...');

    const nftRecords = await mongoDb
      .collection('nft_ownership')
      .find({})
      .toArray();
    console.log(`Found ${nftRecords.length} NFT ownership records to migrate`);

    for (const nft of nftRecords) {
      try {
        await prisma.nFTOwnership.upsert({
          where: { nftId: nft.nftId },
          create: {
            nftId: nft.nftId,
            walletAddress: nft.walletAddress,
            contractAddress: nft.contractAddress,
            tokenId: nft.tokenId,
            verified: nft.verified ?? false,
            lastVerified: nft.lastVerified || null,
            metadata: nft.metadata || null,
            createdAt: nft.createdAt || new Date(),
            updatedAt: nft.updatedAt || new Date(),
          },
          update: {
            walletAddress: nft.walletAddress,
            contractAddress: nft.contractAddress,
            tokenId: nft.tokenId,
            verified: nft.verified ?? false,
            lastVerified: nft.lastVerified || null,
            metadata: nft.metadata || null,
            updatedAt: new Date(),
          },
        });
        stats.nftOwnership++;
      } catch (error) {
        const errorMsg = `Failed to migrate NFT ${nft.nftId}: ${error instanceof Error ? error.message : String(error)}`;
        stats.errors.push(errorMsg);
        console.error('❌', errorMsg);
      }
    }

    console.log(`✅ Migrated ${stats.nftOwnership} NFT ownership records`);
  } catch (error) {
    const errorMsg = `Failed to migrate NFT ownership: ${error instanceof Error ? error.message : String(error)}`;
    stats.errors.push(errorMsg);
    console.error('❌', errorMsg);
  }
}

// CLI execution
if (require.main === module) {
  migrateExistingData()
    .then((stats) => {
      console.log('🎉 Migration completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Migration failed:', error);
      process.exit(1);
    });
}

export default migrateExistingData;
