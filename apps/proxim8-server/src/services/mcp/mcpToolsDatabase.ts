import { z } from 'zod';
import mongoose from 'mongoose';
import TrainingMissionDeployment from '../../models/game/TrainingMissionDeployment';
import MissionTemplate from '../../models/game/MissionTemplate';
import Agent from '../../models/game/Agent';
import Lore from '../../models/Lore';
import { TRAINING_MISSIONS } from '../../data/trainingMissions';
import { logger } from '../../utils/logger';

// Enhanced schemas for database operations
export const CreateDatabaseMissionSchema = z.object({
  missionData: z.object({
    // Core identifiers
    templateId: z.string().describe("Unique template identifier"),
    missionType: z.enum(['training', 'timeline', 'critical', 'event']).describe("Mission type"),
    sequence: z.number().optional().describe("Sequence for training missions"),
    missionName: z.string().describe("Mission name"),
    category: z.string().describe("Mission category"),
    
    // Timeline context
    timeContext: z.object({
      yearRange: z.object({
        min: z.number(),
        max: z.number()
      }),
      era: z.enum(['early_resistance', 'consolidation', 'grey_zones', 'convergence']),
      historicalContext: z.string(),
      keyEvents: z.array(z.string())
    }).optional(),
    
    // Mission content
    briefingTemplate: z.string().describe("Mission briefing template"),
    description: z.string().describe("Mission description"),
    primaryApproach: z.enum(['aggressive', 'balanced', 'cautious']),
    
    // Approach configurations
    approaches: z.object({
      aggressive: z.object({
        name: z.string(),
        description: z.string(),
        duration: z.number(),
        baseSuccessRate: z.number(),
        riskLevel: z.enum(['high', 'extreme']),
        rewards: z.object({
          timelinePoints: z.number(),
          experience: z.number(),
          influenceMultiplier: z.number()
        }),
        narrativeTemplates: z.object({
          success: z.string(),
          failure: z.string()
        })
      }).optional(),
      balanced: z.object({
        name: z.string(),
        description: z.string(),
        duration: z.number(),
        baseSuccessRate: z.number(),
        riskLevel: z.enum(['medium', 'high']),
        rewards: z.object({
          timelinePoints: z.number(),
          experience: z.number(),
          influenceMultiplier: z.number()
        }),
        narrativeTemplates: z.object({
          success: z.string(),
          failure: z.string()
        })
      }).optional(),
      cautious: z.object({
        name: z.string(),
        description: z.string(),
        duration: z.number(),
        baseSuccessRate: z.number(),
        riskLevel: z.enum(['low', 'medium']),
        rewards: z.object({
          timelinePoints: z.number(),
          experience: z.number(),
          influenceMultiplier: z.number()
        }),
        narrativeTemplates: z.object({
          success: z.string(),
          failure: z.string()
        })
      }).optional()
    }),
    
    // Collaborative elements
    contributor: z.object({
      userId: z.string(),
      walletAddress: z.string(),
      contributionType: z.enum(['creator', 'editor', 'reviewer', 'community'])
    }),
    
    // Narrative elements
    narrativeThreads: z.array(z.string()).optional(),
    precedingMissions: z.array(z.string()).optional(),
    followingMissions: z.array(z.string()).optional(),
    
    // Reality engineering
    realityAnchors: z.array(z.object({
      anchorType: z.enum(['narrative', 'synchronicity', 'probability']),
      strength: z.number().min(1).max(10),
      description: z.string()
    })).optional()
  })
});

export const GetDatabaseMissionsSchema = z.object({
  missionType: z.enum(['training', 'timeline', 'critical', 'event']).optional(),
  year: z.number().optional().describe("Filter by timeline year"),
  era: z.enum(['early_resistance', 'consolidation', 'grey_zones', 'convergence']).optional(),
  narrativeThread: z.string().optional().describe("Filter by narrative thread"),
  contributor: z.string().optional().describe("Filter by contributor wallet"),
  status: z.enum(['draft', 'review', 'approved', 'active', 'archived']).optional(),
  templateId: z.string().optional().describe("Get specific mission template")
});

export const UpdateDatabaseMissionSchema = z.object({
  templateId: z.string().describe("Mission template ID to update"),
  updates: z.record(z.any()).describe("Updates to apply"),
  contributor: z.object({
    userId: z.string(),
    walletAddress: z.string(),
    contributionType: z.enum(['creator', 'editor', 'reviewer', 'community']),
    changeDescription: z.string()
  })
});

export const GetMissionHistorySchema = z.object({
  templateId: z.string().describe("Mission template ID")
});

