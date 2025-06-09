import { Response } from "express";
import Lore from "../models/Lore";
import LoreReward from "../models/LoreReward";
import UserLoreReward from "../models/UserLoreReward";
import { logger } from "../utils/logger";
import mongoose from "mongoose";
import { RequestWithUser } from "../middleware/auth";
import { getNFTsForWallet } from "./nftController";

export const getLoreByNftId = async (
  req: RequestWithUser,
  res: Response
): Promise<void> => {
  try {
    const { nftId } = req.params;
    const { sourceType } = req.query; // Optional filter for 'nft' or 'mission'

    const query: any = { nftId };
    if (sourceType) {
      query.sourceType = sourceType;
    }

    const lore = await Lore.find(query).sort({ createdAt: -1 });

    if (!lore || lore.length === 0) {
      res.status(404).json({ message: "Lore not found for this NFT" });
      return;
    }

    res.status(200).json(lore);
  } catch (error) {
    logger.error(`Error getting lore by NFT ID: ${error}`);
    res.status(500).json({ message: "Server error", error });
  }
};

// export const createOrUpdateLore = async (
//   req: RequestWithUser,
//   res: Response
// ): Promise<void> => {
//   try {
//     const { nftId } = req.params;
//     const loreData = req.body;

//     // Check if admin (middleware should handle this)
//     if (!req.user?.isAdmin) {
//       res.status(403).json({ message: "Unauthorized" });
//       return;
//     }

//     const lore = await Lore.findOneAndUpdate(
//       { nftId },
//       { ...loreData, updatedAt: new Date() },
//       { new: true, upsert: true }
//     );

//     res.status(200).json(lore);
//   } catch (error) {
//     logger.error(`Error creating or updating lore: ${error}`);
//     res.status(500).json({ message: "Server error", error });
//   }
// };

export const claimLore = async (
  req: RequestWithUser,
  res: Response
): Promise<void> => {
  try {
    const { nftId } = req.params;
    const { walletAddress } = req.user || {};

    if (!walletAddress) {
      res.status(401).json({ message: "Authentication required" });
      return;
    }

    // Verify NFT ownership (this would be implemented in middleware)

    const lore = await Lore.findOneAndUpdate(
      { nftId, claimed: false },
      {
        claimed: true,
        claimedBy: walletAddress,
        claimedAt: new Date(),
        updatedAt: new Date(),
      },
      { new: true }
    );

    if (!lore) {
      res.status(404).json({ message: "Lore not found or already claimed" });
      return;
    }

    res.status(200).json(lore);
  } catch (error) {
    logger.error(`Error claiming lore: ${error}`);
    res.status(500).json({ message: "Server error", error });
  }
};

export const getLoreByUser = async (
  req: RequestWithUser,
  res: Response
): Promise<void> => {
  try {
    const { walletAddress } = req.params;

    const lore = await Lore.find({ claimedBy: walletAddress });

    res.status(200).json(lore);
  } catch (error) {
    logger.error(`Error getting lore by user: ${error}`);
    res.status(500).json({ message: "Server error", error });
  }
};

export const getAllLore = async (
  req: RequestWithUser,
  res: Response
): Promise<void> => {
  try {
    // This endpoint would be admin-only
    if (!req.user?.isAdmin) {
      res.status(403).json({ message: "Unauthorized" });
      return;
    }

    const lore = await Lore.find({});
    res.status(200).json(lore);
  } catch (error) {
    logger.error(`Error getting all lore: ${error}`);
    res.status(500).json({ message: "Server error", error });
  }
};

// New functions for lore rewards

export const getAllLoreRewards = async (
  req: RequestWithUser,
  res: Response
): Promise<void> => {
  try {
    const { page = 1, limit = 10, type } = req.query;
    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    const query: any = {};
    if (type) {
      query.type = type;
    }

    const [rewards, totalCount] = await Promise.all([
      LoreReward.find(query).skip(skip).limit(limitNum).sort({ createdAt: -1 }),
      LoreReward.countDocuments(query),
    ]);

    res.status(200).json({
      rewards,
      totalPages: Math.ceil(totalCount / limitNum),
      currentPage: pageNum,
      totalCount,
    });
  } catch (error) {
    logger.error(`Error getting lore rewards: ${error}`);
    res.status(500).json({ message: "Server error", error });
  }
};

