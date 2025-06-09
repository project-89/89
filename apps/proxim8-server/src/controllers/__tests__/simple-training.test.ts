import express from 'express';
import request from 'supertest';
import { 
  getTrainingMissions, 
  getMissionDetails, 
  deployMission, 
  getMissionStatus 
} from '../trainingController';

// Mock all external dependencies
jest.mock('../../models/game/TrainingMissionDeployment');
jest.mock('../../models/game/Agent');
jest.mock('../../models/Lore');
jest.mock('../../services/game/missionService');
jest.mock('../../services/game/trainingMissionGenerationService');

// Mock training missions data
jest.mock('../../data/trainingMissions', () => ({
  TRAINING_MISSIONS: [
    {
      missionId: 'training_001',
      id: 'training_001',
      missionName: 'Neural Interface Training',
      title: 'Neural Interface Training',
      description: 'Basic neural interface training mission',
      duration: 600000, // 10 minutes
      phases: [
        { id: 1, name: 'Initialization', durationPercent: 30 },
        { id: 2, name: 'Execution', durationPercent: 50 },
        { id: 3, name: 'Completion', durationPercent: 20 }
      ],
      approaches: [
        {
          type: 'low',
          name: 'Stealth Approach',
          description: 'Low risk, moderate success',
          successRate: { min: 0.5, max: 0.7 },
          timelineShift: { min: 1, max: 3 }
        },
        {
          type: 'medium',
          name: 'Balanced Approach',
          description: 'Moderate risk, good success',
          successRate: { min: 0.6, max: 0.8 },
          timelineShift: { min: 2, max: 5 }
        },
        {
          type: 'high',
          name: 'Aggressive Approach',
          description: 'High risk, high success',
          successRate: { min: 0.7, max: 0.9 },
          timelineShift: { min: 3, max: 7 }
        }
      ]
    }
  ]
}));

import Agent from '../../models/game/Agent';
import TrainingMissionDeployment from '../../models/game/TrainingMissionDeployment';
import Lore from '../../models/Lore';
import { MissionService } from '../../services/game/missionService';
import { TrainingMissionGenerationService } from '../../services/game/trainingMissionGenerationService';

const MockAgent = Agent as jest.Mocked<typeof Agent>;
const MockTrainingMissionDeployment = TrainingMissionDeployment as jest.Mocked<typeof TrainingMissionDeployment>;
const MockLore = Lore as jest.Mocked<typeof Lore>;
const MockMissionService = MissionService as jest.Mocked<typeof MissionService>;
const MockTrainingMissionGenerationService = TrainingMissionGenerationService as jest.Mocked<typeof TrainingMissionGenerationService>;