// Enhanced MCP tools with database persistence
export const mcpDatabaseTools = {
  // Get missions from database
  async getDatabaseMissions({ missionType, year, era, narrativeThread, contributor, status, templateId }: z.infer<typeof GetDatabaseMissionsSchema>) {
    logger.info("Executing get_database_missions tool");
    try {
      let query: any = { isActive: true };
      
      if (templateId) {
        query.templateId = templateId;
      }
      
      if (missionType) {
        query.missionType = missionType;
      }
      
      if (year) {
        query['timeContext.yearRange.min'] = { $lte: year };
        query['timeContext.yearRange.max'] = { $gte: year };
      }
      
      if (era) {
        query['timeContext.era'] = era;
      }
      
      if (narrativeThread) {
        query.narrativeThreads = narrativeThread;
      }
      
      if (contributor) {
        query['contributors.walletAddress'] = contributor;
      }
      
      if (status) {
        query.status = status;
      }

      const missions = await MissionTemplate.find(query).sort({ 
        'timeContext.yearRange.min': 1, 
        sequence: 1 
      });

      return {
        content: [{
          type: "text" as const,
          text: JSON.stringify({
            total: missions.length,
            missions: missions.map(m => ({
              templateId: m.templateId,
              missionName: m.missionName,
              missionType: m.missionType,
              category: m.category,
              timeContext: m.timeContext,
              status: m.status,
              contributors: m.contributors?.length || 0,
              communityMetrics: m.communityMetrics
            }))
          }, null, 2)
        }],
      };
    } catch (error) {
      logger.error("Error in get_database_missions tool:", error);
      return {
        content: [{
          type: "text" as const,
          text: `Error retrieving missions: ${error instanceof Error ? error.message : String(error)}`
        }],
        isError: true,
      };
    }
  },

  // Create mission in database
  async createDatabaseMission({ missionData }: z.infer<typeof CreateDatabaseMissionSchema>) {
    logger.info("Executing create_database_mission tool");
    try {
      // Check if mission already exists
      const existingMission = await MissionTemplate.findOne({ 
        templateId: missionData.templateId 
      });
      
      if (existingMission) {
        return {
          content: [{
            type: "text" as const,
            text: `Mission template already exists with ID: ${missionData.templateId}`
          }],
          isError: true,
        };
      }

      // Create new mission template
      const newMission = new MissionTemplate({
        ...missionData,
        contributors: [missionData.contributor],
        communityMetrics: {
          totalVotes: 0,
          approvalRating: 0,
          deploymentCount: 0,
          averageSuccessRate: 0,
          playerFeedback: 0
        },
        versionHistory: [{
          version: "v1.0.0",
          timestamp: new Date(),
          changes: "Initial mission creation",
          contributor: missionData.contributor.userId,
          approved: false
        }],
        status: "draft",
        isActive: true
      });

      await newMission.save();

      return {
        content: [{
          type: "text" as const,
          text: `Database mission created successfully: ${missionData.templateId}\n${JSON.stringify({
            templateId: newMission.templateId,
            missionName: newMission.missionName,
            missionType: newMission.missionType,
            status: newMission.status,
            contributor: missionData.contributor.userId
          }, null, 2)}`
        }],
      };
    } catch (error) {
      logger.error("Error in create_database_mission tool:", error);
      return {
        content: [{
          type: "text" as const,
          text: `Error creating mission: ${error instanceof Error ? error.message : String(error)}`
        }],
        isError: true,
      };
    }
  },

  // Update mission in database
  async updateDatabaseMission({ templateId, updates, contributor }: z.infer<typeof UpdateDatabaseMissionSchema>) {
    logger.info("Executing update_database_mission tool");
    try {
      const mission = await MissionTemplate.findOne({ templateId });
      if (!mission) {
        return {
          content: [{
            type: "text" as const,
            text: `Mission template not found: ${templateId}`
          }],
          isError: true,
        };
      }

      // Apply updates
      Object.keys(updates).forEach(key => {
        if (key !== '_id' && key !== '__v') {
          (mission as any)[key] = updates[key];
        }
      });

      // Add contributor to history
      if (!mission.contributors) {
        mission.contributors = [];
      }
      mission.contributors.push({
        userId: contributor.userId,
        walletAddress: contributor.walletAddress,
        contributionType: contributor.contributionType,
        timestamp: new Date(),
        contribution: contributor.changeDescription
      });

      // Add to version history
      if (!mission.versionHistory) {
        mission.versionHistory = [];
      }
      mission.versionHistory.push({
        version: `v${mission.versionHistory.length + 1}.0.0`,
        timestamp: new Date(),
        changes: contributor.changeDescription,
        contributor: contributor.userId,
        approved: false
      });

      await mission.save();

      return {
        content: [{
          type: "text" as const,
          text: `Mission updated successfully: ${templateId}\nChanges: ${contributor.changeDescription}\nContributor: ${contributor.userId}`
        }],
      };
    } catch (error) {
      logger.error("Error in update_database_mission tool:", error);
      return {
        content: [{
          type: "text" as const,
          text: `Error updating mission: ${error instanceof Error ? error.message : String(error)}`
        }],
        isError: true,
      };
    }
  },

  // Get mission contribution history
  async getMissionHistory({ templateId }: { templateId: string }) {
    logger.info("Executing get_mission_history tool");
    try {
      const mission = await MissionTemplate.findOne({ templateId });
      if (!mission) {
        return {
          content: [{
            type: "text" as const,
            text: `Mission template not found: ${templateId}`
          }],
          isError: true,
        };
      }

      const history = {
        templateId: mission.templateId,
        missionName: mission.missionName,
        status: mission.status,
        totalContributors: mission.contributors?.length || 0,
        contributors: mission.contributors || [],
        versionHistory: mission.versionHistory || [],
        communityMetrics: mission.communityMetrics || {},
        narrativeThreads: mission.narrativeThreads || [],
        realityAnchors: mission.realityAnchors || []
      };

      return {
        content: [{
          type: "text" as const,
          text: JSON.stringify(history, null, 2)
        }],
      };
    } catch (error) {
      logger.error("Error in get_mission_history tool:", error);
      return {
        content: [{
          type: "text" as const,
          text: `Error retrieving mission history: ${error instanceof Error ? error.message : String(error)}`
        }],
        isError: true,
      };
    }
  },

  // Migrate existing training missions to database
  async migrateTrainingMissions() {
    logger.info("Executing migrate_training_missions tool");
    try {
      let migratedCount = 0;
      let skippedCount = 0;

      for (const trainingMission of TRAINING_MISSIONS) {
        // Check if already exists
        const existing = await MissionTemplate.findOne({ 
          templateId: trainingMission.missionId 
        });
        
        if (existing) {
          skippedCount++;
          continue;
        }

        // Convert training mission to database format
        const dbMission = new MissionTemplate({
          templateId: trainingMission.missionId,
          missionType: 'training',
          sequence: trainingMission.sequence,
          missionName: trainingMission.title,
          category: 'training',
          briefingTemplate: trainingMission.briefing.text,
          description: trainingMission.description,
          primaryApproach: 'balanced',
          approaches: {
            cautious: {
              name: trainingMission.approaches[0].name,
              description: trainingMission.approaches[0].description,
              duration: trainingMission.duration,
              baseSuccessRate: (trainingMission.approaches[0].successRate.min + trainingMission.approaches[0].successRate.max) / 2,
              riskLevel: 'low',
              rewards: {
                timelinePoints: trainingMission.approaches[0].timelineShift.min,
                experience: 25,
                influenceMultiplier: 1.0
              },
              narrativeTemplates: {
                success: `${trainingMission.title} completed with cautious approach.`,
                failure: `${trainingMission.title} failed with cautious approach.`
              }
            },
            balanced: {
              name: trainingMission.approaches[1].name,
              description: trainingMission.approaches[1].description,
              duration: trainingMission.duration,
              baseSuccessRate: (trainingMission.approaches[1].successRate.min + trainingMission.approaches[1].successRate.max) / 2,
              riskLevel: 'medium',
              rewards: {
                timelinePoints: trainingMission.approaches[1].timelineShift.min,
                experience: 50,
                influenceMultiplier: 1.2
              },
              narrativeTemplates: {
                success: `${trainingMission.title} completed with balanced approach.`,
                failure: `${trainingMission.title} failed with balanced approach.`
              }
            },
            aggressive: {
              name: trainingMission.approaches[2].name,
              description: trainingMission.approaches[2].description,
              duration: trainingMission.duration,
              baseSuccessRate: (trainingMission.approaches[2].successRate.min + trainingMission.approaches[2].successRate.max) / 2,
              riskLevel: 'high',
              rewards: {
                timelinePoints: trainingMission.approaches[2].timelineShift.min,
                experience: 100,
                influenceMultiplier: 1.5
              },
              narrativeTemplates: {
                success: `${trainingMission.title} completed with aggressive approach.`,
                failure: `${trainingMission.title} failed with aggressive approach.`
              }
            }
          },
          contributors: [{
            userId: 'system',
            walletAddress: 'system',
            contributionType: 'creator',
            timestamp: new Date(),
            contribution: 'Original training mission creation'
          }],
          narrativeThreads: ['training', 'timeline_wars'],
          realityAnchors: [{
            anchorType: 'narrative',
            strength: 5,
            description: `Core training mission: ${trainingMission.title}`
          }],
          communityMetrics: {
            totalVotes: 0,
            approvalRating: 1.0,
            deploymentCount: 0,
            averageSuccessRate: 0,
            playerFeedback: 0
          },
          versionHistory: [{
            version: "v1.0.0",
            timestamp: new Date(),
            changes: "Migrated from training missions array",
            contributor: "system",
            approved: true
          }],
          status: "active",
          isActive: true
        });

        await dbMission.save();
        migratedCount++;
      }

      return {
        content: [{
          type: "text" as const,
          text: `Training missions migration complete!\nMigrated: ${migratedCount}\nSkipped (already exist): ${skippedCount}\nTotal in database: ${migratedCount + skippedCount}`
        }],
      };
    } catch (error) {
      logger.error("Error in migrate_training_missions tool:", error);
      return {
        content: [{
          type: "text" as const,
          text: `Error migrating training missions: ${error instanceof Error ? error.message : String(error)}`
        }],
        isError: true,
      };
    }
  }
};