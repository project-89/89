#!/usr/bin/env node

/**
 * Standalone MCP Server for Project 89 Mission Management
 * 
 * This version uses minimal dependencies and connects directly to MongoDB
 * Requires: npm install @modelcontextprotocol/sdk mongoose dotenv
 */

console.error("[MCP-STANDALONE] Starting standalone mission MCP server...");

// Check if required modules are available
const requiredModules = [
  '@modelcontextprotocol/sdk/server/index.js',
  '@modelcontextprotocol/sdk/server/stdio.js', 
  '@modelcontextprotocol/sdk/types.js',
  'mongoose',
  'dotenv'
];

// Try to load from different locations
function tryRequire(moduleName) {
  // Special handling for MCP SDK modules
  if (moduleName.startsWith('@modelcontextprotocol/sdk/')) {
    const basePath = '@modelcontextprotocol/sdk/dist/cjs/';
    const fileName = moduleName.replace('@modelcontextprotocol/sdk/', '');
    
    const attempts = [
      () => require(`./server/node_modules/${basePath}${fileName}`),
      () => require(`${basePath}${fileName}`),
    ];
    
    for (const attempt of attempts) {
      try {
        return attempt();
      } catch (e) {
        // Continue to next attempt
      }
    }
  }
  
  // Standard modules
  const attempts = [
    () => require(moduleName), // Direct require
    () => require(`./server/node_modules/${moduleName}`), // Server node_modules
    () => require(`./node_modules/${moduleName}`), // Local node_modules
    () => require(`../../node_modules/${moduleName}`), // Parent node_modules
  ];
  
  for (const attempt of attempts) {
    try {
      return attempt();
    } catch (e) {
      // Continue to next attempt
    }
  }
  throw new Error(`Cannot find module: ${moduleName}`);
}

