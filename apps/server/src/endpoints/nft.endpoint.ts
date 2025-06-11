import { Request, Response } from 'express';
import { ERROR_MESSAGES } from '../constants';
import {
  CheckNftAccessRequest,
  GetNftOwnershipRequest,
  GetUserNftsRequest,
  VerifyNftOwnershipRequest,
} from '../schemas';
import {
  checkNftAccess,
  getNftOwnership,
  getNftStats,
  getUserNfts,
  refreshNftMetadata,
  verifyNftOwnership,
} from '../services/nft.service';
import { getUserNftsFromHelius } from '../services/nft.service.helius';
import { ApiError, sendError, sendSuccess } from '../utils';

/**
 * Verify NFT ownership
 */
export async function handleVerifyNftOwnership(req: Request, res: Response) {
  try {
    // TODO: Get user from auth middleware
    const userId = 'temp-user-id'; // Placeholder until auth is integrated
    const verification = await verifyNftOwnership(
      req as unknown as VerifyNftOwnershipRequest,
      userId
    );
    sendSuccess(res, verification, 'NFT ownership verified successfully');
  } catch (error) {
    const apiError = ApiError.from(error, 500, ERROR_MESSAGES.INTERNAL_ERROR);
    sendError(res, apiError, apiError.statusCode);
  }
}

/**
 * Get NFT ownership record
 */
export async function handleGetNftOwnership(req: Request, res: Response) {
  try {
    const ownership = await getNftOwnership(
      req as unknown as GetNftOwnershipRequest
    );
    if (!ownership) {
      sendError(res, 'NFT ownership record not found', 404);
      return;
    }
    sendSuccess(res, ownership, 'NFT ownership retrieved successfully');
  } catch (error) {
    const apiError = ApiError.from(error, 500, ERROR_MESSAGES.INTERNAL_ERROR);
    sendError(res, apiError, apiError.statusCode);
  }
}

/**
 * Get user's NFTs
 */
export async function handleGetUserNfts(req: Request, res: Response) {
  try {
    // Use Helius API to fetch NFTs directly from the blockchain
    const nfts = await getUserNftsFromHelius(req as unknown as GetUserNftsRequest);
    sendSuccess(res, nfts, 'User NFTs retrieved successfully');
  } catch (error) {
    const apiError = ApiError.from(error, 500, ERROR_MESSAGES.INTERNAL_ERROR);
    sendError(res, apiError, apiError.statusCode);
  }
}

/**
 * Check NFT access for specific actions
 */
export async function handleCheckNftAccess(req: Request, res: Response) {
  try {
    // TODO: Get user from auth middleware
    const userId = 'temp-user-id'; // Placeholder until auth is integrated
    const access = await checkNftAccess(
      req as unknown as CheckNftAccessRequest,
      userId
    );
    sendSuccess(res, access, 'NFT access checked successfully');
  } catch (error) {
    const apiError = ApiError.from(error, 500, ERROR_MESSAGES.INTERNAL_ERROR);
    sendError(res, apiError, apiError.statusCode);
  }
}

/**
 * Refresh NFT metadata
 */
export async function handleRefreshNftMetadata(req: Request, res: Response) {
  try {
    // TODO: Get user from auth middleware
    const userId = 'temp-user-id'; // Placeholder until auth is integrated
    const ownership = await refreshNftMetadata(req.params.nftId, userId);
    if (!ownership) {
      sendError(res, 'NFT not found', 404);
      return;
    }
    sendSuccess(res, ownership, 'NFT metadata refreshed successfully');
  } catch (error) {
    const apiError = ApiError.from(error, 500, ERROR_MESSAGES.INTERNAL_ERROR);
    sendError(res, apiError, apiError.statusCode);
  }
}

/**
 * Get NFT statistics
 */
export async function handleGetNftStats(req: Request, res: Response) {
  try {
    const stats = await getNftStats();
    sendSuccess(res, stats, 'NFT stats retrieved successfully');
  } catch (error) {
    const apiError = ApiError.from(error, 500, ERROR_MESSAGES.INTERNAL_ERROR);
    sendError(res, apiError, apiError.statusCode);
  }
}
