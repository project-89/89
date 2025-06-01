import express from "express";
import { jwtAuth } from "../middleware/jwtAuth";
import * as notificationController from "../controllers/notificationController";

const router: express.Router = express.Router();

// Protected routes (JWT authentication required)
router.get("/", jwtAuth, notificationController.getNotifications);
router.get("/unread-count", jwtAuth, notificationController.getUnreadCount);
router.post("/mark-read", jwtAuth, notificationController.markAsRead);
router.post("/mark-all-read", jwtAuth, notificationController.markAllAsRead);

export default router;
