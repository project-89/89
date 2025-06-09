import { Schema, model, Document } from "mongoose";
import { IReward } from "./Season";

export interface IApproach {
  id: "sabotage" | "expose" | "organize";
  name: string;
  description: string;
  risk: "low" | "medium" | "high";
  successRateRange: [number, number];
  rewardMultiplier: number;
}

export interface INftRequirement {
  collectionId: string;
  minCount?: number;
  specificIds?: string[];
  traits?: Array<{
    trait_type: string;
    value: any;
  }>;
}

export interface IBonusReward extends IReward {
  condition: {
    type: "speed" | "perfect" | "approach" | "proxim8" | "random";
    value?: any;
    chance?: number;
  };
}

export interface IMission extends Document {
  seasonId: string;

  // Basic info
  sequence: number;
  title: string;
  codename?: string;
  description: string;
  briefing: string;

  // Location and timing
  date: string;
  year: number;
  location: string;
  period: "early" | "mid" | "late";

  // Media
  imageUrl: string;
  videoUrl?: string;
  videoDuration?: number;

  // Gameplay
  duration: number;
  difficulty: "easy" | "medium" | "hard" | "extreme";
  approaches: IApproach[];

  // Prerequisites
  prerequisiteMissions: string[];
  minimumAgentLevel?: number;
  requiredNfts?: INftRequirement[];

  // Timeline impact
  oneirocumControl: number;
  timelineImpact: number;

  // Rewards
  baseRewards: IReward[];
  bonusRewards: IBonusReward[];
  loreFragments: string[];

  // Status
  status: "draft" | "active" | "disabled";

  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

const ApproachSchema = new Schema<IApproach>({
  id: {
    type: String,
    enum: ["sabotage", "expose", "organize"],
    required: true,
  },
  name: { type: String, required: true },
  description: { type: String, required: true },
  risk: {
    type: String,
    enum: ["low", "medium", "high"],
    required: true,
  },
  successRateRange: {
    type: [Number],
    validate: [
      (arr: number[]) => arr.length === 2,
      "successRateRange must have exactly 2 elements",
    ],
  },
  rewardMultiplier: { type: Number, required: true },
});

const NftRequirementSchema = new Schema<INftRequirement>({
  collectionId: { type: String, required: true },
  minCount: Number,
  specificIds: [String],
  traits: [
    {
      trait_type: String,
      value: Schema.Types.Mixed,
    },
  ],
});

const BonusRewardSchema = new Schema<IBonusReward>({
  id: { type: String, required: true },
  type: {
    type: String,
    enum: ["experience", "currency", "item", "nft", "achievement", "title"],
    required: true,
  },
  subtype: String,
  amount: { type: Number, required: true },
  name: { type: String, required: true },
  description: { type: String, required: true },
  iconUrl: { type: String, required: true },
  rarity: {
    type: String,
    enum: ["common", "rare", "epic", "legendary"],
  },
  condition: {
    type: {
      type: String,
      enum: ["speed", "perfect", "approach", "proxim8", "random"],
      required: true,
    },
    value: Schema.Types.Mixed,
    chance: Number,
  },
});

const MissionSchema = new Schema<IMission>(
  {
    seasonId: {
      type: String,
      ref: "Season",
      required: true,
      index: true,
    },

    sequence: { type: Number, required: true },
    title: { type: String, required: true },
    codename: String,
    description: { type: String, required: true },
    briefing: { type: String, required: true },

    date: { type: String, required: true },
    year: { type: Number, required: true, index: true },
    location: { type: String, required: true },
    period: {
      type: String,
      enum: ["early", "mid", "late"],
      required: true,
      index: true,
    },

    imageUrl: { type: String, required: true },
    videoUrl: String,
    videoDuration: Number,

    duration: { type: Number, required: true },
    difficulty: {
      type: String,
      enum: ["easy", "medium", "hard", "extreme"],
      required: true,
    },
    approaches: [ApproachSchema],

    prerequisiteMissions: [{ type: String, ref: "Mission" }],
    minimumAgentLevel: Number,
    requiredNfts: [NftRequirementSchema],

    oneirocumControl: { type: Number, required: true },
    timelineImpact: { type: Number, required: true },

    baseRewards: [
      {
        id: { type: String, required: true },
        type: {
          type: String,
          enum: [
            "experience",
            "currency",
            "item",
            "nft",
            "achievement",
            "title",
          ],
          required: true,
        },
        subtype: String,
        amount: { type: Number, required: true },
        name: { type: String, required: true },
        description: { type: String, required: true },
        iconUrl: { type: String, required: true },
        rarity: {
          type: String,
          enum: ["common", "rare", "epic", "legendary"],
        },
      },
    ],
    bonusRewards: [BonusRewardSchema],
    loreFragments: [{ type: String, ref: "LoreFragment" }],

    status: {
      type: String,
      enum: ["draft", "active", "disabled"],
      default: "draft",
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for common queries
MissionSchema.index({ seasonId: 1, sequence: 1 });
MissionSchema.index({ status: 1, year: 1 });
MissionSchema.index({ seasonId: 1, status: 1 });

export const Mission = model<IMission>("Mission", MissionSchema);
