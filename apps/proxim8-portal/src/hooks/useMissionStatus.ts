import { useState, useEffect, useCallback, useRef } from "react";
import { getMissionStatus, type MissionDeployment } from "@/lib/api/missions";

interface UseMissionStatusOptions {
  deploymentId: string | null;
  pollInterval?: number; // in milliseconds, default 5000 (5 seconds)
  autoStop?: boolean; // stop polling when mission completes, default true
  onStatusChange?: (deployment: MissionDeployment) => void;
  onMissionComplete?: (deployment: MissionDeployment) => void;
}

interface UseMissionStatusReturn {
  deployment: MissionDeployment | null;
  isLoading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  startPolling: () => void;
  stopPolling: () => void;
  forceRefresh: () => Promise<void>;
  isPolling: boolean;
}

export function useMissionStatus(
  options: UseMissionStatusOptions
): UseMissionStatusReturn {
  const {
    deploymentId,
    pollInterval = 5000,
    autoStop = true,
    onStatusChange,
    onMissionComplete,
  } = options;

  const [deployment, setDeployment] = useState<MissionDeployment | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isPolling, setIsPolling] = useState(false);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const previousDeploymentRef = useRef<MissionDeployment | null>(null);

  const fetchMissionStatus =
    useCallback(async (): Promise<MissionDeployment | null> => {
      if (!deploymentId) return null;

      try {
        setError(null);
        const response = await getMissionStatus(deploymentId);
        return response;
      } catch (err) {
        console.error("Error fetching mission status:", err);
        setError(err instanceof Error ? err.message : "Unknown error occurred");
        return null;
      }
    }, [deploymentId]);

  const forceRefresh = useCallback(async () => {
    if (!deploymentId) return;

    setIsLoading(true);
    const newDeployment = await fetchMissionStatus();

    if (newDeployment) {
      const previousDeployment = previousDeploymentRef.current;

      // Check for mission completion
      if (
        previousDeployment?.status !== "completed" &&
        newDeployment.status === "completed" &&
        onMissionComplete
      ) {
        onMissionComplete(newDeployment);
      }

      setDeployment(newDeployment);
      previousDeploymentRef.current = newDeployment;
      setLastUpdated(new Date());

      if (onStatusChange) {
        onStatusChange(newDeployment);
      }

      // Auto-stop polling if mission is complete
      if (
        autoStop &&
        ["completed", "abandoned"].includes(newDeployment.status)
      ) {
        stopPolling();
      }
    }

    setIsLoading(false);
  }, [
    deploymentId,
    fetchMissionStatus,
    onStatusChange,
    onMissionComplete,
    autoStop,
  ]);

  const startPolling = useCallback(() => {
    if (isPolling || !deploymentId) return;

    setIsPolling(true);

    // Initial fetch
    forceRefresh();

    // Set up interval
    intervalRef.current = setInterval(() => {
      forceRefresh();
    }, pollInterval);
  }, [deploymentId, forceRefresh, pollInterval]);

  // Don't use useCallback for stopPolling to avoid circular dependency
  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsPolling(false);
  }, []);

  // Auto-start polling when deploymentId changes
  useEffect(() => {
    if (deploymentId) {
      startPolling();
    } else {
      stopPolling();
      setDeployment(null);
      setError(null);
      setLastUpdated(null);
    }

    return () => {
      stopPolling();
    };
  }, [deploymentId, startPolling]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopPolling();
    };
  }, []);

  return {
    deployment,
    isLoading,
    error,
    lastUpdated,
    startPolling,
    stopPolling,
    forceRefresh,
    isPolling,
  };
}
