import { Storage } from "@google-cloud/storage";
import * as path from "path";
import * as fs from "fs";
import config from "../config";

// Initialize storage with appropriate authentication method
const storageConfig: any = {
  projectId: config.gcp.projectId,
};

// Only use keyFilename if a key file is explicitly provided and exists
if (config.gcp.keyFilePath && fs.existsSync(config.gcp.keyFilePath)) {
  storageConfig.keyFilename = config.gcp.keyFilePath;
  console.log(
    `🔑 Using GCP service account key file: ${config.gcp.keyFilePath}`
  );
} else {
  console.log(
    `🔐 Using Application Default Credentials (ADC) for GCP authentication`
  );
  if (config.gcp.keyFilePath) {
    console.log(
      `⚠️  Key file specified but not found: ${config.gcp.keyFilePath}`
    );
  }
}

console.log(`🚀 Initializing GCP Storage:
  Project ID: ${config.gcp.projectId}
  Bucket Name: ${config.gcp.bucketName}
  Authentication: ${config.gcp.keyFilePath && fs.existsSync(config.gcp.keyFilePath) ? "Service Account Key" : "Application Default Credentials (ADC)"}`);

const storage = new Storage(storageConfig);

const bucket = storage.bucket(config.gcp.bucketName);

// Verify bucket existence on startup
bucket
  .exists()
  .then(([exists]) => {
    if (exists) {
      console.log(
        `✅ GCP bucket '${config.gcp.bucketName}' exists and is accessible`
      );
    } else {
      console.error(
        `❌ GCP bucket '${config.gcp.bucketName}' does not exist or is not accessible!`
      );
    }
  })
  .catch((err) => {
    console.error(`❌ Failed to verify GCP bucket existence: ${err.message}`);
    console.log(
      `💡 If this is a local environment, ensure you've run: gcloud auth application-default login`
    );
    console.log(
      `💡 If this is production, ensure the service account has proper permissions`
    );
  });

/**
 * Upload a file to GCP Cloud Storage
 * @param filePathOrBuffer Local path to the file or a Buffer containing the file data
 * @param destination Destination path in the bucket
 * @param makePublic Whether to make the file publicly accessible (default: false)
 * @returns The path of the file in the bucket
 */
export const uploadFile = async (
  filePathOrBuffer: string | Buffer,
  destination: string,
  makePublic = false
): Promise<string> => {
  try {
    if (typeof filePathOrBuffer === "string") {
      // It's a file path
      // Check if file exists before upload
      if (!fs.existsSync(filePathOrBuffer)) {
        throw new Error(`File does not exist at path: ${filePathOrBuffer}`);
      }

      // Check if file is readable
      try {
        const testRead = fs.readFileSync(filePathOrBuffer, {
          flag: "r",
        }).length;
        console.log(`File is readable, size: ${testRead} bytes`);
      } catch (readError: any) {
        console.error(`File read test failed: ${readError.message}`);
        throw new Error(
          `File exists but is not readable: ${readError.message}`
        );
      }

      await bucket.upload(filePathOrBuffer, {
        destination,
        metadata: {
          cacheControl: "public, max-age=31536000",
        },
        // Make private by default
        public: makePublic,
      });
    } else {
      // It's a buffer
      console.log(
        `Uploading buffer directly to GCP, size: ${filePathOrBuffer.length} bytes`
      );

      const file = bucket.file(destination);

      // Create a write stream
      const stream = file.createWriteStream({
        metadata: {
          contentType: destination.endsWith(".png")
            ? "image/png"
            : destination.endsWith(".jpg") || destination.endsWith(".jpeg")
              ? "image/jpeg"
              : "application/octet-stream",
          cacheControl: "public, max-age=31536000",
        },
        public: makePublic,
      });

      // Handle stream events
      await new Promise<void>((resolve, reject) => {
        stream.on("error", (err) => {
          console.error(`Error in GCP upload stream: ${err.message}`);
          reject(err);
        });

        stream.on("finish", () => {
          console.log(`Stream upload to GCP successful: ${destination}`);
          resolve();
        });

        // Write the buffer to the stream
        stream.end(filePathOrBuffer);
      });
    }

    console.log(`Upload to GCP successful: ${destination}`);
    const file = bucket.file(destination);

    if (makePublic) {
      await file.makePublic();
      console.log(`File made public: ${destination}`);
    }

    return destination;
  } catch (error: any) {
    console.error(`Error uploading file to GCP: ${error.message}`);
    console.error(`Error stack: ${error.stack}`);

    // Try to get more details about the error
    if (error.code) {
      console.error(`Error code: ${error.code}`);
    }

    if (error.errors && Array.isArray(error.errors)) {
      error.errors.forEach((err: any, idx: number) => {
        console.error(`GCP Error ${idx + 1}:`, err);
      });
    }

    throw new Error(`Failed to upload file to GCP: ${error.message}`);
  }
};

