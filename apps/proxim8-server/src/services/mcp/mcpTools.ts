import { z } from 'zod';
import mongoose from 'mongoose';
import TrainingMissionDeployment from '../../models/game/TrainingMissionDeployment';
import Agent from '../../models/game/Agent';
import Lore from '../../models/Lore';
import { TRAINING_MISSIONS } from '../../data/trainingMissions';
import { logger } from '../../utils/logger';

// Schema definitions for MCP tools
export const GetMissionsSchema = z.object({
  agentId: z.string().optional().describe("Filter missions by agent wallet address"),
  status: z.enum(['active', 'completed', 'abandoned']).optional().describe("Filter by mission status"),
  missionId: z.string().optional().describe("Get specific mission by ID"),
});

export const CreateMissionSchema = z.object({
  missionData: z.object({
    missionId: z.string().describe("Unique mission identifier"),
    sequence: z.number().describe("Mission sequence number"),
    title: z.string().describe("Title of the mission"),
    date: z.string().describe("Date string for the mission"),
    location: z.string().describe("Mission location"),
    description: z.string().describe("Mission description"),
    imagePrompt: z.string().describe("AI image generation prompt for mission visual"),
    duration: z.number().describe("Mission duration in milliseconds"),
    briefing: z.object({
      text: z.string().describe("Mission briefing text"),
      currentBalance: z.number().describe("Current balance of timeline points"),
      threatLevel: z.enum(["low", "medium", "high", "critical"]).describe("Mission threat level"),
    }).describe("Mission briefing object"),
    approaches: z.array(z.object({
      type: z.enum(["low", "medium", "high"]).describe("Approach difficulty type"),
      name: z.string().describe("Name of the approach"),
      description: z.string().describe("Description of the approach"),
      successRate: z.object({
        min: z.number().describe("Minimum success rate"),
        max: z.number().describe("Maximum success rate"),
      }).describe("Success rate range"),
      timelineShift: z.object({
        min: z.number().describe("Minimum timeline shift"),
        max: z.number().describe("Maximum timeline shift"),
      }).describe("Timeline shift range"),
    })).describe("Available approaches for the mission"),
    compatibility: z.object({
      preferred: z.array(z.enum(["analytical", "aggressive", "diplomatic", "adaptive"])).describe("Preferred agent types"),
      bonus: z.number().describe("Compatibility bonus"),
      penalty: z.number().describe("Compatibility penalty"),
    }).describe("Agent type compatibility"),
    phases: z.array(z.object({
      id: z.number().describe("Phase ID"),
      name: z.string().describe("Phase name"),
      durationPercent: z.number().describe("Duration as percentage of total mission"),
      narrativeTemplates: z.object({
        success: z.string().describe("Success narrative template"),
        failure: z.string().describe("Failure narrative template"),
      }).describe("Narrative templates"),
    })).describe("Mission phases"),
  }).describe("Complete mission data object"),
});

export const DeployMissionSchema = z.object({
  agentId: z.string().describe("Agent wallet address"),
  missionId: z.string().describe("Mission ID to deploy"),
  proxim8Id: z.string().describe("Proxim8 NFT ID to deploy"),
  approach: z.enum(['low', 'medium', 'high']).describe("Mission approach level"),
});

export const GetDeploymentSchema = z.object({
  deploymentId: z.string().describe("Deployment ID to retrieve"),
  agentId: z.string().optional().describe("Filter by agent wallet address"),
});

export const GetLoreSchema = z.object({
  nftId: z.string().optional().describe("Filter by specific NFT ID"),
  sourceType: z.enum(['ai_generated', 'manual', 'mission_generated']).optional().describe("Filter by lore source type"),
  claimed: z.boolean().optional().describe("Filter by claimed status"),
  missionId: z.string().optional().describe("Filter by mission ID for mission-generated lore"),
});

export const GetMissionStatsSchema = z.object({
  agentId: z.string().optional().describe("Filter stats by specific agent"),
});

export const UpdateMissionSchema = z.object({
  missionId: z.string().describe("Mission ID to update"),
  updates: z.record(z.any()).describe("Updates to apply to the mission"),
});

