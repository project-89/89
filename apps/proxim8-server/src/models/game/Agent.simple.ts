// @ts-nocheck
/**
 * Simple approach: Get types directly from Mongoose schema
 * No Zod, no extra dependencies, just Mongoose 6+ type inference
 */

import mongoose, { Schema, InferSchemaType, model } from "mongoose";

// Define your schema as const for better type inference
const agentSchema = new Schema(
  {
    // Core identifiers
    agentId: {
      type: String,
      required: true,
      unique: true,
    },
    walletAddress: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    userId: {
      type: String,
      required: true,
    },

    // Agent profile
    codename: {
      type: String,
      required: true,
    },
    joinedAt: {
      type: Date,
      default: Date.now,
    },
    lastActiveAt: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ["active", "inactive", "legendary"],
      default: "active",
    },

    // Proxim8 management - define the subdocument schema inline
    proxim8s: [
      {
        nftId: { type: String, required: true },
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
        specialization: String,
        currentMissionId: String,
        isDeployed: { type: Boolean, default: false },
      },
    ],

    // Progression tracking
    timelinePoints: { type: Number, default: 100 },
    totalMissionsDeployed: { type: Number, default: 0 },
    totalMissionsSucceeded: { type: Number, default: 0 },
    totalMissionsFailed: { type: Number, default: 0 },
    totalTimelineShift: { type: Number, default: 0 },

    // Rank and achievements
    rank: {
      type: String,
      enum: ["recruit", "operative", "specialist", "commander", "legend"],
      default: "recruit",
    },
    rankProgress: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    achievements: [
      {
        id: { type: String, required: true },
        name: { type: String, required: true },
        description: { type: String, required: true },
        unlockedAt: { type: Date, required: true },
        rarity: {
          type: String,
          enum: ["common", "rare", "epic", "legendary"],
          required: true,
        },
      },
    ],

    // Mission deployment tracking
    lastMissionDeployedAt: Date,
    dailyMissionCount: { type: Number, default: 0 },
  } as const,
  {
    timestamps: true, // Adds createdAt and updatedAt
  }
);

// Infer the document type from the schema
export type AgentDocument = InferSchemaType<typeof agentSchema>;

// Add methods to the schema
agentSchema.methods.canDeployMission = function () {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (
    this.lastMissionDeployedAt &&
    this.lastMissionDeployedAt >= today &&
    this.dailyMissionCount >= 3
  ) {
    return { allowed: false, reason: "Daily mission limit reached" };
  }

  const availableProxim8s = this.getAvailableProxim8s();
  if (availableProxim8s.length === 0) {
    return { allowed: false, reason: "No available Proxim8s" };
  }

  return { allowed: true };
};

agentSchema.methods.getAvailableProxim8s = function () {
  return this.proxim8s.filter((p) => !p.isDeployed);
};

// Create the model
export const Agent = model<AgentDocument>("Agent", agentSchema);

/**
 * Usage:
 *
 * const agent = await Agent.findOne({ walletAddress: '...' });
 *
 * // TypeScript knows all the fields!
 * console.log(agent?.codename);
 * console.log(agent?.proxim8s[0].personality);
 *
 * // Methods are typed too
 * const canDeploy = agent?.canDeployMission();
 */

// If you need to share types with frontend, you can export just the type
export type AgentType = {
  agentId: string;
  walletAddress: string;
  userId: string;
  codename: string;
  status: "active" | "inactive" | "legendary";
  proxim8s: Array<{
    nftId: string;
    name: string;
    personality: "analytical" | "aggressive" | "diplomatic" | "adaptive";
    level: number;
    // ... etc
  }>;
  // ... etc
};

// Or extract from the document type
export type Agent = Omit<AgentDocument, "_id" | "__v">;
