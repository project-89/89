/**
 * Mission schemas using Zod for runtime validation and type generation
 * This is the single source of truth for mission data shapes
 */
import { z } from 'zod';
export declare const MissionPhaseEnum: z.ZodEnum<["available", "planning", "deploying", "in-progress", "completed", "failed"]>;
export declare const ApproachTypeEnum: z.ZodEnum<["low", "medium", "high"]>;
export declare const ThreatLevelEnum: z.ZodEnum<["low", "medium", "high", "critical"]>;
export declare const PersonalityEnum: z.ZodEnum<["analytical", "aggressive", "diplomatic", "adaptive"]>;
export declare const MissionApproachSchema: z.ZodObject<{
    type: z.ZodEnum<["low", "medium", "high"]>;
    name: z.ZodString;
    description: z.ZodString;
    duration: z.ZodOptional<z.ZodNumber>;
    successRate: z.ZodObject<{
        min: z.ZodNumber;
        max: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        min: number;
        max: number;
    }, {
        min: number;
        max: number;
    }>;
    timelineShift: z.ZodObject<{
        min: z.ZodNumber;
        max: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        min: number;
        max: number;
    }, {
        min: number;
        max: number;
    }>;
    rewards: z.ZodOptional<z.ZodObject<{
        timelinePoints: z.ZodNumber;
        experience: z.ZodNumber;
        influenceMultiplier: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        timelinePoints: number;
        experience: number;
        influenceMultiplier?: number | undefined;
    }, {
        timelinePoints: number;
        experience: number;
        influenceMultiplier?: number | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    type: "low" | "medium" | "high";
    description: string;
    name: string;
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
        influenceMultiplier?: number | undefined;
    } | undefined;
    duration?: number | undefined;
}, {
    type: "low" | "medium" | "high";
    description: string;
    name: string;
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
        influenceMultiplier?: number | undefined;
    } | undefined;
    duration?: number | undefined;
}>;
export declare const MissionPhaseSchema: z.ZodObject<{
    id: z.ZodNumber;
    name: z.ZodString;
    durationPercent: z.ZodNumber;
    narrativeTemplates: z.ZodObject<{
        success: z.ZodString;
        failure: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        success: string;
        failure: string;
    }, {
        success: string;
        failure: string;
    }>;
    description: z.ZodOptional<z.ZodString>;
    challengeRating: z.ZodOptional<z.ZodNumber>;
    criticalPath: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    id: number;
    name: string;
    durationPercent: number;
    narrativeTemplates: {
        success: string;
        failure: string;
    };
    description?: string | undefined;
    challengeRating?: number | undefined;
    criticalPath?: boolean | undefined;
}, {
    id: number;
    name: string;
    durationPercent: number;
    narrativeTemplates: {
        success: string;
        failure: string;
    };
    description?: string | undefined;
    challengeRating?: number | undefined;
    criticalPath?: boolean | undefined;
}>;
export declare const MissionTemplateSchema: z.ZodObject<{
    missionId: z.ZodString;
    id: z.ZodOptional<z.ZodString>;
    sequence: z.ZodNumber;
    title: z.ZodString;
    missionName: z.ZodOptional<z.ZodString>;
    date: z.ZodString;
    location: z.ZodString;
    description: z.ZodString;
    imagePrompt: z.ZodString;
    imageUrl: z.ZodOptional<z.ZodString>;
    duration: z.ZodNumber;
    briefing: z.ZodObject<{
        text: z.ZodString;
        currentBalance: z.ZodNumber;
        threatLevel: z.ZodEnum<["low", "medium", "high", "critical"]>;
    }, "strip", z.ZodTypeAny, {
        text: string;
        currentBalance: number;
        threatLevel: "low" | "medium" | "high" | "critical";
    }, {
        text: string;
        currentBalance: number;
        threatLevel: "low" | "medium" | "high" | "critical";
    }>;
    approaches: z.ZodArray<z.ZodObject<{
        type: z.ZodEnum<["low", "medium", "high"]>;
        name: z.ZodString;
        description: z.ZodString;
        duration: z.ZodOptional<z.ZodNumber>;
        successRate: z.ZodObject<{
            min: z.ZodNumber;
            max: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            min: number;
            max: number;
        }, {
            min: number;
            max: number;
        }>;
        timelineShift: z.ZodObject<{
            min: z.ZodNumber;
            max: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            min: number;
            max: number;
        }, {
            min: number;
            max: number;
        }>;
        rewards: z.ZodOptional<z.ZodObject<{
            timelinePoints: z.ZodNumber;
            experience: z.ZodNumber;
            influenceMultiplier: z.ZodOptional<z.ZodNumber>;
        }, "strip", z.ZodTypeAny, {
            timelinePoints: number;
            experience: number;
            influenceMultiplier?: number | undefined;
        }, {
            timelinePoints: number;
            experience: number;
            influenceMultiplier?: number | undefined;
        }>>;
    }, "strip", z.ZodTypeAny, {
        type: "low" | "medium" | "high";
        description: string;
        name: string;
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
            influenceMultiplier?: number | undefined;
        } | undefined;
        duration?: number | undefined;
    }, {
        type: "low" | "medium" | "high";
        description: string;
        name: string;
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
            influenceMultiplier?: number | undefined;
        } | undefined;
        duration?: number | undefined;
    }>, "many">;
    compatibility: z.ZodObject<{
        preferred: z.ZodArray<z.ZodEnum<["analytical", "aggressive", "diplomatic", "adaptive"]>, "many">;
        bonus: z.ZodNumber;
        penalty: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        preferred: ("analytical" | "adaptive" | "aggressive" | "diplomatic")[];
        bonus: number;
        penalty: number;
    }, {
        preferred: ("analytical" | "adaptive" | "aggressive" | "diplomatic")[];
        bonus: number;
        penalty: number;
    }>;
    phases: z.ZodArray<z.ZodObject<{
        id: z.ZodNumber;
        name: z.ZodString;
        durationPercent: z.ZodNumber;
        narrativeTemplates: z.ZodObject<{
            success: z.ZodString;
            failure: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            success: string;
            failure: string;
        }, {
            success: string;
            failure: string;
        }>;
        description: z.ZodOptional<z.ZodString>;
        challengeRating: z.ZodOptional<z.ZodNumber>;
        criticalPath: z.ZodOptional<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        id: number;
        name: string;
        durationPercent: number;
        narrativeTemplates: {
            success: string;
            failure: string;
        };
        description?: string | undefined;
        challengeRating?: number | undefined;
        criticalPath?: boolean | undefined;
    }, {
        id: number;
        name: string;
        durationPercent: number;
        narrativeTemplates: {
            success: string;
            failure: string;
        };
        description?: string | undefined;
        challengeRating?: number | undefined;
        criticalPath?: boolean | undefined;
    }>, "many">;
    difficulty: z.ZodOptional<z.ZodNumber>;
    category: z.ZodOptional<z.ZodString>;
    tags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    date: string;
    title: string;
    description: string;
    duration: number;
    missionId: string;
    sequence: number;
    location: string;
    imagePrompt: string;
    briefing: {
        text: string;
        currentBalance: number;
        threatLevel: "low" | "medium" | "high" | "critical";
    };
    approaches: {
        type: "low" | "medium" | "high";
        description: string;
        name: string;
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
            influenceMultiplier?: number | undefined;
        } | undefined;
        duration?: number | undefined;
    }[];
    compatibility: {
        preferred: ("analytical" | "adaptive" | "aggressive" | "diplomatic")[];
        bonus: number;
        penalty: number;
    };
    phases: {
        id: number;
        name: string;
        durationPercent: number;
        narrativeTemplates: {
            success: string;
            failure: string;
        };
        description?: string | undefined;
        challengeRating?: number | undefined;
        criticalPath?: boolean | undefined;
    }[];
    imageUrl?: string | undefined;
    id?: string | undefined;
    tags?: string[] | undefined;
    missionName?: string | undefined;
    difficulty?: number | undefined;
    category?: string | undefined;
}, {
    date: string;
    title: string;
    description: string;
    duration: number;
    missionId: string;
    sequence: number;
    location: string;
    imagePrompt: string;
    briefing: {
        text: string;
        currentBalance: number;
        threatLevel: "low" | "medium" | "high" | "critical";
    };
    approaches: {
        type: "low" | "medium" | "high";
        description: string;
        name: string;
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
            influenceMultiplier?: number | undefined;
        } | undefined;
        duration?: number | undefined;
    }[];
    compatibility: {
        preferred: ("analytical" | "adaptive" | "aggressive" | "diplomatic")[];
        bonus: number;
        penalty: number;
    };
    phases: {
        id: number;
        name: string;
        durationPercent: number;
        narrativeTemplates: {
            success: string;
            failure: string;
        };
        description?: string | undefined;
        challengeRating?: number | undefined;
        criticalPath?: boolean | undefined;
    }[];
    imageUrl?: string | undefined;
    id?: string | undefined;
    tags?: string[] | undefined;
    missionName?: string | undefined;
    difficulty?: number | undefined;
    category?: string | undefined;
}>;
export declare const MissionUserProgressSchema: z.ZodObject<{
    isUnlocked: z.ZodBoolean;
    isCompleted: z.ZodBoolean;
    isActive: z.ZodBoolean;
    completedAt: z.ZodNullable<z.ZodDate>;
    successRate: z.ZodOptional<z.ZodNumber>;
    lastAttempt: z.ZodOptional<z.ZodDate>;
}, "strip", z.ZodTypeAny, {
    isUnlocked: boolean;
    isCompleted: boolean;
    isActive: boolean;
    completedAt: Date | null;
    successRate?: number | undefined;
    lastAttempt?: Date | undefined;
}, {
    isUnlocked: boolean;
    isCompleted: boolean;
    isActive: boolean;
    completedAt: Date | null;
    successRate?: number | undefined;
    lastAttempt?: Date | undefined;
}>;
export declare const MissionDeploymentSchema: z.ZodObject<{
    deploymentId: z.ZodString;
    missionId: z.ZodString;
    agentId: z.ZodString;
    proxim8Id: z.ZodString;
    proxim8Name: z.ZodOptional<z.ZodString>;
    approach: z.ZodString;
    status: z.ZodEnum<["active", "completed", "failed", "abandoned"]>;
    deployedAt: z.ZodDate;
    completesAt: z.ZodDate;
    currentPhase: z.ZodNumber;
    finalSuccessRate: z.ZodNumber;
    phaseOutcomes: z.ZodOptional<z.ZodArray<z.ZodAny, "many">>;
    result: z.ZodOptional<z.ZodObject<{
        overallSuccess: z.ZodBoolean;
        finalNarrative: z.ZodString;
        timelineShift: z.ZodNumber;
        rewards: z.ZodObject<{
            timelinePoints: z.ZodNumber;
            experience: z.ZodNumber;
            loreFragments: z.ZodArray<z.ZodString, "many">;
            achievements: z.ZodArray<z.ZodString, "many">;
        }, "strip", z.ZodTypeAny, {
            timelinePoints: number;
            experience: number;
            loreFragments: string[];
            achievements: string[];
        }, {
            timelinePoints: number;
            experience: number;
            loreFragments: string[];
            achievements: string[];
        }>;
    }, "strip", z.ZodTypeAny, {
        rewards: {
            timelinePoints: number;
            experience: number;
            loreFragments: string[];
            achievements: string[];
        };
        timelineShift: number;
        overallSuccess: boolean;
        finalNarrative: string;
    }, {
        rewards: {
            timelinePoints: number;
            experience: number;
            loreFragments: string[];
            achievements: string[];
        };
        timelineShift: number;
        overallSuccess: boolean;
        finalNarrative: string;
    }>>;
}, "strip", z.ZodTypeAny, {
    deploymentId: string;
    status: "completed" | "failed" | "active" | "abandoned";
    missionId: string;
    agentId: string;
    proxim8Id: string;
    approach: string;
    deployedAt: Date;
    completesAt: Date;
    currentPhase: number;
    finalSuccessRate: number;
    result?: {
        rewards: {
            timelinePoints: number;
            experience: number;
            loreFragments: string[];
            achievements: string[];
        };
        timelineShift: number;
        overallSuccess: boolean;
        finalNarrative: string;
    } | undefined;
    proxim8Name?: string | undefined;
    phaseOutcomes?: any[] | undefined;
}, {
    deploymentId: string;
    status: "completed" | "failed" | "active" | "abandoned";
    missionId: string;
    agentId: string;
    proxim8Id: string;
    approach: string;
    deployedAt: Date;
    completesAt: Date;
    currentPhase: number;
    finalSuccessRate: number;
    result?: {
        rewards: {
            timelinePoints: number;
            experience: number;
            loreFragments: string[];
            achievements: string[];
        };
        timelineShift: number;
        overallSuccess: boolean;
        finalNarrative: string;
    } | undefined;
    proxim8Name?: string | undefined;
    phaseOutcomes?: any[] | undefined;
}>;
export declare const MissionWithProgressSchema: z.ZodObject<{
    missionId: z.ZodString;
    id: z.ZodOptional<z.ZodString>;
    sequence: z.ZodNumber;
    title: z.ZodString;
    missionName: z.ZodOptional<z.ZodString>;
    date: z.ZodString;
    location: z.ZodString;
    description: z.ZodString;
    imagePrompt: z.ZodString;
    imageUrl: z.ZodOptional<z.ZodString>;
    duration: z.ZodNumber;
    briefing: z.ZodObject<{
        text: z.ZodString;
        currentBalance: z.ZodNumber;
        threatLevel: z.ZodEnum<["low", "medium", "high", "critical"]>;
    }, "strip", z.ZodTypeAny, {
        text: string;
        currentBalance: number;
        threatLevel: "low" | "medium" | "high" | "critical";
    }, {
        text: string;
        currentBalance: number;
        threatLevel: "low" | "medium" | "high" | "critical";
    }>;
    approaches: z.ZodArray<z.ZodObject<{
        type: z.ZodEnum<["low", "medium", "high"]>;
        name: z.ZodString;
        description: z.ZodString;
        duration: z.ZodOptional<z.ZodNumber>;
        successRate: z.ZodObject<{
            min: z.ZodNumber;
            max: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            min: number;
            max: number;
        }, {
            min: number;
            max: number;
        }>;
        timelineShift: z.ZodObject<{
            min: z.ZodNumber;
            max: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            min: number;
            max: number;
        }, {
            min: number;
            max: number;
        }>;
        rewards: z.ZodOptional<z.ZodObject<{
            timelinePoints: z.ZodNumber;
            experience: z.ZodNumber;
            influenceMultiplier: z.ZodOptional<z.ZodNumber>;
        }, "strip", z.ZodTypeAny, {
            timelinePoints: number;
            experience: number;
            influenceMultiplier?: number | undefined;
        }, {
            timelinePoints: number;
            experience: number;
            influenceMultiplier?: number | undefined;
        }>>;
    }, "strip", z.ZodTypeAny, {
        type: "low" | "medium" | "high";
        description: string;
        name: string;
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
            influenceMultiplier?: number | undefined;
        } | undefined;
        duration?: number | undefined;
    }, {
        type: "low" | "medium" | "high";
        description: string;
        name: string;
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
            influenceMultiplier?: number | undefined;
        } | undefined;
        duration?: number | undefined;
    }>, "many">;
    compatibility: z.ZodObject<{
        preferred: z.ZodArray<z.ZodEnum<["analytical", "aggressive", "diplomatic", "adaptive"]>, "many">;
        bonus: z.ZodNumber;
        penalty: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        preferred: ("analytical" | "adaptive" | "aggressive" | "diplomatic")[];
        bonus: number;
        penalty: number;
    }, {
        preferred: ("analytical" | "adaptive" | "aggressive" | "diplomatic")[];
        bonus: number;
        penalty: number;
    }>;
    phases: z.ZodArray<z.ZodObject<{
        id: z.ZodNumber;
        name: z.ZodString;
        durationPercent: z.ZodNumber;
        narrativeTemplates: z.ZodObject<{
            success: z.ZodString;
            failure: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            success: string;
            failure: string;
        }, {
            success: string;
            failure: string;
        }>;
        description: z.ZodOptional<z.ZodString>;
        challengeRating: z.ZodOptional<z.ZodNumber>;
        criticalPath: z.ZodOptional<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        id: number;
        name: string;
        durationPercent: number;
        narrativeTemplates: {
            success: string;
            failure: string;
        };
        description?: string | undefined;
        challengeRating?: number | undefined;
        criticalPath?: boolean | undefined;
    }, {
        id: number;
        name: string;
        durationPercent: number;
        narrativeTemplates: {
            success: string;
            failure: string;
        };
        description?: string | undefined;
        challengeRating?: number | undefined;
        criticalPath?: boolean | undefined;
    }>, "many">;
    difficulty: z.ZodOptional<z.ZodNumber>;
    category: z.ZodOptional<z.ZodString>;
    tags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
} & {
    userProgress: z.ZodObject<{
        isUnlocked: z.ZodBoolean;
        isCompleted: z.ZodBoolean;
        isActive: z.ZodBoolean;
        completedAt: z.ZodNullable<z.ZodDate>;
        successRate: z.ZodOptional<z.ZodNumber>;
        lastAttempt: z.ZodOptional<z.ZodDate>;
    }, "strip", z.ZodTypeAny, {
        isUnlocked: boolean;
        isCompleted: boolean;
        isActive: boolean;
        completedAt: Date | null;
        successRate?: number | undefined;
        lastAttempt?: Date | undefined;
    }, {
        isUnlocked: boolean;
        isCompleted: boolean;
        isActive: boolean;
        completedAt: Date | null;
        successRate?: number | undefined;
        lastAttempt?: Date | undefined;
    }>;
    deployment: z.ZodNullable<z.ZodObject<{
        deploymentId: z.ZodString;
        missionId: z.ZodString;
        agentId: z.ZodString;
        proxim8Id: z.ZodString;
        proxim8Name: z.ZodOptional<z.ZodString>;
        approach: z.ZodString;
        status: z.ZodEnum<["active", "completed", "failed", "abandoned"]>;
        deployedAt: z.ZodDate;
        completesAt: z.ZodDate;
        currentPhase: z.ZodNumber;
        finalSuccessRate: z.ZodNumber;
        phaseOutcomes: z.ZodOptional<z.ZodArray<z.ZodAny, "many">>;
        result: z.ZodOptional<z.ZodObject<{
            overallSuccess: z.ZodBoolean;
            finalNarrative: z.ZodString;
            timelineShift: z.ZodNumber;
            rewards: z.ZodObject<{
                timelinePoints: z.ZodNumber;
                experience: z.ZodNumber;
                loreFragments: z.ZodArray<z.ZodString, "many">;
                achievements: z.ZodArray<z.ZodString, "many">;
            }, "strip", z.ZodTypeAny, {
                timelinePoints: number;
                experience: number;
                loreFragments: string[];
                achievements: string[];
            }, {
                timelinePoints: number;
                experience: number;
                loreFragments: string[];
                achievements: string[];
            }>;
        }, "strip", z.ZodTypeAny, {
            rewards: {
                timelinePoints: number;
                experience: number;
                loreFragments: string[];
                achievements: string[];
            };
            timelineShift: number;
            overallSuccess: boolean;
            finalNarrative: string;
        }, {
            rewards: {
                timelinePoints: number;
                experience: number;
                loreFragments: string[];
                achievements: string[];
            };
            timelineShift: number;
            overallSuccess: boolean;
            finalNarrative: string;
        }>>;
    }, "strip", z.ZodTypeAny, {
        deploymentId: string;
        status: "completed" | "failed" | "active" | "abandoned";
        missionId: string;
        agentId: string;
        proxim8Id: string;
        approach: string;
        deployedAt: Date;
        completesAt: Date;
        currentPhase: number;
        finalSuccessRate: number;
        result?: {
            rewards: {
                timelinePoints: number;
                experience: number;
                loreFragments: string[];
                achievements: string[];
            };
            timelineShift: number;
            overallSuccess: boolean;
            finalNarrative: string;
        } | undefined;
        proxim8Name?: string | undefined;
        phaseOutcomes?: any[] | undefined;
    }, {
        deploymentId: string;
        status: "completed" | "failed" | "active" | "abandoned";
        missionId: string;
        agentId: string;
        proxim8Id: string;
        approach: string;
        deployedAt: Date;
        completesAt: Date;
        currentPhase: number;
        finalSuccessRate: number;
        result?: {
            rewards: {
                timelinePoints: number;
                experience: number;
                loreFragments: string[];
                achievements: string[];
            };
            timelineShift: number;
            overallSuccess: boolean;
            finalNarrative: string;
        } | undefined;
        proxim8Name?: string | undefined;
        phaseOutcomes?: any[] | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    date: string;
    title: string;
    description: string;
    duration: number;
    missionId: string;
    sequence: number;
    location: string;
    imagePrompt: string;
    briefing: {
        text: string;
        currentBalance: number;
        threatLevel: "low" | "medium" | "high" | "critical";
    };
    approaches: {
        type: "low" | "medium" | "high";
        description: string;
        name: string;
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
            influenceMultiplier?: number | undefined;
        } | undefined;
        duration?: number | undefined;
    }[];
    compatibility: {
        preferred: ("analytical" | "adaptive" | "aggressive" | "diplomatic")[];
        bonus: number;
        penalty: number;
    };
    phases: {
        id: number;
        name: string;
        durationPercent: number;
        narrativeTemplates: {
            success: string;
            failure: string;
        };
        description?: string | undefined;
        challengeRating?: number | undefined;
        criticalPath?: boolean | undefined;
    }[];
    userProgress: {
        isUnlocked: boolean;
        isCompleted: boolean;
        isActive: boolean;
        completedAt: Date | null;
        successRate?: number | undefined;
        lastAttempt?: Date | undefined;
    };
    deployment: {
        deploymentId: string;
        status: "completed" | "failed" | "active" | "abandoned";
        missionId: string;
        agentId: string;
        proxim8Id: string;
        approach: string;
        deployedAt: Date;
        completesAt: Date;
        currentPhase: number;
        finalSuccessRate: number;
        result?: {
            rewards: {
                timelinePoints: number;
                experience: number;
                loreFragments: string[];
                achievements: string[];
            };
            timelineShift: number;
            overallSuccess: boolean;
            finalNarrative: string;
        } | undefined;
        proxim8Name?: string | undefined;
        phaseOutcomes?: any[] | undefined;
    } | null;
    imageUrl?: string | undefined;
    id?: string | undefined;
    tags?: string[] | undefined;
    missionName?: string | undefined;
    difficulty?: number | undefined;
    category?: string | undefined;
}, {
    date: string;
    title: string;
    description: string;
    duration: number;
    missionId: string;
    sequence: number;
    location: string;
    imagePrompt: string;
    briefing: {
        text: string;
        currentBalance: number;
        threatLevel: "low" | "medium" | "high" | "critical";
    };
    approaches: {
        type: "low" | "medium" | "high";
        description: string;
        name: string;
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
            influenceMultiplier?: number | undefined;
        } | undefined;
        duration?: number | undefined;
    }[];
    compatibility: {
        preferred: ("analytical" | "adaptive" | "aggressive" | "diplomatic")[];
        bonus: number;
        penalty: number;
    };
    phases: {
        id: number;
        name: string;
        durationPercent: number;
        narrativeTemplates: {
            success: string;
            failure: string;
        };
        description?: string | undefined;
        challengeRating?: number | undefined;
        criticalPath?: boolean | undefined;
    }[];
    userProgress: {
        isUnlocked: boolean;
        isCompleted: boolean;
        isActive: boolean;
        completedAt: Date | null;
        successRate?: number | undefined;
        lastAttempt?: Date | undefined;
    };
    deployment: {
        deploymentId: string;
        status: "completed" | "failed" | "active" | "abandoned";
        missionId: string;
        agentId: string;
        proxim8Id: string;
        approach: string;
        deployedAt: Date;
        completesAt: Date;
        currentPhase: number;
        finalSuccessRate: number;
        result?: {
            rewards: {
                timelinePoints: number;
                experience: number;
                loreFragments: string[];
                achievements: string[];
            };
            timelineShift: number;
            overallSuccess: boolean;
            finalNarrative: string;
        } | undefined;
        proxim8Name?: string | undefined;
        phaseOutcomes?: any[] | undefined;
    } | null;
    imageUrl?: string | undefined;
    id?: string | undefined;
    tags?: string[] | undefined;
    missionName?: string | undefined;
    difficulty?: number | undefined;
    category?: string | undefined;
}>;
export declare const AgentSchema: z.ZodObject<{
    codename: z.ZodString;
    rank: z.ZodString;
    timelinePoints: z.ZodNumber;
    availableProxim8s: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    timelinePoints: number;
    codename: string;
    rank: string;
    availableProxim8s: number;
}, {
    timelinePoints: number;
    codename: string;
    rank: string;
    availableProxim8s: number;
}>;
export declare const MissionsApiResponseSchema: z.ZodObject<{
    success: z.ZodBoolean;
    data: z.ZodObject<{
        missions: z.ZodArray<z.ZodObject<{
            missionId: z.ZodString;
            id: z.ZodOptional<z.ZodString>;
            sequence: z.ZodNumber;
            title: z.ZodString;
            missionName: z.ZodOptional<z.ZodString>;
            date: z.ZodString;
            location: z.ZodString;
            description: z.ZodString;
            imagePrompt: z.ZodString;
            imageUrl: z.ZodOptional<z.ZodString>;
            duration: z.ZodNumber;
            briefing: z.ZodObject<{
                text: z.ZodString;
                currentBalance: z.ZodNumber;
                threatLevel: z.ZodEnum<["low", "medium", "high", "critical"]>;
            }, "strip", z.ZodTypeAny, {
                text: string;
                currentBalance: number;
                threatLevel: "low" | "medium" | "high" | "critical";
            }, {
                text: string;
                currentBalance: number;
                threatLevel: "low" | "medium" | "high" | "critical";
            }>;
            approaches: z.ZodArray<z.ZodObject<{
                type: z.ZodEnum<["low", "medium", "high"]>;
                name: z.ZodString;
                description: z.ZodString;
                duration: z.ZodOptional<z.ZodNumber>;
                successRate: z.ZodObject<{
                    min: z.ZodNumber;
                    max: z.ZodNumber;
                }, "strip", z.ZodTypeAny, {
                    min: number;
                    max: number;
                }, {
                    min: number;
                    max: number;
                }>;
                timelineShift: z.ZodObject<{
                    min: z.ZodNumber;
                    max: z.ZodNumber;
                }, "strip", z.ZodTypeAny, {
                    min: number;
                    max: number;
                }, {
                    min: number;
                    max: number;
                }>;
                rewards: z.ZodOptional<z.ZodObject<{
                    timelinePoints: z.ZodNumber;
                    experience: z.ZodNumber;
                    influenceMultiplier: z.ZodOptional<z.ZodNumber>;
                }, "strip", z.ZodTypeAny, {
                    timelinePoints: number;
                    experience: number;
                    influenceMultiplier?: number | undefined;
                }, {
                    timelinePoints: number;
                    experience: number;
                    influenceMultiplier?: number | undefined;
                }>>;
            }, "strip", z.ZodTypeAny, {
                type: "low" | "medium" | "high";
                description: string;
                name: string;
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
                    influenceMultiplier?: number | undefined;
                } | undefined;
                duration?: number | undefined;
            }, {
                type: "low" | "medium" | "high";
                description: string;
                name: string;
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
                    influenceMultiplier?: number | undefined;
                } | undefined;
                duration?: number | undefined;
            }>, "many">;
            compatibility: z.ZodObject<{
                preferred: z.ZodArray<z.ZodEnum<["analytical", "aggressive", "diplomatic", "adaptive"]>, "many">;
                bonus: z.ZodNumber;
                penalty: z.ZodNumber;
            }, "strip", z.ZodTypeAny, {
                preferred: ("analytical" | "adaptive" | "aggressive" | "diplomatic")[];
                bonus: number;
                penalty: number;
            }, {
                preferred: ("analytical" | "adaptive" | "aggressive" | "diplomatic")[];
                bonus: number;
                penalty: number;
            }>;
            phases: z.ZodArray<z.ZodObject<{
                id: z.ZodNumber;
                name: z.ZodString;
                durationPercent: z.ZodNumber;
                narrativeTemplates: z.ZodObject<{
                    success: z.ZodString;
                    failure: z.ZodString;
                }, "strip", z.ZodTypeAny, {
                    success: string;
                    failure: string;
                }, {
                    success: string;
                    failure: string;
                }>;
                description: z.ZodOptional<z.ZodString>;
                challengeRating: z.ZodOptional<z.ZodNumber>;
                criticalPath: z.ZodOptional<z.ZodBoolean>;
            }, "strip", z.ZodTypeAny, {
                id: number;
                name: string;
                durationPercent: number;
                narrativeTemplates: {
                    success: string;
                    failure: string;
                };
                description?: string | undefined;
                challengeRating?: number | undefined;
                criticalPath?: boolean | undefined;
            }, {
                id: number;
                name: string;
                durationPercent: number;
                narrativeTemplates: {
                    success: string;
                    failure: string;
                };
                description?: string | undefined;
                challengeRating?: number | undefined;
                criticalPath?: boolean | undefined;
            }>, "many">;
            difficulty: z.ZodOptional<z.ZodNumber>;
            category: z.ZodOptional<z.ZodString>;
            tags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        } & {
            userProgress: z.ZodObject<{
                isUnlocked: z.ZodBoolean;
                isCompleted: z.ZodBoolean;
                isActive: z.ZodBoolean;
                completedAt: z.ZodNullable<z.ZodDate>;
                successRate: z.ZodOptional<z.ZodNumber>;
                lastAttempt: z.ZodOptional<z.ZodDate>;
            }, "strip", z.ZodTypeAny, {
                isUnlocked: boolean;
                isCompleted: boolean;
                isActive: boolean;
                completedAt: Date | null;
                successRate?: number | undefined;
                lastAttempt?: Date | undefined;
            }, {
                isUnlocked: boolean;
                isCompleted: boolean;
                isActive: boolean;
                completedAt: Date | null;
                successRate?: number | undefined;
                lastAttempt?: Date | undefined;
            }>;
            deployment: z.ZodNullable<z.ZodObject<{
                deploymentId: z.ZodString;
                missionId: z.ZodString;
                agentId: z.ZodString;
                proxim8Id: z.ZodString;
                proxim8Name: z.ZodOptional<z.ZodString>;
                approach: z.ZodString;
                status: z.ZodEnum<["active", "completed", "failed", "abandoned"]>;
                deployedAt: z.ZodDate;
                completesAt: z.ZodDate;
                currentPhase: z.ZodNumber;
                finalSuccessRate: z.ZodNumber;
                phaseOutcomes: z.ZodOptional<z.ZodArray<z.ZodAny, "many">>;
                result: z.ZodOptional<z.ZodObject<{
                    overallSuccess: z.ZodBoolean;
                    finalNarrative: z.ZodString;
                    timelineShift: z.ZodNumber;
                    rewards: z.ZodObject<{
                        timelinePoints: z.ZodNumber;
                        experience: z.ZodNumber;
                        loreFragments: z.ZodArray<z.ZodString, "many">;
                        achievements: z.ZodArray<z.ZodString, "many">;
                    }, "strip", z.ZodTypeAny, {
                        timelinePoints: number;
                        experience: number;
                        loreFragments: string[];
                        achievements: string[];
                    }, {
                        timelinePoints: number;
                        experience: number;
                        loreFragments: string[];
                        achievements: string[];
                    }>;
                }, "strip", z.ZodTypeAny, {
                    rewards: {
                        timelinePoints: number;
                        experience: number;
                        loreFragments: string[];
                        achievements: string[];
                    };
                    timelineShift: number;
                    overallSuccess: boolean;
                    finalNarrative: string;
                }, {
                    rewards: {
                        timelinePoints: number;
                        experience: number;
                        loreFragments: string[];
                        achievements: string[];
                    };
                    timelineShift: number;
                    overallSuccess: boolean;
                    finalNarrative: string;
                }>>;
            }, "strip", z.ZodTypeAny, {
                deploymentId: string;
                status: "completed" | "failed" | "active" | "abandoned";
                missionId: string;
                agentId: string;
                proxim8Id: string;
                approach: string;
                deployedAt: Date;
                completesAt: Date;
                currentPhase: number;
                finalSuccessRate: number;
                result?: {
                    rewards: {
                        timelinePoints: number;
                        experience: number;
                        loreFragments: string[];
                        achievements: string[];
                    };
                    timelineShift: number;
                    overallSuccess: boolean;
                    finalNarrative: string;
                } | undefined;
                proxim8Name?: string | undefined;
                phaseOutcomes?: any[] | undefined;
            }, {
                deploymentId: string;
                status: "completed" | "failed" | "active" | "abandoned";
                missionId: string;
                agentId: string;
                proxim8Id: string;
                approach: string;
                deployedAt: Date;
                completesAt: Date;
                currentPhase: number;
                finalSuccessRate: number;
                result?: {
                    rewards: {
                        timelinePoints: number;
                        experience: number;
                        loreFragments: string[];
                        achievements: string[];
                    };
                    timelineShift: number;
                    overallSuccess: boolean;
                    finalNarrative: string;
                } | undefined;
                proxim8Name?: string | undefined;
                phaseOutcomes?: any[] | undefined;
            }>>;
        }, "strip", z.ZodTypeAny, {
            date: string;
            title: string;
            description: string;
            duration: number;
            missionId: string;
            sequence: number;
            location: string;
            imagePrompt: string;
            briefing: {
                text: string;
                currentBalance: number;
                threatLevel: "low" | "medium" | "high" | "critical";
            };
            approaches: {
                type: "low" | "medium" | "high";
                description: string;
                name: string;
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
                    influenceMultiplier?: number | undefined;
                } | undefined;
                duration?: number | undefined;
            }[];
            compatibility: {
                preferred: ("analytical" | "adaptive" | "aggressive" | "diplomatic")[];
                bonus: number;
                penalty: number;
            };
            phases: {
                id: number;
                name: string;
                durationPercent: number;
                narrativeTemplates: {
                    success: string;
                    failure: string;
                };
                description?: string | undefined;
                challengeRating?: number | undefined;
                criticalPath?: boolean | undefined;
            }[];
            userProgress: {
                isUnlocked: boolean;
                isCompleted: boolean;
                isActive: boolean;
                completedAt: Date | null;
                successRate?: number | undefined;
                lastAttempt?: Date | undefined;
            };
            deployment: {
                deploymentId: string;
                status: "completed" | "failed" | "active" | "abandoned";
                missionId: string;
                agentId: string;
                proxim8Id: string;
                approach: string;
                deployedAt: Date;
                completesAt: Date;
                currentPhase: number;
                finalSuccessRate: number;
                result?: {
                    rewards: {
                        timelinePoints: number;
                        experience: number;
                        loreFragments: string[];
                        achievements: string[];
                    };
                    timelineShift: number;
                    overallSuccess: boolean;
                    finalNarrative: string;
                } | undefined;
                proxim8Name?: string | undefined;
                phaseOutcomes?: any[] | undefined;
            } | null;
            imageUrl?: string | undefined;
            id?: string | undefined;
            tags?: string[] | undefined;
            missionName?: string | undefined;
            difficulty?: number | undefined;
            category?: string | undefined;
        }, {
            date: string;
            title: string;
            description: string;
            duration: number;
            missionId: string;
            sequence: number;
            location: string;
            imagePrompt: string;
            briefing: {
                text: string;
                currentBalance: number;
                threatLevel: "low" | "medium" | "high" | "critical";
            };
            approaches: {
                type: "low" | "medium" | "high";
                description: string;
                name: string;
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
                    influenceMultiplier?: number | undefined;
                } | undefined;
                duration?: number | undefined;
            }[];
            compatibility: {
                preferred: ("analytical" | "adaptive" | "aggressive" | "diplomatic")[];
                bonus: number;
                penalty: number;
            };
            phases: {
                id: number;
                name: string;
                durationPercent: number;
                narrativeTemplates: {
                    success: string;
                    failure: string;
                };
                description?: string | undefined;
                challengeRating?: number | undefined;
                criticalPath?: boolean | undefined;
            }[];
            userProgress: {
                isUnlocked: boolean;
                isCompleted: boolean;
                isActive: boolean;
                completedAt: Date | null;
                successRate?: number | undefined;
                lastAttempt?: Date | undefined;
            };
            deployment: {
                deploymentId: string;
                status: "completed" | "failed" | "active" | "abandoned";
                missionId: string;
                agentId: string;
                proxim8Id: string;
                approach: string;
                deployedAt: Date;
                completesAt: Date;
                currentPhase: number;
                finalSuccessRate: number;
                result?: {
                    rewards: {
                        timelinePoints: number;
                        experience: number;
                        loreFragments: string[];
                        achievements: string[];
                    };
                    timelineShift: number;
                    overallSuccess: boolean;
                    finalNarrative: string;
                } | undefined;
                proxim8Name?: string | undefined;
                phaseOutcomes?: any[] | undefined;
            } | null;
            imageUrl?: string | undefined;
            id?: string | undefined;
            tags?: string[] | undefined;
            missionName?: string | undefined;
            difficulty?: number | undefined;
            category?: string | undefined;
        }>, "many">;
        agent: z.ZodNullable<z.ZodObject<{
            codename: z.ZodString;
            rank: z.ZodString;
            timelinePoints: z.ZodNumber;
            availableProxim8s: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            timelinePoints: number;
            codename: string;
            rank: string;
            availableProxim8s: number;
        }, {
            timelinePoints: number;
            codename: string;
            rank: string;
            availableProxim8s: number;
        }>>;
    }, "strip", z.ZodTypeAny, {
        missions: {
            date: string;
            title: string;
            description: string;
            duration: number;
            missionId: string;
            sequence: number;
            location: string;
            imagePrompt: string;
            briefing: {
                text: string;
                currentBalance: number;
                threatLevel: "low" | "medium" | "high" | "critical";
            };
            approaches: {
                type: "low" | "medium" | "high";
                description: string;
                name: string;
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
                    influenceMultiplier?: number | undefined;
                } | undefined;
                duration?: number | undefined;
            }[];
            compatibility: {
                preferred: ("analytical" | "adaptive" | "aggressive" | "diplomatic")[];
                bonus: number;
                penalty: number;
            };
            phases: {
                id: number;
                name: string;
                durationPercent: number;
                narrativeTemplates: {
                    success: string;
                    failure: string;
                };
                description?: string | undefined;
                challengeRating?: number | undefined;
                criticalPath?: boolean | undefined;
            }[];
            userProgress: {
                isUnlocked: boolean;
                isCompleted: boolean;
                isActive: boolean;
                completedAt: Date | null;
                successRate?: number | undefined;
                lastAttempt?: Date | undefined;
            };
            deployment: {
                deploymentId: string;
                status: "completed" | "failed" | "active" | "abandoned";
                missionId: string;
                agentId: string;
                proxim8Id: string;
                approach: string;
                deployedAt: Date;
                completesAt: Date;
                currentPhase: number;
                finalSuccessRate: number;
                result?: {
                    rewards: {
                        timelinePoints: number;
                        experience: number;
                        loreFragments: string[];
                        achievements: string[];
                    };
                    timelineShift: number;
                    overallSuccess: boolean;
                    finalNarrative: string;
                } | undefined;
                proxim8Name?: string | undefined;
                phaseOutcomes?: any[] | undefined;
            } | null;
            imageUrl?: string | undefined;
            id?: string | undefined;
            tags?: string[] | undefined;
            missionName?: string | undefined;
            difficulty?: number | undefined;
            category?: string | undefined;
        }[];
        agent: {
            timelinePoints: number;
            codename: string;
            rank: string;
            availableProxim8s: number;
        } | null;
    }, {
        missions: {
            date: string;
            title: string;
            description: string;
            duration: number;
            missionId: string;
            sequence: number;
            location: string;
            imagePrompt: string;
            briefing: {
                text: string;
                currentBalance: number;
                threatLevel: "low" | "medium" | "high" | "critical";
            };
            approaches: {
                type: "low" | "medium" | "high";
                description: string;
                name: string;
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
                    influenceMultiplier?: number | undefined;
                } | undefined;
                duration?: number | undefined;
            }[];
            compatibility: {
                preferred: ("analytical" | "adaptive" | "aggressive" | "diplomatic")[];
                bonus: number;
                penalty: number;
            };
            phases: {
                id: number;
                name: string;
                durationPercent: number;
                narrativeTemplates: {
                    success: string;
                    failure: string;
                };
                description?: string | undefined;
                challengeRating?: number | undefined;
                criticalPath?: boolean | undefined;
            }[];
            userProgress: {
                isUnlocked: boolean;
                isCompleted: boolean;
                isActive: boolean;
                completedAt: Date | null;
                successRate?: number | undefined;
                lastAttempt?: Date | undefined;
            };
            deployment: {
                deploymentId: string;
                status: "completed" | "failed" | "active" | "abandoned";
                missionId: string;
                agentId: string;
                proxim8Id: string;
                approach: string;
                deployedAt: Date;
                completesAt: Date;
                currentPhase: number;
                finalSuccessRate: number;
                result?: {
                    rewards: {
                        timelinePoints: number;
                        experience: number;
                        loreFragments: string[];
                        achievements: string[];
                    };
                    timelineShift: number;
                    overallSuccess: boolean;
                    finalNarrative: string;
                } | undefined;
                proxim8Name?: string | undefined;
                phaseOutcomes?: any[] | undefined;
            } | null;
            imageUrl?: string | undefined;
            id?: string | undefined;
            tags?: string[] | undefined;
            missionName?: string | undefined;
            difficulty?: number | undefined;
            category?: string | undefined;
        }[];
        agent: {
            timelinePoints: number;
            codename: string;
            rank: string;
            availableProxim8s: number;
        } | null;
    }>;
    error: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    data: {
        missions: {
            date: string;
            title: string;
            description: string;
            duration: number;
            missionId: string;
            sequence: number;
            location: string;
            imagePrompt: string;
            briefing: {
                text: string;
                currentBalance: number;
                threatLevel: "low" | "medium" | "high" | "critical";
            };
            approaches: {
                type: "low" | "medium" | "high";
                description: string;
                name: string;
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
                    influenceMultiplier?: number | undefined;
                } | undefined;
                duration?: number | undefined;
            }[];
            compatibility: {
                preferred: ("analytical" | "adaptive" | "aggressive" | "diplomatic")[];
                bonus: number;
                penalty: number;
            };
            phases: {
                id: number;
                name: string;
                durationPercent: number;
                narrativeTemplates: {
                    success: string;
                    failure: string;
                };
                description?: string | undefined;
                challengeRating?: number | undefined;
                criticalPath?: boolean | undefined;
            }[];
            userProgress: {
                isUnlocked: boolean;
                isCompleted: boolean;
                isActive: boolean;
                completedAt: Date | null;
                successRate?: number | undefined;
                lastAttempt?: Date | undefined;
            };
            deployment: {
                deploymentId: string;
                status: "completed" | "failed" | "active" | "abandoned";
                missionId: string;
                agentId: string;
                proxim8Id: string;
                approach: string;
                deployedAt: Date;
                completesAt: Date;
                currentPhase: number;
                finalSuccessRate: number;
                result?: {
                    rewards: {
                        timelinePoints: number;
                        experience: number;
                        loreFragments: string[];
                        achievements: string[];
                    };
                    timelineShift: number;
                    overallSuccess: boolean;
                    finalNarrative: string;
                } | undefined;
                proxim8Name?: string | undefined;
                phaseOutcomes?: any[] | undefined;
            } | null;
            imageUrl?: string | undefined;
            id?: string | undefined;
            tags?: string[] | undefined;
            missionName?: string | undefined;
            difficulty?: number | undefined;
            category?: string | undefined;
        }[];
        agent: {
            timelinePoints: number;
            codename: string;
            rank: string;
            availableProxim8s: number;
        } | null;
    };
    success: boolean;
    error?: string | undefined;
}, {
    data: {
        missions: {
            date: string;
            title: string;
            description: string;
            duration: number;
            missionId: string;
            sequence: number;
            location: string;
            imagePrompt: string;
            briefing: {
                text: string;
                currentBalance: number;
                threatLevel: "low" | "medium" | "high" | "critical";
            };
            approaches: {
                type: "low" | "medium" | "high";
                description: string;
                name: string;
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
                    influenceMultiplier?: number | undefined;
                } | undefined;
                duration?: number | undefined;
            }[];
            compatibility: {
                preferred: ("analytical" | "adaptive" | "aggressive" | "diplomatic")[];
                bonus: number;
                penalty: number;
            };
            phases: {
                id: number;
                name: string;
                durationPercent: number;
                narrativeTemplates: {
                    success: string;
                    failure: string;
                };
                description?: string | undefined;
                challengeRating?: number | undefined;
                criticalPath?: boolean | undefined;
            }[];
            userProgress: {
                isUnlocked: boolean;
                isCompleted: boolean;
                isActive: boolean;
                completedAt: Date | null;
                successRate?: number | undefined;
                lastAttempt?: Date | undefined;
            };
            deployment: {
                deploymentId: string;
                status: "completed" | "failed" | "active" | "abandoned";
                missionId: string;
                agentId: string;
                proxim8Id: string;
                approach: string;
                deployedAt: Date;
                completesAt: Date;
                currentPhase: number;
                finalSuccessRate: number;
                result?: {
                    rewards: {
                        timelinePoints: number;
                        experience: number;
                        loreFragments: string[];
                        achievements: string[];
                    };
                    timelineShift: number;
                    overallSuccess: boolean;
                    finalNarrative: string;
                } | undefined;
                proxim8Name?: string | undefined;
                phaseOutcomes?: any[] | undefined;
            } | null;
            imageUrl?: string | undefined;
            id?: string | undefined;
            tags?: string[] | undefined;
            missionName?: string | undefined;
            difficulty?: number | undefined;
            category?: string | undefined;
        }[];
        agent: {
            timelinePoints: number;
            codename: string;
            rank: string;
            availableProxim8s: number;
        } | null;
    };
    success: boolean;
    error?: string | undefined;
}>;
export declare const MissionDetailsApiResponseSchema: z.ZodObject<{
    success: z.ZodBoolean;
    data: z.ZodObject<{
        mission: z.ZodObject<{
            missionId: z.ZodString;
            id: z.ZodOptional<z.ZodString>;
            sequence: z.ZodNumber;
            title: z.ZodString;
            missionName: z.ZodOptional<z.ZodString>;
            date: z.ZodString;
            location: z.ZodString;
            description: z.ZodString;
            imagePrompt: z.ZodString;
            imageUrl: z.ZodOptional<z.ZodString>;
            duration: z.ZodNumber;
            briefing: z.ZodObject<{
                text: z.ZodString;
                currentBalance: z.ZodNumber;
                threatLevel: z.ZodEnum<["low", "medium", "high", "critical"]>;
            }, "strip", z.ZodTypeAny, {
                text: string;
                currentBalance: number;
                threatLevel: "low" | "medium" | "high" | "critical";
            }, {
                text: string;
                currentBalance: number;
                threatLevel: "low" | "medium" | "high" | "critical";
            }>;
            approaches: z.ZodArray<z.ZodObject<{
                type: z.ZodEnum<["low", "medium", "high"]>;
                name: z.ZodString;
                description: z.ZodString;
                duration: z.ZodOptional<z.ZodNumber>;
                successRate: z.ZodObject<{
                    min: z.ZodNumber;
                    max: z.ZodNumber;
                }, "strip", z.ZodTypeAny, {
                    min: number;
                    max: number;
                }, {
                    min: number;
                    max: number;
                }>;
                timelineShift: z.ZodObject<{
                    min: z.ZodNumber;
                    max: z.ZodNumber;
                }, "strip", z.ZodTypeAny, {
                    min: number;
                    max: number;
                }, {
                    min: number;
                    max: number;
                }>;
                rewards: z.ZodOptional<z.ZodObject<{
                    timelinePoints: z.ZodNumber;
                    experience: z.ZodNumber;
                    influenceMultiplier: z.ZodOptional<z.ZodNumber>;
                }, "strip", z.ZodTypeAny, {
                    timelinePoints: number;
                    experience: number;
                    influenceMultiplier?: number | undefined;
                }, {
                    timelinePoints: number;
                    experience: number;
                    influenceMultiplier?: number | undefined;
                }>>;
            }, "strip", z.ZodTypeAny, {
                type: "low" | "medium" | "high";
                description: string;
                name: string;
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
                    influenceMultiplier?: number | undefined;
                } | undefined;
                duration?: number | undefined;
            }, {
                type: "low" | "medium" | "high";
                description: string;
                name: string;
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
                    influenceMultiplier?: number | undefined;
                } | undefined;
                duration?: number | undefined;
            }>, "many">;
            compatibility: z.ZodObject<{
                preferred: z.ZodArray<z.ZodEnum<["analytical", "aggressive", "diplomatic", "adaptive"]>, "many">;
                bonus: z.ZodNumber;
                penalty: z.ZodNumber;
            }, "strip", z.ZodTypeAny, {
                preferred: ("analytical" | "adaptive" | "aggressive" | "diplomatic")[];
                bonus: number;
                penalty: number;
            }, {
                preferred: ("analytical" | "adaptive" | "aggressive" | "diplomatic")[];
                bonus: number;
                penalty: number;
            }>;
            phases: z.ZodArray<z.ZodObject<{
                id: z.ZodNumber;
                name: z.ZodString;
                durationPercent: z.ZodNumber;
                narrativeTemplates: z.ZodObject<{
                    success: z.ZodString;
                    failure: z.ZodString;
                }, "strip", z.ZodTypeAny, {
                    success: string;
                    failure: string;
                }, {
                    success: string;
                    failure: string;
                }>;
                description: z.ZodOptional<z.ZodString>;
                challengeRating: z.ZodOptional<z.ZodNumber>;
                criticalPath: z.ZodOptional<z.ZodBoolean>;
            }, "strip", z.ZodTypeAny, {
                id: number;
                name: string;
                durationPercent: number;
                narrativeTemplates: {
                    success: string;
                    failure: string;
                };
                description?: string | undefined;
                challengeRating?: number | undefined;
                criticalPath?: boolean | undefined;
            }, {
                id: number;
                name: string;
                durationPercent: number;
                narrativeTemplates: {
                    success: string;
                    failure: string;
                };
                description?: string | undefined;
                challengeRating?: number | undefined;
                criticalPath?: boolean | undefined;
            }>, "many">;
            difficulty: z.ZodOptional<z.ZodNumber>;
            category: z.ZodOptional<z.ZodString>;
            tags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, "strip", z.ZodTypeAny, {
            date: string;
            title: string;
            description: string;
            duration: number;
            missionId: string;
            sequence: number;
            location: string;
            imagePrompt: string;
            briefing: {
                text: string;
                currentBalance: number;
                threatLevel: "low" | "medium" | "high" | "critical";
            };
            approaches: {
                type: "low" | "medium" | "high";
                description: string;
                name: string;
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
                    influenceMultiplier?: number | undefined;
                } | undefined;
                duration?: number | undefined;
            }[];
            compatibility: {
                preferred: ("analytical" | "adaptive" | "aggressive" | "diplomatic")[];
                bonus: number;
                penalty: number;
            };
            phases: {
                id: number;
                name: string;
                durationPercent: number;
                narrativeTemplates: {
                    success: string;
                    failure: string;
                };
                description?: string | undefined;
                challengeRating?: number | undefined;
                criticalPath?: boolean | undefined;
            }[];
            imageUrl?: string | undefined;
            id?: string | undefined;
            tags?: string[] | undefined;
            missionName?: string | undefined;
            difficulty?: number | undefined;
            category?: string | undefined;
        }, {
            date: string;
            title: string;
            description: string;
            duration: number;
            missionId: string;
            sequence: number;
            location: string;
            imagePrompt: string;
            briefing: {
                text: string;
                currentBalance: number;
                threatLevel: "low" | "medium" | "high" | "critical";
            };
            approaches: {
                type: "low" | "medium" | "high";
                description: string;
                name: string;
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
                    influenceMultiplier?: number | undefined;
                } | undefined;
                duration?: number | undefined;
            }[];
            compatibility: {
                preferred: ("analytical" | "adaptive" | "aggressive" | "diplomatic")[];
                bonus: number;
                penalty: number;
            };
            phases: {
                id: number;
                name: string;
                durationPercent: number;
                narrativeTemplates: {
                    success: string;
                    failure: string;
                };
                description?: string | undefined;
                challengeRating?: number | undefined;
                criticalPath?: boolean | undefined;
            }[];
            imageUrl?: string | undefined;
            id?: string | undefined;
            tags?: string[] | undefined;
            missionName?: string | undefined;
            difficulty?: number | undefined;
            category?: string | undefined;
        }>;
        deployment: z.ZodNullable<z.ZodObject<{
            deploymentId: z.ZodString;
            missionId: z.ZodString;
            agentId: z.ZodString;
            proxim8Id: z.ZodString;
            proxim8Name: z.ZodOptional<z.ZodString>;
            approach: z.ZodString;
            status: z.ZodEnum<["active", "completed", "failed", "abandoned"]>;
            deployedAt: z.ZodDate;
            completesAt: z.ZodDate;
            currentPhase: z.ZodNumber;
            finalSuccessRate: z.ZodNumber;
            phaseOutcomes: z.ZodOptional<z.ZodArray<z.ZodAny, "many">>;
            result: z.ZodOptional<z.ZodObject<{
                overallSuccess: z.ZodBoolean;
                finalNarrative: z.ZodString;
                timelineShift: z.ZodNumber;
                rewards: z.ZodObject<{
                    timelinePoints: z.ZodNumber;
                    experience: z.ZodNumber;
                    loreFragments: z.ZodArray<z.ZodString, "many">;
                    achievements: z.ZodArray<z.ZodString, "many">;
                }, "strip", z.ZodTypeAny, {
                    timelinePoints: number;
                    experience: number;
                    loreFragments: string[];
                    achievements: string[];
                }, {
                    timelinePoints: number;
                    experience: number;
                    loreFragments: string[];
                    achievements: string[];
                }>;
            }, "strip", z.ZodTypeAny, {
                rewards: {
                    timelinePoints: number;
                    experience: number;
                    loreFragments: string[];
                    achievements: string[];
                };
                timelineShift: number;
                overallSuccess: boolean;
                finalNarrative: string;
            }, {
                rewards: {
                    timelinePoints: number;
                    experience: number;
                    loreFragments: string[];
                    achievements: string[];
                };
                timelineShift: number;
                overallSuccess: boolean;
                finalNarrative: string;
            }>>;
        }, "strip", z.ZodTypeAny, {
            deploymentId: string;
            status: "completed" | "failed" | "active" | "abandoned";
            missionId: string;
            agentId: string;
            proxim8Id: string;
            approach: string;
            deployedAt: Date;
            completesAt: Date;
            currentPhase: number;
            finalSuccessRate: number;
            result?: {
                rewards: {
                    timelinePoints: number;
                    experience: number;
                    loreFragments: string[];
                    achievements: string[];
                };
                timelineShift: number;
                overallSuccess: boolean;
                finalNarrative: string;
            } | undefined;
            proxim8Name?: string | undefined;
            phaseOutcomes?: any[] | undefined;
        }, {
            deploymentId: string;
            status: "completed" | "failed" | "active" | "abandoned";
            missionId: string;
            agentId: string;
            proxim8Id: string;
            approach: string;
            deployedAt: Date;
            completesAt: Date;
            currentPhase: number;
            finalSuccessRate: number;
            result?: {
                rewards: {
                    timelinePoints: number;
                    experience: number;
                    loreFragments: string[];
                    achievements: string[];
                };
                timelineShift: number;
                overallSuccess: boolean;
                finalNarrative: string;
            } | undefined;
            proxim8Name?: string | undefined;
            phaseOutcomes?: any[] | undefined;
        }>>;
        agent: z.ZodNullable<z.ZodObject<{
            availableProxim8s: z.ZodArray<z.ZodAny, "many">;
            canDeploy: z.ZodBoolean;
        }, "strip", z.ZodTypeAny, {
            availableProxim8s: any[];
            canDeploy: boolean;
        }, {
            availableProxim8s: any[];
            canDeploy: boolean;
        }>>;
    }, "strip", z.ZodTypeAny, {
        mission: {
            date: string;
            title: string;
            description: string;
            duration: number;
            missionId: string;
            sequence: number;
            location: string;
            imagePrompt: string;
            briefing: {
                text: string;
                currentBalance: number;
                threatLevel: "low" | "medium" | "high" | "critical";
            };
            approaches: {
                type: "low" | "medium" | "high";
                description: string;
                name: string;
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
                    influenceMultiplier?: number | undefined;
                } | undefined;
                duration?: number | undefined;
            }[];
            compatibility: {
                preferred: ("analytical" | "adaptive" | "aggressive" | "diplomatic")[];
                bonus: number;
                penalty: number;
            };
            phases: {
                id: number;
                name: string;
                durationPercent: number;
                narrativeTemplates: {
                    success: string;
                    failure: string;
                };
                description?: string | undefined;
                challengeRating?: number | undefined;
                criticalPath?: boolean | undefined;
            }[];
            imageUrl?: string | undefined;
            id?: string | undefined;
            tags?: string[] | undefined;
            missionName?: string | undefined;
            difficulty?: number | undefined;
            category?: string | undefined;
        };
        deployment: {
            deploymentId: string;
            status: "completed" | "failed" | "active" | "abandoned";
            missionId: string;
            agentId: string;
            proxim8Id: string;
            approach: string;
            deployedAt: Date;
            completesAt: Date;
            currentPhase: number;
            finalSuccessRate: number;
            result?: {
                rewards: {
                    timelinePoints: number;
                    experience: number;
                    loreFragments: string[];
                    achievements: string[];
                };
                timelineShift: number;
                overallSuccess: boolean;
                finalNarrative: string;
            } | undefined;
            proxim8Name?: string | undefined;
            phaseOutcomes?: any[] | undefined;
        } | null;
        agent: {
            availableProxim8s: any[];
            canDeploy: boolean;
        } | null;
    }, {
        mission: {
            date: string;
            title: string;
            description: string;
            duration: number;
            missionId: string;
            sequence: number;
            location: string;
            imagePrompt: string;
            briefing: {
                text: string;
                currentBalance: number;
                threatLevel: "low" | "medium" | "high" | "critical";
            };
            approaches: {
                type: "low" | "medium" | "high";
                description: string;
                name: string;
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
                    influenceMultiplier?: number | undefined;
                } | undefined;
                duration?: number | undefined;
            }[];
            compatibility: {
                preferred: ("analytical" | "adaptive" | "aggressive" | "diplomatic")[];
                bonus: number;
                penalty: number;
            };
            phases: {
                id: number;
                name: string;
                durationPercent: number;
                narrativeTemplates: {
                    success: string;
                    failure: string;
                };
                description?: string | undefined;
                challengeRating?: number | undefined;
                criticalPath?: boolean | undefined;
            }[];
            imageUrl?: string | undefined;
            id?: string | undefined;
            tags?: string[] | undefined;
            missionName?: string | undefined;
            difficulty?: number | undefined;
            category?: string | undefined;
        };
        deployment: {
            deploymentId: string;
            status: "completed" | "failed" | "active" | "abandoned";
            missionId: string;
            agentId: string;
            proxim8Id: string;
            approach: string;
            deployedAt: Date;
            completesAt: Date;
            currentPhase: number;
            finalSuccessRate: number;
            result?: {
                rewards: {
                    timelinePoints: number;
                    experience: number;
                    loreFragments: string[];
                    achievements: string[];
                };
                timelineShift: number;
                overallSuccess: boolean;
                finalNarrative: string;
            } | undefined;
            proxim8Name?: string | undefined;
            phaseOutcomes?: any[] | undefined;
        } | null;
        agent: {
            availableProxim8s: any[];
            canDeploy: boolean;
        } | null;
    }>;
    error: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    data: {
        mission: {
            date: string;
            title: string;
            description: string;
            duration: number;
            missionId: string;
            sequence: number;
            location: string;
            imagePrompt: string;
            briefing: {
                text: string;
                currentBalance: number;
                threatLevel: "low" | "medium" | "high" | "critical";
            };
            approaches: {
                type: "low" | "medium" | "high";
                description: string;
                name: string;
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
                    influenceMultiplier?: number | undefined;
                } | undefined;
                duration?: number | undefined;
            }[];
            compatibility: {
                preferred: ("analytical" | "adaptive" | "aggressive" | "diplomatic")[];
                bonus: number;
                penalty: number;
            };
            phases: {
                id: number;
                name: string;
                durationPercent: number;
                narrativeTemplates: {
                    success: string;
                    failure: string;
                };
                description?: string | undefined;
                challengeRating?: number | undefined;
                criticalPath?: boolean | undefined;
            }[];
            imageUrl?: string | undefined;
            id?: string | undefined;
            tags?: string[] | undefined;
            missionName?: string | undefined;
            difficulty?: number | undefined;
            category?: string | undefined;
        };
        deployment: {
            deploymentId: string;
            status: "completed" | "failed" | "active" | "abandoned";
            missionId: string;
            agentId: string;
            proxim8Id: string;
            approach: string;
            deployedAt: Date;
            completesAt: Date;
            currentPhase: number;
            finalSuccessRate: number;
            result?: {
                rewards: {
                    timelinePoints: number;
                    experience: number;
                    loreFragments: string[];
                    achievements: string[];
                };
                timelineShift: number;
                overallSuccess: boolean;
                finalNarrative: string;
            } | undefined;
            proxim8Name?: string | undefined;
            phaseOutcomes?: any[] | undefined;
        } | null;
        agent: {
            availableProxim8s: any[];
            canDeploy: boolean;
        } | null;
    };
    success: boolean;
    error?: string | undefined;
}, {
    data: {
        mission: {
            date: string;
            title: string;
            description: string;
            duration: number;
            missionId: string;
            sequence: number;
            location: string;
            imagePrompt: string;
            briefing: {
                text: string;
                currentBalance: number;
                threatLevel: "low" | "medium" | "high" | "critical";
            };
            approaches: {
                type: "low" | "medium" | "high";
                description: string;
                name: string;
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
                    influenceMultiplier?: number | undefined;
                } | undefined;
                duration?: number | undefined;
            }[];
            compatibility: {
                preferred: ("analytical" | "adaptive" | "aggressive" | "diplomatic")[];
                bonus: number;
                penalty: number;
            };
            phases: {
                id: number;
                name: string;
                durationPercent: number;
                narrativeTemplates: {
                    success: string;
                    failure: string;
                };
                description?: string | undefined;
                challengeRating?: number | undefined;
                criticalPath?: boolean | undefined;
            }[];
            imageUrl?: string | undefined;
            id?: string | undefined;
            tags?: string[] | undefined;
            missionName?: string | undefined;
            difficulty?: number | undefined;
            category?: string | undefined;
        };
        deployment: {
            deploymentId: string;
            status: "completed" | "failed" | "active" | "abandoned";
            missionId: string;
            agentId: string;
            proxim8Id: string;
            approach: string;
            deployedAt: Date;
            completesAt: Date;
            currentPhase: number;
            finalSuccessRate: number;
            result?: {
                rewards: {
                    timelinePoints: number;
                    experience: number;
                    loreFragments: string[];
                    achievements: string[];
                };
                timelineShift: number;
                overallSuccess: boolean;
                finalNarrative: string;
            } | undefined;
            proxim8Name?: string | undefined;
            phaseOutcomes?: any[] | undefined;
        } | null;
        agent: {
            availableProxim8s: any[];
            canDeploy: boolean;
        } | null;
    };
    success: boolean;
    error?: string | undefined;
}>;
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
