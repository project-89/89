import request from 'supertest';
import express from 'express';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import { createTestDatabase, cleanupTestDatabase } from '../../__tests__/setup';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { jwtAuth } from '../../middleware/jwtAuth';
import missionRoutes from '../missions';
import Agent from '../../models/game/Agent';
import MissionDeployment from '../../models/game/MissionDeployment';
import { MissionService } from '../../services/game/missionService';

// Mock external services
jest.mock('../../services/game/missionService');

const MockMissionService = MissionService as jest.Mocked<typeof MissionService>;

describe.skip('Mission Routes Integration', () => {
  let app: express.Application;
  let mongoServer: MongoMemoryServer;
  let mockUser: any;
  let mockAuthToken: string;

  beforeAll(async () => {
    // Set up test database
    mongoServer = await createTestDatabase();

    // Create Express app for testing
    app = express();
    app.use(express.json());
    app.use('/api/missions', missionRoutes);

    // Mock user for authentication
    mockUser = {
      userId: 'test-user-123',
      walletAddress: '0x1234567890abcdef'
    };

    // Create mock JWT token
    mockAuthToken = jwt.sign(mockUser, process.env.JWT_SECRET || 'test-secret', { expiresIn: '1h' });
  });

  beforeEach(async () => {
    jest.clearAllMocks();
    
    // Clear database collections
    await Agent.deleteMany({});
    await MissionDeployment.deleteMany({});

    // Mock JWT verification middleware
    jest.spyOn(jwt, 'verify').mockImplementation((token: any, secret: any, callback: any) => {
      if (typeof callback === 'function') {
        callback(null, mockUser);
      }
      return mockUser;
    });
  });

  afterAll(async () => {
    await cleanupTestDatabase(mongoServer);
  });

  describe('Full Mission Flow Integration', () => {
    it('should handle complete mission lifecycle', async () => {
      // Create test agent with Proxim8s
      const testAgent = new Agent({
        userId: mockUser.userId,
        walletAddress: mockUser.walletAddress,
        codename: 'TestAgent',
        rank: 'operative',
        timelinePoints: 1000,
        proxim8s: [{
          nftId: 'proxim8-1',
          name: 'Test Proxim8',
          personality: 'analytical',
          isDeployed: false,
          missionCount: 0,
          experience: 100,
          level: 2,
          successRate: 85
        }],
        totalMissionsDeployed: 0,
        totalMissionsSucceeded: 0,
        totalMissionsFailed: 0,
        dailyMissionCount: 0,
        timelineInfluence: 0.1
      });
      await testAgent.save();

      // Step 1: Get available missions
      const missionsResponse = await request(app)
        .get('/api/missions?type=training')
        .set('Authorization', `Bearer ${mockAuthToken}`)
        .expect(200);

      expect(missionsResponse.body.success).toBe(true);
      expect(missionsResponse.body.data.missions.length).toBeGreaterThan(0);
      expect(missionsResponse.body.data.agent.codename).toBe('TestAgent');

      const firstMission = missionsResponse.body.data.missions[0];
      expect(firstMission.id).toBe('training_001');

      // Step 2: Get mission details
      const detailsResponse = await request(app)
        .get(`/api/missions/${firstMission.id}?type=training`)
        .set('Authorization', `Bearer ${mockAuthToken}`)
        .expect(200);

      expect(detailsResponse.body.success).toBe(true);
      expect(detailsResponse.body.data.mission).toBeDefined();
      expect(detailsResponse.body.data.agent.availableProxim8s).toBeDefined();

      // Step 3: Deploy mission
      const mockDeployment = {
        deploymentId: 'deploy-123',
        missionId: firstMission.id,
        agentId: mockUser.userId,
        status: 'active',
        getClientState: jest.fn().mockReturnValue({
          deploymentId: 'deploy-123',
          missionId: firstMission.id,
          status: 'active',
          completesAt: new Date(Date.now() + 60000)
        })
      };

      MockMissionService.deployMission.mockResolvedValue(mockDeployment as any);

      const deployResponse = await request(app)
        .post(`/api/missions/${firstMission.id}/deploy`)
        .set('Authorization', `Bearer ${mockAuthToken}`)
        .send({
          proxim8Id: 'proxim8-1',
          approach: 'balanced',
          missionType: 'training'
        })
        .expect(200);

      expect(deployResponse.body.success).toBe(true);
      expect(deployResponse.body.data.deployment.deploymentId).toBe('deploy-123');

      // Step 4: Check mission status
      MockMissionService.getMissionProgress.mockReturnValue({
        progress: 25,
        currentPhase: 1,
        phases: [
          { phaseId: 1, status: 'success', name: 'Infiltration' }
        ],
        isComplete: false,
        isTimerExpired: false
      });

      const statusResponse = await request(app)
        .get('/api/missions/deployments/deploy-123/status')
        .set('Authorization', `Bearer ${mockAuthToken}`)
        .expect(200);

      expect(statusResponse.body.success).toBe(true);
      expect(statusResponse.body.data.progress.progress).toBe(25);
      expect(statusResponse.body.data.progress.currentPhase).toBe(1);
    });

    it('should handle timeline mission deployment with real database', async () => {
      // Create test agent
      const testAgent = new Agent({
        userId: mockUser.userId,
        walletAddress: mockUser.walletAddress,
        codename: 'TimelineAgent',
        rank: 'specialist',
        timelinePoints: 2000,
        proxim8s: [{
          nftId: 'proxim8-timeline',
          name: 'Timeline Proxim8',
          personality: 'diplomatic',
          isDeployed: false,
          missionCount: 5,
          experience: 500,
          level: 4,
          successRate: 92
        }],
        totalMissionsDeployed: 5,
        totalMissionsSucceeded: 4,
        totalMissionsFailed: 1,
        dailyMissionCount: 0,
        timelineInfluence: 0.25
      });
      await testAgent.save();

      // Get timeline overview
      const timelineResponse = await request(app)
        .get('/api/missions/timeline?startYear=2025&endYear=2030')
        .set('Authorization', `Bearer ${mockAuthToken}`)
        .expect(200);

      expect(timelineResponse.body.success).toBe(true);
      expect(timelineResponse.body.data.timeline).toBeDefined();
      expect(timelineResponse.body.data.summary).toBeDefined();

      // Mock timeline mission generation
      MockMissionService.generateTimelineMission.mockResolvedValue({
        id: 'timeline_2027',
        missionName: 'Neural Seed Installation',
        year: 2027,
        location: 'Timeline Node 2027',
        description: 'Plant neural seeds for future resistance operations',
        approaches: {
          aggressive: { baseSuccessRate: 0.6, duration: 3600000 },
          balanced: { baseSuccessRate: 0.7, duration: 7200000 },
          cautious: { baseSuccessRate: 0.8, duration: 10800000 }
        }
      });

      // Get timeline mission details
      const missionDetailsResponse = await request(app)
        .get('/api/missions/timeline_2027?type=timeline')
        .set('Authorization', `Bearer ${mockAuthToken}`)
        .expect(200);

      expect(missionDetailsResponse.body.success).toBe(true);
      expect(missionDetailsResponse.body.data.mission.year).toBe(2027);
      expect(missionDetailsResponse.body.data.mission.missionType).toBe('timeline');

      // Deploy timeline mission
      const mockTimelineDeployment = {
        deploymentId: 'timeline-deploy-456',
        missionId: 'timeline_2027',
        agentId: mockUser.userId,
        status: 'active',
        getClientState: jest.fn().mockReturnValue({
          deploymentId: 'timeline-deploy-456',
          missionId: 'timeline_2027',
          status: 'active',
          timelineNode: { year: 2027, isCriticalJuncture: true }
        })
      };

      MockMissionService.deployMission.mockResolvedValue(mockTimelineDeployment as any);

      const timelineDeployResponse = await request(app)
        .post('/api/missions/timeline_2027/deploy')
        .set('Authorization', `Bearer ${mockAuthToken}`)
        .send({
          proxim8Id: 'proxim8-timeline',
          approach: 'cautious',
          missionType: 'timeline',
          timelineNode: {
            year: 2027,
            isCriticalJuncture: true
          }
        })
        .expect(200);

      expect(timelineDeployResponse.body.success).toBe(true);
      expect(timelineDeployResponse.body.data.deployment.timelineNode.year).toBe(2027);
    });
  });

  describe('Authentication and Authorization', () => {
    it('should require authentication for all routes', async () => {
      const routes = [
        { method: 'get', path: '/api/missions' },
        { method: 'get', path: '/api/missions/timeline' },
        { method: 'get', path: '/api/missions/training_001' },
        { method: 'post', path: '/api/missions/training_001/deploy' },
        { method: 'get', path: '/api/missions/deployments/test/status' }
      ];

      for (const route of routes) {
        const response = await request(app)
          [route.method](route.path)
          .send({})
          .expect(401);

        expect(response.body.success).toBe(false);
        expect(response.body.error).toContain('Unauthorized');
      }
    });

    it('should only allow access to user\'s own deployments', async () => {
      // Create another user's deployment
      const otherUserDeployment = new MissionDeployment({
        deploymentId: 'other-user-deploy',
        missionId: 'training_001',
        missionType: 'training',
        agentId: 'other-user-123', // Different user
        proxim8Id: 'proxim8-other',
        approach: 'balanced',
        status: 'active',
        deployedAt: new Date(),
        completesAt: new Date(Date.now() + 60000),
        duration: 60000,
        finalSuccessRate: 0.7,
        phaseOutcomes: []
      });
      await otherUserDeployment.save();

      // Try to access other user's deployment
      const response = await request(app)
        .get('/api/missions/deployments/other-user-deploy/status')
        .set('Authorization', `Bearer ${mockAuthToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Mission deployment not found');
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle invalid mission IDs gracefully', async () => {
      const response = await request(app)
        .get('/api/missions/invalid_mission_id?type=training')
        .set('Authorization', `Bearer ${mockAuthToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Mission not found');
    });

    it('should handle deployment failures gracefully', async () => {
      MockMissionService.deployMission.mockRejectedValue(new Error('Agent not found'));

      const response = await request(app)
        .post('/api/missions/training_001/deploy')
        .set('Authorization', `Bearer ${mockAuthToken}`)
        .send({
          proxim8Id: 'non-existent',
          approach: 'balanced',
          missionType: 'training'
        })
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Agent not found');
    });

    it('should validate deployment parameters', async () => {
      const invalidRequests = [
        { body: {}, expectedError: 'Invalid deployment parameters' },
        { body: { proxim8Id: 'test' }, expectedError: 'Invalid deployment parameters' },
        { body: { approach: 'invalid' }, expectedError: 'Invalid deployment parameters' },
        { body: { proxim8Id: 'test', approach: 'invalid' }, expectedError: 'Invalid deployment parameters' }
      ];

      for (const { body, expectedError } of invalidRequests) {
        const response = await request(app)
          .post('/api/missions/training_001/deploy')
          .set('Authorization', `Bearer ${mockAuthToken}`)
          .send(body)
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.error).toBe(expectedError);
      }
    });

    it('should handle database connection errors', async () => {
      // Temporarily close mongoose connection to simulate database error
      await mongoose.connection.close();

      const response = await request(app)
        .get('/api/missions')
        .set('Authorization', `Bearer ${mockAuthToken}`)
        .expect(500);

      expect(response.body.success).toBe(false);

      // Reconnect for cleanup
      const mongoUri = mongoServer.getUri();
      await mongoose.connect(mongoUri);
    });
  });

  describe('Data Consistency and Validation', () => {
    it('should maintain agent state consistency across mission operations', async () => {
      // Create agent with specific state
      const agent = new Agent({
        userId: mockUser.userId,
        walletAddress: mockUser.walletAddress,
        codename: 'ConsistencyTest',
        rank: 'operative',
        timelinePoints: 500,
        proxim8s: [{
          nftId: 'consistency-proxim8',
          name: 'Consistency Proxim8',
          personality: 'analytical',
          isDeployed: false,
          missionCount: 0,
          experience: 50,
          level: 1,
          successRate: 75
        }],
        totalMissionsDeployed: 0,
        totalMissionsSucceeded: 0,
        totalMissionsFailed: 0,
        dailyMissionCount: 0,
        timelineInfluence: 0.0
      });
      await agent.save();

      // Get initial state
      const initialResponse = await request(app)
        .get('/api/missions?type=training')
        .set('Authorization', `Bearer ${mockAuthToken}`)
        .expect(200);

      const initialAgent = initialResponse.body.data.agent;
      expect(initialAgent.timelinePoints).toBe(500);
      expect(initialAgent.availableProxim8s).toBe(1);

      // Verify agent data is consistent across multiple requests
      const secondResponse = await request(app)
        .get('/api/missions/training_001?type=training')
        .set('Authorization', `Bearer ${mockAuthToken}`)
        .expect(200);

      expect(secondResponse.body.data.agent.availableProxim8s).toHaveLength(1);
      expect(secondResponse.body.data.agent.canDeploy).toBe(true);
    });

    it('should properly serialize mission data', async () => {
      const response = await request(app)
        .get('/api/missions?type=all')
        .set('Authorization', `Bearer ${mockAuthToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.missions).toBeDefined();
      
      // Verify all missions have required fields
      response.body.data.missions.forEach((mission: any) => {
        expect(mission).toHaveProperty('id');
        expect(mission).toHaveProperty('missionType');
        expect(mission).toHaveProperty('userProgress');
        expect(mission.userProgress).toHaveProperty('isUnlocked');
        expect(mission.userProgress).toHaveProperty('isCompleted');
        expect(mission.userProgress).toHaveProperty('isActive');
      });
    });
  });
});