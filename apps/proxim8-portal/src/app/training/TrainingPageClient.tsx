"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import MissionBriefingModal from "@/components/training/MissionBriefingModal";
import { TrainingMissionCarousel } from "@/components/training/TrainingMissionCarousel";
import type { TimelineEvent, Approach, TimelinePeriod } from "@/lib/timeline-data";
import type { TrainingMissionData } from "@/components/training/TrainingMissionCard";
import { useTrainingMissions } from "@/hooks/useMissions";
import type { MissionWithProgress } from "@/lib/api/missions";

export default function TrainingPageClient() {
  const router = useRouter();
  const [isLoaded, setIsLoaded] = useState(false);
  const [selectedMission, setSelectedMission] =
    useState<TrainingMissionData | null>(null);
  const [backgroundNumber, setBackgroundNumber] = useState(8);
  const { missions, agent, isLoading, isDeploying, error, deployMission, refetch } = useTrainingMissions();

  useEffect(() => {
    // Select training-themed background
    const randomBg = Math.floor(Math.random() * 19) + 1;
    setBackgroundNumber(randomBg);
    const timer = setTimeout(() => setIsLoaded(true), 100);
    return () => clearTimeout(timer);
  }, []);


  const handleMissionClick = (mission: TrainingMissionData) => {
    if (mission.status !== "locked") {
      // Use new dashboard for mission viewing
      router.push(`/training/missions/${mission.id}`);
    }
  };

  const handleMissionDeploy = async (eventId: string, approach: string, proxim8Id?: string) => {
    try {
      // Use the provided proxim8Id or fall back to a default
      const selectedProxim8Id = proxim8Id || ((agent?.availableProxim8s ?? 0) > 0 ? 'proxim8-1' : 'test-proxim8');
      
      // Map approach names to API format
      const approachMap: Record<string, 'low' | 'medium' | 'high'> = {
        'sabotage': 'high',
        'expose': 'medium',
        'organize': 'low',
        'aggressive': 'high',
        'balanced': 'medium',
        'cautious': 'low'
      };
      
      const apiApproach = approachMap[approach] || 'medium';
      
      const result = await deployMission(eventId, selectedProxim8Id, apiApproach, 'training');
      
      setSelectedMission(null);
      
      // Show success message (you could add a toast notification here)
      console.log(`Mission ${eventId} deployed successfully with ${apiApproach} approach`, result);
      
      // Return the deployment result so the modal can track it
      return result;
      
    } catch (err) {
      console.error('Mission deployment failed:', err);
      // Error is already handled in the hook, just log here
      throw err;
    }
  };


  // Convert API mission data to UI format
  const convertToUIFormat = (mission: MissionWithProgress): TrainingMissionData => {
    const progress = mission.userProgress;
    
    let status: TrainingMissionData['status'];
    if (!progress?.isUnlocked) {
      status = 'locked';
    } else if (progress.isActive) {
      status = 'in-progress';
    } else if (progress.isCompleted) {
      status = progress.successRate ? 'completed-success' : 'completed-failure';
    } else {
      status = 'available';
    }

    // Find deployment for this mission if it exists
    const deployment = (mission as any).deployment;
    
    // Check if mission has unclaimed lore
    // For completed missions, we need to check if AI-generated lore exists
    // The actual lore is saved with the deployment's proxim8Id (might be "test-proxim8")
    const hasUnclaimedLore = status.includes('completed') && deployment?.result;
    
    // TODO: In the future, we should query the lore API to check for unclaimed lore
    // For now, assume completed missions with results have lore
    
    return {
      id: mission.missionId || mission.id || '',
      sequence: mission.sequence,
      title: mission.title || mission.missionName || '',
      date: mission.date,
      location: mission.location,
      description: mission.description,
      briefing: typeof mission.briefing === 'object' && mission.briefing !== null ? (mission.briefing as any).text : mission.briefing,
      imageUrl: mission.imageUrl || `/background-${mission.sequence}.png`,
      duration: mission.duration / 1000 || 60, // Convert milliseconds to seconds  
      status,
      progress: progress?.isActive ? 65 : undefined, // Mock progress for active missions
      oneirocumControl: 100 - (mission.sequence - 1) * 10, // Calculate based on sequence
      approaches: ['sabotage', 'expose', 'organize'] as Approach[], // Map from API approach keys to UI approach names
      deploymentCompletesAt: deployment?.completesAt || (mission as any).completesAt, // Include completion time if available
      hasUnclaimedLore
    } as any;
  };

  // Convert training mission to TimelineEvent for compatibility with existing MissionBriefing
  const convertToTimelineEvent = (
    mission: TrainingMissionData
  ): TimelineEvent => {
    // Find the full mission data with deployment
    const fullMission = missions.find(m => m.id === mission.id);
    const deployment = (fullMission as any)?.deployment;
    
    return {
      id: mission.id,
      period: "resistance" as TimelinePeriod, // All training missions are "resistance" period
      date: mission.date,
      title: mission.title,
      description: mission.description,
      location: mission.location,
      impact: "high", // All training missions have high impact
      type: "keyEvent",
      oneirocumControl: mission.oneirocumControl || 50,
      briefing: mission.briefing,
      approaches: ["aggressive", "balanced", "cautious"] as Approach[], // Standard approaches
      isAvailable: mission.status !== "locked",
      isCompleted: mission.status === "completed-success" || mission.status === "completed-failure",
      deployment: deployment ? {
        deploymentId: deployment.deploymentId,
        proxim8Id: deployment.proxim8Id,
        approach: deployment.approach,
        stage: deployment.stage,
        result: deployment.result,
        lore: deployment.lore,
        completesAt: deployment.completesAt,
        deployedAt: deployment.deployedAt
      } : undefined
    };
  };

  // Convert missions to UI format
  const uiMissions = missions.map(convertToUIFormat);
  
  // Use real data only - no fallback to mock data
  const displayMissions = uiMissions;
  
  // Calculate overall progress
  const completedCount = displayMissions.filter(
    (m) => m.status === "completed-success" || m.status === "completed-failure"
  ).length;
  const totalProgress = displayMissions.length > 0 ? (completedCount / displayMissions.length) * 100 : 0;

  return (
    <div className="min-h-screen bg-black text-gray-200 relative overflow-hidden flex flex-col">
      {/* Background Image - matching portal */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-opacity duration-1000 ease-out"
        style={{
          backgroundImage: `url('/background-${backgroundNumber}.png')`,
          opacity: isLoaded ? 1 : 0.3,
        }}
      />

      {/* Vignette Overlay - matching portal */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(0,0,0,0.4)_50%,rgba(0,0,0,0.8)_100%)]" />

      {/* Noise/Grain overlay - matching portal */}
      <div
        className="absolute inset-0 opacity-[0.015] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Content */}
      <div className="relative z-10 flex-1 flex flex-col">
        {/* Header Section */}
        <div className="px-8 pt-32 pb-8">
          <div
            className={`max-w-7xl mx-auto transition-all duration-700 ease-out ${
              isLoaded
                ? "translate-y-0 opacity-100"
                : "-translate-y-8 opacity-0"
            }`}
          >
            {/* Header Card */}
            <div className="bg-gray-900/60 backdrop-blur-sm border border-gray-700/50 rounded-lg p-8">
              <h1 className="text-3xl md:text-4xl font-orbitron font-bold mb-3">
                AGENT TRAINING PROTOCOL
              </h1>
              <p className="text-base text-gray-300 font-space-mono max-w-3xl mb-8">
                Master timeline intervention techniques through progressive training missions. 
                Each successful operation weakens Oneirocom's control and brings us closer to the optimal timeline.
              </p>

              {/* Error/Warning Display */}
              {error && (
                <div className="mb-6 p-4 bg-red-900/50 border border-red-700 rounded-lg">
                  <p className="text-red-400 font-space-mono text-sm">
                    ⚠ {error}
                  </p>
                </div>
              )}
              
              {isDeploying && (
                <div className="mb-6 p-4 bg-blue-900/50 border border-blue-700 rounded-lg">
                  <p className="text-blue-400 font-space-mono text-sm">
                    🚀 Deploying mission... Please wait.
                  </p>
                </div>
              )}

              {/* Show message when no missions are available */}
              {!isLoading && displayMissions.length === 0 && (
                <div className="mb-6 p-4 bg-gray-800/50 border border-gray-600 rounded-lg">
                  <p className="text-gray-400 font-space-mono text-sm">
                    No training missions available. Contact your handler to initialize the training protocol.
                  </p>
                </div>
              )}

              {/* Overall Progress */}
              {displayMissions.length > 0 && (
                <div className="max-w-md">
                  <div className="flex justify-between text-sm font-space-mono mb-3">
                    <span className="text-gray-400 uppercase">
                      Training Progress
                    </span>
                    <span className="text-primary-500">
                      {completedCount} of {displayMissions.length} missions complete
                    </span>
                  </div>
                  <div className="h-3 bg-gray-800 border border-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-primary-500 to-primary-600 transition-all duration-1000 ease-out"
                      style={{
                        width: `${totalProgress}%`,
                      }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 font-space-mono mt-2">
                    Timeline stability: {100 - Math.floor(totalProgress * 0.5)}% under Oneirocom control
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mission Carousel */}
        <div
          className={`flex-1 flex items-center pb-16 transition-all duration-700 ease-out delay-300 ${
            isLoaded ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
          }`}
        >
          <TrainingMissionCarousel
            missions={displayMissions}
            onMissionClick={handleMissionClick}
            isLoading={isLoading}
          />
        </div>
      </div>

      {/* Mission Briefing Modal */}
      {selectedMission && (
        <MissionBriefingModal
          mission={convertToTimelineEvent(selectedMission)}
          isOpen={true}
          onClose={() => setSelectedMission(null)}
          onDeploy={handleMissionDeploy}
        />
      )}
    </div>
  );
}