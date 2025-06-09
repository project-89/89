import mongoose, { Schema, Document } from "mongoose";

export interface IMissionDeployment extends Document {
  // Core identifiers
  deploymentId: string;
  missionType: 'training' | 'timeline' | 'critical' | 'event';
  missionId: string; // For training: training_001, for timeline: timeline_2027_06_15
  agentId: string;
  proxim8Id: string;
  
  // Mission context
  timelineNode?: {
    year: number;
    month?: number;
    day?: number;
    isClaimedByUser?: boolean;
    isCriticalJuncture?: boolean;
  };
  
  // Mission parameters
  approach: 'aggressive' | 'balanced' | 'cautious' | 'low' | 'medium' | 'high';
  deployedAt: Date;
  completesAt: Date;
  duration: number;
  
  // Status tracking
  status: 'active' | 'completed' | 'abandoned' | 'interrupted';
  currentPhase: number;
  
  // Pre-calculated outcomes
  finalSuccessRate: number;
  phaseOutcomes: {
    phaseId: number;
    success: boolean;
    narrative?: string;
    completedAt?: Date;
    choicesMade?: string[]; // For multi-choice missions
  }[];
  
  // Communication system (Phase 2)
  communications?: {
    timestamp: Date;
    type: 'status_update' | 'choice_point' | 'emergency' | 'intel';
    message: string;
    requiresResponse?: boolean;
    choices?: string[];
    response?: string;
  }[];
  
  // Final results
  result?: {
    overallSuccess: boolean;
    finalNarrative: string;
    imageUrl?: string;
    videoUrl?: string; // For Phase 2 video generation
    timelineShift: number;
    influenceType: 'green_loom' | 'grey_loom';
    rewards: {
      timelinePoints: number;
      experience: number;
      loreFragments: string[];
      memoryCaches: string[];
      achievements: string[];
      nftArtifacts?: string[]; // For Phase 2
      governanceTokens?: number; // For Phase 2
    };
  };
  
  // Timeline impact
  timelineInfluence?: {
    nodeId: string; // Unique identifier for timeline position
    influencePoints: number;
    influenceType: 'green_loom' | 'grey_loom';
    cascadeEffects: string[]; // Other nodes affected
  };
  
  // Coordinator system integration
  coordinatorInfluence?: {
    primary: string; // Main coordinator aligned with mission
    secondary?: string; // Supporting coordinator
    opposing: string; // Coordinator antithetical to mission approach
    synergy: number; // 0.8-1.2 multiplier for success rate
    resistance: number; // 0.7-0.9 multiplier for opposing forces
  };
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}

