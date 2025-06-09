/**
 * Training API with runtime validation
 * This version validates all API responses using Zod schemas
 */

import { getValidated, postValidated } from '@/utils/apiClient.validated';
import {
  MissionsApiResponseSchema,
  MissionDetailsApiResponseSchema,
  MissionDeploymentSchema,
  type MissionsApiResponse,
  type MissionDetailsApiResponse,
  type ApproachType
} from '@proxim8/shared';
import { z } from 'zod';

// Re-export types
export type { 
  Agent, 
  MissionDeployment,
  MissionWithProgress as TrainingMission,
  MissionTemplate
} from '@proxim8/shared';

// Local types that aren't in shared yet
export type { Proxim8 } from '../api/training';

/**
 * Get all training missions with user progress - WITH VALIDATION
 */
export async function getTrainingMissions() {
  const response = await getValidated(
    '/api/training/missions',
    MissionsApiResponseSchema
  );
  
  return response.data;
}

/**
 * Get specific mission details with deployment info - WITH VALIDATION
 */
export async function getMissionDetails(missionId: string) {
  const response = await getValidated(
    `/api/training/missions/${missionId}`,
    MissionDetailsApiResponseSchema
  );
  
  // Map to legacy response type for backward compatibility
  return {
    mission: response.data.mission,
    deployment: response.data.deployment || undefined,
    agent: response.data.agent ? {
      availableProxim8s: response.data.agent.availableProxim8s,
      canDeploy: {
        allowed: response.data.agent.canDeploy,
        reason: undefined
      }
    } : undefined
  };
}

// Define schemas for deployment
const DeployMissionInputSchema = z.object({
  proxim8Id: z.string(),
  approach: z.enum(['low', 'medium', 'high'])
});

const DeployMissionResponseSchema = z.object({
  success: z.boolean(),
  data: z.object({
    deployment: MissionDeploymentSchema,
    message: z.string()
  })
});

/**
 * Deploy a training mission - WITH VALIDATION
 */
export async function deployMission(
  missionId: string,
  proxim8Id: string,
  approach: ApproachType
) {
  const response = await postValidated(
    `/api/training/missions/${missionId}/deploy`,
    { proxim8Id, approach },
    DeployMissionInputSchema,
    DeployMissionResponseSchema
  );
  
  return response.data;
}

/**
 * Get mission deployment status - WITH VALIDATION
 */
export async function getMissionStatus(deploymentId: string) {
  const response = await getValidated(
    `/api/training/deployments/${deploymentId}/status`,
    z.object({
      success: z.boolean(),
      data: MissionDeploymentSchema
    })
  );
  
  return response.data;
}

/**
 * Benefits of this approach:
 * 
 * 1. Runtime validation catches server bugs
 * 2. Better error messages when data doesn't match
 * 3. Can log validation errors for debugging
 * 4. Gradual migration - use alongside existing code
 * 
 * Example usage in a component:
 * 
 * try {
 *   const missions = await getTrainingMissions();
 *   // TypeScript knows the shape AND it's validated at runtime
 * } catch (error) {
 *   if (error.message.includes('Invalid API response')) {
 *     // Handle validation error - server sent wrong data
 *   }
 * }
 */