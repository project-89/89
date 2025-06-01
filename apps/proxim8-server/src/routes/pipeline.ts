import express from "express";
import * as pipelineController from "../controllers/pipelineController";
import { jwtAuth } from "../middleware/jwtAuth";

const router: express.Router = express.Router();

// Public routes
router.get("/middleware", pipelineController.getAvailableMiddleware);

// Protected routes (JWT authentication required)
router.get("/configurations", jwtAuth, pipelineController.getPipelineConfigs);
router.get(
  "/configurations/:id",
  jwtAuth,
  pipelineController.getPipelineConfigById
);
router.post(
  "/configurations",
  jwtAuth,
  pipelineController.createPipelineConfig
);
router.put(
  "/configurations/:id",
  jwtAuth,
  pipelineController.updatePipelineConfig
);
router.delete(
  "/configurations/:id",
  jwtAuth,
  pipelineController.deletePipelineConfig
);

export default router;
