import { Request, Response } from "express";
import { ApiError, sendError, sendSuccess } from "../utils";
import {
  CompressKnowledgeRequest,
  DecompressKnowledgeRequest,
  ShareKnowledgeRequest,
  TransferKnowledgeRequest,
} from "../schemas/knowledge.schema";
import {
  compressKnowledge,
  decompressKnowledge,
  shareKnowledge,
  transferKnowledge,
} from "../services/knowledge.service";
import { ERROR_MESSAGES } from "../constants";

/**
 * MIGRATED: Removed pure CRUD handlers
 * 
 * DELETED:
 * - handleCreateKnowledge → Use POST /api/model/knowledge
 * - handleGetKnowledge → Use GET /api/model/knowledge/:id
 * - handleUpdateKnowledge → Use PATCH /api/model/knowledge/:id
 * - handleListKnowledge → Use GET /api/model/knowledge
 * 
 * KEPT: Business logic handlers only
 */

const LOG_PREFIX = "[Knowledge Endpoint]";

// Define a type assertion helper function to access auth properties safely
function getUserId(req: Request): string | undefined {
  return (
    (req as unknown as { auth?: { agent?: { id: string }; account?: { id: string } } }).auth?.agent
      ?.id ||
    (req as unknown as { auth?: { agent?: { id: string }; account?: { id: string } } }).auth
      ?.account?.id
  );
}

/**
 * Compress knowledge using AI - complex business logic
 */
export async function handleCompressKnowledge(
  req: Request<{}, {}, CompressKnowledgeRequest["body"]>,
  res: Response,
) {
  try {
    console.log(`${LOG_PREFIX} Starting knowledge compression:`, { body: req.body });
    const { content, domain } = req.body;
    const userId = getUserId(req);

    if (!userId) {
      throw new ApiError(401, ERROR_MESSAGES.AUTHENTICATION_REQUIRED);
    }

    const result = await compressKnowledge(content, domain, userId);
    console.log(`${LOG_PREFIX} Compression successful:`, { originalSize: content.length });
    sendSuccess(res, result, "Knowledge compressed successfully");
  } catch (error) {
    console.error(`${LOG_PREFIX} Compression error:`, error);
    const apiError = ApiError.from(error, 500, ERROR_MESSAGES.FAILED_TO_COMPRESS_KNOWLEDGE);
    sendError(res, apiError);
  }
}

/**
 * Decompress knowledge using AI - complex business logic
 */
export async function handleDecompressKnowledge(
  req: Request<{}, {}, DecompressKnowledgeRequest["body"]>,
  res: Response,
) {
  try {
    console.log(`${LOG_PREFIX} Starting knowledge decompression:`, { body: req.body });
    const { content, domain } = req.body;
    const userId = getUserId(req);

    if (!userId) {
      throw new ApiError(401, ERROR_MESSAGES.AUTHENTICATION_REQUIRED);
    }

    const result = await decompressKnowledge(content, domain, userId);
    console.log(`${LOG_PREFIX} Decompression successful`);
    sendSuccess(res, result, "Knowledge decompressed successfully");
  } catch (error) {
    console.error(`${LOG_PREFIX} Decompression error:`, error);
    const apiError = ApiError.from(error, 500, ERROR_MESSAGES.FAILED_TO_DECOMPRESS_KNOWLEDGE);
    sendError(res, apiError);
  }
}

/**
 * Share knowledge with access control - complex business logic
 */
export async function handleShareKnowledge(
  req: Request<{ knowledgeId: string }, {}, ShareKnowledgeRequest["body"]>,
  res: Response,
) {
  try {
    console.log(`${LOG_PREFIX} Starting knowledge share:`, {
      params: req.params,
      body: req.body,
    });

    const { knowledgeId } = req.params;
    const { targetAgentId, accessLevel, expiresAt } = req.body;
    const requesterId = getUserId(req);

    if (!requesterId) {
      throw new ApiError(401, ERROR_MESSAGES.AUTHENTICATION_REQUIRED);
    }

    const share = await shareKnowledge(
      knowledgeId,
      targetAgentId,
      accessLevel,
      requesterId,
      expiresAt ? new Date(expiresAt) : undefined,
    );

    console.log(`${LOG_PREFIX} Knowledge shared successfully:`, { shareId: share.id });
    sendSuccess(res, share, "Knowledge shared successfully");
  } catch (error) {
    console.error(`${LOG_PREFIX} Share error:`, error);
    const apiError = ApiError.from(error, 500, ERROR_MESSAGES.FAILED_TO_SHARE_KNOWLEDGE);
    sendError(res, apiError);
  }
}

/**
 * Transfer knowledge between agents - complex business logic
 */
export async function handleTransferKnowledge(
  req: Request<{ knowledgeId: string }, {}, TransferKnowledgeRequest["body"]>,
  res: Response,
) {
  try {
    console.log(`${LOG_PREFIX} Starting knowledge transfer:`, {
      params: req.params,
      body: req.body,
    });

    const { knowledgeId } = req.params;
    const { targetAgentId, transferMethod } = req.body;
    const sourceAgentId = getUserId(req);

    if (!sourceAgentId) {
      throw new ApiError(401, ERROR_MESSAGES.AUTHENTICATION_REQUIRED);
    }

    const transfer = await transferKnowledge(
      knowledgeId,
      sourceAgentId,
      targetAgentId,
      transferMethod,
      sourceAgentId, // requesterId is the source agent
    );

    console.log(`${LOG_PREFIX} Knowledge transfer initiated:`, { transferId: transfer.id });
    sendSuccess(res, transfer, "Knowledge transfer initiated successfully");
  } catch (error) {
    console.error(`${LOG_PREFIX} Transfer error:`, error);
    const apiError = ApiError.from(error, 500, ERROR_MESSAGES.FAILED_TO_TRANSFER_KNOWLEDGE);
    sendError(res, apiError);
  }
}