"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useWalletAuth } from "@/stores/walletAuthStore";
import { useNftStore } from "@/stores/nftStore";
import NFTImage from "@/components/common/NFTImage";
import LoreCard from "@/components/lore/LoreCard";
import LoreModal from "@/components/lore/LoreModal";
import LoreRevealModal from "@/components/lore/LoreRevealModal";
import { NFTMetadata } from "@/types/nft";
import { Lore } from "@/types/lore";
import {
  claimLore,
  getClaimedLoreByNftId,
  getAvailableLoreByNftId,
  getClaimableMissionLore,
} from "@/services/lore";
import { useAnalytics } from "@/hooks/useAnalytics";

interface AgentClientProps {
  agentId: string;
}

export default function AgentClient({ agentId }: AgentClientProps) {
  const router = useRouter();
  const { track } = useAnalytics();
  const { walletAddress, connected, isAuthenticated } = useWalletAuth();
  const [backgroundNumber] = useState(() => Math.floor(Math.random() * 19) + 1);
  const [activeTab, setActiveTab] = useState<
    "overview" | "lore" | "attributes"
  >("overview");

  // Lore state
  const [lore, setLore] = useState<Lore[] | null>(null);
  const [missionLore, setMissionLore] = useState<Lore[]>([]);
  const [hasUnclaimedLore, setHasUnclaimedLore] = useState(false);
  const [loreLoading, setLoreLoading] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [claimedLore, setClaimedLore] = useState<Lore | null>(null);
  const [selectedLore, setSelectedLore] = useState<Lore | null>(null);
  const [showLoreModal, setShowLoreModal] = useState(false);
  const [showRevealModal, setShowRevealModal] = useState(false);

  // Get agent data from store
  const userNfts = useNftStore((state) => state.userNfts);
  const agent = userNfts.find(
    (nft) => nft.tokenId === agentId || nft.id === agentId
  );

  // Redirect if no agent found
  useEffect(() => {
    if (!agent && userNfts.length > 0) {
      router.push("/my-proxim8s");
    }
  }, [agent, userNfts, router]);

  // Fetch lore data
  useEffect(() => {
    const fetchLoreData = async () => {
      if (!agent?.tokenId) return;

      setLoreLoading(true);
      try {
        const [claimedLoreData, availabilityData, claimableMissionLoreData] = await Promise.all([
          getClaimedLoreByNftId(agent.tokenId),
          getAvailableLoreByNftId(agent.tokenId),
          getClaimableMissionLore(agent.tokenId),
        ]);

        // Separate mission lore from other lore
        const allClaimedLore = claimedLoreData || [];
        const missionLoreItems = allClaimedLore.filter(l => 
          (l as any).sourceType === 'mission' || 
          (l as any).metadata?.missionId
        );
        const otherLore = allClaimedLore.filter(l => 
          !((l as any).sourceType === 'mission' || (l as any).metadata?.missionId)
        );

        setLore(otherLore.length > 0 ? otherLore : null);
        setMissionLore(missionLoreItems);
        
        // Check if there's unclaimed lore (including mission lore)
        const hasUnclaimedMissionLore = Array.isArray(claimableMissionLoreData) && claimableMissionLoreData.length > 0;
        setHasUnclaimedLore(availabilityData.hasUnclaimedLore || hasUnclaimedMissionLore);
      } catch (error) {
        console.error("Error fetching lore:", error);
        setLore(null);
        setMissionLore([]);
        setHasUnclaimedLore(false);
      } finally {
        setLoreLoading(false);
      }
    };

    fetchLoreData();
  }, [agent?.tokenId]);

  // Handle claiming lore
  const handleClaimLore = async () => {
    if (!walletAddress || !agent?.tokenId) return;

    track('agent_lore_claim_started', {
      agent_id: agentId,
      nft_id: agent.tokenId,
      agent_name: agent.name
    });

    try {
      setClaiming(true);
      const newLore = await claimLore(agent.tokenId);
      setLore((prevLore) => (prevLore ? [...prevLore, newLore] : [newLore]));
      setClaimedLore(newLore);
      setShowRevealModal(true);

      // Refresh availability
      const availabilityData = await getAvailableLoreByNftId(agent.tokenId);
      setHasUnclaimedLore(availabilityData.hasUnclaimedLore);
      
      track('agent_lore_claim_success', {
        agent_id: agentId,
        lore_id: newLore.id,
        lore_type: 'type' in newLore ? newLore.type : 'unknown',
        lore_title: newLore.title
      });
    } catch (error) {
      console.error("Error claiming lore:", error);
      track('agent_lore_claim_error', {
        agent_id: agentId,
        error_message: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setClaiming(false);
    }
  };

  // Handle lore card click to open modal
  const handleLoreClick = (loreItem: Lore) => {
    track('agent_lore_card_clicked', {
      agent_id: agentId,
      lore_id: loreItem.id,
      lore_type: 'type' in loreItem ? loreItem.type : 'unknown'
    });
    setSelectedLore(loreItem);
    setShowLoreModal(true);
  };

  // Close lore modal
  const closeLoreModal = () => {
    track('agent_lore_modal_closed', {
      agent_id: agentId,
      lore_id: selectedLore?.id
    });
    setShowLoreModal(false);
    setSelectedLore(null);
  };

  if (!agent) {
    return (
      <div className="min-h-screen bg-black text-gray-200 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500 mb-4 mx-auto"></div>
          <p className="font-space-mono text-sm text-gray-400">
            ACCESSING AGENT DATA...
          </p>
        </div>
      </div>
    );
  }

  // Extract attributes
  const personalityAttr = agent.attributes?.find(
    (attr) => attr.trait_type?.toLowerCase() === "personality"
  );
  const timelineAttr = agent.attributes?.find(
    (attr) => attr.trait_type?.toLowerCase() === "timeline impact"
  );
  const missionReadyAttr = agent.attributes?.find(
    (attr) => attr.trait_type?.toLowerCase() === "mission ready"
  );

  return (
    <div className="min-h-screen bg-black text-gray-200 relative overflow-hidden pt-24">
      {/* Background Image with vignette */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-20"
        style={{
          backgroundImage: `url('/background-${backgroundNumber}.png')`,
        }}
      />

      {/* Vignette Overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 0%, transparent 40%, rgba(0,0,0,0.6) 100%)",
        }}
      />


      {/* Content */}
      <div className="relative z-10 w-full">
        {/* Header Card - Simplified */}
        <div className="container mx-auto px-4 mb-6">
          <div className="bg-gray-900/60 backdrop-blur-sm border border-gray-700/50 rounded-lg p-4">
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-4">
                {/* Agent Icon/Portrait */}
                <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-primary-500 bg-black">
                  <NFTImage
                    src={agent.image}
                    alt={agent.name || "Proxim8 Agent"}
                    width={48}
                    height={48}
                    priority={true}
                    className="object-cover w-full h-full"
                  />
                </div>

                {/* Agent Name */}
                <h1 className="font-orbitron text-xl font-bold text-primary-500">
                  {agent.name || `PROXIM8 #${agent.tokenId}`}
                </h1>
              </div>
              
              {/* Back to Agents Button */}
              <button
                onClick={() => {
                  track('back_to_agents_clicked', { from_agent_id: agentId });
                  router.push("/my-proxim8s");
                }}
                className="flex items-center gap-2 px-4 py-2 bg-gray-800/80 hover:bg-gray-700/80 text-gray-300 hover:text-white rounded-lg transition-colors"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
                <span className="font-medium font-space-mono text-sm">Back to Agents</span>
              </button>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Agent Portrait & Stats */}
            <div className="lg:col-span-1 space-y-6">
              {/* Portrait Card */}
              <div className="bg-gray-900/60 backdrop-blur-sm border border-gray-700/50 rounded-lg overflow-hidden">
                <div className="aspect-square relative bg-black">
                  <NFTImage
                    src={agent.image}
                    alt={agent.name || "Proxim8 Agent"}
                    width={600}
                    height={600}
                    priority={true}
                    className="object-cover w-full h-full"
                  />
                </div>

                {/* Claim Lore Button */}
                {hasUnclaimedLore && (
                  <div className="p-4">
                    <button
                      onClick={handleClaimLore}
                      disabled={claiming}
                      className="w-full font-space-mono py-3 px-4 bg-accent-magenta/20 border border-accent-magenta rounded hover:bg-accent-magenta/30 transition-all disabled:opacity-50 animate-pulse"
                    >
                      {claiming ? "CLAIMING..." : "CLAIM LORE"}
                    </button>
                  </div>
                )}
              </div>

              {/* Attributes Card */}
              <div className="bg-gray-900/60 backdrop-blur-sm border border-gray-700/50 rounded-lg p-6">
                <h3 className="font-orbitron text-lg font-bold text-accent-magenta mb-4">
                  ATTRIBUTES
                </h3>
                <div className="space-y-3">
                  {agent.attributes
                    ?.filter(
                      (attr) => attr.trait_type?.toLowerCase() !== "personality"
                    )
                    .slice(0, 6)
                    .map((attr, index) => (
                      <div
                        key={index}
                        className="flex justify-between items-center"
                      >
                        <span className="font-space-mono text-xs text-gray-400">
                          {attr.trait_type?.toUpperCase()}
                        </span>
                        <span className="font-space-mono text-sm text-gray-200">
                          {attr.value}
                        </span>
                      </div>
                    ))}
                  {agent.attributes &&
                    agent.attributes.filter(
                      (attr) => attr.trait_type?.toLowerCase() !== "personality"
                    ).length > 6 && (
                      <button
                        onClick={() => {
                          track('view_all_attributes_clicked', { agent_id: agentId });
                          setActiveTab("attributes");
                        }}
                        className="font-space-mono text-xs text-primary-500 hover:text-primary-400 transition-colors"
                      >
                        VIEW ALL ({agent.attributes.length} TOTAL) →
                      </button>
                    )}
                </div>
              </div>
            </div>

            {/* Right Column - Tab Content */}
            <div className="lg:col-span-2">
              <div className="bg-gray-900/60 backdrop-blur-sm border border-gray-700/50 rounded-lg overflow-hidden">
                {/* Tab Navigation */}
                <div className="flex border-b border-gray-700/50 bg-gray-800/30">
                  {[
                    { id: "overview", label: "OVERVIEW", color: "primary" },
                    {
                      id: "lore",
                      label: "LORE",
                      color: "accent-magenta",
                      badge: lore?.length || 0,
                    },
                    {
                      id: "attributes",
                      label: "ALL ATTRIBUTES",
                      color: "accent-blue",
                    },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => {
                        track('agent_tab_clicked', {
                          agent_id: agentId,
                          tab_name: tab.id,
                          from_tab: activeTab
                        });
                        setActiveTab(tab.id as any);
                      }}
                      className={`flex-1 font-space-mono text-sm py-4 px-4 transition-all relative ${
                        activeTab === tab.id
                          ? `bg-gray-800/50 text-${tab.color}-500 border-b-2 border-${tab.color}-500`
                          : "text-gray-400 hover:text-gray-200 hover:bg-gray-800/30"
                      }`}
                    >
                      {tab.label}
                      {tab.badge !== undefined && tab.badge > 0 && (
                        <span className="ml-2 px-2 py-0.5 bg-accent-magenta/20 rounded-full text-xs">
                          {tab.badge}
                        </span>
                      )}
                      {tab.id === "lore" && hasUnclaimedLore && (
                        <span className="absolute top-2 right-2 w-2 h-2 bg-accent-magenta rounded-full animate-pulse"></span>
                      )}
                    </button>
                  ))}
                </div>

                {/* Tab Content */}
                <div className="p-6 min-h-[400px]">
                  {activeTab === "overview" && (
                    <div className="space-y-6">
                      <div>
                        <h3 className="font-orbitron text-lg font-bold text-primary-500 mb-4">
                          AGENT PROFILE
                        </h3>
                        <div className="bg-black/40 border border-gray-700/30 rounded-lg p-6">
                          {personalityAttr && (
                            <div className="mb-4">
                              <span className="font-space-mono text-xs text-gray-500">
                                PERSONALITY
                              </span>
                              <p className="font-space-mono text-sm ext-gray-300 mt-1">
                                {personalityAttr.value}
                              </p>
                            </div>
                          )}
                          <p className="font-space-mono text-sm text-gray-300 leading-relaxed">
                            {agent.description ||
                              `This Proxim8 agent is a unique AI consciousness from the year 2089, sent back through the quantum substrate to assist in timeline manipulation. Each agent carries specific memories and capabilities that can be deployed to alter critical junction points in the timeline.`}
                          </p>
                        </div>
                      </div>

                      {/* Mission History */}
                      <div>
                        <h3 className="font-orbitron text-lg font-bold text-primary-500 mb-4">
                          MISSION HISTORY
                        </h3>
                        {missionLore.length > 0 ? (
                          <div className="space-y-3">
                            {missionLore.map((mission) => (
                              <div 
                                key={mission.id} 
                                className="bg-black/40 border border-gray-700/30 rounded-lg p-4 hover:border-gray-600/50 transition-colors cursor-pointer"
                                onClick={() => handleLoreClick(mission)}
                              >
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <h4 className="font-orbitron text-sm font-bold text-green-400">
                                      {(mission as any).metadata?.missionName || mission.title || "CLASSIFIED MISSION"}
                                    </h4>
                                    <p className="font-space-mono text-xs text-gray-400 mt-1">
                                      {new Date(mission.createdAt || '').toLocaleDateString()}
                                    </p>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    {mission.claimedBy ? (
                                      <span className="font-space-mono text-xs text-purple-400">REPORT CLAIMED</span>
                                    ) : (
                                      <span className="font-space-mono text-xs text-green-400 animate-pulse">NEW REPORT</span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="bg-black/40 border border-gray-700/30 rounded-lg p-6">
                            <p className="font-space-mono text-sm text-gray-500 text-center">
                              NO MISSIONS COMPLETED YET
                            </p>
                            <p className="font-space-mono text-xs text-gray-600 text-center mt-2">
                              Deploy this agent on training missions to build their experience
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {activeTab === "lore" && (
                    <div className="space-y-6">
                      {hasUnclaimedLore && (
                        <div className="bg-accent-magenta/10 border border-accent-magenta/50 rounded-lg p-4 mb-6">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-orbitron text-lg text-accent-magenta">
                                NEW LORE DISCOVERED!
                              </h4>
                              <p className="font-space-mono text-sm text-gray-300 mt-1">
                                Claim your agent's recovered memories to unlock
                                new insights.
                              </p>
                            </div>
                            <button
                              onClick={handleClaimLore}
                              disabled={claiming}
                              className="font-space-mono px-6 py-3 bg-accent-magenta/20 border border-accent-magenta rounded hover:bg-accent-magenta/30 transition-all disabled:opacity-50"
                            >
                              {claiming ? "CLAIMING..." : "CLAIM LORE"}
                            </button>
                          </div>
                        </div>
                      )}

                      {loreLoading ? (
                        <div className="text-center py-8">
                          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-accent-magenta mb-4 mx-auto"></div>
                          <p className="font-space-mono text-sm text-gray-400">
                            ACCESSING MEMORIES...
                          </p>
                        </div>
                      ) : (lore && lore.length > 0) || missionLore.length > 0 ? (
                        <div className="space-y-6">
                          {/* Mission Reports Section */}
                          {missionLore.length > 0 && (
                            <div>
                              <h4 className="font-orbitron text-sm font-bold text-green-400 mb-3 flex items-center gap-2">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                MISSION REPORTS
                              </h4>
                              <div className="grid grid-cols-1 gap-3">
                                {missionLore.map((loreItem) => (
                                  <LoreCard
                                    key={loreItem.id}
                                    lore={loreItem}
                                    nft={agent}
                                    onClick={() => handleLoreClick(loreItem)}
                                  />
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {/* Other Lore Section */}
                          {lore && lore.length > 0 && (
                            <div>
                              <h4 className="font-orbitron text-sm font-bold text-purple-400 mb-3 flex items-center gap-2">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                </svg>
                                AGENT MEMORIES
                              </h4>
                              <div className="grid grid-cols-1 gap-3">
                                {lore.map((loreItem) => (
                                  <LoreCard
                                    key={loreItem.id}
                                    lore={loreItem}
                                    nft={agent}
                                    onClick={() => handleLoreClick(loreItem)}
                                  />
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="bg-black/40 border border-gray-700/30 rounded-lg p-8 text-center">
                          <p className="font-space-mono text-sm text-gray-500">
                            NO MEMORIES RECOVERED YET
                          </p>
                          <p className="font-space-mono text-xs text-gray-600 mt-2">
                            Check back regularly for new lore fragments
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {activeTab === "attributes" && (
                    <div className="space-y-4">
                      <h3 className="font-orbitron text-lg font-bold text-accent-blue mb-4">
                        COMPLETE ATTRIBUTE LIST
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {agent.attributes?.map((attr, index) => (
                          <div
                            key={index}
                            className="bg-black/40 border border-gray-700/30 rounded-lg p-4"
                          >
                            <p className="font-space-mono text-xs text-gray-500 mb-1">
                              {attr.trait_type?.toUpperCase()}
                            </p>
                            <p className="font-space-mono text-sm text-gray-200">
                              {attr.value}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Lore Reveal Modal for newly claimed lore */}
      {claimedLore && (
        <LoreRevealModal
          lore={claimedLore}
          nft={agent}
          isOpen={showRevealModal}
          onClose={() => {
            track('agent_lore_reveal_closed', {
              agent_id: agentId,
              lore_id: claimedLore.id
            });
            setShowRevealModal(false);
            setActiveTab("lore");
          }}
        />
      )}

      {/* Lore Modal for viewing claimed lore */}
      {selectedLore && (
        <LoreModal
          lore={selectedLore}
          nft={agent}
          isOpen={showLoreModal}
          onClose={closeLoreModal}
        />
      )}
    </div>
  );
}
