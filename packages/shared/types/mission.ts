/**
 * Shared mission types for client-server data consistency
 * This file defines the canonical data shapes for missions across the system
 */

/**
 * Mission approach configuration
 * Used for both training and timeline missions
 */
export interface MissionApproach {
  type: 'low' | 'medium' | 'high' | 'aggressive' | 'balanced' | 'cautious';
  name: string;
  description: string;
  duration: number; // milliseconds
  successRate: {
    min: number; // 0-1
    max: number; // 0-1
  };
  timelineShift: {
    min: number;
    max: number;
  };
  rewards?: {
    timelinePoints: number;
    experience: number;
    influenceMultiplier?: number;
  };
}

/**
 * Mission phase definition
 */
export interface MissionPhase {
  id: number;
  name: string;
  durationPercent: number;
  narrativeTemplates?: {
    success: string;
    failure: string;
  };
  description?: string;
  challengeRating?: number; // 1-10
  criticalPath?: boolean;
}

/**
 * Core mission template data
 * This is what comes from the server
 */
export interface MissionTemplate {
  // Identifiers
  missionId: string;
  id?: string; // Alias for missionId for backward compatibility
  sequence: number;
  
  // Basic info
  title: string;
  missionName?: string; // Alias for title for backward compatibility
  date: string;
  location: string;
  description: string;
  
  // Visual/content
  imagePrompt: string;
  imageUrl?: string; // Generated from imagePrompt
  
  // Timing
  duration: number; // milliseconds
  
  // Mission configuration
  briefing: {
    text: string;
    currentBalance: number;
    threatLevel: 'low' | 'medium' | 'high' | 'critical';
  };
  
  // Approaches configuration
  approaches: MissionApproach[];
  
  // Compatibility settings
  compatibility: {
    preferred: string[];
    bonus: number;
    penalty: number;
  };
  
  // Mission phases
  phases: MissionPhase[];
  
  // Additional metadata
  difficulty?: number; // 1-10
  category?: string;
  tags?: string[];
}

/**
 * User progress for a mission
 */
export interface MissionUserProgress {
  isUnlocked: boolean;
  isCompleted: boolean;
  isActive: boolean;
  completedAt: Date | null;
  successRate?: number;
  lastAttempt?: Date;
}

/**
 * Mission deployment state
 */
export interface MissionDeployment {
  deploymentId: string;
  missionId: string;
  agentId: string;
  proxim8Id: string;
  proxim8Name?: string;
  approach: string;
  status: 'active' | 'completed' | 'failed';
  deployedAt: Date;
  completesAt: Date;
  currentPhase: number;
  finalSuccessRate: number;
  phaseOutcomes?: any[];
  result?: any;
}

/**
 * Complete mission data with user context
 * This is what the client receives from API
 */
export interface MissionWithProgress extends MissionTemplate {
  userProgress: MissionUserProgress;
  deployment: MissionDeployment | null;
}

/**
 * Client-side mission display data
 * This extends the base template with UI-specific fields
 */
export interface ClientMission extends MissionWithProgress {
  // UI display fields
  displayName: string; // Resolved from title/missionName
  displayImageUrl: string; // Resolved from imageUrl/imagePrompt
  displayDuration: string; // Human-readable duration
  
  // Normalized approaches
  approachesMap: {
    low?: MissionApproach;
    medium?: MissionApproach;
    high?: MissionApproach;
  };
}

/**
 * Agent data shape
 */
export interface Agent {
  codename: string;
  rank: string;
  timelinePoints: number;
  availableProxim8s: number;
}

/**
 * API response shapes
 */
export interface MissionsApiResponse {
  success: boolean;
  data: {
    missions: MissionWithProgress[];
    agent: Agent | null;
  };
  error?: string;
}

export interface MissionDetailsApiResponse {
  success: boolean;
  data: {
    mission: MissionTemplate;
    deployment: MissionDeployment | null;
    agent: {
      availableProxim8s: any[];
      canDeploy: boolean;
    } | null;
  };
  error?: string;
}