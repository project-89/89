import { logger } from "./logger";

/**
 * Get the current Cloud Run service URL using the metadata service
 * Falls back to INTERNAL_API_URL environment variable or localhost for development
 */
export const getServiceUrl = async (): Promise<string> => {
  // First try environment variable (for backwards compatibility)
  if (process.env.INTERNAL_API_URL) {
    return process.env.INTERNAL_API_URL;
  }

  // Try to get the service URL from Cloud Run metadata service
  try {
    // Get the service name from metadata
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);

    const serviceResponse = await fetch(
      "http://metadata.google.internal/computeMetadata/v1/instance/attributes/gae_backend_name",
      {
        headers: { "Metadata-Flavor": "Google" },
        signal: controller.signal,
      }
    );

    clearTimeout(timeoutId);

    if (serviceResponse.ok) {
      const serviceName = await serviceResponse.text();
      const serviceUrl = `https://${serviceName}`;
      logger.info(`Discovered service URL from metadata: ${serviceUrl}`);
      return serviceUrl;
    }
  } catch (error) {
    logger.warn(`Failed to get service URL from metadata: ${error}`);
  }

  // Try alternative metadata endpoint for Cloud Run
  try {
    const controller1 = new AbortController();
    const timeoutId1 = setTimeout(() => controller1.abort(), 2000);

    const regionResponse = await fetch(
      "http://metadata.google.internal/computeMetadata/v1/instance/region",
      {
        headers: { "Metadata-Flavor": "Google" },
        signal: controller1.signal,
      }
    );

    clearTimeout(timeoutId1);

    const controller2 = new AbortController();
    const timeoutId2 = setTimeout(() => controller2.abort(), 2000);

    const serviceNameResponse = await fetch(
      "http://metadata.google.internal/computeMetadata/v1/instance/attributes/gae_service",
      {
        headers: { "Metadata-Flavor": "Google" },
        signal: controller2.signal,
      }
    );

    clearTimeout(timeoutId2);

    if (regionResponse.ok && serviceNameResponse.ok) {
      const region = await regionResponse.text();
      const serviceName = await serviceNameResponse.text();

      // Extract region code (e.g., "projects/123/regions/us-central1" -> "us-central1")
      const regionCode = region.split("/").pop();

      // Construct Cloud Run URL
      const serviceUrl = `https://${serviceName}-${regionCode}.a.run.app`;
      logger.info(`Constructed service URL from metadata: ${serviceUrl}`);
      return serviceUrl;
    }
  } catch (error) {
    logger.warn(`Failed to construct service URL from metadata: ${error}`);
  }

  // Fallback to localhost for development
  const fallbackUrl = "http://localhost:4000";
  logger.warn(`Using fallback URL: ${fallbackUrl}`);
  return fallbackUrl;
};

// Cache the service URL to avoid repeated metadata calls
let cachedServiceUrl: string | null = null;

/**
 * Get the service URL with caching
 */
export const getCachedServiceUrl = async (): Promise<string> => {
  if (!cachedServiceUrl) {
    cachedServiceUrl = await getServiceUrl();
  }
  return cachedServiceUrl;
};
