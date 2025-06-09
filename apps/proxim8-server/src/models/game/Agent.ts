import mongoose, { Schema, Document } from "mongoose";

export interface IAgent extends Document {
  // Core identifiers
  agentId: string; // Unique agent ID
  walletAddress: string; // Solana wallet address
  userId: string; // Reference to User model

  // Agent profile
  codename: string; // Agent's chosen codename
  joinedAt: Date; // When they joined the resistance
  lastActiveAt: Date; // Last mission or login
  status: "active" | "inactive" | "legendary"; // Agent status

  // Proxim8 management
  proxim8s: [
    {
      nftId: string; // NFT token ID
      name: string; // Proxim8's name
      personality: "analytical" | "aggressive" | "diplomatic" | "adaptive";
      experience: number; // Total XP earned
      level: number; // Current level (calculated from XP)
      missionCount: number; // Total missions completed
      successRate: number; // Success percentage
      specialization?: string; // Unlocked specialization
      currentMissionId?: string; // Active mission if deployed
      isDeployed: boolean; // Quick check for deployment status
    },
  ];

  // Progression tracking
  timelinePoints: number; // Primary currency
  totalMissionsDeployed: number;
  totalMissionsSucceeded: number;
  totalMissionsFailed: number;
  totalTimelineShift: number; // Cumulative probability shift achieved

  // Rank and achievements
  rank: "recruit" | "operative" | "specialist" | "commander" | "legend";
  rankProgress: number; // Progress to next rank (0-100)
  achievements: [
    {
      id: string;
      name: string;
      description: string;
      unlockedAt: Date;
      rarity: "common" | "rare" | "epic" | "legendary";
    },
  ];

  // Collections
  loreFragments: [
    {
      fragmentId: string;
      acquiredAt: Date;
      fromMissionId: string;
    },
  ];
  memoryCaches: [
    {
      cacheId: string;
      acquiredAt: Date;
      fromMissionId: string;
    },
  ];

  // Timeline influence
  timelineInfluence: {
    greenLoomContribution: number; // Total Green Loom probability added
    eventsInfluenced: number; // Number of unique events affected
    criticalInterventions: number; // Number of critical timeline shifts
    convergenceParticipations: number; // Number of convergence events joined
  };

  // Social features
  squadId?: string; // Future: squad/guild system
  friendsList: string[]; // Other agent IDs
  publicProfile: boolean; // Whether profile is visible to others

  // Preferences
  preferences: {
    notifications: {
      missionComplete: boolean;
      statusUpdates: boolean;
      communityEvents: boolean;
      friendActivity: boolean;
    };
    displaySettings: {
      theme: "dark" | "light" | "matrix";
      autoPlayVideos: boolean;
      showSpoilers: boolean;
    };
  };

