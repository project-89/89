import { Request, Response } from 'express';
import { ERROR_MESSAGES } from '../constants';
import {
  CheckUsernameAvailabilityRequest,
  CreateProxim8UserRequest,
  DeleteProxim8UserRequest,
  GetProxim8UserRequest,
  GetProxim8UsersRequest,
  UpdateProxim8UserRequest,
} from '../schemas';
import {
  checkUsernameAvailability,
  createProxim8User,
  deleteProxim8User,
  getProxim8User,
  getProxim8Users,
  updateProxim8User,
} from '../services/proxim8User.service';
import { ApiError, sendError, sendSuccess } from '../utils';

/**
 * Create a new Proxim8 user
 */
export async function handleCreateProxim8User(req: Request, res: Response) {
  try {
    const user = await createProxim8User(
      req as unknown as CreateProxim8UserRequest
    );
    sendSuccess(res, user, 'User created successfully', 201);
  } catch (error) {
    const apiError = ApiError.from(error, 500, ERROR_MESSAGES.INTERNAL_ERROR);
    sendError(res, apiError, apiError.statusCode);
  }
}

/**
 * Get Proxim8 user by ID
 */
export async function handleGetProxim8User(req: Request, res: Response) {
  try {
    const user = await getProxim8User(req as unknown as GetProxim8UserRequest);
    if (!user) {
      sendError(res, 'User not found', 404);
      return;
    }
    sendSuccess(res, user, 'User retrieved successfully');
  } catch (error) {
    const apiError = ApiError.from(error, 500, ERROR_MESSAGES.INTERNAL_ERROR);
    sendError(res, apiError, apiError.statusCode);
  }
}

/**
 * Update Proxim8 user
 */
export async function handleUpdateProxim8User(req: Request, res: Response) {
  try {
    // TODO: Get user from auth middleware
    const userId = 'temp-user-id'; // Placeholder until auth is integrated
    const user = await updateProxim8User(
      req as unknown as UpdateProxim8UserRequest,
      userId
    );
    sendSuccess(res, user, 'User updated successfully');
  } catch (error) {
    const apiError = ApiError.from(error, 500, ERROR_MESSAGES.INTERNAL_ERROR);
    sendError(res, apiError, apiError.statusCode);
  }
}

/**
 * Delete Proxim8 user
 */
export async function handleDeleteProxim8User(req: Request, res: Response) {
  try {
    const deleted = await deleteProxim8User(
      req as unknown as DeleteProxim8UserRequest
    );
    sendSuccess(res, { deleted }, 'User deleted successfully');
  } catch (error) {
    const apiError = ApiError.from(error, 500, ERROR_MESSAGES.INTERNAL_ERROR);
    sendError(res, apiError, apiError.statusCode);
  }
}

/**
 * List Proxim8 users with pagination and filtering
 */
export async function handleGetProxim8Users(req: Request, res: Response) {
  try {
    const users = await getProxim8Users(
      req as unknown as GetProxim8UsersRequest
    );
    sendSuccess(res, users, 'Users retrieved successfully');
  } catch (error) {
    const apiError = ApiError.from(error, 500, ERROR_MESSAGES.INTERNAL_ERROR);
    sendError(res, apiError, apiError.statusCode);
  }
}

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
