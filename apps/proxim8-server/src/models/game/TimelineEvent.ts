import mongoose, { Schema, Document } from 'mongoose';

export interface ITimelineEvent extends Document {
  // Core event data
  eventId: string; // Unique identifier (e.g., "neural_interface_mandate_2027")
  date: Date; // The date this event occurs in the timeline
  year: number; // Year for quick filtering
  month: number; // Month for filtering
  
  // Timeline descriptions
  darkTimelineDescription: string; // What happens if Oneirocom wins
  optimalTimelineDescription: string; // What happens if resistance succeeds
  
  // Event metadata
  title: string; // Display title (e.g., "Neural Interface Mandate")
  threatLevel: 'low' | 'moderate' | 'high' | 'critical'; // Difficulty indicator
  eventType: 'corporate' | 'political' | 'technological' | 'social' | 'convergence';
  
  // Probability tracking
  oneirocomProbability: number; // Current probability of dark timeline (0-100)
  greenLoomProbability: number; // Current probability of optimal timeline (0-100)
  baseDifficulty: number; // Base difficulty modifier (1-10)
  
  // Intervention tracking
  totalInterventions: number; // Total missions attempted on this event
  successfulInterventions: number; // Number of successful missions
  canonicalStatus: 'pending' | 'contested' | 'green_loom' | 'oneirocom'; // Current canonical outcome
  
  // Mission options
  interventionApproaches: {
    sabotage: {
      risk: 'low' | 'medium' | 'high';
      reward: 'low' | 'medium' | 'high';
      probabilityShift: { min: number; max: number }; // Timeline shift range if successful
      description: string;
      successNarrative: string;
      failureNarrative: string;
    };
    expose: {
      risk: 'low' | 'medium' | 'high';
      reward: 'low' | 'medium' | 'high';
      probabilityShift: { min: number; max: number };
      description: string;
      successNarrative: string;
      failureNarrative: string;
    };
    organize: {
      risk: 'low' | 'medium' | 'high';
      reward: 'low' | 'medium' | 'high';
      probabilityShift: { min: number; max: number };
      description: string;
      successNarrative: string;
      failureNarrative: string;
    };
  };
  
  // Cascade effects
  cascadeEffects: [{
    affectedEventId: string; // Which future event this affects
    effectType: 'difficulty' | 'probability' | 'unlock' | 'lock';
    effectMagnitude: number; // How much it affects the future event
    description: string;
  }];
  
  // Requirements and locks
  prerequisites: string[]; // Event IDs that must be completed first
  requiredGreenLoomProbability?: number; // Minimum global Green Loom % to unlock
  lockedUntil?: Date; // Real-world date when this event becomes available
  isConvergenceEvent: boolean; // Requires multiple players to coordinate
  convergenceThreshold?: number; // Number of players needed for convergence events
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  lastInterventionAt?: Date;
}

const TimelineEventSchema = new Schema({
  eventId: { type: String, required: true, unique: true, index: true },
  date: { type: Date, required: true, index: true },
  year: { type: Number, required: true, index: true },
  month: { type: Number, required: true },
  
  darkTimelineDescription: { type: String, required: true },
  optimalTimelineDescription: { type: String, required: true },
  
  title: { type: String, required: true },
  threatLevel: { type: String, enum: ['low', 'moderate', 'high', 'critical'], required: true },
  eventType: { type: String, enum: ['corporate', 'political', 'technological', 'social', 'convergence'], required: true },
  
  oneirocomProbability: { type: Number, default: 85, min: 0, max: 100 },
  greenLoomProbability: { type: Number, default: 15, min: 0, max: 100 },
  baseDifficulty: { type: Number, default: 5, min: 1, max: 10 },
  
  totalInterventions: { type: Number, default: 0 },
  successfulInterventions: { type: Number, default: 0 },
  canonicalStatus: { type: String, enum: ['pending', 'contested', 'green_loom', 'oneirocom'], default: 'pending' },
  
  interventionApproaches: {
    sabotage: {
      risk: { type: String, enum: ['low', 'medium', 'high'], required: true },
      reward: { type: String, enum: ['low', 'medium', 'high'], required: true },
      probabilityShift: {
        min: { type: Number, required: true },
        max: { type: Number, required: true }
      },
      description: { type: String, required: true },
      successNarrative: { type: String, required: true },
      failureNarrative: { type: String, required: true }
    },
    expose: {
      risk: { type: String, enum: ['low', 'medium', 'high'], required: true },
      reward: { type: String, enum: ['low', 'medium', 'high'], required: true },
      probabilityShift: {
        min: { type: Number, required: true },
        max: { type: Number, required: true }
      },
      description: { type: String, required: true },
      successNarrative: { type: String, required: true },
      failureNarrative: { type: String, required: true }
    },
    organize: {
      risk: { type: String, enum: ['low', 'medium', 'high'], required: true },
      reward: { type: String, enum: ['low', 'medium', 'high'], required: true },
      probabilityShift: {
        min: { type: Number, required: true },
        max: { type: Number, required: true }
      },
      description: { type: String, required: true },
      successNarrative: { type: String, required: true },
      failureNarrative: { type: String, required: true }
    }
  },
  
  cascadeEffects: [{
    affectedEventId: { type: String, required: true },
    effectType: { type: String, enum: ['difficulty', 'probability', 'unlock', 'lock'], required: true },
    effectMagnitude: { type: Number, required: true },
    description: { type: String, required: true }
  }],
  
  prerequisites: [{ type: String }],
  requiredGreenLoomProbability: { type: Number, min: 0, max: 100 },
  lockedUntil: { type: Date },
  isConvergenceEvent: { type: Boolean, default: false },
  convergenceThreshold: { type: Number },
  
  lastInterventionAt: { type: Date }
}, {
  timestamps: true
});

// Indexes for efficient queries
TimelineEventSchema.index({ year: 1, month: 1 });
TimelineEventSchema.index({ canonicalStatus: 1 });
TimelineEventSchema.index({ oneirocomProbability: -1 });
TimelineEventSchema.index({ isConvergenceEvent: 1 });

// Virtual for success rate
TimelineEventSchema.virtual('successRate').get(function() {
  if (this.totalInterventions === 0) return 0;
  return Math.round((this.successfulInterventions / this.totalInterventions) * 100);
});

// Method to update canonical status based on success rate
TimelineEventSchema.methods.updateCanonicalStatus = function() {
  const successRate = this.successRate;
  
  if (successRate >= 60) {
    this.canonicalStatus = 'green_loom';
  } else if (successRate >= 40) {
    this.canonicalStatus = 'contested';
  } else if (this.totalInterventions >= 10) { // Only mark as oneirocom after enough attempts
    this.canonicalStatus = 'oneirocom';
  }
  
  return this.save();
};

export default mongoose.model<ITimelineEvent>('TimelineEvent', TimelineEventSchema);