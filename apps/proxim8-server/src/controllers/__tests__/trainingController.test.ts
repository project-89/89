import request from 'supertest';
import express from 'express';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import { jwtAuth } from '../../middleware/jwtAuth';
import trainingRoutes from '../../routes/training';
import TrainingMissionDeployment from '../../models/game/TrainingMissionDeployment';
import Agent from '../../models/game/Agent';
import { MissionService } from '../../services/game/missionService';

// Mock dependencies
jest.mock('../../models/game/TrainingMissionDeployment');
jest.mock('../../models/game/Agent');
jest.mock('../../services/game/missionService');
jest.mock('../../middleware/jwtAuth');
jest.mock('../../services/cache');
jest.mock('../../services/tokenBlacklist');

// Mock training missions data
jest.mock('../../data/trainingMissions', () => ({
  TRAINING_MISSIONS: [
    {
      id: 'training_001',
      missionName: 'Neural Interface Training',
      description: 'Basic neural interface training mission',
      approaches: {
        low: { baseSuccessRate: 0.6, duration: 300000 },
        medium: { baseSuccessRate: 0.7, duration: 600000 },
        high: { baseSuccessRate: 0.8, duration: 900000 }
      }
    }
  ]
}));

const MockTrainingMissionDeployment = TrainingMissionDeployment as jest.Mocked<typeof TrainingMissionDeployment>;
const MockAgent = Agent as jest.Mocked<typeof Agent>;
const MockMissionService = MissionService as jest.Mocked<typeof MissionService>;

// Mock the auth middleware to conditionally bypass authentication
const mockJwtAuth = require('../../middleware/jwtAuth');
mockJwtAuth.jwtAuth = jest.fn((req: any, res: any, next: any) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized: No token provided'
    });
  }
  
  req.user = {
    userId: 'test-user-123',
    walletAddress: '0x1234567890abcdef'
  };
  next();
});

// Mock cache service
const mockCache = require('../../services/cache');
mockCache.getCache = jest.fn().mockResolvedValue(null);
mockCache.setCache = jest.fn().mockResolvedValue(true);

// Mock token blacklist service  
const mockTokenBlacklist = require('../../services/tokenBlacklist');
mockTokenBlacklist.isTokenBlacklisted = jest.fn().mockResolvedValue(false);

