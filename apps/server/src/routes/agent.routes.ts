import { Router } from "express";

import {
  handleRegisterAgent,
  handleUpdateAgentState,
  handleGetAgentsByCapability,
} from "../endpoints";

import {
  RegisterAgentRequestSchema,
  UpdateAgentStateRequestSchema,
  GetAgentsByCapabilityRequestSchema,
} from "../schemas";

import { agentEndpoint, specialAccessEndpoint } from "../middleware";

const router = Router();

/**
 * MIGRATED: Removed CRUD routes
 * 
 * DELETED ROUTES - Use auto-CRUD instead:
 * - GET /agents/:agentId → GET /api/model/agent/:id
 * - GET /agents → GET /api/model/agent
 * - PATCH /agents/:agentId → PATCH /api/model/agent/:id
 * 
 * KEPT: Business logic routes only
 */

/**
 * Phase 1: Admin-only agent registration
 * Phase 2: Will allow verified users to register agents
 * Phase 3: Will allow open registration with verification
 */
router.post(
  "/agents/register",
  specialAccessEndpoint(RegisterAgentRequestSchema),
  handleRegisterAgent,
);

/**
 * Agent state management - complex business logic
 * Only the agent itself can update its state
 */
router.patch(
  "/agents/:agentId/state",
  agentEndpoint(UpdateAgentStateRequestSchema),
  handleUpdateAgentState,
);

/**
 * Complex capability-based search
 */
router.get(
  "/agents/by-capability/:capability",
  agentEndpoint(GetAgentsByCapabilityRequestSchema),
  handleGetAgentsByCapability,
);

export default router;