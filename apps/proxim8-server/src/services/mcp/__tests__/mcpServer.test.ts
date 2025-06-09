import { createMissionMCPServer } from '../mcpServer';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

// Mock the MCP SDK
jest.mock('@modelcontextprotocol/sdk/server/mcp.js');
jest.mock('../mcpTools', () => ({
  mcpTools: {
    getMissions: jest.fn(),
    createMission: jest.fn(),
    deployMission: jest.fn(),
    getDeployment: jest.fn(),
    getActiveDeployments: jest.fn(),
    getLore: jest.fn(),
    getMissionStats: jest.fn(),
    updateMission: jest.fn(),
  },
  GetMissionsSchema: { shape: {} },
  CreateMissionSchema: { shape: {} },
  DeployMissionSchema: { shape: {} },
  GetDeploymentSchema: { shape: {} },
  GetLoreSchema: { shape: {} },
  GetMissionStatsSchema: { shape: {} },
  UpdateMissionSchema: { shape: {} },
}));

const MockedMcpServer = McpServer as jest.MockedClass<typeof McpServer>;

describe('MCP Server Factory', () => {
  let mockServerInstance: jest.Mocked<McpServer>;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockServerInstance = {
      tool: jest.fn(),
      resource: jest.fn(),
      prompt: jest.fn(),
      connect: jest.fn(),
      close: jest.fn(),
      setRequestHandler: jest.fn(),
      setNotificationHandler: jest.fn(),
      listTools: jest.fn(),
      listResources: jest.fn(),
      listPrompts: jest.fn(),
    } as any;

    MockedMcpServer.mockImplementation(() => mockServerInstance);
  });

  describe('createMissionMCPServer', () => {
    it('should create MCP server with correct configuration', () => {
      const server = createMissionMCPServer();

      expect(MockedMcpServer).toHaveBeenCalledWith({
        name: "Project89MissionMCP",
        version: "1.0.0",
      });
      expect(server).toBe(mockServerInstance);
    });

    it('should register all 8 mission tools', () => {
      createMissionMCPServer();

      // Verify all tools are registered
      expect(mockServerInstance.tool).toHaveBeenCalledTimes(8);
      
      // Check specific tool registrations
      expect(mockServerInstance.tool).toHaveBeenCalledWith(
        "get_missions", 
        {},
        expect.any(Function)
      );
      
      expect(mockServerInstance.tool).toHaveBeenCalledWith(
        "create_mission", 
        {},
        expect.any(Function)
      );
      
      expect(mockServerInstance.tool).toHaveBeenCalledWith(
        "deploy_mission", 
        {},
        expect.any(Function)
      );
      
      expect(mockServerInstance.tool).toHaveBeenCalledWith(
        "get_deployment", 
        {},
        expect.any(Function)
      );
      
      expect(mockServerInstance.tool).toHaveBeenCalledWith(
        "get_active_deployments", 
        {},
        expect.any(Function)
      );
      
      expect(mockServerInstance.tool).toHaveBeenCalledWith(
        "get_lore", 
        {},
        expect.any(Function)
      );
      
      expect(mockServerInstance.tool).toHaveBeenCalledWith(
        "get_mission_stats", 
        {},
        expect.any(Function)
      );
      
      expect(mockServerInstance.tool).toHaveBeenCalledWith(
        "update_mission", 
        {},
        expect.any(Function)
      );
    });

    it('should create multiple independent server instances', () => {
      const server1 = createMissionMCPServer();
      const server2 = createMissionMCPServer();

      expect(MockedMcpServer).toHaveBeenCalledTimes(2);
      expect(server1).toBe(mockServerInstance);
      expect(server2).toBe(mockServerInstance);
    });
  });

  describe('tool integration', () => {
    it('should properly wire tool functions', async () => {
      const { mcpTools } = require('../mcpTools');
      
      createMissionMCPServer();

      // Get the function passed to the first tool registration (get_missions)
      const getMissionsCall = mockServerInstance.tool.mock.calls.find(call => call[0] === 'get_missions');
      expect(getMissionsCall).toBeDefined();
      
      const getMissionsHandler = getMissionsCall![2];
      const mockParams = { agentId: 'test_agent' };
      
      // Call the handler
      await getMissionsHandler(mockParams);
      
      // Verify it calls the actual tool implementation
      expect(mcpTools.getMissions).toHaveBeenCalledWith(mockParams);
    });

    it('should handle tool errors gracefully', async () => {
      const { mcpTools } = require('../mcpTools');
      mcpTools.getMissions.mockRejectedValue(new Error('Tool error'));
      
      createMissionMCPServer();

      const getMissionsCall = mockServerInstance.tool.mock.calls.find(call => call[0] === 'get_missions');
      const getMissionsHandler = getMissionsCall![2];
      
      // Should not throw even if tool implementation throws
      await expect(getMissionsHandler({})).rejects.toThrow('Tool error');
    });
  });
});