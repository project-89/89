import request from 'supertest';
import express from 'express';
import MissionDeployment from '../../models/game/MissionDeployment';
import MissionTemplate from '../../models/game/MissionTemplate';
import Agent from '../../models/game/Agent';
import { MissionService } from '../../services/game/missionService';

// Mock dependencies
jest.mock('../../models/game/MissionDeployment');
jest.mock('../../models/game/MissionTemplate');
jest.mock('../../models/game/Agent');
jest.mock('../../services/game/missionService');

const MockMissionDeployment = MissionDeployment as jest.Mocked<typeof MissionDeployment>;
const MockMissionTemplate = MissionTemplate as jest.Mocked<typeof MissionTemplate>;
const MockAgent = Agent as jest.Mocked<typeof Agent>;
const MockMissionService = MissionService as jest.Mocked<typeof MissionService>;

// Mock training missions data
jest.mock('../../data/trainingMissions', () => ({
  TRAINING_MISSIONS: [
    {
      missionId: 'training_001',
      id: 'training_001',
      sequence: 1,
      title: 'First Contact',
      date: 'December 15, 2025',
      location: 'Global Internet Infrastructure',
      description: 'Test mission description',
      primaryApproach: 'expose',
      approaches: {
        low: { duration: 300000, baseSuccessRate: 0.6 },
        medium: { duration: 600000, baseSuccessRate: 0.7 },
        high: { duration: 900000, baseSuccessRate: 0.8 }
      }
    }
  ]
}));

// Create mock controllers with proper imports after mocking
import * as missionController from '../missionController';

