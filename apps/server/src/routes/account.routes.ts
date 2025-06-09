import { Router } from "express";
import { protectedEndpoint } from "../middleware";
import { z } from "zod";
import { handleGetAccountByWallet } from "../endpoints";

const router = Router();

/**
 * MIGRATED: Removed CRUD routes
 * 
 * DELETED ROUTES - Use auto-CRUD instead:
 * - POST /accounts → POST /api/model/account
 * - GET /accounts/:id → GET /api/model/account/:id
 * - PATCH /accounts/:id → PATCH /api/model/account/:id
 * 
 * KEPT: Business logic routes only
 */

// Special lookup by wallet address
router.get(
  "/accounts/wallet/:walletAddress",
  ...protectedEndpoint(z.object({
    params: z.object({
      walletAddress: z.string()
    })
  })),
  handleGetAccountByWallet
);

export default router;
