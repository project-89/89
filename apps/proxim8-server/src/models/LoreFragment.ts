import { Schema, model, Document } from 'mongoose';

export interface IDiscoveryRequirement {
  approach?: string;
  successOnly?: boolean;
  minAttempts?: number;
  randomChance?: number;
}

export interface ILoreFragment extends Document {
  missionId: string;
  seasonId: string;
  
  // Content
  title: string;
  subtitle: string;
  content: string[];
  author: string;
  imageUrl?: string;
  
  // Classification
  category: 'memory' | 'document' | 'transmission' | 'artifact';
  rarity: 'common' | 'rare' | 'legendary' | 'mythic';
  
  // Discovery
  discoveryRequirement?: IDiscoveryRequirement;
  
  // Metadata
  fragmentNumber: number;
  tags: string[];
  relatedFragments: string[];
  
  createdAt: Date;
  updatedAt: Date;
}

const DiscoveryRequirementSchema = new Schema<IDiscoveryRequirement>({
  approach: String,
  successOnly: Boolean,
  minAttempts: Number,
  randomChance: Number
});

const LoreFragmentSchema = new Schema<ILoreFragment>({
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
  
  title: { type: String, required: true },
  subtitle: { type: String, required: true },
  content: [{ type: String, required: true }],
  author: { type: String, required: true },
  imageUrl: String,
  
  category: { 
    type: String, 
    enum: ['memory', 'document', 'transmission', 'artifact'],
    required: true,
    index: true
  },
  rarity: { 
    type: String, 
    enum: ['common', 'rare', 'legendary', 'mythic'],
    required: true,
    index: true
  },
  
  discoveryRequirement: DiscoveryRequirementSchema,
  
  fragmentNumber: { type: Number, required: true },
  tags: [String],
  relatedFragments: [{ type: String, ref: 'LoreFragment' }]
}, {
  timestamps: true
});

// Indexes for common queries
LoreFragmentSchema.index({ missionId: 1, fragmentNumber: 1 });
LoreFragmentSchema.index({ seasonId: 1, category: 1 });
LoreFragmentSchema.index({ rarity: 1 });
LoreFragmentSchema.index({ tags: 1 });

export const LoreFragment = model<ILoreFragment>('LoreFragment', LoreFragmentSchema);