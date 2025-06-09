import mongoose, { Schema, Document } from "mongoose";

export interface ILoreReward extends Document {
  title: string;
  description: string;
  imageUrl: string;
  type: string;
  nftRequired: boolean;
  requiredNftId?: string;
  available: boolean;
  totalSupply: number;
  claimedCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const LoreRewardSchema: Schema = new Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    imageUrl: { type: String, required: true },
    type: {
      type: String,
      required: true,
      enum: ["story", "character", "item", "achievement", "other"],
    },
    nftRequired: { type: Boolean, default: false },
    requiredNftId: { type: String },
    available: { type: Boolean, default: true },
    totalSupply: { type: Number, default: -1 }, // -1 means unlimited
    claimedCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Add validation for requiredNftId
LoreRewardSchema.pre("validate", function (next) {
  if (this.nftRequired && !this.requiredNftId) {
    this.invalidate(
      "requiredNftId",
      "Required NFT ID must be provided when nftRequired is true"
    );
  }
  next();
});

// Add index for faster querying
LoreRewardSchema.index({ type: 1 });
LoreRewardSchema.index({ available: 1 });
LoreRewardSchema.index({ nftRequired: 1, requiredNftId: 1 });

export default mongoose.model<ILoreReward>("LoreReward", LoreRewardSchema);