export const getLoreRewardById = async (
  req: RequestWithUser,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ message: "Invalid reward ID format" });
      return;
    }

    const reward = await LoreReward.findById(id);

    if (!reward) {
      res.status(404).json({ message: "Lore reward not found" });
      return;
    }

    res.status(200).json(reward);
  } catch (error) {
    logger.error(`Error getting lore reward by ID: ${error}`);
    res.status(500).json({ message: "Server error", error });
  }
};

export const createLoreReward = async (
  req: RequestWithUser,
  res: Response
): Promise<void> => {
  try {
    // Admin only endpoint
    if (!req.user?.isAdmin) {
      res.status(403).json({ message: "Unauthorized" });
      return;
    }

    const rewardData = req.body;
    const newReward = new LoreReward(rewardData);
    await newReward.save();

    res.status(201).json(newReward);
  } catch (error) {
    logger.error(`Error creating lore reward: ${error}`);
    res.status(500).json({ message: "Server error", error });
  }
};

export const updateLoreReward = async (
  req: RequestWithUser,
  res: Response
): Promise<void> => {
  try {
    // Admin only endpoint
    if (!req.user?.isAdmin) {
      res.status(403).json({ message: "Unauthorized" });
      return;
    }

    const { id } = req.params;
    const rewardData = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ message: "Invalid reward ID format" });
      return;
    }

    const updatedReward = await LoreReward.findByIdAndUpdate(id, rewardData, {
      new: true,
    });

    if (!updatedReward) {
      res.status(404).json({ message: "Lore reward not found" });
      return;
    }

    res.status(200).json(updatedReward);
  } catch (error) {
    logger.error(`Error updating lore reward: ${error}`);
    res.status(500).json({ message: "Server error", error });
  }
};

export const deleteLoreReward = async (
  req: RequestWithUser,
  res: Response
): Promise<void> => {
  try {
    // Admin only endpoint
    if (!req.user?.isAdmin) {
      res.status(403).json({ message: "Unauthorized" });
      return;
    }

    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ message: "Invalid reward ID format" });
      return;
    }

    // Check if any users have claimed this reward
    const claimCount = await UserLoreReward.countDocuments({ rewardId: id });
    if (claimCount > 0) {
      res.status(400).json({
        message: "Cannot delete a reward that has been claimed by users",
        claimCount,
      });
      return;
    }

    const deletedReward = await LoreReward.findByIdAndDelete(id);

    if (!deletedReward) {
      res.status(404).json({ message: "Lore reward not found" });
      return;
    }

    res.status(200).json({ message: "Lore reward deleted successfully" });
  } catch (error) {
    logger.error(`Error deleting lore reward: ${error}`);
    res.status(500).json({ message: "Server error", error });
  }
};

export const getUserLoreRewards = async (
  req: RequestWithUser,
  res: Response
): Promise<void> => {
  try {
    const { userId } = req.params;

    // Authenticate that the user is requesting their own rewards or is an admin
    if (req.user?.walletAddress !== userId && !req.user?.isAdmin) {
      res.status(403).json({ message: "Unauthorized" });
      return;
    }

    const userRewards = await UserLoreReward.find({ userId })
      .populate("rewardId")
      .sort({ claimedAt: -1 });

    res.status(200).json(userRewards);
  } catch (error) {
    logger.error(`Error getting user lore rewards: ${error}`);
    res.status(500).json({ message: "Server error", error });
  }
};

