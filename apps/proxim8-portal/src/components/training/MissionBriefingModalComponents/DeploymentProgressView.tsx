import { Activity, Check } from "lucide-react";
import { DeploymentProgress } from "./DeploymentProgress";

interface DeploymentProgressViewProps {
  stage: "deploying" | "processing" | "ready";
  progress: number;
  selectedProxim8?: {
    name: string;
    image: string;
  };
  selectedApproach?: string;
  eventDate: string;
  eventDuration?: number;
  onViewProgress: () => void;
}

export function DeploymentProgressView({
  stage,
  progress,
  selectedProxim8,
  selectedApproach,
  eventDate,
  eventDuration = 30,
  onViewProgress
}: DeploymentProgressViewProps) {
  return (
    <div className="h-full flex items-center justify-center">
      <div className="w-full max-w-3xl">
        <DeploymentProgress
          stage={stage}
          progress={progress}
          selectedProxim8={selectedProxim8}
        />

        {/* Additional status messages and controls */}
        {stage === "deploying" && (
          <div className="space-y-2 font-space-mono text-sm mt-6">
            <div
              className={`text-center transition-opacity duration-500 ${progress > 0 ? "opacity-100" : "opacity-0"}`}
            >
              <span className="text-green-400">
                ✓ TEMPORAL COORDINATES LOCKED
              </span>
            </div>
            <div
              className={`text-center transition-opacity duration-500 ${progress > 25 ? "opacity-100" : "opacity-0"}`}
            >
              <span className="text-green-400">
                ✓ QUANTUM SIGNATURE VERIFIED
              </span>
            </div>
            <div
              className={`text-center transition-opacity duration-500 ${progress > 50 ? "opacity-100" : "opacity-0"}`}
            >
              <span className="text-blue-400">
                → TRAVERSING LATENT SPACE...
              </span>
            </div>
            <div
              className={`text-center transition-opacity duration-500 ${progress > 75 ? "opacity-100" : "opacity-0"}`}
            >
              <span className="text-yellow-400">
                ⚡ REALITY ANCHOR ESTABLISHING...
              </span>
            </div>
            <div
              className={`text-center transition-opacity duration-500 ${progress >= 100 ? "opacity-100" : "opacity-0"}`}
            >
              <span className="text-green-400 font-bold">
                ✓ INSERTION COMPLETE
              </span>
            </div>
          </div>
        )}

        {stage === "processing" && (
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

        {stage === "ready" && (
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
                    {eventDuration} SECONDS
                  </p>
                </div>
                <div className="bg-gray-800/50 rounded p-3">
                  <p className="text-gray-500 text-xs mb-1">STATUS</p>
                  <p className="text-green-400 font-bold">ACTIVE</p>
                </div>
              </div>
            </div>

            <button
              onClick={onViewProgress}
              className="w-full py-3 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-500 hover:to-blue-500 text-white font-orbitron font-bold rounded-lg transition-all flex items-center justify-center gap-2"
            >
              <Activity className="w-5 h-5" />
              VIEW MISSION PROGRESS
            </button>
          </div>
        )}

        {/* Technical readout */}
        {stage !== "ready" && (
          <div className="bg-gray-800/30 border border-gray-700/50 rounded p-4 font-mono text-xs text-gray-500 mt-6">
            <div>TIMELINE: {eventDate}</div>
            <div>APPROACH: {selectedApproach?.toUpperCase()}</div>
            <div>
              QUANTUM_FLUX:{" "}
              {(Math.sin(progress * 0.1) * 50 + 50).toFixed(2)}%
            </div>
            <div>
              LATENT_COHERENCE:{" "}
              {(100 - progress * 0.2).toFixed(1)}%
            </div>
            {stage === "processing" && (
              <div className="mt-1">AI_GENERATION: GEMINI-2.0-PRO</div>
            )}
            <div className="mt-2 text-green-400">
              {Array(Math.floor(progress / 10))
                .fill("█")
                .join("")}
              {Array(10 - Math.floor(progress / 10))
                .fill("░")
                .join("")}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}