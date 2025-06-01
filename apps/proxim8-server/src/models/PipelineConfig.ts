import mongoose, { Schema, Document } from "mongoose";

export interface IPipelineConfig extends Document {
  id: string;
  name: string;
  description: string;
  isSystem: boolean;
  createdBy: string;
  middlewares: Array<{
    id: string;
    name: string;
    enabled: boolean;
    order: number;
    options: Record<string, any>;
  }>;
  defaultOptions: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const PipelineConfigSchema: Schema = new Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  description: { type: String },
  isSystem: { type: Boolean, default: false },
  createdBy: { type: String },
  middlewares: [
    {
      id: { type: String, required: true },
      name: { type: String, required: true },
      enabled: { type: Boolean, default: true },
      order: { type: Number, required: true },
      options: { type: Schema.Types.Mixed, default: {} },
    },
  ],
  defaultOptions: { type: Schema.Types.Mixed, default: {} },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

export default mongoose.model<IPipelineConfig>(
  "PipelineConfig",
  PipelineConfigSchema
);
