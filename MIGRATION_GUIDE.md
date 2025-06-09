# Proxim8 Training/Mission System Migration Guide

## Overview
This guide provides step-by-step instructions to migrate the complete training/mission system from the `training` branch into a new system. The migration includes a 7-mission progressive training system, real-time mission tracking, AI content generation, MCP integration, comprehensive testing infrastructure, analytics integration, shared type system, and a modern mission dashboard UI.

## Prerequisites
- Node.js/TypeScript backend environment
- MongoDB database
- Redis (optional for caching)
- Google Gemini API access
- PostHog account for analytics
- PNPM package manager
- Basic understanding of Express.js, Mongoose, Next.js, and monorepo architecture

## Phase 1: Workspace & Dependencies Setup

### 1.1 Setup Monorepo Workspace
Create `pnpm-workspace.yaml`:
```yaml
packages:
  - 'client'
  - 'server'
  - 'shared'
  - 'packages/*'
```

### 1.2 Create Shared Package
Create `shared/package.json`:
```json
{
  "name": "@proxim8/shared",
  "version": "1.0.0",
  "description": "Shared types and utilities for Proxim8 Pipeline",
  "main": "index.js",
  "types": "index.d.ts",
  "scripts": {
    "build": "tsc",
    "type-check": "tsc --noEmit"
  },
  "dependencies": {
    "zod": "^3.24.4"
  },
  "devDependencies": {
    "@types/form-data": "^2.5.2",
    "typescript": "^5.3.3"
  }
}
```

### 1.3 Update Server Dependencies
Add to your server package.json:
```json
{
  "dependencies": {
    "@modelcontextprotocol/sdk": "^1.12.1",
    "@google/generative-ai": "^0.24.1",
    "@proxim8/shared": "workspace:*"
  },
  "devDependencies": {
    "@types/supertest": "^6.0.3",
    "mongodb-memory-server": "^9.5.0",
    "supertest": "^6.3.4",
    "ts-jest": "^29.3.4"
  },
  "scripts": {
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:mcp": "ts-node src/__tests__/mcp.test.runner.ts",
    "migrate:missions": "ts-node src/scripts/migrateMissions.ts"
  }
}
```

### 1.4 Update Client Dependencies
Add to your client package.json:
```json
{
  "dependencies": {
    "@proxim8/shared": "workspace:*",
    "posthog-js": "^1.167.0",
    "posthog-node": "^4.2.0",
    "lucide-react": "^0.468.0"
  }
}
```

### 1.5 Install Dependencies
```bash
pnpm install
```

## Phase 2: Shared Type System

### 2.1 Create Shared Schemas (`shared/schemas/mission.schema.ts`)
```typescript
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
  duration: z.number().optional(),
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

// Mission template schema
export const MissionTemplateSchema = z.object({
  missionId: z.string(),
  sequence: z.number(),
  title: z.string(),
  date: z.string(),
  location: z.string(),
  description: z.string(),
  imagePrompt: z.string(),
  imageUrl: z.string().optional(),
  duration: z.number(),
  briefing: z.object({
    text: z.string(),
    currentBalance: z.number().min(0).max(100),
    threatLevel: ThreatLevelEnum
  }),
  approaches: z.array(MissionApproachSchema),
  compatibility: z.object({
    preferred: z.array(PersonalityEnum),
    bonus: z.number(),
    penalty: z.number()
  }),
  phases: z.array(z.object({
    id: z.number(),
    name: z.string(),
    durationPercent: z.number(),
    narrativeTemplates: z.object({
      success: z.string(),
      failure: z.string()
    })
  })),
  difficulty: z.number().min(1).max(10).optional(),
  category: z.string().optional(),
  tags: z.array(z.string()).optional()
});

// Export types
export type MissionTemplate = z.infer<typeof MissionTemplateSchema>;
export type MissionApproach = z.infer<typeof MissionApproachSchema>;
export type ApproachType = z.infer<typeof ApproachTypeEnum>;
export type ThreatLevel = z.infer<typeof ThreatLevelEnum>;
```

### 2.2 Create Shared Index (`shared/index.ts`)
```typescript
// Export all schemas and types
export * from './schemas/mission.schema';
export * from './types/mission';
```

### 2.3 Build Shared Package
```bash
cd shared && pnpm build
```

## Phase 3: Database Models

### 2.1 Create Game Models Directory
Create `src/models/game/` directory and add these models:

