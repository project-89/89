import { Request, Response } from "express";
import { ApiError, sendError, sendSuccess } from "../utils";
import {
  RegisterAgentRequest,
  UpdateAgentStateRequest,
} from "../schemas";
import {
  registerAgent,
  updateAgentState,
  getAgentsByCapability,
} from "../services";
import { ERROR_MESSAGES } from "../constants";

/**
 * MIGRATED: Removed pure CRUD handlers
 * 
 * DELETED:
 * - handleGetAgent → Use GET /api/model/agent/:id
 * - handleListAgents → Use GET /api/model/agent
 * - handleUpdateAgent → Use PATCH /api/model/agent/:id
 * 
 * KEPT: Business logic handlers only
 */

export async function handleRegisterAgent(
  req: Request<{}, {}, RegisterAgentRequest["body"]>,
  res: Response,
) {
  try {
    const agent = await registerAgent(req.body);
    sendSuccess(res, agent, "Agent registered successfully");
  } catch (error) {
    const apiError = ApiError.from(error, 500, ERROR_MESSAGES.FAILED_TO_REGISTER_AGENT);
    sendError(res, apiError, apiError.statusCode);
  }
}

export async function handleUpdateAgentState(
  req: Request<UpdateAgentStateRequest["params"], {}, UpdateAgentStateRequest["body"]>,
  res: Response,
) {
  try {
    const agent = await updateAgentState(req.params.agentId, req.body);
    sendSuccess(res, agent, "Agent state updated successfully");
  } catch (error) {
    const apiError = ApiError.from(error, 500, ERROR_MESSAGES.FAILED_TO_UPDATE_AGENT_STATE);
    sendError(res, apiError, apiError.statusCode);
  }
}

export async function handleGetAgentsByCapability(
  req: Request<{ capability: string }>,
  res: Response,
) {
  try {
    const agents = await getAgentsByCapability(req.params.capability);
    sendSuccess(res, agents, "Agents retrieved successfully");
  } catch (error) {
    const apiError = ApiError.from(error, 500, ERROR_MESSAGES.FAILED_TO_GET_AGENTS_BY_CAPABILITY);
    sendError(res, apiError, apiError.statusCode);
  }
}