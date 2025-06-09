import express, { Router } from "express";
import * as loreController from "../controllers/loreController";
import { jwtAuth } from "../middleware/jwtAuth";
// import { verifyNFTOwnershipForLore } from "../middleware/nftOwnership";

const router: Router = express.Router();

router.get(
  "/nft/:nftId/claimed",
  jwtAuth,
  loreController.getClaimedLoreByNftId
);
router.get(
  "/nft/:nftId/available",
  jwtAuth,
  loreController.getAvailableLoreByNftId
);

// Batch endpoint to check multiple NFTs at once - reduces API calls
router.post(
  "/batch/available",
  jwtAuth,
  loreController.getBatchAvailableLore
);

// router.get("/claimed", loreController.getClaimedLore);

// Protected routes - require NFT ownership verification
router.post("/nft/:nftId/claim", jwtAuth, loreController.claimLore);

// Lore claiming route
router.post("/:loreId/claim", jwtAuth, loreController.claimLoreReward);

// Get user's NFT lore - JWT only (lists lore claimed by authenticated user)
router.get("/user-nfts", jwtAuth, loreController.getUserNftLore);

// New mission lore endpoints
router.get("/nft/:nftId/claimable-mission-lore", jwtAuth, loreController.getClaimableMissionLore);
router.get("/nft/:nftId/dashboard", jwtAuth, loreController.getLoreDashboardByNftId);

export default router;
