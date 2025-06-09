import request from 'supertest';
import express from 'express';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import { MongoMemoryServer } from 'mongodb-memory-server';
import trainingRoutes from '../training';
import { jwtAuth } from '../../middleware/jwtAuth';
import TrainingMissionDeployment from '../../models/game/TrainingMissionDeployment';
import Agent from '../../models/game/Agent';
import User from '../../models/User';

describe.skip('Training Routes Integration', () => {
  let app: express.Application;
  let mongoServer: MongoMemoryServer;
  let mockUser: any;
  let mockAgent: any;
  let authToken: string;

  beforeAll(async () => {
    // Setup MongoDB Memory Server
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);

    // Create Express app for testing
    app = express();
    app.use(express.json());
    
    // Mock API key middleware
    app.use((req, res, next) => {
      req.headers['x-api-key'] = 'test-api-key';
      next();
    });
    
    // Mock JWT authentication middleware
    app.use('/api/training', (req, res, next) => {
      const token = req.headers.authorization?.replace('Bearer ', '');
      if (!token) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }
      
      try {
        const decoded = jwt.verify(token, 'test-secret');
        (req as any).user = decoded;
        next();
      } catch (error) {
        return res.status(401).json({ success: false, error: 'Invalid token' });
      }
    });
    
    app.use('/api/training', trainingRoutes);
  });

  beforeEach(async () => {
    // Clear database
    await TrainingMissionDeployment.deleteMany({});
    await Agent.deleteMany({});
    await User.deleteMany({});

    // Create test user
    const user = new User({
      walletAddress: '0x1234567890abcdef',
      username: 'testuser',
      preferences: {
        emailNotifications: true,
        darkMode: true,
        showInGallery: true
      }
    });
    await user.save();

    mockUser = {
      userId: user._id.toString(),
      walletAddress: user.walletAddress
    };

    // Create test agent
    mockAgent = new Agent({
      agentId: user._id.toString(),
      walletAddress: user.walletAddress,
      userId: user._id.toString(),
      codename: 'TestAgent',
      proxim8s: [
        {
          nftId: 'proxim8-test-1',
          name: 'Test Proxim8 Alpha',
          personality: 'analytical',
          experience: 500,
          level: 3,
          missionCount: 2,
          successRate: 75,
          isDeployed: false
        },
        {
          nftId: 'proxim8-test-2',
          name: 'Test Proxim8 Beta',
          personality: 'aggressive',
          experience: 200,
          level: 2,
          missionCount: 1,
          successRate: 100,
          isDeployed: true, // Already deployed
          currentMissionId: 'other-mission'
        }
      ],
      timelinePoints: 1500,
      rank: 'operative'
    });
    await mockAgent.save();

    // Create auth token
    authToken = jwt.sign(mockUser, 'test-secret', { expiresIn: '1h' });
  });

  afterAll(async () => {
    await mongoose.connection.close();
    await mongoServer.stop();
  });

  describe('GET /api/training/missions', () => {
    it('should return all training missions with user progress', async () => {
      // Create a completed deployment
      const completedDeployment = new TrainingMissionDeployment({
        missionId: 'training_001',
        agentId: mockUser.userId,
        proxim8Id: 'proxim8-test-1',
        approach: 'medium',
        completesAt: new Date(Date.now() - 1000),
        duration: 60000,
        finalSuccessRate: 0.8,
        status: 'completed',
        phaseOutcomes: [
          { phaseId: 1, success: true },
          { phaseId: 2, success: true },
          { phaseId: 3, success: true },
          { phaseId: 4, success: false },
          { phaseId: 5, success: true }
        ],
        result: {
          overallSuccess: true,
          finalNarrative: 'Mission completed successfully',
          timelineShift: 0.03,
          rewards: {
            timelinePoints: 100,
            experience: 50,
            loreFragments: [],
            achievements: []
          }
        }
      });
      await completedDeployment.save();

      const response = await request(app)
        .get('/api/training/missions')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('missions');
      expect(response.body.data).toHaveProperty('agent');
      
      const missions = response.body.data.missions;
      expect(Array.isArray(missions)).toBe(true);
      expect(missions.length).toBe(7); // All 7 training missions
      
      // Check first mission has progress
      const firstMission = missions.find((m: any) => m.id === 'training_001');
      expect(firstMission.userProgress.isCompleted).toBe(true);
      expect(firstMission.userProgress.isUnlocked).toBe(true);
      
      // Check agent data
      const agent = response.body.data.agent;
      expect(agent.codename).toBe('TestAgent');
      expect(agent.rank).toBe('operative');
      expect(agent.timelinePoints).toBe(1500);
    });

    it('should handle case when agent does not exist', async () => {
      // Delete the agent
      await Agent.deleteMany({});

      const response = await request(app)
        .get('/api/training/missions')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.agent).toBeNull();
      expect(response.body.data.missions).toHaveLength(7);
    });
  });

  describe('GET /api/training/missions/:missionId', () => {
    it('should return mission details with compatibility calculations', async () => {
      const response = await request(app)
        .get('/api/training/missions/training_001')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.mission).toBeDefined();
      expect(response.body.data.mission.id).toBe('training_001');
      
      // Should include agent data with compatibility
      expect(response.body.data.agent).toBeDefined();
      expect(response.body.data.agent.availableProxim8s).toHaveLength(1); // Only one not deployed
      
      const availableProxim8 = response.body.data.agent.availableProxim8s[0];
      expect(availableProxim8.compatibility).toBeDefined();
      expect(availableProxim8.compatibility.overall).toBeGreaterThan(0);
    });

    it('should return 404 for invalid mission ID', async () => {
      const response = await request(app)
        .get('/api/training/missions/invalid_mission')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Mission not found');
    });

    it('should include existing deployment if one exists', async () => {
      // Create an active deployment
      const activeDeployment = new TrainingMissionDeployment({
        missionId: 'training_001',
        agentId: mockUser.userId,
        proxim8Id: 'proxim8-test-1',
        approach: 'high',
        completesAt: new Date(Date.now() + 60000),
        duration: 120000,
        finalSuccessRate: 0.9,
        status: 'active',
        phaseOutcomes: [
          { phaseId: 1, success: true },
          { phaseId: 2, success: true },
          { phaseId: 3, success: false },
          { phaseId: 4, success: true },
          { phaseId: 5, success: true }
        ]
      });
      await activeDeployment.save();

      const response = await request(app)
        .get('/api/training/missions/training_001')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data.deployment).toBeDefined();
      expect(response.body.data.deployment.status).toBe('active');
      expect(response.body.data.deployment.missionId).toBe('training_001');
    });
  });

  describe('POST /api/training/missions/:missionId/deploy', () => {
    it('should deploy a mission successfully', async () => {
      const deploymentData = {
        proxim8Id: 'proxim8-test-1',
        approach: 'medium'
      };

      const response = await request(app)
        .post('/api/training/missions/training_001/deploy')
        .set('Authorization', `Bearer ${authToken}`)
        .send(deploymentData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.deployment).toBeDefined();
      expect(response.body.data.message).toBe('Mission deployed successfully');

      // Verify deployment was created in database
      const deployment = await TrainingMissionDeployment.findOne({
        missionId: 'training_001',
        agentId: mockUser.userId
      });
      expect(deployment).toBeTruthy();
      expect(deployment?.status).toBe('active');

      // Verify agent was updated
      const updatedAgent = await Agent.findOne({ agentId: mockUser.userId });
      const proxim8 = updatedAgent?.proxim8s.find(p => p.nftId === 'proxim8-test-1');
      expect(proxim8?.isDeployed).toBe(true);
      expect(proxim8?.currentMissionId).toBe(deployment?.deploymentId);
    });

    it('should prevent deployment with already deployed Proxim8', async () => {
      const deploymentData = {
        proxim8Id: 'proxim8-test-2', // This one is already deployed
        approach: 'low'
      };

      const response = await request(app)
        .post('/api/training/missions/training_001/deploy')
        .set('Authorization', `Bearer ${authToken}`)
        .send(deploymentData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('not available');
    });

    it('should prevent duplicate mission deployment', async () => {
      // Create existing deployment
      const existingDeployment = new TrainingMissionDeployment({
        missionId: 'training_001',
        agentId: mockUser.userId,
        proxim8Id: 'proxim8-test-1',
        approach: 'low',
        completesAt: new Date(Date.now() + 60000),
        duration: 60000,
        finalSuccessRate: 0.7,
        status: 'active',
        phaseOutcomes: []
      });
      await existingDeployment.save();

      const deploymentData = {
        proxim8Id: 'proxim8-test-1',
        approach: 'medium'
      };

      const response = await request(app)
        .post('/api/training/missions/training_001/deploy')
        .set('Authorization', `Bearer ${authToken}`)
        .send(deploymentData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should validate deployment parameters', async () => {
      const response = await request(app)
        .post('/api/training/missions/training_001/deploy')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ proxim8Id: 'proxim8-test-1' }) // Missing approach
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Invalid deployment parameters');
    });

    it('should validate approach values', async () => {
      const response = await request(app)
        .post('/api/training/missions/training_001/deploy')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          proxim8Id: 'proxim8-test-1',
          approach: 'invalid'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Invalid deployment parameters');
    });
  });

  describe('GET /api/training/deployments/:deploymentId/status', () => {
    let activeDeployment: any;

    beforeEach(async () => {
      // Create active deployment for testing
      activeDeployment = new TrainingMissionDeployment({
        missionId: 'training_001',
        agentId: mockUser.userId,
        proxim8Id: 'proxim8-test-1',
        approach: 'medium',
        completesAt: new Date(Date.now() + 60000), // 1 minute from now
        duration: 120000, // 2 minutes total
        finalSuccessRate: 0.8,
        status: 'active',
        phaseOutcomes: [
          { phaseId: 1, success: true },
          { phaseId: 2, success: true },
          { phaseId: 3, success: false },
          { phaseId: 4, success: true },
          { phaseId: 5, success: true }
        ]
      });
      await activeDeployment.save();
    });

    it('should return mission status with progress', async () => {
      const response = await request(app)
        .get(`/api/training/deployments/${activeDeployment.deploymentId}/status`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.deploymentId).toBe(activeDeployment.deploymentId);
      expect(response.body.data.status).toBe('active');
      expect(response.body.data.progress).toBeDefined();
      expect(response.body.data.progress.phases).toHaveLength(5);
    });

    it('should complete mission when time elapsed', async () => {
      // Update deployment to be past completion time
      activeDeployment.completesAt = new Date(Date.now() - 1000); // 1 second ago
      await activeDeployment.save();

      const response = await request(app)
        .get(`/api/training/deployments/${activeDeployment.deploymentId}/status`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      
      // Verify mission was completed in database
      const updatedDeployment = await TrainingMissionDeployment.findOne({
        deploymentId: activeDeployment.deploymentId
      });
      expect(updatedDeployment?.status).toBe('completed');
      expect(updatedDeployment?.result).toBeDefined();

      // Verify agent was updated
      const updatedAgent = await Agent.findOne({ agentId: mockUser.userId });
      const proxim8 = updatedAgent?.proxim8s.find(p => p.nftId === 'proxim8-test-1');
      expect(proxim8?.isDeployed).toBe(false);
      expect(proxim8?.currentMissionId).toBeUndefined();
    });

    it('should return 404 for non-existent deployment', async () => {
      const response = await request(app)
        .get('/api/training/deployments/non-existent-id/status')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Mission deployment not found');
    });

    it('should only return deployments owned by the user', async () => {
      // Create deployment for different user
      const otherDeployment = new TrainingMissionDeployment({
        missionId: 'training_002',
        agentId: 'other-user-id',
        proxim8Id: 'other-proxim8',
        approach: 'low',
        completesAt: new Date(Date.now() + 60000),
        duration: 60000,
        finalSuccessRate: 0.7,
        status: 'active',
        phaseOutcomes: []
      });
      await otherDeployment.save();

      const response = await request(app)
        .get(`/api/training/deployments/${otherDeployment.deploymentId}/status`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('Authentication', () => {
    it('should require authentication for all endpoints', async () => {
      const endpoints = [
        { method: 'get', path: '/api/training/missions' },
        { method: 'get', path: '/api/training/missions/training_001' },
        { method: 'post', path: '/api/training/missions/training_001/deploy' },
        { method: 'get', path: '/api/training/deployments/test-id/status' }
      ];

      for (const endpoint of endpoints) {
        const response = await request(app)
          [endpoint.method as 'get' | 'post'](endpoint.path)
          .expect(401);

        expect(response.body.success).toBe(false);
        expect(response.body.error).toContain('Unauthorized');
      }
    });

    it('should reject invalid tokens', async () => {
      const response = await request(app)
        .get('/api/training/missions')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });
});