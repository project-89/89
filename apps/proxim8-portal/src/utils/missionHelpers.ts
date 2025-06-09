/**
 * Mission helper utilities
 * Provides convenient methods for working with mission data
 */

import type { MissionTemplate, MissionApproach, ApproachType } from '@proxim8/shared';

/**
 * Get a specific approach from a mission by type
 */
export function getMissionApproach(
  mission: MissionTemplate, 
  type: ApproachType
): MissionApproach | undefined {
  return mission.approaches.find(approach => approach.type === type);
}

/**
 * Get approaches as a map for easier access
 */
export function getApproachesMap(mission: MissionTemplate): Record<ApproachType, MissionApproach> {
  const map: Partial<Record<ApproachType, MissionApproach>> = {};
  
  for (const approach of mission.approaches) {
    map[approach.type] = approach;
  }
  
  return map as Record<ApproachType, MissionApproach>;
}

/**
 * Format duration in milliseconds to human-readable string
 */
export function formatDuration(milliseconds: number): string {
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
 * Get raw duration in milliseconds for a mission
 */
export function getMissionDurationMs(mission: MissionTemplate): number {
  // Try to get from medium approach first (most common)
  const mediumApproach = getMissionApproach(mission, 'medium');
  return mediumApproach?.duration || mission.duration;
}

/**
 * Get display duration for a mission
 */
export function getMissionDuration(mission: MissionTemplate): string {
  return formatDuration(getMissionDurationMs(mission));
}

/**
 * Get duration in seconds
 */
export function getMissionDurationSeconds(mission: MissionTemplate): number {
  return Math.floor(getMissionDurationMs(mission) / 1000);
}

/**
 * Calculate difficulty from approaches
 */
export function calculateDifficulty(mission: MissionTemplate): number {
  if (mission.difficulty) return mission.difficulty;
  
  const approaches = mission.approaches;
  if (approaches.length === 0) return 5;
  
  // Average the success rates
  const avgSuccessRate = approaches.reduce((sum, approach) => {
    const avg = (approach.successRate.min + approach.successRate.max) / 2;
    return sum + avg;
  }, 0) / approaches.length;
  
  // Convert to 1-10 difficulty scale
  return Math.round((1 - avgSuccessRate) * 10);
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
 * Calculate impact percentage from timeline shift
 */
export function calculateImpact(mission: MissionTemplate, approachType?: ApproachType): number {
  const approach = approachType 
    ? getMissionApproach(mission, approachType)
    : getMissionApproach(mission, 'medium');
  
  if (!approach) return 0;
  
  // Impact is roughly 2x the max timeline shift
  return Math.round(approach.timelineShift.max * 2);
}

/**
 * Get rewards for a specific approach
 */
export function getApproachRewards(mission: MissionTemplate, approachType: ApproachType) {
  const approach = getMissionApproach(mission, approachType);
  
  return approach?.rewards || {
    timelinePoints: 100,
    experience: 50
  };
}

/**
 * Generate a placeholder image URL from prompt
 */
export function generateImageUrl(prompt: string): string {
  // For now, use sequence-based backgrounds
  const hash = prompt.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const backgroundNumber = (hash % 19) + 1;
  return `/background-${backgroundNumber}.png`;
}

/**
 * Get display-ready image URL
 */
export function getMissionImageUrl(mission: MissionTemplate): string {
  return mission.imageUrl || generateImageUrl(mission.imagePrompt);
}