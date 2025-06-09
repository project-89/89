#!/usr/bin/env node

/**
 * Simple MCP Server for Project 89 Mission Management
 * 
 * This script provides a standalone MCP server that can work
 * without complex dependencies, using the existing server infrastructure.
 */

const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} = require('@modelcontextprotocol/sdk/types.js');

// Import the existing server code
const path = require('path');
const serverPath = path.join(__dirname, 'server');

// Check if we're in development and need to use the source files
let mcpTools, TRAINING_MISSIONS;

try {
  // Try to load from the compiled server
  const { createMissionMCPServer } = require(path.join(serverPath, 'dist/services/mcp/mcpServer.js'));
  const trainingData = require(path.join(serverPath, 'dist/data/trainingMissions.js'));
  TRAINING_MISSIONS = trainingData.TRAINING_MISSIONS;
  
  // Create the server using the existing function
  async function main() {
    console.error('Project 89 Mission MCP Server (Simple) starting...');
    console.error('Using existing server infrastructure');
    
    const server = createMissionMCPServer();
    const transport = new StdioServerTransport();
    await server.connect(transport);
    
    console.error('Server is running with database connection');
    console.error('Available tools from existing server:');
    console.error('- get_missions');
    console.error('- create_mission');
    console.error('- deploy_mission');
    console.error('- get_deployment');
    console.error('- get_active_deployments');
    console.error('- get_lore');
    console.error('- get_mission_stats');
    console.error('- update_mission');
    console.error('- get_database_missions');
    console.error('- create_database_mission');
    console.error('- update_database_mission');
    console.error('- get_mission_history');
    console.error('- migrate_training_missions');
  }
  
  main().catch((error) => {
    console.error('Server error:', error);
    process.exit(1);
  });
  
} catch (error) {
  console.error('Could not load server modules, falling back to simple in-memory version');
  
  // Fallback: Create a simple in-memory server
  const missionsStore = [
    {
      missionId: "training_001",
      sequence: 1,
      title: "First Contact",
      date: "December 15, 2025",
      location: "Global Internet",
      description: "Detect early Oneirocom infiltration in social media algorithms",
      imagePrompt: "Cyberpunk data streams with hidden surveillance nodes glowing red in social media networks",
      duration: 300000,
      briefing: {
        text: "Intelligence suggests Oneirocom is testing early consciousness-mapping algorithms through social media engagement patterns.",
        currentBalance: 85,
        threatLevel: "low"
      },
      approaches: [
        {
          type: "low",
          name: "Organize",
          description: "Coordinate with digital privacy groups to raise awareness",
          successRate: { min: 0.7, max: 0.9 },
          timelineShift: { min: 1, max: 3 }
        },
        {
          type: "medium",
          name: "Expose",
          description: "Leak evidence of the surveillance algorithms to journalists",
          successRate: { min: 0.5, max: 0.7 },
          timelineShift: { min: 3, max: 5 }
        },
        {
          type: "high",
          name: "Sabotage",
          description: "Inject chaos data to corrupt their early models",
          successRate: { min: 0.3, max: 0.5 },
          timelineShift: { min: 5, max: 8 }
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
      ]
    }
  ];

  // Simple tool implementations
  const tools = {
    list_missions: {
      description: 'List all missions (in-memory version)',
      inputSchema: {
        type: 'object',
        properties: {},
        required: []
      },
      handler: async () => {
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(missionsStore, null, 2)
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
        const mission = missionsStore.find(m => m.missionId === missionId);
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
                missionId: "Unique identifier",
                sequence: "Order number",
                title: "Mission title",
                date: "Mission date",
                location: "Mission location",
                description: "Brief description",
                imagePrompt: "AI image prompt",
                duration: "Duration in milliseconds",
                briefing: {
                  text: "Briefing text",
                  currentBalance: "Timeline balance",
                  threatLevel: "low|medium|high|critical"
                },
                approaches: "Array of 3 approaches (low/medium/high)",
                compatibility: "Agent type preferences",
                phases: "Mission execution phases"
              },
              example: missionsStore[0]
            }, null, 2)
          }]
        };
      }
    }
  };

  // Create simple server
  async function main() {
    const server = new Server(
      {
        name: 'project89-mission-simple',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

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

      return await tool.handler(args || {});
    });

    const transport = new StdioServerTransport();
    await server.connect(transport);
    
    console.error('Project 89 Mission MCP Server (Simple) running...');
    console.error('Available tools:');
    console.error('- list_missions');
    console.error('- get_mission');
    console.error('- get_mission_schema');
  }

  main().catch((error) => {
    console.error('Server error:', error);
    process.exit(1);
  });
}