import { mcpTools } from '../mcpTools';
import TrainingMissionDeployment from '../../../models/game/TrainingMissionDeployment';
import Lore from '../../../models/Lore';
import { TRAINING_MISSIONS } from '../../../data/trainingMissions';
import mongoose from 'mongoose';

// Mock the models
jest.mock('../../../models/game/TrainingMissionDeployment');
jest.mock('../../../models/Lore');
jest.mock('../../../utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
  }
}));

// Mock the training missions data
jest.mock('../../../data/trainingMissions', () => ({
  TRAINING_MISSIONS: [
    {
      missionId: 'test_mission_001',
      sequence: 1,
      title: 'Test Mission Alpha',
      date: '2089-01-15',
      location: 'Neo Tokyo Test Facility',
      description: 'A test mission for unit testing',
      imagePrompt: 'A futuristic testing facility',
      duration: 3600000, // 1 hour
      briefing: {
        text: 'Test briefing',
        currentBalance: 100,
        threatLevel: 'medium' as const
      },
      approaches: [
        {
          type: 'low' as const,
          name: 'Stealth Approach',
          description: 'Sneak in quietly',
          successRate: { min: 0.6, max: 0.8 },
          timelineShift: { min: -5, max: 5 }
        }
      ],
      compatibility: {
        preferred: ['analytical' as const, 'diplomatic' as const],
        bonus: 0.1,
        penalty: 0.05
      },
      phases: [
        {
          id: 1,
          name: 'Infiltration',
          durationPercent: 50,
          narrativeTemplates: {
            success: 'Successfully infiltrated',
            failure: 'Infiltration failed'
          }
        }
      ]
    }
  ]
}));

const MockedTrainingMissionDeployment = TrainingMissionDeployment as jest.Mocked<typeof TrainingMissionDeployment>;
const MockedLore = Lore as jest.Mocked<typeof Lore>;

