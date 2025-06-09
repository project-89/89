/**
 * Mission data transformers
 * Ensures consistent data shapes between server storage and client consumption
 */

import type { 
  MissionTemplate, 
  MissionWithProgress, 
  MissionApproach,
  ClientMission 
} from '@proxim8/shared/types/mission';

/**
 * Transform raw training mission data to standardized MissionTemplate
 */
export function transformRawMissionToTemplate(rawMission: any): MissionTemplate {
  // Map approaches array to standardized format
  const approaches: MissionApproach[] = rawMission.approaches.map((approach: any) => ({
    type: approach.type,
    name: approach.name,
    description: approach.description,
    duration: approach.duration || rawMission.duration, // Use mission duration if not specified
    successRate: {
      min: approach.successRate.min,
      max: approach.successRate.max
    },
    timelineShift: {
      min: approach.timelineShift?.min || 0,
      max: approach.timelineShift?.max || 0
    },
    rewards: approach.rewards
  }));

  return {
    // Core identifiers
    missionId: rawMission.missionId,
    id: rawMission.missionId, // Backward compatibility
    sequence: rawMission.sequence,
    
    // Display fields
    title: rawMission.title,
    missionName: rawMission.title, // Client expects missionName
    date: rawMission.date,
    location: rawMission.location,
    description: rawMission.description,
    
    // Visual content
    imagePrompt: rawMission.imagePrompt,
    imageUrl: generateImageUrl(rawMission.imagePrompt), // Generate from prompt
    
    // Timing
    duration: rawMission.duration,
    
    // Mission data
    briefing: rawMission.briefing,
    approaches,
    compatibility: rawMission.compatibility,
    phases: rawMission.phases,
    
    // Additional metadata
    difficulty: rawMission.difficulty || calculateDifficulty(approaches),
    category: rawMission.category || 'training',
    tags: rawMission.tags || []
  };
}

/**
 * Transform mission with user progress for API response
 */
export function transformMissionWithProgress(
  rawMission: any, 
  deployment: any | null,
  agent: any | null
): MissionWithProgress {
  const template = transformRawMissionToTemplate(rawMission);
  
  return {
    ...template,
    userProgress: rawMission.userProgress || {
      isUnlocked: true,
      isCompleted: false,
      isActive: false,
      completedAt: null,
      successRate: undefined,
      lastAttempt: undefined
    },
    deployment: deployment ? {
      ...deployment,
      proxim8Name: deployment.proxim8Name || 
        agent?.proxim8s?.find((p: any) => p.nftId === deployment.proxim8Id)?.name
    } : null
  };
}

/**
 * Transform mission list for client consumption
 */
export function transformMissionListForClient(
  missions: any[],
  deployments: any[],
  agent: any | null
): MissionWithProgress[] {
  return missions.map(mission => {
    const deployment = deployments.find(d => d.missionId === mission.missionId);
    
    const template = transformRawMissionToTemplate(mission);
    
    // Calculate user progress
    const userProgress = {
      isUnlocked: canUserAccessMission(mission.missionId, deployments),
      isCompleted: deployment?.status === 'completed',
      isActive: deployment?.status === 'active',
      completedAt: deployment?.result ? deployment.updatedAt : null,
      successRate: deployment?.result?.overallSuccess,
      lastAttempt: deployment?.deployedAt
    };
    
    return {
      ...template,
      userProgress,
      deployment: deployment ? {
        ...(deployment as any).getClientState?.() || deployment,
        approach: deployment.approach,
        proxim8Id: deployment.proxim8Id,
        proxim8Name: agent?.proxim8s?.find(
          (p: any) => p.nftId === deployment.proxim8Id
        )?.name,
        finalSuccessRate: deployment.finalSuccessRate
      } : null
    };
  });
}

/**
 * Create a client-ready mission with all display fields
 */
export function createClientMission(mission: MissionWithProgress): ClientMission {
  // Create approaches map for easy access
  const approachesMap: any = {};
  mission.approaches.forEach(approach => {
    approachesMap[approach.type] = approach;
  });
  
  return {
    ...mission,
    displayName: mission.title || mission.missionName || 'Unknown Mission',
    displayImageUrl: mission.imageUrl || generateImageUrl(mission.imagePrompt),
    displayDuration: formatDuration(mission.duration),
    approachesMap
  };
}

// Helper functions

function generateImageUrl(imagePrompt: string): string {
  // Use the existing background images in the public folder
  // Generate a consistent hash from the prompt to deterministically select a background
  const hash = imagePrompt.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const backgroundNumber = (hash % 19) + 1;
  
  // Return the path to the background image directly - no API call needed
  return `/background-${backgroundNumber}.png`;
}

function calculateDifficulty(approaches: MissionApproach[]): number {
  // Calculate difficulty based on average success rates
  const avgSuccessRate = approaches.reduce((sum, approach) => {
    return sum + (approach.successRate.min + approach.successRate.max) / 2;
  }, 0) / approaches.length;
  
  // Invert success rate to get difficulty (1-10 scale)
  return Math.round((1 - avgSuccessRate) * 10);
}

function formatDuration(milliseconds: number): string {
  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  } else {
    return `${seconds}s`;
  }
}

function canUserAccessMission(missionId: string, deployments: any[]): boolean {
  if (!missionId || typeof missionId !== 'string') {
    return false;
  }

  const parts = missionId.split('_');
  if (parts.length < 2) {
    return false;
  }

  const missionNumber = parseInt(parts[1]);

  // First mission is always unlocked
  if (missionNumber === 1) return true;

  // Check if previous mission is completed
  const previousMissionId = `training_${String(missionNumber - 1).padStart(3, '0')}`;
  const previousDeployment = deployments.find(
    d => d.missionId === previousMissionId
  );

  return previousDeployment?.status === 'completed';
}