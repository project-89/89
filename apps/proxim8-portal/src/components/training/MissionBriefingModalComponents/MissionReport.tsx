import { 
  CheckCircle, 
  AlertTriangle, 
  Activity, 
  Zap, 
  Trophy, 
  Shield, 
  Check, 
  X,
  Clock 
} from "lucide-react";

interface MissionReportProps {
  eventTitle: string;
  eventStatus: string;
  oneirocumControl: number;
  deployment?: any;
  onClaimLore: () => void;
  unclaimedFragmentsCount: number;
  isLoadingLore: boolean;
  fragmentsData: any[];
  claimedFragments: string[];
  onViewLore: (fragment: any) => void;
  isExtractingLore: boolean;
  loreClaimed: boolean;
}

export function MissionReport({
  eventTitle,
  eventStatus,
  oneirocumControl,
  deployment,
  onClaimLore,
  unclaimedFragmentsCount,
  isLoadingLore,
  fragmentsData,
  claimedFragments,
  onViewLore,
  isExtractingLore,
  loreClaimed
}: MissionReportProps) {
  const isSuccess = eventStatus === "completed-success" || deployment?.result?.overallSuccess;

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
              ? `${100 - (oneirocumControl - 6)}% RESISTANCE (+6%)`
              : `${100 - oneirocumControl}% RESISTANCE (NO CHANGE)`}
          </span>
        </div>
        <div className="w-full h-3 bg-gray-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-red-500 to-red-600 relative transition-all duration-1000"
            style={{
              width: `${isSuccess ? oneirocumControl - 6 : oneirocumControl}%`,
            }}
          >
            <div className="absolute right-0 top-0 bottom-0 w-1 bg-white/50 animate-pulse" />
          </div>
        </div>
        <div className="flex justify-between mt-2">
          <span className="font-space-mono text-xs text-red-400">
            ONEIROCOM:{" "}
            {isSuccess
              ? oneirocumControl - 6
              : oneirocumControl}
            %
          </span>
          <span className="font-space-mono text-xs text-green-400">
            GREEN LOOM:{" "}
            {isSuccess
              ? 100 - (oneirocumControl - 6)
              : 100 - oneirocumControl}
            %
          </span>
        </div>
        {isSuccess && (
          <div className="mt-2 text-center">
            <span className="font-space-mono text-xs text-green-400 animate-pulse">
              ▲ TIMELINE SHIFTED +6% TOWARD LIBERATION
            </span>
          </div>
        )}
      </div>

      {/* Success Header with Claim Button */}
      <div className="flex items-start justify-between gap-4">
        <div className="border-l-4 border-green-500 pl-6 py-2 flex-1">
          <h3 className="font-orbitron text-lg font-bold text-white mb-2">
            MISSION SUCCESSFUL
          </h3>
          <p className="font-space-mono text-sm text-gray-300">
            Your Proxim8 successfully disrupted the {eventTitle}. The
            timeline has shifted toward the Green Loom.
          </p>
        </div>
        {unclaimedFragmentsCount > 0 ? (
          <button
            onClick={onClaimLore}
            className="px-6 py-3 bg-purple-500/20 border border-purple-500 rounded-lg hover:bg-purple-500/30 transition-all group"
          >
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-purple-400 group-hover:animate-pulse" />
              <span className="font-orbitron text-sm font-bold text-purple-400">
                CLAIM LORE ({unclaimedFragmentsCount})
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
              {deployment?.proxim8Name || "PROXIM8 AGENT"}
            </div>
            <div className="text-gray-500">TO: PROJECT 89 COMMAND</div>
            <div className="text-gray-500">
              RE: {eventTitle} INTERVENTION
            </div>
          </div>

          {/* Report Content */}
          <div className="space-y-3 font-space-mono text-sm text-gray-300">
            {deployment?.result?.finalNarrative ? (
              <>
                <p className="whitespace-pre-wrap">
                  {deployment.result.finalNarrative}
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
                  {deployment?.result?.timelineShift || 6}%
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                <span className="text-green-400">
                  Phases completed:{" "}
                  {deployment?.phases?.filter(
                    (p: any) =>
                      p.success !== undefined && p.success !== false
                  ).length || 4}
                  /{deployment?.phases?.length || 5}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                <span className="text-green-400">
                  Success rate:{" "}
                  {deployment?.finalSuccessRate
                    ? Math.round(deployment.finalSuccessRate * 100)
                    : 75}
                  %
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-yellow-400 rounded-full" />
                <span className="text-yellow-400">
                  Mission status:{" "}
                  {deployment?.status?.toUpperCase() || "COMPLETED"}
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
                  {deployment?.result?.rewards?.timelinePoints || 100}
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
                  {deployment?.result?.rewards?.loreFragments?.length
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
                  +{deployment?.result?.rewards?.experience || 50}
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
              {deployment?.phases?.length > 0
                ? deployment.phases.map(
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
    </div>
  );
}