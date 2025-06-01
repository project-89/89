import express from "express";
import * as userController from "../controllers/userController";
import { jwtAuth } from "../middleware/jwtAuth";

const router: express.Router = express.Router();

// Public routes
router.get("/profile/:address", userController.getUserProfile);

// Protected routes (JWT authentication required)
router.get("/me", jwtAuth, userController.getCurrentUser);
router.put("/profile", jwtAuth, userController.updateUserProfile);
router.get("/preferences", jwtAuth, userController.getUserPreferences);
router.put("/preferences", jwtAuth, userController.updateUserPreferences);

export default router;
