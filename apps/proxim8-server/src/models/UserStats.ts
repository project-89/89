import { Schema, model, Document } from 'mongoose';

export interface IApproachStats {
  attempts: number;
  successes: number;
}

export interface IUserStats extends Document {
  userId: string;
  
  // Overall progress
  totalMissionsCompleted: number;
  totalMissionsAttempted: number;
  overallSuccessRate: number;
  totalPlayTime: number;
  
  // Season progress
  seasonsCompleted: number;
  currentSeasonId?: string;
  
  // Approach preferences
  approachStats: {
    sabotage: IApproachStats;
    expose: IApproachStats;
    organize: IApproachStats;
  };
  
  // Collections
  loreFragmentsCollected: number;
  achievementsUnlocked: number;
  
  // Timeline impact
  totalTimelineShift: number;
  currentTimelinePosition: number;
  
  // Streaks and records
  currentStreak: number;
  longestStreak: number;
  fastestMission?: {
    missionId: string;
    time: number;
  };
  
  // Last activity
  lastActiveAt: Date;
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

const ApproachStatsSchema = new Schema<IApproachStats>({
  attempts: { type: Number, default: 0 },
  successes: { type: Number, default: 0 }
});

const UserStatsSchema = new Schema<IUserStats>({
  userId: { 
    type: String, 
    required: true,
    unique: true,
    index: true 
  },
  
  totalMissionsCompleted: { type: Number, default: 0 },
  totalMissionsAttempted: { type: Number, default: 0 },
  overallSuccessRate: { type: Number, default: 0 },
  totalPlayTime: { type: Number, default: 0 },
  
  seasonsCompleted: { type: Number, default: 0 },
  currentSeasonId: { type: String, ref: 'Season' },
  
  approachStats: {
    sabotage: { type: ApproachStatsSchema, default: () => ({}) },
    expose: { type: ApproachStatsSchema, default: () => ({}) },
    organize: { type: ApproachStatsSchema, default: () => ({}) }
  },
  
  loreFragmentsCollected: { type: Number, default: 0 },
  achievementsUnlocked: { type: Number, default: 0 },
  
  totalTimelineShift: { type: Number, default: 0 },
  currentTimelinePosition: { type: Number, default: 50 },
  
  currentStreak: { type: Number, default: 0 },
  longestStreak: { type: Number, default: 0 },
  fastestMission: {
    missionId: { type: String, ref: 'Mission' },
    time: Number
  },
  
  lastActiveAt: { type: Date, default: Date.now }
}, {
  timestamps: true
});

// Indexes for common queries
UserStatsSchema.index({ totalMissionsCompleted: -1 });
UserStatsSchema.index({ overallSuccessRate: -1 });
UserStatsSchema.index({ totalTimelineShift: -1 });
UserStatsSchema.index({ lastActiveAt: -1 });

export const UserStats = model<IUserStats>('UserStats', UserStatsSchema);