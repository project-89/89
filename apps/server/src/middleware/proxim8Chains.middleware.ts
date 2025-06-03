import { RequestHandler } from 'express';
import { ZodSchema } from 'zod';
import { validateRequest, withMetrics } from '.';
import {
  requireProxim8Admin,
  setLegacyUserInfo,
  validateProxim8AuthToken,
} from './proxim8Auth.middleware';

/**
 * Proxim8-specific middleware chain factory functions
 */

// For public Proxim8 endpoints (no authentication required)
export const proxim8PublicEndpoint = (schema?: ZodSchema) => {
  const chain: RequestHandler[] = [];
  if (schema)
    chain.push(withMetrics(validateRequest(schema), 'schemaValidation'));
  return chain;
};

// For authenticated Proxim8 endpoints
export const proxim8AuthenticatedEndpoint = (schema?: ZodSchema) => {
  const chain: RequestHandler[] = [
    withMetrics(validateProxim8AuthToken, 'proxim8AuthValidation'),
    withMetrics(setLegacyUserInfo, 'legacyUserInfo'),
  ];
  if (schema)
    chain.push(withMetrics(validateRequest(schema), 'schemaValidation'));
  return chain;
};

// For admin-only Proxim8 endpoints
export const proxim8AdminEndpoint = (schema?: ZodSchema) => {
  const chain: RequestHandler[] = [
    withMetrics(validateProxim8AuthToken, 'proxim8AuthValidation'),
    withMetrics(requireProxim8Admin, 'proxim8AdminVerification'),
    withMetrics(setLegacyUserInfo, 'legacyUserInfo'),
  ];
  if (schema)
    chain.push(withMetrics(validateRequest(schema), 'schemaValidation'));
  return chain;
};

// For system/internal Proxim8 endpoints (admin or system access)
export const proxim8SystemEndpoint = (schema?: ZodSchema) => {
  const chain: RequestHandler[] = [
    withMetrics(validateProxim8AuthToken, 'proxim8AuthValidation'),
    withMetrics(requireProxim8Admin, 'proxim8AdminVerification'),
  ];
  if (schema)
    chain.push(withMetrics(validateRequest(schema), 'schemaValidation'));
  return chain;
};
