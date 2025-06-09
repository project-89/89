import { Router } from "express";
import { publicEndpoint } from "../middleware/chains.middleware";
import { getCurrentPriceSchema, getPriceHistorySchema } from "../schemas";
import { handleGetCurrentPrices, handleGetPriceHistory } from "../endpoints";

const router = Router();

// All price endpoints are public
router.get("/prices/current", ...publicEndpoint(getCurrentPriceSchema), handleGetCurrentPrices);
router.get("/prices/history/:tokenId", ...publicEndpoint(getPriceHistorySchema), handleGetPriceHistory);

export default router;
