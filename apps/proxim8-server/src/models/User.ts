import mongoose, { Schema, Document } from "mongoose";

export interface IUser extends Document {
  walletAddress: string;
  username?: string;
  profileImage?: string;
  bio?: string;
  social?: {
    twitter?: string;
    discord?: string;
    website?: string;
  };
  preferences: {
    emailNotifications: boolean;
    darkMode: boolean;
    showInGallery: boolean;
    defaultPipelineId?: string;
    pipelineOptions?: Record<string, any>;
  };
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema = new Schema({
  walletAddress: { type: String, required: true, unique: true },
  username: { type: String, unique: true, sparse: true },
  profileImage: { type: String },
  bio: { type: String, maxlength: 500 },
  social: {
    twitter: { type: String },
    discord: { type: String },
    website: { type: String },
  },
  preferences: {
    emailNotifications: { type: Boolean, default: true },
    darkMode: { type: Boolean, default: false },
    showInGallery: { type: Boolean, default: true },
    defaultPipelineId: { type: String },
    pipelineOptions: { type: Schema.Types.Mixed, default: {} },
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

export default mongoose.model<IUser>("User", UserSchema);
