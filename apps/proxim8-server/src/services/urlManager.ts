import { getSignedUrl } from "./storage";
import VideoGeneration, { IVideoGeneration } from "../models/VideoGeneration";

/**
 * Get a fresh expiry date for a signed URL (24 hours from now)
 * @returns Date object set to 24 hours in the future
 */
export const getNewExpiryDate = (): Date => {
  const expiryDate = new Date();
  expiryDate.setHours(expiryDate.getHours() + 24);
  return expiryDate;
};

/**
 * Checks if a given expiry date is approaching (within 1 hour)
 * @param expiryDate Date to check
 * @returns True if URL needs refresh, false otherwise
 */
export const needsRefresh = (expiryDate?: Date): boolean => {
  if (!expiryDate) return true;

  const oneHourBuffer = 60 * 60 * 1000; // 1 hour in ms
  return new Date(expiryDate.getTime() - oneHourBuffer) <= new Date();
};

/**
 * Refresh a signed URL if needed based on expiry date
 * @param video VideoGeneration document to check
 * @returns Updated video document with fresh URLs if needed
 */
export const refreshUrlIfNeeded = async (
  video: IVideoGeneration
): Promise<IVideoGeneration> => {
  if (!video) return video;

  const updates: Partial<IVideoGeneration> = {};

  // Check if image URL needs refreshing
  if (video.imagePath && needsRefresh(video.imageUrlExpiry)) {
    const newUrl = await getSignedUrl(video.imagePath);
    updates.imageUrl = newUrl;
    updates.imageUrlExpiry = getNewExpiryDate();
    console.log(`Refreshed image URL for video ${video.jobId}`);
  }

  // Check if thumbnail URL needs refreshing
  if (video.thumbnailPath && needsRefresh(video.thumbnailUrlExpiry)) {
    const newUrl = await getSignedUrl(video.thumbnailPath);
    updates.thumbnailUrl = newUrl;
    updates.thumbnailUrlExpiry = getNewExpiryDate();
    console.log(`Refreshed thumbnail URL for video ${video.jobId}`);
  }

  // Check if video URL needs refreshing
  if (video.videoPath && needsRefresh(video.videoUrlExpiry)) {
    const newUrl = await getSignedUrl(video.videoPath);
    updates.videoUrl = newUrl;
    updates.videoUrlExpiry = getNewExpiryDate();
    console.log(`Refreshed video URL for video ${video.jobId}`);
  }

  // If any URLs were refreshed, update the database
  if (Object.keys(updates).length > 0) {
    await VideoGeneration.updateOne({ jobId: video.jobId }, { $set: updates });
    return { ...video.toObject(), ...updates } as IVideoGeneration;
  }

  return video;
};

/**
 * Refresh all signed URLs for a video regardless of expiry date
 * @param jobId ID of the video generation job
 * @returns Updated video document with fresh URLs
 */
export const forceRefreshUrls = async (
  jobId: string
): Promise<IVideoGeneration | null> => {
  const video = await VideoGeneration.findOne({ jobId });
  if (!video) return null;

  const updates: Partial<IVideoGeneration> = {};

  // Refresh all available URLs
  if (video.imagePath) {
    updates.imageUrl = await getSignedUrl(video.imagePath);
    updates.imageUrlExpiry = getNewExpiryDate();
  }

  if (video.thumbnailPath) {
    updates.thumbnailUrl = await getSignedUrl(video.thumbnailPath);
    updates.thumbnailUrlExpiry = getNewExpiryDate();
  }

  if (video.videoPath) {
    updates.videoUrl = await getSignedUrl(video.videoPath);
    updates.videoUrlExpiry = getNewExpiryDate();
  }

  if (Object.keys(updates).length > 0) {
    await VideoGeneration.updateOne({ jobId }, { $set: updates });
    return { ...video.toObject(), ...updates } as IVideoGeneration;
  }

  return video;
};

/**
 * Refresh signed URLs for all videos in an array
 * @param videos Array of video generation documents
 * @returns Updated array with fresh URLs where needed
 */
export const refreshUrlsInBatch = async (
  videos: IVideoGeneration[]
): Promise<IVideoGeneration[]> => {
  return Promise.all(videos.map((video) => refreshUrlIfNeeded(video)));
};
