import { promptEnhancementMiddleware } from "./prompts";
import { imageGenerationMiddleware } from "./images";
import { videoGenerationMiddleware } from "./videos";
import { Middleware, PipelineContext } from "../core";

import { getCache, setCache, createCacheKey } from "../../cache";
import { handleMiddlewareError } from "../utils";

import { getNFTsForWallet } from "../../../controllers/nftController";

// Logging middleware for debugging
export const loggingMiddleware: Middleware = {
  name: "Logging",
  execute: async (context: PipelineContext): Promise<PipelineContext> => {
    context.setMetadata("startTime", new Date());
    // Log important context values for debugging
    console.log(
      `User prompt: ${context.get("userPrompt")?.substring(0, 50)}...`
    );
    console.log(`NFT ID: ${context.get("nftId")}`);

    return context;
  },
};

// Error handling middleware
export const errorHandlingMiddleware: Middleware = {
  name: "Error Handler",
  execute: async (context: PipelineContext): Promise<PipelineContext> => {
    try {
      // Set initial error state as false
      context.setMetadata("hasErrors", false);
      // Clear any previous errors
      context.error = undefined;
      context.status = undefined;
      return context;
    } catch (error) {
      // Use standardized error handling
      return handleMiddlewareError(
        context,
        error,
        "ErrorHandler",
        "globalError"
      );
    }
  },
};

// Authentication middleware
export const authMiddleware: Middleware = {
  name: "Authentication",
  execute: async (context: PipelineContext): Promise<PipelineContext> => {
    // In a real implementation, this would validate the user credentials
    const walletAddress = context.get("walletAddress");

    if (!walletAddress) {
      throw new Error("Authentication failed: No wallet address provided");
    }

    context.setMetadata("authenticated", true);
    return context;
  },
};

// NFT data extraction middleware
export const nftExtractorMiddleware: Middleware = {
  name: "NFT Extractor",
  execute: async (context: PipelineContext): Promise<PipelineContext> => {
    try {
      const nftId = context.get("nftId");
      const walletAddress = context.get("walletAddress");

      if (!nftId) {
        throw new Error("NFT ID is required for NFT extraction");
      }

      try {
        // Use the direct service function instead of HTTP call
        const { nfts } = await getNFTsForWallet(walletAddress, true);

        // Find the NFT with the matching ID
        const matchingNft = nfts.find(
          (nft) =>
            nft.id === nftId || nft.mint === nftId || nft.tokenId === nftId
        );

        if (matchingNft) {
          // Set the NFT data in the context
          context.set("nftData", matchingNft);
          // Also explicitly set nftImageUrl for the image generation middleware
          context.set("nftImageUrl", matchingNft.image);

          context.setMetadata("nftExtractionComplete", true);
          return context;
        }
      } catch (apiError) {
        throw new Error("NFT extraction failed");
      }

      context.setMetadata("nftExtractionComplete", true);
      return context;
    } catch (error) {
      // Use standardized error handling
      return handleMiddlewareError(
        context,
        error,
        "NFTExtraction",
        "nftExtractionError"
      );
    }
  },
};

// Caching middleware
export const cachingMiddleware: Middleware = {
  name: "Caching",
  execute: async (context: PipelineContext): Promise<PipelineContext> => {
    try {
      const nftId = context.get("nftId");
      const prompt = context.get("userPrompt");

      if (!nftId || !prompt) {
        console.log(
          "[Cache Middleware] Missing nftId or prompt, skipping cache"
        );
        context.setMetadata("cacheHit", false);
        return context;
      }

      // Create a proper cache key using the cache utility
      const cacheKey = createCacheKey(
        "pipeline",
        nftId,
        prompt.substring(0, 20).replace(/\s+/g, "-")
      );

      console.log(`[Cache Middleware] Checking cache for key: ${cacheKey}`);

      // Try to get data from Redis cache
      const cachedData = await getCache<Record<string, any>>(cacheKey);

      if (cachedData) {
        console.log(`[Cache Middleware] Cache hit for key: ${cacheKey}`);

        // Store the cache key for potential invalidation later
        context.setMetadata("cacheKey", cacheKey);

        // Apply cached data to the context
        context.set("fromCache", true);

        // Add all cached properties to the context
        for (const [key, value] of Object.entries(cachedData)) {
          if (key !== "metadata") {
            context.set(key, value);
          }
        }

        // Handle metadata separately if it exists
        if (cachedData.metadata) {
          for (const [key, value] of Object.entries(cachedData.metadata)) {
            context.setMetadata(key, value);
          }
        }

        context.setMetadata("cacheHit", true);
        context.setMetadata("cacheTime", new Date());
      } else {
        console.log(`[Cache Middleware] Cache miss for key: ${cacheKey}`);
        context.setMetadata("cacheHit", false);

        // Store the cache key for later use when storing the result
        context.setMetadata("cacheKey", cacheKey);
      }

      return context;
    } catch (error) {
      // Use standardized error handling
      return handleMiddlewareError(context, error, "Cache", "cacheError");
    }
  },
};

