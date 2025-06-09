import { PipelineContext } from "./core";
import VideoGeneration from "../../models/VideoGeneration";

/**
 * Standardized error handling for pipeline middlewares
 * This ensures all error handling follows the same pattern across middlewares
 *
 * @param context - The pipeline context object
 * @param error - The error that occurred
 * @param middlewareName - The name of the middleware (without "Middleware" suffix)
 * @param errorMetadataKey - Optional custom key for storing error in metadata
 * @returns The updated context with properly formatted error information
 */
export const handleMiddlewareError = (
  context: PipelineContext,
  error: unknown,
  middlewareName: string,
  errorMetadataKey?: string
): PipelineContext => {
  // Format error message consistently
  const errorMessage = error instanceof Error ? error.message : String(error);

  // Debug log to console with consistent format
  console.error(`[${middlewareName} Middleware] Error: ${errorMessage}`);
  if (error instanceof Error && error.stack) {
    console.error(`[${middlewareName} Middleware] Stack trace: ${error.stack}`);
  }

  // Set error in metadata with standard key format
  const metadataKey =
    errorMetadataKey || `${middlewareName.toLowerCase()}Error`;
  context.setMetadata(metadataKey, errorMessage);
  context.setMetadata(`${middlewareName.toLowerCase()}ErrorTime`, new Date());
  context.setMetadata("hasErrors", true);

  // Set error directly on context so pipeline will catch it
  context.error = `${middlewareName} failed: ${errorMessage}`;
  context.status = "error";

  return context;
};

/**
 * Update the video generation database record directly
 * Used for background processes that may complete after the main pipeline is done
 *
 * @param jobId - The unique job ID
 * @param updates - Object containing fields to update
 * @returns Promise resolving to the updated record or null if update failed
 */
export const updateVideoGenerationRecord = async (
  jobId: string,
  updates: Record<string, any>
): Promise<any> => {
  try {
    // Ensure updatedAt is always set
    if (!updates.updatedAt) {
      updates.updatedAt = new Date();
    }

    // Perform the database update
    const updated = await VideoGeneration.findOneAndUpdate({ jobId }, updates, {
      new: true,
    });

    console.log(
      `Database record updated for job ${jobId} with status: ${updates.status || "unknown"}`
    );
    return updated;
  } catch (dbError) {
    console.error(
      `Failed to update database for job ${jobId}: ${dbError instanceof Error ? dbError.message : String(dbError)}`
    );
    return null;
  }
};
