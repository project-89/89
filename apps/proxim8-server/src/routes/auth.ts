import { Router } from "express";
import * as authController from "../controllers/authController";
import { jwtAuth } from "../middleware/jwtAuth";

const router = Router();

// Public routes
router.post("/login", authController.login);

// Protected routes
router.get("/me", jwtAuth, authController.getMe);
router.post("/refresh", jwtAuth, authController.refreshToken);
router.post("/logout", jwtAuth, authController.logout);
router.get("/validate", jwtAuth, authController.validateToken);

export const authRoutes: Router = router;