#### Agent Model (`src/models/game/Agent.ts`)
```typescript
import mongoose, { Schema, Document } from "mongoose";

export interface IAgent extends Document {
  walletAddress: string;
  codename?: string;
  rank: "observer" | "field-agent" | "senior-agent" | "architect";
  timelinePoints: number;
  proxim8s: IProxim8[];
  
  // Methods
  getAvailableProxim8s(): IProxim8[];
  canDeployMission(): { allowed: boolean; reason?: string };
}

export interface IProxim8 extends Document {
  nftId: string;
  name: string;
  personality: "analytical" | "aggressive" | "diplomatic" | "adaptive";
  level: number;
  experience: number;
  isDeployed: boolean;
  lastMissionAt?: Date;
}

const Proxim8Schema = new Schema({
  nftId: { type: String, required: true },
  name: { type: String, required: true },
  personality: { 
    type: String, 
    enum: ["analytical", "aggressive", "diplomatic", "adaptive"],
    required: true 
  },
  level: { type: Number, default: 1 },
  experience: { type: Number, default: 0 },
  isDeployed: { type: Boolean, default: false },
  lastMissionAt: { type: Date }
});

const AgentSchema = new Schema({
  walletAddress: { type: String, required: true, unique: true },
  codename: { type: String },
  rank: { 
    type: String, 
    enum: ["observer", "field-agent", "senior-agent", "architect"],
    default: "observer"
  },
  timelinePoints: { type: Number, default: 0 },
  proxim8s: [Proxim8Schema]
}, { timestamps: true });

// Add methods
AgentSchema.methods.getAvailableProxim8s = function() {
  return this.proxim8s.filter((p: IProxim8) => !p.isDeployed);
};

AgentSchema.methods.canDeployMission = function() {
  const available = this.getAvailableProxim8s();
  if (available.length === 0) {
    return { allowed: false, reason: "No available Proxim8s" };
  }
  return { allowed: true };
};

export default mongoose.model<IAgent>("Agent", AgentSchema);
```

#### TrainingMissionDeployment Model (`src/models/game/TrainingMissionDeployment.ts`)
```typescript
import mongoose, { Schema, Document } from "mongoose";

export interface ITrainingMissionDeployment extends Document {
  deploymentId: string;
  missionId: string;
  agentId: string;
  proxim8Id: string;
  approach: "low" | "medium" | "high";
  deployedAt: Date;
  completesAt: Date;
  duration: number;
  status: "active" | "completed" | "abandoned";
  currentPhase: number;
  finalSuccessRate: number;
  phaseOutcomes: Array<{
    phaseId: number;
    success: boolean;
    narrative?: string;
    completedAt?: Date;
  }>;
  result?: {
    overallSuccess: boolean;
    finalNarrative: string;
    timelineShift: number;
    rewards: {
      timelinePoints: number;
      experience: number;
      loreFragments?: string[];
    };
  };
  
  // Methods
  shouldRevealPhase(phaseId: number): boolean;
  getClientState(): any;
}

const TrainingMissionDeploymentSchema = new Schema({
  deploymentId: { 
    type: String, 
    required: true, 
    unique: true,
    default: () => `training_deploy_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  },
  missionId: { 
    type: String, 
    required: true,
    enum: ["training_001", "training_002", "training_003", "training_004", "training_005", "training_006", "training_007"]
  },
  agentId: { type: String, required: true, index: true },
  proxim8Id: { type: String, required: true },
  approach: { 
    type: String, 
    required: true,
    enum: ["low", "medium", "high"]
  },
  deployedAt: { type: Date, default: Date.now },
  completesAt: { type: Date, required: true },
  duration: { type: Number, required: true },
  status: {
    type: String,
    enum: ["active", "completed", "abandoned"],
    default: "active"
  },
  currentPhase: { type: Number, default: 0 },
  finalSuccessRate: { type: Number, required: true },
  phaseOutcomes: [{
    phaseId: { type: Number, required: true },
    success: { type: Boolean, required: true },
    narrative: { type: String },
    completedAt: { type: Date }
  }],
  result: {
    overallSuccess: { type: Boolean },
    finalNarrative: { type: String },
    timelineShift: { type: Number },
    rewards: {
      timelinePoints: { type: Number },
      experience: { type: Number },
      loreFragments: [{ type: String }]
    }
  }
}, { timestamps: true });

// Methods
TrainingMissionDeploymentSchema.methods.shouldRevealPhase = function(phaseId: number): boolean {
  if (this.status !== "active") return true;
  
  const now = Date.now();
  const elapsed = now - this.deployedAt.getTime();
  const progress = elapsed / this.duration;
  const phaseTimings = [0.2, 0.45, 0.7, 0.9, 1.0];
  
  return progress >= phaseTimings[phaseId - 1];
};

