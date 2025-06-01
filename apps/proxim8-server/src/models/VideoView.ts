import mongoose, { Schema, Document } from "mongoose";

export interface IVideoView extends Document {
  id: string;
  videoId: string;
  viewerIp: string;
  viewedAt: Date;
  watchDuration?: number;
  referrer?: string;
}

const VideoViewSchema: Schema = new Schema({
  id: { type: String, required: true, unique: true },
  videoId: { type: String, required: true },
  viewerIp: { type: String, required: true },
  viewedAt: { type: Date, default: Date.now },
  watchDuration: { type: Number },
  referrer: { type: String, default: "direct" },
});

// Indexes for faster analytics queries
VideoViewSchema.index({ videoId: 1 });
VideoViewSchema.index({ viewedAt: -1 });
VideoViewSchema.index({ videoId: 1, viewedAt: -1 });
VideoViewSchema.index({ videoId: 1, viewerIp: 1, viewedAt: -1 });

export default mongoose.model<IVideoView>("VideoView", VideoViewSchema);
