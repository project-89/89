import { Request, Response } from "express";
import { TRAINING_MISSIONS } from "../data/trainingMissions";
import TrainingMissionDeployment from "../models/game/TrainingMissionDeployment";
import Agent from "../models/game/Agent";
import Lore from "../models/Lore";
import { MissionService } from "../services/game/missionService";
import { TrainingMissionGenerationService } from "../services/game/trainingMissionGenerationService";
import { v4 as uuidv4 } from "uuid";
import { getNFTsForWallet } from "./nftController";
import { transformMissionListForClient, transformRawMissionToTemplate } from "../utils/missionTransformers";
import type { MissionsApiResponse, MissionDetailsApiResponse } from "@proxim8/shared/types/mission";

export interface AuthenticatedRequest extends Request {
  user?: {
    walletAddress: string;
    isAdmin?: boolean;
  };
}

// Helper function to find or create an agent
async function findOrCreateAgent(walletAddress: string): Promise<any> {
  let agent = await Agent.findOne({ walletAddress });

  if (!agent) {
    console.log("👤 Creating new agent for wallet:", walletAddress);

    // Fetch user's NFTs to populate Proxim8s
    let nfts: any[] = [];
    try {
      const nftResult = await getNFTsForWallet(walletAddress, true);
      nfts = nftResult.nfts;
    } catch (error) {
      console.warn("Failed to fetch NFTs for agent creation:", error);
    }

    // Generate a unique codename
    const adjectives = [
      "Shadow",
      "Phantom",
      "Ghost",
      "Neon",
      "Cyber",
      "Quantum",
      "Void",
      "Echo",
    ];
    const nouns = [
      "Walker",
      "Runner",
      "Breaker",
      "Seeker",
      "Hunter",
      "Keeper",
      "Watcher",
      "Finder",
    ];
    const randomAdjective =
      adjectives[Math.floor(Math.random() * adjectives.length)];
    const randomNoun = nouns[Math.floor(Math.random() * nouns.length)];
    const randomNumber = Math.floor(Math.random() * 999) + 1;
    const codename = `${randomAdjective}${randomNoun}${randomNumber}`;

    // Map NFTs to Proxim8s
    const proxim8s = nfts.map((nft: any) => {
      const personalities = [
        "analytical",
        "aggressive",
        "diplomatic",
        "adaptive",
      ];
      const randomPersonality = personalities[
        Math.floor(Math.random() * personalities.length)
      ] as any;

      return {
        nftId: nft.id,
        name: nft.name,
        personality: randomPersonality,
        experience: 0,
        level: 1,
        missionCount: 0,
        successRate: 0,
        isDeployed: false,
      };
    });

    // Create the agent
    agent = await Agent.create({
      agentId: uuidv4(),
      walletAddress,
      userId: walletAddress, // Using wallet as user ID for now
      codename,
      proxim8s,
      timelinePoints: 100, // Starting bonus
      rank: "recruit",
    });

    console.log("✅ Agent created:", agent.codename);
  }

  return agent;
}

export const getTrainingMissions = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    console.log("🔐 Request user object:", req.user);
    const { walletAddress } = req.user!;
    console.log("🔍 Looking for agent with walletAddress:", walletAddress);

    // Get or create agent
    const agent = await findOrCreateAgent(walletAddress);
    console.log("🎯 Agent found/created:", agent.codename);

    // Get user's mission deployment history (use walletAddress as identifier)
    const deployments = await TrainingMissionDeployment.find({
      agentId: walletAddress,
    });

    // Transform mission data with user progress using standardized transformer
    const missionsWithProgress = transformMissionListForClient(
      TRAINING_MISSIONS,
      deployments,
      agent
    );

    const response: MissionsApiResponse = {
      success: true,
      data: {
        missions: missionsWithProgress,
        agent: agent
          ? {
              codename: agent.codename,
              rank: agent.rank,
              timelinePoints: agent.timelinePoints,
              availableProxim8s: (agent as any).getAvailableProxim8s().length,
            }
          : null,
      },
    };
    
    res.json(response);
  } catch (error) {
    console.error("Error fetching training missions:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch training missions",
    });
  }
};