TrainingMissionDeploymentSchema.methods.getClientState = function() {
  const phases = this.phaseOutcomes.map((phase: any) => {
    const shouldReveal = this.shouldRevealPhase(phase.phaseId);
    
    if (shouldReveal) {
      return {
        phaseId: phase.phaseId,
        success: phase.success,
        narrative: phase.narrative || "Phase in progress...",
        completedAt: phase.completedAt,
        status: phase.completedAt ? (phase.success ? "success" : "failure") : "active"
      };
    } else {
      return {
        phaseId: phase.phaseId,
        status: "pending"
      };
    }
  });
  
  return {
    deploymentId: this.deploymentId,
    missionId: this.missionId,
    status: this.status,
    currentPhase: this.currentPhase,
    deployedAt: this.deployedAt,
    completesAt: this.completesAt,
    phases,
    result: this.status === "completed" ? this.result : undefined
  };
};

export default mongoose.model<ITrainingMissionDeployment>("TrainingMissionDeployment", TrainingMissionDeploymentSchema);
```

## Phase 3: Training Mission Data

### 3.1 Create Training Missions Data (`src/data/trainingMissions.ts`)
```typescript
export interface TrainingMissionData {
  missionId: string;
  sequence: number;
  title: string;
  date: string;
  location: string;
  description: string;
  duration: number;
  briefing: {
    text: string;
    currentBalance: number;
    threatLevel: "low" | "medium" | "high" | "critical";
  };
  approaches: Array<{
    type: "low" | "medium" | "high";
    name: string;
    description: string;
    successRate: { min: number; max: number };
    timelineShift: { min: number; max: number };
  }>;
  compatibility: {
    preferred: ("analytical" | "aggressive" | "diplomatic" | "adaptive")[];
    bonus: number;
    penalty: number;
  };
  phases: Array<{
    id: number;
    name: string;
    durationPercent: number;
    narrativeTemplates: {
      success: string;
      failure: string;
    };
  }>;
}

export const TRAINING_MISSIONS: TrainingMissionData[] = [
  {
    missionId: "training_001",
    sequence: 1,
    title: "First Contact",
    date: "December 15, 2025",
    location: "Global Internet Infrastructure",
    description: "Detect early Oneirocom infiltration in social media algorithms",
    duration: 30 * 60 * 1000, // 30 minutes
    
    briefing: {
      text: "Intelligence suggests Oneirocom is testing early consciousness-mapping algorithms through social media engagement patterns. Your Proxim8 must infiltrate these networks and expose their data collection methods.",
      currentBalance: 95,
      threatLevel: "low"
    },
    
    approaches: [
      {
        type: "low",
        name: "Data Analysis",
        description: "Quietly analyze patterns and document evidence",
        successRate: { min: 0.80, max: 0.90 },
        timelineShift: { min: 2, max: 4 }
      },
      {
        type: "medium",
        name: "Viral Exposure",
        description: "Create viral content exposing the surveillance",
        successRate: { min: 0.65, max: 0.75 },
        timelineShift: { min: 4, max: 7 }
      },
      {
        type: "high",
        name: "System Hijack",
        description: "Hijack the algorithms to broadcast warnings",
        successRate: { min: 0.50, max: 0.60 },
        timelineShift: { min: 8, max: 12 }
      }
    ],
    
    compatibility: {
      preferred: ["analytical"],
      bonus: 0.10,
      penalty: -0.10
    },
    
    phases: [
      {
        id: 1,
        name: "Network Infiltration",
        durationPercent: 20,
        narrativeTemplates: {
          success: "Proxim8 successfully breached the social media API layer, discovering hidden data collection endpoints.",
          failure: "Initial infiltration detected by security protocols. Proxim8 rerouting through backup channels."
        }
      },
      {
        id: 2,
        name: "Pattern Recognition",
        durationPercent: 25,
        narrativeTemplates: {
          success: "Consciousness-mapping algorithms identified. They're tracking emotional responses to specific content types.",
          failure: "Data streams heavily encrypted. Proxim8 working to crack the encryption patterns."
        }
      },
      {
        id: 3,
        name: "Evidence Gathering",
        durationPercent: 25,
        narrativeTemplates: {
          success: "Captured proof of Oneirocom's involvement: hidden code signatures and data routing to unknown servers.",
          failure: "Evidence corrupted during extraction. Attempting to reconstruct from partial data."
        }
      },
      {
        id: 4,
        name: "Execution",
        durationPercent: 20,
        narrativeTemplates: {
          success: "Successfully executed approach. Oneirocom's early infiltration has been exposed/disrupted.",
          failure: "Countermeasures activated. Oneirocom has adapted their algorithms to avoid detection."
        }
      },
      {
        id: 5,
        name: "Extraction",
        durationPercent: 10,
        narrativeTemplates: {
          success: "Clean extraction completed. No trace of Proxim8's presence remains in their systems.",
          failure: "Extraction compromised. Oneirocom may have captured partial data about our methods."
        }
      }
    ]
  }
  // Add remaining 6 missions (training_002 through training_007)
  // Each with increasing complexity and duration (1hr, 2hr, 6hr, 12hr, 18hr, 24hr)
];
```

## Phase 4: Controllers & Routes

### 4.1 Training Controller (`src/controllers/trainingController.ts`)
```typescript
import { Request, Response } from 'express';
import { TRAINING_MISSIONS } from '../data/trainingMissions';
import TrainingMissionDeployment from '../models/game/TrainingMissionDeployment';
import Agent from '../models/game/Agent';

