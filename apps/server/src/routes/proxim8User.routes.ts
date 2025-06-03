import { Router } from 'express';
import {
  handleCheckUsernameAvailability,
  handleCreateProxim8User,
  handleDeleteProxim8User,
  handleGetProxim8User,
  handleGetProxim8Users,
  handleUpdateProxim8User,
} from '../endpoints/proxim8User.endpoint';
import {
  proxim8AuthenticatedEndpoint,
  proxim8PublicEndpoint,
} from '../middleware/proxim8Chains.middleware';
import {
  CheckUsernameAvailabilityRequestSchema,
  CreateProxim8UserRequestSchema,
  DeleteProxim8UserRequestSchema,
  GetProxim8UserRequestSchema,
  GetProxim8UsersRequestSchema,
  UpdateProxim8UserRequestSchema,
} from '../schemas';

const router = Router();

/**
 * Create a new Proxim8 user
 * Public endpoint for user registration
 */
router.post(
  '/users',
  ...proxim8PublicEndpoint(CreateProxim8UserRequestSchema),
  handleCreateProxim8User
);

/**
 * Get Proxim8 user by ID
 * Public endpoint for user profiles
 */
router.get(
  '/users/:userId',
  ...proxim8PublicEndpoint(GetProxim8UserRequestSchema),
  handleGetProxim8User
);

/**
 * Update Proxim8 user
 * Requires authentication and ownership verification
 */
router.patch(
  '/users/:userId',
  ...proxim8AuthenticatedEndpoint(UpdateProxim8UserRequestSchema),
  handleUpdateProxim8User
);

/**
 * Delete Proxim8 user
 * Requires authentication and ownership verification
 */
router.delete(
  '/users/:userId',
  ...proxim8AuthenticatedEndpoint(DeleteProxim8UserRequestSchema),
  handleDeleteProxim8User
);

/**
 * List Proxim8 users with pagination and filtering
 * Public endpoint with optional filters
 */
router.get(
  '/users',
  ...proxim8PublicEndpoint(GetProxim8UsersRequestSchema),
  handleGetProxim8Users
);

/**
 * Check username availability
 * Public endpoint for registration validation
 */
router.get(
  '/users/check/username',
  ...proxim8PublicEndpoint(CheckUsernameAvailabilityRequestSchema),
  handleCheckUsernameAvailability
);

export default router;