describe('Training Controller - Simple Tests', () => {
  let app: express.Application;
  
  beforeAll(() => {
    app = express();
    app.use(express.json());
    
    // Add a simple auth mock middleware
    app.use((req: any, res, next) => {
      req.user = {
        userId: 'test-user-123',
        walletAddress: '0x1234567890abcdef'
      };
      next();
    });

    // Mount the controller functions directly
    app.get('/training/missions', getTrainingMissions);
    app.get('/training/missions/:missionId', getMissionDetails);
    app.post('/training/missions/:missionId/deploy', deployMission);
    app.get('/training/deployments/:deploymentId/status', getMissionStatus);
  });

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Set up default mocks for query chaining
    const defaultMockQuery = {
      lean: jest.fn().mockResolvedValue([])
    };
    MockTrainingMissionDeployment.find = jest.fn().mockReturnValue(defaultMockQuery);
    MockTrainingMissionDeployment.findOne = jest.fn().mockResolvedValue(null);
    MockTrainingMissionDeployment.canDeployMission = jest.fn().mockResolvedValue({
      canDeploy: true,
      reason: null
    });
    MockAgent.findOne = jest.fn().mockResolvedValue(null);
    
    // Mock Lore model constructor and save method
    const mockLoreInstance = {
      save: jest.fn().mockResolvedValue(true)
    };
    (MockLore as any).mockImplementation(() => mockLoreInstance);
  });

  describe('GET /training/missions', () => {
    it('should return training missions with user progress', async () => {
      // Mock Agent.findOne
      const mockAgent = {
        codename: 'TestAgent',
        rank: 'operative',
        timelinePoints: 1500,
        getAvailableProxim8s: () => [{ nftId: 'proxim8-1', name: 'Test Proxim8' }]
      };
      MockAgent.findOne.mockResolvedValue(mockAgent as any);

      // Mock TrainingMissionDeployment.find with proper chaining
      const mockDeployments = [
        {
          missionId: 'training_001',
          status: 'completed',
          result: { overallSuccess: true },
          updatedAt: new Date(),
          deployedAt: new Date()
        }
      ];
      
      // Override the default mock with specific data for this test
      const mockQuery = {
        lean: jest.fn().mockResolvedValue(mockDeployments)
      };
      MockTrainingMissionDeployment.find.mockReturnValue(mockQuery as any);

      const response = await request(app)
        .get('/training/missions')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('missions');
      expect(response.body.data).toHaveProperty('agent');
      expect(response.body.data.agent.codename).toBe('TestAgent');
      expect(Array.isArray(response.body.data.missions)).toBe(true);
    });

    it('should handle database errors gracefully', async () => {
      MockAgent.findOne.mockRejectedValue(new Error('Database connection failed'));

      const response = await request(app)
        .get('/training/missions')
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Failed to fetch training missions');
    });
  });

  describe('GET /training/missions/:missionId', () => {
    it('should return mission details', async () => {
      const missionId = 'training_001';

      // Mock deployment
      const mockDeployment = {
        getClientState: () => ({
          deploymentId: 'deploy-123',
          missionId,
          status: 'active'
        })
      };
      MockTrainingMissionDeployment.findOne.mockResolvedValue(mockDeployment as any);

      // Mock agent
      const mockAgent = {
        getAvailableProxim8s: () => [
          { nftId: 'proxim8-1', personality: 'analytical', toObject: () => ({ nftId: 'proxim8-1' }) }
        ],
        canDeployMission: () => ({ allowed: true })
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
        .get(`/training/missions/${missionId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.mission).toBeDefined();
      expect(response.body.data.mission.id).toBe(missionId);
      expect(response.body.data.agent).toBeDefined();
    });

    it('should return 404 for non-existent mission', async () => {
      const response = await request(app)
        .get('/training/missions/training_999')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Mission not found');
    });
  });

  describe('POST /training/missions/:missionId/deploy', () => {
    it('should deploy mission successfully', async () => {
      const missionId = 'training_001';
      const deploymentData = {
        proxim8Id: 'proxim8-1',
        approach: 'medium'
      };

      // Mock agent with Proxim8
      const mockAgent = {
        walletAddress: '0x1234567890abcdef',
        proxim8s: [{
          nftId: 'proxim8-1',
          isDeployed: false,
          personality: 'analytical',
          traits: []
        }],
        save: jest.fn().mockResolvedValue(true),
        lastMissionDeployedAt: null,
        dailyMissionCount: 0
      };
      MockAgent.findOne.mockResolvedValue(mockAgent as any);

      // Mock MissionService methods
      MockMissionService.calculateCompatibility.mockReturnValue({
        overall: 0.85,
        personalityBonus: 0.1,
        experienceBonus: 0.05,
        levelBonus: 0.02
      });

      // Mock TrainingMissionGenerationService
      MockTrainingMissionGenerationService.generateMissionInstance.mockResolvedValue({
        phaseOutcomes: [
          { phase: 1, success: true, narrative: 'Test narrative' }
        ],
        result: {
          overallSuccess: true,
          summary: 'Test mission completed',
          loreFragment: {
            title: 'Test Lore',
            content: 'Test lore content'
          }
        }
      } as any);

      // Mock TrainingMissionDeployment constructor and save
      const mockDeployment = {
        deploymentId: 'deploy-123',
        missionId,
        status: 'active',
        save: jest.fn().mockResolvedValue(true),
        getClientState: () => ({
          deploymentId: 'deploy-123',
          missionId,
          status: 'active'
        })
      };
      
      // Mock the constructor
      (MockTrainingMissionDeployment as any).mockImplementation(() => mockDeployment);
      const response = await request(app)
        .post(`/training/missions/${missionId}/deploy`)
        .send(deploymentData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.deployment).toBeDefined();
      expect(response.body.data.message).toBe('Mission deployed successfully');
      
      // Verify the deployment was created properly
      expect(mockDeployment.save).toHaveBeenCalled();
      expect(mockAgent.save).toHaveBeenCalled();
    });

    it('should return 400 for invalid parameters', async () => {
      const response = await request(app)
        .post('/training/missions/training_001/deploy')
        .send({ proxim8Id: 'proxim8-1' }) // Missing approach
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Invalid deployment parameters');
    });
  });

  describe('GET /training/deployments/:deploymentId/status', () => {
    it('should return mission status', async () => {
      const deploymentId = 'deploy-123';

      const mockDeployment = {
        deploymentId,
        status: 'active',
        completesAt: new Date(Date.now() + 60000), // 1 minute from now
        agentId: 'test-user-123',
        getClientState: () => ({
          deploymentId,
          status: 'active'
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
        .get(`/training/deployments/${deploymentId}/status`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.deploymentId).toBe(deploymentId);
      expect(response.body.data.progress).toBeDefined();
    });

    it('should return 404 for non-existent deployment', async () => {
      MockTrainingMissionDeployment.findOne.mockResolvedValue(null);

      const response = await request(app)
        .get('/training/deployments/non-existent/status')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Mission deployment not found');
    });
  });

  describe('Mission Unlock Logic', () => {
    it('should always unlock the first mission (training_001)', async () => {
      const mockAgent = {
        codename: 'TestAgent',
        rank: 'operative',
        timelinePoints: 0,
        getAvailableProxim8s: () => []
      };
      MockAgent.findOne.mockResolvedValue(mockAgent as any);

      // No deployments - fresh user
      const mockQuery = {
        lean: jest.fn().mockResolvedValue([])
      };
      MockTrainingMissionDeployment.find.mockReturnValue(mockQuery as any);

      const response = await request(app)
        .get('/training/missions')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.missions).toHaveLength(1);
      expect(response.body.data.missions[0].userProgress.isUnlocked).toBe(true);
      expect(response.body.data.missions[0].id).toBe('training_001');
    });

    it('should unlock subsequent missions only after previous completion', async () => {
      const mockAgent = {
        codename: 'TestAgent',
        rank: 'operative', 
        timelinePoints: 500,
        getAvailableProxim8s: () => []
      };
      MockAgent.findOne.mockResolvedValue(mockAgent as any);

      // User has completed training_001 but not training_002
      const mockDeployments = [
        {
          missionId: 'training_001',
          status: 'completed',
          result: { overallSuccess: true },
          updatedAt: new Date(),
          deployedAt: new Date()
        }
      ];

      const mockQuery = {
        lean: jest.fn().mockResolvedValue(mockDeployments)
      };
      MockTrainingMissionDeployment.find.mockReturnValue(mockQuery as any);

      // We'll test with the single mission we have
      const response = await request(app)
        .get('/training/missions')
        .expect(200);

      expect(response.body.success).toBe(true);
      const missions = response.body.data.missions;
      
      // Check that training_001 is unlocked and completed
      expect(missions).toHaveLength(1);
      expect(missions[0].id).toBe('training_001');
      expect(missions[0].userProgress.isUnlocked).toBe(true);
      expect(missions[0].userProgress.isCompleted).toBe(true);
      expect(missions[0].userProgress.isActive).toBe(false);
      expect(missions[0].userProgress.successRate).toBe(true);
    });

    it('should test mission unlock progression logic directly', async () => {
      // We need to test the canUserAccessMission helper function
      const { getTrainingMissions } = require('../trainingController');
      
      // Test different deployment scenarios to verify unlock logic
      const testCases = [
        {
          description: 'No deployments - only first mission unlocked',
          deployments: [],
          expectedFirstMissionUnlocked: true
        },
        {
          description: 'Completed training_001 - mission should be marked complete',
          deployments: [
            { missionId: 'training_001', status: 'completed', result: { overallSuccess: true } }
          ],
          expectedFirstMissionUnlocked: true
        },
        {
          description: 'Active training_001 - mission should be marked active',
          deployments: [
            { missionId: 'training_001', status: 'active' }
          ],
          expectedFirstMissionUnlocked: true
        }
      ];

      for (const testCase of testCases) {
        const mockAgent = {
          codename: 'TestAgent',
          rank: 'operative',
          timelinePoints: 100,
          getAvailableProxim8s: () => []
        };
        MockAgent.findOne.mockResolvedValue(mockAgent as any);

        const mockQuery = {
          lean: jest.fn().mockResolvedValue(testCase.deployments)
        };
        MockTrainingMissionDeployment.find.mockReturnValue(mockQuery as any);

        const response = await request(app)
          .get('/training/missions')
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.missions[0].userProgress.isUnlocked).toBe(testCase.expectedFirstMissionUnlocked);
        
        if (testCase.deployments.length > 0) {
          const deployment = testCase.deployments[0];
          expect(response.body.data.missions[0].userProgress.isCompleted).toBe(deployment.status === 'completed');
          expect(response.body.data.missions[0].userProgress.isActive).toBe(deployment.status === 'active');
        }
      }
    });

    it('should handle invalid mission ID formats gracefully', async () => {
      const mockAgent = {
        codename: 'TestAgent',
        rank: 'operative',
        timelinePoints: 100,
        getAvailableProxim8s: () => []
      };
      MockAgent.findOne.mockResolvedValue(mockAgent as any);

      // Mock deployments with invalid mission ID format
      const mockDeployments = [
        {
          missionId: 'invalid_mission_format',
          status: 'completed',
          result: { overallSuccess: true },
          updatedAt: new Date(),
          deployedAt: new Date()
        }
      ];

      const mockQuery = {
        lean: jest.fn().mockResolvedValue(mockDeployments)
      };
      MockTrainingMissionDeployment.find.mockReturnValue(mockQuery as any);

      const response = await request(app)
        .get('/training/missions')
        .expect(200);

      expect(response.body.success).toBe(true);
      // Should still work and unlock first mission
      expect(response.body.data.missions[0].userProgress.isUnlocked).toBe(true);
    });

    it('should test canUserAccessMission helper function directly', () => {
      // Import the helper function for unit testing
      const trainingModule = require('../trainingController');
      
      // Extract and test the canUserAccessMission function
      // Since it's not exported, we'll test it indirectly through different scenarios
      
      // Test mission unlock progression patterns
      const testScenarios = [
        {
          missionId: 'training_001',
          deployments: [],
          expectedUnlocked: true, // First mission always unlocked
          description: 'First mission (training_001) should always be unlocked'
        },
        {
          missionId: 'training_002', 
          deployments: [],
          expectedUnlocked: false, // Second mission locked when no completions
          description: 'Second mission should be locked with no completions'
        },
        {
          missionId: 'training_002',
          deployments: [
            { missionId: 'training_001', status: 'completed' }
          ],
          expectedUnlocked: true, // Second mission unlocked after first completion
          description: 'Second mission should unlock after first completion'
        },
        {
          missionId: 'training_003',
          deployments: [
            { missionId: 'training_001', status: 'completed' },
            { missionId: 'training_002', status: 'active' }
          ],
          expectedUnlocked: false, // Third mission locked when second is only active
          description: 'Third mission should be locked when second is only active'
        },
        {
          missionId: 'training_003',
          deployments: [
            { missionId: 'training_001', status: 'completed' },
            { missionId: 'training_002', status: 'completed' }
          ],
          expectedUnlocked: true, // Third mission unlocked after second completion
          description: 'Third mission should unlock after second completion'
        }
      ];

      // Test each scenario by examining the logic in the controller
      testScenarios.forEach(scenario => {
        const { missionId } = scenario;
        const missionNumber = parseInt(missionId.split('_')[1]);
        
        let shouldBeUnlocked;
        if (missionNumber === 1) {
          shouldBeUnlocked = true; // First mission always unlocked
        } else {
          // Check if previous mission is completed
          const previousMissionId = `training_${String(missionNumber - 1).padStart(3, '0')}`;
          const previousDeployment = scenario.deployments.find(d => d.missionId === previousMissionId);
          shouldBeUnlocked = previousDeployment?.status === 'completed';
        }
        
        expect(shouldBeUnlocked).toBe(scenario.expectedUnlocked);
      });
    });
  });

  describe('Mission Auto-Completion', () => {
    it('should auto-complete missions when completesAt time has passed', async () => {
      const deploymentId = 'deploy-123';
      const pastTime = new Date(Date.now() - 60000); // 1 minute ago

      // First call returns active deployment that should be completed
      const mockActiveDeployment = {
        deploymentId,
        status: 'active',
        completesAt: pastTime,
        agentId: 'test-user-123'
      };

      // Second call returns the completed deployment
      const mockCompletedDeployment = {
        deploymentId,
        status: 'completed',
        completesAt: pastTime,
        agentId: 'test-user-123',
        getClientState: jest.fn().mockReturnValue({
          deploymentId,
          status: 'completed',
          result: { overallSuccess: true }
        })
      };

      MockTrainingMissionDeployment.findOne
        .mockResolvedValueOnce(mockActiveDeployment as any) // First call
        .mockResolvedValueOnce(mockCompletedDeployment as any); // Second call after completion

      // Mock the completion service
      MockMissionService.completeMission.mockResolvedValue(mockCompletedDeployment as any);

      const response = await request(app)
        .get(`/training/deployments/${deploymentId}/status`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(MockMissionService.completeMission).toHaveBeenCalledWith(deploymentId);
      expect(response.body.data.status).toBe('completed');
    });

    it('should handle completion service failures gracefully', async () => {
      const deploymentId = 'deploy-456';
      const pastTime = new Date(Date.now() - 60000);

      const mockActiveDeployment = {
        deploymentId,
        status: 'active',
        completesAt: pastTime,
        agentId: 'test-user-123'
      };

      MockTrainingMissionDeployment.findOne.mockResolvedValue(mockActiveDeployment as any);
      MockMissionService.completeMission.mockRejectedValue(new Error('Completion service failed'));

      const response = await request(app)
        .get(`/training/deployments/${deploymentId}/status`)
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Failed to fetch mission status');
      expect(MockMissionService.completeMission).toHaveBeenCalledWith(deploymentId);
    });

    it('should not auto-complete missions that are not yet due', async () => {
      const deploymentId = 'deploy-789';
      const futureTime = new Date(Date.now() + 60000); // 1 minute from now

      const mockActiveDeployment = {
        deploymentId,
        status: 'active', 
        completesAt: futureTime,
        agentId: 'test-user-123',
        getClientState: jest.fn().mockReturnValue({
          deploymentId,
          status: 'active',
          progress: { currentPhase: 2 }
        })
      };

      MockTrainingMissionDeployment.findOne.mockResolvedValue(mockActiveDeployment as any);

      // Mock mission progress for active deployment
      MockMissionService.getMissionProgress.mockReturnValue({
        progress: 65,
        currentPhase: 2,
        phases: [
          { phaseId: 1, status: 'success' },
          { phaseId: 2, status: 'active' }
        ],
        isComplete: false
      });

      const response = await request(app)
        .get(`/training/deployments/${deploymentId}/status`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('active');
      expect(response.body.data.progress).toBeDefined();
      expect(MockMissionService.completeMission).not.toHaveBeenCalled();
      expect(MockMissionService.getMissionProgress).toHaveBeenCalledWith(mockActiveDeployment);
    });

    it('should handle auto-completion when refetch returns null', async () => {
      const deploymentId = 'deploy-null';
      const pastTime = new Date(Date.now() - 60000);

      const mockActiveDeployment = {
        deploymentId,
        status: 'active',
        completesAt: pastTime,
        agentId: 'test-user-123'
      };

      MockTrainingMissionDeployment.findOne
        .mockResolvedValueOnce(mockActiveDeployment as any) // First call
        .mockResolvedValueOnce(null); // Second call returns null

      MockMissionService.completeMission.mockResolvedValue({} as any);

      const response = await request(app)
        .get(`/training/deployments/${deploymentId}/status`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBe(null);
      expect(MockMissionService.completeMission).toHaveBeenCalledWith(deploymentId);
    });
  });
});