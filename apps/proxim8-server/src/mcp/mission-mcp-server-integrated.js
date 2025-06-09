#!/usr/bin/env node

/**
 * Fully Integrated MCP Server for Project 89 Mission Management
 * 
 * This server uses the existing server services and models for complete integration
 * with the Project 89 backend infrastructure.
 */

const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} = require('@modelcontextprotocol/sdk/types.js');

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, 'server/.env') });

// Import all the server infrastructure
const serverPath = path.join(__dirname, 'server');

// Database connection
const { connectDB } = require(path.join(serverPath, 'dist/config/database.js'));

// Models
const TrainingMissionDeployment = require(path.join(serverPath, 'dist/models/game/TrainingMissionDeployment.js')).default;
const Agent = require(path.join(serverPath, 'dist/models/game/Agent.js')).default;
const Lore = require(path.join(serverPath, 'dist/models/Lore.js')).default;

// Services
const { MissionService } = require(path.join(serverPath, 'dist/services/game/missionService.js'));
const { TimelineService } = require(path.join(serverPath, 'dist/services/game/timelineService.js'));
const { ContentGenerationService } = require(path.join(serverPath, 'dist/services/game/contentGenerationService.js'));
const { LoreService } = require(path.join(serverPath, 'dist/services/game/loreService.js'));

// Training missions data
const { TRAINING_MISSIONS } = require(path.join(serverPath, 'dist/data/trainingMissions.js'));

// Initialize services
const missionService = new MissionService();
const timelineService = new TimelineService();
const contentGenerationService = new ContentGenerationService();
const loreService = new LoreService();