export const getMissionDetails = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<any> => {
  try {
    const { missionId } = req.params;
    const { walletAddress } = req.user!;

    // Find mission template - check both id and missionId for compatibility
    const rawMissionTemplate = TRAINING_MISSIONS.find(
      (m: any) => m.missionId === missionId || m.id === missionId
    );
    if (!rawMissionTemplate) {
      return res.status(404).json({
        success: false,
        error: "Mission not found",
      });
    }
    
    // Transform to standardized template
    const missionTemplate = transformRawMissionToTemplate(rawMissionTemplate);

    // Check if user has deployment for this mission
    const deployment = await TrainingMissionDeployment.findOne({
      agentId: walletAddress,
      missionId,
    });

    // Get agent data for compatibility calculations
    const agent = await Agent.findOne({ walletAddress });

    // Calculate compatibility for each available Proxim8
    let proxim8Compatibility = null;
    if (agent) {
      const availableProxim8s = (agent as any).getAvailableProxim8s();
      proxim8Compatibility = availableProxim8s.map((proxim8: any) => ({
        ...proxim8.toObject(),
        compatibility: MissionService.calculateCompatibility(
          proxim8,
          missionTemplate
        ),
      }));
    }

    const response: MissionDetailsApiResponse = {
      success: true,
      data: {
        mission: missionTemplate,
        deployment: deployment ? (deployment as any).getClientState() : null,
        agent: agent
          ? {
              availableProxim8s: proxim8Compatibility,
              canDeploy: (agent as any).canDeployMission().allowed,
            }
          : null,
      },
    };
    
    res.json(response);
  } catch (error) {
    console.error("Error fetching mission details:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch mission details",
    });
  }
};

export const deployMission = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<any> => {
  try {
    const { missionId } = req.params;
    const { proxim8Id, approach } = req.body;
    const { walletAddress } = req.user!;

    console.log("🚀 Deploying mission:", {
      missionId,
      walletAddress,
      proxim8Id,
      approach,
    });

    // Validate inputs
    if (
      !proxim8Id ||
      !approach ||
      !["low", "medium", "high"].includes(approach)
    ) {
      console.log("❌ Invalid deployment parameters");
      return res.status(400).json({
        success: false,
        error: "Invalid deployment parameters",
      });
    }

    // Deploy mission using TrainingMissionDeployment specifically
    console.log("🔄 Starting deployment...");
    const deployment = await deployTrainingMission({
      agentId: walletAddress,
      missionId,
      proxim8Id,
      approach,
    });

    console.log("✅ Mission deployed successfully:", deployment.deploymentId);

    res.json({
      success: true,
      data: {
        deployment: (deployment as any).getClientState(),
        message: "Mission deployed successfully",
      },
    });
  } catch (error: any) {
    console.error("❌ Error deploying mission:", error.message);
    console.error("Stack:", error.stack);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to deploy mission",
    });
  }
};

export const getMissionStatus = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<any> => {
  try {
    const { deploymentId } = req.params;
    const { walletAddress } = req.user!;

    const deployment = await TrainingMissionDeployment.findOne({
      deploymentId,
      agentId: walletAddress,
    });

    if (!deployment) {
      return res.status(404).json({
        success: false,
        error: "Mission deployment not found",
      });
    }

    // Check if mission should be completed
    const now = new Date();

    if (deployment.status === "active" && now >= deployment.completesAt) {
      console.log(`✅ Auto-completing mission ${deploymentId}`);
      await completeTrainingMission(deployment.deploymentId);
      // Refetch the updated deployment
      const updatedDeployment = await TrainingMissionDeployment.findOne({
        deploymentId,
        agentId: walletAddress,
      });

      return res.json({
        success: true,
        data: updatedDeployment
          ? (updatedDeployment as any).getClientState()
          : null,
      });
    }

    // Get real-time mission progress
    const progressData = MissionService.getMissionProgress(deployment);

    res.json({
      success: true,
      data: {
        ...(deployment as any).getClientState(),
        progress: progressData,
      },
    });
  } catch (error) {
    console.error("Error fetching mission status:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch mission status",
    });
  }
};

