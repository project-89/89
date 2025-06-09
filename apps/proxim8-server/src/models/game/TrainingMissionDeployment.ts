import mongoose, { Schema, Document } from "mongoose";

export interface ITrainingMissionDeployment extends Document {
  // Core identifiers
  deploymentId: string; // Unique deployment ID
  missionId: string; // Reference to training mission (training_001-007)
  agentId: string; // User ID
  proxim8Id: string; // NFT ID used
  
  // Mission parameters
  approach: "low" | "medium" | "high";
  deployedAt: Date;
  completesAt: Date;
  duration: number; // Mission duration in ms
  
  // Status tracking
  status: "active" | "completed" | "abandoned";
  currentPhase: number; // 0-5 (0 = not started, 1-5 = phases)
  
  // Pre-calculated outcomes
  finalSuccessRate: number; // Calculated at deployment
  phaseOutcomes: {
    phaseId: number; // 1-5
    name: string;
    success: boolean;
    diceRoll: number;
    successThreshold: number;
    narrative?: string;
    firstPersonReport?: string;
    structuredData?: any;
    imagePrompt?: string;
    revealTime?: Date;
    completedAt?: Date;
    tensionLevel?: string;
  }[];
  
  // Final results (set on completion)
  result?: {
    overallSuccess: boolean;
    finalNarrative: string;
    imageUrl?: string;
    imageGenerationStatus?: "pending" | "processing" | "completed" | "failed";
    timelineShift: number;
    rewards: {
      timelinePoints: number;
      experience: number;
      loreFragments?: string[];
      achievements?: string[];
    };
  };
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

const TrainingMissionDeploymentSchema = new Schema(
  {
    deploymentId: { 
      type: String, 
      required: true, 
      unique: true, 
      index: true,
      default: () => `training_deploy_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    },
    missionId: { 
      type: String, 
      required: true, 
      index: true,
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
      default: "active",
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
      name: { type: String, required: true },
      success: { type: Boolean, required: true },
      diceRoll: { type: Number, required: true },
      successThreshold: { type: Number, required: true },
      narrative: { type: String },
      firstPersonReport: { type: String },
      structuredData: { type: Schema.Types.Mixed },
      imagePrompt: { type: String },
      revealTime: { type: Date },
      completedAt: { type: Date },
      tensionLevel: { type: String, enum: ['low', 'medium', 'high', 'critical'] }
    }],
    
    result: {
      overallSuccess: { type: Boolean },
      finalNarrative: { type: String },
      imageUrl: { type: String },
      imageGenerationStatus: {
        type: String,
        enum: ["pending", "processing", "completed", "failed"]
      },
      timelineShift: { type: Number },
      rewards: {
        timelinePoints: { type: Number },
        experience: { type: Number },
        loreFragments: [{ type: String }],
        achievements: [{ type: String }]
      }
    }
  },
  {
    timestamps: true
  }
);

// Indexes for efficient queries
TrainingMissionDeploymentSchema.index({ agentId: 1, status: 1 }); // User's missions
TrainingMissionDeploymentSchema.index({ status: 1, completesAt: 1 }); // Active missions by completion time
TrainingMissionDeploymentSchema.index({ missionId: 1, "result.overallSuccess": 1 }); // Success rates per mission

// Method to check if a phase should be revealed
TrainingMissionDeploymentSchema.methods.shouldRevealPhase = function(phaseId: number): boolean {
  if (this.status !== "active") return true; // All phases visible if mission complete
  
  const now = Date.now();
  const elapsed = now - this.deployedAt.getTime();
  const progress = elapsed / this.duration;
  
  // Phase timings (cumulative percentages)
  const phaseTimings = [0.2, 0.45, 0.7, 0.9, 1.0];
  
  return progress >= phaseTimings[phaseId - 1];
};

// Method to get current mission state for client
TrainingMissionDeploymentSchema.methods.getClientState = function() {
  const phases = [];
  
  for (let i = 0; i < this.phaseOutcomes.length; i++) {
    const phase = this.phaseOutcomes[i];
    const shouldReveal = this.shouldRevealPhase(phase.phaseId);
    
    if (shouldReveal) {
      phases.push({
        phaseId: phase.phaseId,
        name: phase.name,
        success: phase.success,
        diceRoll: phase.diceRoll,
        successThreshold: phase.successThreshold,
        narrative: phase.narrative || "Phase in progress...",
        firstPersonReport: phase.firstPersonReport,
        structuredData: phase.structuredData,
        imagePrompt: phase.imagePrompt,
        revealTime: phase.revealTime,
        completedAt: phase.completedAt,
        tensionLevel: phase.tensionLevel,
        status: phase.completedAt ? (phase.success ? "success" : "failure") : "active"
      });
    } else {
      phases.push({
        phaseId: phase.phaseId,
        name: phase.name,
        status: "pending"
      });
    }
  }
  
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

// Static method to check if user can deploy a training mission
TrainingMissionDeploymentSchema.statics.canDeployMission = async function(
  agentId: string, 
  missionId: string
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
  
  // Check if mission is already completed
  const completedMission = await this.findOne({
    agentId,
    missionId,
    status: "completed"
  });
  
  if (completedMission) {
    return { canDeploy: false, reason: "Mission already completed" };
  }
  
  // Check sequential unlock (must complete previous missions)
  const missionSequence = parseInt(missionId.split("_")[1]);
  if (missionSequence > 1) {
    const previousMissionId = `training_${String(missionSequence - 1).padStart(3, "0")}`;
    const previousComplete = await this.findOne({
      agentId,
      missionId: previousMissionId,
      status: "completed"
    });
    
    if (!previousComplete) {
      return { canDeploy: false, reason: "Previous mission not completed" };
    }
  }
  
  return { canDeploy: true };
};

export default mongoose.model<ITrainingMissionDeployment>(
  "TrainingMissionDeployment", 
  TrainingMissionDeploymentSchema
);