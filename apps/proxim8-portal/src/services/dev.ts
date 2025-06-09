import api from "@/lib/api";

/**
 * Development-only API endpoints for testing and debugging
 * These endpoints are only available in development mode
 */

export interface ForceCompleteMissionResponse {
  success: boolean;
  data?: {
    message: string;
    deployment: any;
  };
  error?: string;
  message?: string;
  deployment?: any;
}

export interface ClearMissionResponse {
  success: boolean;
  data?: {
    message: string;
    deletedCount: number;
  };
  error?: string;
  message?: string;
  deletedCount?: number;
}

/**
 * Force complete a mission and reveal all phases
 * @param deploymentId The deployment ID to force complete
 */
export async function forceCompleteMission(deploymentId: string): Promise<ForceCompleteMissionResponse> {
  try {
    const response = await api.post<any>(
      `/api/dev/missions/${deploymentId}/force-complete`
    );
    
    // Handle both nested and flat response structures
    if (response.data) {
      // If the response has a success field, return as is
      if ('success' in response.data) {
        return response.data;
      }
      // Otherwise, wrap it in a success response
      return {
        success: true,
        data: response.data,
        message: response.data.message,
        deployment: response.data.deployment
      };
    }
    
    return { success: false, error: "No response data" };
  } catch (error: any) {
    console.error("Failed to force complete mission:", error);
    return {
      success: false,
      error: error.response?.data?.error || "Failed to force complete mission"
    };
  }
}

/**
 * Clear/reset a mission to allow retrying
 * @param missionId The mission ID to clear
 */
export async function clearMission(missionId: string): Promise<ClearMissionResponse> {
  try {
    const response = await api.delete<any>(
      `/api/dev/missions/${missionId}/clear`
    );
    
    // Handle both nested and flat response structures
    if (response.data) {
      // If the response has a success field, return as is
      if ('success' in response.data) {
        return response.data;
      }
      // Otherwise, wrap it in a success response
      return {
        success: true,
        data: response.data,
        message: response.data.message,
        deletedCount: response.data.deletedCount
      };
    }
    
    return { success: false, error: "No response data" };
  } catch (error: any) {
    console.error("Failed to clear mission:", error);
    return {
      success: false,
      error: error.response?.data?.error || "Failed to clear mission"
    };
  }
}

// Export all dev functions
const devApi = {
  forceCompleteMission,
  clearMission
};

export default devApi;