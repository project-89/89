/**
 * Mission schemas using Zod for runtime validation and type generation
 * This is the single source of truth for mission data shapes
 */

import { z } from 'zod';

// Base enums
export const MissionPhaseEnum = z.enum([
  'available',
  'planning',
  'deploying',
  'in-progress',
  'completed',
  'failed'
]);

export const ApproachTypeEnum = z.enum(['low', 'medium', 'high']);
export const ThreatLevelEnum = z.enum(['low', 'medium', 'high', 'critical']);
export const PersonalityEnum = z.enum(['analytical', 'aggressive', 'diplomatic', 'adaptive']);

// Mission approach schema
export const MissionApproachSchema = z.object({
  type: ApproachTypeEnum,
  name: z.string(),
  description: z.string(),
  duration: z.number().optional(), // milliseconds - optional because it might inherit from mission
  successRate: z.object({
    min: z.number().min(0).max(1),
    max: z.number().min(0).max(1)
  }),
  timelineShift: z.object({
    min: z.number(),
    max: z.number()
  }),
  rewards: z.object({
    timelinePoints: z.number(),
    experience: z.number(),
    influenceMultiplier: z.number().optional()
  }).optional()
});

// Mission phase schema
export const MissionPhaseSchema = z.object({
  id: z.number(),
  name: z.string(),
  durationPercent: z.number(),
  narrativeTemplates: z.object({
    success: z.string(),
    failure: z.string()
  }),
  description: z.string().optional(),
  challengeRating: z.number().min(1).max(10).optional(),
  criticalPath: z.boolean().optional()
});

// Core mission template schema (what's stored in the database)
export const MissionTemplateSchema = z.object({
  // Identifiers
  missionId: z.string(),
  id: z.string().optional(), // Backward compatibility alias for missionId
  sequence: z.number(),
  
  // Display info
  title: z.string(),
  missionName: z.string().optional(), // Backward compatibility alias for title
  date: z.string(),
  location: z.string(),
  description: z.string(),
  
  // Visual
  imagePrompt: z.string(),
  imageUrl: z.string().optional(), // Generated or cached
  
  // Timing
  duration: z.number(), // milliseconds
  
  // Mission details
  briefing: z.object({
    text: z.string(),
    currentBalance: z.number().min(0).max(100),
    threatLevel: ThreatLevelEnum
  }),
  
  // Approaches - stored as array in DB
  approaches: z.array(MissionApproachSchema),
  
  // Compatibility
  compatibility: z.object({
    preferred: z.array(PersonalityEnum),
    bonus: z.number(),
    penalty: z.number()
  }),
  
  // Phases
  phases: z.array(MissionPhaseSchema),
  
  // Metadata
  difficulty: z.number().min(1).max(10).optional(),
  category: z.string().optional(),
  tags: z.array(z.string()).optional()
});

// User progress schema
export const MissionUserProgressSchema = z.object({
  isUnlocked: z.boolean(),
  isCompleted: z.boolean(),
  isActive: z.boolean(),
  completedAt: z.date().nullable(),
  successRate: z.number().optional(),
  lastAttempt: z.date().optional()
});

// Mission deployment schema
export const MissionDeploymentSchema = z.object({
  deploymentId: z.string(),
  missionId: z.string(),
  agentId: z.string(),
  proxim8Id: z.string(),
  proxim8Name: z.string().optional(),
  approach: z.string(),
  status: z.enum(['active', 'completed', 'failed', 'abandoned']),
  deployedAt: z.date(),
  completesAt: z.date(),
  currentPhase: z.number(),
  finalSuccessRate: z.number(),
  phaseOutcomes: z.array(z.any()).optional(),
  result: z.object({
    overallSuccess: z.boolean(),
    finalNarrative: z.string(),
    timelineShift: z.number(),
    rewards: z.object({
      timelinePoints: z.number(),
      experience: z.number(),
      loreFragments: z.array(z.string()),
      achievements: z.array(z.string())
    })
  }).optional()
});

// Mission with user progress (API response)
export const MissionWithProgressSchema = MissionTemplateSchema.extend({
  userProgress: MissionUserProgressSchema,
  deployment: MissionDeploymentSchema.nullable()
});

// Agent schema
export const AgentSchema = z.object({
  codename: z.string(),
  rank: z.string(),
  timelinePoints: z.number(),
  availableProxim8s: z.number()
});

// API Response schemas
export const MissionsApiResponseSchema = z.object({
  success: z.boolean(),
  data: z.object({
    missions: z.array(MissionWithProgressSchema),
    agent: AgentSchema.nullable()
  }),
  error: z.string().optional()
});

export const MissionDetailsApiResponseSchema = z.object({
  success: z.boolean(),
  data: z.object({
    mission: MissionTemplateSchema,
    deployment: MissionDeploymentSchema.nullable(),
    agent: z.object({
      availableProxim8s: z.array(z.any()),
      canDeploy: z.boolean()
    }).nullable()
  }),
  error: z.string().optional()
});

// Type exports - generated from schemas
export type MissionPhaseType = z.infer<typeof MissionPhaseEnum>;
export type ApproachType = z.infer<typeof ApproachTypeEnum>;
export type ThreatLevel = z.infer<typeof ThreatLevelEnum>;
export type Personality = z.infer<typeof PersonalityEnum>;
export type MissionApproach = z.infer<typeof MissionApproachSchema>;
export type MissionPhase = z.infer<typeof MissionPhaseSchema>;
export type MissionTemplate = z.infer<typeof MissionTemplateSchema>;
export type MissionUserProgress = z.infer<typeof MissionUserProgressSchema>;
export type MissionDeployment = z.infer<typeof MissionDeploymentSchema>;
export type MissionWithProgress = z.infer<typeof MissionWithProgressSchema>;
export type Agent = z.infer<typeof AgentSchema>;
export type MissionsApiResponse = z.infer<typeof MissionsApiResponseSchema>;
export type MissionDetailsApiResponse = z.infer<typeof MissionDetailsApiResponseSchema>;