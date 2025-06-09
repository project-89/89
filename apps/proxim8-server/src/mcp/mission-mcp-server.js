#!/usr/bin/env node

/**
 * Standalone MCP Server for Project 89 Mission Management
 * 
 * This script provides a complete MCP server that can be run directly
 * for AI agents to manage missions in the Project 89 system.
 * 
 * Usage: node mission-mcp-server.js
 * 
 * Available tools:
 * - list_missions: List all missions with optional filters
 * - get_mission: Get a specific mission by ID
 * - create_mission: Create a new mission with full data structure
 * - update_mission: Update an existing mission
 * - validate_mission: Validate mission data structure
 * - get_mission_schema: Get the complete mission type schema
 */

const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} = require('@modelcontextprotocol/sdk/types.js');
const { z } = require('zod');
const fs = require('fs').promises;
const path = require('path');

// Mission type schema - this defines the complete data structure
const MissionApproachSchema = z.object({
  type: z.enum(['low', 'medium', 'high']).describe('Approach difficulty level'),
  name: z.string().describe('Display name for the approach'),
  description: z.string().describe('Detailed description of this approach'),
  duration: z.number().optional().describe('Duration in milliseconds (optional, can inherit from mission)'),
  successRate: z.object({
    min: z.number().min(0).max(1).describe('Minimum success rate (0-1)'),
    max: z.number().min(0).max(1).describe('Maximum success rate (0-1)')
  }),
  timelineShift: z.object({
    min: z.number().describe('Minimum timeline shift points'),
    max: z.number().describe('Maximum timeline shift points')
  }),
  rewards: z.object({
    timelinePoints: z.number().describe('Timeline points earned'),
    experience: z.number().describe('Experience points earned'),
    influenceMultiplier: z.number().optional().describe('Influence multiplier (optional)')
  }).optional()
});

const MissionPhaseSchema = z.object({
  id: z.number().describe('Phase ID (sequential)'),
  name: z.string().describe('Phase name'),
  durationPercent: z.number().describe('Duration as percentage of total mission time'),
  narrativeTemplates: z.object({
    success: z.string().describe('Success narrative template with {agentName} placeholder'),
    failure: z.string().describe('Failure narrative template with {agentName} placeholder')
  }),
  description: z.string().optional(),
  challengeRating: z.number().min(1).max(10).optional(),
  criticalPath: z.boolean().optional()
});

const MissionTemplateSchema = z.object({
  missionId: z.string().describe('Unique mission identifier (e.g., training_001)'),
  sequence: z.number().describe('Mission sequence number'),
  title: z.string().describe('Mission title'),
  date: z.string().describe('Mission date (e.g., "December 15, 2025")'),
  location: z.string().describe('Mission location'),
  description: z.string().describe('Brief mission description'),
  imagePrompt: z.string().describe('AI image generation prompt for mission visual'),
  duration: z.number().describe('Total mission duration in milliseconds'),
  briefing: z.object({
    text: z.string().describe('Detailed mission briefing text'),
    currentBalance: z.number().describe('Current timeline balance'),
    threatLevel: z.enum(['low', 'medium', 'high', 'critical']).describe('Mission threat level')
  }),
  approaches: z.array(MissionApproachSchema).length(3).describe('Must have exactly 3 approaches: low, medium, high'),
  compatibility: z.object({
    preferred: z.array(z.enum(['analytical', 'aggressive', 'diplomatic', 'adaptive'])).describe('Preferred agent personality types'),
    bonus: z.number().describe('Compatibility bonus percentage'),
    penalty: z.number().describe('Compatibility penalty percentage')
  }),
  phases: z.array(MissionPhaseSchema).describe('Mission phases that make up the mission'),
  difficulty: z.number().min(1).max(10).optional().describe('Overall difficulty rating (1-10)'),
  category: z.string().optional().default('training'),
  tags: z.array(z.string()).optional()
});

// Store missions in memory (you can modify this to use a file or database)
let missionsStore = [];

