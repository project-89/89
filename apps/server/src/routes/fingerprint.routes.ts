import { Router } from "express";

const router = Router();

/**
 * MIGRATED: Removed CRUD routes
 * 
 * DELETED ROUTES - Use auto-CRUD instead:
 * - POST /fingerprints → POST /api/model/fingerprint
 * - GET /fingerprints/:id → GET /api/model/fingerprint/:id
 * - PATCH /fingerprints/:id → PATCH /api/model/fingerprint/:id
 * 
 * ALL routes were CRUD - this file can be deleted
 */

export default router;
