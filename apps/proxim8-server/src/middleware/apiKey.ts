import { Request, Response, NextFunction } from "express";

// Get the API key from environment variables
const API_KEY = process.env.API_KEY || "proxim8-dev-key";

/**
 * Middleware to verify the API key in the request headers
 * This ensures that only the approved client applications can access the API
 */
export const verifyApiKey = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const apiKey = req.header("X-API-Key");

  if (!apiKey) {
    res.status(401).json({ message: "Unauthorized - API key is required" });
    return;
  }

  if (apiKey !== API_KEY) {
    res.status(401).json({ message: "Unauthorized - Invalid API key" });
    return;
  }

  next();
};

export default verifyApiKey;
