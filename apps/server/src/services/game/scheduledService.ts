import { DeploymentStatus } from '../../generated/prisma';
import { prisma } from '../prisma.service';
import { AIService } from './aiService';
import { GameAgentService } from './gameAgentService';
import { MissionService } from './missionService';

export interface ScheduledTaskResult {
  taskName: string;
  executedAt: Date;
  affectedRecords: number;
  details: string;
  errors?: string[];
}

export class ScheduledService {
  /**
   * Complete all missions that have reached their completion time
   */
  static async completeExpiredMissions(): Promise<ScheduledTaskResult> {
    const startTime = new Date();
    const errors: string[] = [];
    let completedCount = 0;

    try {
      // Find all active missions that should be completed
      const expiredMissions = await prisma.trainingMissionDeployment.findMany({
        where: {
          status: DeploymentStatus.ACTIVE,
          completesAt: {
            lte: new Date(),
          },
        },
        include: {
          gameAgent: true,
          gameProxim8: true,
        },
      });

      console.log(
        `Found ${expiredMissions.length} expired missions to complete`
      );

      for (const deployment of expiredMissions) {
        try {
          // Complete the mission
          await MissionService.completeMission(deployment.deploymentId);

          // Update agent rank if needed
          await GameAgentService.updateAgentRank(deployment.gameAgentId);

          // Check for Proxim8 level ups
          await GameAgentService.checkAndLevelUpProxim8(
            deployment.gameProxim8Id
          );

          completedCount++;
          console.log(
            `Completed mission ${deployment.deploymentId} for agent ${deployment.gameAgentId}`
          );
        } catch (error) {
          const errorMsg = `Failed to complete mission ${deployment.deploymentId}: ${error instanceof Error ? error.message : 'Unknown error'}`;
          errors.push(errorMsg);
          console.error(errorMsg);
        }
      }

      return {
        taskName: 'completeExpiredMissions',
        executedAt: startTime,
        affectedRecords: completedCount,
        details: `Successfully completed ${completedCount} missions${errors.length > 0 ? `, with ${errors.length} errors` : ''}`,
        errors: errors.length > 0 ? errors : undefined,
      };
    } catch (error) {
      const errorMsg = `Critical error in completeExpiredMissions: ${error instanceof Error ? error.message : 'Unknown error'}`;
      return {
        taskName: 'completeExpiredMissions',
        executedAt: startTime,
        affectedRecords: 0,
        details: 'Task failed with critical error',
        errors: [errorMsg],
      };
    }
  }

  /**
   * Update mission phases for active deployments
   */
  static async updateMissionPhases(): Promise<ScheduledTaskResult> {
    const startTime = new Date();
    const errors: string[] = [];
    let updatedCount = 0;

    try {
      // Find all active missions
      const activeMissions = await prisma.trainingMissionDeployment.findMany({
        where: {
          status: DeploymentStatus.ACTIVE,
        },
        include: {
          gameProxim8: true,
        },
      });

      for (const deployment of activeMissions) {
        try {
          const progress = MissionService.getMissionProgress(deployment);
          const newPhase = progress.currentPhase;

          // Only update if phase has changed
          if (newPhase !== deployment.currentPhase && newPhase <= 5) {
            await prisma.trainingMissionDeployment.update({
              where: { id: deployment.id },
              data: { currentPhase: newPhase },
            });

            updatedCount++;
            console.log(
              `Updated mission ${deployment.deploymentId} to phase ${newPhase}`
            );
          }
        } catch (error) {
          const errorMsg = `Failed to update phase for mission ${deployment.deploymentId}: ${error instanceof Error ? error.message : 'Unknown error'}`;
          errors.push(errorMsg);
          console.error(errorMsg);
        }
      }

      return {
        taskName: 'updateMissionPhases',
        executedAt: startTime,
        affectedRecords: updatedCount,
        details: `Updated phases for ${updatedCount} missions${errors.length > 0 ? `, with ${errors.length} errors` : ''}`,
        errors: errors.length > 0 ? errors : undefined,
      };
    } catch (error) {
      const errorMsg = `Critical error in updateMissionPhases: ${error instanceof Error ? error.message : 'Unknown error'}`;
      return {
        taskName: 'updateMissionPhases',
        executedAt: startTime,
        affectedRecords: 0,
        details: 'Task failed with critical error',
        errors: [errorMsg],
      };
    }
  }

  /**
   * Clean up old completed missions (optional - for database maintenance)
   */
  static async cleanupOldMissions(
    olderThanDays: number = 30
  ): Promise<ScheduledTaskResult> {
    const startTime = new Date();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    try {
      const result = await prisma.trainingMissionDeployment.deleteMany({
        where: {
          status: {
            in: [DeploymentStatus.COMPLETED, DeploymentStatus.ABANDONED],
          },
          updatedAt: {
            lt: cutoffDate,
          },
        },
      });

      return {
        taskName: 'cleanupOldMissions',
        executedAt: startTime,
        affectedRecords: result.count,
        details: `Cleaned up ${result.count} missions older than ${olderThanDays} days`,
      };
    } catch (error) {
      const errorMsg = `Error in cleanupOldMissions: ${error instanceof Error ? error.message : 'Unknown error'}`;
      return {
        taskName: 'cleanupOldMissions',
        executedAt: startTime,
        affectedRecords: 0,
        details: 'Task failed',
        errors: [errorMsg],
      };
    }
  }