  // Anti-cheat and rate limiting
  lastMissionDeployedAt?: Date;
  dailyMissionCount: number; // Resets daily
  suspiciousActivityFlags: number; // For detecting exploits

  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

const AgentSchema = new Schema(
  {
    agentId: { type: String, required: true, unique: true, index: true },
    walletAddress: { type: String, required: true, unique: true, index: true },
    userId: { type: String, required: true, index: true },

    codename: { type: String, required: true, unique: true },
    joinedAt: { type: Date, default: Date.now },
    lastActiveAt: { type: Date, default: Date.now },
    status: {
      type: String,
      enum: ["active", "inactive", "legendary"],
      default: "active",
    },

    proxim8s: [
      {
        nftId: { type: String, required: true, index: true },
        name: { type: String, required: true },
        personality: {
          type: String,
          enum: ["analytical", "aggressive", "diplomatic", "adaptive"],
          required: true,
        },
        experience: { type: Number, default: 0 },
        level: { type: Number, default: 1 },
        missionCount: { type: Number, default: 0 },
        successRate: { type: Number, default: 0 },
        specialization: { type: String },
        currentMissionId: { type: String },
        isDeployed: { type: Boolean, default: false },
      },
    ],

    timelinePoints: { type: Number, default: 0 },
    totalMissionsDeployed: { type: Number, default: 0 },
    totalMissionsSucceeded: { type: Number, default: 0 },
    totalMissionsFailed: { type: Number, default: 0 },
    totalTimelineShift: { type: Number, default: 0 },

    rank: {
      type: String,
      enum: ["recruit", "operative", "specialist", "commander", "legend"],
      default: "recruit",
    },
    rankProgress: { type: Number, default: 0, min: 0, max: 100 },

    achievements: [
      {
        id: { type: String, required: true },
        name: { type: String, required: true },
        description: { type: String, required: true },
        unlockedAt: { type: Date, default: Date.now },
        rarity: {
          type: String,
          enum: ["common", "rare", "epic", "legendary"],
          required: true,
        },
      },
    ],

    loreFragments: [
      {
        fragmentId: { type: String, required: true },
        acquiredAt: { type: Date, default: Date.now },
        fromMissionId: { type: String, required: true },
      },
    ],

    memoryCaches: [
      {
        cacheId: { type: String, required: true },
        acquiredAt: { type: Date, default: Date.now },
        fromMissionId: { type: String, required: true },
      },
    ],

    timelineInfluence: {
      greenLoomContribution: { type: Number, default: 0 },
      eventsInfluenced: { type: Number, default: 0 },
      criticalInterventions: { type: Number, default: 0 },
      convergenceParticipations: { type: Number, default: 0 },
    },

    squadId: { type: String },
    friendsList: [{ type: String }],
    publicProfile: { type: Boolean, default: true },

    preferences: {
      notifications: {
        missionComplete: { type: Boolean, default: true },
        statusUpdates: { type: Boolean, default: true },
        communityEvents: { type: Boolean, default: true },
        friendActivity: { type: Boolean, default: false },
      },
      displaySettings: {
        theme: {
          type: String,
          enum: ["dark", "light", "matrix"],
          default: "dark",
        },
        autoPlayVideos: { type: Boolean, default: true },
        showSpoilers: { type: Boolean, default: false },
      },
    },

    lastMissionDeployedAt: { type: Date },
    dailyMissionCount: { type: Number, default: 0 },
    suspiciousActivityFlags: { type: Number, default: 0 },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient queries
AgentSchema.index({ status: 1, lastActiveAt: -1 }); // For active agent queries
AgentSchema.index({ rank: 1, timelinePoints: -1 }); // For leaderboards
AgentSchema.index({ "proxim8s.nftId": 1 }); // For NFT lookups
AgentSchema.index({ "timelineInfluence.greenLoomContribution": -1 }); // For influence rankings

// Calculate rank based on progression
AgentSchema.methods.calculateRank = function () {
  const points = this.timelinePoints;
  const missions = this.totalMissionsSucceeded;
  const influence = this.timelineInfluence.greenLoomContribution;

  if (points >= 10000 && missions >= 100 && influence >= 50) {
    this.rank = "legend";
  } else if (points >= 5000 && missions >= 50 && influence >= 25) {
    this.rank = "commander";
  } else if (points >= 2000 && missions >= 20 && influence >= 10) {
    this.rank = "specialist";
  } else if (points >= 500 && missions >= 5) {
    this.rank = "operative";
  } else {
    this.rank = "recruit";
  }

  // Calculate progress to next rank
  // Implementation depends on specific progression curve
};

// Get available Proxim8s (not deployed)
AgentSchema.methods.getAvailableProxim8s = function () {
  return this.proxim8s.filter((p: any) => !p.isDeployed);
};

// Update Proxim8 experience and level
AgentSchema.methods.updateProxim8Experience = function (
  nftId: string,
  experienceGained: number
) {
  const proxim8 = this.proxim8s.find((p: any) => p.nftId === nftId);
  if (proxim8) {
    proxim8.experience += experienceGained;
    // Simple level calculation - adjust as needed
    proxim8.level = Math.floor(Math.sqrt(proxim8.experience / 100)) + 1;
  }
  return this.save();
};

// Check if can deploy mission (rate limiting, etc.)
AgentSchema.methods.canDeployMission = function (): {
  allowed: boolean;
  reason?: string;
} {
  // Check daily limit
  if (this.dailyMissionCount >= 10) {
    return { allowed: false, reason: "Daily mission limit reached" };
  }

  // Check cooldown (optional)
  if (this.lastMissionDeployedAt) {
    const cooldownMs = 5 * 60 * 1000; // 5 minute cooldown
    const timeSinceLastMission =
      Date.now() - this.lastMissionDeployedAt.getTime();
    if (timeSinceLastMission < cooldownMs) {
      return { allowed: false, reason: "Mission cooldown active" };
    }
  }

  // Check if has available Proxim8s
  const availableProxim8s = this.getAvailableProxim8s();
  if (availableProxim8s.length === 0) {
    return { allowed: false, reason: "No available Proxim8s" };
  }

  return { allowed: true };
};

export default mongoose.model<IAgent>("Agent", AgentSchema);
