#!/usr/bin/env node

/**
 * Database-Connected MCP Server for Project 89 Mission Management
 * 
 * This server provides direct MongoDB access for mission CRUD operations
 * without going through the API layer.
 */

console.error("[MCP-SERVER] Loading MCP SDK...");

// Load MCP SDK from server's node_modules
const serverNodeModules = './server/node_modules';
const { Server } = require(`${serverNodeModules}/@modelcontextprotocol/sdk/server/index.js`);
const { StdioServerTransport } = require(`${serverNodeModules}/@modelcontextprotocol/sdk/server/stdio.js`);
const {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} = require(`${serverNodeModules}/@modelcontextprotocol/sdk/types.js`);

const path = require('path');

// We'll use the existing mongoose connection from the server
let mongoose, TrainingMission, TRAINING_MISSIONS;

try {
  // Load mongoose from the server's node_modules
  const serverPath = path.join(__dirname, 'server');
  mongoose = require(path.join(serverPath, 'node_modules/mongoose'));
  
  // Load training missions data
  const trainingData = require(path.join(serverPath, 'dist/data/trainingMissions.js'));
  TRAINING_MISSIONS = trainingData.TRAINING_MISSIONS;
  
} catch (error) {
  console.error('Error loading dependencies:', error.message);
  console.error('Make sure you run this from the proxim8-pipeline directory');
  process.exit(1);
}

// Define the Mission schema directly here to match the training missions structure
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
  tags: [{ type: String }]
}, {
  collection: 'trainingmissions', // Use a specific collection for training missions
  timestamps: true
});

// Create the model
const TrainingMissionModel = mongoose.model('TrainingMission', MissionSchema);

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/project89';

async function connectDB() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.error('Connected to MongoDB:', MONGODB_URI);
    return true;
  } catch (error) {
    console.error('MongoDB connection error:', error.message);
    return false;
  }
}