  /**
   * Generate AI narratives for completed phases
   */
  static async generatePendingNarratives(): Promise<ScheduledTaskResult> {
    const startTime = new Date();
    const errors: string[] = [];
    let generatedCount = 0;

    try {
      // Find deployments with phases that need narrative generation
      const activeMissions = await prisma.trainingMissionDeployment.findMany({
        where: {
          status: DeploymentStatus.ACTIVE,
        },
        include: {
          gameAgent: true,
          gameProxim8: true,
        },
      });

      for (const deployment of activeMissions) {
        try {
          const phaseOutcomes = deployment.phaseOutcomes as any[];
          let hasUpdates = false;

          for (let i = 0; i < phaseOutcomes.length; i++) {
            const phase = phaseOutcomes[i];
            const shouldReveal = MissionService.shouldRevealPhase(
              deployment,
              phase.phaseId
            );

            // Generate narrative if phase should be revealed but doesn't have one
            if (shouldReveal && !phase.narrative) {
              try {
                // Get mission template for context
                const missionTemplate =
                  require('../../data/trainingMissions').TRAINING_MISSIONS.find(
                    (m: any) => m.missionId === deployment.missionId
                  );

                if (missionTemplate) {
                  const narrative = await AIService.generatePhaseNarrative({
                    missionTemplate,
                    proxim8: deployment.gameProxim8,
                    approach: deployment.approach,
                    phaseId: phase.phaseId,
                    phaseSuccess: phase.success,
                    previousPhases: phaseOutcomes.slice(0, i),
                    agentCodename: deployment.gameAgent.codename || undefined,
                  });

                  phase.narrative = narrative.text;
                  phase.completedAt = new Date();
                  hasUpdates = true;
                  generatedCount++;
                }
              } catch (error) {
                console.error(
                  `Failed to generate narrative for phase ${phase.phaseId}:`,
                  error
                );
              }
            }
          }

          // Update deployment if narratives were generated
          if (hasUpdates) {
            await prisma.trainingMissionDeployment.update({
              where: { id: deployment.id },
              data: { phaseOutcomes: phaseOutcomes as any },
            });
          }
        } catch (error) {
          const errorMsg = `Failed to generate narratives for mission ${deployment.deploymentId}: ${error instanceof Error ? error.message : 'Unknown error'}`;
          errors.push(errorMsg);
        }
      }

      return {
        taskName: 'generatePendingNarratives',
        executedAt: startTime,
        affectedRecords: generatedCount,
        details: `Generated ${generatedCount} narratives${errors.length > 0 ? `, with ${errors.length} errors` : ''}`,
        errors: errors.length > 0 ? errors : undefined,
      };
    } catch (error) {
      const errorMsg = `Critical error in generatePendingNarratives: ${error instanceof Error ? error.message : 'Unknown error'}`;
      return {
        taskName: 'generatePendingNarratives',
        executedAt: startTime,
        affectedRecords: 0,
        details: 'Task failed with critical error',
        errors: [errorMsg],
      };
    }
  }

  /**
   * Run all scheduled tasks in sequence
   */
  static async runAllScheduledTasks(): Promise<ScheduledTaskResult[]> {
    const results: ScheduledTaskResult[] = [];

    console.log('🤖 Starting scheduled mission tasks...');

    // 1. Complete expired missions (most important)
    const completeResult = await ScheduledService.completeExpiredMissions();
    results.push(completeResult);
    console.log(`✅ Completed missions: ${completeResult.details}`);

    // 2. Update mission phases
    const phaseResult = await ScheduledService.updateMissionPhases();
    results.push(phaseResult);
    console.log(`🔄 Updated phases: ${phaseResult.details}`);

    // 3. Generate AI narratives (can fail without breaking the system)
    try {
      const narrativeResult =
        await ScheduledService.generatePendingNarratives();
      results.push(narrativeResult);
      console.log(`📝 Generated narratives: ${narrativeResult.details}`);
    } catch (error) {
      console.error(
        '⚠️ Narrative generation failed, continuing with other tasks'
      );
      results.push({
        taskName: 'generatePendingNarratives',
        executedAt: new Date(),
        affectedRecords: 0,
        details: 'Skipped due to error',
        errors: ['Task skipped due to critical error'],
      });
    }

    console.log('🏁 Scheduled tasks completed');

    return results;
  }

  /**
   * Health check for scheduled services
   */
  static async healthCheck(): Promise<{
    status: 'healthy' | 'error';
    details: string;
    lastRun?: Date;
  }> {
    try {
      // Check if there are any stuck missions (active for too long)
      const stuckMissions = await prisma.trainingMissionDeployment.count({
        where: {
          status: DeploymentStatus.ACTIVE,
          completesAt: {
            lt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 24 hours ago
          },
        },
      });

      if (stuckMissions > 0) {
        return {
          status: 'error',
          details: `Found ${stuckMissions} missions stuck in active state`,
        };
      }

      return {
        status: 'healthy',
        details: 'All missions processing normally',
      };
    } catch (error) {
      return {
        status: 'error',
        details: `Health check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }
}
