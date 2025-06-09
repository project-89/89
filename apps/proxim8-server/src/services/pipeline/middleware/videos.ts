import { Middleware, PipelineContext } from "../core";
import { VeoService } from "../../video/veo";
import { handleMiddlewareError, updateVideoGenerationRecord } from "../utils";
import dotenv from "dotenv";

dotenv.config();

// Initialize Veo service
const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY || "";
console.log(
  `[Video Middleware] Initializing Veo service with API key: ${apiKey.substring(0, 8)}...`
);
const veoService = new VeoService(apiKey);

/**
 * Middleware for generating videos using Google's Veo
 */
export const videoGenerationMiddleware: Middleware = {
  name: "Video Generation",
  execute: async (context: PipelineContext): Promise<PipelineContext> => {
    try {
      // Extract the prompt and image URL from context
      const prompt = context.get("enhancedPrompt") || context.get("userPrompt");
      const imageUrl = context.get("imageUrl");
      const walletAddress = context.get("walletAddress");

      console.log(`[Video Middleware] Starting with context: 
        - Prompt: ${prompt ? prompt.substring(0, 50) + "..." : "none"}
        - Image URL: ${imageUrl ? "provided" : "none"}
        - Wallet Address: ${walletAddress || "none"}`);

      // Validate that we have what we need - be strict here
      if (!prompt) {
        throw new Error("No prompt available for video generation");
      }

      if (!imageUrl) {
        throw new Error("No image URL available for video generation");
      }

      // Validate the image URL by checking if it's a valid URL
      try {
        new URL(imageUrl);
      } catch (urlError: any) {
        throw new Error(`Invalid image URL provided: ${urlError.message}`);
      }

      // Optional parameters
      const resolution = context.get("videoResolution") || "1080p";
      const aspectRatio = context.get("videoAspectRatio") || "16:9";
      const style = context.get("videoStyle") || "cinematic";
      const duration = context.get("videoDuration") || 10;
      const fps = context.get("videoFps") || 24;

      console.log(`[Video Middleware] Generating video with settings:
        - Resolution: ${resolution}
        - Aspect Ratio: ${aspectRatio}
        - Style: ${style}
        - Duration: ${duration}s
        - FPS: ${fps}`);

      // Generate video
      const videoResult = await veoService
        .generateVideo({
          prompt,
          imageUrl,
          resolution,
          aspectRatio,
          style,
          duration,
          fps,
          walletAddress,
        })
        .catch((error) => {
          console.error("[Video Middleware] Video generation error:", error);
          throw error;
        });

      console.log(
        "[Video Middleware] Video generation result:",
        JSON.stringify(videoResult, null, 2)
      );

      // Store results in context
      context.set("videoJobId", videoResult.jobId);
      context.set("videoStatus", videoResult.status);
      context.set("videoOperationName", videoResult.operationName);

      console.log(
        `[Video Middleware] Set in context: videoJobId=${videoResult.jobId}, videoStatus=${videoResult.status}, videoOperationName=${videoResult.operationName}`
      );

      if (videoResult.videoUrl) {
        context.set("videoUrl", videoResult.videoUrl);
        console.log(`[Video Middleware] Set videoUrl in context`);
      }

      if (videoResult.gcsPath) {
        context.set("videoGcsPath", videoResult.gcsPath);
        console.log(
          `[Video Middleware] Set videoGcsPath in context: ${videoResult.gcsPath}`
        );
      }

      if (videoResult.error) {
        context.setMetadata("videoGenerationError", videoResult.error);
        console.error(
          `[Video Middleware] Error from Veo service: ${videoResult.error}`
        );
      }

      // Add metadata
      context.setMetadata(
        "videoGenerationComplete",
        videoResult.status === "completed"
      );
      context.setMetadata("videoGenerationTime", new Date());

      console.log(
        `[Video Middleware] Completed. Video generation complete: ${videoResult.status === "completed"}`
      );

      // Add status polling mechanism if video is in processing state
      if (videoResult.status === "processing" && videoResult.operationName) {
        console.log(
          `[Video Middleware] Video is in processing state, will poll for status updates`
        );

        // Set up a status polling mechanism with exponential backoff
        const checkVideoStatus = async (
          operationName: string,
          maxRetries = 5,
          initialDelay = 10000
        ) => {
          let retries = 0;
          let delay = initialDelay;

          while (retries < maxRetries) {
            console.log(
              `[Video Middleware] Polling attempt ${retries + 1}/${maxRetries} for operation ${operationName}, waiting ${delay / 1000}s`
            );
            try {
              await new Promise((resolve) => setTimeout(resolve, delay));

              // Check status
              const statusResult = await veoService.checkVideoStatus(
                operationName,
                context.get("walletAddress")
              );

              console.log(
                `[Video Middleware] Status check result: ${JSON.stringify(statusResult, null, 2)}`
              );

              if (
                statusResult.status === "completed" ||
                statusResult.status === "failed"
              ) {
                console.log(
                  `[Video Middleware] Video generation ${statusResult.status}!`
                );

                // Update context with latest status
                context.set("videoStatus", statusResult.status);
                context.setMetadata(
                  "videoGenerationComplete",
                  statusResult.status === "completed"
                );

                if (statusResult.videoUrl) {
                  context.set("videoUrl", statusResult.videoUrl);
                }

                if (statusResult.gcsPath) {
                  context.set("videoGcsPath", statusResult.gcsPath);
                }

                if (statusResult.error) {
                  context.setMetadata(
                    "videoGenerationError",
                    statusResult.error
                  );
                }

                // Update the database directly since we're in a background process
                // and the main pipeline execution may have already completed
                const jobId = context.get("jobId");
                if (jobId) {
                  const updates: any = {
                    status: statusResult.status,
                    updatedAt: new Date(),
                  };

                  if (statusResult.videoUrl) {
                    updates.videoUrl = statusResult.videoUrl;
                  }

                  if (statusResult.gcsPath) {
                    updates.videoPath = statusResult.gcsPath;
                  }

                  if (statusResult.error) {
                    updates.error = statusResult.error;
                  }

                  // Use the standardized database update utility
                  await updateVideoGenerationRecord(jobId, updates);
                }

                break;
              }

              // Exponential backoff
              delay *= 2;
              retries++;
            } catch (error) {
              console.error(
                `[Video Middleware] Error polling for status: ${error}`
              );
              retries++;
              delay *= 2;
            }
          }

          if (retries >= maxRetries) {
            console.log(
              `[Video Middleware] Max retries reached for status polling. Continuing pipeline.`
            );
          }
        };

        // Don't await this - let it run in background and update the DB directly
        // This allows the pipeline to continue without waiting for video completion
        checkVideoStatus(videoResult.operationName).catch((error) => {
          console.error(`[Video Middleware] Error in status polling: ${error}`);
        });
      }

      return context;
    } catch (error) {
      // Use standardized error handling
      context = handleMiddlewareError(context, error, "Video");

      // Clear any cached video data to prevent using stale/invalid data
      console.log(
        `[Video Middleware] Clearing any cached video data due to error`
      );
      context.set("videoUrl", undefined);
      context.set("videoPath", undefined);
      context.set("videoJobId", undefined);
      context.set("videoStatus", "failed");
      context.set("videoOperationName", undefined);
      context.set("videoGcsPath", undefined);

      return context;
    }
  },
};
