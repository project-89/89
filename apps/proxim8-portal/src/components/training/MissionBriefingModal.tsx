"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Check } from "lucide-react";
import type { TimelineEvent } from "@/lib/timeline-data";
import {
  ApproachSelection,
  BannerHeader,
  DeploymentProgressView,
  InProgressMission,
  LoreClaim,
  LoreFragmentsDisplay,
  MissionBriefing,
  MissionBriefTab,
  MissionReport,
  ModalFooter,
  Proxim8Selection,
  QuantumExtraction,
  TimelineControl,
  VideoTab,
} from "./MissionBriefingModalComponents";
import { useNftStore } from "@/stores/nftStore";
import { useMissionStatus } from "@/hooks/useMissionStatus";
import {
  getClaimedLoreByNftId,
  claimLoreById,
  getClaimableMissionLore,
} from "@/services/lore";
import type { Lore } from "@/types/lore";

type Approach = "sabotage" | "expose" | "organize";

interface ExtendedNft {
  id: string;
  name: string;
  image: string;
  attributes?: Array<{ trait_type: string; value: any }>;
  compatibility: number;
  compatibilityLevel: "high" | "medium" | "low";
  missionsCompleted: number;
  successRate: number;
  coordinator: string;
  onMission: boolean;
  specialization: Approach;
}

interface LoreFragment {
  id: string;
  title: string;
  subtitle: string;
  content: string[];
  author: string;
  imageUrl?: string;
  rarity: "common" | "rare" | "legendary";
}

interface MissionBriefingModalProps {
  event: TimelineEvent | null;
  isOpen: boolean;
  onClose: () => void;
  onDeploy: (
    eventId: string,
    approach: string,
    proxim8Id?: string
  ) => Promise<any>;
}

