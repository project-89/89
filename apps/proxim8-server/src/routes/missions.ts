import express, { Router } from "express";
import { jwtAuth } from "../middleware/jwtAuth";
import {
  getMissions,
  getMissionDetails,
  deployMission,
  getMissionStatus,
  getTimelineOverview,
} from "../controllers/missionController";

const router = express.Router() as Router;

// All mission routes require authentication
router.use(jwtAuth);

// GET /api/missions - Get all missions (training + timeline) with user progress
// Query params: ?type=training|timeline|all
router.get("/", getMissions);

// GET /api/missions/timeline - Get timeline overview for mission selection
router.get("/timeline", getTimelineOverview);

// GET /api/missions/:missionId - Get specific mission details
// Query params: ?type=training|timeline|critical|event
router.get("/:missionId", getMissionDetails);

// POST /api/missions/:missionId/deploy - Deploy a mission
// Body: { proxim8Id, approach, missionType?, timelineNode? }
router.post("/:missionId/deploy", deployMission);

// GET /api/missions/deployments/:deploymentId/status - Get mission deployment status
router.get("/deployments/:deploymentId/status", getMissionStatus);

export default router;