describe('MCP Tools', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getMissions', () => {
    it('should return all missions when no filters applied', async () => {
      const result = await mcpTools.getMissions({});
      
      expect(result.content[0].type).toBe('text');
      const missions = JSON.parse(result.content[0].text);
      expect(missions).toHaveLength(1);
      expect(missions[0].missionId).toBe('test_mission_001');
    });

    it('should filter missions by missionId', async () => {
      const result = await mcpTools.getMissions({ missionId: 'test_mission_001' });
      
      const missions = JSON.parse(result.content[0].text);
      expect(missions).toHaveLength(1);
      expect(missions[0].missionId).toBe('test_mission_001');
    });

    it('should return empty array for non-existent mission', async () => {
      const result = await mcpTools.getMissions({ missionId: 'non_existent' });
      
      const missions = JSON.parse(result.content[0].text);
      expect(missions).toHaveLength(0);
    });

    it('should filter missions by agent status', async () => {
      const mockDeployments = [
        { missionId: 'test_mission_001', agentId: 'test_agent', status: 'active' }
      ];
      MockedTrainingMissionDeployment.find = jest.fn().mockResolvedValue(mockDeployments);

      const result = await mcpTools.getMissions({ 
        agentId: 'test_agent', 
        status: 'active' 
      });
      
      const missions = JSON.parse(result.content[0].text);
      expect(missions).toHaveLength(1);
      expect(MockedTrainingMissionDeployment.find).toHaveBeenCalledWith({
        agentId: 'test_agent',
        status: 'active'
      });
    });
  });

  describe('createMission', () => {
    const newMissionData = {
      missionId: 'test_mission_002',
      sequence: 2,
      title: 'New Test Mission',
      date: '2089-02-01',
      location: 'Test Location',
      description: 'New mission description',
      imagePrompt: 'Test image prompt',
      duration: 7200000,
      briefing: {
        text: 'New briefing',
        currentBalance: 200,
        threatLevel: 'high' as const
      },
      approaches: [
        {
          type: 'medium' as const,
          name: 'Balanced Approach',
          description: 'Balanced strategy',
          successRate: { min: 0.5, max: 0.7 },
          timelineShift: { min: -10, max: 10 }
        }
      ],
      compatibility: {
        preferred: ['aggressive' as const],
        bonus: 0.15,
        penalty: 0.1
      },
      phases: [
        {
          id: 1,
          name: 'Preparation',
          durationPercent: 30,
          narrativeTemplates: {
            success: 'Preparation complete',
            failure: 'Preparation failed'
          }
        }
      ]
    };

    it('should create a new mission successfully', async () => {
      const result = await mcpTools.createMission({ missionData: newMissionData });
      
      expect(result.content[0].text).toContain('Mission created successfully: test_mission_002');
      expect(result.isError).toBeUndefined();
    });

    it('should reject duplicate mission IDs', async () => {
      const duplicateMission = { ...newMissionData, missionId: 'test_mission_001' };
      
      const result = await mcpTools.createMission({ missionData: duplicateMission });
      
      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Mission already exists with ID: test_mission_001');
    });
  });

  describe('deployMission', () => {
    beforeEach(() => {
      // Mock mongoose ObjectId
      jest.spyOn(mongoose.Types, 'ObjectId').mockImplementation(() => ({
        toString: () => 'mock_deployment_id'
      }) as any);
    });

    it('should deploy mission successfully', async () => {
      const mockDeployment = {
        deploymentId: 'mock_deployment_id',
        agentId: 'test_agent',
        missionId: 'test_mission_001',
        proxim8Id: 'proxim8_123',
        approach: 'medium',
        save: jest.fn().mockResolvedValue(true)
      };

      MockedTrainingMissionDeployment.mockImplementation(() => mockDeployment as any);

      const result = await mcpTools.deployMission({
        agentId: 'test_agent',
        missionId: 'test_mission_001',
        proxim8Id: 'proxim8_123',
        approach: 'medium'
      });

      expect(result.content[0].text).toContain('Mission deployed successfully!');
      expect(result.content[0].text).toContain('Test Mission Alpha');
      expect(mockDeployment.save).toHaveBeenCalled();
    });

    it('should reject deployment for non-existent mission', async () => {
      const result = await mcpTools.deployMission({
        agentId: 'test_agent',
        missionId: 'non_existent_mission',
        proxim8Id: 'proxim8_123',
        approach: 'low'
      });

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Mission not found: non_existent_mission');
    });
  });

  describe('getDeployment', () => {
    it('should return deployment when found', async () => {
      const mockDeployment = {
        deploymentId: 'test_deployment',
        agentId: 'test_agent',
        missionId: 'test_mission_001',
        status: 'active'
      };

      MockedTrainingMissionDeployment.findOne = jest.fn().mockResolvedValue(mockDeployment);

      const result = await mcpTools.getDeployment({
        deploymentId: 'test_deployment'
      });

      expect(result.content[0].text).toContain('test_deployment');
      expect(MockedTrainingMissionDeployment.findOne).toHaveBeenCalledWith({
        deploymentId: 'test_deployment'
      });
    });

    it('should return error when deployment not found', async () => {
      MockedTrainingMissionDeployment.findOne = jest.fn().mockResolvedValue(null);

      const result = await mcpTools.getDeployment({
        deploymentId: 'non_existent'
      });

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Deployment not found: non_existent');
    });
  });

  describe('getActiveDeployments', () => {
    it('should return active deployments', async () => {
      const mockDeployments = [
        { deploymentId: 'dep1', status: 'active', completesAt: new Date(Date.now() + 3600000) },
        { deploymentId: 'dep2', status: 'active', completesAt: new Date(Date.now() + 7200000) }
      ];

      MockedTrainingMissionDeployment.find = jest.fn().mockResolvedValue(mockDeployments);

      const result = await mcpTools.getActiveDeployments();

      const deployments = JSON.parse(result.content[0].text);
      expect(deployments).toHaveLength(2);
      expect(MockedTrainingMissionDeployment.find).toHaveBeenCalledWith({
        status: 'active',
        completesAt: { $gt: expect.any(Date) }
      });
    });
  });

  describe('getLore', () => {
    it('should return lore with filters', async () => {
      const mockLore = [
        { nftId: 'nft_123', sourceType: 'mission_generated', claimed: false },
        { nftId: 'nft_456', sourceType: 'ai_generated', claimed: true }
      ];

      MockedLore.find = jest.fn().mockResolvedValue(mockLore);

      const result = await mcpTools.getLore({
        sourceType: 'mission_generated',
        claimed: false
      });

      const lore = JSON.parse(result.content[0].text);
      expect(lore).toHaveLength(2);
      expect(MockedLore.find).toHaveBeenCalledWith({
        sourceType: 'mission_generated',
        claimed: false
      });
    });
  });

  describe('getMissionStats', () => {
    it('should return comprehensive mission statistics', async () => {
      const mockDeployments = [
        { 
          deploymentId: 'dep1', 
          missionId: 'test_mission_001', 
          status: 'active',
          deployedAt: new Date('2089-01-01'),
          completesAt: new Date('2089-01-02')
        },
        { 
          deploymentId: 'dep2', 
          missionId: 'test_mission_001', 
          status: 'completed',
          deployedAt: new Date('2089-01-05'),
          completesAt: new Date('2089-01-06')
        }
      ];

      MockedTrainingMissionDeployment.find = jest.fn().mockResolvedValue(mockDeployments);

      const result = await mcpTools.getMissionStats({});

      const stats = JSON.parse(result.content[0].text);
      expect(stats.totalDeployments).toBe(2);
      expect(stats.activeDeployments).toBe(1);
      expect(stats.completedDeployments).toBe(1);
      expect(stats.missionBreakdown['Test Mission Alpha']).toBe(2);
      expect(stats.recentActivity).toHaveLength(2);
    });
  });

  describe('updateMission', () => {
    it('should update mission successfully', async () => {
      const updates = {
        title: 'Updated Test Mission',
        description: 'Updated description'
      };

      const result = await mcpTools.updateMission({
        missionId: 'test_mission_001',
        updates
      });

      expect(result.content[0].text).toContain('Mission updated successfully: test_mission_001');
      expect(result.content[0].text).toContain('Updated Test Mission');
    });

    it('should reject updates for non-existent mission', async () => {
      const result = await mcpTools.updateMission({
        missionId: 'non_existent',
        updates: { title: 'New Title' }
      });

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Mission not found: non_existent');
    });
  });

  describe('error handling', () => {
    it('should handle database errors gracefully', async () => {
      MockedTrainingMissionDeployment.find = jest.fn().mockRejectedValue(new Error('Database connection failed'));

      const result = await mcpTools.getActiveDeployments();

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Error retrieving active deployments');
      expect(result.content[0].text).toContain('Database connection failed');
    });
  });
});