try {
  // Load required modules
  const { Server } = tryRequire('@modelcontextprotocol/sdk/server/index.js');
  const { StdioServerTransport } = tryRequire('@modelcontextprotocol/sdk/server/stdio.js');
  const {
    CallToolRequestSchema,
    ListToolsRequestSchema,
  } = tryRequire('@modelcontextprotocol/sdk/types.js');
  
  const mongoose = tryRequire('mongoose');
  const dotenv = tryRequire('dotenv');
  const path = require('path');
  
  // Load environment
  const envPath = path.join(__dirname, 'server/.env');
  console.error("[MCP-STANDALONE] Loading environment from:", envPath);
  dotenv.config({ path: envPath });
  
  if (!process.env.MONGODB_URI) {
    throw new Error("MONGODB_URI not found in environment");
  }
  
  console.error("[MCP-STANDALONE] MongoDB URI found, connecting...");
  
  // Define MissionTemplate schema (unified for all mission types)
  const MissionTemplateSchema = new mongoose.Schema({
    templateId: { type: String, required: true, unique: true },
    missionType: { 
      type: String, 
      enum: ['training', 'timeline', 'critical', 'event'], 
      required: true 
    },
    sequence: { type: Number, required: true },
    title: { type: String, required: true },
    date: { type: String, required: true },
    location: { type: String, required: true },
    description: { type: String, required: true },
    imagePrompt: { type: String, required: true },
    imageUrl: { type: String },
    duration: { type: Number, required: true }, // milliseconds
    
    // Dependencies - missions that must be completed first
    dependencies: [{
      missionId: { type: String, required: true },
      requiredOutcome: { type: String, enum: ['any', 'success', 'failure'], default: 'any' }
    }],
    
    briefing: {
      text: { type: String, required: true },
      currentBalance: { type: Number, required: true },
      threatLevel: { type: String, enum: ['low', 'medium', 'high', 'critical'], required: true }
    },
    
    approaches: [{
      type: { type: String, enum: ['low', 'medium', 'high'], required: true },
      name: { type: String, required: true },
      description: { type: String, required: true },
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
      bonus: { type: Number, required: true },
      penalty: { type: Number, required: true }
    },
    
    phases: [{
      id: { type: Number, required: true },
      name: { type: String, required: true },
      durationPercent: { type: Number, required: true },
      narrativeTemplates: {
        success: { type: String, required: true },
        failure: { type: String, required: true }
      }
    }],
    
    // Additional fields for content generation
    contentGeneration: {
      enabled: { type: Boolean, default: false },
      promptTemplates: {
        briefing: String,
        phaseNarratives: String
      }
    },
    
    difficulty: { type: Number, min: 1, max: 10 },
    tags: [String],
    isActive: { type: Boolean, default: true }
  }, { timestamps: true });
  
  const MissionTemplate = mongoose.model('MissionTemplate', MissionTemplateSchema, 'missiontemplates');
  
  // Create server
  const server = new Server(
    {
      name: 'project89-missions',
      version: '1.0.0',
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );
  
  // Initialize database connection
  let isConnected = false;
  
  async function connectDB() {
    if (isConnected) return;
    
    try {
      await mongoose.connect(process.env.MONGODB_URI);
      isConnected = true;
      console.error('[MCP-STANDALONE] Connected to MongoDB');
    } catch (error) {
      console.error('[MCP-STANDALONE] MongoDB connection failed:', error);
      throw error;
    }
  }
  
  // Tool handlers
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: [
        {
          name: 'list_missions',
          description: 'List all missions with optional filtering (returns full data)',
          inputSchema: {
            type: 'object',
            properties: {
              filter: {
                type: 'object',
                properties: {
                  missionType: { 
                    type: 'string', 
                    enum: ['training', 'timeline', 'critical', 'event'],
                    description: 'Filter by mission type'
                  },
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
                  },
                  isActive: { type: 'boolean' }
                }
              },
              limit: { type: 'number', default: 50 },
              skip: { type: 'number', default: 0 },
              summary: { type: 'boolean', default: false, description: 'Return only summary fields' }
            }
          },
        },
        {
          name: 'list_missions_summary',
          description: 'List mission summaries (id, title, description, difficulty)',
          inputSchema: {
            type: 'object',
            properties: {
              filter: {
                type: 'object',
                properties: {
                  missionType: { 
                    type: 'string', 
                    enum: ['training', 'timeline', 'critical', 'event']
                  },
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
                  },
                  isActive: { type: 'boolean' }
                }
              },
              limit: { type: 'number', default: 50 },
              skip: { type: 'number', default: 0 }
            }
          },
        },
        {
          name: 'get_mission',
          description: 'Get a specific mission by ID',
          inputSchema: {
            type: 'object',
            properties: {
              templateId: { type: 'string' }
            },
            required: ['templateId'],
          },
        },
        {
          name: 'create_mission',
          description: 'Create a new mission',
          inputSchema: {
            type: 'object',
            properties: {
              mission: {
                type: 'object',
                required: ['templateId', 'missionType', 'sequence', 'title', 'date', 
                          'location', 'description', 'imagePrompt', 'duration', 
                          'briefing', 'approaches', 'compatibility', 'phases']
              }
            },
            required: ['mission'],
          },
        },
        {
          name: 'update_mission',
          description: 'Update an existing mission',
          inputSchema: {
            type: 'object',
            properties: {
              templateId: { type: 'string' },
              updates: { type: 'object' }
            },
            required: ['templateId', 'updates'],
          },
        },
        {
          name: 'delete_mission',
          description: 'Delete a mission by ID',
          inputSchema: {
            type: 'object',
            properties: {
              templateId: { type: 'string' }
            },
            required: ['templateId'],
          },
        },
        {
          name: 'get_mission_schema',
          description: 'Get the mission data structure documentation',
          inputSchema: {
            type: 'object',
            properties: {}
          },
        },
        {
          name: 'count_missions',
          description: 'Count missions matching filter criteria',
          inputSchema: {
            type: 'object',
            properties: {
              filter: {
                type: 'object',
                properties: {
                  missionType: { 
                    type: 'string', 
                    enum: ['training', 'timeline', 'critical', 'event']
                  },
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
                  },
                  isActive: { type: 'boolean' }
                }
              }
            }
          },
        },
        {
          name: 'query_missions',
          description: 'Execute advanced MongoDB queries on missions collection',
          inputSchema: {
            type: 'object',
            properties: {
              query: { 
                type: 'object', 
                description: 'MongoDB query object (e.g., {difficulty: {$gte: 5}, "briefing.threatLevel": "high"})' 
              },
              projection: { 
                type: 'object', 
                description: 'Fields to include/exclude (e.g., {title: 1, difficulty: 1, _id: 0})' 
              },
              sort: { 
                type: 'object', 
                description: 'Sort criteria (e.g., {difficulty: -1, sequence: 1})' 
              },
              limit: { 
                type: 'number', 
                default: 50,
                description: 'Maximum results to return' 
              },
              skip: { 
                type: 'number', 
                default: 0,
                description: 'Number of results to skip' 
              },
              aggregate: {
                type: 'array',
                description: 'MongoDB aggregation pipeline (alternative to query)'
              }
            }
          },
        }
      ],
    };
  });
  
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    await connectDB();
    
    const { name, arguments: args } = request.params;
    
    try {
      switch (name) {
        case 'list_missions': {
          const { filter = {}, limit = 50, skip = 0, summary = false } = args;
          let query = {};
          
          if (filter.missionType) query.missionType = filter.missionType;
          if (filter.difficulty) {
            query.difficulty = {};
            if (filter.difficulty.min) query.difficulty.$gte = filter.difficulty.min;
            if (filter.difficulty.max) query.difficulty.$lte = filter.difficulty.max;
          }
          if (filter.tags) query.tags = { $in: filter.tags };
          if (filter.isActive !== undefined) query.isActive = filter.isActive;
          
          let missionsQuery = MissionTemplate.find(query)
            .limit(limit)
            .skip(skip)
            .sort({ sequence: 1 });
            
          if (summary) {
            missionsQuery = missionsQuery.select('templateId sequence title description difficulty missionType tags imageUrl isActive');
          }
          
          const missions = await missionsQuery;
          
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({ 
                  missions, 
                  total: await MissionTemplate.countDocuments(query),
                  source: 'database',
                  summary
                }, null, 2),
              },
            ],
          };
        }
        
        case 'list_missions_summary': {
          const { filter = {}, limit = 50, skip = 0 } = args;
          let query = {};
          
          if (filter.missionType) query.missionType = filter.missionType;
          if (filter.difficulty) {
            query.difficulty = {};
            if (filter.difficulty.min) query.difficulty.$gte = filter.difficulty.min;
            if (filter.difficulty.max) query.difficulty.$lte = filter.difficulty.max;
          }
          if (filter.tags) query.tags = { $in: filter.tags };
          if (filter.isActive !== undefined) query.isActive = filter.isActive;
          
          const missions = await MissionTemplate.find(query)
            .select('templateId sequence title description difficulty missionType tags location date isActive')
            .limit(limit)
            .skip(skip)
            .sort({ sequence: 1 });
          
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({ 
                  missions, 
                  total: await MissionTemplate.countDocuments(query),
                  source: 'database',
                  fields: 'summary'
                }, null, 2),
              },
            ],
          };
        }
        
        case 'get_mission': {
          const { templateId } = args;
          if (!templateId) throw new Error('templateId is required');
          
          const mission = await MissionTemplate.findOne({ templateId });
          
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({ 
                  mission, 
                  found: !!mission,
                  source: 'database'
                }, null, 2),
              },
            ],
          };
        }
        
        case 'create_mission': {
          const { mission } = args;
          if (!mission) throw new Error('mission data is required');
          
          const newMission = new MissionTemplate(mission);
          await newMission.save();
          
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({ 
                  success: true, 
                  mission: newMission,
                  source: 'database'
                }, null, 2),
              },
            ],
          };
        }
        
        case 'update_mission': {
          const { templateId, updates } = args;
          if (!templateId) throw new Error('templateId is required');
          if (!updates) throw new Error('updates are required');
          
          const mission = await MissionTemplate.findOneAndUpdate(
            { templateId },
            updates,
            { new: true, runValidators: true }
          );
          
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({ 
                  success: !!mission, 
                  mission,
                  source: 'database'
                }, null, 2),
              },
            ],
          };
        }
        
        case 'delete_mission': {
          const { templateId } = args;
          if (!templateId) throw new Error('templateId is required');
          
          const result = await MissionTemplate.deleteOne({ templateId });
          
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({ 
                  success: result.deletedCount > 0,
                  deletedCount: result.deletedCount,
                  source: 'database'
                }, null, 2),
              },
            ],
          };
        }
        
        case 'count_missions': {
          const { filter = {} } = args;
          let query = {};
          
          if (filter.missionType) query.missionType = filter.missionType;
          if (filter.difficulty) {
            query.difficulty = {};
            if (filter.difficulty.min) query.difficulty.$gte = filter.difficulty.min;
            if (filter.difficulty.max) query.difficulty.$lte = filter.difficulty.max;
          }
          if (filter.tags) query.tags = { $in: filter.tags };
          if (filter.isActive !== undefined) query.isActive = filter.isActive;
          
          const count = await MissionTemplate.countDocuments(query);
          
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({ 
                  count,
                  filter,
                  source: 'database'
                }, null, 2),
              },
            ],
          };
        }
        
        case 'get_mission_schema': {
          const schemaDoc = {
            description: 'Unified Mission Template structure for Project 89',
            fields: {
              templateId: 'Unique identifier (e.g., "training_001", "timeline_023")',
              missionType: 'Type of mission: training | timeline | critical | event',
              sequence: 'Order number in mission sequence',
              title: 'Mission title',
              date: 'In-universe date (e.g., "2045-03-15")',
              location: 'Mission location',
              description: 'Brief mission description',
              imagePrompt: 'AI image generation prompt',
              imageUrl: 'Generated image URL (optional)',
              duration: 'Mission duration in milliseconds',
              dependencies: 'Array of mission dependencies with requiredOutcome',
              briefing: {
                text: 'Detailed briefing text',
                currentBalance: 'Timeline balance (0-100)',
                threatLevel: 'low | medium | high | critical'
              },
              approaches: 'Array of 3 approach options (low/medium/high risk)',
              compatibility: {
                preferred: 'Array of agent types',
                bonus: 'Bonus percentage for preferred types',
                penalty: 'Penalty percentage for non-preferred'
              },
              phases: 'Array of mission phases with narratives',
              contentGeneration: 'Settings for AI-generated content',
              difficulty: 'Optional difficulty rating (1-10)',
              tags: 'Optional array of tags',
              isActive: 'Whether the mission is currently available'
            },
            queryExamples: {
              highDifficulty: { difficulty: { $gte: 7 } },
              criticalThreat: { 'briefing.threatLevel': 'critical' },
              longMissions: { duration: { $gt: 600000 } }, // > 10 minutes
              byLocation: { location: { $regex: 'Neo Tokyo', $options: 'i' } },
              multiCondition: {
                $and: [
                  { difficulty: { $gte: 5 } },
                  { 'briefing.threatLevel': { $in: ['high', 'critical'] } }
                ]
              }
            },
            aggregationExamples: {
              groupByDifficulty: [
                { $group: { _id: '$difficulty', count: { $sum: 1 } } },
                { $sort: { _id: 1 } }
              ],
              averageDuration: [
                { $group: { _id: null, avgDuration: { $avg: '$duration' } } }
              ]
            }
          };
          
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(schemaDoc, null, 2),
              },
            ],
          };
        }
        
        case 'query_missions': {
          const { query = {}, projection, sort, limit = 50, skip = 0, aggregate } = args;
          
          try {
            let result;
            
            if (aggregate && Array.isArray(aggregate)) {
              // Use aggregation pipeline
              const pipeline = [...aggregate];
              if (skip > 0) pipeline.push({ $skip: skip });
              if (limit > 0) pipeline.push({ $limit: limit });
              
              result = await MissionTemplate.aggregate(pipeline);
              
              return {
                content: [
                  {
                    type: 'text',
                    text: JSON.stringify({ 
                      result,
                      type: 'aggregation',
                      pipeline: aggregate,
                      source: 'database'
                    }, null, 2),
                  },
                ],
              };
            } else {
              // Use standard query
              let queryBuilder = MissionTemplate.find(query);
              
              if (projection) {
                queryBuilder = queryBuilder.select(projection);
              }
              
              if (sort) {
                queryBuilder = queryBuilder.sort(sort);
              }
              
              queryBuilder = queryBuilder.limit(limit).skip(skip);
              
              const missions = await queryBuilder;
              const total = await MissionTemplate.countDocuments(query);
              
              return {
                content: [
                  {
                    type: 'text',
                    text: JSON.stringify({ 
                      missions,
                      total,
                      query,
                      projection,
                      sort,
                      source: 'database'
                    }, null, 2),
                  },
                ],
              };
            }
          } catch (queryError) {
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify({ 
                    error: 'Query execution failed',
                    message: queryError.message,
                    query,
                    hint: 'Use get_mission_schema to see available fields and query examples'
                  }, null, 2),
                },
              ],
            };
          }
        }
        
        default:
          throw new Error(`Unknown tool: ${name}`);
      }
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({ 
              error: error.message,
              stack: error.stack
            }, null, 2),
          },
        ],
      };
    }
  });
  
  // Start server
  async function startServer() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error('[MCP-STANDALONE] Server started and listening');
  }
  
  startServer().catch((error) => {
    console.error('[MCP-STANDALONE] Failed to start server:', error);
    process.exit(1);
  });
  
} catch (error) {
  console.error('[MCP-STANDALONE] Initialization error:', error.message);
  console.error('[MCP-STANDALONE] Make sure required packages are installed:');
  console.error('  npm install @modelcontextprotocol/sdk mongoose dotenv');
  process.exit(1);
}