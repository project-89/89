import request from 'supertest';
import express from 'express';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import { jwtAuth } from '../../middleware/jwtAuth';
import missionRoutes from '../../routes/missions';
import MissionDeployment from '../../models/game/MissionDeployment';
import MissionTemplate from '../../models/game/MissionTemplate';
import Agent from '../../models/game/Agent';
import { MissionService } from '../../services/game/missionService';

// Mock dependencies
jest.mock('../../models/game/MissionDeployment');
jest.mock('../../models/game/MissionTemplate');
jest.mock('../../models/game/Agent');
jest.mock('../../services/game/missionService');
jest.mock('../../middleware/jwtAuth');
jest.mock('../../services/cache');
jest.mock('../../services/tokenBlacklist');
jest.mock('../../data/trainingMissions');

const MockMissionDeployment = MissionDeployment as jest.Mocked<typeof MissionDeployment>;
const MockMissionTemplate = MissionTemplate as jest.Mocked<typeof MissionTemplate>;
const MockAgent = Agent as jest.Mocked<typeof Agent>;
const MockMissionService = MissionService as jest.Mocked<typeof MissionService>;

describe('Mission Controller', () => {
  let app: express.Application;
  let mockUser: any;
  let mockAuthToken: string;

  beforeAll(() => {
    // Mock user for authentication
    mockUser = {
      userId: 'test-user-123',
      walletAddress: '0x1234567890abcdef'
    };

    // Create mock JWT token
    mockAuthToken = jwt.sign(mockUser, 'test-secret', { expiresIn: '1h' });

    // Mock the JWT middleware to pass through authentication
    const mockJwtAuth = jest.fn((req: any, res: any, next: any) => {
      const token = req.headers.authorization?.replace('Bearer ', '');
      if (!token) {
        return res.status(401).json({ success: false, error: 'Unauthorized: No token provided' });
      }
      // Set mock user on request
      req.user = mockUser;
      next();
    });
    
    // Override the jwtAuth middleware
    (require('../../middleware/jwtAuth') as any).jwtAuth = mockJwtAuth;

    // Create Express app for testing
    app = express();
    app.use(express.json());
    app.use('/api/missions', missionRoutes);
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
    
    // Mock TRAINING_MISSIONS data
    const mockTrainingMissions = [
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
    ];
    
    // Mock the TRAINING_MISSIONS import
    require('../../data/trainingMissions').TRAINING_MISSIONS = mockTrainingMissions;
    
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

  afterAll(async () => {
    await mongoose.connection.close();
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
      // Mock MissionDeployment.find with proper chaining for lean()
      const mockQuery = {
        lean: jest.fn().mockResolvedValue(mockDeployments)
      };
      MockMissionDeployment.find.mockReturnValue(mockQuery as any);

      const response = await request(app)
        .get('/api/missions')
        .set('Authorization', `Bearer ${mockAuthToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('missions');
      expect(response.body.data).toHaveProperty('agent');
      expect(response.body.data.agent.codename).toBe('TestAgent');
      expect(Array.isArray(response.body.data.missions)).toBe(true);
    });

    it('should filter missions by type', async () => {
      const mockAgent = {
        codename: 'TestAgent',
        getAvailableProxim8s: jest.fn().mockReturnValue([])
      };
      MockAgent.findOne.mockResolvedValue(mockAgent as any);
      // Mock empty deployments with proper chaining
      const emptyMockQuery = {
        lean: jest.fn().mockResolvedValue([])
      };
      MockMissionDeployment.find.mockReturnValue(emptyMockQuery as any);

      const response = await request(app)
        .get('/api/missions?type=training')
        .set('Authorization', `Bearer ${mockAuthToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.missions).toBeDefined();
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
        .set('Authorization', `Bearer ${mockAuthToken}`)
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Failed to fetch missions');
    });
  });

  describe('GET /api/missions/timeline', () => {
    it('should return timeline overview', async () => {
      // Mock deployments for timeline visualization
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
      // Mock MissionDeployment.find with proper chaining for lean()
      const mockQuery = {
        lean: jest.fn().mockResolvedValue(mockDeployments)
      };
      MockMissionDeployment.find.mockReturnValue(mockQuery as any);

      const response = await request(app)
        .get('/api/missions/timeline')
        .set('Authorization', `Bearer ${mockAuthToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('timeline');
      expect(response.body.data).toHaveProperty('summary');
      expect(Array.isArray(response.body.data.timeline)).toBe(true);
    });

    it('should accept granularity and year range parameters', async () => {
      // Mock empty deployments with proper chaining
      const emptyMockQuery = {
        lean: jest.fn().mockResolvedValue([])
      };
      MockMissionDeployment.find.mockReturnValue(emptyMockQuery as any);

      const response = await request(app)
        .get('/api/missions/timeline?startYear=2025&endYear=2030&granularity=year')
        .set('Authorization', `Bearer ${mockAuthToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.timeline.length).toBeGreaterThan(0);
    });
  });

  describe('GET /api/missions/:missionId', () => {
    const missionId = 'training_001';

    it('should return mission details for training mission', async () => {
      // Mock deployment
      const mockDeployment = {
        getClientState: jest.fn().mockReturnValue({
          deploymentId: 'deploy-123',
          missionId,
          status: 'active'
        })
      };
      MockMissionDeployment.findOne.mockResolvedValue(mockDeployment as any);

      // Mock agent with compatibility calculations
      const mockAgent = {
        getAvailableProxim8s: jest.fn().mockReturnValue([
          { nftId: 'proxim8-1', personality: 'analytical', toObject: () => ({ nftId: 'proxim8-1' }) }
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
        .get(`/api/missions/${missionId}?type=training`)
        .set('Authorization', `Bearer ${mockAuthToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.mission).toBeDefined();
      expect(response.body.data.mission.missionType).toBe('training');
      expect(response.body.data.deployment).toBeDefined();
      expect(response.body.data.agent).toBeDefined();
    });

    it('should return mission details for timeline mission', async () => {
      const timelineMissionId = 'timeline_2027';
      
      // Mock no existing deployment
      MockMissionDeployment.findOne.mockResolvedValue(null);

      // Mock mission template
      const mockTemplate = {
        templateId: timelineMissionId,
        missionType: 'timeline',
        isActive: true,
        missionName: 'Neural Seed Installation',
        year: 2027
      };
      MockMissionTemplate.findOne.mockResolvedValue(mockTemplate as any);

      // Mock agent
      const mockAgent = {
        getAvailableProxim8s: jest.fn().mockReturnValue([]),
        canDeployMission: jest.fn().mockReturnValue({ allowed: true })
      };
      MockAgent.findOne.mockResolvedValue(mockAgent as any);

      const response = await request(app)
        .get(`/api/missions/${timelineMissionId}?type=timeline`)
        .set('Authorization', `Bearer ${mockAuthToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.mission).toBeDefined();
      expect(response.body.data.mission.missionType).toBe('timeline');
    });

    it('should generate timeline mission if template not found', async () => {
      const timelineMissionId = 'timeline_2025';
      
      // Mock no deployment and no template
      MockMissionDeployment.findOne.mockResolvedValue(null);
      MockMissionTemplate.findOne.mockResolvedValue(null);

      // Mock generated timeline mission
      const mockGeneratedMission = {
        id: timelineMissionId,
        missionName: 'Generated Timeline Mission',
        year: 2025,
        location: 'Timeline Node 2025'
      };
      MockMissionService.generateTimelineMission.mockResolvedValue(mockGeneratedMission);

      // Mock agent
      const mockAgent = {
        getAvailableProxim8s: jest.fn().mockReturnValue([]),
        canDeployMission: jest.fn().mockReturnValue({ allowed: true })
      };
      MockAgent.findOne.mockResolvedValue(mockAgent as any);

      const response = await request(app)
        .get(`/api/missions/${timelineMissionId}?type=timeline`)
        .set('Authorization', `Bearer ${mockAuthToken}`)
        .expect(200);

      expect(MockMissionService.generateTimelineMission).toHaveBeenCalledWith(2025, undefined, undefined);
      expect(response.body.success).toBe(true);
      expect(response.body.data.mission.id).toBe(timelineMissionId);
    });

    it('should return 404 for non-existent training mission', async () => {
      const response = await request(app)
        .get('/api/missions/training_999?type=training')
        .set('Authorization', `Bearer ${mockAuthToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Training mission not found');
    });

    it('should return 404 for non-existent timeline mission', async () => {
      MockMissionDeployment.findOne.mockResolvedValue(null);
      MockMissionTemplate.findOne.mockResolvedValue(null);
      MockMissionService.generateTimelineMission.mockRejectedValue(new Error('Generation failed'));

      const response = await request(app)
        .get('/api/missions/timeline_invalid?type=timeline')
        .set('Authorization', `Bearer ${mockAuthToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Mission not found');
    });
  });

  describe('POST /api/missions/:missionId/deploy', () => {
    const missionId = 'training_001';
    const deploymentData = {
      proxim8Id: 'proxim8-1',
      approach: 'balanced' as const,
      missionType: 'training'
    };

    it('should deploy training mission successfully', async () => {
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
        .post(`/api/missions/${missionId}/deploy`)
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
        approach: deploymentData.approach,
        timelineNode: undefined
      });
    });

    it('should deploy timeline mission with timeline node', async () => {
      const timelineDeploymentData = {
        ...deploymentData,
        missionType: 'timeline',
        timelineNode: {
          year: 2027,
          month: 6,
          isCriticalJuncture: true
        }
      };

      const mockDeployment = {
        deploymentId: 'deploy-456',
        getClientState: jest.fn().mockReturnValue({
          deploymentId: 'deploy-456',
          missionId,
          status: 'active'
        })
      };
      MockMissionService.deployMission.mockResolvedValue(mockDeployment as any);

      const response = await request(app)
        .post(`/api/missions/${missionId}/deploy`)
        .set('Authorization', `Bearer ${mockAuthToken}`)
        .send(timelineDeploymentData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(MockMissionService.deployMission).toHaveBeenCalledWith({
        agentId: mockUser.userId,
        missionId,
        missionType: 'timeline',
        proxim8Id: timelineDeploymentData.proxim8Id,
        approach: timelineDeploymentData.approach,
        timelineNode: timelineDeploymentData.timelineNode
      });
    });

    it('should return 400 for invalid deployment parameters', async () => {
      const response = await request(app)
        .post(`/api/missions/${missionId}/deploy`)
        .set('Authorization', `Bearer ${mockAuthToken}`)
        .send({ proxim8Id: 'proxim8-1' }) // Missing approach
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Invalid deployment parameters');
    });

    it('should return 400 for invalid approach', async () => {
      const response = await request(app)
        .post(`/api/missions/${missionId}/deploy`)
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
        .post(`/api/missions/${missionId}/deploy`)
        .set('Authorization', `Bearer ${mockAuthToken}`)
        .send(deploymentData)
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Proxim8 not available');
    });
  });

  describe('GET /api/missions/deployments/:deploymentId/status', () => {
    const deploymentId = 'deploy-123';

    it('should return mission status for active deployment', async () => {
      const mockDeployment = {
        deploymentId,
        status: 'active',
        completesAt: new Date(Date.now() + 60000), // 1 minute from now
        agentId: mockUser.userId,
        getClientState: jest.fn().mockReturnValue({
          deploymentId,
          status: 'active',
          progress: { phases: [], currentPhase: 2 }
        })
      };
      MockMissionDeployment.findOne.mockResolvedValue(mockDeployment as any);

      // Mock mission progress
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
        .get(`/api/missions/deployments/${deploymentId}/status`)
        .set('Authorization', `Bearer ${mockAuthToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.deploymentId).toBe(deploymentId);
      expect(response.body.data.progress).toBeDefined();
    });

    it('should handle mission expiration and free Proxim8', async () => {
      const mockDeployment = {
        deploymentId,
        status: 'active',
        completesAt: new Date(Date.now() - 1000), // 1 second ago (expired)
        agentId: mockUser.userId,
        getClientState: jest.fn().mockReturnValue({
          deploymentId,
          status: 'completed'
        })
      };
      MockMissionDeployment.findOne.mockResolvedValue(mockDeployment as any);

      // Mock expired progress
      MockMissionService.getMissionProgress.mockReturnValue({
        progress: 100,
        currentPhase: 5,
        phases: [],
        isComplete: true,
        isTimerExpired: true,
        finalResults: {
          overallSuccess: true,
          finalNarrative: 'Mission completed successfully',
          timelineShift: 0.05,
          influenceType: 'green_loom',
          rewards: { timelinePoints: 100, experience: 50 }
        }
      });

      // Mock mission expiration handling
      MockMissionService.handleMissionExpiration.mockResolvedValue(mockDeployment as any);

      const response = await request(app)
        .get(`/api/missions/deployments/${deploymentId}/status`)
        .set('Authorization', `Bearer ${mockAuthToken}`)
        .expect(200);

      expect(MockMissionService.handleMissionExpiration).toHaveBeenCalledWith(deploymentId);
      expect(response.body.success).toBe(true);
      expect(response.body.data.progress.finalResults).toBeDefined();
    });

    it('should return 404 for non-existent deployment', async () => {
      MockMissionDeployment.findOne.mockResolvedValue(null);

      const response = await request(app)
        .get('/api/missions/deployments/non-existent/status')
        .set('Authorization', `Bearer ${mockAuthToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Mission deployment not found');
    });

    it('should only return deployment for the authenticated user', async () => {
      const mockDeployment = {
        deploymentId,
        agentId: 'different-user', // Different user
        status: 'active'
      };
      MockMissionDeployment.findOne.mockResolvedValue(mockDeployment as any);

      const response = await request(app)
        .get(`/api/missions/deployments/${deploymentId}/status`)
        .set('Authorization', `Bearer ${mockAuthToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Mission deployment not found');
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed requests gracefully', async () => {
      const response = await request(app)
        .post('/api/missions/test/deploy')
        .set('Authorization', `Bearer ${mockAuthToken}`)
        .send('invalid json')
        .expect(400);

      // Express should handle JSON parsing errors
    });

    it('should handle invalid authentication tokens', async () => {
      // Override the jwtAuth middleware to reject invalid tokens
      const mockJwtAuthReject = jest.fn((req: any, res: any, next: any) => {
        return res.status(401).json({ success: false, error: 'Invalid token' });
      });
      (require('../../middleware/jwtAuth') as any).jwtAuth = mockJwtAuthReject;

      const response = await request(app)
        .get('/api/missions')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Invalid token');
    });
  });
});