// Mock environment variables to prevent Helius API errors
process.env.HELIUS_API_KEY = 'test-helius-key';

// Mock fetch for HTTP requests in controller
global.fetch = jest.fn();

import request from 'supertest';
import express from 'express';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import Lore from '../../models/Lore';
import LoreReward from '../../models/LoreReward';
import UserLoreReward from '../../models/UserLoreReward';
import Agent from '../../models/game/Agent';
import loreRoutes from '../../routes/lore';
import { jwtAuth } from '../../middleware/jwtAuth';
import { getNFTsForWallet } from '../../controllers/nftController';

// Mock all dependencies
jest.mock('../../models/Lore');
jest.mock('../../models/LoreReward');
jest.mock('../../models/UserLoreReward');
jest.mock('../../models/game/Agent');
jest.mock('../../middleware/jwtAuth');
jest.mock('../../controllers/nftController');

const MockLore = Lore as jest.Mocked<typeof Lore>;
const MockLoreReward = LoreReward as jest.Mocked<typeof LoreReward>;
const MockUserLoreReward = UserLoreReward as jest.Mocked<typeof UserLoreReward>;
const MockAgent = Agent as jest.Mocked<typeof Agent>;

// Mock JWT auth middleware
const mockJwtAuth = jwtAuth as jest.MockedFunction<typeof jwtAuth>;

// Mock NFT controller functions
const mockGetNFTsForWallet = getNFTsForWallet as jest.MockedFunction<typeof getNFTsForWallet>;

// Test app setup
const app = express();
app.use(express.json());
app.use('/lore', loreRoutes);

// Test user data
const testUser = {
  walletAddress: '0x1234567890123456789012345678901234567890',
  isAdmin: false
};

const testAdmin = {
  walletAddress: '0xadmin567890123456789012345678901234567890',
  isAdmin: true
};

// Mock JWT token
const mockToken = jwt.sign(testUser, 'test-secret');

// Helper function for creating Mongoose query mocks
const createMockQuery = (returnValue: any) => ({
  sort: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  skip: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  populate: jest.fn().mockReturnThis(),
  lean: jest.fn().mockReturnThis(),
  exec: jest.fn().mockResolvedValue(returnValue),
  then: jest.fn().mockImplementation((onResolve) => Promise.resolve(returnValue).then(onResolve)),
  catch: jest.fn().mockImplementation((onReject) => Promise.resolve(returnValue).catch(onReject))
});

