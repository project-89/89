import { Router } from 'express';
import {
  handleCompleteDeployment,
  handleCreateGameAgent,
  handleDeployToMission,
  handleGenerateMissionBriefing,
  handleGetActiveDeployments,
  handleGetAgentProxim8s,
  handleGetAvailableProxim8s,
  handleGetAvailableTrainingMissions,
  handleGetDeployment,
  handleGetDeploymentProgress,
  handleGetGameAgent,
  handleGetGameAgentStats,
  handleGetSystemHealth,
  handleGetTrainingMission,
  handleRegisterProxim8,
  handleTriggerScheduledTasks,
} from '../endpoints/trainingMission.endpoint';

const router = Router();

// ============================================================================
// GAME AGENT ROUTES
// ============================================================================

// POST /api/training/agent - Create or get game agent
router.post('/agent', handleCreateGameAgent);

// GET /api/training/agent - Get current game agent
router.get('/agent', handleGetGameAgent);

// GET /api/training/agent/stats - Get agent statistics
router.get('/agent/stats', handleGetGameAgentStats);

// ============================================================================
// PROXIM8 ROUTES
// ============================================================================

// POST /api/training/proxim8s - Register new Proxim8
router.post('/proxim8s', handleRegisterProxim8);

// GET /api/training/proxim8s - Get all agent's Proxim8s
router.get('/proxim8s', handleGetAgentProxim8s);

// GET /api/training/proxim8s/available - Get available Proxim8s for deployment
router.get('/proxim8s/available', handleGetAvailableProxim8s);

// ============================================================================
// TRAINING MISSION ROUTES
// ============================================================================

// GET /api/training/missions - Get available training missions
router.get('/missions', handleGetAvailableTrainingMissions);

// GET /api/training/missions/:missionId - Get specific mission details
router.get('/missions/:missionId', handleGetTrainingMission);

// GET /api/training/missions/:missionId/briefing - Generate mission briefing
router.get('/missions/:missionId/briefing', handleGenerateMissionBriefing);

// ============================================================================
// DEPLOYMENT ROUTES
// ============================================================================

// POST /api/training/deployments - Deploy Proxim8 to mission
router.post('/deployments', handleDeployToMission);

// GET /api/training/deployments - Get active deployments
router.get('/deployments', handleGetActiveDeployments);

// GET /api/training/deployments/:deploymentId - Get specific deployment
router.get('/deployments/:deploymentId', handleGetDeployment);

// GET /api/training/deployments/:deploymentId/progress - Get deployment progress
router.get('/deployments/:deploymentId/progress', handleGetDeploymentProgress);

// POST /api/training/deployments/:deploymentId/complete - Complete deployment manually
router.post('/deployments/:deploymentId/complete', handleCompleteDeployment);

// ============================================================================
// ADMIN & SYSTEM ROUTES
// ============================================================================

// POST /api/training/admin/trigger-tasks - Trigger scheduled tasks manually
router.post('/admin/trigger-tasks', handleTriggerScheduledTasks);

// GET /api/training/admin/health - Get system health
router.get('/admin/health', handleGetSystemHealth);

export default router;
