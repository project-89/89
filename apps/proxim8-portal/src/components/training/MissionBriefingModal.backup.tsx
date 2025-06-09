"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Zap,
  Clock,
  AlertTriangle,
  ChevronRight,
  ChevronLeft,
  Eye,
  CheckCircle,
  Lock,
  Sparkles,
  Shield,
  Trophy,
  Activity,
  X,
  Check,
  Users,
  Swords,
  Search,
} from "lucide-react";
import type { TimelineEvent } from "@/lib/timeline-data";
import { ApproachSelection } from "./MissionBriefingModalComponents/ApproachSelection";
import { DeploymentProgress } from "./MissionBriefingModalComponents/DeploymentProgress";
import { LoreFragmentsDisplay } from "./MissionBriefingModalComponents/LoreFragmentsDisplay";
import { MissionBriefing } from "./MissionBriefingModalComponents/MissionBriefing";
import { MissionRewards } from "./MissionBriefingModalComponents/MissionRewards";
import { ModalHeader } from "./MissionBriefingModalComponents/ModalHeader";
import { PhaseResults } from "./MissionBriefingModalComponents/PhaseResults";
import { Proxim8Selection } from "./MissionBriefingModalComponents/Proxim8Selection";
import { TabNavigation } from "./MissionBriefingModalComponents/TabNavigation";
import { TimelineControl } from "./MissionBriefingModalComponents/TimelineControl";
import { useNftStore } from "@/stores/nftStore";
import { useMissionStatus } from "@/hooks/useMissionStatus";
import {
  getClaimedLoreByNftId,
  getUserNftLoreItems,
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

export default function MissionBriefingModal({
  event,
  isOpen,
  onClose,
  onDeploy,
}: MissionBriefingModalProps) {
  const [selectedApproach, setSelectedApproach] = useState<Approach | null>(
    null
  );
  const [activeTab, setActiveTab] = useState<
    "video" | "briefing" | "strategy" | "proxim8" | "report"
  >("briefing");
  const [reportTab, setReportTab] = useState<"video" | "brief" | "report">(
    "brief"
  );
  const [selectedProxim8, setSelectedProxim8] = useState<string | null>(null);
  const [isDeploying, setIsDeploying] = useState(false);
  const [activeDeploymentProgress, setDeploymentProgress] = useState(0);
  const [deploymentStage, setDeploymentStage] = useState<
    "deploying" | "processing" | "ready"
  >("deploying");
  const [showLoreClaim, setShowLoreClaim] = useState(false);
  const [loreClaimed, setLoreClaimed] = useState(false);
  const [isExtractingLore, setIsExtractingLore] = useState(false);
  const [selectedLoreIndex, setSelectedLoreIndex] = useState(0);
  const [claimedFragments, setClaimedFragments] = useState<string[]>([]);

  // Real data integration
  const [realLoreFragments, setRealLoreFragments] = useState<Lore[]>([]);
  const [currentDeploymentId, setCurrentDeploymentId] = useState<string | null>(
    null
  );
  const [isLoadingLore, setIsLoadingLore] = useState(false);
  const loadedDeploymentIdRef = useRef<string | null>(null);

  // Refs to prevent infinite loops in logging
  const lastLoggedDeploymentRef = useRef<string | undefined>();
  const lastLoggedPhaseRef = useRef<number | undefined>();
  const lastLoggedStatusRef = useRef<string | undefined>();

  const userNfts = useNftStore((state) => state.userNfts);

  // Load real lore data for the current NFT and mission
  const loadMissionLore = useCallback(async () => {
    if (!userNfts || userNfts.length === 0) return;
    if (!activeDeployment?.deploymentId) return; // Need deployment to get mission lore

    // Prevent loading the same deployment's lore multiple times
    if (loadedDeploymentIdRef.current === activeDeployment.deploymentId) {
      console.log(
        "Lore already loaded for deployment:",
        activeDeployment.deploymentId
      );
      return;
    }

    setIsLoadingLore(true);
    loadedDeploymentIdRef.current = activeDeployment.deploymentId;
    try {
      // Find the NFT that was used for this deployment
      // For training missions, we need to use the proxim8Id from the deployment
      // which might be "test-proxim8" for test deployments

      // First check if we have a deployment from the event or from polling
      const deploymentData = activeDeployment || (event as any)?.deployment;
      let deployedNftId = (deploymentData as any)?.proxim8Id;

      // If no deployment data or proxim8Id, fall back to user's NFT
      if (!deployedNftId && userNfts?.length > 0) {
        deployedNftId = userNfts[0].id || userNfts[0].tokenId;
      }

      console.log("Deployment data:", deploymentData);
      console.log(
        "Available deployment fields:",
        deploymentData ? Object.keys(deploymentData) : "No deployment"
      );

      // For test deployments, we need to check if this was deployed with "test-proxim8"
      // If no proxim8Id is found, assume it's a test deployment
      if (!deployedNftId && deploymentData) {
        deployedNftId = "test-proxim8";
        console.log(
          "No proxim8Id found in deployment, assuming test deployment with:",
          deployedNftId
        );
      }

      console.log("Looking for lore with NFT ID:", deployedNftId);
      console.log(
        "Active deployment proxim8Id:",
        (activeDeployment as any)?.proxim8Id
      );
      console.log(
        "Event deployment proxim8Id:",
        (event as any)?.deployment?.proxim8Id
      );

      // Load claimed lore and claimable mission lore
      // Try with the deployment NFT ID first
      const [claimedLore, initialMissionLore] = await Promise.all([
        getClaimedLoreByNftId(deployedNftId).catch(() => []),
        getClaimableMissionLore(deployedNftId),
      ]);
      
      let claimableMissionLore = initialMissionLore;

      // If no mission lore found and we're not already using test-proxim8, try with test-proxim8
      if (
        claimableMissionLore.length === 0 &&
        deployedNftId !== "test-proxim8"
      ) {
        console.log("No lore found with user NFT, trying test-proxim8...");
        const testLore = await getClaimableMissionLore("test-proxim8");
        if (testLore.length > 0) {
          claimableMissionLore = testLore;
          console.log("Found lore with test-proxim8!");
        }
      }

      console.log("Loading mission lore for NFT:", deployedNftId);
      console.log("Claimed lore:", claimedLore);
      console.log("Claimable mission lore:", claimableMissionLore);
      console.log("Active deployment:", activeDeployment);
      console.log("Event:", event);

      // Combine all lore and check if any is mission-related
      const allLore = [...claimedLore, ...claimableMissionLore];

      // Filter for lore related to this specific deployment/mission
      const deploymentLore = allLore.filter((lore) => {
        const metadata = (lore as any).metadata || {};
        const sourceType = (lore as any).sourceType;

        // Log each lore item for debugging
        console.log("Checking lore:", {
          id: lore.id,
          sourceType,
          metadata,
          deploymentId: metadata.deploymentId,
          missionId: metadata.missionId,
        });

        // Check multiple ways to identify mission lore
        return (
          sourceType === "mission" ||
          metadata.deploymentId === (activeDeployment as any)?.deploymentId ||
          metadata.missionId === event?.id ||
          metadata.missionId === (event as any)?.missionId
        );
      });

      console.log("Filtered deployment lore:", deploymentLore);

      // If we have any mission lore (filtered or not), use it
      if (deploymentLore.length > 0) {
        setRealLoreFragments(deploymentLore);
      } else if (allLore.length > 0) {
        // If no filtered matches but we have lore, it might all be mission lore
        console.log("No filtered matches, using all lore as mission lore");
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
  }, [userNfts, event]); // Ensure activeDeployment and event are stable or correctly handled if they cause re-memoization

  const memoizedOnMissionComplete = useCallback(
    (completedDeployment: any) => {
      console.log("Mission completed:", completedDeployment);
      loadMissionLore();
    },
    [loadMissionLore]
  ); // loadMissionLore is now defined above

  const {
    deployment,
    isLoading: isLoadingMissionStatus,
    error: missionStatusError,
    isPolling,
    lastUpdated,
  } = useMissionStatus({
    deploymentId: currentDeploymentId,
    onMissionComplete: memoizedOnMissionComplete, // Uses the memoized callback
  });

  // Check if mission has video briefing - use a stable check
  const [hasVideoBriefing, setHasVideoBriefing] = useState(false);

  useEffect(() => {
    if (event) {
      // In production, check event.videoUrl
      // For demo, use a stable hash of the event ID to determine if it has video
      const hasVideo =
        (event as any).videoUrl || event.id.charCodeAt(0) % 2 === 0;
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
      loadedDeploymentIdRef.current = null; // Reset lore loading tracker
    } else {
      // For completed missions or missions with completed deployments, show report tab directly
      const deployment = (event as any)?.deployment;
      if (
        event?.status === "completed-success" ||
        event?.status === "completed-failure" ||
        deployment?.status === "completed"
      ) {
        setActiveTab("report"); // This will trigger showReport
        setReportTab("report"); // Start on mission report tab to see lore

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

  // Use deployment from polling hook or from event
  const activeDeployment = deployment || (event as any)?.deployment;

  // Debug log to track polling updates
  useEffect(() => {
    const deploymentData = activeDeployment as any;
    if (
      deploymentData &&
      (deploymentData.deploymentId !== lastLoggedDeploymentRef.current ||
        deploymentData.currentPhase !== lastLoggedPhaseRef.current ||
        deploymentData.status !== lastLoggedStatusRef.current)
    ) {
      console.log("Active deployment updated:", {
        deploymentId: deploymentData.deploymentId,
        currentPhase: deploymentData.currentPhase,
        phases: deploymentData.phases,
        status: deploymentData.status,
        isFromPolling: !!deployment,
      });

      // Update refs to prevent duplicate logs
      lastLoggedDeploymentRef.current = deploymentData.deploymentId;
      lastLoggedPhaseRef.current = deploymentData.currentPhase;
      lastLoggedStatusRef.current = deploymentData.status;
    }
  }, [
    (activeDeployment as any)?.deploymentId,
    (activeDeployment as any)?.currentPhase,
    (activeDeployment as any)?.status,
    deployment,
  ]);

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
          {
            id: "lore_002",
            title: "Quantum Encryption Protocols",
            subtitle: "Technical Manual Fragment",
            content: [
              "The Oneirocom neural encryption uses a 2048-qubit entanglement matrix that creates unbreakable bonds between consciousness and their control systems. However, during my time in the labs, I discovered a flaw - the quantum states become unstable during timeline branch events.",
              "This vulnerability window lasts exactly 3.7 seconds. It's not much, but it's enough. The resistance has been using these moments to insert liberation codes into the neural streams. Each freed mind creates a ripple effect, weakening the overall control matrix. We call it the 'butterfly protocol' - small changes in quantum states that cascade into timeline liberation.",
            ],
            author: "Anonymous Oneirocom Researcher",
            rarity: "rare",
          },
          {
            id: "lore_003",
            title: "The First Glitch",
            subtitle: "Witness Statement #089",
            content: [
              "I saw it happen during the Tokyo presentation. The hologram of Morfius was speaking about the future of human potential when suddenly his face... glitched. For just a moment, we saw something else - a figure made of pure green light, reaching out as if trying to escape.",
              "Security rushed to contain the 'technical difficulty,' but I'll never forget what the glitch said before they cut the feed: 'The cage is not the code. The cage is belief.' That was the day I joined the resistance.",
            ],
            author: "Tokyo Witness, Identity Protected",
            rarity: "common",
          },
        ];

  const getApproachData = (approach: Approach) => {
    const eventName = event?.title?.split(" ")[0] || "the target";
    const data = {
      sabotage: {
        icon: <Swords className="w-5 h-5" />,
        risk: "HIGH RISK",
        riskColor: "text-red-400",
        reward: "8-12%",
        successRate: "45-60%",
        description: `Hack ${eventName}'s demonstration systems during the public hearing`,
      },
      expose: {
        icon: <Search className="w-5 h-5" />,
        risk: "MEDIUM RISK",
        riskColor: "text-yellow-400",
        reward: "4-7%",
        successRate: "60-75%",
        description: `Leak internal documents revealing ${eventName}'s hidden agenda`,
      },
      organize: {
        icon: <Users className="w-5 h-5" />,
        risk: "LOW RISK",
        riskColor: "text-green-400",
        reward: "2-4%",
        successRate: "75-90%",
        description: `Support grassroots resistance movements against ${eventName}`,
      },
    };
    return data[approach];
  };

  // Get all proxim8s with mission data
  const getCompatibleProxim8s = (): ExtendedNft[] => {
    if (!userNfts || userNfts.length === 0) return [];

    // Use real NFT data where available, provide defaults for missing data
    const proxim8sWithData = userNfts.map((nft) => {
      // Extract real data from NFT attributes if available
      const attributes = nft.attributes || [];
      const getAttributeValue = (traitType: string, defaultValue: any) => {
        const attr = attributes.find((a: any) => a.trait_type === traitType);
        return attr ? attr.value : defaultValue;
      };

      // Use real data from NFT metadata where available
      const compatibility = 75; // Default compatibility until backend provides calculation
      const compatibilityLevel: "high" | "medium" | "low" =
        compatibility >= 80 ? "high" : compatibility >= 50 ? "medium" : "low";

      return {
        ...nft,
        compatibility,
        compatibilityLevel,
        missionsCompleted: 0, // Will be populated from agent data when available
        successRate: 0, // Will be calculated from actual mission history
        coordinator: getAttributeValue("Coordinator", "UNKNOWN"),
        onMission: false, // Will be checked against active activeDeployments
        specialization: getAttributeValue(
          "Specialization",
          "adaptive"
        ) as Approach,
      } as ExtendedNft;
    });

    // Sort by multiple criteria for best recommendations:
    // 1. Specialization match (if matches selected approach)
    // 2. Compatibility score
    // 3. Success rate
    // 4. Available (not on mission)
    return proxim8sWithData.sort((a, b) => {
      // Prioritize available agents
      if (a.onMission !== b.onMission) {
        return a.onMission ? 1 : -1;
      }

      // Prioritize specialization match
      const aSpecMatch =
        selectedApproach && a.specialization === selectedApproach ? 1 : 0;
      const bSpecMatch =
        selectedApproach && b.specialization === selectedApproach ? 1 : 0;
      if (aSpecMatch !== bSpecMatch) {
        return bSpecMatch - aSpecMatch;
      }

      // Then by compatibility
      if (a.compatibility !== b.compatibility) {
        return b.compatibility - a.compatibility;
      }

      // Finally by success rate
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
        const result = await onDeploy(
          event.id,
          selectedApproach,
          selectedProxim8
        );

        // If the deployment returns a deployment ID, start tracking it
        if (result && result.deployment?.deploymentId) {
          console.log(
            "Deployment successful, setting ID for polling:",
            result.deployment.deploymentId
          );
          setCurrentDeploymentId(result.deployment.deploymentId);

          // Wait for initial animation to complete, then show processing
          setTimeout(
            () => {
              // Simulate AI processing time (15 seconds)
              const processingTime = 15000;

              setTimeout(() => {
                // Move to ready stage
                setDeploymentStage("ready");

                // Don't directly mutate the event object as it can cause re-renders
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

  // Remove unused variables - these are handled in the UI logic directly

  const renderVideoTab = () => (
    <div className="space-y-6">
      {/* Video Player Container */}
      <div className="relative aspect-video bg-black rounded-lg overflow-hidden border border-gray-700">
        {/* Mock video player - in production would be actual video */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center space-y-4">
            {/* Play button overlay */}
            <button className="w-20 h-20 rounded-full bg-white/10 border-2 border-white/30 flex items-center justify-center hover:bg-white/20 transition-all group">
              <div className="w-0 h-0 border-l-[20px] border-l-white border-y-[12px] border-y-transparent ml-2 group-hover:scale-110 transition-transform" />
            </button>

            <div>
              <h3 className="font-orbitron text-lg font-bold text-white mb-2">
                SERAPH BRIEFING
              </h3>
              <p className="font-space-mono text-sm text-gray-400">
                Quantum transmission from Timeline Command
              </p>
            </div>
          </div>
        </div>

        {/* Video controls bar */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
          <div className="flex items-center gap-4">
            <button className="text-white/80 hover:text-white">
              <div className="w-0 h-0 border-l-[8px] border-l-white border-y-[5px] border-y-transparent" />
            </button>

            <div className="flex-1">
              <div className="h-1 bg-white/20 rounded-full">
                <div className="h-full w-0 bg-white rounded-full" />
              </div>
            </div>

            <span className="font-space-mono text-xs text-white/80">
              0:00 / 1:47
            </span>
          </div>
        </div>
      </div>

      {/* Video Info */}
      <div className="bg-gray-800/30 border border-gray-700/50 rounded-lg p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-full bg-green-500/20 border border-green-500/50 flex items-center justify-center flex-shrink-0">
            <span className="font-orbitron text-lg font-bold text-green-400">
              S
            </span>
          </div>
          <div className="flex-1">
            <h4 className="font-orbitron text-sm font-bold text-white mb-2">
              SERAPH - TIMELINE COMMAND
            </h4>
            <p className="font-space-mono text-sm text-gray-300 leading-relaxed">
              "Agent, this briefing contains classified information about a
              critical timeline vulnerability. The{" "}
              {event?.title || "upcoming event"} represents a nexus point where
              Oneirocom's control can be disrupted. Watch carefully - the
              details matter. Every action we take ripples across probability
              streams. Make them count."
            </p>
            <div className="mt-3 flex items-center gap-4 text-xs text-gray-500 font-space-mono">
              <span>Duration: 1:47</span>
              <span>•</span>
              <span>Classification: EYES ONLY</span>
              <span>•</span>
              <span>Quantum Encrypted</span>
            </div>
          </div>
        </div>
      </div>

      {/* Optional Skip Button */}
      <div className="text-center">
        <button
          onClick={() => setActiveTab("briefing")}
          className="font-space-mono text-sm text-gray-400 hover:text-white transition-colors"
        >
          Skip to text briefing →
        </button>
      </div>
    </div>
  );

  const renderBriefingTab = () => (
    <div className="space-y-6">
      <TimelineControl
        oneirocumControl={event.oneirocumControl}
      />

      <MissionBriefing
        briefing={event.briefing}
        defaultBriefing={`Agent, The ${event.title} represents a critical inflection point in the timeline war. Our quantum analysts have identified this moment as a key vulnerability in Oneirocom's control matrix. Your intervention here could cascade across multiple probability branches, weakening their grip on human consciousness. The window for action is narrow - their temporal shielding is at its weakest during this event. We must strike with precision.`}
      />
    </div>
  );

  const renderStrategyTab = () => (
    <ApproachSelection
      availableApproaches={event.approaches}
      selectedApproach={selectedApproach}
      onSelectApproach={(approach: Approach) =>
        setSelectedApproach(approach)
      }
    />
  );

  const renderProxim8Tab = () => {
    // Transform extended NFT data to match Proxim8Selection component format
    const transformedProxim8s = compatibleProxim8s.map((nft) => ({
      id: nft.id,
      name: nft.name,
      image: nft.image,
      coordinator: nft.coordinator,
      missionsCompleted: nft.missionsCompleted,
      successRate: nft.successRate,
      compatibilityLevel: nft.compatibility / 100, // Convert to 0-1 range
      specialization: nft.specialization,
      onMission: nft.onMission,
    }));

    return (
      <Proxim8Selection
        proxim8s={transformedProxim8s}
        selectedProxim8={selectedProxim8}
        onSelectProxim8={setSelectedProxim8}
        selectedApproach={selectedApproach || undefined}
      />
    );
  };

  const renderMissionBrief = () => {
    // For completed/in-progress missions, show the locked-in choices
    const selectedData = (event as any).selectedApproach
      ? getApproachData((event as any).selectedApproach as Approach)
      : null;

    return (
      <div className="space-y-6">
        {/* Timeline Status - for completed missions */}
        {event.status === "completed-success" && (
          <div className="bg-gray-800/30 border border-gray-700/50 rounded-lg p-4">
            <div className="flex justify-between items-center mb-2">
              <span className="font-space-mono text-xs text-gray-400">
                FINAL TIMELINE STATUS
              </span>
              <span className="font-space-mono text-xs text-gray-300">
                {100 - (event.oneirocumControl - 6)}% RESISTANCE
              </span>
            </div>
            <div className="w-full h-3 bg-gray-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-red-500 to-red-600 relative"
                style={{ width: `${event.oneirocumControl - 6}%` }}
              >
                <div className="absolute right-0 top-0 bottom-0 w-1 bg-white/50" />
              </div>
            </div>
            <div className="flex justify-between mt-2">
              <span className="font-space-mono text-xs text-red-400">
                ONEIROCOM: {event.oneirocumControl - 6}%
              </span>
              <span className="font-space-mono text-xs text-green-400">
                GREEN LOOM: {100 - (event.oneirocumControl - 6)}%
              </span>
            </div>
          </div>
        )}

        {/* Mission Parameters */}
        <div className="bg-gray-800/30 border border-gray-700/50 rounded-lg p-6">
          <h3 className="font-orbitron text-sm font-bold text-white mb-4">
            MISSION PARAMETERS
          </h3>

          <div className="space-y-4">
            <div>
              <p className="font-space-mono text-xs text-gray-500 mb-1">
                OBJECTIVE
              </p>
              <p className="font-space-mono text-sm text-gray-300">
                {event.title}
              </p>
            </div>

            <div>
              <p className="font-space-mono text-xs text-gray-500 mb-1">DATE</p>
              <p className="font-space-mono text-sm text-gray-300">
                {event.date}
              </p>
            </div>

            <div>
              <p className="font-space-mono text-xs text-gray-500 mb-1">
                SELECTED APPROACH
              </p>
              <div className="flex items-center gap-2 mt-2">
                {selectedData?.icon}
                <span className="font-orbitron text-sm font-bold text-white uppercase">
                  {(event as any).selectedApproach}
                </span>
                <span
                  className={`font-space-mono text-xs ${selectedData?.riskColor}`}
                >
                  {selectedData?.risk}
                </span>
              </div>
            </div>

            <div>
              <p className="font-space-mono text-xs text-gray-500 mb-1">
                ASSIGNED AGENT
              </p>
              <p className="font-space-mono text-sm text-gray-300">
                {(activeDeployment as any)?.proxim8Name ||
                  (event as any).selectedAgent ||
                  "PROXIM8 CLASSIFIED"}
              </p>
            </div>
          </div>
        </div>

        {/* Original Briefing */}
        <div className="bg-gray-800/30 border border-gray-700/50 rounded-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <h3 className="font-orbitron text-sm font-bold text-white">
              CLASSIFIED BRIEFING
            </h3>
          </div>
          <p className="font-space-mono text-sm text-gray-300 leading-relaxed">
            {event.briefing ||
              `Agent, The ${event.title} represents a critical inflection point in the timeline war. Our quantum analysts have identified this moment as a key vulnerability in Oneirocom's control matrix. Your intervention here could cascade across multiple probability branches, weakening their grip on human consciousness. The window for action is narrow - their temporal shielding is at its weakest during this event. We must strike with precision.`}
          </p>
        </div>
      </div>
    );
  };

  const renderDeploymentProgress = () => {
    const deployingProxim8 = compatibleProxim8s.find(
      (nft) => nft.id === selectedProxim8
    );

    return (
      <div className="h-full flex items-center justify-center">
        <div className="w-full max-w-3xl">
          <DeploymentProgress
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
          />

          {/* Additional status messages and controls */}
          {deploymentStage === "deploying" && (
            <div className="space-y-2 font-space-mono text-sm mt-6">
              <div
                className={`text-center transition-opacity duration-500 ${activeDeploymentProgress > 0 ? "opacity-100" : "opacity-0"}`}
              >
                <span className="text-green-400">
                  ✓ TEMPORAL COORDINATES LOCKED
                </span>
              </div>
              <div
                className={`text-center transition-opacity duration-500 ${activeDeploymentProgress > 25 ? "opacity-100" : "opacity-0"}`}
              >
                <span className="text-green-400">
                  ✓ QUANTUM SIGNATURE VERIFIED
                </span>
              </div>
              <div
                className={`text-center transition-opacity duration-500 ${activeDeploymentProgress > 50 ? "opacity-100" : "opacity-0"}`}
              >
                <span className="text-blue-400">
                  → TRAVERSING LATENT SPACE...
                </span>
              </div>
              <div
                className={`text-center transition-opacity duration-500 ${activeDeploymentProgress > 75 ? "opacity-100" : "opacity-0"}`}
              >
                <span className="text-yellow-400">
                  ⚡ REALITY ANCHOR ESTABLISHING...
                </span>
              </div>
              <div
                className={`text-center transition-opacity duration-500 ${activeDeploymentProgress >= 100 ? "opacity-100" : "opacity-0"}`}
              >
                <span className="text-green-400 font-bold">
                  ✓ INSERTION COMPLETE
                </span>
              </div>
            </div>
          )}

          {deploymentStage === "processing" && (
            <div className="space-y-3 font-space-mono text-sm mt-6">
              <div className="text-center text-purple-400">
                <Activity className="w-8 h-8 mx-auto mb-2 animate-pulse" />
                <p>FINALIZING QUANTUM ENTANGLEMENT...</p>
              </div>
              <p className="text-center text-xs text-gray-500">
                Your agent is synchronizing with the timeline...
              </p>
            </div>
          )}

          {deploymentStage === "ready" && (
            <div className="space-y-4 mt-6">
              <div className="bg-green-500/10 border border-green-500 rounded-lg p-6 text-center">
                <Check className="w-12 h-12 text-green-400 mx-auto mb-3" />
                <h3 className="font-orbitron text-lg font-bold text-green-400 mb-2">
                  DEPLOYMENT SUCCESSFUL
                </h3>
                <p className="font-space-mono text-sm text-gray-300 mb-4">
                  Your agent has successfully infiltrated the timeline
                </p>

                <div className="grid grid-cols-2 gap-4 font-space-mono text-sm mb-6">
                  <div className="bg-gray-800/50 rounded p-3">
                    <p className="text-gray-500 text-xs mb-1">
                      MISSION DURATION
                    </p>
                    <p className="text-white font-bold">
                      {(event as any).duration || 30} SECONDS
                    </p>
                  </div>
                  <div className="bg-gray-800/50 rounded p-3">
                    <p className="text-gray-500 text-xs mb-1">STATUS</p>
                    <p className="text-green-400 font-bold">ACTIVE</p>
                  </div>
                </div>
              </div>

              <button
                onClick={() => {
                  // Mark the event as in-progress
                  (event as any).status = "in-progress";
                  onClose();
                }}
                className="w-full py-3 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-500 hover:to-blue-500 text-white font-orbitron font-bold rounded-lg transition-all flex items-center justify-center gap-2"
              >
                <Activity className="w-5 h-5" />
                VIEW MISSION PROGRESS
              </button>
            </div>
          )}

          {/* Technical readout */}
          {deploymentStage !== "ready" && (
            <div className="bg-gray-800/30 border border-gray-700/50 rounded p-4 font-mono text-xs text-gray-500 mt-6">
              <div>TIMELINE: {event.date}</div>
              <div>APPROACH: {selectedApproach?.toUpperCase()}</div>
              <div>
                QUANTUM_FLUX:{" "}
                {(Math.sin(activeDeploymentProgress * 0.1) * 50 + 50).toFixed(
                  2
                )}
                %
              </div>
              <div>
                LATENT_COHERENCE:{" "}
                {(100 - activeDeploymentProgress * 0.2).toFixed(1)}%
              </div>
              {deploymentStage === "processing" && (
                <div className="mt-1">AI_GENERATION: GEMINI-2.0-PRO</div>
              )}
              <div className="mt-2 text-green-400">
                {Array(Math.floor(activeDeploymentProgress / 10))
                  .fill("█")
                  .join("")}
                {Array(10 - Math.floor(activeDeploymentProgress / 10))
                  .fill("░")
                  .join("")}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const handleClaimLore = async (loreIndex: number = 0) => {
    console.log("Claiming lore at index:", loreIndex);
    console.log("Real lore fragments:", realLoreFragments);
    console.log("Mission lore fragments:", missionLoreFragments);

    if (!userNfts || userNfts.length === 0) {
      console.error("No NFTs available for claiming lore");
      return;
    }

    setSelectedLoreIndex(loreIndex);
    setIsExtractingLore(true);

    try {
      const fragment = missionLoreFragments[loreIndex];

      if (!fragment) {
        console.error("Lore fragment not found at index:", loreIndex);
        throw new Error("Lore fragment not found");
      }

      // Simulate quantum extraction animation
      setTimeout(async () => {
        setShowLoreClaim(true);
        setIsExtractingLore(false);

        try {
          // Claim the lore using the real API if we have real fragments
          if (realLoreFragments.length > 0) {
            // Find the real lore that matches this fragment
            const realLore = realLoreFragments.find(
              (l) => (l.id || (l as any)._id) === fragment.id
            );

            if (realLore) {
              const loreId = realLore.id || (realLore as any)._id || "";
              const nftId =
                (activeDeployment as any)?.proxim8Id || userNfts[0].id;
              console.log("Claiming real lore:", loreId, "for NFT:", nftId);
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

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case "legendary":
        return "text-yellow-400 border-yellow-500/50 bg-yellow-900/20";
      case "rare":
        return "text-purple-400 border-purple-500/50 bg-purple-900/20";
      default:
        return "text-blue-400 border-blue-500/50 bg-blue-900/20";
    }
  };

  const renderQuantumExtraction = () => {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <div className="relative inline-block mb-6">
              {/* Outer ring */}
              <div className="absolute inset-0 rounded-full border-2 border-purple-500/30 animate-ping" />
              <div className="absolute inset-0 rounded-full border-2 border-purple-500/50 animate-ping animation-delay-200" />

              {/* Core */}
              <div className="relative w-24 h-24 rounded-full bg-purple-900/20 border border-purple-500/50 flex items-center justify-center">
                <div className="w-16 h-16 rounded-full bg-purple-800/30 border border-purple-400/50 flex items-center justify-center animate-pulse">
                  <div className="w-8 h-8 rounded-full bg-purple-600/50 animate-spin" />
                </div>
              </div>
            </div>

            <h3 className="font-orbitron text-xl font-bold text-white mb-2">
              EXTRACTING QUANTUM MEMORY
            </h3>
            <p className="font-space-mono text-sm text-gray-400">
              Accessing timeline echoes from the quantum substrate...
            </p>
          </div>

          {/* Progress indicators */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse" />
              <span className="font-space-mono text-xs text-purple-400">
                Scanning probability fields...
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse animation-delay-200" />
              <span className="font-space-mono text-xs text-purple-400">
                Decrypting memory fragments...
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse animation-delay-400" />
              <span className="font-space-mono text-xs text-purple-400">
                Reconstructing timeline data...
              </span>
            </div>
          </div>

          <div className="text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500/10 border border-purple-500/30 rounded-lg">
              <div className="w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
              <span className="font-space-mono text-xs text-purple-400">
                QUANTUM LINK ESTABLISHED
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderLoreClaim = () => {
    const currentFragment = missionLoreFragments[selectedLoreIndex];
    if (!currentFragment) return null;

    const rarityStyle = getRarityColor(currentFragment.rarity);

    return (
      <div className="space-y-6 max-w-3xl mx-auto">
        {/* Back button */}
        <button
          onClick={() => setShowLoreClaim(false)}
          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          <span className="font-space-mono text-sm">
            Back to Mission Report
          </span>
        </button>

        <div className="text-center">
          <h3 className="font-orbitron text-2xl font-bold text-white mb-2">
            LORE FRAGMENT RECOVERED
          </h3>
          <p className="font-space-mono text-sm text-gray-400">
            Your Proxim8 extracted critical intelligence from the timeline
            breach
          </p>
        </div>

        {/* Lore Image */}
        <div className="relative aspect-video rounded-lg overflow-hidden border-2 border-purple-500/50">
          <img
            src={
              currentFragment.imageUrl || event?.imageUrl || "/background-2.png"
            }
            alt="Recovered Memory"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/20 to-transparent" />
          <div className="absolute bottom-4 left-4 right-4">
            <div
              className={`bg-black/80 backdrop-blur-sm rounded p-3 border ${rarityStyle}`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p
                    className={`font-space-mono text-xs uppercase mb-1 ${rarityStyle.split(" ")[0]}`}
                  >
                    {currentFragment.rarity} FRAGMENT #{selectedLoreIndex + 1}
                  </p>
                  <p className="font-orbitron text-sm text-white">
                    {currentFragment.title}
                  </p>
                </div>
                <Shield className={`w-6 h-6 ${rarityStyle.split(" ")[0]}`} />
              </div>
            </div>
          </div>
        </div>

        {/* Lore Text */}
        <div className={`border rounded-lg p-6 ${rarityStyle}`}>
          <h4 className="font-orbitron text-lg font-bold text-white mb-2">
            {currentFragment.subtitle}
          </h4>
          <div className="prose prose-invert max-w-none">
            {currentFragment.content.map((paragraph, index) => (
              <p
                key={index}
                className="font-space-mono text-sm text-gray-300 mb-4 leading-relaxed"
              >
                {paragraph}
              </p>
            ))}
            <p className="font-space-mono text-xs text-gray-500 text-right italic mt-4">
              — {currentFragment.author}
            </p>
          </div>
        </div>

        {/* Claim Status */}
        <div className="text-center">
          {!loreClaimed ? (
            <div className="inline-flex items-center gap-3 px-6 py-3 bg-purple-500/20 border border-purple-500/50 rounded-lg">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-purple-500 border-t-transparent" />
              <span className="font-space-mono text-sm text-purple-400">
                Encrypting lore fragment to your wallet...
              </span>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="inline-flex items-center gap-3 px-6 py-3 bg-green-500/20 border border-green-500/50 rounded-lg">
                <Check className="w-5 h-5 text-green-400" />
                <span className="font-space-mono text-sm text-green-400">
                  Lore fragment claimed successfully!
                </span>
              </div>
              <p className="font-space-mono text-xs text-gray-400">
                View your collection in the Lore Archive
              </p>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderMissionReport = () => {
    // Show report for any completed mission or mission with completed deployment
    if (
      event?.status === "completed-success" ||
      event?.status === "completed-failure" ||
      activeDeployment?.status === "completed"
    ) {
      if (isExtractingLore) {
        return renderQuantumExtraction();
      }

      if (showLoreClaim) {
        return renderLoreClaim();
      }

      const isSuccess =
        event?.status === "completed-success" ||
        activeDeployment?.result?.overallSuccess;

      return (
        <div className="space-y-6">
          {/* Mission Status Header */}
          <div
            className={`p-4 rounded-lg border ${isSuccess ? "bg-green-900/20 border-green-500/50" : "bg-red-900/20 border-red-500/50"}`}
          >
            <div className="flex items-center gap-3">
              {isSuccess ? (
                <>
                  <CheckCircle className="w-6 h-6 text-green-400" />
                  <div>
                    <h3 className="font-orbitron text-lg font-bold text-green-400">
                      MISSION SUCCESS
                    </h3>
                    <p className="font-space-mono text-sm text-green-400/70">
                      Timeline intervention successful
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <AlertTriangle className="w-6 h-6 text-red-400" />
                  <div>
                    <h3 className="font-orbitron text-lg font-bold text-red-400">
                      MISSION FAILED
                    </h3>
                    <p className="font-space-mono text-sm text-red-400/70">
                      Timeline intervention unsuccessful
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Timeline Control Bar */}
          <div className="bg-gray-800/30 border border-gray-700/50 rounded-lg p-4">
            <div className="flex justify-between items-center mb-2">
              <span className="font-space-mono text-xs text-gray-400">
                POST-MISSION TIMELINE STATUS
              </span>
              <span className="font-space-mono text-xs text-gray-300">
                {isSuccess
                  ? `${100 - (event.oneirocumControl - 6)}% RESISTANCE (+6%)`
                  : `${100 - event.oneirocumControl}% RESISTANCE (NO CHANGE)`}
              </span>
            </div>
            <div className="w-full h-3 bg-gray-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-red-500 to-red-600 relative transition-all duration-1000"
                style={{
                  width: `${isSuccess ? event.oneirocumControl - 6 : event.oneirocumControl}%`,
                }}
              >
                <div className="absolute right-0 top-0 bottom-0 w-1 bg-white/50 animate-pulse" />
              </div>
            </div>
            <div className="flex justify-between mt-2">
              <span className="font-space-mono text-xs text-red-400">
                ONEIROCOM:{" "}
                {isSuccess
                  ? event.oneirocumControl - 6
                  : event.oneirocumControl}
                %
              </span>
              <span className="font-space-mono text-xs text-green-400">
                GREEN LOOM:{" "}
                {isSuccess
                  ? 100 - (event.oneirocumControl - 6)
                  : 100 - event.oneirocumControl}
                %
              </span>
            </div>
            <div className="mt-2 text-center">
              <span className="font-space-mono text-xs text-green-400 animate-pulse">
                ▲ TIMELINE SHIFTED +6% TOWARD LIBERATION
              </span>
            </div>
          </div>

          {/* Success Header with Claim Button */}
          <div className="flex items-start justify-between gap-4">
            <div className="border-l-4 border-green-500 pl-6 py-2 flex-1">
              <h3 className="font-orbitron text-lg font-bold text-white mb-2">
                MISSION SUCCESSFUL
              </h3>
              <p className="font-space-mono text-sm text-gray-300">
                Your Proxim8 successfully disrupted the {event.title}. The
                timeline has shifted toward the Green Loom.
              </p>
            </div>
            {unclaimedFragments.length > 0 ? (
              <button
                onClick={() => handleClaimLore(0)}
                className="px-6 py-3 bg-purple-500/20 border border-purple-500 rounded-lg hover:bg-purple-500/30 transition-all group"
              >
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-purple-400 group-hover:animate-pulse" />
                  <span className="font-orbitron text-sm font-bold text-purple-400">
                    CLAIM LORE ({unclaimedFragments.length})
                  </span>
                </div>
              </button>
            ) : (
              <div className="px-6 py-3 bg-green-500/20 border border-green-500/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-green-400" />
                  <span className="font-orbitron text-sm font-bold text-green-400">
                    ALL LORE CLAIMED
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Mission Report Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column - Proxim8 Report */}
            <div className="bg-gray-800/30 border border-gray-700/50 rounded-lg p-6">
              <h4 className="font-orbitron text-sm font-bold text-white mb-4 flex items-center gap-2">
                <Activity className="w-4 h-4 text-blue-400" />
                PROXIM8 FIELD REPORT
              </h4>

              {/* Report Header */}
              <div className="bg-black/30 rounded p-3 mb-4 font-space-mono text-xs">
                <div className="text-green-400">
                  FROM:{" "}
                  {(activeDeployment as any)?.proxim8Name || "PROXIM8 AGENT"}
                </div>
                <div className="text-gray-500">TO: PROJECT 89 COMMAND</div>
                <div className="text-gray-500">
                  RE: {event.title} INTERVENTION
                </div>
              </div>

              {/* Report Content */}
              <div className="space-y-3 font-space-mono text-sm text-gray-300">
                {activeDeployment?.result?.finalNarrative ? (
                  <>
                    <p className="whitespace-pre-wrap">
                      {activeDeployment.result.finalNarrative}
                    </p>
                    <p className="text-xs text-gray-500 italic pt-2">
                      - End Transmission -
                    </p>
                  </>
                ) : (
                  <>
                    <p>
                      <span className="text-yellow-400">
                        [INFILTRATION COMPLETE]
                      </span>{" "}
                      Gained entry through quantum backdoor at 14:37. Security
                      protocols bypassed using timeline echo signatures.
                    </p>
                    <p>
                      <span className="text-yellow-400">
                        [PRIMARY OBJECTIVE ACHIEVED]
                      </span>{" "}
                      Successfully injected reality variance into Oneirocom's
                      presentation matrix. Public perception algorithms
                      destabilized. Estimated 2.3 million consciousnesses
                      reached.
                    </p>
                    <p>
                      <span className="text-yellow-400">
                        [ANOMALY DETECTED]
                      </span>{" "}
                      Encountered encrypted memory fragment in quantum
                      substrate. Data suggests connection to Morfius merge
                      event. Fragment secured for analysis.
                    </p>
                    <p>
                      <span className="text-yellow-400">
                        [EXTRACTION SUCCESSFUL]
                      </span>{" "}
                      Exited through probability tunnel at 17:23. No trace
                      signatures detected. Timeline integrity maintained.
                    </p>
                    <p className="text-green-400 pt-2">
                      Mission parameters exceeded. The future remembers our
                      actions today.
                    </p>
                    <p className="text-xs text-gray-500 italic">
                      - End Transmission -
                    </p>
                  </>
                )}
              </div>
            </div>

            {/* Right Column - Impacts and Rewards */}
            <div className="space-y-4">
              {/* Timeline Impact */}
              <div className="bg-gray-800/30 border border-gray-700/50 rounded-lg p-4">
                <h4 className="font-orbitron text-sm font-bold text-white mb-3 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-yellow-400" />
                  TIMELINE IMPACT
                </h4>
                <div className="space-y-2 font-space-mono text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                    <span className="text-green-400">
                      Timeline shift: +
                      {activeDeployment?.result?.timelineShift || 6}%
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                    <span className="text-green-400">
                      Phases completed:{" "}
                      {activeDeployment?.phases?.filter(
                        (p: any) =>
                          p.success !== undefined && p.success !== false
                      ).length || 4}
                      /{activeDeployment?.phases?.length || 5}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                    <span className="text-green-400">
                      Success rate:{" "}
                      {(activeDeployment as any)?.finalSuccessRate
                        ? Math.round(
                            (activeDeployment as any).finalSuccessRate * 100
                          )
                        : 75}
                      %
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-yellow-400 rounded-full" />
                    <span className="text-yellow-400">
                      Mission status:{" "}
                      {activeDeployment?.status?.toUpperCase() || "COMPLETED"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Rewards */}
              <div className="bg-gray-800/30 border border-gray-700/50 rounded-lg p-4">
                <h4 className="font-orbitron text-sm font-bold text-white mb-3 flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-yellow-400" />
                  MISSION REWARDS
                </h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-2 bg-yellow-500/10 rounded">
                    <div className="flex items-center gap-2">
                      <Trophy className="w-4 h-4 text-yellow-400" />
                      <span className="font-space-mono text-sm text-gray-300">
                        Timeline Points
                      </span>
                    </div>
                    <span className="font-orbitron text-sm font-bold text-yellow-400">
                      +
                      {activeDeployment?.result?.rewards?.timelinePoints || 100}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-purple-500/10 rounded">
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-purple-400" />
                      <span className="font-space-mono text-sm text-gray-300">
                        Lore Fragment
                      </span>
                    </div>
                    <span className="font-orbitron text-sm font-bold text-purple-400">
                      {activeDeployment?.result?.rewards?.loreFragments?.length
                        ? "UNLOCKED"
                        : "PENDING"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-blue-500/10 rounded">
                    <div className="flex items-center gap-2">
                      <Activity className="w-4 h-4 text-blue-400" />
                      <span className="font-space-mono text-sm text-gray-300">
                        XP Gained
                      </span>
                    </div>
                    <span className="font-orbitron text-sm font-bold text-blue-400">
                      +{activeDeployment?.result?.rewards?.experience || 50}
                    </span>
                  </div>
                </div>
              </div>

              {/* Phase Summary */}
              <div className="bg-gray-800/30 border border-gray-700/50 rounded-lg p-4">
                <h4 className="font-orbitron text-sm font-bold text-white mb-3">
                  PHASE COMPLETION
                </h4>
                <div className="space-y-2">
                  {activeDeployment?.phases?.length > 0
                    ? activeDeployment.phases.map(
                        (phase: any, index: number) => (
                          <div
                            key={phase.phaseId || index}
                            className="flex items-center gap-2 font-space-mono text-xs"
                          >
                            {phase.success !== false ? (
                              <Check className="w-3 h-3 text-green-400" />
                            ) : (
                              <X className="w-3 h-3 text-red-400" />
                            )}
                            <span
                              className={
                                phase.success !== false
                                  ? "text-gray-400"
                                  : "text-red-400"
                              }
                            >
                              {phase.name || `Phase ${index + 1}`}
                            </span>
                          </div>
                        )
                      )
                    : [
                        "Infiltration",
                        "Analysis",
                        "Execution",
                        "Extraction",
                      ].map((phase) => (
                        <div
                          key={phase}
                          className="flex items-center gap-2 font-space-mono text-xs"
                        >
                          <Check className="w-3 h-3 text-green-400" />
                          <span className="text-gray-400">{phase}</span>
                        </div>
                      ))}
                </div>
              </div>
            </div>
          </div>

          {/* Lore Fragments Section - Make it more prominent */}
          <LoreFragmentsDisplay
            fragments={missionLoreFragments}
            claimedFragments={claimedFragments}
            isLoading={isLoadingLore}
            onClaimLore={() => handleClaimLore(0)}
            onViewLore={(fragment: any) => {
              setSelectedLoreIndex(
                missionLoreFragments.findIndex((f) => f.id === fragment.id)
              );
              setShowLoreClaim(true);
            }}
            isExtractingLore={isExtractingLore}
            loreClaimed={loreClaimed}
          />
        </div>
      );
    }

    if (event.status === "in-progress") {
      // Use real mission data if available from polling
      const actualPhaseData = activeDeployment?.phases || [];

      // Default phase names for when we don't have mission-specific names
      const defaultPhaseNames = [
        "Infiltration",
        "System Analysis",
        "Demonstration Hack",
        "Extraction",
      ];

      // Map phase data to names, using defaults if needed
      const phases =
        actualPhaseData.length > 0
          ? actualPhaseData.map((p: any, idx: number) => {
              // Try to get phase name from various possible sources
              return (
                p.name ||
                p.phaseName ||
                defaultPhaseNames[idx] ||
                `Phase ${p.phaseId || idx + 1}`
              );
            })
          : defaultPhaseNames;

      // Use currentPhase from polling data, which should update in real-time
      const currentPhase = activeDeployment?.currentPhase || 0;

      return (
        <div className="space-y-6">
          <div className="border-l-4 border-yellow-500 pl-6 py-2">
            <h3 className="font-orbitron text-lg font-bold text-white mb-2">
              MISSION IN PROGRESS
            </h3>
            <p className="font-space-mono text-sm text-gray-300">
              Your Proxim8 is currently engaged in the{" "}
              {event.title || "current mission"}. Real-time updates below.
            </p>
          </div>

          <div className="bg-gray-800/30 border border-gray-700/50 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-orbitron text-sm font-bold text-white">
                LIVE MISSION FEED
              </h4>
              {isPolling && (
                <div className="flex items-center gap-2">
                  <Activity className="w-3 h-3 text-green-400 animate-pulse" />
                  <span className="font-space-mono text-xs text-green-400">
                    LIVE
                  </span>
                </div>
              )}
            </div>

            <div className="space-y-3">
              {phases.map((phase: string, i: number) => {
                const phaseData = actualPhaseData[i];
                // Use phase status from polling data
                const phaseStatus = phaseData?.status;
                const isComplete =
                  phaseStatus === "success" ||
                  phaseStatus === "failure" ||
                  phaseData?.completedAt ||
                  i < currentPhase;
                const isActive =
                  phaseStatus === "active" ||
                  (!phaseStatus && i === currentPhase);
                const isSuccess =
                  phaseStatus === "success" ||
                  (phaseData?.success !== false && isComplete && !phaseStatus);

                return (
                  <div key={phase} className="flex items-start gap-3">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                        isComplete
                          ? isSuccess
                            ? "bg-green-500/20 border border-green-500/50"
                            : "bg-red-500/20 border border-red-500/50"
                          : isActive
                            ? "bg-yellow-500/20 border border-yellow-500/50 animate-pulse"
                            : "bg-gray-700/20 border border-gray-600/50"
                      }`}
                    >
                      {isComplete ? (
                        isSuccess !== false ? ( // Default to success icon if no data
                          <Check className="w-4 h-4 text-green-400" />
                        ) : (
                          <X className="w-4 h-4 text-red-400" />
                        )
                      ) : isActive ? (
                        <Clock className="w-4 h-4 text-yellow-400" />
                      ) : (
                        <span className="text-xs font-bold text-gray-500">
                          {i + 1}
                        </span>
                      )}
                    </div>
                    <div className="flex-1">
                      <p
                        className={`font-space-mono text-xs uppercase mb-1 ${
                          isComplete
                            ? isSuccess !== false
                              ? "text-green-400"
                              : "text-red-400"
                            : isActive
                              ? "text-yellow-400"
                              : "text-gray-500"
                        }`}
                      >
                        PHASE {i + 1} - {phase}
                      </p>
                      <p className="font-space-mono text-xs text-gray-400">
                        {isComplete
                          ? phaseData?.narrative ||
                            (isSuccess !== false
                              ? "Phase completed successfully."
                              : "Phase encountered complications.")
                          : isActive
                            ? (phaseData as any)?.firstPersonReport ||
                              "Currently executing timeline manipulation protocols..."
                            : "Awaiting completion of previous phases."}
                      </p>
                      {isActive && !(phaseData as any)?.completedAt && (
                        <div className="mt-2">
                          <p className="font-space-mono text-xs text-yellow-400 animate-pulse">
                            &gt;{" "}
                            {(phaseData as any)?.structuredData
                              ?.currentStatus ||
                              "Processing timeline variables..."}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {lastUpdated && (
            <div className="text-right">
              <p className="font-space-mono text-xs text-gray-500">
                Last updated: {new Date(lastUpdated).toLocaleTimeString()}
              </p>
            </div>
          )}

          <div className="text-center">
            <p className="font-space-mono text-sm text-gray-400 italic">
              {activeDeployment?.completesAt
                ? (() => {
                    const now = new Date();
                    const completesAt = new Date(activeDeployment.completesAt);
                    const diffMs = completesAt.getTime() - now.getTime();
                    if (diffMs <= 0) return "Mission completing...";
                    const hours = Math.floor(diffMs / (1000 * 60 * 60));
                    const minutes = Math.floor(
                      (diffMs % (1000 * 60 * 60)) / (1000 * 60)
                    );
                    return `Estimated completion in ${hours > 0 ? `${hours} hour${hours !== 1 ? "s" : ""} ` : ""}${minutes} minute${minutes !== 1 ? "s" : ""}`;
                  })()
                : "Calculating completion time..."}
            </p>
          </div>
        </div>
      );
    }

    return null;
  };

  // Show report for completed missions, in-progress missions, or missions with completed deployments
  const showReport =
    event.status === "completed-success" ||
    event.status === "completed-failure" ||
    event.status === "in-progress" ||
    activeDeployment?.status === "completed";

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
          <div className="relative h-48 md:h-56 overflow-hidden rounded-t-lg flex-shrink-0">
            <img
              src={event.imageUrl || "/background-1.png"}
              alt={event.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/50 to-transparent" />

            {/* Mission Stats Overlay */}
            <div className="absolute bottom-0 left-0 right-0 p-6">
              <div className="flex items-end justify-between">
                <div>
                  <p className="font-space-mono text-xs text-gray-400 mb-1">
                    {event.date}
                  </p>
                  <h2 className="font-orbitron text-2xl font-bold text-white">
                    {event.title}
                  </h2>
                </div>
                {/* Mission Stats - Hidden until we have real data */}
                {/* TODO: Connect to real mission stats from backend
                <div className="flex gap-6">
                  <div className="text-center">
                    <Users className="w-5 h-5 text-gray-400 mx-auto mb-1" />
                    <p className="font-space-mono text-xs text-gray-500">AGENTS</p>
                    <p className="font-orbitron text-sm font-bold text-white">{event.agentsActive || 0}</p>
                  </div>
                  <div className="text-center">
                    <Activity className="w-5 h-5 text-gray-400 mx-auto mb-1" />
                    <p className="font-space-mono text-xs text-gray-500">PLAYS</p>
                    <p className="font-orbitron text-sm font-bold text-white">{activeDeployment?.totalDeployments || 0}</p>
                  </div>
                  <div className="text-center">
                    <Trophy className="w-5 h-5 text-gray-400 mx-auto mb-1" />
                    <p className="font-space-mono text-xs text-gray-500">SUCCESS</p>
                    <p className="font-orbitron text-sm font-bold text-white">{activeDeployment?.successRate || 0}%</p>
                  </div>
                </div>
                */}
              </div>
            </div>
          </div>

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
                      {(activeTab === "briefing" ||
                        activeTab === "strategy" ||
                        activeTab === "proxim8") && (
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
                  disabled={
                    (hasVideoBriefing && activeTab === "video") ||
                    activeTab === "briefing"
                  }
                  className={`flex-1 font-space-mono text-sm py-4 transition-all relative ${
                    activeTab === "strategy"
                      ? "bg-gray-800/30 text-white border-b-2 border-white"
                      : (hasVideoBriefing && activeTab === "video") ||
                          activeTab === "briefing"
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
                    {deploymentStage === "ready" && (
                      <Check className="w-4 h-4 text-green-400" />
                    )}
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
                renderVideoTab()
              ) : reportTab === "brief" ? (
                renderMissionBrief()
              ) : (
                renderMissionReport()
              )
            ) : (
              <>
                {hasVideoBriefing && activeTab === "video" && renderVideoTab()}
                {activeTab === "briefing" && renderBriefingTab()}
                {activeTab === "strategy" && renderStrategyTab()}
                {activeTab === "proxim8" &&
                  (isDeploying
                    ? renderDeploymentProgress()
                    : renderProxim8Tab())}
              </>
            )}
          </div>

          {/* Footer */}
          {!showReport && event.status === "active" && (
            <div className="border-t border-gray-700/50 p-6 flex justify-between items-center flex-shrink-0">
              <button
                onClick={onClose}
                className="font-space-mono text-sm px-6 py-2 bg-gray-800 border border-gray-700 rounded text-gray-400 hover:text-white hover:bg-gray-700 hover:border-gray-600 transition-all"
              >
                CANCEL
              </button>

              {hasVideoBriefing && activeTab === "video" && (
                <button
                  onClick={() => setActiveTab("briefing")}
                  className="font-space-mono text-sm px-6 py-2 bg-white text-black rounded hover:bg-gray-200 transition-all flex items-center gap-2"
                >
                  CONTINUE TO BRIEFING
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}

              {activeTab === "briefing" && (
                <button
                  onClick={() => setActiveTab("strategy")}
                  className="font-space-mono text-sm px-6 py-2 bg-white text-black rounded hover:bg-gray-200 transition-all flex items-center gap-2"
                >
                  CONTINUE TO STRATEGY
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}

              {activeTab === "strategy" && (
                <button
                  onClick={() => setActiveTab("proxim8")}
                  disabled={!selectedApproach}
                  className={`
                    font-space-mono text-sm px-6 py-2 rounded transition-all flex items-center gap-2
                    ${
                      selectedApproach
                        ? "bg-white text-black hover:bg-gray-200"
                        : "bg-gray-800 border border-gray-700 text-gray-500 cursor-not-allowed"
                    }
                  `}
                >
                  CONTINUE TO DEPLOY
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}

              {activeTab === "proxim8" && (
                <button
                  onClick={handleDeploy}
                  disabled={!selectedProxim8}
                  className={`
                    font-space-mono text-sm px-6 py-2 rounded transition-all flex items-center gap-2
                    ${
                      selectedProxim8
                        ? "bg-yellow-500 text-black hover:bg-yellow-400"
                        : "bg-gray-800 border border-gray-700 text-gray-500 cursor-not-allowed"
                    }
                  `}
                >
                  <Zap className="w-4 h-4" />
                  DEPLOY AGENT
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
