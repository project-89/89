'use client';

import { MissionActionBar } from '@/components/missions/MissionDashboard/MissionActionBar';
import { MissionContent } from '@/components/missions/MissionDashboard/MissionContent';
import { MissionHero } from '@/components/missions/MissionDashboard/MissionHero';
import { MobileNavigation } from '@/components/missions/MissionDashboard/MobileNavigation';
import { DevToolsDrawerEnhanced } from '@/components/training/DevToolsDrawerEnhanced';
import { useMissionDashboard } from '@/hooks/useMissionDashboard';
import devApi from '@/services/dev';
import { useNftStore } from '@/stores/nftStore';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface MissionDashboardClientProps {
  missionId: string;
}

export default function MissionDashboardClient({
  missionId,
}: MissionDashboardClientProps) {
  const router = useRouter();
  const userNfts = useNftStore((state) => state.userNfts);
  const [backgroundNumber, setBackgroundNumber] = useState(1);
  const [isMobile, setIsMobile] = useState(false);
  const [activePanel, setActivePanel] = useState<
    'briefing' | 'action' | 'intel'
  >('briefing');
  const [isDevToolsOpen, setIsDevToolsOpen] = useState(false);

  const {
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
    refetch, // Get refetch from useMissionDashboard instead
  } = useMissionDashboard(missionId);

  // Check if mobile on mount and resize
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Set random background
  useEffect(() => {
    setBackgroundNumber(Math.floor(Math.random() * 19) + 1);
  }, []);

  // Keyboard shortcut for dev tools
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Cmd/Ctrl + D to toggle dev tools
      if ((e.metaKey || e.ctrlKey) && e.key === 'd') {
        e.preventDefault();
        setIsDevToolsOpen((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  // Dev tool handlers
  const handleClearMission = async (missionId: string) => {
    if (
      !confirm(
        'Are you sure you want to clear this mission? This will delete all deployment data and allow you to retry it.'
      )
    ) {
      return;
    }

    try {
      const result = await devApi.clearMission(missionId);

      if (result.success) {
        console.log('Mission cleared:', result.data?.message);
        // Refresh missions to reflect the change
        refetch();
        refreshMission();
      } else {
        console.error('Failed to clear mission:', result.error);
        alert(`Failed to clear mission: ${result.error}`);
      }
    } catch (err) {
      console.error('Error clearing mission:', err);
      alert('Failed to clear mission. Check console for details.');
    }
  };

  const handleCompleteMission = async (deploymentId: string) => {
    if (
      !confirm(
        'Force complete this mission? This will reveal all phases and mark the mission as completed.'
      )
    ) {
      return;
    }

    try {
      const result = await devApi.forceCompleteMission(deploymentId);

      if (result.success) {
        console.log('Mission force completed:', result.data?.message);
        // Refresh missions to reflect the change
        refetch();
        refreshMission();
      } else {
        console.error('Failed to force complete mission:', result.error);
        alert(`Failed to complete mission: ${result.error}`);
      }
    } catch (err) {
      console.error('Error force completing mission:', err);
      alert('Failed to complete mission. Check console for details.');
    }
  };

  const handleUpdateMissionData = async (updatedData: any) => {
    // For now, just log the updated data
    // In a real implementation, you would call an API to save the changes
    console.log('Updated mission data:', updatedData);

    // TODO: Implement actual save functionality
    // Example:
    // const result = await devApi.updateMission(missionId, updatedData);
    // if (result.success) {
    //   refetch();
    //   refreshMission();
    // }

    // For demo purposes, we'll just refresh to show the UI is responsive
    await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate API call
  };

  // Handle loading and error states
  if (isLoading) {
    return <MissionLoading />;
  }

  if (error || !mission) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <h2 className="font-orbitron text-xl font-bold text-red-500">
            MISSION NOT FOUND
          </h2>
          <p className="font-space-mono text-sm text-gray-400">
            {error || 'This mission does not exist in our database'}
          </p>
          <Link
            href="/training"
            className="inline-block px-6 py-3 bg-gray-800 border border-gray-700 text-white font-orbitron font-bold rounded hover:bg-gray-700 transition-colors"
          >
            RETURN TO TRAINING
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-gray-200">
      {/* Add padding-top to account for floating navbar */}
      <div className="pt-20 flex flex-col min-h-screen">
        {/* Mission Hero with integrated header */}
        <MissionHero
          mission={mission}
          phase={phase}
          deployment={deployment}
          onBeginMission={() => updatePhase('planning')}
        />

        {/* Mobile Navigation */}
        {isMobile && phase !== 'available' && (
          <MobileNavigation
            activePanel={activePanel}
            onPanelChange={setActivePanel}
            phase={phase}
          />
        )}

        {/* Mission Content */}
        <div className="flex-1">
          <MissionContent
            mission={mission}
            phase={phase}
            selections={selections}
            deployment={deployment}
            activePanel={activePanel}
            isMobile={isMobile}
            onUpdateSelections={updateSelections}
            onStartDeployment={startDeployment}
            onSwitchPanel={setActivePanel}
          />
        </div>

        {/* Mission Action Bar - Only show for specific phases */}
        {(phase === 'deploying' ||
          phase === 'in-progress' ||
          phase === 'completed' ||
          phase === 'failed') && (
          <MissionActionBar
            phase={phase}
            selections={selections}
            onAction={(action) => {
              switch (action) {
                case 'begin':
                  updatePhase('planning');
                  break;
                case 'deploy':
                  if (selections.approach && selections.agents.length > 0) {
                    startDeployment();
                  }
                  break;
                case 'claim':
                  // Handle reward claiming
                  break;
                case 'return':
                  router.push('/training');
                  break;
              }
            }}
          />
        )}

        {/* Dev Tools Help Text */}
        <div className="text-center py-4">
          <p className="font-space-mono text-xs text-gray-600">
            Press Cmd/Ctrl + D to toggle developer tools
          </p>
        </div>
      </div>

      {/* Developer Tools Drawer */}
      <DevToolsDrawerEnhanced
        mission={(() => {
          // Convert to the format expected by DevToolsDrawer
          if (!mission) return null;
          return {
            id: mission.id || mission.missionId,
            sequence: mission.sequence,
            title: mission.title || mission.missionName,
            date: mission.date,
            location: mission.location,
            description: mission.description,
            briefing: mission.briefing,
            imageUrl: mission.imageUrl,
            duration: mission.duration,
            status:
              phase === 'completed'
                ? 'completed-success'
                : phase === 'failed'
                  ? 'completed-failure'
                  : phase === 'in-progress'
                    ? 'in-progress'
                    : phase === 'available'
                      ? 'available'
                      : 'locked',
            oneirocumControl: 90,
            approaches: ['sabotage', 'expose', 'organize'],
          } as any;
        })()}
        deployment={deployment}
        rawMissionData={mission}
        isOpen={isDevToolsOpen}
        onToggle={() => setIsDevToolsOpen(!isDevToolsOpen)}
        onClearMission={handleClearMission}
        onCompleteMission={handleCompleteMission}
        onUpdateMissionData={handleUpdateMissionData}
      />
    </div>
  );
}

// Loading component
function MissionLoading() {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="relative w-24 h-24 mx-auto">
          <div className="absolute inset-0 border-4 border-green-500/20 rounded-full animate-ping" />
          <div className="absolute inset-0 border-4 border-green-500/40 rounded-full animate-ping animation-delay-200" />
          <div className="relative w-full h-full border-4 border-green-500 rounded-full flex items-center justify-center">
            <div className="w-16 h-16 border-4 border-green-500/50 rounded-full animate-spin" />
          </div>
        </div>
        <div>
          <h2 className="font-orbitron text-xl font-bold text-white mb-2">
            ACCESSING MISSION DATA
          </h2>
          <p className="font-space-mono text-sm text-gray-400">
            Establishing quantum link...
          </p>
        </div>
      </div>
    </div>
  );
}