// Load missions data
async function loadMissions() {
  if (missionsStore.length > 0) {
    return missionsStore;
  }
  
  try {
    const missionsPath = path.join(__dirname, 'missions-data.json');
    const data = await fs.readFile(missionsPath, 'utf-8');
    missionsStore = JSON.parse(data);
    return missionsStore;
  } catch (error) {
    console.error('Info: No saved missions found, using default data');
    missionsStore = getDefaultMissions();
    return missionsStore;
  }
}

// Save missions data
async function saveMissions() {
  try {
    const missionsPath = path.join(__dirname, 'missions-data.json');
    await fs.writeFile(missionsPath, JSON.stringify(missionsStore, null, 2));
  } catch (error) {
    console.error('Warning: Could not save missions to file:', error.message);
  }
}

// Get default missions for reference
function getDefaultMissions() {
  return [
    {
      missionId: "training_001",
      sequence: 1,
      title: "First Contact",
      date: "December 15, 2025",
      location: "Global Internet",
      description: "Detect early Oneirocom infiltration in social media algorithms",
      imagePrompt: "Cyberpunk data streams with hidden surveillance nodes glowing red in social media networks",
      duration: 300000, // 5 minutes
      briefing: {
        text: "Intelligence suggests Oneirocom is testing early consciousness-mapping algorithms through social media engagement patterns. This is our first confirmed detection of their technology in our timeline.",
        currentBalance: 85,
        threatLevel: "low"
      },
      approaches: [
        {
          type: "low",
          name: "Organize",
          description: "Coordinate with digital privacy groups to raise awareness",
          successRate: { min: 0.7, max: 0.9 },
          timelineShift: { min: 1, max: 3 },
          rewards: { timelinePoints: 100, experience: 50 }
        },
        {
          type: "medium",
          name: "Expose",
          description: "Leak evidence of the surveillance algorithms to journalists",
          successRate: { min: 0.5, max: 0.7 },
          timelineShift: { min: 3, max: 5 },
          rewards: { timelinePoints: 150, experience: 75 }
        },
        {
          type: "high",
          name: "Sabotage",
          description: "Inject chaos data to corrupt their early models",
          successRate: { min: 0.3, max: 0.5 },
          timelineShift: { min: 5, max: 8 },
          rewards: { timelinePoints: 200, experience: 100 }
        }
      ],
      compatibility: {
        preferred: ["analytical", "diplomatic"],
        bonus: 0.15,
        penalty: 0.1
      },
      phases: [
        {
          id: 1,
          name: "Infiltration",
          durationPercent: 25,
          narrativeTemplates: {
            success: "{agentName} successfully breaches Oneirocom's data collection network.",
            failure: "{agentName} triggers an automated defense system while attempting infiltration."
          }
        },
        {
          id: 2,
          name: "Data Extraction",
          durationPercent: 50,
          narrativeTemplates: {
            success: "{agentName} locates and extracts critical algorithm documentation.",
            failure: "{agentName} encounters encrypted data that resists all decryption attempts."
          }
        },
        {
          id: 3,
          name: "Implementation",
          durationPercent: 25,
          narrativeTemplates: {
            success: "{agentName} successfully executes the chosen approach, shifting the timeline.",
            failure: "{agentName}'s efforts are detected and countered by Oneirocom security."
          }
        }
      ],
      difficulty: 3,
      category: "training",
      tags: ["surveillance", "social_media", "early_timeline"]
    },
    {
      missionId: "training_002",
      sequence: 2,
      title: "Neural Seeds",
      date: "June 15, 2027",
      location: "Neo-Tokyo",
      description: "Disrupt neural interface beta testing that will lead to mass adoption",
      imagePrompt: "Futuristic Tokyo street with volunteers lined up for neural implant testing, holographic brain scans visible",
      duration: 360000, // 6 minutes
      briefing: {
        text: "Oneirocom is conducting 'voluntary' neural interface trials in Neo-Tokyo. These early adopters don't realize they're providing the data that will perfect consciousness control technology.",
        currentBalance: 82,
        threatLevel: "medium"
      },
      approaches: [
        {
          type: "low",
          name: "Organize",
          description: "Rally local communities to protest the trials",
          successRate: { min: 0.6, max: 0.8 },
          timelineShift: { min: 2, max: 4 },
          rewards: { timelinePoints: 120, experience: 60 }
        },
        {
          type: "medium",
          name: "Expose",
          description: "Infiltrate the trials and document the true purposes",
          successRate: { min: 0.4, max: 0.6 },
          timelineShift: { min: 4, max: 6 },
          rewards: { timelinePoints: 180, experience: 90 }
        },
        {
          type: "high",
          name: "Sabotage",
          description: "Plant false data to corrupt the neural mapping algorithms",
          successRate: { min: 0.25, max: 0.45 },
          timelineShift: { min: 6, max: 10 },
          rewards: { timelinePoints: 250, experience: 125 }
        }
      ],
      compatibility: {
        preferred: ["aggressive", "adaptive"],
        bonus: 0.2,
        penalty: 0.15
      },
      phases: [
        {
          id: 1,
          name: "Reconnaissance",
          durationPercent: 30,
          narrativeTemplates: {
            success: "{agentName} infiltrates the test facility and maps security protocols.",
            failure: "{agentName} is detected by biometric scanners during initial surveillance."
          }
        },
        {
          id: 2,
          name: "Infiltration",
          durationPercent: 40,
          narrativeTemplates: {
            success: "{agentName} successfully poses as a trial participant and accesses inner systems.",
            failure: "{agentName}'s cover identity fails neural compatibility screening."
          }
        },
        {
          id: 3,
          name: "Execution",
          durationPercent: 30,
          narrativeTemplates: {
            success: "{agentName} implements the chosen strategy, disrupting Oneirocom's plans.",
            failure: "{agentName}'s sabotage attempt is countered by adaptive security AI."
          }
        }
      ],
      difficulty: 5,
      category: "training",
      tags: ["neural_interface", "beta_testing", "neo_tokyo"]
    }
  ];
}

