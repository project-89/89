import { Request, Response } from 'express';
import { ERROR_MESSAGES } from '../constants';
import {
  CheckUsernameAvailabilityRequest,
} from '../schemas';
import {
  checkUsernameAvailability,
} from '../services/proxim8User.service';
import { ApiError, sendError, sendSuccess } from '../utils';

/**
 * MIGRATED: Removed pure CRUD handlers
 * 
 * DELETED:
 * - handleCreateProxim8User → Use POST /api/model/proxim8User
 * - handleGetProxim8User → Use GET /api/model/proxim8User/:id
 * - handleUpdateProxim8User → Use PATCH /api/model/proxim8User/:id
 * - handleDeleteProxim8User → Use DELETE /api/model/proxim8User/:id
 * - handleGetProxim8Users → Use GET /api/model/proxim8User
 * 
 * KEPT: Business logic handlers only
 */

/**
 * Check username availability
 */
export async function handleCheckUsernameAvailability(
  req: Request,
  res: Response
) {
  try {
    const result = await checkUsernameAvailability(
      req as unknown as CheckUsernameAvailabilityRequest
    );
    sendSuccess(res, result, 'Username availability checked successfully');
  } catch (error) {
    const apiError = ApiError.from(error, 500, ERROR_MESSAGES.INTERNAL_ERROR);
    sendError(res, apiError, apiError.statusCode);
  }
}
