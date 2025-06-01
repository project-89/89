import { z } from "zod";
import { v4 as uuidv4 } from "uuid";
import { Pipeline, PipelineBuilder } from "./core";
import {
  loggingMiddleware,
  errorHandlingMiddleware,
  authMiddleware,
  nftExtractorMiddleware,
  promptEnhancementMiddleware,
  imageGenerationMiddleware,
  videoGenerationMiddleware,
  cachingMiddleware,
  cacheSaveMiddleware,
} from "./middleware";

// Pipeline configuration schema
export const PipelineConfigSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  steps: z.array(
    z.object({
      id: z.string(),
      type: z.enum(["prompt", "image", "video"]),
      config: z.record(z.unknown()),
    })
  ),
  output: z.object({
    resolution: z.enum(["720p", "1080p"]).default("1080p"),
    aspectRatio: z.enum(["16:9", "9:16", "1:1"]).default("16:9"),
    style: z.string().default("cinematic"),
  }),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type PipelineConfig = z.infer<typeof PipelineConfigSchema>;

// Default pipeline configurations
export const defaultConfigurations: PipelineConfig[] = [
  {
    id: "default",
    name: "Default Pipeline",
    description: "Standard video generation pipeline with cinematic style",
    steps: [
      {
        id: "prompt-enhancement",
        type: "prompt",
        config: {
          model: "gemini-2.0-pro",
          temperature: 0.7,
          maxTokens: 2048,
        },
      },
      {
        id: "video-generation",
        type: "video",
        config: {
          model: "gemini-2.0-pro-vision",
          temperature: 0.7,
          style: "cinematic",
        },
      },
    ],
    output: {
      resolution: "1080p",
      aspectRatio: "16:9",
      style: "cinematic",
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "artistic",
    name: "Artistic Pipeline",
    description:
      "Pipeline optimized for artistic and creative video generation",
    steps: [
      {
        id: "prompt-enhancement",
        type: "prompt",
        config: {
          model: "gemini-2.0-pro",
          temperature: 0.9,
          maxTokens: 2048,
        },
      },
      {
        id: "video-generation",
        type: "video",
        config: {
          model: "gemini-2.0-pro-vision",
          temperature: 0.9,
          style: "artistic",
        },
      },
    ],
    output: {
      resolution: "1080p",
      aspectRatio: "16:9",
      style: "artistic",
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

// Configuration manager class
export class PipelineConfigManager {
  private configurations: Map<string, PipelineConfig>;

  constructor() {
    this.configurations = new Map();
    // Initialize with default configurations
    defaultConfigurations.forEach((config) => {
      this.configurations.set(config.id, config);
    });
  }

  getConfiguration(id: string): PipelineConfig | undefined {
    return this.configurations.get(id);
  }

  getAllConfigurations(): PipelineConfig[] {
    return Array.from(this.configurations.values());
  }

  createConfiguration(
    config: Omit<PipelineConfig, "id" | "createdAt" | "updatedAt">
  ): PipelineConfig {
    const newConfig: PipelineConfig = {
      ...config,
      id: crypto.randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.configurations.set(newConfig.id, newConfig);
    return newConfig;
  }

  updateConfiguration(
    id: string,
    config: Partial<PipelineConfig>
  ): PipelineConfig | undefined {
    const existingConfig = this.configurations.get(id);
    if (!existingConfig) return undefined;

    const updatedConfig: PipelineConfig = {
      ...existingConfig,
      ...config,
      updatedAt: new Date(),
    };

    this.configurations.set(id, updatedConfig);
    return updatedConfig;
  }

  deleteConfiguration(id: string): boolean {
    return this.configurations.delete(id);
  }
}

/**
 * Configuration types for different pipeline setups
 */
export enum PipelineConfigType {
  STANDARD = "standard",
  IMAGE_ONLY = "image-only",
  PROMPT_ONLY = "prompt-only",
  VIDEO_ONLY = "video-only",
}

/**
 * Pipeline configuration interface
 */
export interface PipelineConfiguration {
  id: string;
  name: string;
  description: string;
  middlewares: string[];
  options?: Record<string, any>;
}

/**
 * Standard image + video pipeline configuration
 */
export function createStandardPipeline(): Pipeline {
  return new PipelineBuilder()
    .use(loggingMiddleware)
    .use(errorHandlingMiddleware)
    .use(authMiddleware)
    .use(cachingMiddleware)
    .use(nftExtractorMiddleware)
    .use(promptEnhancementMiddleware)
    .use(imageGenerationMiddleware)
    .use(videoGenerationMiddleware)
    .use(cacheSaveMiddleware)
    .build();
}

/**
 * Image-only pipeline configuration
 */
export function createImageOnlyPipeline(): Pipeline {
  return new PipelineBuilder()
    .use(loggingMiddleware)
    .use(errorHandlingMiddleware)
    .use(authMiddleware)
    .use(cachingMiddleware)
    .use(nftExtractorMiddleware)
    .use(promptEnhancementMiddleware)
    .use(imageGenerationMiddleware)
    .use(cacheSaveMiddleware)
    .build();
}

/**
 * Prompt-only pipeline configuration
 */
export function createPromptOnlyPipeline(): Pipeline {
  return new PipelineBuilder()
    .use(loggingMiddleware)
    .use(errorHandlingMiddleware)
    .use(authMiddleware)
    .use(cachingMiddleware)
    .use(nftExtractorMiddleware)
    .use(promptEnhancementMiddleware)
    .use(cacheSaveMiddleware)
    .build();
}

/**
 * Video-only pipeline configuration
 */
export function createVideoOnlyPipeline(): Pipeline {
  return new PipelineBuilder()
    .use(loggingMiddleware)
    .use(errorHandlingMiddleware)
    .use(authMiddleware)
    .use(cachingMiddleware)
    .use(nftExtractorMiddleware)
    .use(videoGenerationMiddleware)
    .use(cacheSaveMiddleware)
    .build();
}

/**
 * Factory function to create a pipeline from a configuration type
 */
export function createPipelineFromType(type: PipelineConfigType): Pipeline {
  switch (type) {
    case PipelineConfigType.STANDARD:
      return createStandardPipeline();
    case PipelineConfigType.IMAGE_ONLY:
      return createImageOnlyPipeline();
    case PipelineConfigType.PROMPT_ONLY:
      return createPromptOnlyPipeline();
    case PipelineConfigType.VIDEO_ONLY:
      return createVideoOnlyPipeline();
    default:
      return createStandardPipeline();
  }
}

/**
 * Create a custom pipeline from middleware names
 */
export function createCustomPipeline(middlewareNames: string[]): Pipeline {
  const builder = new PipelineBuilder();

  // Always include these core middlewares
  builder.use(loggingMiddleware);
  builder.use(errorHandlingMiddleware);

  // Map of middleware names to implementations
  const middlewareMap: Record<string, any> = {
    auth: authMiddleware,
    nft: nftExtractorMiddleware,
    prompt: promptEnhancementMiddleware,
    image: imageGenerationMiddleware,
    video: videoGenerationMiddleware,
    cache: cachingMiddleware,
    cacheSave: cacheSaveMiddleware,
  };

  // Add middleware in order specified
  for (const name of middlewareNames) {
    const middleware = middlewareMap[name];
    if (middleware) {
      builder.use(middleware);
    }
  }

  return builder.build();
}

/**
 * Get predefined pipeline configurations
 */
export function getPredefinedConfigurations(): PipelineConfiguration[] {
  return [
    {
      id: uuidv4(),
      name: "Standard Video Pipeline",
      description:
        "Complete pipeline for NFT video generation including prompt enhancement, image and video generation",
      middlewares: [
        "auth",
        "cache",
        "nft",
        "prompt",
        "image",
        "video",
        "cacheSave",
      ],
    },
    {
      id: uuidv4(),
      name: "Image Generation Only",
      description:
        "Creates enhanced images from NFTs without generating videos",
      middlewares: ["auth", "cache", "nft", "prompt", "image", "cacheSave"],
    },
    {
      id: uuidv4(),
      name: "Prompt Engineering Only",
      description:
        "Enhances prompts for NFTs without generating media - useful for testing",
      middlewares: ["auth", "cache", "nft", "prompt", "cacheSave"],
    },
    {
      id: uuidv4(),
      name: "Video Generation Only",
      description:
        "Generates videos from existing images, skipping the NFT extraction and image generation steps",
      middlewares: ["auth", "cache", "nft", "video", "cacheSave"],
    },
    {
      id: uuidv4(),
      name: "High Performance Pipeline",
      description: "Complete pipeline with caching for improved performance",
      middlewares: [
        "auth",
        "cache",
        "nft",
        "prompt",
        "image",
        "video",
        "cacheSave",
      ],
    },
  ];
}
