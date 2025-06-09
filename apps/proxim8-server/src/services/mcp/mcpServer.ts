import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { 
  mcpTools,
  GetMissionsSchema,
  CreateMissionSchema,
  DeployMissionSchema,
  GetDeploymentSchema,
  GetLoreSchema,
  GetMissionStatsSchema,
  UpdateMissionSchema
} from './mcpTools';
import {
  mcpDatabaseTools,
  GetDatabaseMissionsSchema,
  CreateDatabaseMissionSchema,
  UpdateDatabaseMissionSchema,
  GetMissionHistorySchema
} from './mcpToolsDatabase';
import {
  mcpSummaryTools,
  GetMissionsSummarySchema,
  GetMissionDetailSchema
} from './mcpToolsSummary';

/**
 * Creates a new Mission MCP Server instance with all Project 89 mission tools
 */
export function createMissionMCPServer(): McpServer {
  const server = new McpServer({
    name: "Project89MissionMCP",
    version: "1.0.0",
  });

  // Register all mission management tools
  server.tool("get_missions", GetMissionsSchema.shape, async (params) => {
    return await mcpTools.getMissions(params);
  });

  server.tool("create_mission", CreateMissionSchema.shape, async (params) => {
    return await mcpTools.createMission(params);
  });

  server.tool("deploy_mission", DeployMissionSchema.shape, async (params) => {
    return await mcpTools.deployMission(params);
  });

  server.tool("get_deployment", GetDeploymentSchema.shape, async (params) => {
    return await mcpTools.getDeployment(params);
  });

  server.tool("get_active_deployments", {}, async () => {
    return await mcpTools.getActiveDeployments();
  });

  server.tool("get_lore", GetLoreSchema.shape, async (params) => {
    return await mcpTools.getLore(params);
  });

  server.tool("get_mission_stats", GetMissionStatsSchema.shape, async (params) => {
    return await mcpTools.getMissionStats(params);
  });

  server.tool("update_mission", UpdateMissionSchema.shape, async (params) => {
    return await mcpTools.updateMission(params);
  });

  // Database-persistent mission tools
  server.tool("get_database_missions", GetDatabaseMissionsSchema.shape, async (params) => {
    return await mcpDatabaseTools.getDatabaseMissions(params);
  });

  server.tool("create_database_mission", CreateDatabaseMissionSchema.shape, async (params) => {
    return await mcpDatabaseTools.createDatabaseMission(params);
  });

  server.tool("update_database_mission", UpdateDatabaseMissionSchema.shape, async (params) => {
    return await mcpDatabaseTools.updateDatabaseMission(params);
  });

  server.tool("get_mission_history", GetMissionHistorySchema.shape, async (params) => {
    return await mcpDatabaseTools.getMissionHistory(params);
  });

  server.tool("migrate_training_missions", {}, async () => {
    return await mcpDatabaseTools.migrateTrainingMissions();
  });

  // Summary tools for better data management
  server.tool("get_missions_summary", GetMissionsSummarySchema.shape, async (params) => {
    const result = await mcpSummaryTools.getMissionsSummary(params);
    // Ensure the content type is explicitly set to 'text'
    return {
      content: result.content.map(item => ({
        ...item,
        type: 'text' as const
      }))
    };
  });

  server.tool("get_mission_detail", GetMissionDetailSchema.shape, async (params) => {
    const result = await mcpSummaryTools.getMissionDetail(params);
    // Ensure the content type is explicitly set to 'text'
    return {
      content: result.content.map(item => ({
        ...item,
        type: 'text' as const
      }))
    };
  });

  return server;
}