import { TrainingMissionGenerationService } from '../../services/game/trainingMissionGenerationService';
import TrainingMissionDeployment from '../../models/game/TrainingMissionDeployment';
import Agent from '../../models/game/Agent';
import Lore from '../../models/Lore';
import { TRAINING_MISSIONS } from '../../data/trainingMissions';

// Mock environment variables to prevent errors
process.env.HELIUS_API_KEY = 'test-helius-key';

// Mock all dependencies
jest.mock('../../models/game/TrainingMissionDeployment');
jest.mock('../../models/game/Agent');
jest.mock('../../models/Lore');
jest.mock('../../services/game/trainingMissionGenerationService');

const MockTrainingMissionDeployment = TrainingMissionDeployment as jest.Mocked<typeof TrainingMissionDeployment>;
const MockAgent = Agent as jest.Mocked<typeof Agent>;
const MockLore = Lore as jest.Mocked<typeof Lore>;
const MockTrainingMissionGenerationService = TrainingMissionGenerationService as jest.Mocked<typeof TrainingMissionGenerationService>;

describe('Training Mission Lore Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Set up default mocks
    MockTrainingMissionDeployment.canDeployMission = jest.fn().mockResolvedValue({ canDeploy: true });
    MockTrainingMissionDeployment.prototype.save = jest.fn().mockResolvedValue({});
    
    MockAgent.findOne = jest.fn().mockResolvedValue(null);
    MockAgent.prototype.save = jest.fn().mockResolvedValue({});
    
    MockLore.prototype.save = jest.fn().mockResolvedValue({});
    MockLore.find = jest.fn().mockResolvedValue([]);
    MockLore.findOne = jest.fn().mockResolvedValue(null);
  });

  describe('AI-Generated Lore Creation During Mission Deployment', () => {
    const mockDeploymentParams = {
      agentId: 'test-agent',
      missionId: 'training_001',
      proxim8Id: 'proxim8-1',
      approach: 'medium' as const
    };

    const mockAgent = {
      walletAddress: 'test-agent',
      proxim8s: [{
        nftId: 'proxim8-1',
        name: 'Proxim8 Alpha',
        personality: 'analytical',
        isDeployed: false,
        traits: [
          { trait_type: 'Combat Systems', value: 'Advanced' },
          { trait_type: 'Stealth Technology', value: 'Expert' }
        ]
      }],
      lastMissionDeployedAt: null,
      dailyMissionCount: 0,
      save: jest.fn().mockResolvedValue(true)
    };

    const mockMissionTemplate = TRAINING_MISSIONS[0];

    beforeEach(() => {
      MockAgent.findOne.mockResolvedValue(mockAgent as any);
    });

    it('should generate and save mission report lore', async () => {
      // Mock AI generation service to return lore entries
      const mockGeneratedContent = {
        phaseOutcomes: [
          { phaseId: 1, success: true, narrative: 'Phase 1 completed successfully' },
          { phaseId: 2, success: true, narrative: 'Phase 2 completed successfully' },
          { phaseId: 3, success: false, narrative: 'Phase 3 encountered complications' },
          { phaseId: 4, success: true, narrative: 'Phase 4 completed successfully' },
          { phaseId: 5, success: true, narrative: 'Phase 5 completed successfully' }
        ],
        result: {
          overallSuccess: true,
          finalNarrative: 'Mission completed successfully',
          timelineShift: 5,
          generatedLoreEntries: [
            {
              type: 'mission_report',
              title: 'Mission Report: Corporate Data Extraction',
              content: 'The Proxim8 agent successfully infiltrated the Neo-Tokyo corporate facility. Using advanced stealth protocols, the agent bypassed multiple security layers and extracted critical intelligence regarding Oneirocom\'s timeline manipulation operations.',
              metadata: {
                generatedAt: new Date(),
                probability: 1.0,
                context: {
                  overallSuccess: true,
                  timelinePeriod: '2067 Corporate Wars'
                }
              },
              tags: ['training', 'mission', 'corporate', 'infiltration'],
              significance: 'Successful training mission demonstrating agent capabilities'
            }
          ],
          rewards: {
            timelinePoints: 150,
            experience: 75,
            loreFragments: [],
            achievements: ['training_mission_success']
          }
        },
        missionContext: {
          loreFragments: ['existing-lore-1'],
          proxim8Background: 'Proxim8 Alpha is an analytical agent...',
          missionHistory: [],
          timelinePeriod: '2067 Corporate Wars'
        }
      };

      MockTrainingMissionGenerationService.generateMissionInstance.mockResolvedValue(mockGeneratedContent as any);

      // Mock deployment creation and saving
      const mockDeployment = {
        deploymentId: 'deploy_123',
        save: jest.fn().mockResolvedValue(true)
      };
      MockTrainingMissionDeployment.mockImplementation(function(this: any, data: any) {
        Object.assign(this, data, mockDeployment);
        return this;
      } as any);

      // Mock Lore constructor and save to track what gets saved
      const savedLoreEntries: any[] = [];
      const mockSave = jest.fn().mockImplementation(function(this: any) {
        savedLoreEntries.push(this);
        return Promise.resolve(this);
      });
      
      // Mock the constructor to capture instance data and mock save method
      MockLore.mockImplementation(function(this: any, data: any) {
        Object.assign(this, data);
        this.save = mockSave;
        return this;
      } as any);
      
      MockLore.prototype.save = mockSave;

      // Execute the deployment (simulating training controller logic)
      await simulateTrainingMissionDeployment(mockDeploymentParams, mockMissionTemplate, mockGeneratedContent);

      // Verify that lore was saved with correct structure
      expect(MockLore.prototype.save).toHaveBeenCalled();
      expect(savedLoreEntries).toHaveLength(1);

      const savedLore = savedLoreEntries[0];
      expect(savedLore.nftId).toBe('proxim8-1');
      expect(savedLore.title).toBe('Mission Report: Corporate Data Extraction');
      expect(savedLore.sourceType).toBe('mission');
      expect(savedLore.loreType).toBe('mission_report');
      expect(savedLore.rarity).toBe('common');
      expect(savedLore.aiGenerated).toBe(true);
      expect(savedLore.generationMetadata.model).toBe('gemini-2.5-pro-preview-05-06');
      expect(savedLore.tags).toContain('training');
      expect(savedLore.claimed).toBe(false);
      expect(savedLore.unlockRequirements.missionSuccess).toBe(true);
      expect(savedLore.deploymentId).toBe('deploy_123');
    });

    it('should generate multiple lore types when available', async () => {
      const mockGeneratedContent = {
        phaseOutcomes: [
          { phaseId: 1, success: true },
          { phaseId: 2, success: true },
          { phaseId: 3, success: true },
          { phaseId: 4, success: true },
          { phaseId: 5, success: true }
        ],
        result: {
          overallSuccess: true,
          finalNarrative: 'Perfect mission execution',
          timelineShift: 8,
          generatedLoreEntries: [
            {
              type: 'mission_report',
              title: 'Mission Report: Flawless Execution',
              content: 'All phases completed without complications...',
              metadata: { generatedAt: new Date(), probability: 1.0 },
              tags: ['training', 'mission', 'flawless'],
              significance: 'Perfect execution demonstrates advanced capabilities'
            },
            {
              type: 'character_evolution',
              title: 'Character Evolution: Enhanced Stealth Protocols',
              content: 'The agent has developed enhanced stealth capabilities...',
              metadata: { generatedAt: new Date(), probability: 0.3 },
              tags: ['training', 'character', 'stealth'],
              significance: 'Agent evolution through mission experience'
            }
          ],
          rewards: {
            timelinePoints: 200,
            experience: 100,
            loreFragments: [],
            achievements: ['flawless_victory']
          }
        },
        missionContext: {
          loreFragments: [],
          proxim8Background: 'Proxim8 Alpha...',
          missionHistory: [],
          timelinePeriod: '2067 Corporate Wars'
        }
      };

      MockTrainingMissionGenerationService.generateMissionInstance.mockResolvedValue(mockGeneratedContent as any);

      const mockDeployment = {
        deploymentId: 'deploy_456',
        save: jest.fn().mockResolvedValue(true)
      };
      MockTrainingMissionDeployment.mockImplementation(function(this: any, data: any) {
        Object.assign(this, data, mockDeployment);
        return this;
      } as any);

      const savedLoreEntries: any[] = [];
      const mockSave = jest.fn().mockImplementation(function(this: any) {
        savedLoreEntries.push(this);
        return Promise.resolve(this);
      });
      
      MockLore.mockImplementation(function(this: any, data: any) {
        Object.assign(this, data);
        this.save = mockSave;
        return this;
      } as any);

      await simulateTrainingMissionDeployment(mockDeploymentParams, mockMissionTemplate, mockGeneratedContent);

      expect(savedLoreEntries).toHaveLength(2);
      
      const missionReport = savedLoreEntries.find(l => l.loreType === 'mission_report');
      const characterEvolution = savedLoreEntries.find(l => l.loreType === 'character_evolution');

      expect(missionReport).toBeDefined();
      expect(missionReport.rarity).toBe('common');
      expect(missionReport.title).toBe('Mission Report: Flawless Execution');

      expect(characterEvolution).toBeDefined();
      expect(characterEvolution.rarity).toBe('uncommon');
      expect(characterEvolution.title).toBe('Character Evolution: Enhanced Stealth Protocols');
    });

    it('should handle AI generation failure gracefully', async () => {
      // Mock AI service to throw an error
      MockTrainingMissionGenerationService.generateMissionInstance.mockRejectedValue(
        new Error('AI service unavailable')
      );

      const mockDeployment = {
        deploymentId: 'deploy_fallback',
        save: jest.fn().mockResolvedValue(true)
      };
      MockTrainingMissionDeployment.mockImplementation(function(this: any, data: any) {
        Object.assign(this, data, mockDeployment);
        return this;
      } as any);

      // Should still create deployment but with fallback content
      const result = await simulateTrainingMissionDeploymentWithFallback(mockDeploymentParams, mockMissionTemplate);

      expect(mockDeployment.save).toHaveBeenCalled();
      expect(MockLore.prototype.save).not.toHaveBeenCalled(); // No lore saved when using fallback
    });

    it('should set unlock time based on mission completion', async () => {
      const deployedAt = new Date();
      const duration = 300000; // 5 minutes
      const completesAt = new Date(deployedAt.getTime() + duration);

      const mockGeneratedContent = {
        phaseOutcomes: [{ phaseId: 1, success: true }],
        result: {
          overallSuccess: true,
          finalNarrative: 'Mission completed',
          timelineShift: 3,
          generatedLoreEntries: [
            {
              type: 'mission_report',
              title: 'Timed Mission Report',
              content: 'Mission content...',
              metadata: { generatedAt: new Date(), probability: 1.0 },
              tags: ['training'],
              significance: 'Test significance'
            }
          ],
          rewards: { timelinePoints: 100, experience: 50, loreFragments: [], achievements: [] }
        },
        missionContext: {
          loreFragments: [],
          proxim8Background: 'Test background',
          missionHistory: [],
          timelinePeriod: 'Test period'
        }
      };

      MockTrainingMissionGenerationService.generateMissionInstance.mockResolvedValue(mockGeneratedContent as any);

      const mockDeployment = {
        deploymentId: 'deploy_timed',
        save: jest.fn().mockResolvedValue(true)
      };
      MockTrainingMissionDeployment.mockImplementation(function(this: any, data: any) {
        Object.assign(this, data, mockDeployment);
        return this;
      } as any);

      const savedLoreEntries: any[] = [];
      const mockSave = jest.fn().mockImplementation(function(this: any) {
        savedLoreEntries.push(this);
        return Promise.resolve(this);
      });
      
      MockLore.mockImplementation(function(this: any, data: any) {
        Object.assign(this, data);
        this.save = mockSave;
        return this;
      } as any);

      await simulateTrainingMissionDeployment(
        mockDeploymentParams, 
        mockMissionTemplate, 
        mockGeneratedContent, 
        { deployedAt, duration }
      );

      expect(savedLoreEntries).toHaveLength(1);
      const savedLore = savedLoreEntries[0];
      
      // Check that unlock time is set to mission completion time
      expect(savedLore.unlockRequirements.completedAt).toEqual(completesAt);
    });
  });

  describe('Lore Query Integration', () => {
    it('should find mission lore by deployment ID', async () => {
      const mockLoreEntries = [
        {
          nftId: 'proxim8-1',
          deploymentId: 'deploy_123',
          sourceType: 'mission',
          loreType: 'mission_report',
          claimed: false
        }
      ];

      MockLore.find.mockResolvedValue(mockLoreEntries as any);

      const result = await MockLore.find({ deploymentId: 'deploy_123' });

      expect(MockLore.find).toHaveBeenCalledWith({ deploymentId: 'deploy_123' });
      expect(result).toHaveLength(1);
      expect(result[0].sourceType).toBe('mission');
    });

    it('should find claimable mission lore by completion time', async () => {
      const now = new Date();
      const completedLore = [
        {
          nftId: 'proxim8-1',
          sourceType: 'mission',
          claimed: false,
          unlockRequirements: {
            completedAt: new Date(now.getTime() - 60000) // Completed 1 minute ago
          }
        }
      ];

      MockLore.find.mockResolvedValue(completedLore as any);

      const result = await MockLore.find({
        nftId: 'proxim8-1',
        sourceType: 'mission',
        claimed: false,
        'unlockRequirements.completedAt': { $lte: now }
      });

      expect(result).toHaveLength(1);
      expect(result[0].unlockRequirements.completedAt.getTime()).toBeLessThan(now.getTime());
    });
  });
});

