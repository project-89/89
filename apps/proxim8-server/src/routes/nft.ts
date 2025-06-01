import { Router } from "express";
import { verifyApiKey } from "../middleware/apiKey";
import { getNFTsByWallet } from "../controllers/nftController";
import { jwtAuth } from "../middleware/jwtAuth";
const router = Router();

/**
 * Get NFTs for a wallet address, filtered by the Proxim8 collection (PUBLIC ROUTE)
 * GET /api/nft/:walletAddress
 * Query params:
 * - filterByCollection: boolean (default: true) - Filter for Proxim8 collection only
 * - page: number (default: 1) - Page number for pagination
 * - limit: number (default: 1000) - Results per page
 */
router.get("/:walletAddress", verifyApiKey, jwtAuth, getNFTsByWallet);

export const nftRoutes: Router = router;
