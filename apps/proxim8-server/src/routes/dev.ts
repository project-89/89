import { Router } from "express";
import { jwtAuth } from "../middleware/jwtAuth";
import {
  forceCompleteMission,
  clearMission,
} from "../controllers/devController";

const router: Router = Router();

// Only allow dev endpoints in development mode
const devOnlyMiddleware = (req: any, res: any, next: any) => {
  if (process.env.NODE_ENV === "production") {
    return res.status(403).json({
      success: false,
      error: "Dev endpoints are not available in production",
    });
  }
  next();
};

// Apply auth and dev-only middleware to all routes
router.use(jwtAuth);
router.use(devOnlyMiddleware);

// Force complete a mission and reveal all phases
router.post("/missions/:deploymentId/force-complete", forceCompleteMission);

// Clear/reset a mission to allow retrying
router.delete("/missions/:missionId/clear", clearMission);

export default router;
