/**
 * Enhanced API client with Zod runtime validation
 * This ensures the server response actually matches our types
 */

import { z } from 'zod';
import * as apiClient from './apiClient';

/**
 * Make a validated GET request
 */
export async function getValidated<T>(
  endpoint: string,
  schema: z.ZodType<T>,
  options?: RequestInit
): Promise<T> {
  const response = await apiClient.get<unknown>(endpoint, options);
  
  // Validate the response at runtime
  const result = schema.safeParse(response);
  
  if (!result.success) {
    console.error(`API response validation failed for ${endpoint}:`, result.error);
    throw new Error(`Invalid API response: ${result.error.message}`);
  }
  
  return result.data;
}

/**
 * Make a validated POST request
 */
export async function postValidated<TInput, TOutput>(
  endpoint: string,
  data: TInput,
  inputSchema: z.ZodType<TInput>,
  outputSchema: z.ZodType<TOutput>,
  options?: RequestInit
): Promise<TOutput> {
  // Validate input before sending
  const validatedInput = inputSchema.parse(data);
  
  const response = await apiClient.post<unknown>(endpoint, validatedInput, options);
  
  // Validate the response
  const result = outputSchema.safeParse(response);
  
  if (!result.success) {
    console.error(`API response validation failed for ${endpoint}:`, result.error);
    throw new Error(`Invalid API response: ${result.error.message}`);
  }
  
  return result.data;
}

// Re-export other methods
export { put, del } from './apiClient';

/**
 * Usage example:
 * 
 * import { getValidated } from '@/utils/apiClient.validated';
 * import { MissionsApiResponseSchema } from '@proxim8/shared';
 * 
 * // This will validate the response at runtime!
 * const missions = await getValidated(
 *   '/api/training/missions',
 *   MissionsApiResponseSchema
 * );
 */