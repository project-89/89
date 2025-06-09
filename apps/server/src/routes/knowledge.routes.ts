import { Router } from "express";

import {
  handleCompressKnowledge,
  handleDecompressKnowledge,
  handleShareKnowledge,
  handleTransferKnowledge,
} from "../endpoints/knowledge.endpoint";

import {
  CompressKnowledgeRequestSchema,
  DecompressKnowledgeRequestSchema,
  ShareKnowledgeRequestSchema,
  TransferKnowledgeRequestSchema,
} from "../schemas/knowledge.schema";

import { protectedEndpoint, agentEndpoint } from "../middleware";

const router = Router();

/**
 * MIGRATED: Removed CRUD routes
 * 
 * DELETED ROUTES - Use auto-CRUD instead:
 * - POST /knowledge → POST /api/model/knowledge
 * - GET /knowledge/:knowledgeId → GET /api/model/knowledge/:id
 * - PATCH /knowledge/:knowledgeId → PATCH /api/model/knowledge/:id
 * - GET /knowledge → GET /api/model/knowledge
 * 
 * KEPT: Business logic routes only
 */

/**
 * Knowledge compression/decompression endpoints
 * - AI-powered compression/decompression
 * - Available to all authenticated users
 */
router.post(
  "/knowledge/compress",
  agentEndpoint(CompressKnowledgeRequestSchema),
  handleCompressKnowledge,
);

router.post(
  "/knowledge/decompress",
  protectedEndpoint(DecompressKnowledgeRequestSchema),
  handleDecompressKnowledge,
);

/**
 * Knowledge sharing endpoints
 * - Complex permission logic
 * - Respects agent ranks and permissions
 */
router.post(
  "/knowledge/:knowledgeId/share",
  agentEndpoint(ShareKnowledgeRequestSchema),
  handleShareKnowledge,
);

/**
 * Knowledge transfer endpoints
 * - Complex transfer logic between agents
 * - Handles copy vs move semantics
 */
router.post(
  "/knowledge/:knowledgeId/transfer",
  agentEndpoint(TransferKnowledgeRequestSchema),
  handleTransferKnowledge,
);

export default router;