// Training Mission Deployment - Template to Instance with Time-Gated Revelation
const deployTrainingMission = async (params: {
  agentId: string;
  missionId: string;
  proxim8Id: string;
  approach: "low" | "medium" | "high";
}) => {
  const { agentId, missionId, proxim8Id, approach } = params;

  // Check if deployment is allowed
  const canDeploy = await (TrainingMissionDeployment as any).canDeployMission(
    agentId,
    missionId
  );
  if (!canDeploy.canDeploy) {
    throw new Error(canDeploy.reason || "Cannot deploy mission");
  }

  // Get mission template
  const missionTemplate = TRAINING_MISSIONS.find(
    (m) => m.missionId === missionId
  );
  if (!missionTemplate) {
    throw new Error("Training mission template not found");
  }

  // Get or create agent and validate Proxim8 (agentId is actually walletAddress)
  const agent = await findOrCreateAgent(agentId);
  if (!agent) {
    throw new Error("Agent not found");
  }

  // If no proxim8s exist yet (user has no NFTs), check if it's a test deployment
  if (agent.proxim8s.length === 0 && proxim8Id === "test-proxim8") {
    console.log("⚠️ Test deployment detected - creating temporary Proxim8");
    // For testing purposes, create a temporary Proxim8
    const testProxim8 = {
      nftId: "test-proxim8",
      name: "Test Agent",
      personality: "adaptive" as const,
      experience: 0,
      level: 1,
      missionCount: 0,
      successRate: 0,
      isDeployed: false,
    };
    agent.proxim8s.push(testProxim8);
    await agent.save();
  }

  const proxim8 = agent.proxim8s.find((p: any) => p.nftId === proxim8Id);
  if (!proxim8) {
    console.error(
      "Available Proxim8s:",
      agent.proxim8s.map((p: any) => ({
        id: p.nftId,
        name: p.name,
        deployed: p.isDeployed,
      }))
    );
    throw new Error(`Proxim8 with ID ${proxim8Id} not found`);
  }

  if (proxim8.isDeployed) {
    throw new Error("Proxim8 is already deployed on another mission");
  }

  // Get approach parameters
  const approachConfig = missionTemplate.approaches.find(
    (a) => a.type === approach
  );
  if (!approachConfig) {
    throw new Error("Invalid approach for this mission");
  }

  // Calculate mission timing
  const duration = missionTemplate.duration;
  const deployedAt = new Date();
  const completesAt = new Date(deployedAt.getTime() + duration);

  // Calculate success rate with compatibility
  const compatibility = MissionService.calculateCompatibility(
    proxim8,
    missionTemplate
  );
  const baseSuccessRate =
    (approachConfig.successRate.min + approachConfig.successRate.max) / 2;
  const finalSuccessRate = Math.min(
    0.95,
    baseSuccessRate * compatibility.overall
  );

  // Generate all mission content at deployment time using AI
  const generatedContent =
    await TrainingMissionGenerationService.generateMissionInstance({
      template: missionTemplate,
      approach: approachConfig,
      proxim8,
      agent,
      finalSuccessRate,
      duration,
      deployedAt,
    }).catch((err) => {
      console.error("Content generation error:", err);
      // Fallback to simple generation for testing
      return {
        phaseOutcomes: missionTemplate.phases.map(
          (phase: any, index: number) => ({
            phaseId: phase.id,
            success: Math.random() < finalSuccessRate,
            narrative: `Phase ${phase.id}: ${phase.name} - Generated narrative pending...`,
            completedAt: null,
          })
        ),
        result: {
          overallSuccess: Math.random() < finalSuccessRate,
          finalNarrative: `Mission ${missionTemplate.title} completed with ${Math.random() > 0.5 ? "success" : "partial success"}.`,
          timelineShift: Math.floor(Math.random() * 10) + 1,
          rewards: {
            timelinePoints: 100,
            experience: 50,
            loreFragments: [],
            achievements: [],
          },
        },
      };
    });

  // Create training mission deployment with pre-generated content
  const deployment = new TrainingMissionDeployment({
    missionId,
    agentId,
    proxim8Id,
    approach,
    deployedAt,
    completesAt,
    duration,
    status: "active", // Revealing content over time, not actually running
    currentPhase: 0,
    finalSuccessRate,
    phaseOutcomes: generatedContent.phaseOutcomes.map((phase: any) => ({
      phaseId: phase.phaseId,
      name: phase.name,
      success: phase.success,
      diceRoll: phase.diceRoll,
      successThreshold: phase.successThreshold,
      narrative: phase.narrative,
      firstPersonReport: phase.firstPersonReport,
      structuredData: phase.structuredData,
      imagePrompt: phase.imagePrompt,
      revealTime: phase.revealTime,
      completedAt: phase.completedAt,
      tensionLevel: phase.tensionLevel,
    })),
    result: generatedContent.result,
  });

  await deployment.save();

  // Save AI-generated lore using existing Lore system
  const result = generatedContent.result;
  const hasGeneratedLore =
    result &&
    "generatedLoreEntries" in result &&
    Array.isArray((result as any).generatedLoreEntries) &&
    (result as any).generatedLoreEntries.length > 0;

  if (hasGeneratedLore) {
    const loreEntries = (result as any).generatedLoreEntries;
    console.log(`💾 Saving ${loreEntries.length} AI-generated lore entries...`);

    try {
      for (const entry of loreEntries) {
        // Create lore entry using existing Lore model
        const loreEntry = new Lore({
          nftId: proxim8Id, // Link to the Proxim8 that completed the mission
          title: entry.title,
          content: entry.content,
          background: `Generated during mission: ${missionTemplate.title}`,
          traits: {
            missionId,
            approach: approach,
            success: generatedContent.result.overallSuccess,
            deployedAt: deployedAt.toISOString(),
          },

          // Mission-specific fields
          sourceType: "mission",
          sourceMissionId: missionId,
          deploymentId: deployment.deploymentId,
          loreType: entry.type,
          rarity: entry.type === "mission_report" ? "common" : "uncommon",
          tags: entry.tags || ["training", "mission", missionId],

          // Unlock when mission completes
          unlockRequirements: {
            missionSuccess: generatedContent.result.overallSuccess,
            completedAt: completesAt,
          },

          // AI generation metadata
          aiGenerated: true,
          generationMetadata: {
            model: "gemini-2.5-pro-preview-05-06",
            prompt: "structured_mission_generation",
            generatedAt: new Date(),
            probability: entry.metadata?.probability || 1.0,
          },

          // Will be claimable when mission completes
          claimed: false,
        });

        await loreEntry.save();
        console.log(
          `  📚 Saved lore: "${entry.title}" for Proxim8 ${proxim8Id}`
        );
      }

      console.log(`✅ Successfully saved ${loreEntries.length} lore entries`);
    } catch (error) {
      console.error("Error saving AI-generated lore:", error);
      // Don't fail deployment if lore save fails
    }
  }

  // Mark Proxim8 as deployed
  proxim8.isDeployed = true;
  proxim8.currentMissionId = deployment.deploymentId;
  agent.lastMissionDeployedAt = deployedAt;
  agent.dailyMissionCount += 1;

  await agent.save();

  return deployment;
};

