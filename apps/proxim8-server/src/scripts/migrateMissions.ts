/**
 * Migration script to convert TrainingMissionDeployment records to MissionDeployment records
 * 
 * This script should be run once to migrate existing training mission data
 * to the new general mission system.
 */

import mongoose from 'mongoose';
import TrainingMissionDeployment from '../models/game/TrainingMissionDeployment';
import MissionDeployment from '../models/game/MissionDeployment';

async function migrateMissions() {
  try {
    console.log('🔄 Starting mission migration...');
    
    // Connect to MongoDB
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI environment variable is required');
    }
    
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    // Get all training mission deployments
    const trainingDeployments = await TrainingMissionDeployment.find({});
    console.log(`📊 Found ${trainingDeployments.length} training deployments to migrate`);
    
    let migratedCount = 0;
    let skippedCount = 0;
    
    for (const deployment of trainingDeployments) {
      try {
        // Check if already migrated
        const existingMigration = await MissionDeployment.findOne({
          deploymentId: deployment.deploymentId
        });
        
        if (existingMigration) {
          console.log(`⏭️  Skipping ${deployment.deploymentId} - already migrated`);
          skippedCount++;
          continue;
        }
        
        // Create new MissionDeployment record
        const newDeployment = new MissionDeployment({
          deploymentId: deployment.deploymentId,
          missionType: 'training',
          missionId: deployment.missionId,
          agentId: deployment.agentId,
          proxim8Id: deployment.proxim8Id,
          
          // Map approach (legacy training used low/medium/high)
          approach: deployment.approach,
          deployedAt: deployment.deployedAt,
          completesAt: deployment.completesAt,
          duration: deployment.duration,
          
          status: deployment.status,
          currentPhase: deployment.currentPhase,
          finalSuccessRate: deployment.finalSuccessRate,
          
          // Map phase outcomes
          phaseOutcomes: deployment.phaseOutcomes.map((phase: any) => ({
            phaseId: phase.phaseId,
            success: phase.success,
            narrative: phase.narrative,
            completedAt: phase.completedAt
          })),
          
          // Map result if exists
          result: deployment.result ? {
            overallSuccess: deployment.result.overallSuccess,
            finalNarrative: deployment.result.finalNarrative,
            imageUrl: deployment.result.imageUrl,
            timelineShift: deployment.result.timelineShift,
            influenceType: deployment.result.overallSuccess ? 'green_loom' : 'grey_loom',
            rewards: {
              timelinePoints: deployment.result.rewards.timelinePoints,
              experience: deployment.result.rewards.experience,
              loreFragments: deployment.result.rewards.loreFragments || [],
              memoryCaches: [],
              achievements: deployment.result.rewards.achievements || []
            }
          } : undefined,
          
          createdAt: deployment.createdAt,
          updatedAt: deployment.updatedAt,
          completedAt: deployment.completesAt
        });
        
        await newDeployment.save();
        console.log(`✅ Migrated ${deployment.deploymentId} (${deployment.missionId})`);
        migratedCount++;
        
      } catch (error) {
        console.error(`❌ Error migrating ${deployment.deploymentId}:`, error);
      }
    }
    
    console.log('\n📈 Migration Summary:');
    console.log(`✅ Successfully migrated: ${migratedCount}`);
    console.log(`⏭️  Skipped (already migrated): ${skippedCount}`);
    console.log(`❌ Errors: ${trainingDeployments.length - migratedCount - skippedCount}`);
    
    console.log('\n🎯 Migration completed!');
    console.log('💡 The training-specific routes will continue to work alongside the new general mission system.');
    console.log('💡 You can now use /api/missions endpoints for both training and timeline missions.');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

// Run migration if called directly
if (require.main === module) {
  // Load environment variables
  require('dotenv').config();
  
  migrateMissions()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}

export default migrateMissions;