export const claimLoreReward = async (
  req: RequestWithUser,
  res: Response
): Promise<void> => {
  try {
    const { loreId } = req.params;
    const { nftId } = req.body;
    const userId = req.user?.walletAddress;

    if (!userId) {
      res.status(401).json({ message: "Authentication required" });
      return;
    }

    // Check if this is a lore claim for an NFT
    // First, check if this ID is from the Lore collection
    const lore = await Lore.findById(loreId);

    if (lore) {
      if (lore.claimed) {
        res.status(400).json({ message: "This lore has already been claimed" });
        return;
      }

      // Mark the lore as claimed
      lore.claimed = true;
      lore.claimedBy = userId;
      lore.claimedAt = new Date();
      await lore.save();

      // Return the claimed lore
      res.status(200).json({
        id: lore._id,
        title: lore.title,
        nftId: lore.nftId,
        content: lore.content,
        loreAmount: 50,
        claimedAt: lore.claimedAt,
      });
      return;
    }

    // If not a Lore document, continue with original reward claiming logic
    if (!mongoose.Types.ObjectId.isValid(loreId)) {
      res.status(400).json({ message: "Invalid lore ID format" });
      return;
    }

    // Start a session for transaction
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Find the reward
      const reward = await LoreReward.findById(loreId).session(session);

      if (!reward) {
        await session.abortTransaction();
        session.endSession();
        res.status(404).json({ message: "Lore reward not found" });
        return;
      }

      // Check if reward is available
      if (!reward.available) {
        await session.abortTransaction();
        session.endSession();
        res.status(400).json({ message: "This reward is not available" });
        return;
      }

      // Check if supply limit reached
      if (
        reward.totalSupply !== -1 &&
        reward.claimedCount >= reward.totalSupply
      ) {
        await session.abortTransaction();
        session.endSession();
        res.status(400).json({ message: "This reward is out of stock" });
        return;
      }

      // Check if NFT is required
      if (reward.nftRequired) {
        if (!nftId) {
          await session.abortTransaction();
          session.endSession();
          res
            .status(400)
            .json({ message: "NFT ID is required to claim this reward" });
          return;
        }

        if (reward.requiredNftId && reward.requiredNftId !== nftId) {
          await session.abortTransaction();
          session.endSession();
          res.status(400).json({
            message: "You don't have the required NFT to claim this reward",
          });
          return;
        }

        // Verify NFT ownership would be here (middleware or service call)
      }

      // Check if user already claimed this reward
      const existingClaim = await UserLoreReward.findOne({
        userId,
        rewardId: loreId,
      }).session(session);

      if (existingClaim) {
        await session.abortTransaction();
        session.endSession();
        res
          .status(400)
          .json({ message: "You have already claimed this reward" });
        return;
      }

      // Create the user reward
      const userReward = new UserLoreReward({
        userId,
        rewardId: loreId,
        nftId: nftId || null,
        claimedAt: new Date(),
      });
      await userReward.save({ session });

      // Increment claimed count on the reward
      reward.claimedCount += 1;
      await reward.save({ session });

      await session.commitTransaction();
      session.endSession();

      // Return the populated user reward
      const populatedUserReward = await UserLoreReward.findById(
        userReward._id
      ).populate("rewardId");

      res.status(201).json(populatedUserReward);
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  } catch (error) {
    logger.error(`Error claiming lore reward: ${error}`);
    res.status(500).json({ message: "Server error", error });
  }
};

