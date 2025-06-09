import { Request, Response } from "express";
import { ApiError, sendSuccess, sendError } from "../utils";
import { ERROR_MESSAGES } from "../constants";
import {
  getAccountByWalletAddress,
} from "../services";

const LOG_PREFIX = "[Account Endpoint]";

/**
 * MIGRATED: Removed pure CRUD handlers
 * 
 * DELETED:
 * - handleCreateAccount → Use POST /api/model/account
 * - handleGetAccount → Use GET /api/model/account/:id
 * - handleUpdateAccount → Use PATCH /api/model/account/:id
 * 
 * KEPT: Business logic handlers only
 */

export const handleGetAccountByWallet = async (req: Request, res: Response) => {
  try {
    console.log(`${LOG_PREFIX} Starting account retrieval by wallet`);
    const { walletAddress } = req.params;
    const account = await getAccountByWalletAddress(walletAddress);

    if (!account) {
      return sendError(res, new ApiError(404, ERROR_MESSAGES.ACCOUNT_NOT_FOUND));
    }

    console.log(`${LOG_PREFIX} Successfully retrieved account by wallet:`, { walletAddress });
    return sendSuccess(res, account);
  } catch (error) {
    console.error(`${LOG_PREFIX} Error retrieving account by wallet:`, error);
    return sendError(res, ApiError.from(error, 500, ERROR_MESSAGES.INTERNAL_ERROR));
  }
};