/**
 * Upload a video file to GCP Cloud Storage using the new folder structure
 * @param filePathOrBuffer Local path to the video file or a Buffer containing the video data
 * @param walletAddress Owner's wallet address
 * @param videoId Unique ID for the video
 * @param filename Optional filename when uploading a buffer
 * @returns Path of the uploaded video in the bucket
 */
export const uploadVideo = async (
  filePathOrBuffer: string | Buffer,
  walletAddress: string,
  videoId: string,
  filename?: string
): Promise<string> => {
  console.log(`Uploading video:
  Source: ${typeof filePathOrBuffer === "string" ? filePathOrBuffer : "Buffer, size: " + filePathOrBuffer.length + " bytes"}
  Wallet: ${walletAddress}
  Video ID: ${videoId}
  Filename: ${filename || "not provided"}`);

  // Validate parameters
  if (!filePathOrBuffer || !walletAddress || !videoId) {
    const error = `Invalid parameters for uploadVideo: filePathOrBuffer=${typeof filePathOrBuffer === "string" ? filePathOrBuffer : "Buffer"}, walletAddress=${walletAddress}, videoId=${videoId}`;
    console.error(error);
    throw new Error(error);
  }

  let destination: string;

  if (typeof filePathOrBuffer === "string") {
    // It's a file path
    const extension = path.extname(filePathOrBuffer);
    destination = `users/${walletAddress}/videos/${videoId}${extension}`;

    console.log(`Calculated destination path from file: ${destination}`);
    try {
      const result = await uploadFile(filePathOrBuffer, destination);
      console.log(`Video uploaded successfully to: ${result}`);
      return result;
    } catch (error: any) {
      console.error(`Video upload failed: ${error.message}`);
      throw error;
    }
  } else {
    // It's a buffer
    if (!filename) {
      // Generate a default filename if none provided
      filename = `${videoId}.mp4`;
    }

    const extension = path.extname(filename);
    destination = `users/${walletAddress}/videos/${videoId}${extension}`;

    console.log(`Calculated destination path for buffer: ${destination}`);

    try {
      // Upload the buffer directly
      const result = await uploadFile(filePathOrBuffer, destination);
      console.log(`Video from buffer uploaded successfully to: ${result}`);
      return result;
    } catch (error: any) {
      console.error(`Video upload from buffer failed: ${error.message}`);
      throw error;
    }
  }
};

/**
 * Upload a preview image to GCP Cloud Storage using the new folder structure
 * @param filePathOrBuffer Local path to the image file or a Buffer containing the image data
 * @param walletAddress Owner's wallet address
 * @param videoId Unique ID for the video
 * @param filename Optional filename when uploading a buffer
 * @returns Path of the uploaded image in the bucket
 */
export const uploadPreviewImage = async (
  filePathOrBuffer: string | Buffer,
  walletAddress: string,
  videoId: string,
  filename?: string
): Promise<string> => {
  console.log(`Uploading preview image:
  Source: ${typeof filePathOrBuffer === "string" ? filePathOrBuffer : "Buffer, size: " + filePathOrBuffer.length + " bytes"}
  Wallet: ${walletAddress}
  Video ID: ${videoId}
  Filename: ${filename || "not provided"}`);

  // Validate parameters
  if (!filePathOrBuffer || !walletAddress || !videoId) {
    const error = `Invalid parameters for uploadPreviewImage: filePathOrBuffer=${typeof filePathOrBuffer === "string" ? filePathOrBuffer : "Buffer"}, walletAddress=${walletAddress}, videoId=${videoId}`;
    console.error(error);
    throw new Error(error);
  }

  let destination: string;

  if (typeof filePathOrBuffer === "string") {
    // It's a file path
    const extension = path.extname(filePathOrBuffer);
    destination = `users/${walletAddress}/images/${videoId}_preview${extension}`;

    console.log(`Calculated destination path from file: ${destination}`);
    try {
      const result = await uploadFile(filePathOrBuffer, destination);
      console.log(`Preview image uploaded successfully to: ${result}`);
      return result;
    } catch (error: any) {
      console.error(`Preview image upload failed: ${error.message}`);
      throw error;
    }
  } else {
    // It's a buffer
    if (!filename) {
      // Generate a default filename if none provided
      filename = `${videoId}_preview.png`;
    }

    const extension = path.extname(filename);
    destination = `users/${walletAddress}/images/${videoId}_preview${extension}`;

    console.log(`Calculated destination path for buffer: ${destination}`);

    try {
      // Upload the buffer directly
      const result = await uploadFile(filePathOrBuffer, destination);
      console.log(
        `Preview image from buffer uploaded successfully to: ${result}`
      );
      return result;
    } catch (error: any) {
      console.error(
        `Preview image upload from buffer failed: ${error.message}`
      );
      throw error;
    }
  }
};

/**
 * Upload a thumbnail image to GCP Cloud Storage using the new folder structure
 * @param filePath Local path to the thumbnail image
 * @param walletAddress Owner's wallet address
 * @param videoId Unique ID for the video
 * @returns Path of the uploaded thumbnail in the bucket
 */