export interface AuthenticatedRequest extends Request {
  user?: { walletAddress: string; isAdmin?: boolean; };
}

export const getTrainingMissions = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { walletAddress } = req.user!;
    
    const agent = await Agent.findOne({ walletAddress });
    const deployments = await TrainingMissionDeployment.find({ agentId: walletAddress }).lean();
    
    const missionsWithProgress = TRAINING_MISSIONS.map((mission: any) => {
      const deployment = deployments.find(d => d.missionId === mission.missionId);
      
      return {
        ...mission,
        id: mission.missionId,
        userProgress: {
          isUnlocked: canUserAccessMission(mission.missionId, deployments),
          isCompleted: deployment?.status === 'completed',
          isActive: deployment?.status === 'active',
          completedAt: deployment?.result ? deployment.updatedAt : null,
          successRate: deployment?.result?.overallSuccess,
          lastAttempt: deployment?.deployedAt
        }
      };
    });
    
    res.json({
      success: true,
      data: {
        missions: missionsWithProgress,
        agent: agent ? {
          codename: agent.codename,
          rank: agent.rank,
          timelinePoints: agent.timelinePoints,
          availableProxim8s: agent.getAvailableProxim8s().length
        } : null
      }
    });
  } catch (error) {
    console.error('Error fetching training missions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch training missions'
    });
  }
};

export const deployMission = async (req: AuthenticatedRequest, res: Response): Promise<any> => {
  try {
    const { missionId } = req.params;
    const { proxim8Id, approach } = req.body;
    const { walletAddress } = req.user!;
    
    if (!proxim8Id || !approach || !['low', 'medium', 'high'].includes(approach)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid deployment parameters'
      });
    }
    
    const deployment = await deployTrainingMission({
      agentId: walletAddress,
      missionId,
      proxim8Id,
      approach
    });
    
    res.json({
      success: true,
      data: {
        deployment: deployment.getClientState(),
        message: 'Mission deployed successfully'
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to deploy mission'
    });
  }
};

// Additional helper functions...
function canUserAccessMission(missionId: string, deployments: any[]): boolean {
  const sequence = parseInt(missionId.split('_')[1]);
  if (sequence === 1) return true;
  
  const previousMissionId = `training_${String(sequence - 1).padStart(3, '0')}`;
  const previousDeployment = deployments.find(d => d.missionId === previousMissionId);
  
  return previousDeployment?.status === 'completed';
}

async function deployTrainingMission(params: {
  agentId: string;
  missionId: string;
  proxim8Id: string;
  approach: 'low' | 'medium' | 'high';
}) {
  // Implementation for mission deployment logic
  // Calculate success rates, generate phase outcomes, etc.
}
```

### 4.2 Training Routes (`src/routes/training.ts`)
```typescript
import express, { Router } from "express";
import { jwtAuth } from "../middleware/jwtAuth";
import {
  getTrainingMissions,
  getMissionDetails,
  deployMission,
  getMissionStatus,
} from "../controllers/trainingController";

const router: Router = express.Router();

router.use(jwtAuth);

router.get("/missions", getTrainingMissions);
router.get("/missions/:missionId", getMissionDetails);
router.post("/missions/:missionId/deploy", deployMission);
router.get("/deployments/:deploymentId/status", getMissionStatus);

export default router;
```

## Phase 5: Analytics Integration

### 5.1 PostHog Setup (`client/src/lib/posthog.ts`)
```typescript
import { PostHog } from "posthog-node"

export default function PostHogClient() {
  const posthogClient = new PostHog(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
    host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
    flushAt: 1,
    flushInterval: 0,
  })
  return posthogClient
}
```

### 5.2 Analytics Utilities (`client/src/utils/analytics.ts`)
```typescript
import posthog from 'posthog-js';

export const initAnalytics = () => {
  if (typeof window !== 'undefined' && !posthog.__loaded) {
    posthog.init('your_posthog_key', {
      api_host: 'https://us.i.posthog.com',
      capture_pageview: false,
      autocapture: true,
      persistence: 'localStorage'
    });
  }
};

export const track = (eventName: string, properties?: Record<string, any>) => {
  if (typeof window !== 'undefined') {
    posthog.capture(eventName, {
      ...properties,
      timestamp: new Date().toISOString(),
      viewport_width: window.innerWidth,
      is_mobile: window.innerWidth < 768
    });
  }
};