// Complete a training mission and free up the Proxim8
const completeTrainingMission = async (deploymentId: string) => {
  const deployment = await TrainingMissionDeployment.findOne({ deploymentId });

  if (!deployment) {
    throw new Error("Training mission deployment not found");
  }

  if (deployment.status !== "active") {
    throw new Error("Training mission is not active");
  }

  // Update deployment status
  deployment.status = "completed";

  // Ensure result exists (it should be pre-generated but add fallback)
  if (!deployment.result) {
    const successfulPhases = deployment.phaseOutcomes.filter(
      (p: any) => p.success
    ).length;
    const overallSuccess = successfulPhases >= 3;

    deployment.result = {
      overallSuccess,
      finalNarrative: overallSuccess
        ? "Training mission completed successfully. Timeline influence established."
        : "Training mission partially successful. Some objectives achieved.",
      timelineShift: overallSuccess
        ? deployment.finalSuccessRate * 10
        : deployment.finalSuccessRate * 5,
      rewards: {
        timelinePoints: overallSuccess ? 100 : 50,
        experience: overallSuccess ? 50 : 25,
        loreFragments: overallSuccess ? ["training_lore_001"] : [],
        achievements: overallSuccess ? ["training_success"] : [],
      },
    };
  }

  await deployment.save();

  // Free up the Proxim8 and update agent progress
  try {
    const agent = await Agent.findOne({ walletAddress: deployment.agentId });
    if (agent) {
      // Find and free the deployed Proxim8
      const proxim8 = agent.proxim8s.find(
        (p: any) => p.nftId === deployment.proxim8Id
      );
      if (proxim8) {
        proxim8.isDeployed = false;
        proxim8.currentMissionId = undefined;

        // Update Proxim8 experience and stats
        if (deployment.result.overallSuccess) {
          proxim8.missionCount += 1;
          proxim8.experience += deployment.result.rewards.experience;
          proxim8.level = Math.floor(Math.sqrt(proxim8.experience / 100)) + 1;

          // Update success rate
          const totalSuccessful = agent.proxim8s.reduce(
            (sum: number, p: any) => sum + (p.successRate || 0),
            0
          );
          const totalMissions = agent.proxim8s.reduce(
            (sum: number, p: any) => sum + (p.missionCount || 0),
            0
          );
          proxim8.successRate =
            totalMissions > 0
              ? ((totalSuccessful + 1) / (totalMissions + 1)) * 100
              : 100;
        }
      }

      // Update agent stats
      if (deployment.result.overallSuccess) {
        agent.totalMissionsSucceeded += 1;
        agent.timelinePoints += deployment.result.rewards.timelinePoints;
      } else {
        agent.totalMissionsFailed += 1;
      }

      agent.totalMissionsDeployed += 1;
      agent.totalTimelineShift += deployment.result.timelineShift || 0;

      // Update rank based on new stats
      (agent as any).calculateRank();

      await agent.save();
    }
  } catch (error) {
    console.warn(
      "Failed to update agent/Proxim8 after training mission completion:",
      error
    );
    // Don't fail the completion if agent update fails
  }

  return deployment;
};

// Helper functions
export function canUserAccessMission(missionId: string, deployments: any[]): boolean {
  // Safety check for undefined missionId
  if (!missionId || typeof missionId !== "string") {
    console.warn("canUserAccessMission: Invalid missionId", missionId);
    return false;
  }

  const parts = missionId.split("_");
  if (parts.length < 2) {
    console.warn("canUserAccessMission: Invalid missionId format", missionId);
    return false;
  }

  const missionNumber = parseInt(parts[1]);

  // First mission is always unlocked
  if (missionNumber === 1) return true;

  // Check if previous mission is completed
  const previousMissionId = `training_${String(missionNumber - 1).padStart(3, "0")}`;
  const previousDeployment = deployments.find(
    (d) => d.missionId === previousMissionId
  );

  return previousDeployment?.status === "completed";
}
