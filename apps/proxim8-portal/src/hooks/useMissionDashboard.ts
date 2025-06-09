import { useState, useEffect, useCallback } from "react";
import { useTrainingMissions } from "./useMissions";
import type { MissionWithProgress } from "@/lib/api/missions";
import type { MissionPhase, MissionSelections, MissionDeployment } from "@/types/mission";

interface UseMissionDashboardReturn {
  mission: MissionWithProgress | null;
  phase: MissionPhase;
  selections: MissionSelections;
  deployment?: MissionDeployment;
  isLoading: boolean;
  error: string | null;
  updatePhase: (phase: MissionPhase) => void;
  updateSelections: (selections: Partial<MissionSelections>) => void;
  startDeployment: () => Promise<void>;
  refreshMission: () => void;
  refetch: () => Promise<void>;
}

export function useMissionDashboard(missionId: string): UseMissionDashboardReturn {
  const { missions, isLoading, error, deployMission, refetch } = useTrainingMissions();
  const [phase, setPhase] = useState<MissionPhase>("available");
  const [selections, setSelections] = useState<MissionSelections>({
    agents: [],
  });
  const [deployment, setDeployment] = useState<MissionDeployment>();

  // Find the specific mission - check both id and missionId fields
  const mission = missions.find((m) => 
    m.id === missionId || 
    (m as any).missionId === missionId
  ) || null;

  // Determine phase based on mission status
  useEffect(() => {
    if (!mission) return;

    const progress = mission.userProgress;
    const missionDeployment = (mission as any).deployment;

    if (!progress?.isUnlocked) {
      setPhase("available");
    } else if (missionDeployment?.status === "completed") {
      setPhase(missionDeployment.result?.overallSuccess ? "completed" : "failed");
    } else if (progress.isActive) {
      if (missionDeployment?.stage === "deploying" || missionDeployment?.stage === "processing") {
        setPhase("deploying");
      } else {
        setPhase("in-progress");
      }
    } else if (progress.isCompleted) {
      setPhase(progress.successRate ? "completed" : "failed");
    } else {
      setPhase("available");
    }

    // Set deployment data if available
    if (missionDeployment) {
      setDeployment({
        deploymentId: missionDeployment.deploymentId,
        stage: missionDeployment.stage || "deploying",
        progress: missionDeployment.progress || 0,
        currentPhase: missionDeployment.currentPhase || 0,
        phases: missionDeployment.phases || [],
        completesAt: missionDeployment.completesAt,
        lastUpdated: missionDeployment.lastUpdated,
        result: missionDeployment.result,
      });
    }
  }, [mission]);

  const updatePhase = useCallback((newPhase: MissionPhase) => {
    setPhase(newPhase);
  }, []);

  const updateSelections = useCallback((newSelections: Partial<MissionSelections>) => {
    setSelections((prev) => ({
      ...prev,
      ...newSelections,
    }));
  }, []);

  const startDeployment = useCallback(async () => {
    if (!mission || !selections.approach || selections.agents.length === 0) {
      console.error("Cannot deploy: missing selections");
      return;
    }

    setPhase("deploying");

    // Start deployment animation
    let progress = 0;
    const animationDuration = 45000; // 45 seconds
    const interval = setInterval(() => {
      progress += 2;
      if (progress >= 100) {
        clearInterval(interval);
        setDeployment((prev) => ({
          ...prev!,
          stage: "processing",
          progress: 100,
        }));
      } else {
        setDeployment((prev) => ({
          deploymentId: prev?.deploymentId || "temp-deployment",
          stage: "deploying",
          progress,
          currentPhase: 0,
          phases: [],
        }));
      }
    }, animationDuration / 50);

    try {
      // Map approach names to API format
      const approachMap: Record<string, "low" | "medium" | "high"> = {
        "sabotage": "high",
        "expose": "medium",
        "organize": "low",
      };
      
      const apiApproach = selections.approach ? approachMap[selections.approach] || "medium" : "medium";
      
      // Get the mission ID - ensure it's defined
      const missionId = mission.missionId || mission.id;
      if (!missionId) {
        throw new Error("Mission ID is required for deployment");
      }
      
      // Deploy the mission with training type
      await deployMission(
        missionId,
        selections.agents[0],
        apiApproach,
        'training'
      );

      // Set a mock deployment for demo purposes
      setDeployment({
        deploymentId: "temp-deployment",
        stage: "ready",
        progress: 100,
        currentPhase: 0,
        phases: [],
        completesAt: new Date(Date.now() + 60000).toISOString(),
      });

      // After a delay, transition to in-progress
      setTimeout(() => {
        setPhase("in-progress");
        refetch(); // Refresh mission data
      }, 3000);
    } catch (err) {
      console.error("Deployment failed:", err);
      clearInterval(interval);
      setPhase("planning");
      setDeployment(undefined);
    }
  }, [mission, selections, deployMission, refetch]);

  const refreshMission = useCallback(() => {
    refetch();
  }, [refetch]);

  return {
    mission,
    phase,
    selections,
    deployment,
    isLoading,
    error,
    updatePhase,
    updateSelections,
    startDeployment,
    refreshMission,
    refetch,
  };
}