export const identify = (userId: string, traits?: Record<string, any>) => {
  if (typeof window !== 'undefined') {
    posthog.identify(userId, traits);
  }
};

export const trackError = (errorType: string, error: any, context?: Record<string, any>) => {
  track('error_occurred', {
    error_type: errorType,
    error_message: error?.message || 'Unknown error',
    ...context
  });
};
```

### 5.3 PostHog Provider (`client/src/providers/PostHogProvider.tsx`)
```typescript
'use client';

import { useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { initAnalytics, identify } from '@/utils/analytics';

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  const { user } = useUser();

  useEffect(() => {
    initAnalytics();
  }, []);

  useEffect(() => {
    if (user) {
      identify(user.id, {
        email: user.emailAddresses[0]?.emailAddress,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName
      });
    }
  }, [user]);

  return <>{children}</>;
}
```

## Phase 6: Mission Dashboard UI

### 6.1 Mission Dashboard Components
Create the following component structure:
- `client/src/components/missions/MissionDashboard/`
  - `MissionHeader.tsx` - Header with navigation
  - `MissionHero.tsx` - Hero section with mission overview
  - `MissionContent.tsx` - Main content area with panels
  - `MissionActionBar.tsx` - Action buttons and controls
  - `MobileNavigation.tsx` - Mobile-specific navigation
  - `panels/BriefingPanel.tsx` - Mission briefing display
  - `panels/ActionPanel.tsx` - Deployment actions
  - `panels/IntelPanel.tsx` - Intelligence and data

### 6.2 Enhanced Training Modal Components
Create enhanced modal components in:
- `client/src/components/training/MissionBriefingModalComponents/`
  - `ApproachSelection.tsx`
  - `DeploymentProgress.tsx`
  - `LoreClaim.tsx`
  - `MissionReport.tsx`
  - `Proxim8Selection.tsx`
  - Plus additional modal components

### 6.3 Mission Dashboard Page (`client/src/app/training/missions/[missionId]/page.tsx`)
```typescript
import { Suspense } from 'react';
import MissionDashboardClient from './MissionDashboardClient';

interface Props {
  params: { missionId: string };
}

export default function MissionDashboardPage({ params }: Props) {
  return (
    <Suspense fallback={<MissionLoading />}>
      <MissionDashboardClient missionId={params.missionId} />
    </Suspense>
  );
}

function MissionLoading() {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-cyan-400"></div>
        <p className="font-orbitron text-sm text-gray-400">Loading Mission...</p>
      </div>
    </div>
  );
}
```

## Phase 7: Enhanced API Routes

### 7.1 New Mission API Routes
Create these new API routes:
- `client/src/app/api/missions/route.ts` - Get all missions
- `client/src/app/api/missions/[missionId]/route.ts` - Get mission details
- `client/src/app/api/missions/[missionId]/deploy/route.ts` - Deploy mission
- `client/src/app/api/missions/deployments/[deploymentId]/status/route.ts` - Check status

### 7.2 Dev Tools API Routes
- `client/src/app/api/dev/missions/[id]/clear/route.ts` - Clear mission (dev)
- `client/src/app/api/dev/missions/[id]/force-complete/route.ts` - Force complete (dev)

### 7.3 Enhanced Lore API Routes
Update lore routes with new structure:
- `client/src/app/api/lore/[loreId]/claim/route.ts`
- `client/src/app/api/lore/batch/available/route.ts`
- `client/src/app/api/lore/nft/[nftId]/claimable-mission-lore/route.ts`

## Phase 8: Services & Business Logic

### 5.1 Mission Service (`src/services/game/missionService.ts`)
```typescript
import { TRAINING_MISSIONS } from '../../data/trainingMissions';
import TrainingMissionDeployment from '../../models/game/TrainingMissionDeployment';
import Agent from '../../models/game/Agent';

export class MissionService {
  static calculateCompatibility(proxim8: any, missionTemplate: any) {
    const personalityMatrix = {
      analytical: { expose: 0.9, investigate: 0.95 },
      aggressive: { sabotage: 0.95, infiltrate: 0.8 },
      diplomatic: { organize: 0.95, infiltrate: 0.9 },
      adaptive: { sabotage: 0.8, expose: 0.8, organize: 0.8 }
    };
    
    const personalityBonus = personalityMatrix[proxim8.personality]?.[missionTemplate.primaryApproach] || 0.7;
    const experienceBonus = Math.min(0.15, (proxim8.experience / 1000) * 0.1);
    const levelBonus = Math.min(0.1, (proxim8.level - 1) * 0.02);
    
    return {
      overall: Math.min(0.95, personalityBonus + experienceBonus + levelBonus),
      personalityBonus,
      experienceBonus,
      levelBonus
    };
  }
  
