import { Middleware, PipelineContext } from "../core";
import { OpenAIService } from "../../ai/openai";
import { uploadPreviewImage, getSignedUrl } from "../../storage";
import { handleMiddlewareError } from "../utils";
import dotenv from "dotenv";
import fs from "fs";
import axios from "axios";

dotenv.config();

// Initialize OpenAI service
console.log(
  `Initializing OpenAI service with API key: ${process.env.OPENAI_API_KEY ? "provided" : "missing"}`
);
const openaiService = new OpenAIService(process.env.OPENAI_API_KEY || "");

/**
 * Middleware for generating images using OpenAI DALL-E
 */
export const imageGenerationMiddleware: Middleware = {
  name: "Image Generation",
  execute: async (context: PipelineContext): Promise<PipelineContext> => {
    try {
      // Extract the prompt from context
      const prompt = context.get("enhancedPrompt") || context.get("userPrompt");
      const walletAddress = context.get("walletAddress");
      const jobId = context.get("jobId");
      const nftImageUrl = context.get("nftImageUrl");

      console.log(`[Image Middleware] Starting image generation:
  Job ID: ${jobId}
  Wallet Address: ${walletAddress}
  Prompt: ${prompt ? prompt.substring(0, 30) + "..." : "undefined"}
  NFT Image URL: ${nftImageUrl ? nftImageUrl.substring(0, 30) + "..." : "undefined"}`);

      if (!prompt) {
        throw new Error("No prompt available for image generation");
      }

      if (!walletAddress) {
        throw new Error("Wallet address is required for image generation");
      }

      if (!jobId) {
        throw new Error("Job ID is required for image generation");
      }

      // Optional parameters
      const referenceImageUrl = context.get("nftImageUrl");
      const size = context.get("imageSize") || "1792x1024";
      const style = context.get("imageStyle") || "vivid";

      console.log(`[Image Middleware] Optional parameters:
  Reference Image: ${referenceImageUrl ? "provided" : "not provided"}
  Size: ${size}
  Style: ${style}`);

      // Generate image
      console.log(
        `[Image Middleware] Calling OpenAI service to generate image...`
      );

      // Create image generation options
      const imageOptions: any = {
        prompt,
      };

      let imageResult;

      if (referenceImageUrl) {
        console.log(`[Image Middleware] Generating image with reference...`);

        // Configure with reference image
        const referenceOptions = { ...imageOptions, referenceImageUrl };

        // For GPT-Image-1 with reference images, only specific sizes are supported
        // Map any unsupported size to the closest supported one
        if (size === "1792x1024") {
          console.log(
            `[Image Middleware] Adjusting size from ${size} to 1536x1024 for GPT-Image-1 compatibility`
          );
          referenceOptions.size = "1536x1024";
        } else if (
          ["1024x1024", "1024x1536", "1536x1024", "auto"].includes(size)
        ) {
          referenceOptions.size = size;
        } else {
          console.log(
            `[Image Middleware] Unsupported size ${size}, defaulting to 1024x1024 for GPT-Image-1`
          );
          referenceOptions.size = "1024x1024";
        }

        // Note: 'style' parameter is not supported for GPT-Image-1 with reference images
        console.log(
          `[Image Middleware] Using reference image - style parameter will be ignored`
        );

        // Generate image with reference - no fallback if it fails
        console.log(`[Image Middleware] Generating image with reference...`);

        imageResult = await openaiService.generateImage(referenceOptions);

        console.log(
          `[Image Middleware] Successfully generated image with reference`
        );
      } else {
        // For standard image generation, we can use any size and style
        imageOptions.size = size;
        imageOptions.style = style;

        imageResult = await openaiService.generateImage(imageOptions);
      }

      console.log(`[Image Middleware] Image generation result:
  Image URL: ${imageResult.imageUrl ? imageResult.imageUrl.substring(0, 30) + "..." : "undefined"}
  Image ID: ${imageResult.imageId}
  Local Path: ${imageResult.localPath ? imageResult.localPath : "Not saved locally"}`);

      // Store results in context
      context.set("imageId", imageResult.imageId);

      // Check if we have a data URL which indicates we should use the buffer from OpenAI service
      const isDataUrl = imageResult.imageUrl.startsWith(
        "data:image/png;base64"
      );

      if (isDataUrl) {
        console.log(
          `[Image Middleware] Image returned as base64, accessing buffer directly from OpenAI service`
        );
        // Access the buffer directly from the OpenAI service
        const imageBuffer = (openaiService as any).lastGeneratedBuffer;

        if (!imageBuffer) {
          throw new Error("Image buffer not found in OpenAI service");
        }

        console.log(
          `[Image Middleware] Retrieved buffer from OpenAI service, size: ${imageBuffer.length} bytes`
        );

        // Upload the buffer directly to GCP
        try {
          console.log(`[Image Middleware] Uploading buffer directly to GCP for job: ${jobId}
  Buffer Size: ${imageBuffer.length} bytes
  Wallet Address: ${walletAddress}`);

          // Create a temp file name just for the GCP path - we don't actually save this file
          const gcpFilename = `${imageResult.imageId}.png`;

          // Upload the buffer directly to GCP
          const gcpImagePath = await uploadPreviewImage(
            imageBuffer, // Pass buffer instead of file path
            walletAddress,
            jobId,
            gcpFilename
          );

          // Set the GCP path in the context
          context.set("imagePath", gcpImagePath);
          console.log(
            `[Image Middleware] Image successfully uploaded to GCP at path: ${gcpImagePath}`
          );

          // Generate a signed URL for the image and store it in context
          try {
            const imageUrl = await getSignedUrl(gcpImagePath, 60); // 60 minutes expiry
            context.set("imageUrl", imageUrl);
            context.set("localImageUrl", imageUrl); // Set both for compatibility
            console.log(
              `[Image Middleware] Generated signed URL for image: ${imageUrl.substring(0, 30)}...`
            );
          } catch (urlError: any) {
            console.error(
              `[Image Middleware] Error generating signed URL: ${urlError.message}`
            );
            context.setMetadata(
              "imageUrlError",
              urlError instanceof Error ? urlError.message : String(urlError)
            );
          }

          // Also use the same image as thumbnail to ensure we have a valid thumbnail
          context.set("thumbnailPath", gcpImagePath);
          console.log(
            `[Image Middleware] Using same image for thumbnail at path: ${gcpImagePath}`
          );

          // Clear the buffer reference in the OpenAI service
          (openaiService as any).lastGeneratedBuffer = null;
        } catch (uploadError: any) {
          console.error(`[Image Middleware] Error uploading buffer to GCP:
  Error: ${uploadError.message}
  Stack: ${uploadError.stack}`);

          context.setMetadata(
            "imageUploadError",
            uploadError instanceof Error
              ? uploadError.message
              : String(uploadError)
          );

          // Even though upload failed, we'll continue with the pipeline
          console.log(
            `[Image Middleware] Continuing pipeline despite upload failure`
          );
        }
      } else if (imageResult.imageUrl) {
        // We have a URL but no local file - upload the URL directly
        context.set("localImageUrl", imageResult.imageUrl);

        try {
          console.log(`[Image Middleware] Uploading image from URL to GCP for job: ${jobId}
  URL: ${imageResult.imageUrl.substring(0, 30)}...
  Wallet Address: ${walletAddress}`);

          // Download the image first since our uploadPreviewImage might require a file path
          const response = await axios.get(imageResult.imageUrl, {
            responseType: "arraybuffer",
          });
          const imageBuffer = Buffer.from(response.data, "binary");
          console.log(
            `[Image Middleware] Downloaded image from URL, size: ${imageBuffer.length} bytes`
          );

          // Create a temp file name just for the GCP path
          const gcpFilename = `${imageResult.imageId}.png`;

          // Upload the buffer directly to GCP
          const gcpImagePath = await uploadPreviewImage(
            imageBuffer,
            walletAddress,
            jobId,
            gcpFilename
          );

          // Set the GCP path in the context
          context.set("imagePath", gcpImagePath);
          console.log(
            `[Image Middleware] Image successfully uploaded to GCP at path: ${gcpImagePath}`
          );

          // Generate a signed URL for the image and store it in context
          try {
            const imageUrl = await getSignedUrl(gcpImagePath, 60); // 60 minutes expiry
            context.set("imageUrl", imageUrl);
            console.log(
              `[Image Middleware] Generated signed URL for image: ${imageUrl.substring(0, 30)}...`
            );
          } catch (urlError: any) {
            console.error(
              `[Image Middleware] Error generating signed URL: ${urlError.message}`
            );
            context.setMetadata(
              "imageUrlError",
              urlError instanceof Error ? urlError.message : String(urlError)
            );
          }

          // Also use the same image as thumbnail
          context.set("thumbnailPath", gcpImagePath);
          console.log(
            `[Image Middleware] Using same image for thumbnail at path: ${gcpImagePath}`
          );
        } catch (uploadError: any) {
          console.error(`[Image Middleware] Error uploading image URL to GCP:
  Error: ${uploadError.message}
  Stack: ${uploadError.stack}`);

          context.setMetadata(
            "imageUploadError",
            uploadError instanceof Error
              ? uploadError.message
              : String(uploadError)
          );

          // Continue with the pipeline
          console.log(
            `[Image Middleware] Continuing pipeline despite URL upload failure`
          );
        }
      } else if (imageResult.localPath) {
        // Legacy support for local paths
        context.set("imageLocalPath", imageResult.localPath);
        context.set("localImageUrl", imageResult.imageUrl);

        // Upload the local file to GCP (existing code)
        try {
          console.log(`[Image Middleware] Uploading local file to GCP for job: ${jobId}
  Local Path: ${imageResult.localPath}
  Wallet Address: ${walletAddress}`);

          // Upload the image to GCP
          const gcpImagePath = await uploadPreviewImage(
            imageResult.localPath,
            walletAddress,
            jobId
          );

          // Set the GCP path in the context
          context.set("imagePath", gcpImagePath);
          console.log(
            `[Image Middleware] Image successfully uploaded to GCP at path: ${gcpImagePath}`
          );

          // Generate a signed URL for the image and store it in context
          try {
            const imageUrl = await getSignedUrl(gcpImagePath, 60); // 60 minutes expiry
            context.set("imageUrl", imageUrl);
            console.log(
              `[Image Middleware] Generated signed URL for image: ${imageUrl.substring(0, 30)}...`
            );
          } catch (urlError: any) {
            console.error(
              `[Image Middleware] Error generating signed URL: ${urlError.message}`
            );
            context.setMetadata(
              "imageUrlError",
              urlError instanceof Error ? urlError.message : String(urlError)
            );
          }

          // Also use the same image as thumbnail to ensure we have a valid thumbnail
          context.set("thumbnailPath", gcpImagePath);
          console.log(
            `[Image Middleware] Using same image for thumbnail at path: ${gcpImagePath}`
          );

          // Try to clean up the local file after successful upload
          try {
            await fs.promises.unlink(imageResult.localPath);
            console.log(
              `[Image Middleware] Cleaned up local file: ${imageResult.localPath}`
            );
          } catch (cleanupError: any) {
            console.warn(
              `[Image Middleware] Failed to clean up local file: ${cleanupError.message}`
            );
          }
        } catch (uploadError: any) {
          console.error(`[Image Middleware] Error uploading image to GCP:
  Error: ${uploadError.message}
  Stack: ${uploadError.stack}`);

          context.setMetadata(
            "imageUploadError",
            uploadError instanceof Error
              ? uploadError.message
              : String(uploadError)
          );

          // Even though upload failed, we'll continue with the pipeline
          console.log(
            `[Image Middleware] Continuing pipeline despite upload failure`
          );
        }
      } else {
        console.error(
          `[Image Middleware] No local path available for GCP upload`
        );
        context.setMetadata(
          "imageUploadError",
          "No local path available for upload"
        );
      }

      // Add metadata
      context.setMetadata("imageGenerationComplete", true);
      context.setMetadata("imageGenerationTime", new Date().toISOString());

      console.log(`[Image Middleware] Image generation middleware completed`);
      return context;
    } catch (error) {
      // Use standardized error handling
      context = handleMiddlewareError(context, error, "Image");

      // Clear any cached image data to prevent using stale/invalid data
      console.log(
        `[Image Middleware] Clearing any cached image data due to error`
      );
      context.set("imageUrl", undefined);
      context.set("imagePath", undefined);
      context.set("thumbnailPath", undefined);
      context.set("localImageUrl", undefined);
      context.set("imageId", undefined);
      context.set("imageLocalPath", undefined);

      return context;
    }
  },
};
