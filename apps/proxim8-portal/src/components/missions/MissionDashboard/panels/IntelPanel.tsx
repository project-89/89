import { Brain, Shield, Trophy, Sparkles, Lock } from "lucide-react";
import { MissionRewards } from "@/components/training/MissionBriefingModalComponents/MissionRewards";
import { LoreFragmentsDisplay } from "@/components/training/MissionBriefingModalComponents/LoreFragmentsDisplay";
import { useNftStore } from "@/stores/nftStore";
import type { TrainingMission } from "@/lib/api/missions";
import type { MissionPhase } from "@/types/mission";
import { getMissionDuration } from "@/utils/missionHelpers";

interface IntelPanelProps {
  mission: TrainingMission;
  phase: MissionPhase;
  deployment?: any;
  selections?: {
    approach?: string;
    agents: string[];
  };
  onStartDeployment?: () => void;
}

export function IntelPanel({ mission, phase, deployment, selections, onStartDeployment }: IntelPanelProps) {
  const userNfts = useNftStore((state) => state.userNfts);
  
  // Mock lore fragments for demo
  const mockLoreFragments = [
    {
      id: "lore_001",
      title: "The Convergence Echo",
      subtitle: "Dr. Sarah Chen's Account",
      content: ["Classified quantum memory fragment..."],
      author: "Dr. Sarah Chen",
      rarity: "legendary" as const,
    },
  ];

  // Get selected agent info
  const selectedAgent = selections?.agents[0] ? userNfts?.find(nft => nft.id === selections.agents[0]) : null;
  const coordinator = selectedAgent?.attributes?.find((a: any) => a.trait_type === "Coordinator")?.value;

  // Show different content based on phase
  if (phase === "planning") {
    return (
      <div className="space-y-4">
        {/* Deploy Button - Prominent at top when agent is selected */}
        {selections?.approach && selections?.agents[0] && (
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
            <button
              onClick={onStartDeployment}
              className="w-full py-3 bg-yellow-500 hover:bg-yellow-400 text-black font-orbitron font-bold rounded-lg transition-all transform hover:scale-105"
            >
              DEPLOY AGENT
            </button>
          </div>
        )}

        {/* Strategy Analysis */}
        {selections?.approach && (
          <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-700/50 rounded-lg p-4 md:p-6">
            <div className="flex items-center gap-3 mb-4">
              <Brain className="w-5 h-5 text-green-400" />
              <h3 className="font-orbitron text-lg font-bold text-white">
                STRATEGY ANALYSIS
              </h3>
            </div>
            
            <div className="space-y-3">
              <div className="p-3 bg-gray-800/50 rounded">
                <p className="font-space-mono text-xs text-gray-400 mb-1">SELECTED APPROACH</p>
                <p className="font-orbitron text-base font-bold text-green-400 uppercase">
                  {selections.approach}
                </p>
              </div>
              
              {selections.approach === "sabotage" && (
                <div className="space-y-2 text-sm">
                  <p className="font-space-mono text-gray-400">TACTICAL ADVANTAGES:</p>
                  <ul className="space-y-1 font-space-mono text-gray-300">
                    <li>• Direct timeline impact: +6-8%</li>
                    <li>• Oneirocom infrastructure disruption</li>
                    <li>• Low detection risk with proper agent</li>
                  </ul>
                </div>
              )}
              
              {selections.approach === "expose" && (
                <div className="space-y-2 text-sm">
                  <p className="font-space-mono text-gray-400">TACTICAL ADVANTAGES:</p>
                  <ul className="space-y-1 font-space-mono text-gray-300">
                    <li>• Information cascade effect</li>
                    <li>• Public consciousness shift: +4-6%</li>
                    <li>• Minimal paradox risk</li>
                  </ul>
                </div>
              )}
              
              {selections.approach === "organize" && (
                <div className="space-y-2 text-sm">
                  <p className="font-space-mono text-gray-400">TACTICAL ADVANTAGES:</p>
                  <ul className="space-y-1 font-space-mono text-gray-300">
                    <li>• Resistance network growth</li>
                    <li>• Long-term timeline stability</li>
                    <li>• Multiplier effect: +3-5% per cell</li>
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Agent Coordinator Info */}
        {selectedAgent && (
          <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-700/50 rounded-lg p-4 md:p-6">
            <div className="flex items-center gap-3 mb-4">
              <Shield className="w-5 h-5 text-blue-400" />
              <h3 className="font-orbitron text-lg font-bold text-white">
                AGENT PROFILE
              </h3>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center gap-4">
                <img 
                  src={selectedAgent.image} 
                  alt={selectedAgent.name}
                  className="w-16 h-16 rounded-lg border-2 border-gray-700"
                />
                <div>
                  <p className="font-orbitron text-sm font-bold text-white">
                    {selectedAgent.name}
                  </p>
                  <p className="font-space-mono text-xs text-gray-400">
                    ID: {selectedAgent.id}
                  </p>
                </div>
              </div>
              
              {coordinator && (
                <div className="p-3 bg-gray-800/50 rounded">
                  <p className="font-space-mono text-xs text-gray-400 mb-1">COORDINATOR</p>
                  <p className="font-orbitron text-sm font-bold text-cyan-400">
                    {coordinator}
                  </p>
                  
                  {/* Coordinator-specific bonuses */}
                  <div className="mt-2 space-y-1">
                    {coordinator === "NOVA" && (
                      <p className="font-space-mono text-xs text-gray-300">
                        +15% success rate on sabotage missions
                      </p>
                    )}
                    {coordinator === "ECHO" && (
                      <p className="font-space-mono text-xs text-gray-300">
                        +20% intel gathering efficiency
                      </p>
                    )}
                    {coordinator === "FLUX" && (
                      <p className="font-space-mono text-xs text-gray-300">
                        +10% timeline stability bonus
                      </p>
                    )}
                    {coordinator === "AEGIS" && (
                      <p className="font-space-mono text-xs text-gray-300">
                        -25% detection risk on all operations
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Mission Parameters */}
        <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-700/50 rounded-lg p-4 md:p-6">
          <div className="flex items-center gap-3 mb-4">
            <Brain className="w-5 h-5 text-amber-400" />
            <h3 className="font-orbitron text-lg font-bold text-white">
              MISSION PARAMETERS
            </h3>
          </div>
          
          <div className="space-y-2 font-space-mono text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">Operation Window:</span>
              <span className="text-gray-300">{getMissionDuration(mission)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Paradox Risk:</span>
              <span className="text-green-400">LOW</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Detection Level:</span>
              <span className="text-amber-400">MODERATE</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Timeline Impact:</span>
              <span className="text-blue-400">+{6}%</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Mission Rewards */}
      <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-700/50 rounded-lg p-4 md:p-6">
        <div className="flex items-center gap-3 mb-4">
          <Trophy className="w-5 h-5 text-yellow-400" />
          <h3 className="font-orbitron text-lg font-bold text-white">
            MISSION REWARDS
          </h3>
        </div>

        <div className="space-y-3">
          {/* Timeline Points */}
          <div className="flex items-center justify-between p-3 bg-yellow-500/10 rounded">
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4 text-yellow-400" />
              <span className="font-space-mono text-sm text-gray-300">
                Timeline Points
              </span>
            </div>
            <span className="font-orbitron text-sm font-bold text-yellow-400">
              +100
            </span>
          </div>

          {/* Lore Fragments */}
          <div className="flex items-center justify-between p-3 bg-purple-500/10 rounded">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-purple-400" />
              <span className="font-space-mono text-sm text-gray-300">
                Lore Fragment
              </span>
            </div>
            <span className="font-orbitron text-sm font-bold text-purple-400">
              {phase === "completed" ? "UNLOCKED" : "LOCKED"}
            </span>
          </div>

          {/* Experience */}
          <div className="flex items-center justify-between p-3 bg-blue-500/10 rounded">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-400" />
              <span className="font-space-mono text-sm text-gray-300">
                Experience
              </span>
            </div>
            <span className="font-orbitron text-sm font-bold text-blue-400">
              +50 XP
            </span>
          </div>
        </div>
      </div>

      {/* Related Intel */}
      <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-700/50 rounded-lg p-4 md:p-6">
        <div className="flex items-center gap-3 mb-4">
          <Brain className="w-5 h-5 text-blue-400" />
          <h3 className="font-orbitron text-lg font-bold text-white">
            RELATED INTEL
          </h3>
        </div>

        {phase === "available" ? (
          <div className="space-y-3">
            <div className="flex items-center justify-center py-8">
              <Lock className="w-8 h-8 text-gray-600" />
            </div>
            <p className="font-space-mono text-xs text-gray-500 text-center">
              Complete mission to unlock classified intel
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="p-3 bg-gray-800/50 rounded">
              <p className="font-space-mono text-xs text-gray-400 mb-1">
                SURVEILLANCE LOG #089
              </p>
              <p className="font-space-mono text-xs text-gray-300">
                Oneirocom activity detected at target location. Neural 
                interface deployment confirmed.
              </p>
            </div>
            <div className="p-3 bg-gray-800/50 rounded">
              <p className="font-space-mono text-xs text-gray-400 mb-1">
                QUANTUM ANALYSIS
              </p>
              <p className="font-space-mono text-xs text-gray-300">
                Timeline vulnerability window: 3.7 seconds during 
                demonstration phase.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Lore Fragments - Only show if completed */}
      {phase === "completed" && (
        <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-700/50 rounded-lg p-4 md:p-6">
          <LoreFragmentsDisplay
            fragments={mockLoreFragments}
            claimedFragments={[]}
            isLoading={false}
            onClaimLore={() => {}}
            onViewLore={() => {}}
            isExtractingLore={false}
            loreClaimed={false}
          />
        </div>
      )}
    </div>
  );
}