export const getNFTLoreRewards = async (
  req: RequestWithUser,
  res: Response
): Promise<void> => {
  try {
    const walletAddress = req.user?.walletAddress;

    if (!walletAddress) {
      res.status(401).json({ message: "Authentication required" });
      return;
    }

    try {
      // Get the user's NFTs directly using the service function
      const { nfts } = await getNFTsForWallet(walletAddress, true, 1, 1000);

      if (nfts.length === 0) {
        res.status(200).json([]);
        return;
      }

      // Extract metadata URLs from NFTs
      const metadataPromises = nfts.map(async (nft: any) => {
        // Example image URL: https://na-assets.pinit.io/8GwrpeSH4TpAGEJsmoF35J8DY6RNCdyjCBZsEnTySEKd/c746a7a7-88cc-4677-b919-877329e2dd0d/34
        const image = nft.image;

        if (!image) {
          return null;
        }

        // Extract the number at the end of the URL
        const parts = image.split("/");
        const imageNumber = parts[parts.length - 1];

        // Construct the metadata URL
        // From: https://na-assets.pinit.io/8GwrpeSH4TpAGEJsmoF35J8DY6RNCdyjCBZsEnTySEKd/c746a7a7-88cc-4677-b919-877329e2dd0d/34
        // To: https://gateway.pinit.io/ipfs/QmQUDdJ1niyDx4aGMJkesQmSJhiBq2TZZne5LBTVsphY6N/34.json
        const metadataUrl = `https://gateway.pinit.io/ipfs/QmQUDdJ1niyDx4aGMJkesQmSJhiBq2TZZne5LBTVsphY6N/${imageNumber}.json`;

        try {
          const metadataResponse = await fetch(metadataUrl);
          if (!metadataResponse.ok) {
            return null;
          }

          const metadata = (await metadataResponse.json()) as {
            tokenId: string;
          };

          return {
            nftId: nft.id,
            tokenId: metadata.tokenId,
          };
        } catch (error) {
          return null;
        }
      });

      const metadataResults = await Promise.all(metadataPromises);
      const tokenIds = metadataResults
        .filter(Boolean)
        .map((result: any) => result!.tokenId);

      if (tokenIds.length === 0) {
        res.status(200).json([]);
        return;
      }

      const loreEntries = await Lore.find({ nftId: { $in: tokenIds } });

      if (loreEntries.length === 0) {
        res.status(200).json([]);
        return;
      }

      // Transform lore entries to reward format for the frontend
      const rewards = loreEntries.map((lore) => ({
        id: lore._id.toString(), // Ensure ID is a string
        title: lore.title || `Lore for NFT #${lore.nftId}`,
        description: `Backstory and lore for your Proxim8 NFT #${lore.nftId}`,
        type: "text",
        content: lore.content.substring(0, 150) + "...", // Preview only
        nftRequired: true,
        requiredNftId: lore.nftId,
        available: true,
        rarity: "rare",
        loreAmount: 50,
        nftInfo: {
          id: lore.nftId,
          name: `Proxim8 NFT #${lore.nftId}`,
        },
      }));

      res.status(200).json(rewards);
    } catch (error) {
      const loreEntries = await Lore.find({ claimed: false });

      if (loreEntries.length === 0) {
        res.status(200).json([]);
        return;
      }

      // Transform lore entries to reward format for the frontend
      const rewards = loreEntries.map((lore) => ({
        id: lore._id.toString(),
        title: lore.title || `Lore for NFT #${lore.nftId}`,
        description: `Backstory and lore for your Proxim8 NFT #${lore.nftId}`,
        type: "text",
        content: lore.content.substring(0, 150) + "...", // Preview only
        nftRequired: true,
        requiredNftId: lore.nftId,
        available: true,
        rarity: "rare",
        loreAmount: 50,
        nftInfo: {
          id: lore.nftId,
          name: `Proxim8 NFT #${lore.nftId}`,
        },
      }));

      res.status(200).json(rewards);
    }
  } catch (error) {
    logger.error(`Error getting NFT lore rewards: ${error}`);
    res.status(500).json({ message: "Server error", error: String(error) });
  }
};

export const getClaimedLore = async (
  req: RequestWithUser,
  res: Response
): Promise<void> => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    // Get all claimed lore
    const [lore, total] = await Promise.all([
      Lore.find({ claimed: true })
        .skip(skip)
        .limit(limitNum)
        .sort({ claimedAt: -1 }),
      Lore.countDocuments({ claimed: true }),
    ]);

    res.status(200).json({
      lore,
      total,
      currentPage: pageNum,
      totalPages: Math.ceil(total / limitNum),
    });
  } catch (error) {
    logger.error(`Error getting claimed lore: ${error}`);
    res.status(500).json({ message: "Server error", error });
  }
};

/**
 * Get all lore relevant to the user's NFTs in a single unified call
 * This is a simplified approach that replaces the multiple reward endpoints
 */
