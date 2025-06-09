#!/usr/bin/env node

/**
 * Database-Connected MCP Server for Project 89 Mission Management
 * 
 * This script provides a complete MCP server that connects directly to MongoDB
 * for AI agents to manage missions in the Project 89 system.
 * 
 * Usage: node mission-mcp-database.js
 * 
 * Available tools:
 * - list_missions: List all missions from database
 * - get_mission: Get a specific mission by ID
 * - create_mission: Create a new mission in database
 * - update_mission: Update an existing mission
 * - delete_mission: Delete a mission (soft delete)
 * - list_deployments: List mission deployments
 * - get_deployment: Get deployment details
 * - get_mission_stats: Get mission statistics
 */

const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} = require('@modelcontextprotocol/sdk/types.js');
const { z } = require('zod');
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, 'server/.env') });

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/project89';

// Import the training missions data structure
const { TRAINING_MISSIONS } = require('./server/dist/data/trainingMissions.js');

// Mission Schema - matches the database structure
const MissionSchema = new mongoose.Schema({
  missionId: { type: String, required: true, unique: true },
  sequence: { type: Number, required: true },
  title: { type: String, required: true },
  date: { type: String, required: true },
  location: { type: String, required: true },
  description: { type: String, required: true },
  imagePrompt: { type: String, required: true },
  imageUrl: { type: String },
  duration: { type: Number, required: true }, // milliseconds
  
  briefing: {
    text: { type: String, required: true },
    currentBalance: { type: Number, required: true },
    threatLevel: { type: String, enum: ['low', 'medium', 'high', 'critical'], required: true }
  },
  
  approaches: [{
    type: { type: String, enum: ['low', 'medium', 'high'], required: true },
    name: { type: String, required: true },
    description: { type: String, required: true },
    duration: { type: Number },
    successRate: {
      min: { type: Number, required: true },
      max: { type: Number, required: true }
    },
    timelineShift: {
      min: { type: Number, required: true },
      max: { type: Number, required: true }
    },
    rewards: {
      timelinePoints: { type: Number },
      experience: { type: Number },
      influenceMultiplier: { type: Number }
    }
  }],
  
  compatibility: {
    preferred: [{ type: String, enum: ['analytical', 'aggressive', 'diplomatic', 'adaptive'] }],
    bonus: { type: Number },
    penalty: { type: Number }
  },
  
  phases: [{
    id: { type: Number, required: true },
    name: { type: String, required: true },
    durationPercent: { type: Number, required: true },
    narrativeTemplates: {
      success: { type: String, required: true },
      failure: { type: String, required: true }
    },
    description: { type: String },
    challengeRating: { type: Number },
    criticalPath: { type: Boolean }
  }],
  
  difficulty: { type: Number, min: 1, max: 10 },
  category: { type: String, default: 'training' },
  tags: [{ type: String }],
  
  // Database metadata
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Create Mission model
const Mission = mongoose.model('TrainingMission', MissionSchema);

// Deployment Schema for tracking mission runs
const DeploymentSchema = new mongoose.Schema({
  deploymentId: { type: String, required: true, unique: true },
  missionId: { type: String, required: true },
  agentId: { type: String, required: true },
  proxim8Id: { type: String, required: true },
  approach: { type: String, enum: ['low', 'medium', 'high'], required: true },
  
  status: { 
    type: String, 
    enum: ['deploying', 'active', 'completed', 'failed', 'abandoned'], 
    default: 'deploying' 
  },
  
  deployedAt: { type: Date, default: Date.now },
  completesAt: { type: Date },
  completedAt: { type: Date },
  
  currentPhase: { type: Number, default: 0 },
  phases: [{
    phaseId: { type: String },
    name: { type: String },
    status: { type: String, enum: ['pending', 'active', 'success', 'failure'] },
    narrative: { type: String },
    completedAt: { type: Date }
  }],
  
  result: {
    overallSuccess: { type: Boolean },
    timelineShift: { type: Number },
    finalNarrative: { type: String },
    rewards: {
      timelinePoints: { type: Number },
      experience: { type: Number },
      loreFragments: [{ type: String }]
    }
  },
  
  finalSuccessRate: { type: Number }
});

const Deployment = mongoose.model('TrainingMissionDeployment', DeploymentSchema);

// Agent Schema for tracking agents
const AgentSchema = new mongoose.Schema({
  walletAddress: { type: String, required: true, unique: true },
  codename: { type: String, required: true },
  rank: { type: String, default: 'Initiate' },
  level: { type: Number, default: 1 },
  experience: { type: Number, default: 0 },
  timelinePoints: { type: Number, default: 0 },
  
  stats: {
    missionsCompleted: { type: Number, default: 0 },
    missionsFailed: { type: Number, default: 0 },
    totalTimelineShift: { type: Number, default: 0 }
  },
  
  createdAt: { type: Date, default: Date.now },
  lastActive: { type: Date, default: Date.now }
});

const Agent = mongoose.model('Agent', AgentSchema);

// Zod schemas for validation
const CreateMissionSchema = z.object({
  mission: z.object({
    missionId: z.string(),
    sequence: z.number(),
    title: z.string(),
    date: z.string(),
    location: z.string(),
    description: z.string(),
    imagePrompt: z.string(),
    duration: z.number(),
    briefing: z.object({
      text: z.string(),
      currentBalance: z.number(),
      threatLevel: z.enum(['low', 'medium', 'high', 'critical'])
    }),
    approaches: z.array(z.object({
      type: z.enum(['low', 'medium', 'high']),
      name: z.string(),
      description: z.string(),
      successRate: z.object({
        min: z.number().min(0).max(1),
        max: z.number().min(0).max(1)
      }),
      timelineShift: z.object({
        min: z.number(),
        max: z.number()
      }),
      rewards: z.object({
        timelinePoints: z.number(),
        experience: z.number()
      }).optional()
    })).length(3),
    compatibility: z.object({
      preferred: z.array(z.enum(['analytical', 'aggressive', 'diplomatic', 'adaptive'])),
      bonus: z.number(),
      penalty: z.number()
    }),
    phases: z.array(z.object({
      id: z.number(),
      name: z.string(),
      durationPercent: z.number(),
      narrativeTemplates: z.object({
        success: z.string(),
        failure: z.string()
      })
    })),
    difficulty: z.number().min(1).max(10).optional(),
    category: z.string().optional(),
    tags: z.array(z.string()).optional()
  })
});

// Connect to MongoDB
async function connectDB() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.error('Connected to MongoDB');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
}

// Tool implementations
const tools = {
  list_missions: {
    description: 'List all missions from database with optional filters',
    inputSchema: z.object({
      filter: z.object({
        category: z.string().optional(),
        difficulty: z.object({
          min: z.number().optional(),
          max: z.number().optional()
        }).optional(),
        tags: z.array(z.string()).optional(),
        isActive: z.boolean().optional()
      }).optional(),
      limit: z.number().optional().default(50),
      skip: z.number().optional().default(0)
    }),
    handler: async ({ filter = {}, limit, skip }) => {
      const query = {};
      
      if (filter.category) query.category = filter.category;
      if (filter.isActive !== undefined) query.isActive = filter.isActive;
      if (filter.tags && filter.tags.length > 0) {
        query.tags = { $in: filter.tags };
      }
      if (filter.difficulty) {
        query.difficulty = {};
        if (filter.difficulty.min) query.difficulty.$gte = filter.difficulty.min;
        if (filter.difficulty.max) query.difficulty.$lte = filter.difficulty.max;
      }

      const missions = await Mission.find(query)
        .sort({ sequence: 1 })
        .limit(limit)
        .skip(skip)
        .lean();

      const total = await Mission.countDocuments(query);

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            missions,
            pagination: {
              total,
              limit,
              skip,
              hasMore: skip + missions.length < total
            }
          }, null, 2)
        }]
      };
    }
  },

  get_mission: {
    description: 'Get a specific mission by ID from database',
    inputSchema: z.object({
      missionId: z.string()
    }),
    handler: async ({ missionId }) => {
      const mission = await Mission.findOne({ missionId }).lean();

      if (!mission) {
        throw new Error(`Mission not found: ${missionId}`);
      }

      // Get deployment stats
      const deployments = await Deployment.find({ missionId }).lean();
      const stats = {
        totalDeployments: deployments.length,
        successfulDeployments: deployments.filter(d => d.result?.overallSuccess).length,
        activeDeployments: deployments.filter(d => d.status === 'active').length,
        averageSuccessRate: deployments.reduce((acc, d) => acc + (d.finalSuccessRate || 0), 0) / (deployments.length || 1)
      };

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            mission,
            stats
          }, null, 2)
        }]
      };
    }
  },

  create_mission: {
    description: 'Create a new mission in the database',
    inputSchema: CreateMissionSchema,
    handler: async ({ mission }) => {
      // Check for duplicate
      const existing = await Mission.findOne({ missionId: mission.missionId });
      if (existing) {
        throw new Error(`Mission with ID ${mission.missionId} already exists`);
      }

      // Create the mission
      const newMission = new Mission({
        ...mission,
        imageUrl: `/background-${(mission.sequence % 19) + 1}.png`, // Auto-generate image URL
        createdAt: new Date(),
        updatedAt: new Date()
      });

      await newMission.save();

      return {
        content: [{
          type: 'text',
          text: `Mission created successfully: ${mission.missionId}\n\n${JSON.stringify(newMission.toObject(), null, 2)}`
        }]
      };
    }
  },

  update_mission: {
    description: 'Update an existing mission in the database',
    inputSchema: z.object({
      missionId: z.string(),
      updates: z.record(z.any())
    }),
    handler: async ({ missionId, updates }) => {
      // Remove fields that shouldn't be updated
      delete updates._id;
      delete updates.missionId;
      delete updates.createdAt;
      
      updates.updatedAt = new Date();

      const updated = await Mission.findOneAndUpdate(
        { missionId },
        { $set: updates },
        { new: true, runValidators: true }
      ).lean();

      if (!updated) {
        throw new Error(`Mission not found: ${missionId}`);
      }

      return {
        content: [{
          type: 'text',
          text: `Mission updated successfully: ${missionId}\n\n${JSON.stringify(updated, null, 2)}`
        }]
      };
    }
  },

  delete_mission: {
    description: 'Soft delete a mission (mark as inactive)',
    inputSchema: z.object({
      missionId: z.string()
    }),
    handler: async ({ missionId }) => {
      const updated = await Mission.findOneAndUpdate(
        { missionId },
        { 
          $set: { 
            isActive: false,
            updatedAt: new Date()
          }
        },
        { new: true }
      ).lean();

      if (!updated) {
        throw new Error(`Mission not found: ${missionId}`);
      }

      return {
        content: [{
          type: 'text',
          text: `Mission deleted (marked inactive): ${missionId}`
        }]
      };
    }
  },

  list_deployments: {
    description: 'List mission deployments with optional filters',
    inputSchema: z.object({
      filter: z.object({
        missionId: z.string().optional(),
        agentId: z.string().optional(),
        status: z.enum(['deploying', 'active', 'completed', 'failed', 'abandoned']).optional()
      }).optional(),
      limit: z.number().optional().default(50),
      skip: z.number().optional().default(0)
    }),
    handler: async ({ filter = {}, limit, skip }) => {
      const query = {};
      
      if (filter.missionId) query.missionId = filter.missionId;
      if (filter.agentId) query.agentId = filter.agentId;
      if (filter.status) query.status = filter.status;

      const deployments = await Deployment.find(query)
        .sort({ deployedAt: -1 })
        .limit(limit)
        .skip(skip)
        .lean();

      const total = await Deployment.countDocuments(query);

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            deployments,
            pagination: {
              total,
              limit,
              skip,
              hasMore: skip + deployments.length < total
            }
          }, null, 2)
        }]
      };
    }
  },

  get_deployment: {
    description: 'Get detailed deployment information',
    inputSchema: z.object({
      deploymentId: z.string()
    }),
    handler: async ({ deploymentId }) => {
      const deployment = await Deployment.findOne({ deploymentId }).lean();

      if (!deployment) {
        throw new Error(`Deployment not found: ${deploymentId}`);
      }

      // Get associated mission and agent
      const [mission, agent] = await Promise.all([
        Mission.findOne({ missionId: deployment.missionId }).lean(),
        Agent.findOne({ walletAddress: deployment.agentId }).lean()
      ]);

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            deployment,
            mission: mission ? {
              title: mission.title,
              location: mission.location,
              difficulty: mission.difficulty
            } : null,
            agent: agent ? {
              codename: agent.codename,
              rank: agent.rank,
              level: agent.level
            } : null
          }, null, 2)
        }]
      };
    }
  },

  get_mission_stats: {
    description: 'Get comprehensive mission statistics',
    inputSchema: z.object({}),
    handler: async () => {
      const [
        totalMissions,
        activeMissions,
        totalDeployments,
        activeDeployments,
        successfulDeployments,
        totalAgents
      ] = await Promise.all([
        Mission.countDocuments(),
        Mission.countDocuments({ isActive: true }),
        Deployment.countDocuments(),
        Deployment.countDocuments({ status: 'active' }),
        Deployment.countDocuments({ 'result.overallSuccess': true }),
        Agent.countDocuments()
      ]);

      const difficultyStats = await Mission.aggregate([
        { $match: { isActive: true } },
        { $group: {
          _id: '$difficulty',
          count: { $sum: 1 }
        }},
        { $sort: { _id: 1 } }
      ]);

      const approachStats = await Deployment.aggregate([
        { $group: {
          _id: '$approach',
          count: { $sum: 1 },
          successCount: {
            $sum: { $cond: ['$result.overallSuccess', 1, 0] }
          }
        }}
      ]);

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            overview: {
              totalMissions,
              activeMissions,
              totalDeployments,
              activeDeployments,
              successfulDeployments,
              successRate: totalDeployments > 0 ? 
                (successfulDeployments / totalDeployments * 100).toFixed(2) + '%' : '0%',
              totalAgents
            },
            difficultyDistribution: difficultyStats,
            approachStats: approachStats.map(stat => ({
              approach: stat._id,
              totalAttempts: stat.count,
              successfulAttempts: stat.successCount,
              successRate: (stat.successCount / stat.count * 100).toFixed(2) + '%'
            }))
          }, null, 2)
        }]
      };
    }
  },

  seed_training_missions: {
    description: 'Seed the database with default training missions',
    inputSchema: z.object({
      overwrite: z.boolean().optional().default(false)
    }),
    handler: async ({ overwrite }) => {
      const results = [];
      
      for (const missionData of TRAINING_MISSIONS) {
        try {
          const existing = await Mission.findOne({ missionId: missionData.missionId });
          
          if (existing && !overwrite) {
            results.push({
              missionId: missionData.missionId,
              status: 'skipped',
              message: 'Already exists'
            });
            continue;
          }

          if (existing && overwrite) {
            await Mission.findOneAndUpdate(
              { missionId: missionData.missionId },
              { 
                $set: {
                  ...missionData,
                  imageUrl: `/background-${(missionData.sequence % 19) + 1}.png`,
                  updatedAt: new Date()
                }
              }
            );
            results.push({
              missionId: missionData.missionId,
              status: 'updated',
              message: 'Overwritten existing mission'
            });
          } else {
            const newMission = new Mission({
              ...missionData,
              imageUrl: `/background-${(missionData.sequence % 19) + 1}.png`,
              createdAt: new Date(),
              updatedAt: new Date()
            });
            await newMission.save();
            results.push({
              missionId: missionData.missionId,
              status: 'created',
              message: 'Successfully created'
            });
          }
        } catch (error) {
          results.push({
            missionId: missionData.missionId,
            status: 'error',
            message: error.message
          });
        }
      }

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            summary: {
              total: results.length,
              created: results.filter(r => r.status === 'created').length,
              updated: results.filter(r => r.status === 'updated').length,
              skipped: results.filter(r => r.status === 'skipped').length,
              errors: results.filter(r => r.status === 'error').length
            },
            results
          }, null, 2)
        }]
      };
    }
  }
};

