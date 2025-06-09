import mongoose, { Schema, Document } from "mongoose";

export interface IMissionTemplate extends Document {
  // Core identifiers
  templateId: string;
  missionType: 'training' | 'timeline' | 'critical' | 'event';
  
  // Basic mission data
  sequence?: number; // For training missions
  missionName: string;
  category: string; // 'infiltration', 'sabotage', 'investigation', 'exposure', etc.
  
  // Timeline context (for timeline missions)
  timeContext?: {
    yearRange: { min: number; max: number };
    era: 'early_resistance' | 'consolidation' | 'grey_zones' | 'convergence';
    historicalContext: string;
    keyEvents: string[];
  };
  
  // Mission content
  briefingTemplate: string; // Template with variables like {year}, {location}, {threat}
  description: string;
  primaryApproach: 'aggressive' | 'balanced' | 'cautious';
  
  // Contextual variables for procedural generation
  variables?: {
    locations: string[];
    threats: string[];
    targets: string[];
    technologies: string[];
    characters: string[];
  };
  
  // Approach configurations
  approaches: {
    aggressive?: {
      name: string;
      description: string;
      duration: number; // in milliseconds
      baseSuccessRate: number;
      riskLevel: 'high' | 'extreme';
      rewards: {
        timelinePoints: number;
        experience: number;
        influenceMultiplier: number;
      };
      narrativeTemplates: {
        success: string;
        failure: string;
        perfectSuccess?: string;
        totalFailure?: string;
      };
    };
    balanced?: {
      name: string;
      description: string;
      duration: number;
      baseSuccessRate: number;
      riskLevel: 'medium';
      rewards: {
        timelinePoints: number;
        experience: number;
        influenceMultiplier: number;
      };
      narrativeTemplates: {
        success: string;
        failure: string;
        perfectSuccess?: string;
        totalFailure?: string;
      };
    };
    cautious?: {
      name: string;
      description: string;
      duration: number;
      baseSuccessRate: number;
      riskLevel: 'low';
      rewards: {
        timelinePoints: number;
        experience: number;
        influenceMultiplier: number;
      };
      narrativeTemplates: {
        success: string;
        failure: string;
        perfectSuccess?: string;
        totalFailure?: string;
      };
    };
    // Legacy support for training missions
    low?: any;
    medium?: any;
    high?: any;
  };
  
  // Mission phases structure
  phases: {
    id: number;
    name: string;
    description: string;
    duration: number; // percentage of total mission time
    challengeRating: number; // 1-10 difficulty
    criticalPath: boolean; // Whether failure here affects subsequent phases
    choicePoints?: { // For Phase 2 dynamic missions
      condition: string;
      choices: {
        id: string;
        description: string;
        effect: 'success_boost' | 'risk_reduction' | 'intel_gain' | 'cascade_prevention';
        magnitude: number;
      }[];
    };
  }[];
  
  // Reward configuration
  baseRewards: {
    timelinePoints: { min: number; max: number };
    experience: { min: number; max: number };
    loreFragmentChance: number;
    memoryCacheChance: number;
    achievementTriggers: string[];
  };
  
  // Timeline influence settings
  influenceSettings: {
    baseInfluencePoints: number;
    criticalJunctureMultiplier?: number;
    cascadeRadius?: number; // How many adjacent nodes are affected
    temporalStability: number; // How resistant this node is to change
  };
  
  // Content generation settings
  contentGeneration?: {
    useAI: boolean;
    aiModel?: string;
    promptTemplate?: string;
    fallbackNarratives: string[];
    imageGenerationPrompt?: string;
    videoGenerationPrompt?: string; // For Phase 2
  };
  
  // Prerequisites and unlocks
  requirements?: {
    minimumRank?: string;
    previousMissions?: string[];
    timelinePrerequisites?: string[];
    specialAccess?: string[];
  };
  
  // Collaborative elements  
  contributors?: Array<{
    userId: string;
    walletAddress: string;
    contributionType: 'creator' | 'editor' | 'reviewer' | 'community';
    timestamp: Date;
    contribution: string;
  }>;
  
  // Community governance
  communityMetrics?: {
    totalVotes: number;
    approvalRating: number;
    deploymentCount: number;
    averageSuccessRate: number;
    playerFeedback: number;
  };
  
  // Version control
  versionHistory?: Array<{
    version: string;
    timestamp: Date;
    changes: string;
    contributor: string;
    approved: boolean;
  }>;
  
  // Mission status
  status?: 'draft' | 'review' | 'approved' | 'active' | 'archived';
  
