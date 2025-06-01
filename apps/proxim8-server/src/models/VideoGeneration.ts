import mongoose, { Schema, Document } from "mongoose";
import { PipelineConfigType } from "../services/pipeline/configurations";

export interface IVideoGeneration extends Document {
  jobId: string;
  nftId: string;
  prompt: string;
  createdBy: string;
  status: "queued" | "processing" | "completed" | "failed";
  pipelineType: string;
  options?: Record<string, any>;

  // Storage paths
  imagePath?: string;
  thumbnailPath?: string;
  videoPath?: string;

  // Signed URLs
  imageUrl?: string;
  imageUrlExpiry?: Date;
  thumbnailUrl?: string;
  thumbnailUrlExpiry?: Date;
  videoUrl?: string;
  videoUrlExpiry?: Date;

  // Public video related fields
  isPublic?: boolean;
  publicVideoId?: string;

  error?: string;
  createdAt: Date;
  updatedAt: Date;
}

const VideoGenerationSchema: Schema = new Schema({
  jobId: { type: String, required: true, unique: true },
  nftId: { type: String, required: true },
  prompt: { type: String, required: true },
  createdBy: { type: String, required: true },
  status: {
    type: String,
    enum: ["queued", "processing", "completed", "failed"],
    default: "queued",
  },
  pipelineType: { type: String, required: true },
  options: { type: Schema.Types.Mixed, default: {} },

  // Storage paths
  imagePath: { type: String },
  thumbnailPath: { type: String },
  videoPath: { type: String },

  // Signed URLs
  imageUrl: { type: String },
  imageUrlExpiry: { type: Date },
  thumbnailUrl: { type: String },
  thumbnailUrlExpiry: { type: Date },
  videoUrl: { type: String },
  videoUrlExpiry: { type: Date },

  // Public video related fields
  isPublic: { type: Boolean, default: false },
  publicVideoId: { type: String },

  error: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

export default mongoose.model<IVideoGeneration>(
  "VideoGeneration",
  VideoGenerationSchema
);
