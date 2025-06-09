import { Router } from "express";
import { protectedEndpoint } from "../middleware/chains.middleware";
import { z } from "zod";
import {
  handleGetProfileByWallet,
} from "../endpoints";

const router = Router();

/**
 * MIGRATED: Removed CRUD routes
 * 
 * DELETED ROUTES - Use auto-CRUD instead:
 * - POST /profiles → POST /api/model/profile
 * - GET /profiles/:id → GET /api/model/profile/:id
 * - PATCH /profiles/:id → PATCH /api/model/profile/:id
 * - GET /profiles → GET /api/model/profile
 * 
 * KEPT: Business logic routes only
 */

// Special lookup by wallet address
router.get(
  "/profiles/wallet/:walletAddress", 
  ...protectedEndpoint(z.object({
    params: z.object({
      walletAddress: z.string()
    })
  })), 
  handleGetProfileByWallet
);

export default router;
