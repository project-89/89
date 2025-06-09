import { Activity, Check, X, Clock } from "lucide-react";

interface InProgressMissionProps {
  eventTitle: string;
  phases: string[];
  actualPhaseData: any[];
  currentPhase: number;
  isPolling: boolean;
  lastUpdated?: Date;
  completesAt?: string;
}

export function InProgressMission({
  eventTitle,
  phases,
  actualPhaseData,
  currentPhase,
  isPolling,
  lastUpdated,
  completesAt
}: InProgressMissionProps) {
  return (
    <div className="space-y-6">
      <div className="border-l-4 border-yellow-500 pl-6 py-2">
        <h3 className="font-orbitron text-lg font-bold text-white mb-2">
          MISSION IN PROGRESS
        </h3>
        <p className="font-space-mono text-sm text-gray-300">
          Your Proxim8 is currently engaged in the{" "}
          {eventTitle || "current mission"}. Real-time updates below.
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
          {completesAt
            ? (() => {
                const now = new Date();
                const completesAtDate = new Date(completesAt);
                const diffMs = completesAtDate.getTime() - now.getTime();
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