import { Request, Response } from 'express';
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from '../constants';
import {
  AIService,
  GameAgentService,
  ScheduledService,
} from '../services/game';
import { MissionService as TrainingMissionService } from '../services/game/missionService';
import { ApiError, sendError, sendSuccess } from '../utils';

// ============================================================================
// GAME AGENT ENDPOINTS
// ============================================================================

/**
 * Create or get game agent for authenticated user
 */
export const handleCreateGameAgent = async (req: Request, res: Response) => {
  try {
    console.log('[Create Game Agent] Starting with:', {
      fingerprintId: req.auth?.fingerprint?.id,
      body: req.body,
    });

    if (!req.auth?.fingerprint?.id) {
      return sendError(
        res,
        new ApiError(401, ERROR_MESSAGES.FINGERPRINT_REQUIRED)
      );
    }

    const agent = await GameAgentService.getOrCreateGameAgent(
      req.auth.fingerprint.id
    );

    console.log('[Create Game Agent] Successfully created agent:', {
      id: agent.id,
    });
    return sendSuccess(res, agent, SUCCESS_MESSAGES.AGENT_CREATED, 201);
  } catch (error) {
    console.error('[Create Game Agent] Error:', {
      error,
      stack: error instanceof Error ? error.stack : undefined,
      body: req.body,
    });
    return sendError(
      res,
      ApiError.from(error, 500, 'Failed to create game agent')
    );
  }
};

/**
 * Get game agent profile
 */
export const handleGetGameAgent = async (req: Request, res: Response) => {
  try {
    console.log(
      '[Get Game Agent] Starting with fingerprintId:',
      req.auth?.fingerprint?.id
    );

    if (!req.auth?.fingerprint?.id) {
      return sendError(
        res,
        new ApiError(401, ERROR_MESSAGES.FINGERPRINT_REQUIRED)
      );
    }

    const agent = await GameAgentService.getOrCreateGameAgent(
      req.auth.fingerprint.id
    );

    console.log('[Get Game Agent] Successfully retrieved agent:', {
      id: agent.id,
    });
    return sendSuccess(res, agent);
  } catch (error) {
    console.error('[Get Game Agent] Error:', {
      error,
      stack: error instanceof Error ? error.stack : undefined,
      fingerprintId: req.auth?.fingerprint?.id,
    });
    return sendError(
      res,
      ApiError.from(error, 500, 'Failed to get game agent')
    );
  }
};

/**
 * Get game agent statistics
 */
export const handleGetGameAgentStats = async (req: Request, res: Response) => {
  try {
    console.log(
      '[Get Game Agent Stats] Starting with fingerprintId:',
      req.auth?.fingerprint?.id
    );

    if (!req.auth?.fingerprint?.id) {
      return sendError(
        res,
        new ApiError(401, ERROR_MESSAGES.FINGERPRINT_REQUIRED)
      );
    }

    const agent = await GameAgentService.getOrCreateGameAgent(
      req.auth.fingerprint.id
    );
    const stats = await GameAgentService.getAgentStats(agent.id);

    console.log('[Get Game Agent Stats] Successfully retrieved stats');
    return sendSuccess(res, stats);
  } catch (error) {
    console.error('[Get Game Agent Stats] Error:', {
      error,
      stack: error instanceof Error ? error.stack : undefined,
      fingerprintId: req.auth?.fingerprint?.id,
    });
    return sendError(
      res,
      ApiError.from(error, 500, 'Failed to get game agent stats')
    );
  }
};

// ============================================================================
// PROXIM8 ENDPOINTS
// ============================================================================

/**
 * Register NFT as Proxim8
 */