const MissionDeploymentSchema = new Schema({
  deploymentId: {
    type: String,
    required: true,
    unique: true,
    index: true,
    default: () => `mission_deploy_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  },
  
  missionType: {
    type: String,
    required: true,
    enum: ['training', 'timeline', 'critical', 'event'],
    index: true
  },
  
  missionId: {
    type: String,
    required: true,
    index: true
  },
  
  agentId: { type: String, required: true, index: true },
  proxim8Id: { type: String, required: true },
  
  timelineNode: {
    year: { type: Number, min: 2025, max: 2089 },
    month: { type: Number, min: 1, max: 12 },
    day: { type: Number, min: 1, max: 31 },
    isClaimedByUser: { type: Boolean, default: false },
    isCriticalJuncture: { type: Boolean, default: false }
  },
  
  approach: {
    type: String,
    required: true,
    enum: ['aggressive', 'balanced', 'cautious', 'low', 'medium', 'high']
  },
  
  deployedAt: { type: Date, default: Date.now },
  completesAt: { type: Date, required: true },
  duration: { type: Number, required: true },
  
  status: {
    type: String,
    enum: ['active', 'completed', 'abandoned', 'interrupted'],
    default: 'active',
    index: true
  },
  
  currentPhase: { type: Number, default: 0, min: 0, max: 5 },
  
  finalSuccessRate: {
    type: Number,
    required: true,
    min: 0,
    max: 1
  },
  
  phaseOutcomes: [{
    phaseId: { type: Number, required: true, min: 1, max: 5 },
    success: { type: Boolean, required: true },
    narrative: { type: String },
    completedAt: { type: Date },
    choicesMade: [{ type: String }]
  }],
  
  communications: [{
    timestamp: { type: Date, default: Date.now },
    type: {
      type: String,
      enum: ['status_update', 'choice_point', 'emergency', 'intel'],
      required: true
    },
    message: { type: String, required: true },
    requiresResponse: { type: Boolean, default: false },
    choices: [{ type: String }],
    response: { type: String }
  }],
  
  result: {
    overallSuccess: { type: Boolean },
    finalNarrative: { type: String },
    imageUrl: { type: String },
    videoUrl: { type: String },
    timelineShift: { type: Number },
    influenceType: {
      type: String,
      enum: ['green_loom', 'grey_loom']
    },
    rewards: {
      timelinePoints: { type: Number },
      experience: { type: Number },
      loreFragments: [{ type: String }],
      memoryCaches: [{ type: String }],
      achievements: [{ type: String }],
      nftArtifacts: [{ type: String }],
      governanceTokens: { type: Number }
    }
  },
  
  timelineInfluence: {
    nodeId: { type: String },
    influencePoints: { type: Number },
    influenceType: {
      type: String,
      enum: ['green_loom', 'grey_loom']
    },
    cascadeEffects: [{ type: String }]
  },
  
  coordinatorInfluence: {
    primary: { type: String, required: false },
    secondary: { type: String, required: false },
    opposing: { type: String, required: false },
    synergy: { type: Number, required: false },
    resistance: { type: Number, required: false }
  },
  
  completedAt: { type: Date }
}, {
  timestamps: true
});

// Indexes for efficient queries
MissionDeploymentSchema.index({ agentId: 1, status: 1 });
MissionDeploymentSchema.index({ status: 1, completesAt: 1 });
MissionDeploymentSchema.index({ missionType: 1, 'timelineNode.year': 1 });
MissionDeploymentSchema.index({ 'timelineInfluence.nodeId': 1 });

// Virtual to check if mission is ready to complete
MissionDeploymentSchema.virtual('isReadyToComplete').get(function() {
  return this.status === 'active' && new Date() >= this.completesAt;
});

// Virtual to get time remaining
MissionDeploymentSchema.virtual('timeRemaining').get(function() {
  if (this.status !== 'active') return 0;
  const remaining = this.completesAt.getTime() - Date.now();
  return Math.max(0, remaining);
});

// Method to check if a phase should be revealed
MissionDeploymentSchema.methods.shouldRevealPhase = function(phaseId: number): boolean {
  if (this.status !== "active") return true;
  
  const now = Date.now();
  const elapsed = now - this.deployedAt.getTime();
  const progress = elapsed / this.duration;
  
  const phaseTimings = [0.2, 0.45, 0.7, 0.9, 1.0];
  
  return progress >= phaseTimings[phaseId - 1];
};

// Method to get current mission state for client
MissionDeploymentSchema.methods.getClientState = function() {
  const phases = [];
  
  for (let i = 0; i < this.phaseOutcomes.length; i++) {
    const phase = this.phaseOutcomes[i];
    const shouldReveal = this.shouldRevealPhase(phase.phaseId);
    
    if (shouldReveal) {
      phases.push({
        phaseId: phase.phaseId,
        success: phase.success,
        narrative: phase.narrative || "Phase in progress...",
        completedAt: phase.completedAt,
        status: phase.completedAt ? (phase.success ? "success" : "failure") : "active",
        choicesMade: phase.choicesMade || []
      });
    } else {
      phases.push({
        phaseId: phase.phaseId,
        status: "pending"
      });
    }
  }
  
  return {
    deploymentId: this.deploymentId,
    missionType: this.missionType,
    missionId: this.missionId,
    status: this.status,
    currentPhase: this.currentPhase,
    deployedAt: this.deployedAt,
    completesAt: this.completesAt,
    timelineNode: this.timelineNode,
    phases,
    communications: this.communications || [],
    result: this.status === "completed" ? this.result : undefined,
    timelineInfluence: this.timelineInfluence
  };
};

// Static method to check if user can deploy a mission
MissionDeploymentSchema.statics.canDeployMission = async function(
  agentId: string,
  missionId: string,
  missionType: string = 'training'
): Promise<{ canDeploy: boolean; reason?: string }> {
  
  // Check if mission is already active
  const activeMission = await this.findOne({
    agentId,
    missionId,
    status: "active"
  });
  
  if (activeMission) {
    return { canDeploy: false, reason: "Mission already in progress" };
  }
  
  // For training missions, check if already completed
  if (missionType === 'training') {
    const completedMission = await this.findOne({
      agentId,
      missionId,
      status: "completed"
    });
    
    if (completedMission) {
      return { canDeploy: false, reason: "Training mission already completed" };
    }
    
    // Check sequential unlock for training missions
    const missionSequence = parseInt(missionId.split("_")[1]);
    if (missionSequence > 1) {
      const previousMissionId = `training_${String(missionSequence - 1).padStart(3, "0")}`;
      const previousComplete = await this.findOne({
        agentId,
        missionId: previousMissionId,
        status: "completed"
      });
      
      if (!previousComplete) {
        return { canDeploy: false, reason: "Previous training mission not completed" };
      }
    }
  }
  
  // For timeline missions, check if node is already claimed by another user
  if (missionType === 'timeline') {
    // Extract timeline coordinates from missionId (e.g., timeline_2027_06_15)
    const timelineParts = missionId.split('_');
    if (timelineParts.length >= 2) {
      const year = parseInt(timelineParts[1]);
      const month = timelineParts.length > 2 ? parseInt(timelineParts[2]) : undefined;
      const day = timelineParts.length > 3 ? parseInt(timelineParts[3]) : undefined;
      
      const claimedNode = await this.findOne({
        'timelineNode.year': year,
        'timelineNode.month': month,
        'timelineNode.day': day,
        status: { $in: ['active', 'completed'] },
        agentId: { $ne: agentId } // Not by this user
      });
      
      if (claimedNode) {
        return { canDeploy: false, reason: "Timeline node already claimed by another agent" };
      }
    }
  }
  
  return { canDeploy: true };
};

export default mongoose.model<IMissionDeployment>('MissionDeployment', MissionDeploymentSchema);