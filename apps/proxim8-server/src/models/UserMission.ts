import { Schema, model, Document } from 'mongoose';
import { IReward } from './Season';

export interface IPhaseProgress {
  phaseId: string;
  phaseName: string;
  status: 'pending' | 'in-progress' | 'completed' | 'failed';
  startedAt?: Date;
  completedAt?: Date;
  updates: string[];
}

export interface IMissionAttempt {
  id: string;
  attemptNumber: number;
  
  // Choices
  selectedApproach: 'sabotage' | 'expose' | 'organize';
  selectedProxim8Id: string;
  
  // Timing
  startedAt: Date;
  completedAt?: Date;
  
  // Outcome
  status: 'in-progress' | 'success' | 'failure' | 'abandoned';
  phases: IPhaseProgress[];
  
  // Results (only for completed attempts)
  result?: {
    success: boolean;
    timelineShift: number;
    experienceGained: number;
    rewardsEarned: IReward[];
    loreUnlocked: string[];
  };
}

export interface IUserMission extends Document {
  userId: string;
  missionId: string;
  seasonId: string;
  
  // Status
  status: 'locked' | 'available' | 'active' | 'in-progress' | 'completed' | 'failed';
  
  // Attempt tracking
  attempts: IMissionAttempt[];
  currentAttemptId?: string;
  
  // Completion data
  completedAt?: Date;
  completionTime?: number;
  successRate: number;
  
  // Progress
  unlockedAt?: Date;
  lastPlayedAt?: Date;
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

const PhaseProgressSchema = new Schema<IPhaseProgress>({
  phaseId: { type: String, required: true },
  phaseName: { type: String, required: true },
  status: { 
    type: String, 
    enum: ['pending', 'in-progress', 'completed', 'failed'],
    default: 'pending'
  },
  startedAt: Date,
  completedAt: Date,
  updates: [String]
});

const MissionAttemptSchema = new Schema<IMissionAttempt>({
  id: { type: String, required: true },
  attemptNumber: { type: Number, required: true },
  
  selectedApproach: { 
    type: String, 
    enum: ['sabotage', 'expose', 'organize'],
    required: true 
  },
  selectedProxim8Id: { type: String, required: true },
  
  startedAt: { type: Date, required: true },
  completedAt: Date,
  
  status: { 
    type: String, 
    enum: ['in-progress', 'success', 'failure', 'abandoned'],
    default: 'in-progress'
  },
  phases: [PhaseProgressSchema],
  
  result: {
    success: Boolean,
    timelineShift: Number,
    experienceGained: Number,
    rewardsEarned: [{
      id: String,
      type: { 
        type: String, 
        enum: ['experience', 'currency', 'item', 'nft', 'achievement', 'title']
      },
      subtype: String,
      amount: Number,
      name: String,
      description: String,
      iconUrl: String,
      rarity: { 
        type: String, 
        enum: ['common', 'rare', 'epic', 'legendary'] 
      }
    }],
    loreUnlocked: [String]
  }
});

const UserMissionSchema = new Schema<IUserMission>({
  userId: { 
    type: String, 
    required: true,
    index: true 
  },
  missionId: { 
    type: String, 
    ref: 'Mission', 
    required: true,
    index: true 
  },
  seasonId: { 
    type: String, 
    ref: 'Season', 
    required: true,
    index: true 
  },
  
  status: { 
    type: String, 
    enum: ['locked', 'available', 'active', 'in-progress', 'completed', 'failed'],
    default: 'locked',
    index: true
  },
  
  attempts: [MissionAttemptSchema],
  currentAttemptId: String,
  
  completedAt: Date,
  completionTime: Number,
  successRate: { type: Number, default: 0 },
  
  unlockedAt: Date,
  lastPlayedAt: Date
}, {
  timestamps: true
});

// Compound indexes for common queries
UserMissionSchema.index({ userId: 1, missionId: 1 }, { unique: true });
UserMissionSchema.index({ userId: 1, seasonId: 1, status: 1 });
UserMissionSchema.index({ userId: 1, status: 1, lastPlayedAt: -1 });

export const UserMission = model<IUserMission>('UserMission', UserMissionSchema);