export const handleRegisterProxim8 = async (req: Request, res: Response) => {
  try {
    console.log('[Register Proxim8] Starting with:', {
      fingerprintId: req.auth?.fingerprint?.id,
      body: req.body,
    });

    if (!req.auth?.fingerprint?.id) {
      return sendError(
        res,
        new ApiError(401, ERROR_MESSAGES.FINGERPRINT_REQUIRED)
      );
    }

    const agent = await GameAgentService.getOrCreateGameAgent(
      req.auth.fingerprint.id
    );
    const proxim8 = await GameAgentService.addProxim8({
      gameAgentId: agent.id,
      nftId: req.body.nftId,
      name:
        req.body.name ||
        req.body.codename ||
        `Proxim8 ${req.body.nftId.slice(-6)}`,
      personality: req.body.personality,
    });

    console.log('[Register Proxim8] Successfully registered:', {
      id: proxim8.id,
    });
    return sendSuccess(res, proxim8, SUCCESS_MESSAGES.PROXIM8_REGISTERED, 201);
  } catch (error) {
    console.error('[Register Proxim8] Error:', {
      error,
      stack: error instanceof Error ? error.stack : undefined,
      body: req.body,
    });
    return sendError(
      res,
      ApiError.from(error, 500, 'Failed to register Proxim8')
    );
  }
};

/**
 * Get agent's Proxim8s
 */
export const handleGetAgentProxim8s = async (req: Request, res: Response) => {
  try {
    console.log(
      '[Get Agent Proxim8s] Starting with fingerprintId:',
      req.auth?.fingerprint?.id
    );

    if (!req.auth?.fingerprint?.id) {
      return sendError(
        res,
        new ApiError(401, ERROR_MESSAGES.FINGERPRINT_REQUIRED)
      );
    }

    const agent = await GameAgentService.getOrCreateGameAgent(
      req.auth.fingerprint.id
    );
    const proxim8s = await GameAgentService.getAvailableProxim8s(agent.id);

    console.log('[Get Agent Proxim8s] Found proxim8s:', {
      count: proxim8s.length,
    });
    return sendSuccess(res, proxim8s);
  } catch (error) {
    console.error('[Get Agent Proxim8s] Error:', {
      error,
      stack: error instanceof Error ? error.stack : undefined,
      fingerprintId: req.auth?.fingerprint?.id,
    });
    return sendError(
      res,
      ApiError.from(error, 500, 'Failed to get agent Proxim8s')
    );
  }
};

/**
 * Get available Proxim8s for deployment
 */
export const handleGetAvailableProxim8s = async (
  req: Request,
  res: Response
) => {
  try {
    console.log(
      '[Get Available Proxim8s] Starting with fingerprintId:',
      req.auth?.fingerprint?.id
    );

    if (!req.auth?.fingerprint?.id) {
      return sendError(
        res,
        new ApiError(401, ERROR_MESSAGES.FINGERPRINT_REQUIRED)
      );
    }

    const agent = await GameAgentService.getOrCreateGameAgent(
      req.auth.fingerprint.id
    );
    const proxim8s = await GameAgentService.getAvailableProxim8s(agent.id);

    console.log('[Get Available Proxim8s] Found available proxim8s:', {
      count: proxim8s.length,
    });
    return sendSuccess(res, proxim8s);
  } catch (error) {
    console.error('[Get Available Proxim8s] Error:', {
      error,
      stack: error instanceof Error ? error.stack : undefined,
      fingerprintId: req.auth?.fingerprint?.id,
    });
    return sendError(
      res,
      ApiError.from(error, 500, 'Failed to get available Proxim8s')
    );
  }
};

// ============================================================================
// TRAINING MISSION ENDPOINTS
// ============================================================================

/**
 * Get available training missions
 */
