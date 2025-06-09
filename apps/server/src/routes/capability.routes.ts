import { Router } from "express";
import { publicEndpoint } from "../middleware";
import { handleFindSimilarSkills } from "../endpoints";
import { z } from "zod";

const router = Router();

/**
 * MIGRATED: Removed CRUD routes
 * 
 * DELETED ROUTES - Use auto-CRUD instead:
 * - POST /capabilities → POST /api/model/capability
 * - GET /capabilities → GET /api/model/capability
 * - PATCH /capabilities/:id → PATCH /api/model/capability/:id
 * - DELETE /capabilities/:id → DELETE /api/model/capability/:id
 * 
 * KEPT: Business logic routes only
 */

/**
 * Find similar skills - AI/ML powered skill matching
 * Public endpoint for skill discovery
 */
router.get(
  "/capabilities/similar", 
  ...publicEndpoint(z.object({
    query: z.object({
      name: z.string(),
      description: z.string().optional()
    })
  })), 
  handleFindSimilarSkills
);

export default router;