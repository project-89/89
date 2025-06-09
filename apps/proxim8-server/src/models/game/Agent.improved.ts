// @ts-nocheck
/**
 * Improved Agent model using Zod schemas
 * This replaces the manual interface + schema duplication
 */

import mongoose from "mongoose";
import { AgentSchema, type Agent, type Proxim8 } from "@proxim8/shared";
import { createMongooseSchema } from "../../utils/zodToMongoose";

// Create Mongoose schema from Zod schema
const agentMongooseSchema = createMongooseSchema(AgentSchema, {
  timestamps: true, // Adds createdAt/updatedAt
  collection: "agents",
});

// Add indexes
agentMongooseSchema.index({ walletAddress: 1 }, { unique: true });
agentMongooseSchema.index({ agentId: 1 }, { unique: true });
agentMongooseSchema.index({ status: 1 });
agentMongooseSchema.index({ rank: 1 });

// Add instance methods
agentMongooseSchema.methods.canDeployMission = function () {
  // Check daily limit
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const lastDeployment = this.lastMissionDeployedAt;
  if (
    lastDeployment &&
    lastDeployment >= today &&
    this.dailyMissionCount >= 3
  ) {
    return { allowed: false, reason: "Daily mission limit reached" };
  }

  // Check if any Proxim8s are available
  const availableProxim8s = this.getAvailableProxim8s();
  if (availableProxim8s.length === 0) {
    return { allowed: false, reason: "No available Proxim8s" };
  }

  return { allowed: true };
};

agentMongooseSchema.methods.getAvailableProxim8s = function (): Proxim8[] {
  return this.proxim8s.filter((p: Proxim8) => !p.isDeployed);
};

agentMongooseSchema.methods.calculateRank = function () {
  const totalMissions = this.totalMissionsDeployed;
  const successRate =
    totalMissions > 0 ? (this.totalMissionsSucceeded / totalMissions) * 100 : 0;

  // Rank based on missions and success rate
  if (totalMissions >= 50 && successRate >= 80) {
    this.rank = "legend";
    this.rankProgress = 100;
  } else if (totalMissions >= 25 && successRate >= 70) {
    this.rank = "commander";
    this.rankProgress = ((totalMissions - 25) / 25) * 100;
  } else if (totalMissions >= 10 && successRate >= 60) {
    this.rank = "specialist";
    this.rankProgress = ((totalMissions - 10) / 15) * 100;
  } else if (totalMissions >= 3) {
    this.rank = "operative";
    this.rankProgress = ((totalMissions - 3) / 7) * 100;
  } else {
    this.rank = "recruit";
    this.rankProgress = (totalMissions / 3) * 100;
  }
};

// Add static methods
agentMongooseSchema.statics.findByWallet = function (walletAddress: string) {
  return this.findOne({ walletAddress });
};

agentMongooseSchema.statics.getTopAgents = function (limit = 10) {
  return this.find({ status: "active" })
    .sort({ totalTimelineShift: -1 })
    .limit(limit);
};

// Pre-save middleware
agentMongooseSchema.pre("save", function (next) {
  // Reset daily count if it's a new day
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (this.lastMissionDeployedAt && this.lastMissionDeployedAt < today) {
    this.dailyMissionCount = 0;
  }

  // Update lastActiveAt
  this.lastActiveAt = new Date();

  next();
});

// Create and export the model
export const AgentModel = mongoose.model<Agent>("Agent", agentMongooseSchema);

// Export the type from shared schema
export type { Agent, Proxim8, AgentRank, Achievement } from "@proxim8/shared";

/**
 * Usage example:
 *
 * // Create a new agent - TypeScript knows exactly what fields are required
 * const newAgent = await AgentModel.create({
 *   agentId: generateId(),
 *   walletAddress: 'ABC123...',
 *   userId: 'user123',
 *   codename: 'ShadowWalker42',
 *   proxim8s: [{
 *     nftId: 'nft123',
 *     name: 'Proxim8 Alpha',
 *     personality: 'analytical',
 *     // TypeScript enforces all required fields!
 *   }]
 * });
 *
 * // Type-safe method calls
 * const canDeploy = newAgent.canDeployMission();
 * const available = newAgent.getAvailableProxim8s();
 *
 * // Type-safe queries
 * const agent: Agent | null = await AgentModel.findByWallet('ABC123...');
 */