export const handleGetAvailableTrainingMissions = async (
  req: Request,
  res: Response
) => {
  try {
    console.log(
      '[Get Available Training Missions] Starting with fingerprintId:',
      req.auth?.fingerprint?.id
    );

    if (!req.auth?.fingerprint?.id) {
      return sendError(
        res,
        new ApiError(401, ERROR_MESSAGES.FINGERPRINT_REQUIRED)
      );
    }

    const agent = await GameAgentService.getOrCreateGameAgent(
      req.auth.fingerprint.id
    );

    // For now, return basic mission data since we need to implement mission availability logic
    const { TRAINING_MISSIONS } = await import('../data/trainingMissions');
    const availableMissions = TRAINING_MISSIONS.map((mission) => ({
      id: mission.missionId,
      title: mission.title,
      description: mission.description,
      sequence: mission.sequence,
      location: mission.location,
      duration: mission.duration,
      threatLevel: mission.briefing.threatLevel,
      isUnlocked:
        mission.sequence === 1 ||
        agent.timelinePoints >= (mission.sequence - 1) * 100,
      approaches: mission.approaches.map((a) => ({
        type: a.type,
        name: a.name,
        description: a.description,
      })),
    }));

    console.log('[Get Available Training Missions] Found missions:', {
      count: availableMissions.length,
    });
    return sendSuccess(res, availableMissions);
  } catch (error) {
    console.error('[Get Available Training Missions] Error:', {
      error,
      stack: error instanceof Error ? error.stack : undefined,
      fingerprintId: req.auth?.fingerprint?.id,
    });
    return sendError(
      res,
      ApiError.from(error, 500, 'Failed to get available training missions')
    );
  }
};

/**
 * Get training mission details
 */
export const handleGetTrainingMission = async (req: Request, res: Response) => {
  try {
    console.log('[Get Training Mission] Starting with:', {
      missionId: req.params.missionId,
      fingerprintId: req.auth?.fingerprint?.id,
    });

    if (!req.auth?.fingerprint?.id) {
      return sendError(
        res,
        new ApiError(401, ERROR_MESSAGES.FINGERPRINT_REQUIRED)
      );
    }

    const { TRAINING_MISSIONS } = await import('../data/trainingMissions');
    const mission = TRAINING_MISSIONS.find(
      (m) => m.missionId === req.params.missionId
    );

    if (!mission) {
      return sendError(res, new ApiError(404, 'Training mission not found'));
    }

    console.log('[Get Training Mission] Successfully retrieved mission:', {
      id: mission.missionId,
    });
    return sendSuccess(res, mission);
  } catch (error) {
    console.error('[Get Training Mission] Error:', {
      error,
      stack: error instanceof Error ? error.stack : undefined,
      params: req.params,
    });
    return sendError(
      res,
      ApiError.from(error, 500, 'Failed to get training mission')
    );
  }
};

/**
 * Deploy Proxim8 to training mission
 */
export const handleDeployToMission = async (req: Request, res: Response) => {
  try {
    console.log('[Deploy To Mission] Starting with:', {
      fingerprintId: req.auth?.fingerprint?.id,
      body: req.body,
    });

    if (!req.auth?.fingerprint?.id) {
      return sendError(
        res,
        new ApiError(401, ERROR_MESSAGES.FINGERPRINT_REQUIRED)
      );
    }

    const agent = await GameAgentService.getOrCreateGameAgent(
      req.auth.fingerprint.id
    );
    const deployment = await TrainingMissionService.deployTrainingMission({
      gameAgentId: agent.id,
      missionId: req.body.missionId,
      gameProxim8Id: req.body.proxim8Id,
      approach: req.body.approach,
    });

    console.log('[Deploy To Mission] Successfully deployed:', {
      id: deployment.id,
    });
    return sendSuccess(
      res,
      deployment,
      SUCCESS_MESSAGES.DEPLOYMENT_CREATED,
      201
    );
  } catch (error) {
    console.error('[Deploy To Mission] Error:', {
      error,
      stack: error instanceof Error ? error.stack : undefined,
      body: req.body,
    });
    return sendError(
      res,
      ApiError.from(error, 500, 'Failed to deploy to mission')
    );
  }
};

/**
 * Get active deployments
 */
