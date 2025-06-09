import { RequestHandler } from "express";
import { ZodSchema } from "zod";
import {
  verifyFingerprintExists,
  validateRequest,
  validateAuthToken,
  withMetrics,
  verifyAgent,
  requireRole,
} from ".";
import { ACCOUNT_ROLE } from "../constants";

/**
 * Middleware chain factory functions for different endpoint types
 */

// For endpoints that need no authentication (public write operations)
export const publicEndpoint = (schema?: ZodSchema) => {
  const chain: RequestHandler[] = [];
  if (schema) chain.push(withMetrics(validateRequest(schema), "schemaValidation"));
  return chain;
};

// For endpoints that only need fingerprint existence check (public write operations)
export const fingerprintWriteEndpoint = (schema?: ZodSchema) => {
  const chain: RequestHandler[] = [withMetrics(verifyFingerprintExists, "fingerprintVerification")];
  if (schema) chain.push(withMetrics(validateRequest(schema), "schemaValidation"));
  return chain;
};

// DEPRECATED: Use authenticatedEndpoint instead - ZenStack handles authorization
// For endpoints that need auth + ownership verification (protected operations)
export const protectedEndpoint = (schema?: ZodSchema) => {
  // Now just delegates to authenticatedEndpoint since ZenStack handles authorization
  return authenticatedEndpoint(schema);
};

// For endpoints that need authentication but ZenStack handles authorization
export const authenticatedEndpoint = (schema?: ZodSchema) => {
  const chain: RequestHandler[] = [
    withMetrics(validateAuthToken, "authValidation"),
    // No ownership verification - ZenStack handles it
  ];
  if (schema) chain.push(withMetrics(validateRequest(schema), "schemaValidation"));
  return chain;
};

// For agent-only endpoints
export const agentEndpoint = (schema?: ZodSchema) => {
  const chain: RequestHandler[] = [withMetrics(verifyAgent, "agentVerification")];
  if (schema) chain.push(withMetrics(validateRequest(schema), "schemaValidation"));
  return chain;
};

// For special access endpoints (requires agent_creator role)
export const specialAccessEndpoint = (schema?: ZodSchema) => {
  const chain: RequestHandler[] = [
    withMetrics(validateAuthToken, "authValidation"),
    // No ownership verification - ZenStack handles it
    withMetrics(requireRole(ACCOUNT_ROLE.agent_creator), "roleVerification"),
  ];
  if (schema) chain.push(withMetrics(validateRequest(schema), "schemaValidation"));
  return chain;
};

export const adminEndpoint = (schema?: ZodSchema) => {
  const chain: RequestHandler[] = [
    withMetrics(requireRole(ACCOUNT_ROLE.admin), "roleVerification"),
  ];
  if (schema) chain.push(withMetrics(validateRequest(schema), "schemaValidation"));
  return chain;
};
