import express, { Router } from "express";
import { jwtAuth } from "../middleware/jwtAuth";
import {
  verifyVideoOwnership,
  verifyNFTOwnershipForVideo,
} from "../middleware/nftOwnership";
import * as videoController from "../controllers/videoController";

const router: Router = express.Router();

// Video generation - requires NFT ownership verification
router.post(
  "/generate",
  jwtAuth,
  verifyNFTOwnershipForVideo,
  videoController.generateVideo
);

// Video status - requires video ownership verification
router.get(
  "/status/:jobId",
  jwtAuth,
  verifyVideoOwnership,
  videoController.getVideoStatus
);

// Get user's videos - JWT only (lists videos created by authenticated user)
router.get("/user", jwtAuth, videoController.getUserVideos);

// Make video public - requires video ownership verification
router.post(
  "/:videoId/publish",
  jwtAuth,
  verifyVideoOwnership,
  videoController.makeVideoPublic
);

// Delete video - requires video ownership verification
router.delete(
  "/:videoId",
  jwtAuth,
  verifyVideoOwnership,
  videoController.deleteVideo
);

// Refresh video URLs - requires video ownership verification
router.get(
  "/refresh/:videoId",
  jwtAuth,
  verifyVideoOwnership,
  videoController.refreshVideoUrls
);

export default router;