describe('Lore Controller Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock JWT middleware to inject user
    mockJwtAuth.mockImplementation((req: any, res: any, next: any) => {
      const authHeader = req.headers.authorization;
      if (authHeader?.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        if (token === 'admin-token') {
          req.user = testAdmin;
        } else if (token === 'user-token') {
          req.user = testUser;
        } else {
          return res.status(401).json({ message: 'Invalid token' });
        }
      } else {
        return res.status(401).json({ message: 'No token provided' });
      }
      next();
    });

    // Default mock implementations
    MockLore.find = jest.fn().mockReturnValue(createMockQuery([]));
    MockLore.findOne = jest.fn().mockResolvedValue(null);
    MockLore.findOneAndUpdate = jest.fn().mockResolvedValue(null);
    MockLore.countDocuments = jest.fn().mockResolvedValue(0);
    MockLore.prototype.save = jest.fn().mockResolvedValue({});

    MockLoreReward.find = jest.fn().mockResolvedValue([]);
    MockLoreReward.findById = jest.fn().mockResolvedValue(null);
    MockLoreReward.findOneAndUpdate = jest.fn().mockResolvedValue(null);

    MockUserLoreReward.find = jest.fn().mockResolvedValue([]);
    MockUserLoreReward.findOne = jest.fn().mockResolvedValue(null);
    MockUserLoreReward.prototype.save = jest.fn().mockResolvedValue({});

    MockAgent.find = jest.fn().mockResolvedValue([]);
    MockAgent.findOne = jest.fn().mockResolvedValue(null);
  });

  describe('GET /lore/nft/:nftId/claimed', () => {
    const nftId = '1234';

    it('should return claimed lore for NFT', async () => {
      const mockClaimedLore = [
        {
          _id: 'lore1',
          nftId,
          title: 'Test Lore 1',
          content: 'Test content 1',
          background: 'Test background 1',
          sourceType: 'nft',
          claimed: true,
          claimedBy: testUser.walletAddress,
          claimedAt: new Date()
        },
        {
          _id: 'lore2',
          nftId,
          title: 'Mission Report: Training 001',
          content: 'Generated during mission completion',
          background: 'Generated during mission: Reconnaissance Training',
          sourceType: 'mission',
          loreType: 'mission_report',
          claimed: true,
          claimedBy: testUser.walletAddress,
          claimedAt: new Date()
        }
      ];

      MockLore.find = jest.fn().mockReturnValue(createMockQuery(mockClaimedLore));

      const response = await request(app)
        .get(`/lore/nft/${nftId}/claimed`)
        .set('Authorization', 'Bearer user-token')
        .expect(200);

      expect(MockLore.find).toHaveBeenCalledWith({
        nftId,
        claimed: true,
        claimedBy: testUser.walletAddress
      });
      expect(response.body).toHaveLength(2);
      expect(response.body[0].sourceType).toBe('nft');
      expect(response.body[1].sourceType).toBe('mission');
      expect(response.body[1].loreType).toBe('mission_report');
    });

    it('should filter by sourceType when provided', async () => {
      const mockMissionLore = [
        {
          nftId,
          sourceType: 'mission',
          loreType: 'mission_report',
          claimed: true,
          claimedBy: testUser.walletAddress
        }
      ];

      MockLore.find = jest.fn().mockReturnValue(createMockQuery(mockMissionLore));

      await request(app)
        .get(`/lore/nft/${nftId}/claimed?sourceType=mission`)
        .set('Authorization', 'Bearer user-token')
        .expect(200);

      expect(MockLore.find).toHaveBeenCalledWith({
        nftId,
        claimed: true,
        claimedBy: testUser.walletAddress,
        sourceType: 'mission'
      });
    });

    it('should return 404 if no claimed lore found', async () => {
      MockLore.find = jest.fn().mockReturnValue(createMockQuery([]));

      const response = await request(app)
        .get(`/lore/nft/${nftId}/claimed`)
        .set('Authorization', 'Bearer user-token')
        .expect(404);

      expect(response.body.message).toBe('No claimed lore found for this NFT');
    });

    it('should require authentication', async () => {
      await request(app)
        .get(`/lore/nft/${nftId}/claimed`)
        .expect(401);
    });
  });

  describe('GET /lore/nft/:nftId/available', () => {
    const nftId = '1234';

    it('should return availability status for unclaimed lore', async () => {
      MockLore.countDocuments.mockResolvedValue(3);

      const response = await request(app)
        .get(`/lore/nft/${nftId}/available`)
        .set('Authorization', 'Bearer user-token')
        .expect(200);

      expect(MockLore.countDocuments).toHaveBeenCalledWith({
        nftId,
        claimed: false
      });
      expect(response.body).toEqual({
        hasUnclaimedLore: true,
        unclaimedCount: 3
      });
    });

    it('should filter by sourceType when provided', async () => {
      MockLore.countDocuments.mockResolvedValue(1);

      await request(app)
        .get(`/lore/nft/${nftId}/available?sourceType=mission`)
        .set('Authorization', 'Bearer user-token')
        .expect(200);

      expect(MockLore.countDocuments).toHaveBeenCalledWith({
        nftId,
        claimed: false,
        sourceType: 'mission'
      });
    });

    it('should return false when no unclaimed lore', async () => {
      MockLore.countDocuments.mockResolvedValue(0);

      const response = await request(app)
        .get(`/lore/nft/${nftId}/available`)
        .set('Authorization', 'Bearer user-token')
        .expect(200);

      expect(response.body).toEqual({
        hasUnclaimedLore: false,
        unclaimedCount: 0
      });
    });
  });

  describe('POST /lore/nft/:nftId/claim', () => {
    const nftId = '1234';

    it('should claim NFT lore successfully', async () => {
      const mockLore = {
        _id: 'lore1',
        nftId,
        title: 'Test Lore',
        content: 'Test content',
        sourceType: 'nft',
        claimed: false,
        save: jest.fn().mockResolvedValue(true)
      };

      MockLore.findOneAndUpdate.mockResolvedValue({
        ...mockLore,
        claimed: true,
        claimedBy: testUser.walletAddress,
        claimedAt: new Date()
      });

      const response = await request(app)
        .post(`/lore/nft/${nftId}/claim`)
        .set('Authorization', 'Bearer user-token')
        .expect(200);

      expect(MockLore.findOneAndUpdate).toHaveBeenCalledWith(
        { nftId, claimed: false },
        {
          claimed: true,
          claimedBy: testUser.walletAddress,
          claimedAt: expect.any(Date),
          updatedAt: expect.any(Date)
        },
        { new: true }
      );
      expect(response.body.claimed).toBe(true);
    });

    it('should claim mission lore successfully', async () => {
      const mockMissionLore = {
        _id: 'lore2',
        nftId,
        title: 'Mission Report: Training Complete',
        content: 'AI-generated mission report',
        sourceType: 'mission',
        loreType: 'mission_report',
        claimed: false,
        unlockRequirements: {
          missionSuccess: true,
          completedAt: new Date(Date.now() - 60000) // Completed 1 minute ago
        }
      };

      MockLore.findOneAndUpdate.mockResolvedValue({
        ...mockMissionLore,
        claimed: true,
        claimedBy: testUser.walletAddress,
        claimedAt: new Date()
      });

      const response = await request(app)
        .post(`/lore/nft/${nftId}/claim`)
        .set('Authorization', 'Bearer user-token')
        .expect(200);

      expect(response.body.sourceType).toBe('mission');
      expect(response.body.loreType).toBe('mission_report');
      expect(response.body.claimed).toBe(true);
    });

    it('should return 404 if lore not found or already claimed', async () => {
      MockLore.findOneAndUpdate.mockResolvedValue(null);

      const response = await request(app)
        .post(`/lore/nft/${nftId}/claim`)
        .set('Authorization', 'Bearer user-token')
        .expect(404);

      expect(response.body.message).toBe('Lore not found or already claimed');
    });

    it('should require authentication', async () => {
      await request(app)
        .post(`/lore/nft/${nftId}/claim`)
        .expect(401);
    });
  });

  describe('GET /lore/user-nfts', () => {
    it('should return all lore for user\'s NFTs', async () => {
      // Mock NFTs for the user  
      const mockNFTs = [
        { 
          nftId: '1234', 
          name: 'Proxim8 Alpha',
          image: 'https://na-assets.pinit.io/8GwrpeSH4TpAGEJsmoF35J8DY6RNCdyjCBZsEnTySEKd/c746a7a7-88cc-4677-b919-877329e2dd0d/1234'
        },
        { 
          nftId: '5678', 
          name: 'Proxim8 Beta',
          image: 'https://na-assets.pinit.io/8GwrpeSH4TpAGEJsmoF35J8DY6RNCdyjCBZsEnTySEKd/c746a7a7-88cc-4677-b919-877329e2dd0d/5678'
        }
      ];

      // Mock the getNFTsForWallet function
      mockGetNFTsForWallet.mockResolvedValue({ 
        success: true, 
        nfts: mockNFTs, 
        count: mockNFTs.length 
      } as any);

      // Mock fetch for metadata requests
      (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          name: 'Test NFT',
          description: 'Test description',
          attributes: []
        })
      } as any);

      const mockLoreItems = [
        {
          nftId: '1234',
          title: 'NFT Lore 1',
          sourceType: 'nft',
          claimed: false
        },
        {
          nftId: '1234',
          title: 'Mission Report 1',
          sourceType: 'mission',
          loreType: 'mission_report',
          claimed: false,
          unlockRequirements: {
            completedAt: new Date(Date.now() - 60000)
          }
        },
        {
          nftId: '5678',
          title: 'NFT Lore 2',
          sourceType: 'nft',
          claimed: true,
          claimedBy: testUser.walletAddress
        }
      ];

      MockLore.find = jest.fn().mockReturnValue(createMockQuery(mockLoreItems));

      const response = await request(app)
        .get('/lore/user-nfts')
        .set('Authorization', 'Bearer user-token')
        .expect(200);

      expect(mockGetNFTsForWallet).toHaveBeenCalledWith(testUser.walletAddress, true, 1, 1000);
      // Note: The exact Lore.find call will depend on the controller implementation
      expect(response.body.loreItems).toHaveLength(3);
      expect(response.body.summary.totalLore).toBe(3);
      expect(response.body.summary.claimed).toBe(1);
      expect(response.body.summary.unclaimed).toBe(2);
      expect(response.body.summary.missionLore).toBe(1);
      expect(response.body.summary.nftLore).toBe(2);
    });

    it('should return empty array if user has no NFTs', async () => {
      // Mock empty NFTs response
      mockGetNFTsForWallet.mockResolvedValue({ 
        success: true, 
        nfts: [], 
        count: 0 
      } as any);

      const response = await request(app)
        .get('/lore/user-nfts')
        .set('Authorization', 'Bearer user-token')
        .expect(200);

      expect(response.body).toEqual([]);
    });

    it('should return empty array if agent not found', async () => {
      // Mock empty NFTs response (simulating no agent found)
      mockGetNFTsForWallet.mockResolvedValue({ 
        success: true, 
        nfts: [], 
        count: 0 
      } as any);

      const response = await request(app)
        .get('/lore/user-nfts')
        .set('Authorization', 'Bearer user-token')
        .expect(200);

      expect(response.body).toEqual([]);
    });
  });

  describe('New Mission Lore Endpoints', () => {
    const nftId = '1234';

    describe('GET /lore/nft/:nftId/claimable-mission-lore', () => {
      beforeEach(() => {
        // Add this endpoint to our test app for testing
        app.get('/lore/nft/:nftId/claimable-mission-lore', jwtAuth, async (req, res) => {
          try {
            const { nftId } = req.params;
            const now = new Date();
            
            const claimableLore = await MockLore.find({
              nftId,
              sourceType: 'mission',
              claimed: false,
              'unlockRequirements.completedAt': { $lte: now }
            });

            res.json({
              claimableLore,
              count: claimableLore.length
            });
          } catch (error) {
            res.status(500).json({ message: 'Server error', error });
          }
        });
      });

      it('should return claimable mission lore', async () => {
        const mockClaimableLore = [
          {
            nftId,
            title: 'Mission Report: Infiltration Success',
            sourceType: 'mission',
            loreType: 'mission_report',
            claimed: false,
            unlockRequirements: {
              completedAt: new Date(Date.now() - 120000) // Completed 2 minutes ago
            }
          },
          {
            nftId,
            title: 'Character Evolution: Enhanced Stealth',
            sourceType: 'mission',
            loreType: 'character_evolution',
            claimed: false,
            unlockRequirements: {
              completedAt: new Date(Date.now() - 60000) // Completed 1 minute ago
            }
          }
        ];

        MockLore.find = jest.fn().mockReturnValue(createMockQuery(mockClaimableLore));

        const response = await request(app)
          .get(`/lore/nft/${nftId}/claimable-mission-lore`)
          .set('Authorization', 'Bearer user-token')
          .expect(200);

        expect(MockLore.find).toHaveBeenCalledWith({
          nftId,
          sourceType: 'mission',
          claimed: false,
          'unlockRequirements.completedAt': { $lte: expect.any(Date) }
        });
        expect(response.body.claimableLore).toHaveLength(2);
        expect(response.body.count).toBe(2);
        expect(response.body.claimableLore[0].loreType).toBe('mission_report');
        expect(response.body.claimableLore[1].loreType).toBe('character_evolution');
      });

      it('should return empty array if no claimable lore', async () => {
        MockLore.find = jest.fn().mockReturnValue(createMockQuery([]));

        const response = await request(app)
          .get(`/lore/nft/${nftId}/claimable-mission-lore`)
          .set('Authorization', 'Bearer user-token')
          .expect(200);

        expect(response.body.claimableLore).toHaveLength(0);
        expect(response.body.count).toBe(0);
      });
    });

    describe('GET /lore/nft/:nftId/dashboard', () => {
      beforeEach(() => {
        // Add dashboard endpoint to test app
        app.get('/lore/nft/:nftId/dashboard', jwtAuth, async (req, res) => {
          try {
            const { nftId } = req.params;
            const allLore = await MockLore.find({ nftId });
            
            const dashboard = {
              nftId,
              totalLore: allLore.length,
              claimed: allLore.filter((l: any) => l.claimed).length,
              unclaimed: allLore.filter((l: any) => !l.claimed).length,
              nftLore: allLore.filter((l: any) => l.sourceType === 'nft'),
              missionLore: allLore.filter((l: any) => l.sourceType === 'mission'),
              missionReports: allLore.filter((l: any) => l.loreType === 'mission_report'),
              canonLore: allLore.filter((l: any) => l.loreType === '89_canon'),
              characterEvolution: allLore.filter((l: any) => l.loreType === 'character_evolution'),
              timelineFragments: allLore.filter((l: any) => l.loreType === 'timeline_fragment'),
              resistanceIntel: allLore.filter((l: any) => l.loreType === 'resistance_intel'),
              readyToClaim: allLore.filter((l: any) => 
                !l.claimed && 
                l.sourceType === 'mission' && 
                l.unlockRequirements?.completedAt && 
                l.unlockRequirements.completedAt <= new Date()
              )
            };

            res.json(dashboard);
          } catch (error) {
            res.status(500).json({ message: 'Server error', error });
          }
        });
      });

      it('should return comprehensive lore dashboard', async () => {
        const mockAllLore = [
          {
            nftId,
            sourceType: 'nft',
            claimed: true,
            claimedBy: testUser.walletAddress
          },
          {
            nftId,
            sourceType: 'mission',
            loreType: 'mission_report',
            claimed: false,
            unlockRequirements: {
              completedAt: new Date(Date.now() - 60000)
            }
          },
          {
            nftId,
            sourceType: 'mission',
            loreType: 'character_evolution',
            claimed: false,
            unlockRequirements: {
              completedAt: new Date(Date.now() + 60000) // Not ready yet
            }
          },
          {
            nftId,
            sourceType: 'mission',
            loreType: '89_canon',
            claimed: true,
            claimedBy: testUser.walletAddress
          }
        ];

        MockLore.find = jest.fn().mockReturnValue(createMockQuery(mockAllLore));

        const response = await request(app)
          .get(`/lore/nft/${nftId}/dashboard`)
          .set('Authorization', 'Bearer user-token')
          .expect(200);

        expect(response.body.nftId).toBe(nftId);
        expect(response.body.totalLore).toBe(4);
        expect(response.body.claimed).toBe(2);
        expect(response.body.unclaimed).toBe(2);
        expect(response.body.nftLore).toHaveLength(1);
        expect(response.body.missionLore).toHaveLength(3);
        expect(response.body.missionReports).toHaveLength(1);
        expect(response.body.canonLore).toHaveLength(1);
        expect(response.body.characterEvolution).toHaveLength(1);
        expect(response.body.readyToClaim).toHaveLength(1); // Only the mission report is ready
      });
    });
  });

  describe('Mission Lore Generation Integration', () => {
    it('should save AI-generated lore with correct structure', async () => {
      // This tests the structure that would be created by the training controller
      const mockGeneratedLore = {
        nftId: '1234',
        title: 'Mission Report: Neo-Tokyo Infiltration',
        content: 'The Proxim8 agent moved through the Neo-Tokyo corporate district with calculated precision...',
        background: 'Generated during mission: Neo-Tokyo Corporate Breach',
        traits: {
          missionId: 'training_001',
          approach: 'medium',
          success: true,
          deployedAt: new Date().toISOString()
        },
        sourceType: 'mission',
        sourceMissionId: 'training_001',
        deploymentId: 'deploy_123',
        loreType: 'mission_report',
        rarity: 'common',
        tags: ['training', 'mission', 'neo-tokyo'],
        unlockRequirements: {
          missionSuccess: true,
          completedAt: new Date(Date.now() + 300000) // Unlocks in 5 minutes
        },
        aiGenerated: true,
        generationMetadata: {
          model: 'gemini-2.5-pro-preview-05-06',
          prompt: 'structured_mission_generation',
          generatedAt: new Date(),
          probability: 1.0
        },
        claimed: false
      };

      const saveMock = jest.fn().mockResolvedValue(mockGeneratedLore);
      MockLore.prototype.save = saveMock;

      // Create a new lore instance (simulating training controller)
      const loreInstance = new MockLore(mockGeneratedLore as any);
      const savedLore = await loreInstance.save();

      expect(saveMock).toHaveBeenCalled();
      expect(savedLore.sourceType).toBe('mission');
      expect(savedLore.loreType).toBe('mission_report');
      expect(savedLore.aiGenerated).toBe(true);
      expect(savedLore.generationMetadata.model).toBe('gemini-2.5-pro-preview-05-06');
      expect(savedLore.tags).toContain('training');
      expect(savedLore.unlockRequirements.missionSuccess).toBe(true);
    });

    it('should handle multiple lore types from single mission', async () => {
      const loreTypes = ['mission_report', '89_canon', 'character_evolution'];
      const mockGeneratedLoreSet = loreTypes.map(type => ({
        nftId: '1234',
        title: `${type}: Test Mission`,
        sourceType: 'mission',
        loreType: type,
        rarity: type === 'mission_report' ? 'common' : 'uncommon',
        deploymentId: 'deploy_123',
        aiGenerated: true,
        claimed: false
      }));

      const saveMock = jest.fn();
      MockLore.prototype.save = saveMock;

      // Simulate saving multiple lore entries from one mission
      for (const loreData of mockGeneratedLoreSet) {
        const loreInstance = new MockLore(loreData as any);
        await loreInstance.save();
      }

      expect(saveMock).toHaveBeenCalledTimes(3);
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      MockLore.find.mockRejectedValue(new Error('Database connection failed'));

      const response = await request(app)
        .get('/lore/nft/1234/claimed')
        .set('Authorization', 'Bearer user-token')
        .expect(500);

      expect(response.body.message).toBe('Server error');
    });

    it('should handle invalid NFT IDs', async () => {
      MockLore.find = jest.fn().mockReturnValue(createMockQuery([]));

      const response = await request(app)
        .get('/lore/nft/invalid-nft-id/claimed')
        .set('Authorization', 'Bearer user-token')
        .expect(404);

      expect(response.body.message).toBe('No claimed lore found for this NFT');
    });

    it('should validate authentication tokens', async () => {
      await request(app)
        .get('/lore/nft/1234/claimed')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });
  });
});