// Helper function to simulate training mission deployment logic
async function simulateTrainingMissionDeployment(
  params: any, 
  template: any, 
  generatedContent: any,
  timing?: { deployedAt: Date, duration: number }
) {
  const { agentId, missionId, proxim8Id, approach } = params;
  const deployedAt = timing?.deployedAt || new Date();
  const duration = timing?.duration || 300000;
  const completesAt = new Date(deployedAt.getTime() + duration);

  // Create deployment
  const deployment = new MockTrainingMissionDeployment({
    missionId,
    agentId,
    proxim8Id,
    approach,
    deployedAt,
    completesAt,
    duration,
    status: 'active',
    phaseOutcomes: generatedContent.phaseOutcomes,
    result: generatedContent.result
  } as any);

  await deployment.save();

  // Save lore entries if they exist
  const result = generatedContent.result;
  const hasGeneratedLore = result && 
    'generatedLoreEntries' in result && 
    Array.isArray((result as any).generatedLoreEntries) &&
    (result as any).generatedLoreEntries.length > 0;
    
  if (hasGeneratedLore) {
    const loreEntries = (result as any).generatedLoreEntries;
    
    for (const entry of loreEntries) {
      const loreEntry = new MockLore({
        nftId: proxim8Id,
        title: entry.title,
        content: entry.content,
        background: `Generated during mission: ${template.title}`,
        traits: {
          missionId,
          approach: approach,
          success: result.overallSuccess,
          deployedAt: deployedAt.toISOString()
        },
        sourceType: 'mission',
        sourceMissionId: missionId,
        deploymentId: (deployment as any).deploymentId,
        loreType: entry.type,
        rarity: entry.type === 'mission_report' ? 'common' : 'uncommon',
        tags: entry.tags || ['training', 'mission', missionId],
        unlockRequirements: {
          missionSuccess: result.overallSuccess,
          completedAt: completesAt
        },
        aiGenerated: true,
        generationMetadata: {
          model: 'gemini-2.5-pro-preview-05-06',
          prompt: 'structured_mission_generation',
          generatedAt: new Date(),
          probability: entry.metadata?.probability || 1.0
        },
        claimed: false
      } as any);
      
      await loreEntry.save();
    }
  }

  return deployment;
}