export const handleGetActiveDeployments = async (
  req: Request,
  res: Response
) => {
  try {
    console.log(
      '[Get Active Deployments] Starting with fingerprintId:',
      req.auth?.fingerprint?.id
    );

    if (!req.auth?.fingerprint?.id) {
      return sendError(
        res,
        new ApiError(401, ERROR_MESSAGES.FINGERPRINT_REQUIRED)
      );
    }

    const agent = await GameAgentService.getOrCreateGameAgent(
      req.auth.fingerprint.id
    );

    // Get active deployments from database
    const { prisma } = await import('../services/prisma.service');
    const deployments = await prisma.trainingMissionDeployment.findMany({
      where: {
        gameAgentId: agent.id,
        status: 'ACTIVE',
      },
      include: {
        gameProxim8: true,
      },
      orderBy: { deployedAt: 'desc' },
    });

    // Return client-safe state
    const clientDeployments = deployments.map((deployment) =>
      TrainingMissionService.getClientState(deployment)
    );

    console.log('[Get Active Deployments] Found deployments:', {
      count: clientDeployments.length,
    });
    return sendSuccess(res, clientDeployments);
  } catch (error) {
    console.error('[Get Active Deployments] Error:', {
      error,
      stack: error instanceof Error ? error.stack : undefined,
      fingerprintId: req.auth?.fingerprint?.id,
    });
    return sendError(
      res,
      ApiError.from(error, 500, 'Failed to get active deployments')
    );
  }
};

/**
 * Get deployment details
 */
export const handleGetDeployment = async (req: Request, res: Response) => {
  try {
    console.log('[Get Deployment] Starting with:', {
      deploymentId: req.params.deploymentId,
      fingerprintId: req.auth?.fingerprint?.id,
    });

    if (!req.auth?.fingerprint?.id) {
      return sendError(
        res,
        new ApiError(401, ERROR_MESSAGES.FINGERPRINT_REQUIRED)
      );
    }

    const agent = await GameAgentService.getOrCreateGameAgent(
      req.auth.fingerprint.id
    );

    // Get deployment from database
    const { prisma } = await import('../services/prisma.service');
    const deployment = await prisma.trainingMissionDeployment.findFirst({
      where: {
        deploymentId: req.params.deploymentId,
        gameAgentId: agent.id,
      },
      include: {
        gameProxim8: true,
      },
    });

    if (!deployment) {
      return sendError(res, new ApiError(404, 'Deployment not found'));
    }

    const clientState = TrainingMissionService.getClientState(deployment);

    console.log('[Get Deployment] Successfully retrieved deployment:', {
      id: deployment.id,
    });
    return sendSuccess(res, clientState);
  } catch (error) {
    console.error('[Get Deployment] Error:', {
      error,
      stack: error instanceof Error ? error.stack : undefined,
      params: req.params,
    });
    return sendError(
      res,
      ApiError.from(error, 500, 'Failed to get deployment')
    );
  }
};

/**
 * Get deployment progress
 */
export const handleGetDeploymentProgress = async (
  req: Request,
  res: Response
) => {
  try {
    console.log('[Get Deployment Progress] Starting with:', {
      deploymentId: req.params.deploymentId,
      fingerprintId: req.auth?.fingerprint?.id,
    });

    if (!req.auth?.fingerprint?.id) {
      return sendError(
        res,
        new ApiError(401, ERROR_MESSAGES.FINGERPRINT_REQUIRED)
      );
    }

    const agent = await GameAgentService.getOrCreateGameAgent(
      req.auth.fingerprint.id
    );

    // Get deployment from database
    const { prisma } = await import('../services/prisma.service');
    const deployment = await prisma.trainingMissionDeployment.findFirst({
      where: {
        deploymentId: req.params.deploymentId,
        gameAgentId: agent.id,
      },
    });

    if (!deployment) {
      return sendError(res, new ApiError(404, 'Deployment not found'));
    }

    const progress = TrainingMissionService.getMissionProgress(deployment);

    console.log('[Get Deployment Progress] Successfully retrieved progress');
    return sendSuccess(res, progress);
  } catch (error) {
    console.error('[Get Deployment Progress] Error:', {
      error,
      stack: error instanceof Error ? error.stack : undefined,
      params: req.params,
    });
    return sendError(
      res,
      ApiError.from(error, 500, 'Failed to get deployment progress')
    );
  }
};

/**
 * Complete deployment manually (for testing)
 */
