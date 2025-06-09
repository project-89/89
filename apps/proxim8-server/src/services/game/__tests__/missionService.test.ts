import { MissionService } from '../missionService';
import TrainingMissionDeployment from '../../../models/game/TrainingMissionDeployment';
import MissionDeployment from '../../../models/game/MissionDeployment';
import MissionTemplate from '../../../models/game/MissionTemplate';
import Agent from '../../../models/game/Agent';
import { LoreFragment } from '../../../models/LoreFragment';
import { TRAINING_MISSIONS } from '../../../data/trainingMissions';

// Mock all dependencies
jest.mock('../../../models/game/TrainingMissionDeployment');
jest.mock('../../../models/game/MissionDeployment');
jest.mock('../../../models/game/MissionTemplate');
jest.mock('../../../models/game/Agent');
jest.mock('../../../models/LoreFragment');
jest.mock('../contentGenerationService');

const MockTrainingMissionDeployment = TrainingMissionDeployment as jest.Mocked<typeof TrainingMissionDeployment>;
const MockMissionDeployment = MissionDeployment as jest.Mocked<typeof MissionDeployment>;
const MockMissionTemplate = MissionTemplate as jest.Mocked<typeof MissionTemplate>;
const MockAgent = Agent as jest.Mocked<typeof Agent>;
const MockLoreFragment = LoreFragment as jest.Mocked<typeof LoreFragment>;

