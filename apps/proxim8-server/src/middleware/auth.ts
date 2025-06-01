import { Request } from "express";

// import axios from "axios";
import * as dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Type declaration for Express Request
export interface RequestWithUser extends Request {
  user?: {
    walletAddress: string;
    isAdmin: boolean;
  };
}

// Get Helius API key from environment
const HELIUS_API_KEY = process.env.HELIUS_API_KEY || undefined;

if (!HELIUS_API_KEY) {
  throw new Error("HELIUS_API_KEY is not set");
}