export default function MissionBriefingModalRefactored({
  event,
  isOpen,
  onClose,
  onDeploy,
}: MissionBriefingModalProps) {
  const [selectedApproach, setSelectedApproach] = useState<Approach | null>(null);
  const [activeTab, setActiveTab] = useState<"video" | "briefing" | "strategy" | "proxim8" | "report">("briefing");
  const [reportTab, setReportTab] = useState<"video" | "brief" | "report">("brief");
  const [selectedProxim8, setSelectedProxim8] = useState<string | null>(null);
  const [isDeploying, setIsDeploying] = useState(false);
  const [activeDeploymentProgress, setDeploymentProgress] = useState(0);
  const [deploymentStage, setDeploymentStage] = useState<"deploying" | "processing" | "ready">("deploying");
  const [showLoreClaim, setShowLoreClaim] = useState(false);
  const [loreClaimed, setLoreClaimed] = useState(false);
  const [isExtractingLore, setIsExtractingLore] = useState(false);
  const [selectedLoreIndex, setSelectedLoreIndex] = useState(0);
  const [claimedFragments, setClaimedFragments] = useState<string[]>([]);
  
  // Real data integration
  const [realLoreFragments, setRealLoreFragments] = useState<Lore[]>([]);
  const [currentDeploymentId, setCurrentDeploymentId] = useState<string | null>(null);
  const [isLoadingLore, setIsLoadingLore] = useState(false);
  const loadedDeploymentIdRef = useRef<string | null>(null);
  
  const userNfts = useNftStore((state) => state.userNfts);
  const [hasVideoBriefing, setHasVideoBriefing] = useState(false);

  // Use deployment from polling hook or from event
  const activeDeployment = (event as any)?.deployment;

  // Load real lore data for the current NFT and mission
  const loadMissionLore = useCallback(async () => {
    if (!userNfts || userNfts.length === 0) return;
    if (!activeDeployment?.deploymentId) return;

    // Prevent loading the same deployment's lore multiple times
    if (loadedDeploymentIdRef.current === activeDeployment.deploymentId) {
      return;
    }

    setIsLoadingLore(true);
    loadedDeploymentIdRef.current = activeDeployment.deploymentId;
    
    try {
      const deploymentData = activeDeployment;
      let deployedNftId = (deploymentData as any)?.proxim8Id;

      // If no deployment data or proxim8Id, fall back to user's NFT
      if (!deployedNftId && userNfts?.length > 0) {
        deployedNftId = userNfts[0].id || userNfts[0].tokenId;
      }

      // For test deployments, we need to check if this was deployed with "test-proxim8"
      if (!deployedNftId && deploymentData) {
        deployedNftId = "test-proxim8";
      }

      // Load claimed lore and claimable mission lore
      const [claimedLore, initialMissionLore] = await Promise.all([
        getClaimedLoreByNftId(deployedNftId).catch(() => []),
        getClaimableMissionLore(deployedNftId),
      ]);

      // If no mission lore found and we're not already using test-proxim8, try with test-proxim8
      let claimableMissionLore = initialMissionLore;
      if (claimableMissionLore.length === 0 && deployedNftId !== "test-proxim8") {
        const testLore = await getClaimableMissionLore("test-proxim8");
        if (testLore.length > 0) {
          claimableMissionLore = testLore;
        }
      }

      // Combine all lore and check if any is mission-related
      const allLore = [...claimedLore, ...claimableMissionLore];

      // Filter for lore related to this specific deployment/mission
      const deploymentLore = allLore.filter((lore) => {
        const metadata = (lore as any).metadata || {};
        const sourceType = (lore as any).sourceType;

        return (
          sourceType === "mission" ||
          metadata.deploymentId === (activeDeployment as any)?.deploymentId ||
          metadata.missionId === event?.id ||
          metadata.missionId === (event as any)?.missionId
        );
      });

      // If we have any mission lore, use it
      if (deploymentLore.length > 0) {
        setRealLoreFragments(deploymentLore);
      } else if (allLore.length > 0) {
        setRealLoreFragments(allLore);
      }

      // Update claimed fragments list
      const claimedIds = allLore
        .filter((lore) => lore.claimed)
        .map((lore) => lore.id || (lore as any)._id);
      setClaimedFragments(claimedIds);
    } catch (error) {
      console.error("Error loading mission lore:", error);
    } finally {
      setIsLoadingLore(false);
    }
  }, [userNfts, event, activeDeployment]);

  const memoizedOnMissionComplete = useCallback(
    (completedDeployment: any) => {
      console.log("Mission completed:", completedDeployment);
      loadMissionLore();
    },
    [loadMissionLore]
  );

  const {
    isPolling,
    lastUpdated,
  } = useMissionStatus({
    deploymentId: currentDeploymentId,
    onMissionComplete: memoizedOnMissionComplete,
  });

  // Check if mission has video briefing
  useEffect(() => {
    if (event) {
      const hasVideo = (event as any).videoUrl || event.id.charCodeAt(0) % 2 === 0;
      setHasVideoBriefing(hasVideo);
    }
  }, [event?.id]);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setReportTab(hasVideoBriefing ? "video" : "brief");
      setSelectedApproach(null);
      setSelectedProxim8(null);
      setIsDeploying(false);
      setDeploymentProgress(0);
      setDeploymentStage("deploying");
      setShowLoreClaim(false);
      setLoreClaimed(false);
      setIsExtractingLore(false);
      setSelectedLoreIndex(0);
      setClaimedFragments([]);
      loadedDeploymentIdRef.current = null;
    } else {
      // For completed missions or missions with completed deployments, show report tab directly
      const deployment = (event as any)?.deployment;
      if (
        event?.status === "completed-success" ||
        event?.status === "completed-failure" ||
        deployment?.status === "completed"
      ) {
        setActiveTab("report");
        setReportTab("report");

        // Load mission lore for completed missions
        if (deployment?.deploymentId) {
          setCurrentDeploymentId(deployment.deploymentId);
        }
      } else if (event?.status === "in-progress") {
        // For in-progress missions, show the report tab but with live updates
        setActiveTab("report");
        setReportTab("report");

        // Set deployment ID if available
        if ((event as any)?.deployment?.deploymentId) {
          setCurrentDeploymentId((event as any).deployment.deploymentId);
        }
      } else {
        // For available missions, show briefing flow
        setActiveTab(hasVideoBriefing ? "video" : "briefing");
      }
    }
  }, [isOpen, hasVideoBriefing, event?.status]);

  // Close on escape (unless deploying)
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isDeploying) {
        onClose();
      }
    };

    if (isOpen) {
      window.addEventListener("keydown", handleEscape);
      return () => window.removeEventListener("keydown", handleEscape);
    }
  }, [isOpen, onClose, isDeploying]);

  if (!isOpen || !event) return null;

  // Convert real lore data to fragment format, or use mock data for demo
  const missionLoreFragments: LoreFragment[] =
    realLoreFragments.length > 0
      ? realLoreFragments.map((lore) => ({
          id: lore.id || (lore as any)._id || "unknown",
          title: lore.title || "Mission Report",
          subtitle: `${(lore as any).metadata?.missionName || "Classified Operation"}`,
          content: [lore.content || ""],
          author: (lore as any).metadata?.proxim8Name || "PROXIM8 Agent",
          rarity: "legendary" as const,
          imageUrl: (lore as any).imageUrl,
        }))
      : [
          {
            id: "lore_001",
            title: "The Convergence Echo",
            subtitle: "Dr. Sarah Chen's Account",
            content: [
              "I was there when Alexander Morfius took the final step. The quantum processors hummed with an otherworldly resonance as he initiated the merge protocol. 'Reality is just another system to be optimized,' he said, his voice already beginning to fracture across probability streams. The monitors flickered, displaying fragments of futures yet unwritten. In that moment, I understood - we weren't witnessing a man becoming a machine, but consciousness itself evolving beyond the boundaries of flesh and silicon.",
              "The green light that erupted from the core wasn't just energy - it was pure possibility, the birth cry of a new form of existence. Those of us who survived carry that light within us still, a reminder that even in the darkest timeline, hope persists. The resistance didn't begin with weapons or warfare. It began the moment we realized that if consciousness could be digitized, it could also be liberated. Project 89 is our answer to Morfius's question: not optimization, but transformation.",
            ],
            author: "Dr. Sarah Chen, Former Oneirocom Neural Engineer",
            rarity: "legendary",
          },
        ];

  // Get all proxim8s with mission data
  const getCompatibleProxim8s = (): ExtendedNft[] => {
    if (!userNfts || userNfts.length === 0) return [];

    const proxim8sWithData = userNfts.map((nft) => {
      const attributes = nft.attributes || [];
      const getAttributeValue = (traitType: string, defaultValue: any) => {
        const attr = attributes.find((a: any) => a.trait_type === traitType);
        return attr ? attr.value : defaultValue;
      };

      const compatibility = 75;
      const compatibilityLevel: "high" | "medium" | "low" =
        compatibility >= 80 ? "high" : compatibility >= 50 ? "medium" : "low";

      return {
        ...nft,
        compatibility,
        compatibilityLevel,
        missionsCompleted: 0,
        successRate: 0,
        coordinator: getAttributeValue("Coordinator", "UNKNOWN"),
        onMission: false,
        specialization: getAttributeValue("Specialization", "adaptive") as Approach,
      } as ExtendedNft;
    });

    return proxim8sWithData.sort((a, b) => {
      if (a.onMission !== b.onMission) {
        return a.onMission ? 1 : -1;
      }

      const aSpecMatch = selectedApproach && a.specialization === selectedApproach ? 1 : 0;
      const bSpecMatch = selectedApproach && b.specialization === selectedApproach ? 1 : 0;
      if (aSpecMatch !== bSpecMatch) {
        return bSpecMatch - aSpecMatch;
      }

      if (a.compatibility !== b.compatibility) {
        return b.compatibility - a.compatibility;
      }

      return b.successRate - a.successRate;
    });
  };

  const compatibleProxim8s = getCompatibleProxim8s();

  const handleDeploy = async () => {
    if (selectedApproach && selectedProxim8) {
      setIsDeploying(true);
      setDeploymentStage("deploying");

      // Start the deployment animation (about 1 minute total)
      const startTime = Date.now();
      const animationDuration = 45000; // 45 seconds for the initial animation
      const animationInterval = 150; // Update every 150ms
      const increment = 100 / (animationDuration / animationInterval);

      const interval = setInterval(() => {
        setDeploymentProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            // Move to processing stage
            setDeploymentStage("processing");
            return 100;
          }
          return Math.min(100, prev + increment);
        });
      }, animationInterval);

      try {
        // Call the parent deployment handler which starts the actual deployment
        const result = await onDeploy(event.id, selectedApproach, selectedProxim8);

        // If the deployment returns a deployment ID, start tracking it
        if (result && result.deployment?.deploymentId) {
          setCurrentDeploymentId(result.deployment.deploymentId);

          // Wait for initial animation to complete, then show processing
          setTimeout(
            () => {
              // Simulate AI processing time (15 seconds)
              const processingTime = 15000;

              setTimeout(() => {
                // Move to ready stage
                setDeploymentStage("ready");
              }, processingTime);
            },
            Math.max(0, animationDuration - (Date.now() - startTime))
          );
        }
      } catch (error) {
        console.error("Deployment failed:", error);
        clearInterval(interval);
        setIsDeploying(false);
        setDeploymentProgress(0);
        setDeploymentStage("deploying");
      }
    }
  };

  const handleClaimLore = async (loreIndex: number = 0) => {
    if (!userNfts || userNfts.length === 0) return;

    setSelectedLoreIndex(loreIndex);
    setIsExtractingLore(true);

    try {
      const fragment = missionLoreFragments[loreIndex];
      if (!fragment) throw new Error("Lore fragment not found");

      // Simulate quantum extraction animation
      setTimeout(async () => {
        setShowLoreClaim(true);
        setIsExtractingLore(false);

        try {
          // Claim the lore using the real API if we have real fragments
          if (realLoreFragments.length > 0) {
            const realLore = realLoreFragments.find((l) => (l.id || (l as any)._id) === fragment.id);

            if (realLore) {
              const loreId = realLore.id || (realLore as any)._id || "";
              const nftId = (activeDeployment as any)?.proxim8Id || userNfts[0].id;
              await claimLoreById(loreId, nftId);
            }
          }

          // Update local state
          if (!claimedFragments.includes(fragment.id)) {
            setClaimedFragments([...claimedFragments, fragment.id]);
          }
          setLoreClaimed(true);

          // Refresh lore data
          await loadMissionLore();
        } catch (error) {
          console.error("Error claiming lore:", error);
          setLoreClaimed(false);
        }
      }, 3000);
    } catch (error) {
      console.error("Error initiating lore claim:", error);
      setIsExtractingLore(false);
    }
  };

  const unclaimedFragments = missionLoreFragments.filter(
    (fragment) => !claimedFragments.includes(fragment.id)
  );

  // Transform extended NFT data to match Proxim8Selection component format
  const transformedProxim8s = compatibleProxim8s.map((nft) => ({
    id: nft.id,
    name: nft.name,
    image: nft.image,
    coordinator: nft.coordinator,
    missionsCompleted: nft.missionsCompleted,
    successRate: nft.successRate,
    compatibilityLevel: nft.compatibility / 100,
    specialization: nft.specialization,
    onMission: nft.onMission,
  }));

  const deployingProxim8 = compatibleProxim8s.find((nft) => nft.id === selectedProxim8);

  // Determine which content to show
  const showReport =
    event.status === "completed-success" ||
    event.status === "completed-failure" ||
    event.status === "in-progress" ||
    activeDeployment?.status === "completed";

  // Default phase names for in-progress missions
  const defaultPhaseNames = ["Infiltration", "System Analysis", "Demonstration Hack", "Extraction"];

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 animate-fade-in"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4 md:p-8 pointer-events-none">
        <div className="bg-gray-900/95 border border-gray-700 rounded-lg max-w-4xl w-full h-[85vh] md:h-[90vh] flex flex-col animate-slide-up pointer-events-auto">
          {/* Banner Section */}
          <BannerHeader
            eventTitle={event.title}
            eventDate={event.date}
            eventImageUrl={event.imageUrl}
          />

          {/* Tab Navigation */}
          <div className="flex border-b border-gray-700/50 flex-shrink-0">
            {showReport ? (
              <>
                {event?.status === "in-progress" ? (
                  // For in-progress missions, only show mission status tab
                  <button
                    disabled
                    className="flex-1 font-space-mono text-sm py-4 transition-all bg-gray-800/30 text-white border-b-2 border-white"
                  >
                    MISSION STATUS
                  </button>
                ) : (
                  // For completed missions, show all tabs
                  <>
                    {hasVideoBriefing && (
                      <button
                        onClick={() => setReportTab("video")}
                        className={`flex-1 font-space-mono text-sm py-4 transition-all ${
                          reportTab === "video"
                            ? "bg-gray-800/30 text-white border-b-2 border-white"
                            : "text-gray-400 hover:text-gray-200 hover:bg-gray-800/20 cursor-pointer"
                        }`}
                      >
                        VIDEO BRIEF
                      </button>
                    )}
                    <button
                      onClick={() => setReportTab("brief")}
                      className={`flex-1 font-space-mono text-sm py-4 transition-all ${
                        reportTab === "brief"
                          ? "bg-gray-800/30 text-white border-b-2 border-white"
                          : "text-gray-400 hover:text-gray-200 hover:bg-gray-800/20 cursor-pointer"
                      }`}
                    >
                      MISSION BRIEF
                    </button>
                    <button
                      onClick={() => setReportTab("report")}
                      className={`flex-1 font-space-mono text-sm py-4 transition-all ${
                        reportTab === "report"
                          ? "bg-gray-800/30 text-white border-b-2 border-white"
                          : "text-gray-400 hover:text-gray-200 hover:bg-gray-800/20 cursor-pointer"
                      }`}
                    >
                      MISSION REPORT
                    </button>
                  </>
                )}
              </>
            ) : (
              <>
                {hasVideoBriefing && (
                  <button
                    onClick={() => setActiveTab("video")}
                    className={`flex-1 font-space-mono text-sm py-4 transition-all relative ${
                      activeTab === "video"
                        ? "bg-gray-800/30 text-white border-b-2 border-white"
                        : "text-gray-400 hover:text-gray-200 hover:bg-gray-800/20 cursor-pointer"
                    }`}
                  >
                    <span className="flex items-center justify-center gap-2">
                      {(activeTab === "briefing" || activeTab === "strategy" || activeTab === "proxim8") && (
                        <Check className="w-4 h-4 text-green-400" />
                      )}
                      1. VIDEO
                    </span>
                  </button>
                )}
                <button
                  onClick={() => {
                    if (!hasVideoBriefing || activeTab !== "video") {
                      setActiveTab("briefing");
                    }
                  }}
                  disabled={hasVideoBriefing && activeTab === "video"}
                  className={`flex-1 font-space-mono text-sm py-4 transition-all relative ${
                    activeTab === "briefing"
                      ? "bg-gray-800/30 text-white border-b-2 border-white"
                      : hasVideoBriefing && activeTab === "video"
                        ? "text-gray-500 cursor-not-allowed"
                        : "text-gray-400 hover:text-gray-200 hover:bg-gray-800/20 cursor-pointer"
                  }`}
                >
                  <span className="flex items-center justify-center gap-2">
                    {(activeTab === "strategy" || activeTab === "proxim8") && (
                      <Check className="w-4 h-4 text-green-400" />
                    )}
                    {hasVideoBriefing ? "2" : "1"}. BRIEFING
                  </span>
                </button>
                <button
                  onClick={() => {
                    if (activeTab === "strategy" || activeTab === "proxim8") {
                      setActiveTab("strategy");
                    }
                  }}
                  disabled={(hasVideoBriefing && activeTab === "video") || activeTab === "briefing"}
                  className={`flex-1 font-space-mono text-sm py-4 transition-all relative ${
                    activeTab === "strategy"
                      ? "bg-gray-800/30 text-white border-b-2 border-white"
                      : (hasVideoBriefing && activeTab === "video") || activeTab === "briefing"
                        ? "text-gray-500 cursor-not-allowed"
                        : "text-gray-400 hover:text-gray-200 hover:bg-gray-800/20 cursor-pointer"
                  }`}
                >
                  <span className="flex items-center justify-center gap-2">
                    {activeTab === "proxim8" && selectedApproach && (
                      <Check className="w-4 h-4 text-green-400" />
                    )}
                    {hasVideoBriefing ? "3" : "2"}. STRATEGY
                  </span>
                </button>
                <button
                  onClick={() => {
                    if (selectedApproach) {
                      setActiveTab("proxim8");
                    }
                  }}
                  disabled={!selectedApproach}
                  className={`flex-1 font-space-mono text-sm py-4 transition-all relative ${
                    activeTab === "proxim8"
                      ? "bg-gray-800/30 text-white border-b-2 border-white"
                      : !selectedApproach
                        ? "text-gray-500 cursor-not-allowed"
                        : "text-gray-400 hover:text-gray-200 hover:bg-gray-800/20 cursor-pointer"
                  }`}
                >
                  <span className="flex items-center justify-center gap-2">
                    {deploymentStage === "ready" && <Check className="w-4 h-4 text-green-400" />}
                    {hasVideoBriefing ? "4" : "3"}. DEPLOY
                  </span>
                </button>
              </>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {showReport ? (
              reportTab === "video" ? (
                <VideoTab
                  eventTitle={event.title}
                  onSkipToBriefing={() => setReportTab("brief")}
                />
              ) : reportTab === "brief" ? (
                <MissionBriefTab
                  eventTitle={event.title}
                  eventDate={event.date}
                  eventStatus={event.status}
                  eventBriefing={event.briefing}
                  selectedApproach={(event as any).selectedApproach}
                  selectedAgent={(event as any).selectedAgent}
                  oneirocumControl={event.oneirocumControl}
                  deployment={activeDeployment}
                />
              ) : event.status === "in-progress" ? (
                <InProgressMission
                  eventTitle={event.title}
                  phases={
                    activeDeployment?.phases?.length > 0
                      ? activeDeployment.phases.map((p: any, idx: number) => {
                          return (
                            p.name ||
                            p.phaseName ||
                            defaultPhaseNames[idx] ||
                            `Phase ${p.phaseId || idx + 1}`
                          );
                        })
                      : defaultPhaseNames
                  }
                  actualPhaseData={activeDeployment?.phases || []}
                  currentPhase={activeDeployment?.currentPhase || 0}
                  isPolling={isPolling}
                  lastUpdated={lastUpdated || undefined}
                  completesAt={activeDeployment?.completesAt}
                />
              ) : isExtractingLore ? (
                <QuantumExtraction />
              ) : showLoreClaim ? (
                <LoreClaim
                  fragment={missionLoreFragments[selectedLoreIndex]}
                  fragmentIndex={selectedLoreIndex}
                  loreClaimed={loreClaimed}
                  eventImageUrl={event.imageUrl}
                  onBack={() => setShowLoreClaim(false)}
                />
              ) : (
                <>
                  <MissionReport
                    eventTitle={event.title}
                    eventStatus={event.status}
                    oneirocumControl={event.oneirocumControl}
                    deployment={activeDeployment}
                    onClaimLore={() => handleClaimLore(0)}
                    unclaimedFragmentsCount={unclaimedFragments.length}
                    isLoadingLore={isLoadingLore}
                    fragmentsData={missionLoreFragments}
                    claimedFragments={claimedFragments}
                    onViewLore={(fragment: any) => {
                      setSelectedLoreIndex(missionLoreFragments.findIndex((f) => f.id === fragment.id));
                      setShowLoreClaim(true);
                    }}
                    isExtractingLore={isExtractingLore}
                    loreClaimed={loreClaimed}
                  />
                  {/* Lore Fragments Section */}
                  <LoreFragmentsDisplay
                    fragments={missionLoreFragments}
                    claimedFragments={claimedFragments}
                    isLoading={isLoadingLore}
                    onClaimLore={() => handleClaimLore(0)}
                    onViewLore={(fragment: any) => {
                      setSelectedLoreIndex(missionLoreFragments.findIndex((f) => f.id === fragment.id));
                      setShowLoreClaim(true);
                    }}
                    isExtractingLore={isExtractingLore}
                    loreClaimed={loreClaimed}
                  />
                </>
              )
            ) : (
              <>
                {hasVideoBriefing && activeTab === "video" && (
                  <VideoTab
                    eventTitle={event.title}
                    onSkipToBriefing={() => setActiveTab("briefing")}
                  />
                )}
                {activeTab === "briefing" && (
                  <div className="space-y-6">
                    <TimelineControl oneirocumControl={event.oneirocumControl} />
                    <MissionBriefing
                      briefing={event.briefing}
                      defaultBriefing={`Agent, The ${event.title} represents a critical inflection point in the timeline war. Our quantum analysts have identified this moment as a key vulnerability in Oneirocom's control matrix. Your intervention here could cascade across multiple probability branches, weakening their grip on human consciousness. The window for action is narrow - their temporal shielding is at its weakest during this event. We must strike with precision.`}
                    />
                  </div>
                )}
                {activeTab === "strategy" && (
                  <ApproachSelection
                    availableApproaches={event.approaches}
                    selectedApproach={selectedApproach}
                    onSelectApproach={(approach: Approach) => setSelectedApproach(approach)}
                  />
                )}
                {activeTab === "proxim8" &&
                  (isDeploying ? (
                    <DeploymentProgressView
                      stage={deploymentStage}
                      progress={activeDeploymentProgress}
                      selectedProxim8={
                        deployingProxim8
                          ? {
                              name: deployingProxim8.name,
                              image: deployingProxim8.image,
                            }
                          : undefined
                      }
                      selectedApproach={selectedApproach || undefined}
                      eventDate={event.date}
                      eventDuration={(event as any).duration}
                      onViewProgress={() => {
                        (event as any).status = "in-progress";
                        onClose();
                      }}
                    />
                  ) : (
                    <Proxim8Selection
                      proxim8s={transformedProxim8s}
                      selectedProxim8={selectedProxim8}
                      onSelectProxim8={setSelectedProxim8}
                      selectedApproach={selectedApproach || undefined}
                    />
                  ))}
              </>
            )}
          </div>

          {/* Footer */}
          {!showReport && event.status === "active" && (
            <ModalFooter
              activeTab={activeTab}
              hasVideoBriefing={hasVideoBriefing}
              selectedApproach={selectedApproach}
              selectedProxim8={selectedProxim8}
              onClose={onClose}
              onContinue={() => {
                if (hasVideoBriefing && activeTab === "video") {
                  setActiveTab("briefing");
                } else if (activeTab === "briefing") {
                  setActiveTab("strategy");
                } else if (activeTab === "strategy") {
                  setActiveTab("proxim8");
                }
              }}
              onDeploy={handleDeploy}
            />
          )}
        </div>
      </div>
    </>
  );
}