describe('Mission Controller', () => {
  let app: express.Application;
  let mockUser: any;

  beforeAll(() => {
    // Mock user for authentication
    mockUser = {
      userId: 'test-user-123',
      walletAddress: '0x1234567890abcdef'
    };

    // Create Express app for testing
    app = express();
    app.use(express.json());
    
    // Add mock authentication middleware
    app.use((req: any, res, next) => {
      const token = req.headers.authorization?.replace('Bearer ', '');
      if (!token) {
        return res.status(401).json({ success: false, error: 'Unauthorized: No token provided' });
      }
      req.user = mockUser;
      next();
    });
    
    // Add mission routes manually
    app.get('/api/missions', missionController.getMissions);
    app.get('/api/missions/timeline', missionController.getTimelineOverview);
    app.get('/api/missions/:missionId', missionController.getMissionDetails);
    app.post('/api/missions/:missionId/deploy', missionController.deployMission);
    app.get('/api/missions/deployments/:deploymentId/status', missionController.getMissionStatus);
  });

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Set up default mocks for query chaining
    const defaultMockQuery = {
      lean: jest.fn().mockResolvedValue([])
    };
    MockMissionDeployment.find.mockReturnValue(defaultMockQuery as any);
    MockMissionDeployment.findOne.mockResolvedValue(null);
    MockMissionTemplate.findOne.mockResolvedValue(null);
    MockAgent.findOne.mockResolvedValue(null);
    
    // Mock all MissionService methods
    MockMissionService.calculateCompatibility = jest.fn().mockReturnValue({
      overall: 0.8,
      personalityBonus: 0.1,
      experienceBonus: 0.05,
      levelBonus: 0.02
    });
    MockMissionService.deployMission = jest.fn();
    MockMissionService.generateTimelineMission = jest.fn();
    MockMissionService.getMissionProgress = jest.fn();
    MockMissionService.handleMissionExpiration = jest.fn();
  });

  describe('GET /api/missions', () => {
    it('should return all missions with user progress', async () => {
      // Mock Agent.findOne
      const mockAgent = {
        codename: 'TestAgent',
        rank: 'operative',
        timelinePoints: 1500,
        timelineInfluence: 0.5,
        getAvailableProxim8s: jest.fn().mockReturnValue([
          { nftId: 'proxim8-1', name: 'Test Proxim8' }
        ])
      };
      MockAgent.findOne.mockResolvedValue(mockAgent as any);

      // Mock MissionDeployment.find
      const mockDeployments = [
        {
          missionId: 'training_001',
          missionType: 'training',
          status: 'completed',
          result: { overallSuccess: true },
          updatedAt: new Date(),
          deployedAt: new Date(),
          deploymentId: 'deploy-123',
          completesAt: new Date()
        }
      ];
      const mockQuery = {
        lean: jest.fn().mockResolvedValue(mockDeployments)
      };
      MockMissionDeployment.find.mockReturnValue(mockQuery as any);

      const response = await request(app)
        .get('/api/missions')
        .set('Authorization', 'Bearer mock-token')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('missions');
      expect(response.body.data).toHaveProperty('agent');
      expect(response.body.data.agent.codename).toBe('TestAgent');
      expect(Array.isArray(response.body.data.missions)).toBe(true);
      expect(response.body.data.missions.length).toBeGreaterThan(0);
    });

    it('should return 401 when no auth token provided', async () => {
      const response = await request(app)
        .get('/api/missions')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Unauthorized: No token provided');
    });

    it('should handle database errors gracefully', async () => {
      MockAgent.findOne.mockRejectedValue(new Error('Database connection failed'));

      const response = await request(app)
        .get('/api/missions')
        .set('Authorization', 'Bearer mock-token')
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Failed to fetch missions');
    });
  });

  describe('GET /api/missions/timeline', () => {
    it('should return timeline overview', async () => {
      const mockDeployments = [
        {
          agentId: mockUser.userId,
          missionType: 'timeline',
          timelineNode: { year: 2027 },
          status: 'completed',
          timelineInfluence: {
            influenceType: 'green_loom',
            influencePoints: 50
          }
        }
      ];
      const mockQuery = {
        lean: jest.fn().mockResolvedValue(mockDeployments)
      };
      MockMissionDeployment.find.mockReturnValue(mockQuery as any);

      const response = await request(app)
        .get('/api/missions/timeline')
        .set('Authorization', 'Bearer mock-token')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('timeline');
      expect(response.body.data).toHaveProperty('summary');
      expect(Array.isArray(response.body.data.timeline)).toBe(true);
    });
  });

  describe('GET /api/missions/:missionId', () => {
    it('should return mission details for training mission', async () => {
      const mockDeployment = {
        getClientState: jest.fn().mockReturnValue({
          deploymentId: 'deploy-123',
          missionId: 'training_001',
          status: 'active'
        })
      };
      MockMissionDeployment.findOne.mockResolvedValue(mockDeployment as any);

      const mockAgent = {
        getAvailableProxim8s: jest.fn().mockReturnValue([
          { nftId: 'proxim8-1', personality: 'analytical', toObject: () => ({ nftId: 'proxim8-1' }) }
        ]),
        canDeployMission: jest.fn().mockReturnValue({ allowed: true })
      };
      MockAgent.findOne.mockResolvedValue(mockAgent as any);

      const response = await request(app)
        .get('/api/missions/training_001?type=training')
        .set('Authorization', 'Bearer mock-token')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.mission).toBeDefined();
      expect(response.body.data.mission.missionType).toBe('training');
      expect(response.body.data.deployment).toBeDefined();
      expect(response.body.data.agent).toBeDefined();
    });

    it('should return 404 for non-existent training mission', async () => {
      MockMissionDeployment.findOne.mockResolvedValue(null);
      
      const mockAgent = {
        getAvailableProxim8s: jest.fn().mockReturnValue([]),
        canDeployMission: jest.fn().mockReturnValue({ allowed: true })
      };
      MockAgent.findOne.mockResolvedValue(mockAgent as any);

      const response = await request(app)
        .get('/api/missions/training_999?type=training')
        .set('Authorization', 'Bearer mock-token')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Training mission not found');
    });
  });

  describe('POST /api/missions/:missionId/deploy', () => {
    it('should deploy training mission successfully', async () => {
      const mockDeployment = {
        deploymentId: 'deploy-123',
        getClientState: jest.fn().mockReturnValue({
          deploymentId: 'deploy-123',
          missionId: 'training_001',
          status: 'active'
        })
      };
      MockMissionService.deployMission.mockResolvedValue(mockDeployment as any);

      const response = await request(app)
        .post('/api/missions/training_001/deploy')
        .set('Authorization', 'Bearer mock-token')
        .send({
          proxim8Id: 'proxim8-1',
          approach: 'balanced',
          missionType: 'training'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.deployment).toBeDefined();
      expect(response.body.data.message).toBe('Mission deployed successfully');
    });

    it('should return 400 for invalid deployment parameters', async () => {
      const response = await request(app)
        .post('/api/missions/training_001/deploy')
        .set('Authorization', 'Bearer mock-token')
        .send({ proxim8Id: 'proxim8-1' }) // Missing approach
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Invalid deployment parameters');
    });
  });

  describe('GET /api/missions/deployments/:deploymentId/status', () => {
    it('should return mission status for active deployment', async () => {
      const mockDeployment = {
        deploymentId: 'deploy-123',
        status: 'active',
        completesAt: new Date(Date.now() + 60000),
        agentId: mockUser.userId,
        getClientState: jest.fn().mockReturnValue({
          deploymentId: 'deploy-123',
          status: 'active',
          progress: { phases: [], currentPhase: 2 }
        })
      };
      MockMissionDeployment.findOne.mockResolvedValue(mockDeployment as any);

      MockMissionService.getMissionProgress.mockReturnValue({
        progress: 45,
        currentPhase: 2,
        phases: [
          { phaseId: 1, status: 'success' },
          { phaseId: 2, status: 'active' }
        ],
        isComplete: false,
        isTimerExpired: false
      });

      const response = await request(app)
        .get('/api/missions/deployments/deploy-123/status')
        .set('Authorization', 'Bearer mock-token')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.deploymentId).toBe('deploy-123');
      expect(response.body.data.progress).toBeDefined();
    });

    it('should return 404 for non-existent deployment', async () => {
      MockMissionDeployment.findOne.mockResolvedValue(null);

      const response = await request(app)
        .get('/api/missions/deployments/non-existent/status')
        .set('Authorization', 'Bearer mock-token')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Mission deployment not found');
    });
  });
});