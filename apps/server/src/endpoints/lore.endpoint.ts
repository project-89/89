import { Request, Response } from 'express';
import { ERROR_MESSAGES } from '../constants';
import { GetBatchAvailableLoreRequest } from '../schemas';
import { getBatchAvailableLore } from '../services/lore.service';
import { ApiError, sendError, sendSuccess } from '../utils';

/**
 * Get batch available lore for multiple NFTs
 * Reduces API calls from n individual requests to 1 batch request
 */
export async function handleGetBatchAvailableLore(req: Request, res: Response) {
  try {
    const result = await getBatchAvailableLore(
      req as unknown as GetBatchAvailableLoreRequest
    );
    sendSuccess(res, result, 'Batch available lore retrieved successfully');
  } catch (error) {
    const apiError = ApiError.from(error, 500, ERROR_MESSAGES.INTERNAL_ERROR);
    sendError(res, apiError, apiError.statusCode);
  }
}