export const uploadThumbnail = async (
  filePath: string,
  walletAddress: string,
  videoId: string
): Promise<string> => {
  const extension = path.extname(filePath);
  const destination = `users/${walletAddress}/images/${videoId}_thumbnail${extension}`;
  return uploadFile(filePath, destination);
};

/**
 * Create a signed URL for a file that allows temporary access
 * @param filePath Path to the file in the bucket
 * @param expiresInMinutes Minutes until the URL expires
 * @returns Signed URL with temporary access
 */
export const getSignedUrl = async (
  filePath: string,
  expiresInMinutes = 60
): Promise<string> => {
  try {
    console.log(
      `Generating signed URL for: ${filePath} (expires in ${expiresInMinutes} minutes)`
    );

    const file = bucket.file(filePath);

    // Check if file exists in bucket
    const [exists] = await file.exists();
    if (!exists) {
      console.warn(
        `Warning: File ${filePath} does not exist in bucket, but still generating signed URL`
      );
    }

    const options = {
      version: "v4" as const,
      action: "read" as const,
      expires: Date.now() + expiresInMinutes * 60 * 1000,
    };

    const [url] = await file.getSignedUrl(options);
    console.log(`Signed URL generated successfully for ${filePath}`);
    return url;
  } catch (error: any) {
    console.error(
      `Error generating signed URL for ${filePath}: ${error.message}`
    );
    throw new Error(`Failed to generate signed URL: ${error.message}`);
  }
};

/**
 * Delete a file from GCP Cloud Storage
 * @param filePath Path to the file in the bucket
 */
export const deleteFile = async (filePath: string): Promise<void> => {
  try {
    const file = bucket.file(filePath);
    await file.delete();
  } catch (error: any) {
    console.error("Error deleting file from GCP:", error);
    throw new Error(`Failed to delete file from GCP: ${error.message}`);
  }
};

/**
 * Process and upload a video with compression
 * @param inputPath Local path to the input video file
 * @param walletAddress Owner's wallet address
 * @param videoId Unique ID for the video
 * @returns Object containing paths and signed URLs for the video and thumbnail
 */
export const processAndUploadVideo = async (
  inputPath: string,
  walletAddress: string,
  videoId: string
): Promise<{
  videoPath: string;
  videoUrl: string;
  videoUrlExpiry: Date;
  thumbnailPath: string;
  thumbnailUrl: string;
  thumbnailUrlExpiry: Date;
}> => {
  // Upload the video
  const videoPath = await uploadVideo(inputPath, walletAddress, videoId);

  // Generate a signed URL with 24 hour expiry
  const videoUrl = await getSignedUrl(videoPath, 24 * 60);
  const videoUrlExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

  // In a real implementation, you would generate a thumbnail from the video
  // For now, we'll assume a thumbnail exists with a '.jpg' extension
  const thumbnailInputPath = inputPath.replace(path.extname(inputPath), ".jpg");
  let thumbnailPath: string;

  if (fs.existsSync(thumbnailInputPath)) {
    thumbnailPath = await uploadThumbnail(
      thumbnailInputPath,
      walletAddress,
      videoId
    );
  } else {
    // Create a default thumbnail path - in a real implementation, you might
    // have a default thumbnail image to use
    thumbnailPath = `users/${walletAddress}/images/${videoId}_thumbnail.jpg`;
  }

  // Generate a signed URL for the thumbnail
  const thumbnailUrl = await getSignedUrl(thumbnailPath, 24 * 60);
  const thumbnailUrlExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

  return {
    videoPath,
    videoUrl,
    videoUrlExpiry,
    thumbnailPath,
    thumbnailUrl,
    thumbnailUrlExpiry,
  };
};

/**
 * Stream a video from GCP Cloud Storage
 * @param videoId ID of the video to stream
 * @param req Express request object
 * @param res Express response object
 */
export const streamVideo = async (
  videoId: string,
  req: any,
  res: any
): Promise<void> => {
  try {
    const extension = ".mp4"; // Assuming MP4 format
    const filePath = `videos/${videoId}${extension}`;
    const file = bucket.file(filePath);

    const [exists] = await file.exists();
    if (!exists) {
      res.status(404).send("Video not found");
      return;
    }

    const [metadata] = await file.getMetadata();
    const fileSize = metadata.size;

    const range = req.headers.range;
    if (range) {
      // Handle range request for video streaming
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunkSize = end - start + 1;

      res.writeHead(206, {
        "Content-Range": `bytes ${start}-${end}/${fileSize}`,
        "Accept-Ranges": "bytes",
        "Content-Length": chunkSize,
        "Content-Type": "video/mp4",
      });

      file.createReadStream({ start, end }).pipe(res);
    } else {
      // Send the entire file
      res.writeHead(200, {
        "Content-Length": fileSize,
        "Content-Type": "video/mp4",
      });

      file.createReadStream().pipe(res);
    }
  } catch (error: any) {
    console.error("Error streaming video:", error);
    res.status(500).send("Error streaming video");
  }
};
