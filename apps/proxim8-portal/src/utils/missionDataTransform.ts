/**
 * Client-side mission data transformations
 * Ensures UI components have all the display data they need
 */

import type { 
  MissionWithProgress, 
  ClientMission,
  MissionApproach 
} from '../../../shared/types/mission';
import type { TrainingMission } from '@/lib/api/missions';

/**
 * Transform API mission data to client-ready format
 * This handles any remaining data issues and provides display-ready values
 */
export function transformMissionToClient(mission: MissionWithProgress | TrainingMission): ClientMission {
  // Ensure we have all required fields with proper fallbacks
  const title = mission.title || (mission as any).missionName || 'Unknown Mission';
  const missionName = (mission as any).missionName || mission.title || 'Unknown Mission';
  
  // Generate image URL if missing
  const imageUrl = (mission as any).imageUrl || 
    mission.imageUrl || 
    generateImageUrl((mission as any).imagePrompt || title);
  
  // Ensure approaches are in the expected format
  const approaches = normalizeApproaches(mission.approaches);
  const approachesMap = createApproachesMap(approaches);
  
  // Calculate display values
  const displayDuration = calculateDisplayDuration(mission, approachesMap);
  const difficulty = calculateDifficulty(approaches);
  const rewards = calculateRewards(approachesMap);
  
  return {
    // Spread the base mission data
    ...mission as MissionWithProgress,
    
    // Ensure all required fields exist
    title,
    missionName,
    imageUrl,
    
    // Add display-specific fields
    displayName: missionName,
    displayImageUrl: imageUrl,
    displayDuration,
    approachesMap,
    
    // Add calculated values
    difficulty: mission.difficulty || difficulty,
    
    // Ensure approaches array exists
    approaches,
    
    // Add any missing metadata
    tags: mission.tags || [],
    category: mission.category || 'training',
  };
}

/**
 * Normalize approaches to ensure consistent structure
 */
function normalizeApproaches(approaches: any): MissionApproach[] {
  // Handle both array and object formats
  if (Array.isArray(approaches)) {
    return approaches.map(normalizeApproach);
  }
  
  // Convert object format to array
  const approachTypes = ['low', 'medium', 'high'];
  const result: MissionApproach[] = [];
  
  for (const type of approachTypes) {
    if (approaches[type]) {
      result.push(normalizeApproach({
        ...approaches[type],
        type
      }));
    }
  }
  
  return result;
}

/**
 * Normalize a single approach
 */
function normalizeApproach(approach: any): MissionApproach {
  return {
    type: approach.type,
    name: approach.name || capitalizeType(approach.type),
    description: approach.description || '',
    duration: approach.duration || 60000, // Default 60 seconds
    successRate: {
      min: approach.successRate?.min || approach.baseSuccessRate || 0.5,
      max: approach.successRate?.max || approach.baseSuccessRate || 0.7
    },
    timelineShift: {
      min: approach.timelineShift?.min || 1,
      max: approach.timelineShift?.max || 3
    },
    rewards: approach.rewards || {
      timelinePoints: 100,
      experience: 50
    }
  };
}

/**
 * Create approaches map for easy access
 */
function createApproachesMap(approaches: MissionApproach[]): Record<string, MissionApproach> {
  const map: Record<string, MissionApproach> = {};
  
  for (const approach of approaches) {
    map[approach.type] = approach;
  }
  
  return map;
}

/**
 * Calculate display duration from mission data
 */
function calculateDisplayDuration(mission: any, approachesMap: Record<string, MissionApproach>): string {
  // Try to get duration from medium approach first
  const duration = approachesMap.medium?.duration || 
    approachesMap.low?.duration ||
    approachesMap.high?.duration ||
    mission.duration ||
    60000; // Default 60 seconds
  
  return formatDuration(duration);
}

/**
 * Format duration in milliseconds to human-readable string
 */
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

/**
 * Calculate difficulty from approaches
 */
function calculateDifficulty(approaches: MissionApproach[]): number {
  if (approaches.length === 0) return 5; // Default medium difficulty
  
  // Average the success rates
  const avgSuccessRate = approaches.reduce((sum, approach) => {
    const avg = (approach.successRate.min + approach.successRate.max) / 2;
    return sum + avg;
  }, 0) / approaches.length;
  
  // Convert to 1-10 difficulty scale (lower success = higher difficulty)
  return Math.round((1 - avgSuccessRate) * 10);
}

/**
 * Calculate average rewards
 */
function calculateRewards(approachesMap: Record<string, MissionApproach>): {
  timelinePoints: number;
  experience: number;
} {
  const approaches = Object.values(approachesMap);
  if (approaches.length === 0) {
    return { timelinePoints: 100, experience: 50 };
  }
  
  const totalPoints = approaches.reduce((sum, a) => sum + (a.rewards?.timelinePoints || 100), 0);
  const totalExp = approaches.reduce((sum, a) => sum + (a.rewards?.experience || 50), 0);
  
  return {
    timelinePoints: Math.round(totalPoints / approaches.length),
    experience: Math.round(totalExp / approaches.length)
  };
}

/**
 * Generate a placeholder image URL
 */
function generateImageUrl(prompt: string): string {
  // For now, use sequence-based backgrounds
  const hash = prompt.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const backgroundNumber = (hash % 19) + 1;
  return `/background-${backgroundNumber}.png`;
}

/**
 * Capitalize approach type
 */
function capitalizeType(type: string): string {
  return type.charAt(0).toUpperCase() + type.slice(1);
}

/**
 * Get difficulty display text
 */
export function getDifficultyText(difficulty: number): string {
  if (difficulty <= 3) return 'LOW';
  if (difficulty <= 6) return 'MEDIUM';
  if (difficulty <= 8) return 'HIGH';
  return 'EXTREME';
}

/**
 * Get threat level from difficulty
 */
export function getThreatLevel(difficulty: number): 'low' | 'medium' | 'high' | 'critical' {
  if (difficulty <= 3) return 'low';
  if (difficulty <= 6) return 'medium';
  if (difficulty <= 8) return 'high';
  return 'critical';
}