export const getUserNftLore = async (
  req: RequestWithUser,
  res: Response
): Promise<void> => {
  try {
    const walletAddress = req.user?.walletAddress;

    if (!walletAddress) {
      res.status(401).json({ message: "Authentication required" });
      return;
    }

    try {
      // Get the user's NFTs directly using the service function
      const { nfts } = await getNFTsForWallet(walletAddress, true, 1, 1000);

      if (nfts.length === 0) {
        res.status(200).json([]);
        return;
      }

      // Extract metadata URLs from NFTs
      const metadataPromises = nfts.map(async (nft: any) => {
        // Example image URL: https://na-assets.pinit.io/8GwrpeSH4TpAGEJsmoF35J8DY6RNCdyjCBZsEnTySEKd/c746a7a7-88cc-4677-b919-877329e2dd0d/34
        const image = nft.image;

        if (!image) {
          return null;
        }

        // Extract the number at the end of the URL
        const parts = image.split("/");
        const imageNumber = parts[parts.length - 1];

        // Construct the metadata URL
        // From: https://na-assets.pinit.io/8GwrpeSH4TpAGEJsmoF35J8DY6RNCdyjCBZsEnTySEKd/c746a7a7-88cc-4677-b919-877329e2dd0d/34
        // To: https://gateway.pinit.io/ipfs/QmQUDdJ1niyDx4aGMJkesQmSJhiBq2TZZne5LBTVsphY6N/34.json
        const metadataUrl = `https://gateway.pinit.io/ipfs/QmQUDdJ1niyDx4aGMJkesQmSJhiBq2TZZne5LBTVsphY6N/${imageNumber}.json`;

        try {
          const metadataResponse = await fetch(metadataUrl);
          if (!metadataResponse.ok) {
            return null;
          }

          const metadata = (await metadataResponse.json()) as {
            tokenId: string;
          };

          return {
            nftId: nft.id,
            tokenId: metadata.tokenId,
          };
        } catch (error) {
          return null;
        }
      });

      const metadataResults = await Promise.all(metadataPromises);
      const tokenIds = metadataResults
        .filter(Boolean)
        .map((result: any) => result!.tokenId);

      if (tokenIds.length === 0) {
        res.status(200).json([]);
        return;
      }

      const loreEntries = await Lore.find({ nftId: { $in: tokenIds } });

      if (loreEntries.length === 0) {
        res.status(200).json([]);
        return;
      }

      // Transform lore entries to a consistent format for the frontend
      const loreItems = loreEntries.map((lore) => ({
        id: lore._id.toString(),
        title: lore.title || `Lore for NFT #${lore.nftId}`,
        description: `Backstory and lore for your Proxim8 NFT #${lore.nftId}`,
        type: "text",
        content: lore.content,
        nftId: lore.nftId,
        claimed: lore.claimed,
        claimedBy: lore.claimedBy,
        claimedAt: lore.claimedAt,
        createdAt: lore.createdAt,
        updatedAt: lore.updatedAt,
        nftInfo: {
          id: lore.nftId,
          name: `Proxim8 NFT #${lore.nftId}`,
        },
      }));

      res.status(200).json(loreItems);
    } catch (error) {
      res.status(500).json({ message: "Server error", error: String(error) });
    }
  } catch (error) {
    res.status(500).json({ message: "Server error", error: String(error) });
  }
};

/**
 * Get only claimed lore for a specific NFT (secure endpoint)
 * Only returns lore that has been claimed with full content
 */
export const getClaimedLoreByNftId = async (
  req: RequestWithUser,
  res: Response
): Promise<void> => {
  try {
    const { nftId } = req.params;
    const { sourceType } = req.query;
    const { walletAddress } = req.user || {};

    if (!walletAddress) {
      res.status(401).json({ message: "Authentication required" });
      return;
    }

    console.log(`[Lore] Fetching claimed lore for NFT ${nftId} by wallet ${walletAddress}`);

    // Build query to filter by nftId, claimed status, and user who claimed it
    const query: any = {
      nftId,
      claimed: true,
      claimedBy: walletAddress,
    };

    // Add sourceType filter if provided
    if (sourceType) {
      query.sourceType = sourceType;
    }

    console.log(`[Lore] Query:`, query);

    const claimedLore = await Lore.find(query);

    console.log(`[Lore] Found ${claimedLore.length} claimed lore entries`);

    if (claimedLore.length === 0) {
      // Check if any lore exists for this NFT at all
      const totalLore = await Lore.countDocuments({ nftId });
      console.log(`[Lore] Total lore for NFT ${nftId}: ${totalLore}`);
      
      res.status(404).json({ message: "No claimed lore found for this NFT" });
      return;
    }

    res.status(200).json(claimedLore);
  } catch (error) {
    logger.error(`Error getting claimed lore by NFT ID: ${error}`);
    res.status(500).json({ message: "Server error", error });
  }
};

/**
 * Check if unclaimed lore is available for a specific NFT
 * Only returns availability status, no content
 */
export const getAvailableLoreByNftId = async (
  req: RequestWithUser,
  res: Response
): Promise<void> => {
  try {
    const { nftId } = req.params;
    const { sourceType } = req.query;

    const query: any = { nftId, claimed: false };
    if (sourceType) {
      query.sourceType = sourceType;
    }

    const unclaimedCount = await Lore.countDocuments(query);

    res.status(200).json({
      hasUnclaimedLore: unclaimedCount > 0,
      unclaimedCount,
    });
  } catch (error) {
    logger.error(`Error checking available lore by NFT ID: ${error}`);
    res.status(500).json({ message: "Server error", error });
  }
};

/**
 * Get mission-generated lore that's ready to claim (mission completed)
 */
