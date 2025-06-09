import { Response } from "express";
import PipelineConfig from "../models/PipelineConfig";
import { v4 as uuidv4 } from "uuid";
import { RequestWithUser } from "../middleware/auth";

export const getPipelineConfigs = async (
  req: RequestWithUser,
  res: Response
): Promise<void> => {
  try {
    const { walletAddress } = req.user || {};

    // Get system configs and user's custom configs
    const configs = await PipelineConfig.find({
      $or: [{ isSystem: true }, { createdBy: walletAddress }],
    });

    res.status(200).json(configs);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

export const getPipelineConfigById = async (
  req: RequestWithUser,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const { walletAddress } = req.user || {};

    const config = await PipelineConfig.findOne({ id });

    if (!config) {
      res.status(404).json({ message: "Pipeline configuration not found" });
      return;
    }

    // Check if user has access to this config
    if (
      !config.isSystem &&
      config.createdBy !== walletAddress &&
      !req.user?.isAdmin
    ) {
      res
        .status(403)
        .json({ message: "Unauthorized to access this configuration" });
      return;
    }

    res.status(200).json(config);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

export const createPipelineConfig = async (
  req: RequestWithUser,
  res: Response
): Promise<void> => {
  try {
    const { name, description, middlewares, defaultOptions } = req.body;
    const { walletAddress } = req.user || {};

    if (!walletAddress) {
      res.status(401).json({ message: "Authentication required" });
      return;
    }

    const newConfig = new PipelineConfig({
      id: uuidv4(),
      name,
      description,
      isSystem: false, // Only admins can create system configs
      createdBy: walletAddress,
      middlewares: middlewares.map((mw: any, index: number) => ({
        ...mw,
        order: index,
      })),
      defaultOptions,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await newConfig.save();

    res.status(201).json(newConfig);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

export const updatePipelineConfig = async (
  req: RequestWithUser,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, description, middlewares, defaultOptions } = req.body;
    const { walletAddress } = req.user || {};

    if (!walletAddress) {
      res.status(401).json({ message: "Authentication required" });
      return;
    }

    // Find the config
    const config = await PipelineConfig.findOne({ id });

    if (!config) {
      res.status(404).json({ message: "Pipeline configuration not found" });
      return;
    }

    // Check ownership (can't modify system configs unless admin)
    if (config.isSystem && !req.user?.isAdmin) {
      res
        .status(403)
        .json({ message: "Unauthorized to modify system configuration" });
      return;
    }

    if (
      !config.isSystem &&
      config.createdBy !== walletAddress &&
      !req.user?.isAdmin
    ) {
      res
        .status(403)
        .json({ message: "Unauthorized to modify this configuration" });
      return;
    }

    // Update the config
    const updatedConfig = await PipelineConfig.findOneAndUpdate(
      { id },
      {
        name,
        description,
        middlewares: middlewares.map((mw: any, index: number) => ({
          ...mw,
          order: index,
        })),
        defaultOptions,
        updatedAt: new Date(),
      },
      { new: true }
    );

    res.status(200).json(updatedConfig);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

export const deletePipelineConfig = async (
  req: RequestWithUser,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const { walletAddress } = req.user || {};

    if (!walletAddress) {
      res.status(401).json({ message: "Authentication required" });
      return;
    }

    // Find the config
    const config = await PipelineConfig.findOne({ id });

    if (!config) {
      res.status(404).json({ message: "Pipeline configuration not found" });
      return;
    }

    // Check ownership (can't delete system configs unless admin)
    if (config.isSystem && !req.user?.isAdmin) {
      res
        .status(403)
        .json({ message: "Unauthorized to delete system configuration" });
      return;
    }

    if (
      !config.isSystem &&
      config.createdBy !== walletAddress &&
      !req.user?.isAdmin
    ) {
      res
        .status(403)
        .json({ message: "Unauthorized to delete this configuration" });
      return;
    }

    // Delete the config
    await PipelineConfig.deleteOne({ id });

    res
      .status(200)
      .json({ message: "Pipeline configuration deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

export const getAvailableMiddleware = async (
  req: RequestWithUser,
  res: Response
): Promise<void> => {
  try {
    // This would come from a middleware registry service
    // For now, we'll hardcode the available middleware
    const middlewareRegistry = [
      {
        id: "auth",
        name: "Authentication",
        description: "Verifies user authentication",
        requiredOptions: [],
        optionalOptions: [],
      },
      {
        id: "nft",
        name: "NFT Extractor",
        description: "Extracts NFT data from blockchain",
        requiredOptions: [],
        optionalOptions: [],
      },
      {
        id: "gemini",
        name: "Gemini Prompt Generator",
        description: "Generates optimized prompts using Gemini",
        requiredOptions: [],
        optionalOptions: ["temperature", "maxOutputTokens"],
      },
      {
        id: "openai",
        name: "OpenAI Image Generator",
        description: "Generates images using DALL-E",
        requiredOptions: [],
        optionalOptions: ["size", "quality"],
      },
      {
        id: "veo",
        name: "Veo Video Generator",
        description: "Generates videos using Google Veo",
        requiredOptions: [],
        optionalOptions: ["duration", "fps", "quality"],
      },
      {
        id: "cache",
        name: "Caching",
        description: "Caches pipeline results",
        requiredOptions: [],
        optionalOptions: ["ttl"],
      },
      {
        id: "notify",
        name: "Notification",
        description: "Sends notifications to users",
        requiredOptions: [],
        optionalOptions: ["notificationTypes"],
      },
    ];

    res.status(200).json(middlewareRegistry);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};
