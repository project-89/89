import express, { Router } from "express";
import * as videoController from "../controllers/videoController";
import * as publicVideoController from "../controllers/publicVideoController";
import { jwtAuth } from "../middleware/jwtAuth";

const router: Router = express.Router();

/**
 * @route   GET /api/public/videos
 * @desc    Get public videos (featured, recent, trending)
 * @access  Public
 */
router.get("/videos", videoController.getPublicVideos);

/**
 * @route   GET /api/public/videos/:videoId
 * @desc    Get a specific public video's details
 * @access  Public
 */
router.get("/videos/:videoId", publicVideoController.getPublicVideoById);

/**
 * @route   GET /api/public/videos/:videoId/stream
 * @desc    Stream a public video with a short-lived signed URL
 * @access  Public
 */
router.get("/videos/:videoId/stream", publicVideoController.streamPublicVideo);

/**
 * @route   GET /api/public/videos/:videoId/thumbnail
 * @desc    Get a public video's thumbnail
 * @access  Public
 */
router.get(
  "/videos/:videoId/thumbnail",
  publicVideoController.getPublicVideoThumbnail
);

/**
 * @route   POST /api/public/videos/:videoId/like
 * @desc    Like a public video
 * @access  Private (requires JWT authentication)
 */
router.post(
  "/videos/:videoId/like",
  jwtAuth,
  publicVideoController.likePublicVideo
);

export default router;
