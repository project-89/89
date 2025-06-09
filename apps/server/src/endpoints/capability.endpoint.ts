import { Request, Response } from "express";
import { skillMatchingService } from "../services";
import { sendError, sendSuccess, ApiError } from "../utils";
import { ERROR_MESSAGES } from "../constants";

/**
 * MIGRATED: Removed pure CRUD handlers
 * 
 * DELETED:
 * - handleCreateCapability → Use POST /api/model/capability
 * - handleGetCapabilities → Use GET /api/model/capability
 * - handleUpdateCapability → Use PATCH /api/model/capability/:id
 * - handleDeleteCapability → Use DELETE /api/model/capability/:id
 * 
 * KEPT: Business logic handlers only
 */

/**
 * Find similar skills based on name and description
 * This uses AI/ML service for skill matching - complex business logic
 */
export const handleFindSimilarSkills = async (req: Request, res: Response): Promise<Response> => {
  try {
    console.log("[Find Similar Skills] Starting with query:", req.query);

    const { name, description } = req.query;
    const searchText = `${name}${description ? ` - ${description}` : ""}`;

    const analysis = await skillMatchingService.analyzeSkill({ description: searchText });

    console.log("[Find Similar Skills] Analysis complete:", {
      matches: analysis.matches.length,
    });

    return sendSuccess(res, {
      matches: analysis.matches,
      suggestedType: analysis.suggestedType,
      suggestedCategory: analysis.suggestedCategory,
    });
  } catch (error) {
    console.error("[Find Similar Skills] Error:", {
      error,
      stack: error instanceof Error ? error.stack : undefined,
      query: req.query,
    });
    return sendError(res, ApiError.from(error, 500, ERROR_MESSAGES.FAILED_TO_FIND_SIMILAR_SKILLS));
  }
};