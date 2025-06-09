import { Request, Response } from "express";
import { RequestWithUser } from "../middleware/auth";
import { logger } from "../utils/logger";
import { getSignedUrl } from "../services/storage";
import VideoGeneration from "../models/VideoGeneration";
import PublicVideo from "../models/PublicVideo";
import VideoView from "../models/VideoView";
import crypto from "crypto";

/**
 * Get a specific public video's details
 */
export const getPublicVideoById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { videoId } = req.params;

    logger.info(`Fetching public video details for ID: ${videoId}`);

    // Find the public video record
    const publicVideo = await PublicVideo.findOne({ id: videoId });
    if (!publicVideo) {
      logger.warn(`Public video not found: ${videoId}`);
      res.status(404).json({ error: "Video not found" });
      return;
    }

    logger.info(`Successfully retrieved public video: ${videoId}`);
    res.status(200).json(publicVideo);
  } catch (error) {
    logger.error(
      "Error in getPublicVideoById:",
      error instanceof Error ? error.message : String(error)
    );
    res.status(500).json({
      message: "Server error",
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

/**
 * Stream a public video with a short-lived signed URL
 * Also tracks view analytics
 */
export const streamPublicVideo = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { videoId } = req.params;

    logger.info(`Streaming public video: ${videoId}`);

    // Find the public video record
    const publicVideo = await PublicVideo.findOne({ id: videoId });
    if (!publicVideo) {
      logger.warn(`Public video not found for streaming: ${videoId}`);
      res.status(404).json({ error: "Video not found" });
      return;
    }

    // Get the original video to access its file path
    const originalVideo = await VideoGeneration.findOne({
      jobId: publicVideo.originalVideoId,
    });

    if (!originalVideo || !originalVideo.videoPath) {
      logger.warn(`Video content not found for: ${videoId}`);
      res.status(404).json({ error: "Video content not found" });
      return;
    }

    // Generate a short-lived URL (5 minutes)
    const videoUrl = await getSignedUrl(originalVideo.videoPath, 5);

    // Track view analytics (async - don't block response)
    trackVideoView(req, publicVideo.id).catch((viewError) => {
      logger.error("View tracking error:", viewError);
    });

    logger.info(`Generated signed URL for video: ${videoId}`);

    // Redirect to the signed URL
    res.redirect(videoUrl);
  } catch (error) {
    logger.error(
      "Error in streamPublicVideo:",
      error instanceof Error ? error.message : String(error)
    );
    res.status(500).json({
      message: "Server error",
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

/**
 * Get a public video's thumbnail
 */
export const getPublicVideoThumbnail = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { videoId } = req.params;

    logger.info(`Fetching thumbnail for video: ${videoId}`);

    // Find the public video record
    const publicVideo = await PublicVideo.findOne({ id: videoId });
    if (!publicVideo) {
      logger.warn(`Public video not found for thumbnail: ${videoId}`);
      res.status(404).json({ error: "Video not found" });
      return;
    }

    // Get the original video to access its thumbnail path
    const originalVideo = await VideoGeneration.findOne({
      jobId: publicVideo.originalVideoId,
    });

    if (!originalVideo || !originalVideo.thumbnailPath) {
      logger.warn(`Thumbnail not found for video: ${videoId}`);
      res.status(404).json({ error: "Thumbnail not found" });
      return;
    }

    // Generate a short-lived URL (30 minutes)
    const thumbnailUrl = await getSignedUrl(originalVideo.thumbnailPath, 30);

    logger.info(`Generated signed thumbnail URL for video: ${videoId}`);

    // Redirect to the signed URL
    res.redirect(thumbnailUrl);
  } catch (error) {
    logger.error(
      "Error in getPublicVideoThumbnail:",
      error instanceof Error ? error.message : String(error)
    );
    res.status(500).json({
      message: "Server error",
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

/**
 * Like a public video
 */
export const likePublicVideo = async (
  req: RequestWithUser,
  res: Response
): Promise<void> => {
  try {
    const { videoId } = req.params;
    const walletAddress = req.user?.walletAddress;

    logger.info(`Liking video ${videoId} from wallet: ${walletAddress}`);

    // Find the public video record
    const publicVideo = await PublicVideo.findOne({ id: videoId });
    if (!publicVideo) {
      logger.warn(`Public video not found for like: ${videoId}`);
      res.status(404).json({ error: "Video not found" });
      return;
    }

    // Increment like counter
    await PublicVideo.updateOne({ id: videoId }, { $inc: { likes: 1 } });

    logger.info(`Successfully liked video: ${videoId}`);
    res.status(200).json({ success: true });
  } catch (error) {
    logger.error(
      "Error in likePublicVideo:",
      error instanceof Error ? error.message : String(error)
    );
    res.status(500).json({
      message: "Server error",
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

/**
 * Track video view analytics
 * Helper function to log views and increment counters
 */
async function trackVideoView(req: Request, videoId: string): Promise<void> {
  try {
    const clientIp = req.ip || req.headers["x-forwarded-for"] || "unknown";

    // Anonymize IP by removing last octet for privacy
    const anonymizedIp = clientIp.toString().replace(/\.\d+$/, ".0");

    // Create view record
    const videoView = new VideoView({
      id: crypto.randomBytes(16).toString("hex"),
      videoId: videoId,
      viewerIp: anonymizedIp,
      viewedAt: new Date(),
      referrer: req.headers.referer || "direct",
    });

    await videoView.save();

    // Increment view counter
    await PublicVideo.updateOne({ id: videoId }, { $inc: { views: 1 } });

    logger.info(`View tracked for video: ${videoId} from IP: ${anonymizedIp}`);
  } catch (error) {
    logger.error(
      `Error tracking view for video ${videoId}:`,
      error instanceof Error ? error.message : String(error)
    );
    // Don't re-throw - view tracking shouldn't fail the main request
  }
}
