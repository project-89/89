import { ChevronRight, Zap } from "lucide-react";

interface ModalFooterProps {
  activeTab: "video" | "briefing" | "strategy" | "proxim8" | "report";
  hasVideoBriefing: boolean;
  selectedApproach: string | null;
  selectedProxim8: string | null;
  onClose: () => void;
  onContinue: () => void;
  onDeploy: () => void;
}

export function ModalFooter({
  activeTab,
  hasVideoBriefing,
  selectedApproach,
  selectedProxim8,
  onClose,
  onContinue,
  onDeploy
}: ModalFooterProps) {
  return (
    <div className="border-t border-gray-700/50 p-6 flex justify-between items-center flex-shrink-0">
      <button
        onClick={onClose}
        className="font-space-mono text-sm px-6 py-2 bg-gray-800 border border-gray-700 rounded text-gray-400 hover:text-white hover:bg-gray-700 hover:border-gray-600 transition-all"
      >
        CANCEL
      </button>

      {hasVideoBriefing && activeTab === "video" && (
        <button
          onClick={onContinue}
          className="font-space-mono text-sm px-6 py-2 bg-white text-black rounded hover:bg-gray-200 transition-all flex items-center gap-2"
        >
          CONTINUE TO BRIEFING
          <ChevronRight className="w-4 h-4" />
        </button>
      )}

      {activeTab === "briefing" && (
        <button
          onClick={onContinue}
          className="font-space-mono text-sm px-6 py-2 bg-white text-black rounded hover:bg-gray-200 transition-all flex items-center gap-2"
        >
          CONTINUE TO STRATEGY
          <ChevronRight className="w-4 h-4" />
        </button>
      )}

      {activeTab === "strategy" && (
        <button
          onClick={onContinue}
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
          onClick={onDeploy}
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
  );
}