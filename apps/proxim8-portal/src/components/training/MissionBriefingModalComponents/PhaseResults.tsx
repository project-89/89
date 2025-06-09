import { Check, X } from "lucide-react";

interface Phase {
  phaseId?: string;
  name?: string;
  success?: boolean;
  narrative?: string;
}

interface PhaseResultsProps {
  phases: Phase[];
  showNarratives?: boolean;
}

export function PhaseResults({ phases, showNarratives = false }: PhaseResultsProps) {
  // If no phases data, show default phases
  const displayPhases = phases.length > 0 ? phases : [
    { name: "Infiltration", success: true },
    { name: "Analysis", success: true },
    { name: "Execution", success: true },
    { name: "Extraction", success: true }
  ];

  return (
    <div className="bg-gray-800/30 border border-gray-700/50 rounded-lg p-4">
      <h4 className="font-orbitron text-sm font-bold text-white mb-3">PHASE COMPLETION</h4>
      <div className="space-y-2">
        {displayPhases.map((phase, index) => (
          <div key={phase.phaseId || index}>
            <div className="flex items-center gap-2 font-space-mono text-xs">
              {phase.success !== false ? (
                <Check className="w-3 h-3 text-green-400" />
              ) : (
                <X className="w-3 h-3 text-red-400" />
              )}
              <span className={phase.success !== false ? "text-gray-400" : "text-red-400"}>
                {phase.name || `Phase ${index + 1}`}
              </span>
            </div>
            {showNarratives && phase.narrative && (
              <p className="ml-5 mt-1 text-xs text-gray-500 font-space-mono">
                {phase.narrative}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}