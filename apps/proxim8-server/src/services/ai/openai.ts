import OpenAI from "openai";
import fs from "fs";
import path from "path";
import axios from "axios";
import { v4 as uuidv4 } from "uuid";
import FormData from "form-data";
import sharp from "sharp";

interface ImageGenerationOptions {
  prompt: string;
  model?: string;
  size?: string;
  quality?: string;
  n?: number;
  responseFormat?: "url" | "b64_json";
  style?: string;
  referenceImageUrl?: string;
}

interface ImageGenerationResult {
  imageUrl: string;
  imageId: string;
  promptId: string;
  localPath?: string;
}

export class OpenAIService {
  private client: OpenAI;
  private apiKey: string;
  private uploadsDir: string;
  private lastGeneratedBuffer: Buffer | null = null;

  constructor(apiKey?: string) {
    const clientOptions: any = {};
    if (apiKey) {
      clientOptions.apiKey = apiKey;
    }

    this.client = new OpenAI(clientOptions);
    this.apiKey = apiKey || process.env.OPENAI_API_KEY || "";
    this.uploadsDir = path.join(process.cwd(), "uploads");

    // Ensure uploads directory exists
    if (!fs.existsSync(this.uploadsDir)) {
      console.log(`Creating uploads directory: ${this.uploadsDir}`);
      fs.mkdirSync(this.uploadsDir, { recursive: true });
    } else {
      console.log(`Uploads directory exists: ${this.uploadsDir}`);
    }

    const apiKeyStatus = apiKey
      ? `provided (length: ${apiKey.length})`
      : "not provided, using environment variable";

    console.log(`OpenAI Service initialized: 
  API Key: ${apiKeyStatus}
  Uploads Directory: ${this.uploadsDir}
  Uploads Directory Exists: ${fs.existsSync(this.uploadsDir) ? "Yes" : "No"}
  Permissions: ${this.getDirectoryPermissions(this.uploadsDir)}`);
  }

  private getDirectoryPermissions(dir: string): string {
    try {
      const stats = fs.statSync(dir);
      return `Read: ${stats.mode & fs.constants.R_OK ? "Yes" : "No"}, Write: ${stats.mode & fs.constants.W_OK ? "Yes" : "No"}, Execute: ${stats.mode & fs.constants.X_OK ? "Yes" : "No"}`;
    } catch (err: any) {
      return `Error getting permissions: ${err.message}`;
    }
  }

  async generateImage(
    options: ImageGenerationOptions
  ): Promise<ImageGenerationResult> {
    try {
      const promptId = uuidv4();

      // Log a warning if style is provided with a reference image
      if (options.referenceImageUrl && options.style) {
        console.log(
          `Warning: 'style' parameter is not supported for GPT-Image-1 with reference images. It will be ignored.`
        );

        // Create a new options object without the style parameter
        const cleanOptions = { ...options };
        delete cleanOptions.style;
        return this.generateImageWithReference(cleanOptions, promptId);
      }

      // Choose between reference-based and standard image generation
      if (options.referenceImageUrl) {
        return this.generateImageWithReference(options, promptId);
      } else {
        return this.generateStandardImage(options, promptId);
      }
    } catch (error: any) {
      // Enhanced error handling
      let errorMessage = error.message;

      // Extract and format OpenAI specific errors
      if (error.response?.data?.error) {
        const apiError = error.response.data.error;
        errorMessage = `OpenAI API Error: [${apiError.code || "unknown"}] ${apiError.message}`;

        // Add suggestions based on error type
        if (apiError.code === "content_policy_violation") {
          errorMessage +=
            ". Suggestion: The prompt may violate content policies. Please modify the prompt.";
        } else if (apiError.type === "invalid_request_error") {
          errorMessage +=
            ". Suggestion: Check the request parameters and format.";
        }
      }

      console.error(`OpenAI image generation error: ${errorMessage}`);
      console.error(`Error stack: ${error.stack}`);
      throw new Error(`Image generation failed: ${errorMessage}`);
    }
  }

