import * as apiClient from '@/utils/apiClient';
import type {
  MissionWithProgress,
  Agent,
  MissionTemplate,
  MissionDeployment,
  MissionsApiResponse,
  MissionDetailsApiResponse,
  ApproachType
} from '@proxim8/shared';

// Re-export shared types for backward compatibility
export type { 
  Agent, 
  MissionDeployment,
  MissionWithProgress as TrainingMission,
  MissionTemplate
} from '@proxim8/shared';

// Proxim8 type is still local as it's not in shared types yet
export interface Proxim8 {
  nftId: string;
  name: string;
  personality: 'analytical' | 'aggressive' | 'diplomatic' | 'adaptive';
  experience: number;
  level: number;
  missionCount: number;
  successRate: number;
  specialization?: string;
  currentMissionId?: string;
  isDeployed: boolean;
  compatibility?: {
    overall: number;
    personalityBonus: number;
    experienceBonus: number;
    levelBonus: number;
  };
}

// Legacy response types mapped to new shared types
export interface TrainingMissionsResponse {
  missions: MissionWithProgress[];
  agent: Agent | null;
}

export interface MissionDetailsResponse {
  mission: MissionTemplate;
  deployment?: MissionDeployment;
  agent?: {
    availableProxim8s: Proxim8[];
    canDeploy: {
      allowed: boolean;
      reason?: string;
    };
  };
}

/**
 * Get all training missions with user progress
 */
export async function getTrainingMissions(): Promise<TrainingMissionsResponse> {
  const response = await apiClient.get<MissionsApiResponse>('/api/training/missions');
  if (!response.success) {
    throw new Error('Failed to fetch training missions');
  }
  return response.data;
}

/**
 * Get specific mission details with deployment info
 */
export async function getMissionDetails(missionId: string): Promise<MissionDetailsResponse> {
  const response = await apiClient.get<MissionDetailsApiResponse>(`/api/training/missions/${missionId}`);
  if (!response.success) {
    throw new Error('Failed to fetch mission details');
  }
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

/**
 * Deploy a training mission
 */
export async function deployMission(
  missionId: string,
  proxim8Id: string,
  approach: ApproachType
): Promise<{ deployment: MissionDeployment; message: string }> {
  const response = await apiClient.post<{ success: boolean; data: { deployment: MissionDeployment; message: string } }>(`/api/training/missions/${missionId}/deploy`, {
    proxim8Id,
    approach
  });
  if (!response.success) {
    throw new Error('Failed to deploy mission');
  }
  return response.data;
}

/**
 * Get mission deployment status
 */
export async function getMissionStatus(deploymentId: string): Promise<MissionDeployment> {
  const response = await apiClient.get<{ success: boolean; data: MissionDeployment }>(`/api/training/deployments/${deploymentId}/status`);
  if (!response.success) {
    throw new Error('Failed to fetch mission status');
  }
  return response.data;
}