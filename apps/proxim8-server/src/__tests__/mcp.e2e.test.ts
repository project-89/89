import request from 'supertest';
import express from 'express';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '../index';
import TrainingMissionDeployment from '../models/game/TrainingMissionDeployment';
import Lore from '../models/Lore';

// Mock external services
jest.mock('../services/cache', () => ({
  initRedisClient: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('../services/tokenRotation', () => ({
  initializeTokenRotation: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('../services/pipeline', () => ({
  createDefaultConfigurations: jest.fn().mockResolvedValue(undefined),
  registerDefaultMiddleware: jest.fn(),
}));

jest.mock('../utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  }
}));

describe('MCP End-to-End Tests', () => {
  let mongoServer: MongoMemoryServer;
  let testApp: express.Application;

  beforeAll(async () => {
    // Start in-memory MongoDB
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    
    // Connect to the in-memory database
    await mongoose.connect(mongoUri);

    // Create test app without starting the server
    testApp = express();
    testApp.use(express.json());
    
    // Import and use just the MCP routes
    const mcpRoutes = require('../routes/mcp').default;
    testApp.use('/api/mcp', mcpRoutes);
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    // Clear all collections before each test
    await TrainingMissionDeployment.deleteMany({});
    await Lore.deleteMany({});
  });

  const API_KEY = 'proxim8-dev-key';

  const initializeSession = async () => {
    const response = await request(testApp)
      .post('/api/mcp')
      .set('X-API-Key', API_KEY)
      .send({
        jsonrpc: '2.0',
        method: 'initialize',
        id: 1,
        params: {
          protocolVersion: '2024-11-05',
          capabilities: {},
          clientInfo: {
            name: 'test-client',
            version: '1.0.0'
          }
        }
      });

    return response;
  };

  const callTool = async (sessionId: string, toolName: string, arguments_: any) => {
    return await request(testApp)
      .post('/api/mcp')
      .set('X-API-Key', API_KEY)
      .set('mcp-session-id', sessionId)
      .send({
        jsonrpc: '2.0',
        method: 'tools/call',
        id: 2,
        params: {
          name: toolName,
          arguments: arguments_
        }
      });
  };

  describe('Full MCP Workflow', () => {
    it('should complete a full mission lifecycle via MCP tools', async () => {
      // Step 1: Initialize MCP session
      const initResponse = await initializeSession();
      expect(initResponse.status).toBe(200);

      // Extract session ID from response (this would normally be handled by the transport)
      const sessionId = 'test-session-e2e';

      // Step 2: Get initial missions
      const getMissionsResponse = await callTool(sessionId, 'get_missions', {});
      expect(getMissionsResponse.status).toBe(200);

      // Step 3: Create a new mission
      const newMission = {
        missionId: 'e2e_test_mission',
        sequence: 999,
        title: 'E2E Test Mission',
        date: '2089-12-31',
        location: 'Test Virtual Environment',
        description: 'End-to-end test mission',
        imagePrompt: 'A testing facility in cyberspace',
        duration: 1800000, // 30 minutes
        briefing: {
          text: 'Complete the E2E test sequence',
          currentBalance: 1000,
          threatLevel: 'low'
        },
        approaches: [
          {
            type: 'medium',
            name: 'Standard Test',
            description: 'Run standard test sequence',
            successRate: { min: 0.8, max: 0.95 },
            timelineShift: { min: 0, max: 5 }
          }
        ],
        compatibility: {
          preferred: ['analytical'],
          bonus: 0.2,
          penalty: 0.05
        },
        phases: [
          {
            id: 1,
            name: 'Test Execution',
            durationPercent: 100,
            narrativeTemplates: {
              success: 'All tests passed successfully',
              failure: 'Some tests failed'
            }
          }
        ]
      };

      const createMissionResponse = await callTool(sessionId, 'create_mission', {
        missionData: newMission
      });
      expect(createMissionResponse.status).toBe(200);

      // Step 4: Deploy the mission
      const deployResponse = await callTool(sessionId, 'deploy_mission', {
        agentId: 'test_agent_e2e',
        missionId: 'e2e_test_mission',
        proxim8Id: 'proxim8_e2e_test',
        approach: 'medium'
      });
      expect(deployResponse.status).toBe(200);

      // Step 5: Get active deployments to verify deployment
      const activeDeploymentsResponse = await callTool(sessionId, 'get_active_deployments', {});
      expect(activeDeploymentsResponse.status).toBe(200);

      // Step 6: Get mission statistics
      const statsResponse = await callTool(sessionId, 'get_mission_stats', {
        agentId: 'test_agent_e2e'
      });
      expect(statsResponse.status).toBe(200);

      // Step 7: Update the mission
      const updateResponse = await callTool(sessionId, 'update_mission', {
        missionId: 'e2e_test_mission',
        updates: {
          description: 'Updated E2E test mission description'
        }
      });
      expect(updateResponse.status).toBe(200);
    });
  });

  describe('Database Integration', () => {
    it('should persist deployments to MongoDB', async () => {
      const sessionId = 'test-session-db';
      await initializeSession();

      // Deploy a mission
      const deployResponse = await callTool(sessionId, 'deploy_mission', {
        agentId: 'db_test_agent',
        missionId: 'training_001', // Use existing mission
        proxim8Id: 'proxim8_db_test',
        approach: 'low'
      });

      expect(deployResponse.status).toBe(200);

      // Verify deployment was saved to database
      const deployment = await TrainingMissionDeployment.findOne({
        agentId: 'db_test_agent'
      });

      expect(deployment).toBeTruthy();
      expect(deployment?.missionId).toBe('training_001');
      expect(deployment?.proxim8Id).toBe('proxim8_db_test');
      expect(deployment?.approach).toBe('low');
      expect(deployment?.status).toBe('active');
    });

    it('should query lore from MongoDB', async () => {
      const sessionId = 'test-session-lore';
      await initializeSession();

      // Create test lore
      await Lore.create({
        nftId: 'test_nft_123',
        content: 'Test lore content',
        sourceType: 'mission_generated',
        claimed: false,
        missionId: 'test_mission_lore'
      });

      // Query lore via MCP
      const loreResponse = await callTool(sessionId, 'get_lore', {
        sourceType: 'mission_generated',
        claimed: false
      });

      expect(loreResponse.status).toBe(200);

      // Parse response and verify lore data
      const responseBody = JSON.parse(loreResponse.text);
      expect(responseBody.result).toBeDefined();
      expect(responseBody.result.content[0].text).toContain('test_nft_123');
    });
  });

  describe('Error Scenarios', () => {
    it('should handle deployment of non-existent mission', async () => {
      const sessionId = 'test-session-error';
      await initializeSession();

      const deployResponse = await callTool(sessionId, 'deploy_mission', {
        agentId: 'error_test_agent',
        missionId: 'non_existent_mission',
        proxim8Id: 'proxim8_error_test',
        approach: 'medium'
      });

      expect(deployResponse.status).toBe(200);

      // The response should contain an error
      const responseBody = JSON.parse(deployResponse.text);
      expect(responseBody.result.isError).toBe(true);
      expect(responseBody.result.content[0].text).toContain('Mission not found');
    });

    it('should handle duplicate mission creation', async () => {
      const sessionId = 'test-session-duplicate';
      await initializeSession();

      const missionData = {
        missionId: 'training_001', // Existing mission ID
        sequence: 1,
        title: 'Duplicate Test',
        date: '2089-01-01',
        location: 'Test Location',
        description: 'Duplicate mission test',
        imagePrompt: 'Test image',
        duration: 3600000,
        briefing: {
          text: 'Test briefing',
          currentBalance: 100,
          threatLevel: 'low'
        },
        approaches: [],
        compatibility: {
          preferred: [],
          bonus: 0,
          penalty: 0
        },
        phases: []
      };

      const createResponse = await callTool(sessionId, 'create_mission', {
        missionData
      });

      expect(createResponse.status).toBe(200);

      const responseBody = JSON.parse(createResponse.text);
      expect(responseBody.result.isError).toBe(true);
      expect(responseBody.result.content[0].text).toContain('Mission already exists');
    });
  });

  describe('Session Management', () => {
    it('should maintain separate states for different sessions', async () => {
      // Initialize two different sessions
      const session1 = 'test-session-1';
      const session2 = 'test-session-2';

      await initializeSession();

      // Deploy mission with session 1
      await callTool(session1, 'deploy_mission', {
        agentId: 'agent_session_1',
        missionId: 'training_001',
        proxim8Id: 'proxim8_session_1',
        approach: 'low'
      });

      // Deploy mission with session 2
      await callTool(session2, 'deploy_mission', {
        agentId: 'agent_session_2',
        missionId: 'training_002',
        proxim8Id: 'proxim8_session_2',
        approach: 'high'
      });

      // Verify both deployments exist independently
      const deployment1 = await TrainingMissionDeployment.findOne({
        agentId: 'agent_session_1'
      });
      const deployment2 = await TrainingMissionDeployment.findOne({
        agentId: 'agent_session_2'
      });

      expect(deployment1).toBeTruthy();
      expect(deployment2).toBeTruthy();
      expect(deployment1?.missionId).toBe('training_001');
      expect(deployment2?.missionId).toBe('training_002');
    });
  });
});