export const getClaimableMissionLore = async (
  req: RequestWithUser,
  res: Response
): Promise<void> => {
  try {
    const { nftId } = req.params;
    const now = new Date();

    console.log(`[Lore] Fetching claimable mission lore for NFT ${nftId}`);

    // Find mission lore that's unlocked (mission completion time has passed) but not claimed yet
    const claimableLore = await Lore.find({
      nftId,
      sourceType: "mission",
      claimed: false,
      "unlockRequirements.completedAt": { $lte: now },
    }).sort({ createdAt: -1 });

    console.log(`[Lore] Found ${claimableLore.length} claimable mission lore entries`);

    // Also check for any mission lore at all
    const totalMissionLore = await Lore.countDocuments({
      nftId,
      sourceType: "mission"
    });
    console.log(`[Lore] Total mission lore for NFT ${nftId}: ${totalMissionLore}`);

    res.status(200).json({
      claimableLore,
      count: claimableLore.length,
    });
  } catch (error) {
    logger.error(`Error getting claimable mission lore: ${error}`);
    res.status(500).json({ message: "Server error", error });
  }
};

/**
 * Get lore dashboard data for an NFT (combines all lore types)
 */
export const getLoreDashboardByNftId = async (
  req: RequestWithUser,
  res: Response
): Promise<void> => {
  try {
    const { nftId } = req.params;

    // Get all lore for this NFT, grouped by type and claimed status
    const allLore = await Lore.find({ nftId }).sort({ createdAt: -1 });

    const dashboard = {
      nftId,
      totalLore: allLore.length,
      claimed: allLore.filter((l) => l.claimed).length,
      unclaimed: allLore.filter((l) => !l.claimed).length,

      // Breakdown by source type
      nftLore: allLore.filter((l) => (l as any).sourceType === "nft"),
      missionLore: allLore.filter((l) => (l as any).sourceType === "mission"),

      // Mission lore breakdown by type
      missionReports: allLore.filter(
        (l) => (l as any).loreType === "mission_report"
      ),
      canonLore: allLore.filter((l) => (l as any).loreType === "89_canon"),
      characterEvolution: allLore.filter(
        (l) => (l as any).loreType === "character_evolution"
      ),
      timelineFragments: allLore.filter(
        (l) => (l as any).loreType === "timeline_fragment"
      ),
      resistanceIntel: allLore.filter(
        (l) => (l as any).loreType === "resistance_intel"
      ),

      // Ready to claim (mission completed)
      readyToClaim: allLore.filter(
        (l) =>
          !l.claimed &&
          (l as any).sourceType === "mission" &&
          (l as any).unlockRequirements?.completedAt &&
          (l as any).unlockRequirements.completedAt <= new Date()
      ),
    };

    res.status(200).json(dashboard);
  } catch (error) {
    logger.error(`Error getting lore dashboard: ${error}`);
    res.status(500).json({ message: "Server error", error });
  }
};

export const getBatchAvailableLore = async (
  req: RequestWithUser,
  res: Response
): Promise<void> => {
  try {
    const { nftIds } = req.body;

    if (!Array.isArray(nftIds) || nftIds.length === 0) {
      res.status(400).json({ message: "nftIds array is required" });
      return;
    }

    // Limit batch size to prevent abuse
    if (nftIds.length > 100) {
      res
        .status(400)
        .json({ message: "Maximum 100 NFT IDs per batch request" });
      return;
    }

    // Single aggregation query to get counts for all NFTs
    const results = await Lore.aggregate([
      {
        $match: {
          nftId: { $in: nftIds },
          claimed: false,
        },
      },
      {
        $group: {
          _id: "$nftId",
          unclaimedCount: { $sum: 1 },
        },
      },
    ]);

    // Convert to lookup map
    const loreCounts = new Map(results.map((r) => [r._id, r.unclaimedCount]));

    // Build response for all requested NFTs (including those with 0 lore)
    const response = nftIds.reduce((acc: any, nftId: string) => {
      const count = loreCounts.get(nftId) || 0;
      acc[nftId] = {
        hasUnclaimedLore: count > 0,
        unclaimedCount: count,
      };
      return acc;
    }, {});

    res.status(200).json(response);
  } catch (error) {
    logger.error(`Error checking batch available lore: ${error}`);
    res.status(500).json({ message: "Server error", error });
  }
};
