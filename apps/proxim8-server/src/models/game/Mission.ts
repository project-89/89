import mongoose, { Schema, Document } from 'mongoose';

export interface IMission extends Document {
  // Core identifiers
  missionId: string; // Unique mission identifier
  agentId: string; // User ID who deployed the mission
  walletAddress: string; // Wallet address for verification
  proxim8Id: string; // NFT ID of the deployed Proxim8
  timelineEventId: string; // Reference to the timeline event
  
  // Mission configuration
  approach: 'sabotage' | 'expose' | 'organize'; // Chosen intervention approach
  deployedAt: Date; // When the mission started
  completesAt: Date; // When the mission will complete (24 hours later)
  missionDuration: number; // Duration in milliseconds (for variable times later)
  
  // Mission state
  status: 'preparing' | 'active' | 'completed' | 'failed' | 'abandoned';
  successRoll?: number; // Random roll that determined success (0-100)
  difficultyModifier: number; // Difficulty based on timeline state and previous missions
  finalSuccessChance: number; // Calculated success chance at deployment
  
  // Narrative elements
  preMissionDialogue?: string; // Proxim8's pre-mission assessment
  statusUpdates: [{
    timestamp: Date;
    message: string;
    severity: 'info' | 'warning' | 'critical';
  }];
  
  // Results (populated after completion)
  result?: {
    success: boolean;
    narrativeReport: string; // Full mission report
    timelineShift: number; // Actual probability shift achieved
    cascadeEffectsTriggered: string[]; // Event IDs affected by this mission
    loreSeed?: string; // Seed for generating lore fragment
  };
  
  // Rewards (populated after completion)
  rewards?: {
    timelinePoints: number;
    loreFragments: [{
      id: string;
      title: string;
      content: string;
      rarity: 'common' | 'uncommon' | 'rare' | 'legendary';
    }];
    memoryCaches: [{
      id: string;
      title: string;
      type: 'image' | 'audio' | 'video' | 'document';
      url?: string; // URL to media if applicable
    }];
    experienceGained: number; // XP for the Proxim8
    specialRewards?: string[]; // Any special unlocks or achievements
  };
  
  // Community tracking
  visibilityLevel: 'private' | 'friends' | 'public'; // Who can see this mission
  qualityScore?: number; // Community rating of the narrative quality
  canonicalContribution: boolean; // Whether this mission contributed to canon
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}

const MissionSchema = new Schema({
  missionId: { type: String, required: true, unique: true, index: true },
  agentId: { type: String, required: true, index: true },
  walletAddress: { type: String, required: true, index: true },
  proxim8Id: { type: String, required: true, index: true },
  timelineEventId: { type: String, required: true, index: true },
  
  approach: { type: String, enum: ['sabotage', 'expose', 'organize'], required: true },
  deployedAt: { type: Date, required: true, default: Date.now },
  completesAt: { type: Date, required: true },
  missionDuration: { type: Number, default: 86400000 }, // 24 hours in ms
  
  status: { 
    type: String, 
    enum: ['preparing', 'active', 'completed', 'failed', 'abandoned'], 
    default: 'preparing',
    index: true 
  },
  successRoll: { type: Number, min: 0, max: 100 },
  difficultyModifier: { type: Number, default: 0 },
  finalSuccessChance: { type: Number, required: true, min: 0, max: 100 },
  
  preMissionDialogue: { type: String },
  statusUpdates: [{
    timestamp: { type: Date, default: Date.now },
    message: { type: String, required: true },
    severity: { type: String, enum: ['info', 'warning', 'critical'], default: 'info' }
  }],
  
  result: {
    success: { type: Boolean },
    narrativeReport: { type: String },
    timelineShift: { type: Number },
    cascadeEffectsTriggered: [{ type: String }],
    loreSeed: { type: String }
  },
  
  rewards: {
    timelinePoints: { type: Number },
    loreFragments: [{
      id: { type: String },
      title: { type: String },
      content: { type: String },
      rarity: { type: String, enum: ['common', 'uncommon', 'rare', 'legendary'] }
    }],
    memoryCaches: [{
      id: { type: String },
      title: { type: String },
      type: { type: String, enum: ['image', 'audio', 'video', 'document'] },
      url: { type: String }
    }],
    experienceGained: { type: Number },
    specialRewards: [{ type: String }]
  },
  
  visibilityLevel: { type: String, enum: ['private', 'friends', 'public'], default: 'public' },
  qualityScore: { type: Number, min: 1, max: 5 },
  canonicalContribution: { type: Boolean, default: false },
  
  completedAt: { type: Date }
}, {
  timestamps: true
});

// Indexes for efficient queries
MissionSchema.index({ status: 1, completesAt: 1 }); // For finding missions ready to complete
MissionSchema.index({ agentId: 1, status: 1 }); // For user's active missions
MissionSchema.index({ timelineEventId: 1, status: 1 }); // For event statistics
MissionSchema.index({ completesAt: 1 }); // For timer-based queries

// Virtual to check if mission is ready to complete
MissionSchema.virtual('isReadyToComplete').get(function() {
  return this.status === 'active' && new Date() >= this.completesAt;
});

// Virtual to get time remaining
MissionSchema.virtual('timeRemaining').get(function() {
  if (this.status !== 'active') return 0;
  const remaining = this.completesAt.getTime() - Date.now();
  return Math.max(0, remaining);
});

// Method to add status update
MissionSchema.methods.addStatusUpdate = function(message: string, severity: 'info' | 'warning' | 'critical' = 'info') {
  this.statusUpdates.push({
    timestamp: new Date(),
    message,
    severity
  });
  return this.save();
};

// Method to check if user can deploy to this event
MissionSchema.statics.canDeployToEvent = async function(agentId: string, timelineEventId: string): Promise<boolean> {
  // Check if user already has an active mission on this event
  const activeMission = await this.findOne({
    agentId,
    timelineEventId,
    status: { $in: ['preparing', 'active'] }
  });
  
  return !activeMission;
};

export default mongoose.model<IMission>('Mission', MissionSchema);