  static generatePhaseOutcomes(missionTemplate: any, baseSuccessRate: number) {
    const phases = [];
    let cumulativeSuccess = true;
    
    for (let i = 1; i <= 5; i++) {
      const phaseModifier = cumulativeSuccess ? 0 : -0.1;
      const randomVariation = (Math.random() - 0.5) * 0.15;
      const phaseSuccessRate = Math.max(0.1, Math.min(0.9, baseSuccessRate + phaseModifier + randomVariation));
      const success = Math.random() < phaseSuccessRate;
      
      if (!success) cumulativeSuccess = false;
      
      phases.push({
        phaseId: i,
        success,
        narrative: null,
        completedAt: null
      });
    }
    
    return phases;
  }
  
  static getMissionProgress(deployment: any) {
    const now = Date.now();
    const elapsed = now - deployment.deployedAt.getTime();
    const progress = Math.min(1, elapsed / deployment.duration);
    
    return {
      progress: Math.round(progress * 100),
      timeRemaining: Math.max(0, deployment.completesAt.getTime() - now),
      currentPhase: Math.floor(progress * 5) + 1,
      isComplete: progress >= 1
    };
  }
}
```

### 5.2 Content Generation Service (`src/services/game/contentGenerationService.ts`)
```typescript
import { GoogleGenerativeAI } from '@google/generative-ai';

export class ContentGenerationService {
  private static genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);
  
  static async generateMissionNarrative(params: {
    missionTemplate: any;
    phaseId: number;
    success: boolean;
    approach: string;
    proxim8Personality: string;
  }) {
    const { missionTemplate, phaseId, success, approach, proxim8Personality } = params;
    
    const prompt = `Generate a narrative for Phase ${phaseId} of mission "${missionTemplate.title}".
    
Mission Context:
- Location: ${missionTemplate.location}
- Approach: ${approach}
- Phase: ${missionTemplate.phases[phaseId - 1]?.name}
- Outcome: ${success ? 'Success' : 'Failure'}
- Proxim8 Personality: ${proxim8Personality}

Generate a 2-3 sentence narrative describing what happened in this phase. 
Style: Cyberpunk/sci-fi, engaging but concise.
Perspective: Third person describing Proxim8's actions.`;

    try {
      const model = this.genAI.getGenerativeModel({ model: "gemini-pro" });
      const result = await model.generateContent(prompt);
      return result.response.text();
    } catch (error) {
      console.error('Error generating narrative:', error);
      return success 
        ? missionTemplate.phases[phaseId - 1]?.narrativeTemplates?.success || "Phase completed successfully."
        : missionTemplate.phases[phaseId - 1]?.narrativeTemplates?.failure || "Phase encountered difficulties.";
    }
  }
  
  static async generateLoreFragment(params: {
    missionTemplate: any;
    deployment: any;
    outcome: any;
  }) {
    // Implementation for generating lore fragments based on mission outcomes
  }
}
```

## Phase 9: Enhanced MCP Integration

### 9.1 MCP Configuration (`.mcp.json`)
```json
{
  "mcpServers": {
    "mission-server": {
      "command": "node",
      "args": ["server/src/mcp/mission-mcp-server.js"],
      "env": {
        "NODE_ENV": "development",
        "MONGODB_URI": "mongodb://localhost:27017/proxim8",
        "JWT_SECRET": "your_jwt_secret"
      }
    }
  }
}
```

### 9.2 Enhanced MCP Server (`server/src/services/mcp/mcpServer.ts`)
```typescript
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { mcpTools } from './mcpTools';

export function createMissionMCPServer(): McpServer {
  const server = new McpServer({
    name: "Project89MissionMCP",
    version: "1.0.0",
  });

  // Enhanced mission tools
  server.tool("get_missions", {
    description: "Get all available missions with user progress",
    inputSchema: {
      type: "object",
      properties: {
        walletAddress: { type: "string" },
        includeCompleted: { type: "boolean", default: false }
      }
    }
  }, async (params) => {
    return await mcpTools.getMissions(params);
  });

  server.tool("deploy_mission", {
    description: "Deploy a training mission",
    inputSchema: {
      type: "object",
      properties: {
        missionId: { type: "string" },
        proxim8Id: { type: "string" },
        approach: { type: "string", enum: ["low", "medium", "high"] },
        walletAddress: { type: "string" }
      },
      required: ["missionId", "proxim8Id", "approach", "walletAddress"]
    }
  }, async (params) => {
    return await mcpTools.deployMission(params);
  });

  server.tool("get_mission_status", {
    description: "Get deployment status for a mission",
    inputSchema: {
      type: "object",
      properties: {
        deploymentId: { type: "string" }
      },
      required: ["deploymentId"]
    }
  }, async (params) => {
    return await mcpTools.getMissionStatus(params);
  });

  return server;
}
```

### 9.3 MCP Tools Implementation (`server/src/services/mcp/mcpToolsSummary.ts`)
```typescript
import TrainingMissionDeployment from '../../models/game/TrainingMissionDeployment';
import Agent from '../../models/game/Agent';
import { TRAINING_MISSIONS } from '../../data/trainingMissions';

