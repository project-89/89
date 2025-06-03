import { Router } from 'express';
import {
  handleCheckNftAccess,
  handleGetNftOwnership,
  handleGetNftStats,
  handleGetUserNfts,
  handleRefreshNftMetadata,
  handleVerifyNftOwnership,
} from '../endpoints/nft.endpoint';
import {
  proxim8AuthenticatedEndpoint,
  proxim8PublicEndpoint,
} from '../middleware/proxim8Chains.middleware';
import {
  CheckNftAccessRequestSchema,
  GetNftOwnershipRequestSchema,
  GetUserNftsRequestSchema,
  VerifyNftOwnershipRequestSchema,
} from '../schemas';

const router = Router();

/**
 * Verify NFT ownership
 * Requires authentication
 */
router.post(
  '/nfts/verify-ownership',
  ...proxim8AuthenticatedEndpoint(VerifyNftOwnershipRequestSchema),
  handleVerifyNftOwnership
);

/**
 * Get NFT ownership record
 * Public endpoint for checking ownership
 */
router.get(
  '/nfts/ownership/:nftId',
  ...proxim8PublicEndpoint(GetNftOwnershipRequestSchema),
  handleGetNftOwnership
);

/**
 * Get user's NFTs
 * Public endpoint for user NFT collections
 */
router.get(
  '/nfts/user/:walletAddress',
  ...proxim8PublicEndpoint(GetUserNftsRequestSchema),
  handleGetUserNfts
);

/**
 * Check NFT access for specific actions
 * Requires authentication
 */
router.post(
  '/nfts/check-access',
  ...proxim8AuthenticatedEndpoint(CheckNftAccessRequestSchema),
  handleCheckNftAccess
);

/**
 * Refresh NFT metadata
 * Requires authentication and ownership verification
 */
router.post(
  '/nfts/:nftId/refresh-metadata',
  ...proxim8AuthenticatedEndpoint(),
  handleRefreshNftMetadata
);

/**
 * Get NFT statistics
 * Public endpoint for platform stats
 */
router.get('/nfts/stats', ...proxim8PublicEndpoint(), handleGetNftStats);

export default router;
