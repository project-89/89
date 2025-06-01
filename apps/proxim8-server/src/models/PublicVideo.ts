import mongoose, { Schema, Document } from "mongoose";

export interface IPublicVideo extends Document {
  id: string;
  originalVideoId: string;
  ownerWallet: string;
  title: string;
  description: string;
  tags: string[];
  views: number;
  likes: number;
  publishedAt: Date;
  featuredRank?: number;
}

const PublicVideoSchema: Schema = new Schema({
  id: { type: String, required: true, unique: true },
  originalVideoId: { type: String, required: true },
  ownerWallet: { type: String, required: true },
  title: { type: String, required: true },
  description: { type: String, default: "" },
  tags: { type: [String], default: [] },
  views: { type: Number, default: 0 },
  likes: { type: Number, default: 0 },
  publishedAt: { type: Date, default: Date.now },
  featuredRank: { type: Number },
});

// Indexes for faster queries
PublicVideoSchema.index({ ownerWallet: 1 });
PublicVideoSchema.index({ featuredRank: 1 });
PublicVideoSchema.index({ publishedAt: -1 });
PublicVideoSchema.index({ views: -1 });
PublicVideoSchema.index({ tags: 1 });

export default mongoose.model<IPublicVideo>("PublicVideo", PublicVideoSchema);