// Tool implementations
const tools = {
  list_missions: {
    description: 'List all missions from database',
    inputSchema: {
      type: 'object',
      properties: {
        filter: {
          type: 'object',
          properties: {
            category: { type: 'string' },
            difficulty: {
              type: 'object',
              properties: {
                min: { type: 'number' },
                max: { type: 'number' }
              }
            },
            tags: {
              type: 'array',
              items: { type: 'string' }
            }
          }
        },
        limit: { type: 'number', default: 50 },
        skip: { type: 'number', default: 0 }
      },
      required: []
    },
    handler: async ({ filter = {}, limit = 50, skip = 0 }) => {
      const query = {};
      
      if (filter.category) query.category = filter.category;
      if (filter.tags && filter.tags.length > 0) {
        query.tags = { $in: filter.tags };
      }
      if (filter.difficulty) {
        query.difficulty = {};
        if (filter.difficulty.min) query.difficulty.$gte = filter.difficulty.min;
        if (filter.difficulty.max) query.difficulty.$lte = filter.difficulty.max;
      }

      const missions = await TrainingMissionModel.find(query)
        .sort({ sequence: 1 })
        .limit(limit)
        .skip(skip)
        .lean();

      const total = await TrainingMissionModel.countDocuments(query);

      // If no missions in DB, return the default ones
      if (missions.length === 0 && skip === 0) {
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              missions: TRAINING_MISSIONS,
              pagination: {
                total: TRAINING_MISSIONS.length,
                limit,
                skip,
                hasMore: false
              },
              source: 'default_data'
            }, null, 2)
          }]
        };
      }

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
            },
            source: 'database'
          }, null, 2)
        }]
      };
    }
  },

  get_mission: {
    description: 'Get a specific mission by ID',
    inputSchema: {
      type: 'object',
      properties: {
        missionId: { type: 'string' }
      },
      required: ['missionId']
    },
    handler: async ({ missionId }) => {
      let mission = await TrainingMissionModel.findOne({ missionId }).lean();
      
      // If not in DB, check default data
      if (!mission) {
        mission = TRAINING_MISSIONS.find(m => m.missionId === missionId);
        if (mission) {
          return {
            content: [{
              type: 'text',
              text: JSON.stringify({
                mission,
                source: 'default_data'
              }, null, 2)
            }]
          };
        }
      }

      if (!mission) {
        throw new Error(`Mission not found: ${missionId}`);
      }

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            mission,
            source: 'database'
          }, null, 2)
        }]
      };
    }
  },

  create_mission: {
    description: 'Create a new mission in the database',
    inputSchema: {
      type: 'object',
      properties: {
        mission: {
          type: 'object',
          properties: {
            missionId: { type: 'string' },
            sequence: { type: 'number' },
            title: { type: 'string' },
            date: { type: 'string' },
            location: { type: 'string' },
            description: { type: 'string' },
            imagePrompt: { type: 'string' },
            duration: { type: 'number' },
            briefing: {
              type: 'object',
              properties: {
                text: { type: 'string' },
                currentBalance: { type: 'number' },
                threatLevel: { type: 'string', enum: ['low', 'medium', 'high', 'critical'] }
              },
              required: ['text', 'currentBalance', 'threatLevel']
            },
            approaches: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  type: { type: 'string', enum: ['low', 'medium', 'high'] },
                  name: { type: 'string' },
                  description: { type: 'string' },
                  successRate: {
                    type: 'object',
                    properties: {
                      min: { type: 'number' },
                      max: { type: 'number' }
                    }
                  },
                  timelineShift: {
                    type: 'object',
                    properties: {
                      min: { type: 'number' },
                      max: { type: 'number' }
                    }
                  }
                }
              }
            },
            compatibility: {
              type: 'object',
              properties: {
                preferred: { type: 'array', items: { type: 'string' } },
                bonus: { type: 'number' },
                penalty: { type: 'number' }
              }
            },
            phases: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'number' },
                  name: { type: 'string' },
                  durationPercent: { type: 'number' },
                  narrativeTemplates: {
                    type: 'object',
                    properties: {
                      success: { type: 'string' },
                      failure: { type: 'string' }
                    }
                  }
                }
              }
            }
          },
          required: ['missionId', 'sequence', 'title', 'date', 'location', 'description', 'imagePrompt', 'duration', 'briefing', 'approaches', 'compatibility', 'phases']
        }
      },
      required: ['mission']
    },
    handler: async ({ mission }) => {
      // Check for duplicate
      const existing = await TrainingMissionModel.findOne({ missionId: mission.missionId });
      if (existing) {
        throw new Error(`Mission with ID ${mission.missionId} already exists`);
      }

      // Auto-generate image URL if not provided
      if (!mission.imageUrl) {
        mission.imageUrl = `/background-${(mission.sequence % 19) + 1}.png`;
      }

      // Create the mission
      const newMission = new TrainingMissionModel(mission);
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
    inputSchema: {
      type: 'object',
      properties: {
        missionId: { type: 'string' },
        updates: {
          type: 'object',
          additionalProperties: true
        }
      },
      required: ['missionId', 'updates']
    },
    handler: async ({ missionId, updates }) => {
      // Remove fields that shouldn't be updated
      delete updates._id;
      delete updates.createdAt;
      
      const updated = await TrainingMissionModel.findOneAndUpdate(
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

  seed_training_missions: {
    description: 'Seed the database with default training missions',
    inputSchema: {
      type: 'object',
      properties: {
        overwrite: { type: 'boolean', default: false }
      },
      required: []
    },
    handler: async ({ overwrite = false }) => {
      const results = [];
      
      for (const missionData of TRAINING_MISSIONS) {
        try {
          const existing = await TrainingMissionModel.findOne({ missionId: missionData.missionId });
          
          if (existing && !overwrite) {
            results.push({
              missionId: missionData.missionId,
              status: 'skipped',
              message: 'Already exists'
            });
            continue;
          }

          if (existing && overwrite) {
            await TrainingMissionModel.findOneAndUpdate(
              { missionId: missionData.missionId },
              { 
                $set: {
                  ...missionData,
                  imageUrl: missionData.imageUrl || `/background-${(missionData.sequence % 19) + 1}.png`
                }
              }
            );
            results.push({
              missionId: missionData.missionId,
              status: 'updated',
              message: 'Overwritten existing mission'
            });
          } else {
            const newMission = new TrainingMissionModel({
              ...missionData,
              imageUrl: missionData.imageUrl || `/background-${(missionData.sequence % 19) + 1}.png`
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
  },

  get_mission_schema: {
    description: 'Get the mission data structure',
    inputSchema: {
      type: 'object',
      properties: {},
      required: []
    },
    handler: async () => {
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            description: "Project 89 Mission Structure",
            fields: {
              missionId: "Unique identifier (e.g., training_001)",
              sequence: "Order number",
              title: "Mission title",
              date: "Mission date",
              location: "Mission location",
              description: "Brief description",
              imagePrompt: "AI image prompt",
              duration: "Duration in milliseconds",
              briefing: {
                text: "Briefing text",
                currentBalance: "Timeline balance (0-100)",
                threatLevel: "low|medium|high|critical"
              },
              approaches: "Array of 3 approaches (low/medium/high)",
              compatibility: "Agent type preferences",
              phases: "Mission execution phases"
            },
            example: TRAINING_MISSIONS[0]
          }, null, 2)
        }]
      };
    }
  }
};

// Create and start the MCP server
async function main() {
  // Try to connect to MongoDB
  const dbConnected = await connectDB();
  
  if (!dbConnected) {
    console.error('Warning: Running without database connection. Only default data will be available.');
  }

  const server = new Server(
    {
      name: 'project89-mission-db',
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
  
  console.error('Project 89 Mission MCP Server (DB) running...');
  console.error('Database:', dbConnected ? 'Connected' : 'Not connected (using defaults)');
  console.error('');
  console.error('Available tools:');
  console.error('- list_missions: List all missions');
  console.error('- get_mission: Get specific mission');
  console.error('- create_mission: Create new mission');
  console.error('- update_mission: Update existing mission');
  console.error('- seed_training_missions: Import default missions');
  console.error('- get_mission_schema: Get mission structure');
}

main().catch((error) => {
  console.error('Server error:', error);
  process.exit(1);
});