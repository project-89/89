import { Response, NextFunction } from "express";
import { RequestWithUser } from "./auth";
import { logger } from "../utils/logger";
import { doesWalletOwnNFT } from "../services/nftOwnershipCache";
import VideoGeneration from "../models/VideoGeneration";
import Lore from "../models/Lore";

/**
 * Middleware to verify NFT ownership for lore claiming
 * Uses cached ownership data to avoid excessive API calls
 */
export const verifyNFTOwnershipForLore = async (
  req: RequestWithUser,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { nftId } = req.params;
    const walletAddress = req.user?.walletAddress;

    if (!walletAddress) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }

    if (!nftId) {
      res.status(400).json({ error: "NFT ID required" });
      return;
    }

    logger.info(`Verifying NFT ownership: ${walletAddress} claims ${nftId}`);

    // Check if wallet owns the NFT (uses cache, falls back to API)
    const ownsNFT = await doesWalletOwnNFT(walletAddress, nftId);

    if (!ownsNFT) {
      logger.warn(
        `NFT ownership verification failed: ${walletAddress} does not own ${nftId}`
      );
      res.status(403).json({
        error: "NFT ownership required",
        details: "You must own this NFT to perform this action",
      });
      return;
    }

    logger.info(`NFT ownership verified: ${walletAddress} owns ${nftId}`);
    next();
  } catch (error) {
    logger.error("Error in NFT ownership verification:", error);
    res.status(500).json({
      error: "Ownership verification failed",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

/**
 * Middleware to verify video ownership via database
 * No API calls needed - just check database record
 */
export const verifyVideoOwnership = async (
  req: RequestWithUser,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { videoId } = req.params;
    const walletAddress = req.user?.walletAddress;

    if (!walletAddress) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }

    if (!videoId) {
      res.status(400).json({ error: "Video ID required" });
      return;
    }

    logger.info(
      `Verifying video ownership: ${walletAddress} accessing ${videoId}`
    );

    // Check if video exists and belongs to the user
    const video = await VideoGeneration.findOne({
      jobId: videoId,
      createdBy: walletAddress,
    });

    if (!video) {
      logger.warn(
        `Video ownership verification failed: ${walletAddress} does not own ${videoId}`
      );
      res.status(403).json({
        error: "Video ownership required",
        details: "You can only access videos you created",
      });
      return;
    }

    logger.info(`Video ownership verified: ${walletAddress} owns ${videoId}`);
    next();
  } catch (error) {
    logger.error("Error in video ownership verification:", error);
    res.status(500).json({
      error: "Ownership verification failed",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

/**
 * Middleware to verify lore ownership via database
 * Checks if user has claimed the lore
 */
export const verifyLoreOwnership = async (
  req: RequestWithUser,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { nftId } = req.params;
    const walletAddress = req.user?.walletAddress;

    if (!walletAddress) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }

    if (!nftId) {
      res.status(400).json({ error: "NFT ID required" });
      return;
    }

    logger.info(
      `Verifying lore ownership: ${walletAddress} accessing ${nftId}`
    );

    // Check if lore exists and belongs to the user
    const lore = await Lore.findOne({
      nftId: nftId,
      claimedBy: walletAddress,
      claimed: true,
    });

    if (!lore) {
      logger.warn(
        `Lore ownership verification failed: ${walletAddress} has not claimed ${nftId}`
      );
      res.status(403).json({
        error: "Lore ownership required",
        details: "You must have claimed this lore to access it",
      });
      return;
    }

    logger.info(
      `Lore ownership verified: ${walletAddress} has claimed ${nftId}`
    );
    next();
  } catch (error) {
    logger.error("Error in lore ownership verification:", error);
    res.status(500).json({
      error: "Ownership verification failed",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

/**
 * Middleware to verify NFT ownership for video generation
 * Uses cached ownership data to avoid excessive API calls
 */
export const verifyNFTOwnershipForVideo = async (
  req: RequestWithUser,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { nftId } = req.body; // NFT ID comes from request body for video generation
    const walletAddress = req.user?.walletAddress;

    if (!walletAddress) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }

    if (!nftId) {
      res.status(400).json({ error: "NFT ID required in request body" });
      return;
    }

    logger.info(
      `Verifying NFT ownership for video generation: ${walletAddress} with ${nftId}`
    );

    // Check if wallet owns the NFT (uses cache, falls back to API)
    const ownsNFT = await doesWalletOwnNFT(walletAddress, nftId);

    if (!ownsNFT) {
      logger.warn(
        `NFT ownership verification failed for video generation: ${walletAddress} does not own ${nftId}`
      );
      res.status(403).json({
        error: "NFT ownership required",
        details: "You must own this NFT to generate videos with it",
      });
      return;
    }

    logger.info(
      `NFT ownership verified for video generation: ${walletAddress} owns ${nftId}`
    );
    next();
  } catch (error) {
    logger.error(
      "Error in NFT ownership verification for video generation:",
      error
    );
    res.status(500).json({
      error: "Ownership verification failed",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
