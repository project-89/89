import { useState } from "react";
import { ApproachSelection } from "@/components/training/MissionBriefingModalComponents/ApproachSelection";
import { Proxim8Selection } from "@/components/training/MissionBriefingModalComponents/Proxim8Selection";
import { DeploymentProgressView } from "@/components/training/MissionBriefingModalComponents/DeploymentProgressView";
import { InProgressMission } from "@/components/training/MissionBriefingModalComponents/InProgressMission";
import { MissionReport } from "@/components/training/MissionBriefingModalComponents/MissionReport";
import { useNftStore } from "@/stores/nftStore";
import type { TrainingMission } from "@/lib/api/missions";
import type { MissionPhase, MissionSelections } from "@/types/mission";
import type { Approach } from "@/lib/timeline-data";
import { getMissionApproach, getMissionDurationSeconds } from "@/utils/missionHelpers";

interface ActionPanelProps {
  mission: TrainingMission;
  phase: MissionPhase;
  selections: MissionSelections;
  deployment?: any;
  onUpdateSelections: (selections: Partial<MissionSelections>) => void;
  onStartDeployment: () => void;
  onSwitchToIntel?: () => void;
  isMobile?: boolean;
}

export function ActionPanel({
  mission,
  phase,
  selections,
  deployment,
  onUpdateSelections,
  onStartDeployment,
  onSwitchToIntel,
  isMobile = false,
}: ActionPanelProps) {
  const userNfts = useNftStore((state) => state.userNfts);
  const [showAgentSelection, setShowAgentSelection] = useState(false);

  // Transform NFT data for Proxim8Selection component
  const getProxim8s = () => {
    if (!userNfts || userNfts.length === 0) return [];

    return userNfts.map((nft) => ({
      id: nft.id,
      name: nft.name,
      image: nft.image,
      coordinator:
        nft.attributes?.find((a: any) => a.trait_type === "Coordinator")
          ?.value || "UNKNOWN",
      missionsCompleted: 0,
      successRate: 0,
      compatibilityLevel: 0.75,
      specialization: "adaptive" as const,
      onMission: false,
    }));
  };

  const renderContent = () => {
    switch (phase) {
      case "available":
        return (
          <div className="space-y-6">
            {/* Mission Operations Header */}
            <div className="border-b border-gray-700 pb-4">
              <h3 className="font-orbitron text-lg font-bold text-white mb-2">
                OPERATIONAL PLANNING
              </h3>
              <p className="font-space-mono text-sm text-gray-400">
                CONFIGURE DEPLOYMENT PARAMETERS • SELECT APPROACH
              </p>
            </div>

            {/* Quick Mission Stats */}
            <div className="space-y-4">
              <div className="bg-gray-800/50 border border-gray-700/50 rounded-lg p-4">
                <h4 className="font-orbitron text-sm font-bold text-green-400 mb-2">
                  MISSION PARAMETERS
                </h4>
                <div className="grid grid-cols-2 gap-4 font-space-mono text-sm">
                  <div>
                    <span className="text-gray-500">Duration:</span>
                    <span className="text-gray-300 ml-2">{getMissionDurationSeconds(mission)} seconds</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Timeline Impact:</span>
                    <span className="text-green-400 ml-2">HIGH</span>
                  </div>
                </div>
              </div>

              <div className="bg-amber-900/20 border border-amber-700/50 rounded-lg p-4">
                <h4 className="font-orbitron text-sm font-bold text-amber-400 mb-2">
                  PRE-DEPLOYMENT CHECKLIST
                </h4>
                <ul className="space-y-2 font-space-mono text-sm text-gray-300">
                  <li className="flex items-start gap-2">
                    <span className={selections.approach ? "text-green-400" : "text-gray-600"}>
                      {selections.approach ? "✓" : "○"}
                    </span>
                    <span>Select tactical approach</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className={selections.agents.length > 0 ? "text-green-400" : "text-gray-600"}>
                      {selections.agents.length > 0 ? "✓" : "○"}
                    </span>
                    <span>Assign Proxim8 agent</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-gray-600">○</span>
                    <span>Review intel reports (optional)</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Action Required */}
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
              <p className="font-space-mono text-sm text-blue-300 text-center">
                Review mission parameters and begin operation when ready.
              </p>
            </div>
          </div>
        );

      case "planning":
        // Show agent selection if we're in agent selection mode
        if (selections.approach && showAgentSelection) {
          return (
            <div className="space-y-6">
              {/* Mobile-only Review Button when agent is selected */}
              {selections.agents[0] && isMobile && onSwitchToIntel && (
                <div className="text-center">
                  <button
                    onClick={onSwitchToIntel}
                    className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-space-mono text-sm rounded-lg transition-all inline-flex items-center gap-2"
                  >
                    REVIEW MISSION
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              )}
              
              <div className="flex items-center justify-between">
                <h3 className="font-orbitron text-lg font-bold text-white">
                  SELECT PROXIM8 AGENT
                </h3>
                <button
                  onClick={() => setShowAgentSelection(false)}
                  className="font-space-mono text-xs text-gray-400 hover:text-white"
                >
                  ← Back to Strategy
                </button>
              </div>

              <Proxim8Selection
                proxim8s={getProxim8s()}
                selectedProxim8={selections.agents[0] || null}
                onSelectProxim8={(agentId) =>
                  agentId && onUpdateSelections({ agents: [agentId] })
                }
                selectedApproach={selections.approach}
              />
            </div>
          );
        }

        // Show strategy selection by default
        return (
          <div className="space-y-6">
            {/* Continue Button at top right when strategy is selected */}
            {selections.approach && (
              <div className="flex justify-end">
                <button
                  onClick={() => setShowAgentSelection(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-space-mono text-sm rounded-lg transition-all"
                >
                  SELECT PROXIM8
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            )}
            
            <h3 className="font-orbitron text-lg font-bold text-white mb-4">
              SELECT APPROACH
            </h3>
            <ApproachSelection
              availableApproaches={
                ["sabotage", "expose", "organize"] as Approach[]
              }
              selectedApproach={selections.approach as Approach | null}
              onSelectApproach={(approach) =>
                onUpdateSelections({ approach: approach as string })
              }
            />
          </div>
        );

      case "deploying":
        return (
          <DeploymentProgressView
            stage={deployment?.stage || "deploying"}
            progress={deployment?.progress || 0}
            selectedProxim8={
              selections.agents[0]
                ? {
                    name:
                      userNfts?.find((n) => n.id === selections.agents[0])
                        ?.name || "Agent",
                    image:
                      userNfts?.find((n) => n.id === selections.agents[0])
                        ?.image || "",
                  }
                : undefined
            }
            selectedApproach={selections.approach}
            eventDate={mission.date}
            eventDuration={getMissionDurationSeconds(mission)}
            onViewProgress={() => {
              // This would transition to in-progress phase
            }}
          />
        );

      case "in-progress":
        return (
          <InProgressMission
            eventTitle={mission.title}
            phases={
              deployment?.phases?.map((p: any) => p.name) || [
                "Infiltration",
                "Analysis",
                "Execution",
                "Extraction",
              ]
            }
            actualPhaseData={deployment?.phases || []}
            currentPhase={deployment?.currentPhase || 0}
            isPolling={true}
            lastUpdated={deployment?.lastUpdated}
            completesAt={deployment?.completesAt}
          />
        );

      case "completed":
      case "failed":
        return (
          <MissionReport
            eventTitle={mission.title}
            eventStatus={phase}
            oneirocumControl={100 - (mission.sequence - 1) * 10}
            deployment={deployment}
            onClaimLore={() => {
              // Handle lore claiming
            }}
            unclaimedFragmentsCount={0}
            isLoadingLore={false}
            fragmentsData={[]}
            claimedFragments={[]}
            onViewLore={() => {}}
            isExtractingLore={false}
            loreClaimed={false}
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-700/50 rounded-lg h-full">
      <div className="p-4 md:p-6">{renderContent()}</div>
    </div>
  );
}
