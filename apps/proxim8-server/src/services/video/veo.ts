import { GenerateVideosParameters, GoogleGenAI } from "@google/genai";
import axios from "axios";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import * as storageService from "../../services/storage";
import dotenv from "dotenv";

// Load environment variables if not already loaded
if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
  try {
    dotenv.config({ path: path.resolve(process.cwd(), "server", ".env") });
  } catch (error) {
    console.error("Error loading .env file:", error);
  }
}

interface VideoGenerationOptions {
  prompt: string;
  imageUrl?: string;
  resolution?: "720p" | "1080p";
  aspectRatio?: "16:9" | "9:16" | "1:1";
  style?: string;
  duration?: number;
  fps?: number;
  callbackUrl?: string;
  walletAddress?: string;
}

interface VideoGenerationResult {
  jobId: string;
  status: "queued" | "processing" | "completed" | "failed";
  videoUrl?: string;
  gcsPath?: string;
  error?: string;
  operationName?: string;
  thumbnailUrl?: string;
}

// Interface for the response from the Video Generation API
interface Operation {
  name: string;
  done?: boolean;
  response?: {
    "@type"?: string;
    generateVideoResponse?: {
      generatedSamples?: Array<{
        video?: {
          uri?: string;
        };
      }>;
    };
  };
  metadata?: {
    state?: string;
    videoGenerations?: Array<{
      videoUrls?: string[];
    }>;
    error?: {
      message?: string;
    };
  };
}

export class VeoService {
  private genAI: GoogleGenAI;
  private apiKey: string;

  constructor(apiKey: string) {
    // Use provided API key or fall back to env variable
    const finalApiKey =
      apiKey || process.env.GOOGLE_GENERATIVE_AI_API_KEY || "";
    if (!finalApiKey) {
      throw new Error(
        "No API key provided and GOOGLE_GENERATIVE_AI_API_KEY environment variable not found"
      );
    }

    // Explicitly ignore any default credentials and only use API key
    process.env.GOOGLE_APPLICATION_CREDENTIALS = "";

    // Initialize with beta API version explicitly
    this.genAI = new GoogleGenAI({
      apiKey: finalApiKey,
      apiVersion: "v1beta", // Explicitly use beta endpoints
    });
    this.apiKey = finalApiKey;

    console.log(
      `[Veo Service] Initializing Veo service with API key: ${finalApiKey.substring(0, 8)}...${finalApiKey.substring(finalApiKey.length - 4)}`
    );

    // Check API key validity
    this.checkApiKey().catch((error) => {
      console.error(`[Veo Service] API key validation error: ${error}`);
    });
  }