// Helper function to simulate fallback deployment
async function simulateTrainingMissionDeploymentWithFallback(params: any, template: any) {
  const { agentId, missionId, proxim8Id, approach } = params;
  const deployedAt = new Date();
  const duration = 300000;
  const completesAt = new Date(deployedAt.getTime() + duration);

  // Fallback content when AI generation fails
  const fallbackContent = {
    phaseOutcomes: template.phases.map((phase: any, index: number) => ({
      phaseId: phase.id,
      success: Math.random() < 0.7,
      narrative: `Phase ${phase.id}: ${phase.name} - Generated narrative pending...`,
      completedAt: null
    })),
    result: {
      overallSuccess: Math.random() < 0.7,
      finalNarrative: `Mission ${template.title} completed with fallback generation.`,
      timelineShift: Math.floor(Math.random() * 10) + 1,
      rewards: {
        timelinePoints: 100,
        experience: 50,
        loreFragments: [],
        achievements: []
      }
    }
  };

  const deployment = new MockTrainingMissionDeployment({
    missionId,
    agentId,
    proxim8Id,
    approach,
    deployedAt,
    completesAt,
    duration,
    status: 'active',
    phaseOutcomes: fallbackContent.phaseOutcomes,
    result: fallbackContent.result
  } as any);

  await deployment.save();
  return deployment;
}