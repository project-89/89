import { Router } from 'express';
import {
  handleCheckUsernameAvailability,
} from '../endpoints/proxim8User.endpoint';
import {
  proxim8PublicEndpoint,
} from '../middleware/proxim8Chains.middleware';
import {
  CheckUsernameAvailabilityRequestSchema,
} from '../schemas';

const router = Router();

/**
 * MIGRATED: Removed CRUD routes
 * 
 * DELETED ROUTES - Use auto-CRUD instead:
 * - POST /users → POST /api/model/proxim8User
 * - GET /users/:id → GET /api/model/proxim8User/:id
 * - PATCH /users/:id → PATCH /api/model/proxim8User/:id
 * - DELETE /users/:id → DELETE /api/model/proxim8User/:id
 * - GET /users → GET /api/model/proxim8User
 * 
 * KEPT: Business logic routes only
 */

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
