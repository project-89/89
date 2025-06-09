/**
 * Agent schema - Single source of truth for Agent data structure
 */

import { z } from 'zod';
import { PersonalityEnum } from './mission.schema';

// Proxim8 sub-schema
export const Proxim8Schema = z.object({
  nftId: z.string(),
  name: z.string(),
  personality: PersonalityEnum,
  experience: z.number().min(0).default(0),
  level: z.number().min(1).default(1),
  missionCount: z.number().min(0).default(0),
  successRate: z.number().min(0).max(100).default(0),
  specialization: z.string().optional(),
  currentMissionId: z.string().optional(),
  isDeployed: z.boolean().default(false),
});

// Achievement sub-schema
export const AchievementSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  unlockedAt: z.date(),
  rarity: z.enum(['common', 'rare', 'epic', 'legendary']),
});

// Agent rank enum
export const AgentRankEnum = z.enum(['recruit', 'operative', 'specialist', 'commander', 'legend']);

// Agent status enum
export const AgentStatusEnum = z.enum(['active', 'inactive', 'legendary']);

// Main Agent schema
export const AgentSchema = z.object({
  // Core identifiers
  agentId: z.string(),
  walletAddress: z.string(),
  userId: z.string(),
  
  // Agent profile
  codename: z.string(),
  joinedAt: z.date().default(() => new Date()),
  lastActiveAt: z.date().default(() => new Date()),
  status: AgentStatusEnum.default('active'),
  
  // Proxim8 management
  proxim8s: z.array(Proxim8Schema).default([]),
  
  // Progression tracking
  timelinePoints: z.number().min(0).default(100),
  totalMissionsDeployed: z.number().min(0).default(0),
  totalMissionsSucceeded: z.number().min(0).default(0),
  totalMissionsFailed: z.number().min(0).default(0),
  totalTimelineShift: z.number().default(0),
  
  // Rank and achievements
  rank: AgentRankEnum.default('recruit'),
  rankProgress: z.number().min(0).max(100).default(0),
  achievements: z.array(AchievementSchema).default([]),
  
  // Mission deployment tracking
  lastMissionDeployedAt: z.date().optional(),
  dailyMissionCount: z.number().min(0).default(0),
  
  // Timestamps
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
});

// Input schemas for API operations
export const CreateAgentInputSchema = z.object({
  walletAddress: z.string(),
  codename: z.string().min(3).max(30),
  proxim8s: z.array(z.object({
    nftId: z.string(),
    name: z.string(),
  })).optional(),
});

export const UpdateAgentInputSchema = z.object({
  codename: z.string().min(3).max(30).optional(),
  status: AgentStatusEnum.optional(),
});

// Type exports
export type Agent = z.infer<typeof AgentSchema>;
export type Proxim8 = z.infer<typeof Proxim8Schema>;
export type Achievement = z.infer<typeof AchievementSchema>;
export type AgentRank = z.infer<typeof AgentRankEnum>;
export type AgentStatus = z.infer<typeof AgentStatusEnum>;
export type CreateAgentInput = z.infer<typeof CreateAgentInputSchema>;
export type UpdateAgentInput = z.infer<typeof UpdateAgentInputSchema>;