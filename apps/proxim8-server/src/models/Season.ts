import { Schema, model, Document } from 'mongoose';

export interface IReward {
  id: string;
  type: 'experience' | 'currency' | 'item' | 'nft' | 'achievement' | 'title';
  subtype?: string;
  amount: number;
  name: string;
  description: string;
  iconUrl: string;
  rarity?: 'common' | 'rare' | 'epic' | 'legendary';
}

export interface ISeason extends Document {
  slug: string;
  name: string;
  description: string;
  narrative: string;
  imageUrl: string;
  iconUrl?: string;
  
  // Ordering and availability
  sequenceNumber: number;
  prerequisiteSeasonId?: string;
  
  // Status and dates
  status: 'draft' | 'active' | 'completed' | 'archived';
  startDate: Date;
  endDate?: Date;
  
  // Progress tracking
  totalMissions: number;
  requiredMissions: number;
  
  // Rewards
  completionRewards: IReward[];
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

const RewardSchema = new Schema<IReward>({
  id: { type: String, required: true },
  type: { 
    type: String, 
    enum: ['experience', 'currency', 'item', 'nft', 'achievement', 'title'],
    required: true 
  },
  subtype: String,
  amount: { type: Number, required: true },
  name: { type: String, required: true },
  description: { type: String, required: true },
  iconUrl: { type: String, required: true },
  rarity: { 
    type: String, 
    enum: ['common', 'rare', 'epic', 'legendary'] 
  }
});

const SeasonSchema = new Schema<ISeason>({
  slug: { 
    type: String, 
    required: true, 
    unique: true,
    index: true 
  },
  name: { type: String, required: true },
  description: { type: String, required: true },
  narrative: { type: String, required: true },
  imageUrl: { type: String, required: true },
  iconUrl: String,
  
  sequenceNumber: { 
    type: Number, 
    required: true, 
    unique: true,
    index: true 
  },
  prerequisiteSeasonId: { type: String, ref: 'Season' },
  
  status: { 
    type: String, 
    enum: ['draft', 'active', 'completed', 'archived'],
    default: 'draft',
    index: true
  },
  startDate: { type: Date, required: true },
  endDate: Date,
  
  totalMissions: { type: Number, required: true, default: 0 },
  requiredMissions: { type: Number, required: true, default: 0 },
  
  completionRewards: [RewardSchema]
}, {
  timestamps: true
});

// Indexes for common queries
SeasonSchema.index({ status: 1, startDate: 1 });
SeasonSchema.index({ sequenceNumber: 1 });

export const Season = model<ISeason>('Season', SeasonSchema);