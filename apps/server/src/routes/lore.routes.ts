import { Router } from 'express';
import { handleGetBatchAvailableLore } from '../endpoints/lore.endpoint';
import { proxim8AuthenticatedEndpoint } from '../middleware/proxim8Chains.middleware';
import { GetBatchAvailableLoreRequestSchema } from '../schemas';

const router = Router();

/**
 * Get batch available lore for multiple NFTs
 * Requires authentication
 * Reduces API calls from n individual requests to 1 batch request
 */
router.post(
  '/lore/batch/available',
  ...proxim8AuthenticatedEndpoint(GetBatchAvailableLoreRequestSchema),
  handleGetBatchAvailableLore
);

export default router;