// Cache saving middleware - should be added to the end of the pipeline
export const cacheSaveMiddleware: Middleware = {
  name: "Cache Save",
  execute: async (context: PipelineContext): Promise<PipelineContext> => {
    try {
      // Skip caching if there was any error
      if (
        context.getMetadata("hasErrors") ||
        context.getMetadata("cacheError") ||
        context.error ||
        context.status === "error"
      ) {
        console.log("[Cache Save] Skipping cache save due to errors");

        // Additionally, invalidate any existing cache if we encountered errors
        const cacheKey = context.getMetadata("cacheKey");
        if (cacheKey) {
          console.log(
            `[Cache Save] Invalidating cache key ${cacheKey} due to errors`
          );
          try {
            // Set the cache with null value and very short TTL to effectively delete it
            await setCache(cacheKey, null, 1);
            console.log(
              `[Cache Save] Successfully invalidated cache for key: ${cacheKey}`
            );
          } catch (invalidateError) {
            console.error(
              `[Cache Save] Error invalidating cache: ${invalidateError}`
            );
          }
        }

        return context;
      }

      // Skip if we already loaded from cache
      if (context.getMetadata("cacheHit")) {
        console.log(
          "[Cache Save] Skipping cache save because data was from cache"
        );
        return context;
      }

      // Get the cache key that was set in the caching middleware
      const cacheKey = context.getMetadata("cacheKey");
      if (!cacheKey) {
        console.log("[Cache Save] No cache key found, skipping cache save");
        return context;
      }

      // Verify that required data exists and is valid before caching
      const imageUrl = context.get("imageUrl");
      const imagePath = context.get("imagePath");

      if (!imageUrl || !imagePath) {
        console.log(
          "[Cache Save] Missing required image data, skipping cache save"
        );
        return context;
      }

      // Additional validation could be added here
      // For example, checking if URLs are valid

      // Prepare data to cache
      const dataToCache: Record<string, any> = {};

      // Copy important data from context
      const keysToCache = [
        "videoUrl",
        "imagePath",
        "videoPath",
        "thumbnailPath",
        "imageUrl",
        "thumbnailUrl",
      ];

      for (const key of keysToCache) {
        const value = context.get(key);
        if (value) {
          dataToCache[key] = value;
        }
      }

      // Skip caching if there's no valuable data
      if (Object.keys(dataToCache).length === 0) {
        console.log("[Cache Save] No valuable data to cache, skipping");
        return context;
      }

      // Add metadata to cache
      dataToCache.metadata = {
        cachedAt: new Date(),
        videoStatus: context.get("videoStatus"),
      };

      // Cache for 3 days (259200 seconds)
      const cacheTTL = 259200;
      console.log(
        `[Cache Save] Saving to cache with key: ${cacheKey}, TTL: ${cacheTTL} seconds`
      );

      // Store in Redis
      await setCache(cacheKey, dataToCache, cacheTTL);
      console.log(
        `[Cache Save] Successfully cached result for key: ${cacheKey}`
      );

      return context;
    } catch (error) {
      // Use standardized error handling
      return handleMiddlewareError(
        context,
        error,
        "CacheSave",
        "cacheSaveError"
      );
    }
  },
};

// Export all middleware
export {
  promptEnhancementMiddleware,
  imageGenerationMiddleware,
  videoGenerationMiddleware,
};
