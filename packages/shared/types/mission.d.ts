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
    duration: number;
    successRate: {
        min: number;
        max: number;
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
    challengeRating?: number;
    criticalPath?: boolean;
}
/**
 * Core mission template data
 * This is what comes from the server
 */
export interface MissionTemplate {
    missionId: string;
    id?: string;
    sequence: number;
    title: string;
    missionName?: string;
    date: string;
    location: string;
    description: string;
    imagePrompt: string;
    imageUrl?: string;
    duration: number;
    briefing: {
        text: string;
        currentBalance: number;
        threatLevel: 'low' | 'medium' | 'high' | 'critical';
    };
    approaches: MissionApproach[];
    compatibility: {
        preferred: string[];
        bonus: number;
        penalty: number;
    };
    phases: MissionPhase[];
    difficulty?: number;
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
    displayName: string;
    displayImageUrl: string;
    displayDuration: string;
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