  /**
   * Check the API key's validity by making a simple API call
   */
  private async checkApiKey(): Promise<void> {
    try {
      // Make a simple API call to check key validity
      console.log(`[Veo Service] Verifying API key validity...`);
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1/models`,
        {
          headers: {
            "x-goog-api-key": this.apiKey,
          },
        }
      );

      console.log(
        `[Veo Service] API key validation response status: ${response.status}`
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[Veo Service] API key validation error: ${errorText}`);

        // Try to extract the project ID from the error message
        const projectIdMatch = errorText.match(/project ([0-9]+)/);
        if (projectIdMatch && projectIdMatch[1]) {
          console.error(
            `[Veo Service] API key is for project ID: ${projectIdMatch[1]}`
          );
        }

        throw new Error(`Invalid API key: ${errorText}`);
      } else {
        console.log(`[Veo Service] API key validation successful`);
      }
    } catch (error) {
      console.error(`[Veo Service] API key validation error:`, error);
      throw error;
    }
  }

  async generateVideo(
    options: VideoGenerationOptions
  ): Promise<VideoGenerationResult> {
    try {
      const jobId = uuidv4();
      console.log(`[Veo Service] Starting video generation with Veo SDK:
  Job ID: ${jobId}
  Prompt: ${options.prompt}
  Image URL: ${options.imageUrl || "not provided"}
  Aspect Ratio: ${options.aspectRatio || "16:9"}
  Wallet Address: ${options.walletAddress || "not provided"}`);

      // Prepare the generation payload
      const generationPayload: GenerateVideosParameters = {
        model: "veo-2.0-generate-001",
        prompt: options.prompt,
        config: {
          aspectRatio: options.aspectRatio || "16:9",
          numberOfVideos: 1,
          personGeneration: "allow_adult", // Default to allow_adult as per SDK examples
        },
      };

      // Add image if provided
      if (options.imageUrl) {
        try {
          console.log(
            `[Veo Service] Fetching image data from URL: ${options.imageUrl}`
          );
          const imageData = await this.fetchImageData(options.imageUrl);

          // Add image to the payload
          generationPayload.image = {
            imageBytes: imageData,
            mimeType: "image/jpeg", // Assuming JPEG format - adjust as needed
          };

          console.log(
            `[Veo Service] Added image data to generation payload (${imageData.length} bytes)`
          );
        } catch (imageError) {
          console.error(
            `[Veo Service] Failed to fetch or process image: ${imageError instanceof Error ? imageError.message : String(imageError)}`
          );
          console.log(
            `[Veo Service] Proceeding with text-only video generation`
          );
          // Continue with text-only generation if image processing fails
        }
      }

      let operationFromSDK;
      try {
        // Use the SDK properly like in route.ts
        operationFromSDK =
          await this.genAI.models.generateVideos(generationPayload);

        if (!operationFromSDK || !operationFromSDK.name) {
          console.error(
            "[Veo Service] Failed to obtain a valid operation name from SDK response.",
            operationFromSDK
          );
          throw new Error(
            "SDK did not return a valid operation name for video generation."
          );
        }

        console.log(
          `[Veo Service] Veo video generation initiated. Operation Name: ${operationFromSDK.name}`
        );
      } catch (sdkError: any) {
        console.error(
          "[Veo Service] Veo SDK call to Google AI failed:",
          sdkError
        );
        let errorMessage = "Veo SDK error";
        if (sdkError instanceof Error) {
          errorMessage = sdkError.message;
        }
        if (sdkError.error && sdkError.error.message) {
          errorMessage = sdkError.error.message;
        } else if (sdkError.details) {
          errorMessage += ` Details: ${JSON.stringify(sdkError.details)}`;
        }
        if (sdkError.code) {
          errorMessage += ` Code: ${sdkError.code}`;
        }
        throw new Error(errorMessage);
      }

      // Return the result with the operation name
      return {
        jobId,
        status: "processing",
        operationName: operationFromSDK.name,
      };
    } catch (error) {
      console.error("[Veo Service] Error generating video:", error);
      return {
        jobId: uuidv4(),
        status: "failed",
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      };
    }
  }

  private async fetchImageData(imageUrl: string): Promise<string> {
    try {
      const response = await axios.get(imageUrl, {
        responseType: "arraybuffer",
      });
      return Buffer.from(response.data).toString("base64");
    } catch (error) {
      console.error("Error fetching image data:", error);
      throw new Error(
        `Failed to fetch image data: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  async checkVideoStatus(
    operationName: string,
    walletAddress?: string
  ): Promise<VideoGenerationResult> {
    try {
      if (!operationName) {
        throw new Error("Operation name is required to check video status");
      }

      console.log(
        `[Veo Service] Checking status of video operation: ${operationName}`
      );

      // Using direct API call for checking operation status
      try {
        console.log(
          `[Veo Service] Making API request to check status: https://generativelanguage.googleapis.com/v1/${operationName}`
        );
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1/${operationName}`,
          {
            headers: {
              "x-goog-api-key": this.apiKey,
            },
          }
        );

        console.log(`[Veo Service] API response status: ${response.status}`);

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`[Veo Service] Error response body: ${errorText}`);
          throw new Error(
            `Operation status check error: ${response.status} ${response.statusText} - ${errorText}`
          );
        }

        const operation = (await response.json()) as Operation;

        console.log(
          `[Veo Service] Operation status: ${operation.metadata?.state || "unknown"}, Full response: ${JSON.stringify(operation, null, 2)}`
        );

        // Return appropriate status based on operation state
        if (
          operation.metadata?.state === "SUCCEEDED" ||
          operation.done === true
        ) {
          // When operation is complete, extract the video URL(s)
          let videoUrl: string | undefined;

          // Check modern response format (done=true)
          if (
            operation.done &&
            operation.response?.generateVideoResponse?.generatedSamples
          ) {
            const videoSamples =
              operation.response.generateVideoResponse.generatedSamples;
            if (videoSamples.length > 0 && videoSamples[0].video?.uri) {
              videoUrl = videoSamples[0].video.uri;
            }
          }

          // Fallback to legacy format
          if (!videoUrl && operation.metadata?.videoGenerations) {
            const videoResults =
              operation.metadata.videoGenerations[0]?.videoUrls || [];
            if (videoResults.length > 0) {
              videoUrl = videoResults[0];
            }
          }

          if (!videoUrl) {
            return {
              jobId: operationName,
              status: "failed",
              error: "No video URL found in completed operation",
            };
          }

          console.log(
            `[Veo Service] Video generation completed. URL: ${videoUrl}`
          );

          // Download and store the video in GCP
          let gcsPath: string | undefined;
          let signedUrl: string | undefined;

          try {
            if (walletAddress) {
              // Instead of download to temp first, we'll download directly to buffer and upload to GCP
              try {
                console.log(
                  `[Veo Service] Downloading video from URL: ${videoUrl}`
                );

                const response = await axios({
                  method: "get",
                  url: videoUrl,
                  responseType: "arraybuffer",
                  headers: {
                    // Add API key as header for Google AI URLs
                    ...(videoUrl.includes("generativelanguage.googleapis.com")
                      ? { "x-goog-api-key": this.apiKey }
                      : {}),
                  },
                });

                const contentType =
                  response.headers["content-type"] || "video/mp4";
                const extension = contentType.includes("webm")
                  ? "webm"
                  : contentType.includes("mov")
                    ? "mov"
                    : "mp4";

                // Create a safe filename for GCP
                const safeJobId = operationName.replace(/\//g, "_");
                const gcpFilename = `${safeJobId}.${extension}`;

                console.log(
                  `[Veo Service] Video downloaded to buffer, size: ${response.data.length} bytes`
                );

                // Convert the response data to a Buffer
                const videoBuffer = Buffer.from(response.data);

                // Upload the buffer directly to GCP
                gcsPath = await storageService.uploadVideo(
                  videoBuffer,
                  walletAddress,
                  operationName,
                  gcpFilename
                );

                // Get signed URL
                signedUrl = await storageService.getSignedUrl(gcsPath, 60 * 24); // 24 hours expiry

                console.log(
                  `[Veo Service] Video uploaded to GCP at: ${gcsPath} with signed URL: ${signedUrl}`
                );
              } catch (downloadError) {
                console.error(
                  `[Veo Service] Error downloading or uploading video: ${downloadError instanceof Error ? downloadError.message : String(downloadError)}`
                );

                // Fall back to using the direct URL
                signedUrl = videoUrl;
              }
            } else {
              console.warn(
                `[Veo Service] No wallet address provided, skipping GCP upload. Using direct video URL.`
              );
              signedUrl = videoUrl;
            }
          } catch (uploadError) {
            console.error(
              `[Veo Service] Failed to upload video to GCP: ${uploadError instanceof Error ? uploadError.message : String(uploadError)}`
            );
            // Continue with the direct URL if GCP upload fails
            signedUrl = videoUrl;
          }

          return {
            jobId: operationName,
            status: "completed",
            videoUrl: signedUrl,
            gcsPath,
            operationName,
          };
        } else if (operation.metadata?.state === "FAILED") {
          return {
            jobId: operationName,
            status: "failed",
            error:
              operation.metadata?.error?.message || "Video generation failed",
            operationName,
          };
        } else {
          // Still in progress
          return {
            jobId: operationName,
            status: "processing",
            operationName,
          };
        }
      } catch (error) {
        console.error(`[Veo Service] Error checking operation status:`, error);
        throw error;
      }
    } catch (error) {
      console.error(
        `[Veo Service] Error checking video status: ${error instanceof Error ? error.message : String(error)}`
      );
      return {
        jobId: operationName || uuidv4(),
        status: "failed",
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
        operationName,
      };
    }
  }
}
