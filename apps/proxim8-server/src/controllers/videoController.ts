import { Response } from "express";
import { v4 as uuidv4 } from "uuid";
import { createContext } from "../services/pipeline/core";
import {
  createPipelineFromType,
  PipelineConfigType,
} from "../services/pipeline/configurations";
import VideoGeneration from "../models/VideoGeneration";
import {
  refreshUrlIfNeeded,
  refreshUrlsInBatch,
  getNewExpiryDate,
} from "../services/urlManager";
import { getSignedUrl } from "../services/storage";
import PublicVideo from "../models/PublicVideo";
import { RequestWithUser } from "../middleware/auth";

/**
 * Generate a video for an NFT
 */
export const generateVideo = async (
  req: RequestWithUser,
  res: Response
): Promise<void> => {
  try {
    const { nftId, prompt, pipelineType, options } = req.body;
    const { walletAddress } = req.user || {};

    if (!walletAddress) {
      res.status(401).json({ message: "Authentication required" });
      return;
    }

    if (!nftId) {
      res.status(400).json({ message: "NFT ID is required" });
      return;
    }

    if (!prompt) {
      res.status(400).json({ message: "Prompt is required" });
      return;
    }

    // Determine which pipeline to use (default to standard)
    const pipelineConfigType = pipelineType
      ? (pipelineType as PipelineConfigType)
      : PipelineConfigType.STANDARD;

    // Create pipeline
    const pipeline = createPipelineFromType(pipelineConfigType);

    // Create a job ID
    const jobId = uuidv4();

    // Create initial context
    const context = createContext({
      jobId,
      nftId,
      userPrompt: prompt,
      walletAddress,
      ...options,
    });

    // Store job in database
    const videoGeneration = new VideoGeneration({
      jobId,
      nftId,
      prompt,
      createdBy: walletAddress,
      status: "queued",
      pipelineType: pipelineConfigType,
      options,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    await videoGeneration.save();

    // Execute pipeline
    setTimeout(async () => {
      try {
        // Run the pipeline process
        const result = await pipeline.execute(context);

        // Update video generation record with results
        const updates: any = {
          updatedAt: new Date(),
        };

        // Check if there was any error in the pipeline
        const hasError =
          result.error ||
          result.status === "error" ||
          result.getMetadata("globalError") ||
          result.getMetadata("imageGenerationError") ||
          result.getMetadata("videoGenerationError") ||
          result.getMetadata("promptEnhancementError") ||
          result.getMetadata("nftExtractionError") ||
          result.getMetadata("hasErrors") === true;

        // Set status based on pipeline result or error state
        updates.status = hasError
          ? "failed"
          : result.get("videoStatus") || "failed";

        // Set the error message if any exists
        if (hasError) {
          updates.error =
            result.error ||
            result.getMetadata("globalError") ||
            result.getMetadata("videoGenerationError") ||
            result.getMetadata("imageGenerationError") ||
            result.getMetadata("promptEnhancementError") ||
            result.getMetadata("nftExtractionError") ||
            "Unknown pipeline error";

          console.error(`Pipeline encountered an error: ${updates.error}`);
        }

        // Use the GCP paths instead of local paths for all assets
        if (result.get("imagePath")) {
          updates.imagePath = result.get("imagePath");
          console.log(`Using GCP image path: ${updates.imagePath}`);
        }

        if (result.get("videoPath")) {
          updates.videoPath = result.get("videoPath");
        }

        if (result.get("thumbnailPath")) {
          updates.thumbnailPath = result.get("thumbnailPath");
          console.log(`Using GCP thumbnail path: ${updates.thumbnailPath}`);
        }

        // Generate signed URLs for paths that exist
        if (updates.imagePath) {
          updates.imageUrl = await getSignedUrl(updates.imagePath);
          updates.imageUrlExpiry = getNewExpiryDate();
          console.log(
            `Generated signed URL for image: ${updates.imageUrl.substring(0, 50)}...`
          );
        }

        if (updates.thumbnailPath) {
          updates.thumbnailUrl = await getSignedUrl(updates.thumbnailPath);
          updates.thumbnailUrlExpiry = getNewExpiryDate();
          console.log(
            `Generated signed URL for thumbnail: ${updates.thumbnailUrl.substring(0, 50)}...`
          );
        }

        if (updates.videoPath) {
          updates.videoUrl = await getSignedUrl(updates.videoPath);
          updates.videoUrlExpiry = getNewExpiryDate();
        }

        await VideoGeneration.findOneAndUpdate({ jobId }, updates, {
          new: true,
        });

        console.log(
          `Video generation job ${jobId} completed with status: ${updates.status}`
        );
      } catch (error) {
        console.error(`Pipeline execution error for job ${jobId}:`, error);

        // Update job with error information
        await VideoGeneration.findOneAndUpdate(
          { jobId },
          {
            status: "failed",
            error: error instanceof Error ? error.message : String(error),
            updatedAt: new Date(),
          },
          { new: true }
        );
      }
    }, 0);

    // Return job information
    res.status(200).json({
      jobId,
      status: "queued",
      message: "Video generation job created successfully",
    });
  } catch (error) {
    console.error("Video generation error:", error);
    res.status(500).json({
      message: "Server error",
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

/**
 * Get the status of a video generation job
 */
export const getVideoStatus = async (
  req: RequestWithUser,
  res: Response
): Promise<void> => {
  try {
    const { jobId } = req.params;
    const { walletAddress } = req.user || {};

    if (!walletAddress) {
      res.status(401).json({ message: "Authentication required" });
      return;
    }

    const videoGeneration = await VideoGeneration.findOne({ jobId });

    if (!videoGeneration) {
      res.status(404).json({ message: "Video generation job not found" });
      return;
    }

    // Check if user has access to this job
    if (videoGeneration.createdBy !== walletAddress && !req.user?.isAdmin) {
      res
        .status(403)
        .json({ message: "Unauthorized to access this video generation job" });
      return;
    }

    // Refresh signed URLs if needed
    const refreshedVideo = await refreshUrlIfNeeded(videoGeneration);

    res.status(200).json(refreshedVideo);
  } catch (error) {
    console.error("Video status check error:", error);
    res.status(500).json({
      message: "Server error",
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

/**
 * Get videos generated by the authenticated user
 */
export const getUserVideos = async (
  req: RequestWithUser,
  res: Response
): Promise<void> => {
  try {
    const { walletAddress } = req.user || {};

    if (!walletAddress) {
      res.status(401).json({ message: "Authentication required" });
      return;
    }

    const videos = await VideoGeneration.find({
      createdBy: walletAddress,
    }).sort({ createdAt: -1 });

    // Refresh URLs if needed
    const refreshedVideos = await refreshUrlsInBatch(videos);

    res.status(200).json(refreshedVideos);
  } catch (error) {
    console.error("Get user videos error:", error);
    res.status(500).json({
      message: "Server error",
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

/**
 * Make a video public (shared in gallery)
 */
export const makeVideoPublic = async (
  req: RequestWithUser,
  res: Response
): Promise<void> => {
  try {
    const { videoId } = req.params;
    const { walletAddress } = req.user || {};
    const { title, description, tags } = req.body;

    if (!walletAddress) {
      res.status(401).json({ message: "Authentication required" });
      return;
    }

    // Check if the video exists and belongs to the user
    const video = await VideoGeneration.findOne({
      jobId: videoId,
      createdBy: walletAddress,
    });

    if (!video) {
      res.status(404).json({ message: "Video not found or not owned by user" });
      return;
    }

    // Check if video already has a complete status
    if (video.status !== "completed") {
      res
        .status(400)
        .json({ message: "Video must be completed before making it public" });
      return;
    }

    // Create a unique ID for the public video
    const publicId = uuidv4();

    // Create public video record
    const publicVideo = new PublicVideo({
      id: publicId,
      originalVideoId: videoId,
      ownerWallet: walletAddress,
      title: title || video.prompt || "Untitled Video",
      description: description || "",
      tags: tags || [],
      views: 0,
      likes: 0,
      publishedAt: new Date(),
    });

    await publicVideo.save();

    // Update the original video to mark it as public
    await VideoGeneration.updateOne(
      { jobId: videoId },
      {
        isPublic: true,
        publicVideoId: publicId,
        updatedAt: new Date(),
      }
    );

    res.status(200).json({
      success: true,
      message: "Video made public successfully",
      publicVideoId: publicId,
    });
  } catch (error) {
    console.error("Make video public error:", error);
    res.status(500).json({
      message: "Server error",
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

/**
 * Get public videos (featured, recent, trending)
 */
export const getPublicVideos = async (
  req: RequestWithUser,
  res: Response
): Promise<void> => {
  try {
    const { type = "recent", limit = 20 } = req.query;
    let videos;

    switch (type) {
      case "featured":
        videos = await PublicVideo.find({ featuredRank: { $exists: true } })
          .sort({ featuredRank: 1, publishedAt: -1 })
          .limit(Number(limit));
        break;
      case "trending":
        videos = await PublicVideo.find()
          .sort({ views: -1 })
          .limit(Number(limit));
        break;
      case "recent":
      default:
        videos = await PublicVideo.find()
          .sort({ publishedAt: -1 })
          .limit(Number(limit));
        break;
    }

    res.status(200).json(videos);
  } catch (error) {
    console.error("Get public videos error:", error);
    res.status(500).json({
      message: "Server error",
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

/**
 * Delete a video
 */
export const deleteVideo = async (
  req: RequestWithUser,
  res: Response
): Promise<void> => {
  try {
    const { videoId } = req.params;
    const { walletAddress } = req.user || {};

    if (!walletAddress) {
      res.status(401).json({ message: "Authentication required" });
      return;
    }

    // First find the video by jobId (which is likely a UUID)
    const videoGeneration = await VideoGeneration.findOne({
      jobId: videoId,
      createdBy: walletAddress,
    });

    if (!videoGeneration) {
      res.status(404).json({ message: "Video generation job not found" });
      return;
    }

    // Check if user has access to this job
    if (videoGeneration.createdBy !== walletAddress && !req.user?.isAdmin) {
      res.status(403).json({ message: "Unauthorized to delete this video" });
      return;
    }

    // Perform the actual deletion using the jobId instead of _id
    await VideoGeneration.deleteOne({ jobId: videoId });

    // Return success response
    res.status(200).json({
      success: true,
      message: "Video successfully deleted",
    });
  } catch (error) {
    console.error("Video deletion error:", error);
    res.status(500).json({
      message: "Server error",
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

/**
 * Refresh video URLs (for expired signed URLs)
 */
export const refreshVideoUrls = async (
  req: RequestWithUser,
  res: Response
): Promise<void> => {
  try {
    const { videoId } = req.params;
    const { walletAddress } = req.user || {};

    if (!walletAddress) {
      res.status(401).json({ message: "Authentication required" });
      return;
    }

    // Find the video by its ID
    const videoGeneration = await VideoGeneration.findOne({
      jobId: videoId,
      createdBy: walletAddress,
    });

    if (!videoGeneration) {
      res.status(404).json({ message: "Video generation job not found" });
      return;
    }

    // Force refresh all URLs for this video
    const { forceRefreshUrls } = await import("../services/urlManager");
    const refreshedVideo = await forceRefreshUrls(videoId);

    if (!refreshedVideo) {
      res.status(500).json({ message: "Failed to refresh URLs" });
      return;
    }

    res.status(200).json(refreshedVideo);
  } catch (error) {
    console.error("URL refresh error:", error);
    res.status(500).json({
      message: "Server error",
      error: error instanceof Error ? error.message : String(error),
    });
  }
};