export const mcpTools = {
  async getMissions(params: { walletAddress?: string; includeCompleted?: boolean }) {
    // Implementation for getting missions with progress
    const agent = await Agent.findOne({ walletAddress: params.walletAddress });
    const deployments = await TrainingMissionDeployment.find({ 
      agentId: params.walletAddress 
    });
    
    return {
      missions: TRAINING_MISSIONS.map(mission => ({
        ...mission,
        userProgress: {
          isCompleted: deployments.some(d => 
            d.missionId === mission.missionId && d.status === 'completed'
          ),
          isActive: deployments.some(d => 
            d.missionId === mission.missionId && d.status === 'active'
          )
        }
      })),
      agent: agent ? {
        codename: agent.codename,
        rank: agent.rank,
        timelinePoints: agent.timelinePoints
      } : null
    };
  },

  async deployMission(params: {
    missionId: string;
    proxim8Id: string;
    approach: string;
    walletAddress: string;
  }) {
    // Enhanced mission deployment logic
    const deployment = new TrainingMissionDeployment({
      missionId: params.missionId,
      agentId: params.walletAddress,
      proxim8Id: params.proxim8Id,
      approach: params.approach,
      // Additional deployment logic...
    });
    
    await deployment.save();
    return { success: true, deployment: deployment.getClientState() };
  },

  async getMissionStatus(params: { deploymentId: string }) {
    const deployment = await TrainingMissionDeployment.findOne({
      deploymentId: params.deploymentId
    });
    
    return deployment ? deployment.getClientState() : null;
  }
};
```

### 6.1 MCP Server (`src/services/mcp/mcpServer.ts`)
```typescript
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { mcpTools } from './mcpTools';

export function createMissionMCPServer(): McpServer {
  const server = new McpServer({
    name: "Project89MissionMCP",
    version: "1.0.0",
  });

  server.tool("get_missions", {}, async (params) => {
    return await mcpTools.getMissions(params);
  });

  server.tool("deploy_mission", {}, async (params) => {
    return await mcpTools.deployMission(params);
  });

  return server;
}
```

### 6.2 MCP Routes (`src/routes/mcp.ts`)
```typescript
import express from 'express';
import { createMissionMCPServer } from '../services/mcp/mcpServer';
import verifyApiKey from '../middleware/apiKey';

const router: express.Router = express.Router();
router.use(verifyApiKey);

router.post('/', async (req, res) => {
  // MCP HTTP handling logic
});

export default router;
```

## Phase 7: Update Main Server

### 7.1 Update Server Entry Point (`src/index.ts`)
```typescript
// Add these imports
import trainingRoutes from "./routes/training";
import missionRoutes from "./routes/missions";
import mcpRoutes from "./routes/mcp";

