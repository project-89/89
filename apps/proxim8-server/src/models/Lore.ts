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
}

const LoreSchema: Schema = new Schema({
  nftId: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  content: { type: String, required: true },
  background: { type: String, required: true },
  traits: { type: Schema.Types.Mixed, default: {} },
  claimed: { type: Boolean, default: false },
  claimedBy: { type: String },
  claimedAt: { type: Date },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

export default mongoose.model<ILore>("Lore", LoreSchema);
