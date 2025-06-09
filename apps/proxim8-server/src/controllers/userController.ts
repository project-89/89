import { Response } from "express";
import User from "../models/User";
import { logger } from "../utils/logger";
import { RequestWithUser } from "../middleware/auth";

/**
 * Get user profile by wallet address
 */
export const getUserProfile = async (
  req: RequestWithUser,
  res: Response
): Promise<void> => {
  try {
    const { address } = req.params;

    const user = await User.findOne({ walletAddress: address });

    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    res.status(200).json(user);
  } catch (error) {
    console.error("Error fetching user profile:", error);
    res.status(500).json({
      message: "Server error",
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

/**
 * Create or update user profile
 */
export const updateUserProfile = async (
  req: RequestWithUser,
  res: Response
): Promise<void> => {
  try {
    const { walletAddress } = req.user || {};

    if (!walletAddress) {
      res.status(401).json({ message: "Authentication required" });
      return;
    }

    const { username, bio, profileImage, social } = req.body;

    // Check if a different user already has this username
    if (username) {
      const existingUser = await User.findOne({
        username,
        walletAddress: { $ne: walletAddress },
      });

      if (existingUser) {
        res.status(400).json({ message: "Username already taken" });
        return;
      }
    }

    // Find and update user, or create if doesn't exist
    const user = await User.findOneAndUpdate(
      { walletAddress },
      {
        $set: {
          username,
          bio,
          profileImage,
          social,
          updatedAt: new Date(),
        },
      },
      { new: true, upsert: true }
    );

    res.status(200).json(user);
  } catch (error) {
    console.error("Error updating user profile:", error);
    res.status(500).json({
      message: "Server error",
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

/**
 * Get user preferences
 * Returns the preferences for the authenticated user
 */
export const getUserPreferences = async (
  req: RequestWithUser,
  res: Response
): Promise<void> => {
  try {
    if (!req.user || !req.user.walletAddress) {
      res.status(401).json({
        success: false,
        error: "Authentication required",
      });
      return;
    }

    const walletAddress = req.user.walletAddress;

    // Find user in the database
    const user = await User.findOne({ walletAddress });

    if (!user) {
      res.status(404).json({
        success: false,
        error: "User not found",
      });
      return;
    }

    // Return user preferences
    res.status(200).json({
      success: true,
      preferences: user.preferences || {},
    });
  } catch (error) {
    logger.error(`Error getting user preferences: ${error}`);
    res.status(500).json({
      success: false,
      error: "Failed to get user preferences",
    });
  }
};

/**
 * Update user preferences
 * Updates the preferences for the authenticated user
 */
export const updateUserPreferences = async (
  req: RequestWithUser,
  res: Response
): Promise<void> => {
  try {
    if (!req.user || !req.user.walletAddress) {
      res.status(401).json({
        success: false,
        error: "Authentication required",
      });
      return;
    }

    const walletAddress = req.user.walletAddress;
    const { preferences } = req.body;

    if (!preferences || typeof preferences !== "object") {
      res.status(400).json({
        success: false,
        error: "Invalid preferences data",
      });
      return;
    }

    // Find and update user in the database
    const user = await User.findOneAndUpdate(
      { walletAddress },
      { $set: { preferences } },
      { new: true, upsert: true }
    );

    // Return updated user preferences
    res.status(200).json({
      success: true,
      preferences: user.preferences,
      message: "User preferences updated successfully",
    });
  } catch (error) {
    logger.error(`Error updating user preferences: ${error}`);
    res.status(500).json({
      success: false,
      error: "Failed to update user preferences",
    });
  }
};

/**
 * Get current user's profile
 */
export const getCurrentUser = async (
  req: RequestWithUser,
  res: Response
): Promise<void> => {
  try {
    const { walletAddress } = req.user || {};

    if (!walletAddress) {
      res.status(401).json({ message: "Authentication required" });
      return;
    }

    // Find user by wallet address
    let user = await User.findOne({ walletAddress });

    // If user doesn't exist, create a new one with default values
    if (!user) {
      user = new User({
        walletAddress,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      await user.save();
    }

    res.status(200).json(user);
  } catch (error) {
    console.error("Error fetching current user:", error);
    res.status(500).json({
      message: "Server error",
      error: error instanceof Error ? error.message : String(error),
    });
  }
};