// Create and start the MCP server
async function main() {
  // Connect to database first
  await connectDB();

  const server = new Server(
    {
      name: 'project89-mission-db-mcp',
      version: '1.0.0',
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  // Register tool handlers
  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: Object.entries(tools).map(([name, tool]) => ({
      name,
      description: tool.description,
      inputSchema: tool.inputSchema
    }))
  }));

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    const tool = tools[name];

    if (!tool) {
      throw new Error(`Unknown tool: ${name}`);
    }

    try {
      const parsedArgs = tool.inputSchema.parse(args);
      return await tool.handler(parsedArgs);
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new Error(`Invalid arguments: ${error.message}`);
      }
      throw error;
    }
  });

  const transport = new StdioServerTransport();
  await server.connect(transport);
  
  console.error('Project 89 Mission Database MCP Server running...');
  console.error('Connected to:', MONGODB_URI);
  console.error('');
  console.error('Available tools:');
  console.error('- list_missions: List missions from database');
  console.error('- get_mission: Get specific mission with stats');
  console.error('- create_mission: Create new mission');
  console.error('- update_mission: Update existing mission');
  console.error('- delete_mission: Soft delete mission');
  console.error('- list_deployments: List mission deployments');
  console.error('- get_deployment: Get deployment details');
  console.error('- get_mission_stats: Get overall statistics');
  console.error('- seed_training_missions: Seed default missions');
}

main().catch((error) => {
  console.error('Server error:', error);
  process.exit(1);
});