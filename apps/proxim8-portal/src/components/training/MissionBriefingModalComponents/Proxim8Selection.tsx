import { X, Star } from "lucide-react";

interface Proxim8 {
  id: string;
  name: string;
  image: string;
  coordinator: string;
  missionsCompleted: number;
  successRate: number;
  compatibilityLevel: number;
  specialization?: string;
  onMission?: boolean;
}

interface Proxim8SelectionProps {
  proxim8s: Proxim8[];
  selectedProxim8: string | null;
  onSelectProxim8: (id: string | null) => void;
  selectedApproach?: string;
}

export function Proxim8Selection({
  proxim8s,
  selectedProxim8,
  onSelectProxim8,
  selectedApproach,
}: Proxim8SelectionProps) {
  const selectedNft = proxim8s.find((nft) => nft.id === selectedProxim8);

  const getCompatibilityInfo = (level: number) => {
    if (level >= 0.8)
      return { text: "OPTIMAL", color: "text-green-400", modifier: "+" };
    if (level >= 0.6)
      return { text: "GOOD", color: "text-yellow-400", modifier: "=" };
    if (level >= 0.4)
      return { text: "MODERATE", color: "text-orange-400", modifier: "-" };
    return { text: "POOR", color: "text-red-400", modifier: "!" };
  };

  return (
    <div className="h-full flex flex-col">
      <div className="mb-4 flex-shrink-0">
        <h3 className="font-orbitron text-lg font-bold text-white mb-2">
          ASSIGN PROXIM8 AGENT
        </h3>
        <p className="font-space-mono text-sm text-gray-400">
          Select the Proxim8 best suited for this {selectedApproach} mission.
        </p>
        {proxim8s.length > 5 && (
          <p className="font-space-mono text-xs text-gray-500 mt-1">
            Showing {proxim8s.length} agents • Scroll to see more
          </p>
        )}
      </div>

      {/* Selected Proxim8 Display */}
      {selectedNft && (
        <div className="mb-6 flex-shrink-0">
          <div className="bg-green-900/30 border-2 border-green-500 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <span className="font-orbitron text-sm font-bold text-green-400 uppercase">
                SELECTED AGENT
              </span>
            </div>
            <div className="flex items-start gap-3">
              <img
                src={selectedNft.image}
                alt={selectedNft.name}
                className="w-16 h-16 rounded-lg flex-shrink-0 border border-green-500/50"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h4 className="font-orbitron text-base font-bold text-white">
                    {selectedNft.name}
                  </h4>
                  <button
                    onClick={() => onSelectProxim8(null)}
                    className="text-green-400 hover:text-white transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-x-4 gap-y-1 font-space-mono text-xs">
                  <div className="text-gray-400">
                    Coordinator:{" "}
                    <span className="text-green-300">
                      {selectedNft.coordinator}
                    </span>
                  </div>
                  <div className="text-gray-400">
                    Missions:{" "}
                    <span className="text-green-300">
                      {selectedNft.missionsCompleted}
                    </span>
                  </div>
                  <div className="text-gray-400">
                    Success:{" "}
                    <span className="text-green-300">
                      {selectedNft.successRate}%
                    </span>
                  </div>
                  <div className="text-gray-400">
                    Compatibility:{" "}
                    <span
                      className={
                        getCompatibilityInfo(selectedNft.compatibilityLevel)
                          .color
                      }
                    >
                      {
                        getCompatibilityInfo(selectedNft.compatibilityLevel)
                          .text
                      }
                    </span>
                  </div>
                </div>

                {selectedNft.specialization === selectedApproach && (
                  <div className="mt-2">
                    <span className="font-space-mono text-xs text-green-400">
                      ★ {selectedApproach?.toUpperCase()} SPECIALIST
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Available Agents List */}
      {proxim8s.length > 0 ? (
        <div className="flex-1 overflow-y-auto pr-2 scrollbar-thin">
          <div className="mb-3">
            <h4 className="font-orbitron text-sm font-bold text-white mb-2">
              AVAILABLE AGENTS
            </h4>
            <p className="font-space-mono text-xs text-gray-400">
              Click to select •{" "}
              {
                proxim8s.filter(
                  (nft) => !nft.onMission && nft.id !== selectedProxim8
                ).length
              }{" "}
              available
            </p>
          </div>
          <div className="space-y-2">
            {proxim8s
              .filter((nft) => nft.id !== selectedProxim8) // Hide selected NFT from list
              .map((nft, index) => {
                const compatInfo = getCompatibilityInfo(nft.compatibilityLevel);
                const isRecommended = index === 0 && !nft.onMission;

                return (
                  <div
                    key={nft.id}
                    className={`
                      bg-gray-800/30 border rounded-lg p-3 transition-all relative
                      ${
                        nft.onMission
                          ? "border-gray-700/50 opacity-50 cursor-not-allowed"
                          : "border-gray-700 hover:border-primary-500/50 hover:bg-gray-800/50 cursor-pointer"
                      }
                    `}
                    onClick={() => !nft.onMission && onSelectProxim8(nft.id)}
                  >
                    {isRecommended && (
                      <div className="absolute -top-2 -right-2 flex items-center gap-1 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                        <Star className="w-3 h-3" />
                        RECOMMENDED
                      </div>
                    )}

                    <div className="flex items-start gap-3">
                      <img
                        src={nft.image}
                        alt={nft.name}
                        className={`w-12 h-12 rounded-lg flex-shrink-0 ${
                          nft.onMission ? "grayscale" : ""
                        }`}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="font-orbitron text-sm font-bold text-white truncate">
                            {nft.name}
                          </h4>
                          <span
                            className={`font-space-mono text-xs font-bold ${compatInfo.color}`}
                          >
                            {compatInfo.modifier}
                            {Math.round(nft.compatibilityLevel * 100)}%
                          </span>
                        </div>

                        <div className="flex items-center gap-4 mt-1 font-space-mono text-xs text-gray-400">
                          <span>Missions: {nft.missionsCompleted}</span>
                          <span>Success: {nft.successRate}%</span>
                        </div>

                        {nft.onMission && (
                          <div className="mt-2 font-space-mono text-xs text-yellow-400">
                            Currently deployed on another mission
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="font-space-mono text-sm text-gray-400 mb-2">
              No compatible Proxim8s available
            </p>
            <p className="font-space-mono text-xs text-gray-500">
              Complete more missions to unlock additional agents
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
