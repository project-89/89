import express, { Router } from "express";
import { jwtAuth } from "../middleware/jwtAuth";
import {
  getTrainingMissions,
  getMissionDetails,
  deployMission,
  getMissionStatus,
} from "../controllers/trainingController";

const router: Router = express.Router();

// All training routes require authentication
router.use(jwtAuth);

// GET /api/training/missions - Get all training missions with user progress
router.get("/missions", getTrainingMissions);

// GET /api/training/missions/:missionId - Get specific mission details
router.get("/missions/:missionId", getMissionDetails);

// POST /api/training/missions/:missionId/deploy - Deploy a training mission
router.post("/missions/:missionId/deploy", deployMission);

// GET /api/training/deployments/:deploymentId/status - Get mission deployment status
router.get("/deployments/:deploymentId/status", getMissionStatus);

export default router;
