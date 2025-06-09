import { Router } from "express";

const router = Router();

/**
 * MIGRATED: Removed CRUD routes
 * 
 * DELETED ROUTES - Use auto-CRUD instead:
 * - POST /impressions → POST /api/model/impression
 * - GET /impressions → GET /api/model/impression
 * - DELETE /impressions/:id → DELETE /api/model/impression/:id
 * 
 * ALL routes were CRUD - this file can be deleted
 */

export default router;
