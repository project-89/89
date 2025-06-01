import * as apiClient from "@/utils/apiClient";

export interface ServiceStatus {
  id: string;
  name: string;
  status: "online" | "offline" | "degraded";
  lastChecked: string;
  keyConfigured: boolean;
  quotaRemaining?: number;
  requestsLast24h?: number;
}

export interface AdminStats {
  totalUsers: number;
  totalVideos: number;
  totalNFTs: number;
  videosGenerated: number;
  processingVideos: number;
  failedVideos: number;
  recentTransactions: {
    id: string;
    user: string;
    action: string;
    status: "completed" | "pending" | "failed";
    timestamp: string;
  }[];
}

export interface SystemStatus {
  api: {
    status: "operational" | "degraded" | "down";
    description: string;
  };
  database: {
    status: "operational" | "degraded" | "down";
    description: string;
  };
  videoProcessing: {
    status: "operational" | "degraded" | "down";
    description: string;
  };
  storage: {
    status: "operational" | "degraded" | "down";
    description: string;
  };
  notifications: {
    status: "operational" | "degraded" | "down";
    description: string;
  };
}

export interface AdminCheckResponse {
  isAdmin: boolean;
}

const ADMIN_API_PATH = "/api/admin";

/**
 * Check if a user has admin status
 */
export async function checkAdminStatus(): Promise<AdminCheckResponse> {
  return await apiClient.get<AdminCheckResponse>(`${ADMIN_API_PATH}/check`);
}

/**
 * Get AI service status
 */
export const getAIServiceStatus = async (): Promise<ServiceStatus[]> => {
  return await apiClient.get<ServiceStatus[]>(`${ADMIN_API_PATH}/ai-services`);
};

/**
 * Update API key for a service
 */
export const updateAPIKey = async (
  serviceId: string,
  apiKey: string
): Promise<void> => {
  return await apiClient.put<void>(
    `${ADMIN_API_PATH}/ai-services/${serviceId}/api-key`,
    {
      apiKey,
    }
  );
};

/**
 * Get admin dashboard statistics
 */
export async function getAdminStats(): Promise<AdminStats> {
  return await apiClient.get<AdminStats>(`${ADMIN_API_PATH}/stats`);
}

/**
 * Get system status information
 */
export async function getAdminSystemStatus(): Promise<SystemStatus> {
  return await apiClient.get<SystemStatus>(`${ADMIN_API_PATH}/system-status`);
}

/**
 * Perform admin system operations
 */
export const performAdminAction = async (
  action: string,
  params: Record<string, unknown>
): Promise<{ success: boolean; message: string }> => {
  return await apiClient.post<{ success: boolean; message: string }>(
    `${ADMIN_API_PATH}/actions/${action}`,
    params
  );
};

/**
 * Get admin logs
 */
export const getAdminLogs = async (
  type: "system" | "errors" | "access",
  page: number = 1,
  limit: number = 50
): Promise<{ logs: Array<Record<string, unknown>>; total: number }> => {
  const url = `${ADMIN_API_PATH}/logs/${type}?page=${page}&limit=${limit}`;
  return await apiClient.get<{
    logs: Array<Record<string, unknown>>;
    total: number;
  }>(url);
};

/**
 * Check if a wallet has admin privileges
 */
export const checkAdminAccess = async (): Promise<{ isAdmin: boolean }> => {
  return await apiClient.get<{ isAdmin: boolean }>(`${ADMIN_API_PATH}/access`);
};

export async function restartVideoProcessing(): Promise<void> {
  await apiClient.post("/admin/restart-processing");
}

export async function purgeCache(): Promise<void> {
  await apiClient.post("/admin/purge-cache");
}

export async function emergencyStop(): Promise<void> {
  await apiClient.post("/admin/emergency-stop");
}

export async function getErrorLogs(): Promise<string[]> {
  return await apiClient.get<string[]>("/admin/error-logs");
}

export async function getProcessingJobs(): Promise<{
  jobs: {
    id: string;
    status: "pending" | "processing" | "completed" | "failed";
    progress: number;
    createdAt: string;
    updatedAt: string;
  }[];
}> {
  return await apiClient.get<{
    jobs: {
      id: string;
      status: "pending" | "processing" | "completed" | "failed";
      progress: number;
      createdAt: string;
      updatedAt: string;
    }[];
  }>("/admin/processing-jobs");
}

export async function getRecentActivity(): Promise<{
  transactions: {
    id: string;
    user: string;
    action: string;
    status: "completed" | "pending" | "failed";
    timestamp: string;
  }[];
}> {
  return await apiClient.get<{
    transactions: {
      id: string;
      user: string;
      action: string;
      status: "completed" | "pending" | "failed";
      timestamp: string;
    }[];
  }>("/admin/recent-activity");
}
