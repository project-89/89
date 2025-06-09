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

// Mission types
export type MissionType = 'training' | 'timeline' | 'critical' | 'event';

// Re-export shared types
export type { 
  Agent, 
  MissionDeployment,
  MissionWithProgress,
  MissionTemplate,
  ApproachType
} from '@proxim8/shared';

// Type alias for backward compatibility
export type TrainingMission = MissionWithProgress;

export interface MissionsResponse {
  missions: MissionWithProgress[];
  agent: Agent | null;
}

export interface MissionDetailsResponse {
  mission: MissionTemplate;
  deployment?: MissionDeployment;
  agent?: {
    availableProxim8s: any[]; // TODO: Add Proxim8 type
    canDeploy: boolean;
  };
}

/**
 * Get missions with optional type filtering
 * @param type - Filter by mission type (training, timeline, critical, event) or 'all' for all types
 */
export async function getMissions(type: MissionType | 'all' = 'all'): Promise<MissionsResponse> {
  console.log('[getMissions] Fetching missions with type:', type);
  const response = await apiClient.get<MissionsApiResponse>(`/api/missions?type=${type}`);
  console.log('[getMissions] Response:', response);
  if (!response.success) {
    throw new Error('Failed to fetch missions');
  }
  return response.data;
}

/**
 * Get specific mission details with deployment info
 * @param missionId - The mission ID
 * @param type - Optional mission type hint for better performance
 */
export async function getMissionDetails(
  missionId: string, 
  type?: MissionType
): Promise<MissionDetailsResponse> {
  const url = type 
    ? `/api/missions/${missionId}?type=${type}`
    : `/api/missions/${missionId}`;
    
  const response = await apiClient.get<MissionDetailsApiResponse>(url);
  if (!response.success) {
    throw new Error('Failed to fetch mission details');
  }
  
  return {
    mission: response.data.mission,
    deployment: response.data.deployment || undefined,
    agent: response.data.agent ? {
      availableProxim8s: response.data.agent.availableProxim8s,
      canDeploy: response.data.agent.canDeploy
    } : undefined
  };
}

/**
 * Deploy a mission
 */
export async function deployMission(
  missionId: string,
  proxim8Id: string,
  approach: ApproachType,
  missionType?: MissionType,
  timelineNode?: string
): Promise<{ deployment: MissionDeployment; message: string }> {
  const response = await apiClient.post<{ success: boolean; data: { deployment: MissionDeployment; message: string } }>(
    `/api/missions/${missionId}/deploy`, 
    {
      proxim8Id,
      approach,
      missionType,
      timelineNode
    }
  );
  
  if (!response.success) {
    throw new Error('Failed to deploy mission');
  }
  return response.data;
}

/**
 * Get mission deployment status
 */
export async function getMissionStatus(deploymentId: string): Promise<MissionDeployment> {
  const response = await apiClient.get<{ success: boolean; data: MissionDeployment }>(
    `/api/missions/deployments/${deploymentId}/status`
  );
  
  if (!response.success) {
    throw new Error('Failed to fetch mission status');
  }
  return response.data;
}

/**
 * Get timeline overview for mission selection
 */
export async function getTimelineOverview(): Promise<any> {
  const response = await apiClient.get<any>('/api/missions/timeline');
  if (!response.success) {
    throw new Error('Failed to fetch timeline overview');
  }
  return response.data;
}