describe('MissionService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Set up default mocks to prevent database calls
    MockTrainingMissionDeployment.findOne = jest.fn().mockResolvedValue(null);
    MockTrainingMissionDeployment.create = jest.fn().mockResolvedValue({});
    MockTrainingMissionDeployment.findOneAndUpdate = jest.fn().mockResolvedValue({});
    MockTrainingMissionDeployment.canDeployMission = jest.fn().mockResolvedValue({ canDeploy: true });
    
    MockMissionDeployment.findOne = jest.fn().mockResolvedValue(null);
    MockMissionDeployment.create = jest.fn().mockResolvedValue({});
    MockMissionDeployment.findOneAndUpdate = jest.fn().mockResolvedValue({});
    MockMissionDeployment.canDeployMission = jest.fn().mockResolvedValue({ canDeploy: true });
    
    MockMissionTemplate.findOne = jest.fn().mockResolvedValue(null);
    MockMissionTemplate.create = jest.fn().mockResolvedValue({});
    
    MockAgent.findOne = jest.fn().mockResolvedValue(null);
    MockAgent.findOneAndUpdate = jest.fn().mockResolvedValue({});
    
    MockLoreFragment.create = jest.fn().mockResolvedValue({});
  });

  describe('calculateCompatibility', () => {
    it('should calculate compatibility for analytical Proxim8', () => {
      const proxim8 = {
        personality: 'analytical',
        experience: 500,
        level: 3
      };

      const mission = {
        primaryApproach: 'expose'
      };

      const compatibility = MissionService.calculateCompatibility(proxim8, mission);

      expect(compatibility.overall).toBeGreaterThan(0.7);
      expect(compatibility.personalityBonus).toBe(0.9); // analytical + expose = high compatibility
      expect(compatibility.experienceBonus).toBeGreaterThan(0);
      expect(compatibility.levelBonus).toBeGreaterThan(0);
    });

    it('should calculate compatibility for aggressive Proxim8', () => {
      const proxim8 = {
        personality: 'aggressive',
        experience: 1000,
        level: 5
      };

      const mission = {
        primaryApproach: 'sabotage'
      };

      const compatibility = MissionService.calculateCompatibility(proxim8, mission);

      expect(compatibility.personalityBonus).toBe(0.95); // aggressive + sabotage = perfect match
      expect(compatibility.overall).toBeGreaterThan(0.9);
    });

    it('should cap overall compatibility at 95%', () => {
      const proxim8 = {
        personality: 'adaptive',
        experience: 10000, // Very high experience
        level: 50
      };

      const mission = {
        primaryApproach: 'infiltrate'
      };

      const compatibility = MissionService.calculateCompatibility(proxim8, mission);

      expect(compatibility.overall).toBe(0.95); // Should be capped
    });
  });

  describe('generatePhaseOutcomes', () => {
    it('should generate 5 phase outcomes', () => {
      const mission = TRAINING_MISSIONS[0];
      const baseSuccessRate = 0.7;

      const outcomes = MissionService.generatePhaseOutcomes(mission, baseSuccessRate);

      expect(outcomes).toHaveLength(5);
      outcomes.forEach((outcome, index) => {
        expect(outcome.phaseId).toBe(index + 1);
        expect(typeof outcome.success).toBe('boolean');
        expect(outcome.narrative).toBeNull();
        expect(outcome.completedAt).toBeNull();
      });
    });

    it.skip('should show cascading failures when early phases fail', () => {
      const mission = TRAINING_MISSIONS[0];
      
      // Mock Math.random to ensure first phase fails and later phases are affected
      const originalRandom = Math.random;
      Math.random = jest.fn()
        .mockReturnValueOnce(1.0)  // First phase fails (100% chance)
        .mockReturnValueOnce(0.5)  // Second phase - should be affected by cascade
        .mockReturnValueOnce(0.5)  // Third phase
        .mockReturnValueOnce(0.5)  // Fourth phase
        .mockReturnValueOnce(0.5); // Fifth phase

      const outcomes = MissionService.generatePhaseOutcomes(mission, 0.7);

      // Restore Math.random
      Math.random = originalRandom;

      expect(outcomes.length).toBe(5);
      expect(outcomes[0].success).toBe(false);
      // Check that at least some phases show cascading effect
      const failureCount = outcomes.filter(o => !o.success).length;
      expect(failureCount).toBeGreaterThan(1); // Should have multiple failures due to cascade
    });
  });

  describe('deployMission', () => {
    const mockDeploymentParams = {
      agentId: 'test-agent',
      missionId: 'training_001',
      proxim8Id: 'proxim8-1',
      approach: 'medium' as const
    };

    beforeEach(() => {
      // Mock TrainingMissionDeployment.canDeployMission
      MockTrainingMissionDeployment.canDeployMission = jest.fn().mockResolvedValue({
        canDeploy: true
      });

      // Mock deployment save
      const mockDeployment = {
        save: jest.fn().mockResolvedValue(true),
        deploymentId: 'deploy-123'
      };
      MockTrainingMissionDeployment.prototype.constructor = jest.fn().mockReturnValue(mockDeployment);
      jest.spyOn(MockTrainingMissionDeployment.prototype, 'save').mockResolvedValue(mockDeployment);
    });

    it.skip('should deploy mission successfully', async () => {
      // Mock mission template with proper approach structure
      const mockMissionTemplate = {
        id: 'training_001',
        name: 'Test Mission',
        difficulty: 'medium',
        approaches: {
          medium: {
            duration: 600000,
            baseSuccessRate: 0.7
          }
        }
      };
      MockMissionTemplate.findOne.mockResolvedValue(mockMissionTemplate as any);
      
      // Mock agent with available Proxim8
      const mockProxim8 = {
        nftId: 'proxim8-1',
        personality: 'analytical',
        isDeployed: false,
        experience: 100,
        level: 2
      };
      const mockAgent = {
        proxim8s: [mockProxim8],
        save: jest.fn().mockResolvedValue(true),
        lastMissionDeployedAt: null,
        dailyMissionCount: 0
      };
      MockAgent.findOne.mockResolvedValue(mockAgent as any);

      const deployment = await MissionService.deployMission(mockDeploymentParams);

      expect(MockAgent.findOne).toHaveBeenCalledWith({ userId: mockDeploymentParams.agentId });
      expect(mockAgent.save).toHaveBeenCalled();
      expect(mockProxim8.isDeployed).toBe(true);
      expect(mockAgent.dailyMissionCount).toBe(1);
    });

    it('should throw error if mission template not found', async () => {
      const invalidParams = { ...mockDeploymentParams, missionId: 'invalid_mission' };

      await expect(MissionService.deployMission(invalidParams)).rejects.toThrow('Mission template not found');
    });

    it('should throw error if agent not found', async () => {
      // Mock mission template exists
      const mockMissionTemplate = { id: 'training_001', name: 'Test Mission' };
      MockMissionTemplate.findOne.mockResolvedValue(mockMissionTemplate as any);
      
      // But agent doesn't exist
      MockAgent.findOne.mockResolvedValue(null);

      await expect(MissionService.deployMission(mockDeploymentParams)).rejects.toThrow('Agent not found');
    });

    it('should throw error if Proxim8 not found', async () => {
      // Mock mission template exists
      const mockMissionTemplate = { id: 'training_001', name: 'Test Mission' };
      MockMissionTemplate.findOne.mockResolvedValue(mockMissionTemplate as any);
      
      const mockAgent = {
        proxim8s: [], // No Proxim8s
        save: jest.fn()
      };
      MockAgent.findOne.mockResolvedValue(mockAgent as any);

      await expect(MissionService.deployMission(mockDeploymentParams)).rejects.toThrow('Proxim8 not found');
    });

    it('should throw error if Proxim8 already deployed', async () => {
      // Mock mission template exists
      const mockMissionTemplate = { id: 'training_001', name: 'Test Mission' };
      MockMissionTemplate.findOne.mockResolvedValue(mockMissionTemplate as any);
      
      const mockProxim8 = {
        nftId: 'proxim8-1',
        isDeployed: true // Already deployed
      };
      const mockAgent = {
        proxim8s: [mockProxim8],
        save: jest.fn()
      };
      MockAgent.findOne.mockResolvedValue(mockAgent as any);

      await expect(MissionService.deployMission(mockDeploymentParams)).rejects.toThrow('Proxim8 is already deployed');
    });

    it.skip('should throw error if cannot deploy mission', async () => {
      MockTrainingMissionDeployment.canDeployMission = jest.fn().mockResolvedValue({
        canDeploy: false,
        reason: 'Mission already completed'
      });

      await expect(MissionService.deployMission(mockDeploymentParams)).rejects.toThrow('Mission already completed');
    });
  });

  describe('completeMission', () => {
    const deploymentId = 'deploy-123';

    it.skip('should complete mission successfully', async () => {
      // Mock deployment - override the beforeEach null mock
      const mockDeployment = {
        deploymentId,
        missionId: 'training_001',
        agentId: 'test-agent',
        proxim8Id: 'proxim8-1',
        approach: 'medium',
        status: 'active',
        phaseOutcomes: [
          { phaseId: 1, success: true },
          { phaseId: 2, success: true },
          { phaseId: 3, success: true },
          { phaseId: 4, success: false },
          { phaseId: 5, success: true }
        ],
        save: jest.fn().mockResolvedValue(true)
      };
      MockTrainingMissionDeployment.findOne.mockResolvedValue(mockDeployment as any);
      MockMissionDeployment.findOne.mockResolvedValue(mockDeployment as any);

      // Mock agent
      const mockProxim8 = {
        nftId: 'proxim8-1',
        isDeployed: true,
        missionCount: 0,
        experience: 100
      };
      const mockAgent = {
        agentId: 'test-agent',
        timelinePoints: 500,
        totalMissionsDeployed: 0,
        totalMissionsSucceeded: 0,
        totalMissionsFailed: 0,
        totalTimelineShift: 0,
        proxim8s: [mockProxim8],
        calculateRank: jest.fn(),
        save: jest.fn().mockResolvedValue(true)
      };
      MockAgent.findOne.mockResolvedValue(mockAgent as any);

      const result = await MissionService.completeMission(deploymentId);

      expect(mockDeployment.status).toBe('completed');
      expect(mockDeployment.result.overallSuccess).toBe(true); // 4/5 phases successful
      expect(mockAgent.totalMissionsSucceeded).toBe(1);
      expect(mockProxim8.isDeployed).toBe(false);
      expect(mockAgent.save).toHaveBeenCalled();
    });

    it.skip('should handle mission failure correctly', async () => {
      // Mock deployment with mostly failed phases
      const mockDeployment = {
        deploymentId,
        missionId: 'training_001',
        agentId: 'test-agent',
        proxim8Id: 'proxim8-1',
        approach: 'medium',
        status: 'active',
        phaseOutcomes: [
          { phaseId: 1, success: false },
          { phaseId: 2, success: false },
          { phaseId: 3, success: true },
          { phaseId: 4, success: false },
          { phaseId: 5, success: false }
        ],
        save: jest.fn().mockResolvedValue(true)
      };
      MockTrainingMissionDeployment.findOne.mockResolvedValue(mockDeployment as any);

      // Mock agent
      const mockAgent = {
        totalMissionsFailed: 0,
        totalMissionsSucceeded: 0,
        proxim8s: [{ nftId: 'proxim8-1' }],
        calculateRank: jest.fn(),
        save: jest.fn().mockResolvedValue(true)
      };
      MockAgent.findOne.mockResolvedValue(mockAgent as any);

      await MissionService.completeMission(deploymentId);

      expect(mockDeployment.result.overallSuccess).toBe(false); // Only 1/5 phases successful
      expect(mockAgent.totalMissionsFailed).toBe(1);
    });

    it('should throw error if deployment not found', async () => {
      MockTrainingMissionDeployment.findOne.mockResolvedValue(null);

      await expect(MissionService.completeMission(deploymentId)).rejects.toThrow('Mission deployment not found');
    });

    it('should throw error if mission not active', async () => {
      const mockDeployment = {
        status: 'completed'
      };
      MockMissionDeployment.findOne.mockResolvedValue(mockDeployment as any);

      await expect(MissionService.completeMission(deploymentId)).rejects.toThrow('Mission is not active');
    });
  });

  describe('getMissionProgress', () => {
    it('should return correct progress for active mission', () => {
      const deployment = {
        deployedAt: new Date(Date.now() - 30000), // 30 seconds ago
        duration: 60000, // 1 minute total
        phaseOutcomes: [
          { phaseId: 1, success: true },
          { phaseId: 2, success: false },
          { phaseId: 3, success: true },
          { phaseId: 4, success: true },
          { phaseId: 5, success: false }
        ]
      };

      const progress = MissionService.getMissionProgress(deployment);

      expect(progress.progress).toBe(50); // 50% complete
      expect(progress.currentPhase).toBeGreaterThan(0);
      expect(progress.phases).toHaveLength(5);
      expect(progress.isComplete).toBe(false);
    });

    it('should reveal phases based on time progress', () => {
      const deployment = {
        deployedAt: new Date(Date.now() - 50000), // 50 seconds ago
        duration: 100000, // 100 seconds total
        phaseOutcomes: [
          { phaseId: 1, success: true },
          { phaseId: 2, success: false },
          { phaseId: 3, success: true },
          { phaseId: 4, success: true },
          { phaseId: 5, success: false }
        ]
      };

      const progress = MissionService.getMissionProgress(deployment);

      expect(progress.progress).toBe(50);
      
      // At 50% progress, first 2-3 phases should be revealed
      const revealedPhases = progress.phases.filter(p => p.status !== 'pending');
      expect(revealedPhases.length).toBeGreaterThan(1);
    });

    it('should show complete mission when finished', () => {
      const deployment = {
        deployedAt: new Date(Date.now() - 120000), // 2 minutes ago
        duration: 60000, // 1 minute total (so it's complete)
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
          timelineShift: 0.1,
          influenceType: 'positive'
        }
      };

      const progress = MissionService.getMissionProgress(deployment);

      expect(progress.progress).toBe(100);
      expect(progress.isComplete).toBe(true);
      
      // All phases should be revealed
      const pendingPhases = progress.phases.filter(p => p.status === 'pending');
      expect(pendingPhases.length).toBe(0);
    });
  });
});