  /**
   * Generate an image using GPT-Image-1 without a reference image
   */
  private async generateStandardImage(
    options: ImageGenerationOptions,
    promptId: string
  ): Promise<ImageGenerationResult> {
    const defaultSize = "1024x1024";

    console.log(
      `Generating image with GPT-Image-1 (no reference):
Prompt: ${options.prompt.substring(0, 100)}...
Size: ${options.size || defaultSize}
Prompt ID: ${promptId}`
    );

    // Log prompt length for debugging
    console.log(`Prompt length: ${options.prompt.length} characters`);

    // Validate prompt length
    if (options.prompt.length > 4000) {
      throw new Error(
        `Prompt is too long (${options.prompt.length} chars). Maximum is 4000 characters.`
      );
    }

    try {
      // Note the start time for the API call
      const startTime = Date.now();

      // Create request payload
      const requestPayload = {
        model: "gpt-image-1",
        prompt: options.prompt,
        n: options.n || 1,
        size: options.size || defaultSize,
      };

      // Make a direct HTTP request to the OpenAI API using axios
      const apiResponse = await axios.post(
        "https://api.openai.com/v1/images/generations",
        requestPayload,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${this.apiKey}`,
          },
        }
      );

      // Calculate response time
      const responseTime = Date.now() - startTime;
      console.log(`GPT-Image-1 API response time: ${responseTime}ms`);

      // Handle the response
      const responseData = apiResponse.data;

      if (
        !responseData ||
        !responseData.data ||
        responseData.data.length === 0
      ) {
        throw new Error("No images were generated in the response");
      }

      const imageUrl = responseData.data[0].url;
      if (!imageUrl) {
        throw new Error("Generated image URL is missing from response");
      }

      console.log(
        `GPT-Image-1 generated image successfully: ${imageUrl.substring(0, 50)}...`
      );

      // Download and save image locally
      console.log(
        `Downloading and saving image locally for prompt ID: ${promptId}`
      );
      const localPath = await this.saveImageLocally(imageUrl, promptId);
      console.log(`Image saved locally at: ${localPath}`);

      return {
        imageUrl,
        imageId: uuidv4(),
        promptId,
        localPath,
      };
    } catch (error: any) {
      // Enhanced error handling with detailed information
      throw this.enhanceOpenAIError(error);
    }
  }

  /**
   * Generate an image using GPT-Image-1 with a reference image
   * Uses the /images/edits endpoint with the reference image as a base64 data URL
   */
  private async generateImageWithReference(
    options: ImageGenerationOptions,
    promptId: string
  ): Promise<ImageGenerationResult> {
    if (!options.referenceImageUrl) {
      throw new Error(
        "Reference image URL is required for reference-based generation"
      );
    }

    // Validate size parameter for GPT-Image-1
    const validSizes = ["1024x1024", "1024x1536", "1536x1024", "auto"];
    const requestSize = options.size || "1024x1024";

    if (!validSizes.includes(requestSize)) {
      console.log(
        `Warning: Invalid size ${requestSize} for GPT-Image-1 with reference images. Defaulting to 1024x1024.`
      );
      options.size = "1024x1024";
    }

    console.log(
      `Generating image with GPT-Image-1 using reference image:
Prompt: ${options.prompt.substring(0, 100)}...
Reference Image: ${options.referenceImageUrl.substring(0, 50)}...
Size: ${options.size || "1024x1024"}
Prompt ID: ${promptId}`
    );

    try {
      // Download the reference image
      console.log(
        `Downloading reference image from URL: ${options.referenceImageUrl.substring(0, 50)}...`
      );
      let imageBuffer;
      try {
        imageBuffer = await this.downloadImage(options.referenceImageUrl);
        console.log(
          `Reference image downloaded, size: ${imageBuffer.length} bytes`
        );
      } catch (downloadErr: any) {
        console.error(
          `Failed to download reference image: ${downloadErr.message}`
        );
        throw new Error(
          `Reference image download failed: ${downloadErr.message}`
        );
      }

      // Convert the image to PNG with transparency as required by OpenAI's requirements
      console.log(
        "Converting image to PNG with transparency for OpenAI's requirements"
      );
      let pngBuffer;
      try {
        pngBuffer = await this.convertToPngWithTransparency(imageBuffer);
        console.log(
          `Image converted to PNG with transparency, size: ${pngBuffer.length} bytes`
        );
      } catch (conversionErr: any) {
        console.error(
          `Failed to convert image to PNG: ${conversionErr.message}`
        );
        throw new Error(`Image conversion failed: ${conversionErr.message}`);
      }

      // Create a form data object for multipart/form-data request
      const form = new FormData();

      // Add required parameters
      form.append("model", "gpt-image-1");
      form.append("prompt", options.prompt);

      // Add the image directly as a buffer - no temp file needed
      form.append("image[]", pngBuffer, {
        filename: "image.png",
        contentType: "image/png",
      });

      // Add optional parameters if provided
      form.append("size", options.size || "1024x1024");
      form.append("n", options.n?.toString() || "1");

      // Only add quality parameter if provided and it's a valid value
      if (options.quality && ["standard", "hd"].includes(options.quality)) {
        form.append("quality", options.quality);
      }

      // Note: 'style' parameter is not supported for GPT-Image-1 with /images/edits endpoint

      console.log("Sending multipart/form-data request to GPT-Image-1 API");

      // Make the API request with form data
      let apiResponse;
      try {
        apiResponse = await axios.post(
          "https://api.openai.com/v1/images/edits",
          form,
          {
            headers: {
              ...form.getHeaders(),
              Authorization: `Bearer ${this.apiKey}`,
            },
            maxBodyLength: Infinity,
            maxContentLength: Infinity,
            timeout: 300000, // 5 minute timeout
          }
        );
      } catch (apiErr: any) {
        // Detailed API error handling
        let detailedMessage = "API request failed";

        if (apiErr.response?.data?.error) {
          const apiError = apiErr.response.data.error;
          detailedMessage = `OpenAI API Error [${apiError.code || apiError.type || "unknown"}]: ${apiError.message || "No message"}`;
        } else if (apiErr.response?.status) {
          detailedMessage = `OpenAI API returned status ${apiErr.response.status}: ${apiErr.message}`;
        } else {
          detailedMessage = apiErr.message || "Unknown API error";
        }

        console.error(
          "API request error:",
          apiErr.response?.data || apiErr.message
        );
        throw new Error(`Image edit API request failed: ${detailedMessage}`);
      }

      // Log the full response for debugging
      console.log(
        "Full API response:",
        JSON.stringify(apiResponse.data, null, 2)
      );

      // Handle different response formats
      let imageUrl: string;

      if (apiResponse.data?.data?.[0]?.url) {
        // Standard format
        imageUrl = apiResponse.data.data[0].url;
        console.log(
          `Image URL found in response: ${imageUrl.substring(0, 50)}...`
        );
      } else if (apiResponse.data?.data?.[0]?.b64_json) {
        // Base64 format
        console.log("Image returned as base64");
        const base64Data = apiResponse.data.data[0].b64_json;
        const generatedBuffer = Buffer.from(base64Data, "base64");

        // Return the buffer directly for GCP upload - don't save locally
        console.log(
          `Base64 image decoded, size: ${generatedBuffer.length} bytes`
        );

        // The middleware will handle upload to GCP, so return an imaginary URL
        // that the middleware will recognize as a signal to use the buffer
        imageUrl = `data:image/png;base64,${base64Data.substring(0, 20)}...`;

        // Store the buffer in a member variable for the middleware to access
        this.lastGeneratedBuffer = generatedBuffer;
      } else if (apiResponse.data?.data) {
        console.log(
          "Response has data but in unexpected format:",
          apiResponse.data.data
        );
        throw new Error("Unexpected response format from OpenAI API");
      } else {
        console.error("API response did not contain expected data");
        throw new Error("No image data in response from OpenAI API");
      }

      if (!imageUrl) {
        throw new Error("Generated image URL is missing from response");
      }

      console.log(
        `GPT-Image-1 generated image successfully: ${imageUrl.substring(0, 50)}...`
      );

      // For data URLs, we don't need to download or save them locally
      // The middleware will handle uploading to GCP directly
      // We don't need a localPath as the file should go directly to GCP
      return {
        imageUrl,
        imageId: uuidv4(),
        promptId,
        localPath: undefined, // Let middleware handle the file
      };
    } catch (error: any) {
      // Log a sanitized version of the error without exposing the API key
      const sanitizedError = this.sanitizeError(error);
      console.error(
        `Error with GPT-Image-1 reference generation:`,
        sanitizedError
      );

      // Log the original error message and stack
      console.error(`Original error message: ${error.message}`);
      console.error(`Error stack: ${error.stack}`);

      // Use the original error message if available
      throw new Error(
        `Failed to generate image with reference: ${error.message}`
      );
    }
  }

  /**
   * Enhances OpenAI errors with more detailed information and suggestions
   */
  private enhanceOpenAIError(error: any): Error {
    let detailedMessage = error.message;

    // Handle the case of empty error messages
    if (!detailedMessage && error.status) {
      detailedMessage = `OpenAI API returned status ${error.status} with no error message`;
    }

    // Log the sanitized error object without exposing API key
    const sanitizedError = this.sanitizeError(error);
    console.error(
      "Full OpenAI error object:",
      JSON.stringify(sanitizedError, null, 2)
    );

    // Extract error details from OpenAI response
    if (error.response?.data?.error) {
      const apiError = error.response.data.error;

      // Build detailed error message with code
      detailedMessage = `OpenAI API Error [${apiError.code || apiError.type || "unknown"}]: ${apiError.message || "No error message provided"}`;

      // Add helpful suggestions based on common error types
      if (
        apiError.code === "content_policy_violation" ||
        apiError.message?.includes("content policy")
      ) {
        detailedMessage +=
          "\nSuggestion: The prompt may violate OpenAI's content policies. Try modifying the prompt to avoid potentially sensitive or prohibited content.";
      } else if (apiError.type === "invalid_request_error") {
        // Check for common parameter issues
        if (apiError.param) {
          detailedMessage += `\nInvalid parameter: ${apiError.param}`;
        }

        if (apiError.message?.includes("size")) {
          detailedMessage +=
            "\nSuggestion: Check that the size parameter is one of the supported values for GPT-Image-1.";
        } else if (apiError.message?.includes("prompt") || !apiError.message) {
          // If there's an issue with the prompt or no specific message
          detailedMessage +=
            "\nSuggestion: The prompt may be too long or contain inappropriate content. Try shortening the prompt or removing potentially sensitive content.";
        } else {
          detailedMessage +=
            "\nSuggestion: Check the request parameters and format.";
        }
      } else if (apiError.type === "server_error") {
        detailedMessage +=
          "\nSuggestion: This appears to be a temporary issue with OpenAI's service. Please try again later.";
      } else if (
        apiError.type === "requests" ||
        apiError.message?.includes("rate limit")
      ) {
        detailedMessage +=
          "\nSuggestion: You have exceeded your rate limit. Please wait and try again later, or review your API usage.";
      }
    } else if (error.status === 400 && !detailedMessage) {
      // Handle empty 400 errors specifically
      detailedMessage =
        "OpenAI API returned a 400 error with no details. This often happens when the prompt is too long, contains inappropriate content, or there's an issue with other parameters. Try shortening or simplifying your prompt.";
    }

    // Create a new error with the enhanced message
    return new Error(detailedMessage);
  }

  /**
   * Sanitizes error objects to remove sensitive information like API keys
   */
  private sanitizeError(error: any): any {
    if (!error) return error;

    // Create a deep copy of the error object to avoid modifying the original
    const sanitized = JSON.parse(
      JSON.stringify(error, (key, value) => {
        // Mask authorization headers
        if (
          key === "Authorization" &&
          typeof value === "string" &&
          value.startsWith("Bearer ")
        ) {
          const apiKey = value.substring(7);
          return `Bearer ${this.maskApiKey(apiKey)}`;
        }

        // Mask API keys in config
        if (key === "apiKey" && typeof value === "string") {
          return this.maskApiKey(value);
        }

        // Handle circular references
        if (value !== null && typeof value === "object" && key !== "") {
          try {
            JSON.stringify(value);
          } catch (e) {
            return "[Circular Reference]";
          }
        }

        return value;
      })
    );

    return sanitized;
  }

  /**
   * Masks an API key for safe logging, showing only first 4 and last 4 chars
   */
  private maskApiKey(apiKey: string): string {
    if (!apiKey || apiKey.length < 10) return "***";
    return `${apiKey.substring(0, 4)}...${apiKey.substring(apiKey.length - 4)}`;
  }

  private async downloadImage(url: string): Promise<Buffer> {
    console.log(`Downloading image from URL: ${url.substring(0, 50)}...`);
    try {
      const response = await axios.get(url, { responseType: "arraybuffer" });
      console.log(
        `Image downloaded successfully, size: ${response.data.length} bytes`
      );
      return Buffer.from(response.data);
    } catch (error: any) {
      console.error(`Error downloading image: ${error.message}`);
      throw new Error(`Failed to download image: ${error.message}`);
    }
  }

  private async saveImageLocally(
    imageUrl: string,
    promptId: string
  ): Promise<string> {
    try {
      console.log(`Saving image locally: 
  URL: ${imageUrl.substring(0, 50)}... 
  Prompt ID: ${promptId}
  Uploads Directory: ${this.uploadsDir}`);

      // Verify directory existence again just to be sure
      if (!fs.existsSync(this.uploadsDir)) {
        console.log(`Creating uploads directory again: ${this.uploadsDir}`);
        fs.mkdirSync(this.uploadsDir, { recursive: true });
      }

      const response = await axios.get(imageUrl, {
        responseType: "arraybuffer",
      });

      console.log(`Image downloaded, size: ${response.data.length} bytes`);

      const buffer = Buffer.from(response.data, "binary");

      const filename = `${promptId}.png`;
      const filePath = path.join(this.uploadsDir, filename);

      console.log(`Writing image to: ${filePath}`);

      await fs.promises.writeFile(filePath, buffer);

      // Verify file was created
      if (fs.existsSync(filePath)) {
        const stats = fs.statSync(filePath);
        console.log(
          `File successfully written: ${filePath}, size: ${stats.size} bytes`
        );
      } else {
        console.error(`File was not created at: ${filePath}`);
      }

      return filePath;
    } catch (error: any) {
      console.error(`Error saving image locally: ${error.message}`);
      console.error(`Error stack: ${error.stack}`);
      throw new Error(`Failed to save image locally: ${error.message}`);
    }
  }

  /**
   * Validates an image buffer to ensure it can be processed
   */
  private validateImage(imageBuffer: Buffer): boolean {
    console.log("Validating image...");

    if (!imageBuffer || imageBuffer.length === 0) {
      console.error("Image buffer is empty");
      throw new Error("Downloaded image is empty");
    }

    // Check for minimum size (1KB)
    if (imageBuffer.length < 1024) {
      console.error(`Image is too small (${imageBuffer.length} bytes)`);
      throw new Error("Image is too small or corrupted");
    }

    // Check for magic bytes to confirm it's an image
    // JPEG starts with FF D8
    // PNG starts with 89 50 4E 47
    // GIF starts with 47 49 46 38
    const isJpeg = imageBuffer[0] === 0xff && imageBuffer[1] === 0xd8;
    const isPng =
      imageBuffer[0] === 0x89 &&
      imageBuffer[1] === 0x50 &&
      imageBuffer[2] === 0x4e &&
      imageBuffer[3] === 0x47;
    const isGif =
      imageBuffer[0] === 0x47 &&
      imageBuffer[1] === 0x49 &&
      imageBuffer[2] === 0x46 &&
      imageBuffer[3] === 0x38;

    if (!isJpeg && !isPng && !isGif) {
      console.error("Image format not recognized");
      throw new Error("Image format not recognized or unsupported");
    }

    console.log(
      `Image validation successful (${isJpeg ? "JPEG" : isPng ? "PNG" : "GIF"} format, ${(imageBuffer.length / 1024).toFixed(2)} KB)`
    );
    return true;
  }

  /**
   * Converts an image to PNG with transparency, which is required by OpenAI's /images/edits endpoint
   */
  private async convertToPngWithTransparency(
    imageBuffer: Buffer
  ): Promise<Buffer> {
    console.log("Converting image to PNG with transparency...");

    try {
      // Validate the image first
      this.validateImage(imageBuffer);

      // Get image metadata to preserve dimensions
      const metadata = await sharp(imageBuffer).metadata();
      console.log(
        `Image loaded successfully, dimensions: ${metadata.width}x${metadata.height}`
      );

      // Check if dimensions are valid
      if (
        !metadata.width ||
        !metadata.height ||
        metadata.width < 10 ||
        metadata.height < 10
      ) {
        throw new Error(
          `Image dimensions too small (${metadata.width}x${metadata.height}). Minimum 10x10 pixels required.`
        );
      }

      if (metadata.width > 4096 || metadata.height > 4096) {
        console.warn(
          `Image is very large (${metadata.width}x${metadata.height}). This may cause performance issues.`
        );
      }

      // Convert to PNG with transparency
      const pngBuffer = await sharp(imageBuffer)
        .toFormat("png")
        .ensureAlpha() // Ensures transparency channel
        .toBuffer();

      // Store the buffer for later use
      this.lastGeneratedBuffer = pngBuffer;

      console.log(
        `Converted to PNG, size: ${(pngBuffer.length / 1024).toFixed(2)} KB`
      );

      return pngBuffer;
    } catch (error) {
      // Enhanced error details
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      console.error("Error converting image to PNG:", errorMessage);
      if (error instanceof Error && error.stack) {
        console.error("Conversion error stack:", error.stack);
      }

      throw new Error(`Failed to convert image to PNG: ${errorMessage}`);
    }
  }
}
