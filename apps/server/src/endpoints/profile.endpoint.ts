import { Request, Response } from "express";
import {
  getProfileByWallet,
} from "../services";
import { sendError, sendSuccess, ApiError } from "../utils";
import { ERROR_MESSAGES } from "../constants";

/**
 * MIGRATED: Removed pure CRUD handlers
 * 
 * DELETED:
 * - handleCreateProfile → Use POST /api/model/profile
 * - handleGetProfile → Use GET /api/model/profile/:id
 * - handleUpdateProfile → Use PATCH /api/model/profile/:id
 * - handleSearchProfiles → Use GET /api/model/profile with query params
 * 
 * KEPT: Business logic handlers only
 */

/**
 * Get a profile by wallet address - special lookup logic
 */
export const handleGetProfileByWallet = async (req: Request, res: Response) => {
  try {
    console.log("[Get Profile By Wallet] Starting with params:", req.params);
    const profile = await getProfileByWallet(req.params.walletAddress);
    console.log("[Get Profile By Wallet] Successfully retrieved profile:", { id: profile.id });
    return sendSuccess(res, profile);
  } catch (error) {
    console.error("[Get Profile By Wallet] Error:", {
      error,
      stack: error instanceof Error ? error.stack : undefined,
      params: req.params,
    });

    return sendError(res, ApiError.from(error, 500, ERROR_MESSAGES.FAILED_TO_GET_PROFILE));
  }
};
