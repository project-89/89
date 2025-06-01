import PipelineConfig, { IPipelineConfig } from "../../models/PipelineConfig";
import { Pipeline, PipelineBuilder, Middleware, PipelineContext } from "./core";

// Registry of middleware factories
const middlewareRegistry = new Map<string, (options: any) => Middleware>();

// Register standard middleware
export function registerMiddleware(
  id: string,
  factory: (options: any) => Middleware
): void {
  middlewareRegistry.set(id, factory);
}

// Create a pipeline from configuration
export async function createPipelineFromConfig(
  configId: string
): Promise<Pipeline> {
  // Get pipeline configuration from database
  const config = await PipelineConfig.findOne({ id: configId });

  if (!config) {
    throw new Error(`Pipeline configuration not found: ${configId}`);
  }

  return createPipelineFromObject(config);
}

// Create a pipeline from configuration object
export function createPipelineFromObject(config: IPipelineConfig): Pipeline {
  const builder = new PipelineBuilder();

  // Sort middlewares by order
  const sortedMiddlewares = [...config.middlewares].sort(
    (a, b) => a.order - b.order
  );

  // Add enabled middlewares to pipeline
  for (const mw of sortedMiddlewares) {
    if (mw.enabled && middlewareRegistry.has(mw.id)) {
      const factory = middlewareRegistry.get(mw.id);
      if (factory) {
        builder.use(factory(mw.options));
      }
    }
  }

  return builder.build();
}

// Get available pipeline configurations
export async function getAvailableConfigurations(
  userId?: string
): Promise<IPipelineConfig[]> {
  const query = userId
    ? { $or: [{ isSystem: true }, { createdBy: userId }] }
    : { isSystem: true };

  return await PipelineConfig.find(query);
}

// Create default system configurations if they don't exist
export async function createDefaultConfigurations(): Promise<void> {
  const defaultConfigs = [
    {
      id: "standard",
      name: "Standard Video Generation",
      description: "Standard pipeline for generating videos from NFTs",
      isSystem: true,
      middlewares: [
        {
          id: "auth",
          name: "Authentication",
          enabled: true,
          order: 0,
          options: {},
        },
        {
          id: "nft",
          name: "NFT Extractor",
          enabled: true,
          order: 1,
          options: {},
        },
        {
          id: "gemini",
          name: "Gemini Prompt Generator",
          enabled: true,
          order: 2,
          options: {},
        },
        {
          id: "openai",
          name: "OpenAI Image Generator",
          enabled: true,
          order: 3,
          options: {},
        },
        {
          id: "veo",
          name: "Veo Video Generator",
          enabled: true,
          order: 4,
          options: {},
        },
        {
          id: "notify",
          name: "Notification",
          enabled: true,
          order: 5,
          options: {},
        },
      ],
      defaultOptions: {},
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "image-only",
      name: "Image Generation Only",
      description: "Pipeline for generating enhanced images from NFTs",
      isSystem: true,
      middlewares: [
        {
          id: "auth",
          name: "Authentication",
          enabled: true,
          order: 0,
          options: {},
        },
        {
          id: "nft",
          name: "NFT Extractor",
          enabled: true,
          order: 1,
          options: {},
        },
        {
          id: "gemini",
          name: "Gemini Prompt Generator",
          enabled: true,
          order: 2,
          options: {},
        },
        {
          id: "openai",
          name: "OpenAI Image Generator",
          enabled: true,
          order: 3,
          options: {},
        },
        {
          id: "notify",
          name: "Notification",
          enabled: true,
          order: 4,
          options: {},
        },
      ],
      defaultOptions: {},
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  // Insert if they don't exist already
  for (const config of defaultConfigs) {
    await PipelineConfig.findOneAndUpdate({ id: config.id }, config, {
      upsert: true,
    });
  }
}

// Initialize some example middleware for testing
export function registerDefaultMiddleware(): void {
  // Authentication middleware
  registerMiddleware("auth", (options) => ({
    name: "Authentication",
    execute: async (context: PipelineContext) => {
      // This would validate the user in a real implementation
      console.log("Auth middleware executed");
      return context;
    },
  }));

  // NFT extractor middleware
  registerMiddleware("nft", (options) => ({
    name: "NFT Extractor",
    execute: async (context: PipelineContext) => {
      // This would fetch NFT data in a real implementation
      console.log("NFT extractor middleware executed");
      return {
        ...context,
        nftData: {
          id: context.nftId,
          title: "Example NFT",
          imageUrl: "https://example.com/image.jpg",
        },
      };
    },
  }));

  // Notification middleware
  registerMiddleware("notify", (options) => ({
    name: "Notification",
    execute: async (context: PipelineContext) => {
      // This would send notifications in a real implementation
      console.log("Notification middleware executed");
      return context;
    },
  }));
}
