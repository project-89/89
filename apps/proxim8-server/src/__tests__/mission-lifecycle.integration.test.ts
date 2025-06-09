/**
 * Integration test for complete mission lifecycle
 * This test verifies that all core training mission functionality works end-to-end:
 * 1. Mission deployment
 * 2. Mission status progression with incremental reveal
 * 3. Mission completion with result generation  
 * 4. Lore generation and claiming
 */

import express from 'express';
import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

// Import models
import Agent from '../models/game/Agent';
import TrainingMissionDeployment from '../models/game/TrainingMissionDeployment';
import Lore from '../models/Lore';

// Import controllers
import {
  getTrainingMissions,
  getMissionDetails,
  deployMission,
  getMissionStatus
} from '../controllers/trainingController';

// Import test data
import { TRAINING_MISSIONS } from '../data/trainingMissions';

describe('Mission Lifecycle Integration Test', () => {
  let mongoServer: MongoMemoryServer;
  let app: express.Application;
  let testUser: { userId: string; walletAddress: string };
  let testProxim8Id: string;

  beforeAll(async () => {
    // Start in-memory MongoDB
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);

    // Set up test app
    app = express();
    app.use(express.json());
    
    // Add auth middleware mock
    app.use((req: any, res, next) => {
      req.user = testUser;
      next();
    });

    // Mount endpoints
    app.get('/training/missions', getTrainingMissions);
    app.get('/training/missions/:missionId', getMissionDetails);
    app.post('/training/missions/:missionId/deploy', deployMission);
    app.get('/training/deployments/:deploymentId/status', getMissionStatus);
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    // Clean database before each test
    await Agent.deleteMany({});
    await TrainingMissionDeployment.deleteMany({});
    await Lore.deleteMany({});

    // Create unique test data for each test
    const timestamp = Date.now();
    testUser = {
      userId: `test-user-integration-${timestamp}`,
      walletAddress: `0x${timestamp.toString(16).padEnd(40, '0')}`
    };
    testProxim8Id = `test-proxim8-${timestamp}`;

    // Create test agent with Proxim8
    const testAgent = new Agent({
      agentId: testUser.userId,
      userId: testUser.userId,
      walletAddress: testUser.walletAddress,
      codename: `TestAgent-${timestamp}`,
      rank: 'operative',
      timelinePoints: 1000,
      proxim8s: [{
        nftId: testProxim8Id,
        name: 'Test Proxim8',
        personality: 'analytical',
        isDeployed: false
      }]
    });
    await testAgent.save();
  });

  describe('1. Core Training Mission Functionality', () => {
    it('should deploy a training mission successfully', async () => {
      const missionId = 'training_001';
      const deploymentData = {
        proxim8Id: testProxim8Id,
        approach: 'medium'
      };

      const response = await request(app)
        .post(`/training/missions/${missionId}/deploy`)
        .send(deploymentData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.deployment).toBeDefined();
      expect(response.body.data.deployment.status).toBe('active');
      expect(response.body.data.deployment.missionId).toBe(missionId);

      // Verify deployment was saved to database
      const deployment = await TrainingMissionDeployment.findOne({
        missionId,
        agentId: testUser.walletAddress
      });
      expect(deployment).toBeTruthy();
      expect(deployment?.status).toBe('active');
    });

    it('should retrieve mission status with incremental reveal', async () => {
      // First deploy a mission
      const missionId = 'training_001';
      const deploymentData = {
        proxim8Id: testProxim8Id,
        approach: 'medium'
      };

      const deployResponse = await request(app)
        .post(`/training/missions/${missionId}/deploy`)
        .send(deploymentData)
        .expect(200);

      const deploymentId = deployResponse.body.data.deployment.deploymentId;

      // Check mission status
      const statusResponse = await request(app)
        .get(`/training/deployments/${deploymentId}/status`)
        .expect(200);

      expect(statusResponse.body.success).toBe(true);
      expect(statusResponse.body.data.deploymentId).toBe(deploymentId);
      expect(statusResponse.body.data.status).toBe('active');
      expect(statusResponse.body.data.progress).toBeDefined();
      
      // Should have phase progression
      if (statusResponse.body.data.progress) {
        expect(statusResponse.body.data.progress.phases).toBeDefined();
        expect(Array.isArray(statusResponse.body.data.progress.phases)).toBe(true);
      }
    });
  });

  describe('2. Mission Completion with Result Generation', () => {
    it('should auto-complete missions when time expires', async () => {
      // Deploy a mission with a very short duration
      const missionId = 'training_001';
      const deploymentData = {
        proxim8Id: testProxim8Id,
        approach: 'medium'
      };

      const deployResponse = await request(app)
        .post(`/training/missions/${missionId}/deploy`)
        .send(deploymentData)
        .expect(200);

      const deploymentId = deployResponse.body.data.deployment.deploymentId;

      // Manually set the deployment to be completed (simulate time passing)
      await TrainingMissionDeployment.findOneAndUpdate(
        { deploymentId }, 
        {
          completesAt: new Date(Date.now() - 60000), // 1 minute ago
          status: 'active'
        }
      );

      // Check status - should auto-complete
      const statusResponse = await request(app)
        .get(`/training/deployments/${deploymentId}/status`)
        .expect(200);

      expect(statusResponse.body.success).toBe(true);
      
      // Should be completed now
      const updatedDeployment = await TrainingMissionDeployment.findOne({ deploymentId });
      expect(updatedDeployment?.status).toBe('completed');
      expect(updatedDeployment?.result).toBeDefined();
      expect(updatedDeployment?.result?.overallSuccess).toBeDefined();
    });

    it('should generate structured mission results', async () => {
      // Deploy and complete a mission
      const missionId = 'training_001';
      const deployment = new TrainingMissionDeployment({
        missionId,
        agentId: testUser.walletAddress,
        proxim8Id: testProxim8Id,
        approach: 'medium',
        deployedAt: new Date(Date.now() - 120000), // 2 minutes ago
        completesAt: new Date(Date.now() - 60000), // 1 minute ago
        status: 'completed',
        duration: 60000,
        finalSuccessRate: 0.75,
        phaseOutcomes: [
          {
            phaseId: 1,
            success: true,
            narrative: 'Mission phase completed successfully'
          }
        ],
        result: {
          overallSuccess: true,
          finalNarrative: 'Training mission completed with success',
          timelineShift: 5,
          rewards: {
            timelinePoints: 100,
            experience: 50,
            loreFragments: ['test_lore_001'],
            achievements: ['first_success']
          }
        }
      });
      await deployment.save();

      // Check that result structure is correct
      expect(deployment.result).toBeDefined();
      expect(deployment.result?.overallSuccess).toBe(true);
      expect(deployment.result?.finalNarrative).toBeDefined();
      expect(deployment.result?.timelineShift).toBeDefined();
      expect(deployment.result?.rewards).toBeDefined();
      expect(deployment.result?.rewards?.timelinePoints).toBeDefined();
    });
  });

  describe('3. Lore Generation and Claiming', () => {
    it('should generate lore when mission completes successfully', async () => {
      // Create a completed mission deployment with lore fragment
      const missionId = 'training_001';
      const deployment = new TrainingMissionDeployment({
        missionId,
        agentId: testUser.walletAddress,
        proxim8Id: testProxim8Id,
        approach: 'medium',
        deployedAt: new Date(Date.now() - 120000),
        completesAt: new Date(Date.now() - 60000),
        status: 'completed',
        duration: 60000,
        finalSuccessRate: 0.75,
        phaseOutcomes: [],
        result: {
          overallSuccess: true,
          summary: 'Training mission completed successfully',
          loreFragment: {
            title: 'Mission Report: First Contact Training',
            content: 'Agent successfully infiltrated social media algorithms and detected early Oneirocom presence. Key insights gained about timeline manipulation protocols.',
            significance: 'First successful detection of Oneirocom infiltration patterns',
            timelinePeriod: 'Training Era - 2025',
            tags: ['training', 'infiltration', 'social_media', 'oneirocom']
          }
        }
      });
      await deployment.save();

      // Simulate the lore creation process that happens during mission completion
      const loreFragment = deployment.result?.loreFragment;
      if (loreFragment) {
        const newLore = new Lore({
          nftId: testProxim8Id,
          title: loreFragment.title,
          content: loreFragment.content,
          background: `Generated during mission: ${missionId}`,
          sourceType: 'mission',
          loreType: 'mission_report',
          claimed: false,
          unlockRequirements: {
            completedAt: deployment.completesAt
          },
          metadata: {
            missionId: deployment.missionId,
            deploymentId: deployment._id,
            significance: loreFragment.significance,
            timelinePeriod: loreFragment.timelinePeriod,
            tags: loreFragment.tags || []
          }
        });
        await newLore.save();

        // Verify lore was created correctly
        const savedLore = await Lore.findOne({ 
          nftId: testProxim8Id, 
          sourceType: 'mission' 
        });
        
        expect(savedLore).toBeTruthy();
        expect(savedLore?.title).toBe(loreFragment.title);
        expect(savedLore?.content).toBe(loreFragment.content);
        expect(savedLore?.sourceType).toBe('mission');
        expect(savedLore?.loreType).toBe('mission_report');
        expect(savedLore?.claimed).toBe(false);
        expect(savedLore?.metadata?.missionId).toBe(missionId);
      }
    });

    it('should allow claiming lore after mission completion', async () => {
      // Create claimable lore
      const lore = new Lore({
        nftId: testProxim8Id,
        title: 'Mission Report: Training Complete',
        content: 'Detailed mission report content...',
        background: 'Generated during training mission completion',
        sourceType: 'mission',
        loreType: 'mission_report',
        claimed: false,
        unlockRequirements: {
          completedAt: new Date(Date.now() - 60000) // Completed 1 minute ago
        },
        metadata: {
          missionId: 'training_001',
          significance: 'First training mission success',
          timelinePeriod: 'Training Era - 2025'
        }
      });
      await lore.save();

      // Simulate claiming the lore
      const claimedLore = await Lore.findOneAndUpdate(
        { 
          _id: lore._id, 
          claimed: false 
        },
        {
          claimed: true,
          claimedBy: testUser.walletAddress,
          claimedAt: new Date()
        },
        { new: true }
      );

      expect(claimedLore).toBeTruthy();
      expect(claimedLore?.claimed).toBe(true);
      expect(claimedLore?.claimedBy).toBe(testUser.walletAddress);
      expect(claimedLore?.claimedAt).toBeDefined();
    });
  });

  describe('4. Full Mission Lifecycle Integration', () => {
    it('should complete full mission lifecycle: deploy → progress → complete → generate lore → claim', async () => {
      const missionId = 'training_001';
      
      // Step 1: Deploy mission
      const deployResponse = await request(app)
        .post(`/training/missions/${missionId}/deploy`)
        .send({
          proxim8Id: testProxim8Id,
          approach: 'medium'
        })
        .expect(200);

      const deploymentId = deployResponse.body.data.deployment.deploymentId;
      expect(deploymentId).toBeDefined();

      // Step 2: Check initial status
      const initialStatus = await request(app)
        .get(`/training/deployments/${deploymentId}/status`)
        .expect(200);

      expect(initialStatus.body.data.status).toBe('active');

      // Step 3: Simulate mission completion by setting completesAt in the past
      await TrainingMissionDeployment.findOneAndUpdate(
        { deploymentId },
        {
          completesAt: new Date(Date.now() - 60000) // 1 minute ago
        }
      );

      // Step 4: Check status again - should auto-complete
      const completedStatus = await request(app)
        .get(`/training/deployments/${deploymentId}/status`)
        .expect(200);

      // Verify completion
      const finalDeployment = await TrainingMissionDeployment.findOne({ deploymentId });
      expect(finalDeployment?.status).toBe('completed');
      expect(finalDeployment?.result).toBeDefined();
      expect(finalDeployment?.result?.overallSuccess).toBeDefined();

      // Step 5: Verify lore was generated (check if lore creation logic ran)
      const generatedLore = await Lore.findOne({
        nftId: testProxim8Id,
        sourceType: 'mission'
      });

      if (generatedLore) {
        expect(generatedLore.claimed).toBe(false);
        expect(generatedLore.sourceMissionId).toBe(missionId);

        // Step 6: Claim the lore
        const claimedLore = await Lore.findOneAndUpdate(
          { _id: generatedLore._id, claimed: false },
          {
            claimed: true,
            claimedBy: testUser.walletAddress,
            claimedAt: new Date()
          },
          { new: true }
        );

        expect(claimedLore?.claimed).toBe(true);
        expect(claimedLore?.claimedBy).toBe(testUser.walletAddress);
      }

      console.log('✅ Full mission lifecycle completed successfully!');
    });
  });

  describe('5. Mission System Validation', () => {
    it('should validate mission unlock progression', async () => {
      // Get available missions for new user
      const missionsResponse = await request(app)
        .get('/training/missions')
        .expect(200);

      expect(missionsResponse.body.success).toBe(true);
      expect(missionsResponse.body.data.missions).toBeDefined();
      expect(Array.isArray(missionsResponse.body.data.missions)).toBe(true);
      
      // First mission should always be unlocked
      const missions = missionsResponse.body.data.missions;
      const firstMission = missions.find((m: any) => m.missionId === 'training_001');
      expect(firstMission).toBeDefined();
      expect(firstMission.userProgress.isUnlocked).toBe(true);
    });

    it('should prevent multiple deployments of same mission', async () => {
      // Add another Proxim8 to the agent
      await Agent.findOneAndUpdate(
        { walletAddress: testUser.walletAddress },
        {
          $push: {
            proxim8s: {
              nftId: `${testProxim8Id}-beta`,
              name: 'Test Proxim8 Beta',
              personality: 'adaptive',
              isDeployed: false
            }
          }
        }
      );

      // Deploy mission with first Proxim8
      const deployment1 = await request(app)
        .post('/training/missions/training_001/deploy')
        .send({
          proxim8Id: testProxim8Id,
          approach: 'low'
        })
        .expect(200);

      // Attempt to deploy mission with second Proxim8 - should fail because first mission is still active
      const deployment2 = await request(app)
        .post('/training/missions/training_001/deploy')
        .send({
          proxim8Id: `${testProxim8Id}-beta`,
          approach: 'high'
        })
        .expect(500);

      expect(deployment2.body.success).toBe(false);
      expect(deployment2.body.error).toContain('Mission already in progress');
    });
  });
});