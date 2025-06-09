import mongoose, { Schema, Document } from "mongoose";

export interface ILore extends Document {
  nftId: string;
  title: string;
  content: string;
  background: string;
  traits: Record<string, string>;
  claimed: boolean;
  claimedBy: string;
  claimedAt: Date;
  createdAt: Date;
  updatedAt: Date;
  
  // Mission-generated lore extensions
  sourceType?: 'nft' | 'mission'; // Type of lore source
  sourceMissionId?: string; // Training mission that generated this
  deploymentId?: string; // Specific mission deployment
  loreType?: 'mission_report' | '89_canon' | 'character_evolution' | 'timeline_fragment' | 'resistance_intel';
  rarity?: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  tags?: string[]; // For categorization and search
  unlockRequirements?: {
    missionSuccess?: boolean;
    completedAt?: Date; // When mission completed to unlock this
  };
  aiGenerated?: boolean; // Whether this was AI-generated
  generationMetadata?: {
    model?: string;
    prompt?: string;
    generatedAt?: Date;
    probability?: number; // Generation probability that was used
  };
}

const LoreSchema: Schema = new Schema({
  nftId: { type: String, required: true, index: true },
  title: { type: String, required: true },
  content: { type: String, required: true },
  background: { type: String, required: true },
  traits: { type: Schema.Types.Mixed, default: {} },
  claimed: { type: Boolean, default: false },
  claimedBy: { type: String },
  claimedAt: { type: Date },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  
  // Mission-generated lore extensions (all optional for backward compatibility)
  sourceType: { type: String, enum: ['nft', 'mission'], default: 'nft' },
  sourceMissionId: { type: String, index: true },
  deploymentId: { type: String, index: true },
  loreType: { 
    type: String, 
    enum: ['mission_report', '89_canon', 'character_evolution', 'timeline_fragment', 'resistance_intel']
  },
  rarity: { 
    type: String, 
    enum: ['common', 'uncommon', 'rare', 'epic', 'legendary'],
    default: 'common'
  },
  tags: [{ type: String }],
  unlockRequirements: {
    missionSuccess: { type: Boolean },
    completedAt: { type: Date }
  },
  aiGenerated: { type: Boolean, default: false },
  generationMetadata: {
    model: { type: String },
    prompt: { type: String },
    generatedAt: { type: Date },
    probability: { type: Number }
  }
});

// Compound indexes for efficient queries
LoreSchema.index({ nftId: 1, sourceType: 1 }); // Get all lore for an NFT by type
LoreSchema.index({ deploymentId: 1, claimed: 1 }); // Get mission lore by deployment
LoreSchema.index({ claimedBy: 1, sourceType: 1 }); // Get user's lore by type
LoreSchema.index({ sourceMissionId: 1, loreType: 1 }); // Get mission lore by type

export default mongoose.model<ILore>("Lore", LoreSchema);