describe.skip('Training Controller', () => {
  let app: express.Application;
  let mockUser: any;
  let mockAuthToken: string;

  beforeAll(() => {
    // Create Express app for testing
    app = express();
    app.use(express.json());
    app.use('/api/training', trainingRoutes);

    // Mock user for authentication
    mockUser = {
      userId: 'test-user-123',
      walletAddress: '0x1234567890abcdef'
    };

    // Create mock JWT token
    mockAuthToken = jwt.sign(mockUser, 'test-secret', { expiresIn: '1h' });
  });

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Set up default mocks for query chaining
    const defaultMockQuery = {
      lean: jest.fn().mockResolvedValue([])
    };
    MockTrainingMissionDeployment.find.mockReturnValue(defaultMockQuery as any);
    MockTrainingMissionDeployment.findOne.mockResolvedValue(null);
    MockAgent.findOne.mockResolvedValue(null);
    MockMissionService.calculateCompatibility.mockReturnValue({
      overall: 0.7,
      personalityBonus: 0.1,
      experienceBonus: 0.05,
      levelBonus: 0.02
    });
    MockMissionService.deployMission.mockResolvedValue(null);
    MockMissionService.completeMission.mockResolvedValue(null);
    MockMissionService.getMissionProgress.mockReturnValue({
      progress: 50,
      currentPhase: 1,
      phases: [],
      isComplete: false
    });
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  describe('GET /api/training/missions', () => {
    it('should return training missions with user progress', async () => {
      // Mock Agent.findOne
      const mockAgent = {
        codename: 'TestAgent',
        rank: 'operative',
        timelinePoints: 1500,
        getAvailableProxim8s: jest.fn().mockReturnValue([
          { nftId: 'proxim8-1', name: 'Test Proxim8' }
        ])
      };
      MockAgent.findOne.mockResolvedValue(mockAgent as any);

      // Mock TrainingMissionDeployment.find
      const mockDeployments = [
        {
          missionId: 'training_001',
          status: 'completed',
          result: { overallSuccess: true },
          updatedAt: new Date(),
          deployedAt: new Date()
        }
      ];
      // Mock TrainingMissionDeployment.find with proper chaining for lean()
      const mockQuery = {
        lean: jest.fn().mockResolvedValue(mockDeployments)
      };
      MockTrainingMissionDeployment.find.mockReturnValue(mockQuery as any);

      const response = await request(app)
        .get('/api/training/missions')
        .set('Authorization', `Bearer ${mockAuthToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('missions');
      expect(response.body.data).toHaveProperty('agent');
      expect(response.body.data.agent.codename).toBe('TestAgent');
      expect(Array.isArray(response.body.data.missions)).toBe(true);
    });

    it('should return 401 when no auth token provided', async () => {
      const response = await request(app)
        .get('/api/training/missions')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Unauthorized');
    });

    it('should handle database errors gracefully', async () => {
      MockAgent.findOne.mockRejectedValue(new Error('Database connection failed'));

      const response = await request(app)
        .get('/api/training/missions')
        .set('Authorization', `Bearer ${mockAuthToken}`)
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Failed to fetch training missions');
    });
  });

  describe('GET /api/training/missions/:missionId', () => {
    const missionId = 'training_001';

    it('should return mission details with deployment info', async () => {
      // Mock deployment
      const mockDeployment = {
        getClientState: jest.fn().mockReturnValue({
          deploymentId: 'deploy-123',
          missionId,
          status: 'active'
        })
      };
      MockTrainingMissionDeployment.findOne.mockResolvedValue(mockDeployment as any);

      // Mock agent with compatibility calculations
      const mockAgent = {
        getAvailableProxim8s: jest.fn().mockReturnValue([
          { nftId: 'proxim8-1', personality: 'analytical' }
        ]),
        canDeployMission: jest.fn().mockReturnValue({ allowed: true })
      };
      MockAgent.findOne.mockResolvedValue(mockAgent as any);

      // Mock compatibility calculation
      MockMissionService.calculateCompatibility.mockReturnValue({
        overall: 0.85,
        personalityBonus: 0.1,
        experienceBonus: 0.05,
        levelBonus: 0.02
      });

      const response = await request(app)
        .get(`/api/training/missions/${missionId}`)
        .set('Authorization', `Bearer ${mockAuthToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.mission).toBeDefined();
      expect(response.body.data.mission.id).toBe(missionId);
      expect(response.body.data.deployment).toBeDefined();
      expect(response.body.data.agent).toBeDefined();
    });

    it('should return 404 for non-existent mission', async () => {
      const response = await request(app)
        .get('/api/training/missions/training_999')
        .set('Authorization', `Bearer ${mockAuthToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Mission not found');
    });
  });

  describe('POST /api/training/missions/:missionId/deploy', () => {
    const missionId = 'training_001';
    const deploymentData = {
      proxim8Id: 'proxim8-1',
      approach: 'medium' as const
    };

    it('should deploy mission successfully', async () => {
      // Mock successful deployment
      const mockDeployment = {
        deploymentId: 'deploy-123',
        getClientState: jest.fn().mockReturnValue({
          deploymentId: 'deploy-123',
          missionId,
          status: 'active'
        })
      };
      MockMissionService.deployMission.mockResolvedValue(mockDeployment as any);

      const response = await request(app)
        .post(`/api/training/missions/${missionId}/deploy`)
        .set('Authorization', `Bearer ${mockAuthToken}`)
        .send(deploymentData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.deployment).toBeDefined();
      expect(response.body.data.message).toBe('Mission deployed successfully');
      
      expect(MockMissionService.deployMission).toHaveBeenCalledWith({
        agentId: mockUser.userId,
        missionId,
        missionType: 'training',
        proxim8Id: deploymentData.proxim8Id,
        approach: deploymentData.approach
      });
    });

    it('should return 400 for invalid deployment parameters', async () => {
      const response = await request(app)
        .post(`/api/training/missions/${missionId}/deploy`)
        .set('Authorization', `Bearer ${mockAuthToken}`)
        .send({ proxim8Id: 'proxim8-1' }) // Missing approach
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Invalid deployment parameters');
    });

    it('should return 400 for invalid approach', async () => {
      const response = await request(app)
        .post(`/api/training/missions/${missionId}/deploy`)
        .set('Authorization', `Bearer ${mockAuthToken}`)
        .send({
          proxim8Id: 'proxim8-1',
          approach: 'invalid'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Invalid deployment parameters');
    });

    it('should handle deployment service errors', async () => {
      MockMissionService.deployMission.mockRejectedValue(new Error('Proxim8 not available'));

      const response = await request(app)
        .post(`/api/training/missions/${missionId}/deploy`)
        .set('Authorization', `Bearer ${mockAuthToken}`)
        .send(deploymentData)
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Failed to deploy mission');
    });
  });

  describe('GET /api/training/deployments/:deploymentId/status', () => {
    const deploymentId = 'deploy-123';

    it('should return mission status for active deployment', async () => {
      const mockDeployment = {
        deploymentId,
        status: 'active',
        completesAt: new Date(Date.now() + 60000), // 1 minute from now
        getClientState: jest.fn().mockReturnValue({
          deploymentId,
          status: 'active',
          progress: { phases: [], currentPhase: 2 }
        })
      };
      MockTrainingMissionDeployment.findOne.mockResolvedValue(mockDeployment as any);

      // Mock mission progress
      MockMissionService.getMissionProgress.mockReturnValue({
        progress: 45,
        currentPhase: 2,
        phases: [
          { phaseId: 1, status: 'success' },
          { phaseId: 2, status: 'active' }
        ],
        isComplete: false
      });

      const response = await request(app)
        .get(`/api/training/deployments/${deploymentId}/status`)
        .set('Authorization', `Bearer ${mockAuthToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.deploymentId).toBe(deploymentId);
      expect(response.body.data.progress).toBeDefined();
    });

    it('should complete mission if time has elapsed', async () => {
      const mockDeployment = {
        deploymentId,
        status: 'active',
        completesAt: new Date(Date.now() - 1000), // 1 second ago
        agentId: mockUser.userId
      };
      MockTrainingMissionDeployment.findOne
        .mockResolvedValueOnce(mockDeployment as any) // First call
        .mockResolvedValueOnce({ // Second call after completion
          ...mockDeployment,
          status: 'completed',
          getClientState: jest.fn().mockReturnValue({
            deploymentId,
            status: 'completed'
          })
        } as any);

      // Mock mission completion
      MockMissionService.completeMission.mockResolvedValue(mockDeployment as any);

      const response = await request(app)
        .get(`/api/training/deployments/${deploymentId}/status`)
        .set('Authorization', `Bearer ${mockAuthToken}`)
        .expect(200);

      expect(MockMissionService.completeMission).toHaveBeenCalledWith(deploymentId);
      expect(response.body.success).toBe(true);
    });

    it('should return 404 for non-existent deployment', async () => {
      MockTrainingMissionDeployment.findOne.mockResolvedValue(null);

      const response = await request(app)
        .get('/api/training/deployments/non-existent/status')
        .set('Authorization', `Bearer ${mockAuthToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Mission deployment not found');
    });
  });
});