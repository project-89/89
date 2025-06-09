import { Schema, model, Document } from 'mongoose';

export interface IUserLore extends Document {
  userId: string;
  loreFragmentId: string;
  
  // Discovery details
  discoveredAt: Date;
  discoveredInMissionId: string;
  discoveredInAttemptId: string;
  
  // Reading tracking
  timesViewed: number;
  lastViewedAt?: Date;
  
  // NFT minting (future feature)
  mintedAsNft?: boolean;
  nftTokenId?: string;
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

const UserLoreSchema = new Schema<IUserLore>({
  userId: { 
    type: String, 
    required: true,
    index: true 
  },
  loreFragmentId: { 
    type: String, 
    ref: 'LoreFragment', 
    required: true,
    index: true 
  },
  
  discoveredAt: { type: Date, required: true },
  discoveredInMissionId: { 
    type: String, 
    ref: 'Mission', 
    required: true 
  },
  discoveredInAttemptId: { type: String, required: true },
  
  timesViewed: { type: Number, default: 0 },
  lastViewedAt: Date,
  
  mintedAsNft: { type: Boolean, default: false },
  nftTokenId: String
}, {
  timestamps: true
});

// Compound indexes for common queries
UserLoreSchema.index({ userId: 1, loreFragmentId: 1 }, { unique: true });
UserLoreSchema.index({ userId: 1, discoveredAt: -1 });
UserLoreSchema.index({ userId: 1, mintedAsNft: 1 });

export const UserLore = model<IUserLore>('UserLore', UserLoreSchema);