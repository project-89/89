import { Router } from "express";
import { getEnhancedPrisma } from "../lib/zenstack";
import { protectedEndpoint, fingerprintWriteEndpoint } from "../middleware/chains.middleware";
import { z } from "zod";
import {
  // Only keep business logic handlers
  handleRegisterAgent,
  handleUpdateAgentState,
  handleGetAgentsByCapability,
} from "../endpoints/agent.endpoint";

const router = Router();

/**
 * MIGRATED VERSION - Direct replacement, no v2 needed
 * 
 * DELETED CRUD ROUTES:
 * - GET /agents → Use GET /api/model/agent
 * - GET /agents/:id → Use GET /api/model/agent/:id  
 * - PATCH /agents/:id → Use PATCH /api/model/agent/:id
 * 
 * KEPT BUSINESS LOGIC ROUTES:
 * - POST /agents/register (complex registration flow)
 * - PATCH /agents/:id/state (state machine logic)
 * - GET /agents/by-capability (complex search)
 */

// Business logic endpoints - keep these
router.post(
  "/agents/register",
  ...protectedEndpoint(
    z.object({
      body: z.object({
        inviteCode: z.string(),
        profile: z.object({
          name: z.string(),
          bio: z.string().optional(),
          avatarUrl: z.string().url().optional(),
        }),
      }),
    })
  ),
  handleRegisterAgent // This has complex invite validation logic
);

router.patch(
  "/agents/:id/state",
  ...protectedEndpoint(
    z.object({
      params: z.object({ id: z.string() }),
      body: z.object({
        state: z.enum(["active", "inactive", "suspended"]),
        reason: z.string().optional(),
      }),
    })
  ),
  handleUpdateAgentState // This has state transition logic
);

router.get(
  "/agents/by-capability",
  ...fingerprintWriteEndpoint(
    z.object({
      query: z.object({
        capability: z.string(),
        limit: z.string().transform(Number).optional(),
      }),
    })
  ),
  handleGetAgentsByCapability // This has complex matching logic
);

export default router;