  // Narrative elements
  narrativeThreads?: string[];
  precedingMissions?: string[];
  followingMissions?: string[];
  
  // Reality engineering
  realityAnchors?: Array<{
    anchorType: 'narrative' | 'synchronicity' | 'probability';
    strength: number;
    description: string;
  }>;
  
  // Metadata
  isActive: boolean;
  difficulty: number; // 1-10 scale
  estimatedDuration: string; // Human readable
  tags: string[];
  createdBy: string;
  version: number;
  
  createdAt: Date;
  updatedAt: Date;
}

const MissionTemplateSchema = new Schema({
  templateId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  
  missionType: {
    type: String,
    required: true,
    enum: ['training', 'timeline', 'critical', 'event'],
    index: true
  },
  
  sequence: { type: Number }, // Only for training missions
  missionName: { type: String, required: true },
  category: { type: String, required: true, index: true },
  
  timeContext: {
    yearRange: {
      min: { type: Number, min: 2025, max: 2089 },
      max: { type: Number, min: 2025, max: 2089 }
    },
    era: {
      type: String,
      enum: ['early_resistance', 'consolidation', 'grey_zones', 'convergence']
    },
    historicalContext: { type: String },
    keyEvents: [{ type: String }]
  },
  
  briefingTemplate: { type: String, required: true },
  description: { type: String, required: true },
  primaryApproach: {
    type: String,
    enum: ['aggressive', 'balanced', 'cautious'],
    required: true
  },
  
  variables: {
    locations: [{ type: String }],
    threats: [{ type: String }],
    targets: [{ type: String }],
    technologies: [{ type: String }],
    characters: [{ type: String }]
  },
  
  approaches: {
    aggressive: {
      name: { type: String },
      description: { type: String },
      duration: { type: Number },
      baseSuccessRate: { type: Number, min: 0, max: 1 },
      riskLevel: { type: String, enum: ['high', 'extreme'] },
      rewards: {
        timelinePoints: { type: Number },
        experience: { type: Number },
        influenceMultiplier: { type: Number, default: 1 }
      },
      narrativeTemplates: {
        success: { type: String },
        failure: { type: String },
        perfectSuccess: { type: String },
        totalFailure: { type: String }
      }
    },
    balanced: {
      name: { type: String },
      description: { type: String },
      duration: { type: Number },
      baseSuccessRate: { type: Number, min: 0, max: 1 },
      riskLevel: { type: String, enum: ['medium'] },
      rewards: {
        timelinePoints: { type: Number },
        experience: { type: Number },
        influenceMultiplier: { type: Number, default: 1 }
      },
      narrativeTemplates: {
        success: { type: String },
        failure: { type: String },
        perfectSuccess: { type: String },
        totalFailure: { type: String }
      }
    },
    cautious: {
      name: { type: String },
      description: { type: String },
      duration: { type: Number },
      baseSuccessRate: { type: Number, min: 0, max: 1 },
      riskLevel: { type: String, enum: ['low'] },
      rewards: {
        timelinePoints: { type: Number },
        experience: { type: Number },
        influenceMultiplier: { type: Number, default: 1 }
      },
      narrativeTemplates: {
        success: { type: String },
        failure: { type: String },
        perfectSuccess: { type: String },
        totalFailure: { type: String }
      }
    },
    // Legacy support
    low: { type: Schema.Types.Mixed },
    medium: { type: Schema.Types.Mixed },
    high: { type: Schema.Types.Mixed }
  },
  
  phases: [{
    id: { type: Number, required: true },
    name: { type: String, required: true },
    description: { type: String, required: true },
    duration: { type: Number, required: true }, // percentage
    challengeRating: { type: Number, min: 1, max: 10, required: true },
    criticalPath: { type: Boolean, default: false },
    choicePoints: {
      condition: { type: String },
      choices: [{
        id: { type: String, required: true },
        description: { type: String, required: true },
        effect: {
          type: String,
          enum: ['success_boost', 'risk_reduction', 'intel_gain', 'cascade_prevention']
        },
        magnitude: { type: Number }
      }]
    }
  }],
  
  baseRewards: {
    timelinePoints: {
      min: { type: Number, required: true },
      max: { type: Number, required: true }
    },
    experience: {
      min: { type: Number, required: true },
      max: { type: Number, required: true }
    },
    loreFragmentChance: { type: Number, min: 0, max: 1, default: 0.3 },
    memoryCacheChance: { type: Number, min: 0, max: 1, default: 0.2 },
    achievementTriggers: [{ type: String }]
  },
  
  influenceSettings: {
    baseInfluencePoints: { type: Number, required: true },
    criticalJunctureMultiplier: { type: Number, default: 2 },
    cascadeRadius: { type: Number, default: 1 },
    temporalStability: { type: Number, min: 0, max: 1, default: 0.5 }
  },
  
  contentGeneration: {
    useAI: { type: Boolean, default: false },
    aiModel: { type: String },
    promptTemplate: { type: String },
    fallbackNarratives: [{ type: String }],
    imageGenerationPrompt: { type: String },
    videoGenerationPrompt: { type: String }
  },
  
  requirements: {
    minimumRank: { type: String },
    previousMissions: [{ type: String }],
    timelinePrerequisites: [{ type: String }],
    specialAccess: [{ type: String }]
  },
  
  // Collaborative elements
  contributors: [{
    userId: { type: String, required: true },
    walletAddress: { type: String, required: true },
    contributionType: { 
      type: String, 
      enum: ['creator', 'editor', 'reviewer', 'community'],
      required: true 
    },
    timestamp: { type: Date, default: Date.now },
    contribution: { type: String, required: true }
  }],
  
  // Community governance
  communityMetrics: {
    totalVotes: { type: Number, default: 0 },
    approvalRating: { type: Number, default: 0 },
    deploymentCount: { type: Number, default: 0 },
    averageSuccessRate: { type: Number, default: 0 },
    playerFeedback: { type: Number, default: 0 }
  },
  
  // Version control
  versionHistory: [{
    version: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    changes: { type: String, required: true },
    contributor: { type: String, required: true },
    approved: { type: Boolean, default: false }
  }],
  
  // Mission status
  status: { 
    type: String, 
    enum: ['draft', 'review', 'approved', 'active', 'archived'],
    default: 'draft'
  },
  
  // Narrative elements
  narrativeThreads: [{ type: String }],
  precedingMissions: [{ type: String }],
  followingMissions: [{ type: String }],
  
  // Reality engineering
  realityAnchors: [{
    anchorType: { 
      type: String, 
      enum: ['narrative', 'synchronicity', 'probability'],
      required: true 
    },
    strength: { type: Number, min: 1, max: 10, required: true },
    description: { type: String, required: true }
  }],
  
  isActive: { type: Boolean, default: true },
  difficulty: { type: Number, min: 1, max: 10, required: true },
  estimatedDuration: { type: String, required: true },
  tags: [{ type: String }],
  createdBy: { type: String, required: true },
  version: { type: Number, default: 1 }
}, {
  timestamps: true
});