// MCP tool implementations
export const mcpTools = {
  // Get missions tool
  async getMissions({ agentId, status, missionId }: z.infer<typeof GetMissionsSchema>) {
    logger.info("Executing get_missions tool");
    try {
      let missions = TRAINING_MISSIONS;

      // Apply filters
      if (missionId) {
        missions = missions.filter(m => m.missionId === missionId);
      }

      // For status filter, we'd need to check deployments
      if (status && agentId) {
        const deployments = await TrainingMissionDeployment.find({
          agentId,
          status
        });
        const activeMissionIds = deployments.map(d => d.missionId);
        missions = missions.filter(m => activeMissionIds.includes(m.missionId));
      }

      return {
        content: [{
          type: "text" as const,
          text: JSON.stringify(missions, null, 2)
        }],
      };
    } catch (error) {
      logger.error("Error in get_missions tool:", error);
      return {
        content: [{
          type: "text" as const,
          text: `Error retrieving missions: ${error instanceof Error ? error.message : String(error)}`
        }],
        isError: true,
      };
    }
  },

  // Create mission tool
  async createMission({ missionData }: z.infer<typeof CreateMissionSchema>) {
    logger.info("Executing create_mission tool");
    try {
      if (TRAINING_MISSIONS.find(m => m.missionId === missionData.missionId)) {
        return {
          content: [{
            type: "text" as const,
            text: `Mission already exists with ID: ${missionData.missionId}`
          }],
          isError: true,
        };
      }

      TRAINING_MISSIONS.push({
        ...missionData
      });

      return {
        content: [{
          type: "text" as const,
          text: `Mission created successfully: ${missionData.missionId}\n${JSON.stringify(missionData, null, 2)}`
        }],
      };
    } catch (error) {
      logger.error("Error in create_mission tool:", error);
      return {
        content: [{
          type: "text" as const,
          text: `Error creating mission: ${error instanceof Error ? error.message : String(error)}`
        }],
        isError: true,
      };
    }
  },

  // Deploy mission tool
  async deployMission({ agentId, missionId, proxim8Id, approach }: z.infer<typeof DeployMissionSchema>) {
    logger.info("Executing deploy_mission tool");
    try {
      const missionTemplate = TRAINING_MISSIONS.find(m => m.missionId === missionId);
      if (!missionTemplate) {
        return {
          content: [{
            type: "text" as const,
            text: `Mission not found: ${missionId}`
          }],
          isError: true,
        };
      }

      const completesAt = new Date(Date.now() + missionTemplate.duration);
      const deployment = new TrainingMissionDeployment({
        deploymentId: new mongoose.Types.ObjectId().toString(),
        agentId,
        missionId,
        proxim8Id,
        approach,
        deployedAt: new Date(),
        completesAt,
        status: 'active'
      });

      await deployment.save();

      return {
        content: [{
          type: "text" as const,
          text: `Mission deployed successfully!\nDeployment ID: ${deployment.deploymentId}\nMission: ${missionTemplate.title}\nProxim8: ${proxim8Id}\nApproach: ${approach}\nCompletes at: ${completesAt.toISOString()}`
        }],
      };
    } catch (error) {
      logger.error("Error in deploy_mission tool:", error);
      return {
        content: [{
          type: "text" as const,
          text: `Error deploying mission: ${error instanceof Error ? error.message : String(error)}`
        }],
        isError: true,
      };
    }
  },

  // Get deployment tool
  async getDeployment({ deploymentId, agentId }: z.infer<typeof GetDeploymentSchema>) {
    logger.info("Executing get_deployment tool");
    try {
      const query: any = { deploymentId };
      if (agentId) query.agentId = agentId;

      const deployment = await TrainingMissionDeployment.findOne(query);
      if (!deployment) {
        return {
          content: [{
            type: "text" as const,
            text: `Deployment not found: ${deploymentId}`
          }],
          isError: true,
        };
      }

      return {
        content: [{
          type: "text" as const,
          text: JSON.stringify(deployment, null, 2)
        }],
      };
    } catch (error) {
      logger.error("Error in get_deployment tool:", error);
      return {
        content: [{
          type: "text" as const,
          text: `Error retrieving deployment: ${error instanceof Error ? error.message : String(error)}`
        }],
        isError: true,
      };
    }
  },

  // Get active deployments tool
  async getActiveDeployments() {
    logger.info("Executing get_active_deployments tool");
    try {
      const activeDeployments = await TrainingMissionDeployment.find({
        status: 'active',
        completesAt: { $gt: new Date() }
      });

      return {
        content: [{
          type: "text" as const,
          text: JSON.stringify(activeDeployments, null, 2)
        }],
      };
    } catch (error) {
      logger.error("Error in get_active_deployments tool:", error);
      return {
        content: [{
          type: "text" as const,
          text: `Error retrieving active deployments: ${error instanceof Error ? error.message : String(error)}`
        }],
        isError: true,
      };
    }
  },

  // Get lore tool
  async getLore({ nftId, sourceType, claimed, missionId }: z.infer<typeof GetLoreSchema>) {
    logger.info("Executing get_lore tool");
    try {
      const query: any = {};
      if (nftId) query.nftId = nftId;
      if (sourceType) query.sourceType = sourceType;
      if (claimed !== undefined) query.claimed = claimed;
      if (missionId) query.missionId = missionId;

      const lore = await Lore.find(query);

      return {
        content: [{
          type: "text" as const,
          text: JSON.stringify(lore, null, 2)
        }],
      };
    } catch (error) {
      logger.error("Error in get_lore tool:", error);
      return {
        content: [{
          type: "text" as const,
          text: `Error retrieving lore: ${error instanceof Error ? error.message : String(error)}`
        }],
        isError: true,
      };
    }
  },

  // Get mission stats tool
  async getMissionStats({ agentId }: z.infer<typeof GetMissionStatsSchema>) {
    logger.info("Executing get_mission_stats tool");
    try {
      const query: any = {};
      if (agentId) query.agentId = agentId;

      const deployments = await TrainingMissionDeployment.find(query);
      const stats = {
        totalDeployments: deployments.length,
        activeDeployments: deployments.filter(d => d.status === 'active').length,
        completedDeployments: deployments.filter(d => d.status === 'completed').length,
        missionBreakdown: deployments.reduce((acc: any, deployment) => {
          const mission = TRAINING_MISSIONS.find(m => m.missionId === deployment.missionId);
          const missionName = mission?.title || 'Unknown Mission';
          if (!acc[missionName]) acc[missionName] = 0;
          acc[missionName]++;
          return acc;
        }, {}),
        recentActivity: deployments
          .sort((a, b) => new Date(b.deployedAt).getTime() - new Date(a.deployedAt).getTime())
          .slice(0, 5)
          .map(d => ({
            deploymentId: d.deploymentId,
            missionId: d.missionId,
            status: d.status,
            deployedAt: d.deployedAt,
            completesAt: d.completesAt
          }))
      };

      return {
        content: [{
          type: "text" as const,
          text: JSON.stringify(stats, null, 2)
        }],
      };
    } catch (error) {
      logger.error("Error in get_mission_stats tool:", error);
      return {
        content: [{
          type: "text" as const,
          text: `Error retrieving mission stats: ${error instanceof Error ? error.message : String(error)}`
        }],
        isError: true,
      };
    }
  },

  // Update mission tool
  async updateMission({ missionId, updates }: z.infer<typeof UpdateMissionSchema>) {
    logger.info("Executing update_mission tool");
    try {
      const missionIndex = TRAINING_MISSIONS.findIndex(m => m.missionId === missionId);
      if (missionIndex === -1) {
        return {
          content: [{
            type: "text" as const,
            text: `Mission not found: ${missionId}`
          }],
          isError: true,
        };
      }

      TRAINING_MISSIONS[missionIndex] = {
        ...TRAINING_MISSIONS[missionIndex],
        ...updates
      };

      return {
        content: [{
          type: "text" as const,
          text: `Mission updated successfully: ${missionId}\n${JSON.stringify(TRAINING_MISSIONS[missionIndex], null, 2)}`
        }],
      };
    } catch (error) {
      logger.error("Error in update_mission tool:", error);
      return {
        content: [{
          type: "text" as const,
          text: `Error updating mission: ${error instanceof Error ? error.message : String(error)}`
        }],
        isError: true,
      };
    }
  }
};