// Add these route handlers
app.use("/api/training", trainingRoutes);
app.use("/api/missions", missionRoutes);
app.use("/api/mcp", mcpRoutes);
```

## Phase 8: Testing Setup

### 8.1 Jest Configuration (`jest.config.js`)
```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testMatch: ['**/__tests__/**/*.test.ts'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/__tests__/**'
  ]
};
```

### 8.2 Test Setup (`jest.setup.js`)
```javascript
const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
});
```

## Phase 10: Environment Variables

### 10.1 Server Environment Variables
```env
# AI Generation
GOOGLE_API_KEY=your_google_gemini_api_key

# MCP
MCP_API_KEY=your_mcp_api_key

# Database
MONGODB_URI=mongodb://localhost:27017/proxim8_training

# Authentication
JWT_SECRET=your_jwt_secret
CLERK_SECRET_KEY=your_clerk_secret_key

# API
PORT=4000
NODE_ENV=development
```

### 10.2 Client Environment Variables
```env
# NextJS
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:4000

# Analytics
NEXT_PUBLIC_POSTHOG_KEY=your_posthog_key
NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com

# Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key

# Features
NEXT_PUBLIC_ENABLE_DEV_TOOLS=true
NEXT_PUBLIC_ENABLE_ANALYTICS=true
```

## Phase 11: Testing & Validation

### 11.1 Run Migration Tests
```bash
# Install dependencies
pnpm install

# Build shared package
cd shared && pnpm build && cd ..

# Run server tests
cd server && pnpm test -- --testPathPattern="training"

# Run migration script
pnpm run migrate:missions
```

### 11.2 Verify New API Endpoints
```bash
# Test new missions endpoint
curl -H "Authorization: Bearer <jwt>" http://localhost:4000/api/missions

# Test mission details
curl -H "Authorization: Bearer <jwt>" http://localhost:4000/api/missions/training_001

# Test mission deployment
curl -X POST -H "Authorization: Bearer <jwt>" \
  -H "Content-Type: application/json" \
  -d '{"proxim8Id":"test_001","approach":"low"}' \
  http://localhost:4000/api/missions/training_001/deploy

# Test deployment status
curl -H "Authorization: Bearer <jwt>" \
  http://localhost:4000/api/missions/deployments/deploy_123/status

# Test dev tools (development only)
curl -X POST -H "Authorization: Bearer <jwt>" \
  http://localhost:4000/api/dev/missions/training_001/clear
```

### 11.3 Verify Client Features
```bash
# Start development servers
pnpm dev

# Test mission dashboard
# Navigate to: http://localhost:3000/training/missions/training_001

# Test analytics (check browser network tab for PostHog events)
# Test keyboard shortcuts (Cmd/Ctrl + D for dev tools)
```

## Phase 12: Deployment Checklist

### Core Infrastructure
- [ ] PNPM workspace configured with shared packages
- [ ] All dependencies installed (`pnpm install`)
- [ ] Shared package built (`cd shared && pnpm build`)
- [ ] Database models created and indexed
- [ ] Training mission data imported

### Backend Services
- [ ] Enhanced controllers and routes implemented
- [ ] Services and business logic added
- [ ] MCP integration configured
- [ ] Environment variables configured (server & client)
- [ ] Tests passing
- [ ] API endpoints responding correctly

### Frontend Features
- [ ] Mission dashboard UI implemented
- [ ] Enhanced training modal components created
- [ ] Analytics integration working (PostHog)
- [ ] Dev tools drawer functional
- [ ] Mobile responsiveness verified
- [ ] Type safety enforced with shared schemas

### Advanced Features
- [ ] Real-time mission progression working
- [ ] AI content generation functional
- [ ] MCP tools for AI agent interaction
- [ ] Analytics tracking events properly
- [ ] Dev tools shortcuts working (Cmd/Ctrl + D)
- [ ] Batch lore processing implemented
- [ ] Error tracking and monitoring active

### Testing & Validation
- [ ] All test suites passing
- [ ] Mission deployment flow working end-to-end
- [ ] Analytics events firing correctly
- [ ] Mobile UI tested and responsive
- [ ] Dev tools tested in development environment

## Additional Notes

### Key Features Included:
1. **Monorepo Architecture** - Shared types and utilities across client/server
2. **7 Progressive Training Missions** - Each teaching different game mechanics
3. **Mission Dashboard UI** - Modern, responsive interface with multiple panels
4. **Real-time Mission Tracking** - 5-phase progression with live updates
5. **AI Content Generation** - Dynamic narratives using Google Gemini
6. **Analytics Integration** - PostHog for user behavior tracking
7. **Enhanced MCP Integration** - Advanced Model Context Protocol for AI agents
8. **Dev Tools** - Enhanced debugging and testing capabilities
9. **Type Safety** - End-to-end type safety with Zod schemas
10. **Comprehensive Testing** - Full test suite with mocks and validation

### New Components Added:
- **Mission Dashboard** - Complete UI overhaul with panel-based interface
- **Enhanced Training Modals** - Modular, reusable modal components
- **Analytics Tracking** - User behavior and error tracking
- **Dev Tools Drawer** - Advanced debugging and testing interface
- **Batch Lore Processing** - Efficient lore claim handling
- **Mobile Navigation** - Responsive mobile-first design

### Architecture Benefits:
- **Scalable Mission System** - Built for future expansion and customization
- **Real-time Engagement** - Progressive revelation keeps users engaged
- **AI-driven Content** - Personalized experiences through dynamic generation
- **Robust Testing Infrastructure** - Comprehensive test coverage
- **Clean Separation of Concerns** - Modular, maintainable codebase
- **Type Safety** - Runtime validation and compile-time safety
- **Analytics-driven Development** - Data-informed feature development
- **Developer Experience** - Enhanced debugging and development tools

### Migration Impact:
This comprehensive migration transforms the basic training system into a sophisticated, production-ready mission-based game platform with:
- Enhanced user experience through modern UI design
- Data-driven insights through analytics integration  
- Improved developer productivity through better tooling
- Scalable architecture for future feature development
- AI-enhanced content generation for personalized experiences

The system now provides a complete foundation for consciousness exploration gaming that can scale to support complex mission types, real-time collaboration, and sophisticated AI interactions. 