export const handleCompleteDeployment = async (req: Request, res: Response) => {
  try {
    console.log('[Complete Deployment] Starting with:', {
      deploymentId: req.params.deploymentId,
      fingerprintId: req.auth?.fingerprint?.id,
    });

    if (!req.auth?.fingerprint?.id) {
      return sendError(
        res,
        new ApiError(401, ERROR_MESSAGES.FINGERPRINT_REQUIRED)
      );
    }

    const result = await TrainingMissionService.completeMission(
      req.params.deploymentId
    );

    console.log('[Complete Deployment] Successfully completed deployment');
    return sendSuccess(res, result, SUCCESS_MESSAGES.DEPLOYMENT_COMPLETED);
  } catch (error) {
    console.error('[Complete Deployment] Error:', {
      error,
      stack: error instanceof Error ? error.stack : undefined,
      params: req.params,
    });
    return sendError(
      res,
      ApiError.from(error, 500, 'Failed to complete deployment')
    );
  }
};

// ============================================================================
// AI & NARRATIVE ENDPOINTS
// ============================================================================

/**
 * Generate mission briefing
 */
export const handleGenerateMissionBriefing = async (
  req: Request,
  res: Response
) => {
  try {
    console.log('[Generate Mission Briefing] Starting with:', {
      missionId: req.params.missionId,
      fingerprintId: req.auth?.fingerprint?.id,
    });

    if (!req.auth?.fingerprint?.id) {
      return sendError(
        res,
        new ApiError(401, ERROR_MESSAGES.FINGERPRINT_REQUIRED)
      );
    }

    const agent = await GameAgentService.getOrCreateGameAgent(
      req.auth.fingerprint.id
    );
    const stats = await GameAgentService.getAgentStats(agent.id);

    // Get mission template
    const { TRAINING_MISSIONS } = await import('../data/trainingMissions');
    const mission = TRAINING_MISSIONS.find(
      (m) => m.missionId === req.params.missionId
    );

    if (!mission) {
      return sendError(res, new ApiError(404, 'Mission not found'));
    }

    // Get a sample Proxim8 for briefing (or use default)
    const availableProxim8s = await GameAgentService.getAvailableProxim8s(
      agent.id
    );
    const sampleProxim8 = availableProxim8s[0] || {
      name: 'Default Proxim8',
      personality: 'ANALYTICAL' as any,
      level: 1,
      experience: 0,
    };

    const briefing = await AIService.generateMissionBriefing(
      mission,
      sampleProxim8,
      {
        rank: stats.rank,
        timelinePoints: stats.totalTimelineShift,
        successRate: stats.successRate,
      }
    );

    console.log('[Generate Mission Briefing] Successfully generated briefing');
    return sendSuccess(res, briefing);
  } catch (error) {
    console.error('[Generate Mission Briefing] Error:', {
      error,
      stack: error instanceof Error ? error.stack : undefined,
      params: req.params,
    });
    return sendError(
      res,
      ApiError.from(error, 500, 'Failed to generate mission briefing')
    );
  }
};

// ============================================================================
// ADMIN & SYSTEM ENDPOINTS
// ============================================================================

/**
 * Trigger scheduled tasks manually (admin only)
 */
export const handleTriggerScheduledTasks = async (
  req: Request,
  res: Response
) => {
  try {
    console.log('[Trigger Scheduled Tasks] Starting manual execution');

    const results = await ScheduledService.runAllScheduledTasks();

    console.log('[Trigger Scheduled Tasks] Successfully executed tasks:', {
      taskCount: results.length,
    });

    return sendSuccess(res, results, 'Scheduled tasks executed successfully');
  } catch (error) {
    console.error('[Trigger Scheduled Tasks] Error:', {
      error,
      stack: error instanceof Error ? error.stack : undefined,
    });
    return sendError(
      res,
      ApiError.from(error, 500, 'Failed to execute scheduled tasks')
    );
  }
};

/**
 * Get system health status
 */
export const handleGetSystemHealth = async (req: Request, res: Response) => {
  try {
    console.log('[Get System Health] Checking system status');

    const health = await ScheduledService.healthCheck();

    console.log('[Get System Health] System health retrieved');
    return sendSuccess(res, health);
  } catch (error) {
    console.error('[Get System Health] Error:', {
      error,
      stack: error instanceof Error ? error.stack : undefined,
    });
    return sendError(
      res,
      ApiError.from(error, 500, 'Failed to get system health')
    );
  }
};
