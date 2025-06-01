"use client";

import * as apiClient from "@/utils/apiClient";
import { ApiError, createApiError } from "@/types/error";

export interface UserProfile {
  walletAddress: string;
  username?: string;
  profileImage?: string;
  bio?: string;
  social?: {
    twitter?: string;
    discord?: string;
    website?: string;
  };
  preferences: {
    emailNotifications: boolean;
    darkMode: boolean;
    showInGallery: boolean;
    defaultPipelineId?: string;
    pipelineOptions?: Record<string, unknown>;
  };
  createdAt: string;
  updatedAt: string;
}

export interface UserPreferences {
  emailNotifications: boolean;
  darkMode: boolean;
  showInGallery: boolean;
  defaultPipelineId?: string;
  pipelineOptions?: Record<string, unknown>;
}

export interface PipelinePreferences {
  defaultPipelineId: string;
  pipelineOptions: Record<string, unknown>;
}

const USER_API_PATH = "/api/user";

/**
 * Get the current user's profile
 */
export const getCurrentUser = async (): Promise<UserProfile> => {
  try {
    return await apiClient.get<UserProfile>(`${USER_API_PATH}/me`);
  } catch (error) {
    console.error("[User Service] Error fetching current user:", error);

    // Rethrow ApiErrors, wrap other errors
    if (error && typeof error === "object" && "status" in error) {
      throw error;
    }

    throw createApiError(
      500,
      "Failed to fetch user profile",
      "user_fetch_error"
    );
  }
};

/**
 * Get a user profile by wallet address
 */
export const getUserProfile = async (address: string): Promise<UserProfile> => {
  try {
    if (!address) {
      throw createApiError(
        400,
        "Wallet address is required",
        "validation_error"
      );
    }

    return await apiClient.get<UserProfile>(
      `${USER_API_PATH}/profile/${address}`
    );
  } catch (error) {
    console.error(
      `[User Service] Error fetching user profile for ${address}:`,
      error
    );

    // Rethrow ApiErrors, wrap other errors
    if (error && typeof error === "object" && "status" in error) {
      throw error;
    }

    throw createApiError(
      500,
      "Failed to fetch user profile",
      "user_fetch_error"
    );
  }
};

/**
 * Update the current user's profile
 */
export const updateUserProfile = async (
  profileData: Partial<UserProfile>
): Promise<UserProfile> => {
  try {
    if (!profileData) {
      throw createApiError(400, "Profile data is required", "validation_error");
    }

    return await apiClient.put<UserProfile>(
      `${USER_API_PATH}/profile`,
      profileData
    );
  } catch (error) {
    console.error("[User Service] Error updating user profile:", error);

    // Rethrow ApiErrors, wrap other errors
    if (error && typeof error === "object" && "status" in error) {
      throw error;
    }

    throw createApiError(
      500,
      "Failed to update user profile",
      "user_update_error"
    );
  }
};

/**
 * Update user preferences
 */
export const updateUserPreferences = async (
  preferences: Partial<UserProfile["preferences"]>
): Promise<UserProfile> => {
  try {
    if (!preferences) {
      throw createApiError(
        400,
        "Preferences data is required",
        "validation_error"
      );
    }

    return await apiClient.put<UserProfile>(`${USER_API_PATH}/preferences`, {
      preferences,
    });
  } catch (error) {
    console.error("[User Service] Error updating user preferences:", error);

    // Rethrow ApiErrors, wrap other errors
    if (error && typeof error === "object" && "status" in error) {
      throw error;
    }

    throw createApiError(
      500,
      "Failed to update user preferences",
      "user_update_error"
    );
  }
};

/**
 * Get user's pipeline preferences
 */
export const getUserPipelinePreferences =
  async (): Promise<PipelinePreferences | null> => {
    try {
      return await apiClient.get<PipelinePreferences>(
        `${USER_API_PATH}/pipeline-preferences`
      );
    } catch (error) {
      // Return null if preferences don't exist yet (404 error)
      if (
        error &&
        typeof error === "object" &&
        "status" in error &&
        (error as ApiError).status === 404
      ) {
        return null;
      }

      console.error(
        "[User Service] Error fetching pipeline preferences:",
        error
      );

      // Rethrow ApiErrors, wrap other errors
      if (error && typeof error === "object" && "status" in error) {
        throw error;
      }

      throw createApiError(
        500,
        "Failed to fetch pipeline preferences",
        "preferences_fetch_error"
      );
    }
  };

/**
 * Update user's pipeline preferences
 */
export const updateUserPipelinePreferences = async (
  pipelinePreferences: PipelinePreferences
): Promise<PipelinePreferences> => {
  try {
    if (!pipelinePreferences) {
      throw createApiError(
        400,
        "Pipeline preferences data is required",
        "validation_error"
      );
    }

    return await apiClient.put<PipelinePreferences>(
      `${USER_API_PATH}/pipeline-preferences`,
      pipelinePreferences
    );
  } catch (error) {
    console.error("[User Service] Error updating pipeline preferences:", error);

    // Rethrow ApiErrors, wrap other errors
    if (error && typeof error === "object" && "status" in error) {
      throw error;
    }

    throw createApiError(
      500,
      "Failed to update pipeline preferences",
      "preferences_update_error"
    );
  }
};