// Indexes for efficient queries
MissionTemplateSchema.index({ missionType: 1, isActive: 1 });
MissionTemplateSchema.index({ category: 1, difficulty: 1 });
MissionTemplateSchema.index({ 'timeContext.era': 1 });
MissionTemplateSchema.index({ tags: 1 });

// Method to generate a specific mission from template
MissionTemplateSchema.methods.generateMission = function(context: {
  year?: number;
  location?: string;
  personalContext?: any;
}) {
  let briefing = this.briefingTemplate;
  
  // Replace template variables
  if (context.year) {
    briefing = briefing.replace(/\{year\}/g, context.year.toString());
  }
  
  if (context.location && this.variables?.locations) {
    const location = context.location || 
      this.variables.locations[Math.floor(Math.random() * this.variables.locations.length)];
    briefing = briefing.replace(/\{location\}/g, location);
  }
  
  // Generate procedural elements if variables exist
  if (this.variables) {
    ['threats', 'targets', 'technologies', 'characters'].forEach(varType => {
      const options = this.variables![varType as keyof typeof this.variables];
      if (options && options.length > 0) {
        const selected = options[Math.floor(Math.random() * options.length)];
        briefing = briefing.replace(
          new RegExp(`\\{${varType}\\}`, 'g'), 
          selected
        );
      }
    });
  }
  
  return {
    ...this.toObject(),
    briefing,
    generatedContext: context
  };
};

// Static method to find templates for timeline generation
MissionTemplateSchema.statics.findForTimeline = async function(
  year: number,
  category?: string,
  difficulty?: number
) {
  const query: any = {
    missionType: { $in: ['timeline', 'critical'] },
    isActive: true,
    $or: [
      { 'timeContext.yearRange.min': { $lte: year }, 'timeContext.yearRange.max': { $gte: year } },
      { timeContext: { $exists: false } } // Generic templates
    ]
  };
  
  if (category) {
    query.category = category;
  }
  
  if (difficulty) {
    query.difficulty = { $lte: difficulty };
  }
  
  return this.find(query).sort({ difficulty: 1 });
};

export default mongoose.model<IMissionTemplate>('MissionTemplate', MissionTemplateSchema);