// Tool implementations using actual services
const tools = {
  list_missions: {
    description: 'List all missions using the mission service',
    inputSchema: {
      type: 'object',
      properties: {
        agentId: { type: 'string' },
        includeDeployments: { type: 'boolean', default: false }
      },
      required: []
    },
    handler: async ({ agentId, includeDeployments = false }) => {
      try {
        // Get missions from the actual training missions data
        let missions = [...TRAINING_MISSIONS];
        
        if (agentId) {
          // Get agent's deployments
          const deployments = await TrainingMissionDeployment.find({ 
            agentId,
            status: { $in: ['completed', 'active'] }
          }).lean();
          
          // Add deployment status to missions
          missions = missions.map(mission => {
            const deployment = deployments.find(d => d.missionId === mission.missionId);
            return {
              ...mission,
              deployment: deployment ? {
                status: deployment.status,
                approach: deployment.approach,
                completedAt: deployment.completedAt,
                result: deployment.result
              } : null
            };
          });
        }
        
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              missions,
              total: missions.length,
              source: 'service'
            }, null, 2)
          }]
        };
      } catch (error) {
        throw new Error(`Failed to list missions: ${error.message}`);
      }
    }
  },

  get_mission: {
    description: 'Get a specific mission with full details',
    inputSchema: {
      type: 'object',
      properties: {
        missionId: { type: 'string' },
        agentId: { type: 'string' }
      },
      required: ['missionId']
    },
    handler: async ({ missionId, agentId }) => {
      try {
        // Find mission in training data
        const mission = TRAINING_MISSIONS.find(m => m.missionId === missionId);
        if (!mission) {
          throw new Error(`Mission not found: ${missionId}`);
        }
        
        let deployment = null;
        if (agentId) {
          deployment = await TrainingMissionDeployment.findOne({
            missionId,
            agentId
          }).lean();
        }
        
        // Get related lore if mission is completed
        let lore = null;
        if (deployment?.status === 'completed') {
          lore = await Lore.find({
            missionId,
            sourceType: 'mission_generated'
          }).lean();
        }
        
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              mission,
              deployment,
              lore,
              source: 'service'
            }, null, 2)
          }]
        };
      } catch (error) {
        throw new Error(`Failed to get mission: ${error.message}`);
      }
    }
  },

  deploy_mission: {
    description: 'Deploy a mission for an agent using the mission service',
    inputSchema: {
      type: 'object',
      properties: {
        agentId: { type: 'string' },
        missionId: { type: 'string' },
        proxim8Id: { type: 'string' },
        approach: { type: 'string', enum: ['low', 'medium', 'high'] }
      },
      required: ['agentId', 'missionId', 'proxim8Id', 'approach']
    },
    handler: async ({ agentId, missionId, proxim8Id, approach }) => {
      try {
        // Use the actual mission service to deploy
        const deployment = await missionService.deployMission(
          agentId,
          missionId,
          proxim8Id,
          approach
        );
        
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              success: true,
              deployment,
              message: 'Mission deployed successfully'
            }, null, 2)
          }]
        };
      } catch (error) {
        throw new Error(`Failed to deploy mission: ${error.message}`);
      }
    }
  },

  update_mission_data: {
    description: 'Update mission data in the training missions (development only)',
    inputSchema: {
      type: 'object',
      properties: {
        missionId: { type: 'string' },
        updates: { type: 'object', additionalProperties: true }
      },
      required: ['missionId', 'updates']
    },
    handler: async ({ missionId, updates }) => {
      // This is tricky because TRAINING_MISSIONS is typically hardcoded
      // In a real implementation, you'd want to:
      // 1. Store custom missions in a separate collection
      // 2. Or have a mission override system
      
      // For now, we'll show what the update would look like
      const missionIndex = TRAINING_MISSIONS.findIndex(m => m.missionId === missionId);
      if (missionIndex === -1) {
        throw new Error(`Mission not found: ${missionId}`);
      }
      
      const currentMission = TRAINING_MISSIONS[missionIndex];
      const updatedMission = { ...currentMission, ...updates };
      
      // In production, you'd save this to a database
      // For this demo, we'll just return what it would look like
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            message: 'Mission update preview (not persisted in this version)',
            original: currentMission,
            updated: updatedMission,
            changes: updates
          }, null, 2)
        }]
      };
    }
  },

  generate_mission_content: {
    description: 'Generate AI content for missions using content generation service',
    inputSchema: {
      type: 'object',
      properties: {
        missionId: { type: 'string' },
        contentType: { type: 'string', enum: ['briefing', 'narrative', 'lore'] }
      },
      required: ['missionId', 'contentType']
    },
    handler: async ({ missionId, contentType }) => {
      try {
        const mission = TRAINING_MISSIONS.find(m => m.missionId === missionId);
        if (!mission) {
          throw new Error(`Mission not found: ${missionId}`);
        }
        
        let content;
        switch (contentType) {
          case 'briefing':
            content = await contentGenerationService.generateMissionBriefing(mission);
            break;
          case 'narrative':
            content = await contentGenerationService.generatePhaseNarrative(
              mission,
              1, // phase number
              true // success
            );
            break;
          case 'lore':
            content = await contentGenerationService.generateLoreFragment(mission);
            break;
          default:
            throw new Error(`Unknown content type: ${contentType}`);
        }
        
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              missionId,
              contentType,
              generated: content
            }, null, 2)
          }]
        };
      } catch (error) {
        throw new Error(`Failed to generate content: ${error.message}`);
      }
    }
  },

  get_timeline_impact: {
    description: 'Calculate timeline impact using timeline service',
    inputSchema: {
      type: 'object',
      properties: {
        agentId: { type: 'string' }
      },
      required: ['agentId']
    },
    handler: async ({ agentId }) => {
      try {
        const impact = await timelineService.calculateAgentImpact(agentId);
        const timeline = await timelineService.getCurrentTimeline();
        
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              agentId,
              impact,
              currentTimeline: timeline
            }, null, 2)
          }]
        };
      } catch (error) {
        throw new Error(`Failed to get timeline impact: ${error.message}`);
      }
    }
  }
};

// Create and start the MCP server
async function main() {
  // Connect to database using the server's connection
  try {
    await connectDB();
    console.error('Connected to MongoDB using server configuration');
  } catch (error) {
    console.error('Failed to connect to database:', error.message);
    console.error('Some features may not work correctly');
  }

  const server = new Server(
    {
      name: 'project89-mission-integrated',
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
      return await tool.handler(args || {});
    } catch (error) {
      console.error(`Error in tool ${name}:`, error);
      throw error;
    }
  });

  const transport = new StdioServerTransport();
  await server.connect(transport);
  
  console.error('Project 89 Mission MCP Server (Integrated) running...');
  console.error('This server uses your actual backend services and models');
  console.error('');
  console.error('Available tools:');
  console.error('- list_missions: List missions with deployment status');
  console.error('- get_mission: Get mission with lore and deployment');
  console.error('- deploy_mission: Deploy using mission service');
  console.error('- update_mission_data: Update mission data (preview)');
  console.error('- generate_mission_content: Generate AI content');
  console.error('- get_timeline_impact: Calculate timeline impact');
}

main().catch((error) => {
  console.error('Server error:', error);
  process.exit(1);
});