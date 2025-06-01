import mongoose, { Schema, Document } from "mongoose";
import { ILoreReward } from "./LoreReward";

export interface IUserLoreReward extends Document {
  userId: string;
  rewardId: mongoose.Types.ObjectId | ILoreReward;
  nftId?: string;
  claimedAt: Date;
}

const UserLoreRewardSchema: Schema = new Schema(
  {
    userId: {
      type: String,
      required: true,
      ref: "User",
    },
    rewardId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "LoreReward",
    },
    nftId: {
      type: String,
      default: null,
    },
    claimedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Create compound index for userId and rewardId to ensure a user can't claim the same reward twice
UserLoreRewardSchema.index({ userId: 1, rewardId: 1 }, { unique: true });
// Index for querying by userId
UserLoreRewardSchema.index({ userId: 1 });
// Index for querying by rewardId
UserLoreRewardSchema.index({ rewardId: 1 });

export default mongoose.model<IUserLoreReward>(
  "UserLoreReward",
  UserLoreRewardSchema
);
