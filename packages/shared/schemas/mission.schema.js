"use strict";
/**
 * Mission schemas using Zod for runtime validation and type generation
 * This is the single source of truth for mission data shapes
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.MissionDetailsApiResponseSchema = exports.MissionsApiResponseSchema = exports.AgentSchema = exports.MissionWithProgressSchema = exports.MissionDeploymentSchema = exports.MissionUserProgressSchema = exports.MissionTemplateSchema = exports.MissionPhaseSchema = exports.MissionApproachSchema = exports.PersonalityEnum = exports.ThreatLevelEnum = exports.ApproachTypeEnum = exports.MissionPhaseEnum = void 0;
const zod_1 = require("zod");
// Base enums
exports.MissionPhaseEnum = zod_1.z.enum([
    'available',
    'planning',
    'deploying',
    'in-progress',
    'completed',
    'failed'
]);
exports.ApproachTypeEnum = zod_1.z.enum(['low', 'medium', 'high']);
exports.ThreatLevelEnum = zod_1.z.enum(['low', 'medium', 'high', 'critical']);
exports.PersonalityEnum = zod_1.z.enum(['analytical', 'aggressive', 'diplomatic', 'adaptive']);
// Mission approach schema
exports.MissionApproachSchema = zod_1.z.object({
    type: exports.ApproachTypeEnum,
    name: zod_1.z.string(),
    description: zod_1.z.string(),
    duration: zod_1.z.number().optional(), // milliseconds - optional because it might inherit from mission
    successRate: zod_1.z.object({
        min: zod_1.z.number().min(0).max(1),
        max: zod_1.z.number().min(0).max(1)
    }),
    timelineShift: zod_1.z.object({
        min: zod_1.z.number(),
        max: zod_1.z.number()
    }),
    rewards: zod_1.z.object({
        timelinePoints: zod_1.z.number(),
        experience: zod_1.z.number(),
        influenceMultiplier: zod_1.z.number().optional()
    }).optional()
});
// Mission phase schema
exports.MissionPhaseSchema = zod_1.z.object({
    id: zod_1.z.number(),
    name: zod_1.z.string(),
    durationPercent: zod_1.z.number(),
    narrativeTemplates: zod_1.z.object({
        success: zod_1.z.string(),
        failure: zod_1.z.string()
    }),
    description: zod_1.z.string().optional(),
    challengeRating: zod_1.z.number().min(1).max(10).optional(),
    criticalPath: zod_1.z.boolean().optional()
});
// Core mission template schema (what's stored in the database)
exports.MissionTemplateSchema = zod_1.z.object({
    // Identifiers
    missionId: zod_1.z.string(),
    id: zod_1.z.string().optional(), // Backward compatibility alias for missionId
    sequence: zod_1.z.number(),
    // Display info
    title: zod_1.z.string(),
    missionName: zod_1.z.string().optional(), // Backward compatibility alias for title
    date: zod_1.z.string(),
    location: zod_1.z.string(),
    description: zod_1.z.string(),
    // Visual
    imagePrompt: zod_1.z.string(),
    imageUrl: zod_1.z.string().optional(), // Generated or cached
    // Timing
    duration: zod_1.z.number(), // milliseconds
    // Mission details
    briefing: zod_1.z.object({
        text: zod_1.z.string(),
        currentBalance: zod_1.z.number().min(0).max(100),
        threatLevel: exports.ThreatLevelEnum
    }),
    // Approaches - stored as array in DB
    approaches: zod_1.z.array(exports.MissionApproachSchema),
    // Compatibility
    compatibility: zod_1.z.object({
        preferred: zod_1.z.array(exports.PersonalityEnum),
        bonus: zod_1.z.number(),
        penalty: zod_1.z.number()
    }),
    // Phases
    phases: zod_1.z.array(exports.MissionPhaseSchema),
    // Metadata
    difficulty: zod_1.z.number().min(1).max(10).optional(),
    category: zod_1.z.string().optional(),
    tags: zod_1.z.array(zod_1.z.string()).optional()
});
// User progress schema
exports.MissionUserProgressSchema = zod_1.z.object({
    isUnlocked: zod_1.z.boolean(),
    isCompleted: zod_1.z.boolean(),
    isActive: zod_1.z.boolean(),
    completedAt: zod_1.z.date().nullable(),
    successRate: zod_1.z.number().optional(),
    lastAttempt: zod_1.z.date().optional()
});
// Mission deployment schema
exports.MissionDeploymentSchema = zod_1.z.object({
    deploymentId: zod_1.z.string(),
    missionId: zod_1.z.string(),
    agentId: zod_1.z.string(),
    proxim8Id: zod_1.z.string(),
    proxim8Name: zod_1.z.string().optional(),
    approach: zod_1.z.string(),
    status: zod_1.z.enum(['active', 'completed', 'failed', 'abandoned']),
    deployedAt: zod_1.z.date(),
    completesAt: zod_1.z.date(),
    currentPhase: zod_1.z.number(),
    finalSuccessRate: zod_1.z.number(),
    phaseOutcomes: zod_1.z.array(zod_1.z.any()).optional(),
    result: zod_1.z.object({
        overallSuccess: zod_1.z.boolean(),
        finalNarrative: zod_1.z.string(),
        timelineShift: zod_1.z.number(),
        rewards: zod_1.z.object({
            timelinePoints: zod_1.z.number(),
            experience: zod_1.z.number(),
            loreFragments: zod_1.z.array(zod_1.z.string()),
            achievements: zod_1.z.array(zod_1.z.string())
        })
    }).optional()
});
// Mission with user progress (API response)
exports.MissionWithProgressSchema = exports.MissionTemplateSchema.extend({
    userProgress: exports.MissionUserProgressSchema,
    deployment: exports.MissionDeploymentSchema.nullable()
});
// Agent schema
exports.AgentSchema = zod_1.z.object({
    codename: zod_1.z.string(),
    rank: zod_1.z.string(),
    timelinePoints: zod_1.z.number(),
    availableProxim8s: zod_1.z.number()
});
// API Response schemas
exports.MissionsApiResponseSchema = zod_1.z.object({
    success: zod_1.z.boolean(),
    data: zod_1.z.object({
        missions: zod_1.z.array(exports.MissionWithProgressSchema),
        agent: exports.AgentSchema.nullable()
    }),
    error: zod_1.z.string().optional()
});
exports.MissionDetailsApiResponseSchema = zod_1.z.object({
    success: zod_1.z.boolean(),
    data: zod_1.z.object({
        mission: exports.MissionTemplateSchema,
        deployment: exports.MissionDeploymentSchema.nullable(),
        agent: zod_1.z.object({
            availableProxim8s: zod_1.z.array(zod_1.z.any()),
            canDeploy: zod_1.z.boolean()
        }).nullable()
    }),
    error: zod_1.z.string().optional()
});
//# sourceMappingURL=mission.schema.js.map