// Tool implementations
const tools = {
  list_missions: {
    description: 'List all missions with optional filters',
    inputSchema: z.object({
      filter: z.object({
        category: z.string().optional(),
        difficulty: z.object({
          min: z.number().optional(),
          max: z.number().optional()
        }).optional(),
        tags: z.array(z.string()).optional()
      }).optional()
    }),
    handler: async ({ filter }) => {
      const missions = await loadMissions();
      let filtered = missions;

      if (filter) {
        if (filter.category) {
          filtered = filtered.filter(m => m.category === filter.category);
        }
        if (filter.difficulty) {
          filtered = filtered.filter(m => {
            const diff = m.difficulty || 5;
            return (!filter.difficulty.min || diff >= filter.difficulty.min) &&
                   (!filter.difficulty.max || diff <= filter.difficulty.max);
          });
        }
        if (filter.tags && filter.tags.length > 0) {
          filtered = filtered.filter(m => 
            m.tags && filter.tags.some(tag => m.tags.includes(tag))
          );
        }
      }

      return {
        content: [{
          type: 'text',
          text: JSON.stringify(filtered, null, 2)
        }]
      };
    }
  },

  get_mission: {
    description: 'Get a specific mission by ID',
    inputSchema: z.object({
      missionId: z.string()
    }),
    handler: async ({ missionId }) => {
      const missions = await loadMissions();
      const mission = missions.find(m => m.missionId === missionId);

      if (!mission) {
        throw new Error(`Mission not found: ${missionId}`);
      }

      return {
        content: [{
          type: 'text',
          text: JSON.stringify(mission, null, 2)
        }]
      };
    }
  },

  create_mission: {
    description: 'Create a new mission with complete data structure',
    inputSchema: z.object({
      mission: MissionTemplateSchema
    }),
    handler: async ({ mission }) => {
      // Validate the mission data
      const validated = MissionTemplateSchema.parse(mission);
      
      const missions = await loadMissions();
      
      // Check for duplicate ID
      if (missions.find(m => m.missionId === validated.missionId)) {
        throw new Error(`Mission with ID ${validated.missionId} already exists`);
      }

      missions.push(validated);
      missionsStore = missions;
      await saveMissions();

      return {
        content: [{
          type: 'text',
          text: `Mission created successfully: ${validated.missionId}\n\n${JSON.stringify(validated, null, 2)}`
        }]
      };
    }
  },

  update_mission: {
    description: 'Update an existing mission',
    inputSchema: z.object({
      missionId: z.string(),
      updates: z.record(z.any()).describe('Partial updates to apply to the mission')
    }),
    handler: async ({ missionId, updates }) => {
      const missions = await loadMissions();
      const index = missions.findIndex(m => m.missionId === missionId);

      if (index === -1) {
        throw new Error(`Mission not found: ${missionId}`);
      }

      // Apply updates
      const updated = { ...missions[index], ...updates };
      
      // Validate the updated mission
      const validated = MissionTemplateSchema.parse(updated);
      missions[index] = validated;
      
      missionsStore = missions;
      await saveMissions();

      return {
        content: [{
          type: 'text',
          text: `Mission updated successfully: ${missionId}\n\n${JSON.stringify(validated, null, 2)}`
        }]
      };
    }
  },

  validate_mission: {
    description: 'Validate a mission data structure without saving',
    inputSchema: z.object({
      mission: z.record(z.any())
    }),
    handler: async ({ mission }) => {
      try {
        const validated = MissionTemplateSchema.parse(mission);
        return {
          content: [{
            type: 'text',
            text: `Mission data is valid!\n\n${JSON.stringify(validated, null, 2)}`
          }]
        };
      } catch (error) {
        return {
          content: [{
            type: 'text',
            text: `Validation failed:\n${error.message}\n\nIssues:\n${JSON.stringify(error.errors, null, 2)}`
          }]
        };
      }
    }
  },

  get_mission_schema: {
    description: 'Get the complete mission type schema and structure',
    inputSchema: z.object({}),
    handler: async () => {
      const schemaInfo = {
        description: "Complete Project 89 Mission Data Structure",
        missionTemplate: {
          missionId: "Unique identifier (e.g., training_001)",
          sequence: "Mission order number",
          title: "Mission title",
          date: "Mission date string",
          location: "Mission location",
          description: "Brief description",
          imagePrompt: "AI image generation prompt",
          duration: "Duration in milliseconds",
          briefing: {
            text: "Detailed briefing text",
            currentBalance: "Current timeline balance",
            threatLevel: "low | medium | high | critical"
          },
          approaches: "Array of exactly 3 approaches (low, medium, high)",
          compatibility: {
            preferred: "Array of preferred agent types",
            bonus: "Compatibility bonus percentage",
            penalty: "Compatibility penalty percentage"
          },
          phases: "Array of mission phases",
          difficulty: "1-10 rating (optional)",
          category: "Mission category (optional)",
          tags: "Array of tags (optional)"
        },
        approachStructure: {
          type: "low | medium | high",
          name: "Display name",
          description: "Detailed description",
          duration: "Duration in ms (optional)",
          successRate: { min: "0-1", max: "0-1" },
          timelineShift: { min: "number", max: "number" },
          rewards: {
            timelinePoints: "number",
            experience: "number",
            influenceMultiplier: "number (optional)"
          }
        },
        phaseStructure: {
          id: "Sequential phase ID",
          name: "Phase name",
          durationPercent: "Percentage of total duration",
          narrativeTemplates: {
            success: "Success narrative with {agentName} placeholder",
            failure: "Failure narrative with {agentName} placeholder"
          }
        },
        exampleMission: getDefaultMissions()[0]
      };

      return {
        content: [{
          type: 'text',
          text: JSON.stringify(schemaInfo, null, 2)
        }]
      };
    }
  }
};

// Create and start the MCP server
async function main() {
  const server = new Server(
    {
      name: 'project89-mission-mcp',
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
  
  console.error('Project 89 Mission MCP Server running...');
  console.error('Available tools:');
  console.error('- list_missions: List all missions');
  console.error('- get_mission: Get a specific mission');
  console.error('- create_mission: Create a new mission');
  console.error('- update_mission: Update an existing mission');
  console.error('- validate_mission: Validate mission data');
  console.error('- get_mission_schema: Get mission structure info');
}

main().catch((error) => {
  console.error('Server error:', error);
  process.exit(1);
});