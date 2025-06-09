import { Play, Zap, Shield, ArrowLeft } from "lucide-react";
import type { MissionPhase, MissionSelections } from "@/types/mission";

interface MissionActionBarProps {
  phase: MissionPhase;
  selections: MissionSelections;
  onAction: (action: "begin" | "deploy" | "claim" | "return") => void;
}

export function MissionActionBar({ phase, selections, onAction }: MissionActionBarProps) {
  const renderActions = () => {
    switch (phase) {
      case "available":
        // No action bar needed - actions are in the hero section
        return null;

      case "planning":
        // No action bar needed - deploy button is in the agent selection panel
        return null;

      case "deploying":
        return (
          <div className="w-full text-center">
            <p className="font-space-mono text-sm text-gray-400">
              Deployment in progress. Stand by...
            </p>
          </div>
        );

      case "in-progress":
        return (
          <div className="w-full text-center">
            <p className="font-space-mono text-sm text-gray-400">
              Mission active. Monitoring agent progress...
            </p>
          </div>
        );

      case "completed":
        return (
          <>
            <button
              onClick={() => onAction("return")}
              className="flex-1 md:flex-none px-6 py-3 bg-gray-800 border border-gray-700 text-white font-orbitron font-bold rounded-lg hover:bg-gray-700 transition-all flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden md:inline">RETURN TO BASE</span>
              <span className="md:hidden">BACK</span>
            </button>
            <button
              onClick={() => onAction("claim")}
              className="flex-1 md:flex-none px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-orbitron font-bold rounded-lg transition-all flex items-center justify-center gap-2"
            >
              <Shield className="w-4 h-4" />
              CLAIM REWARDS
            </button>
          </>
        );

      case "failed":
        return (
          <button
            onClick={() => onAction("return")}
            className="w-full px-6 py-3 bg-gray-800 border border-gray-700 text-white font-orbitron font-bold rounded-lg hover:bg-gray-700 transition-all flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            RETURN TO BASE
          </button>
        );

      default:
        return null;
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gray-900/95 backdrop-blur-sm border-t border-gray-700/50 p-4 md:p-6 z-30">
      <div className="max-w-7xl mx-auto flex items-center justify-center md:justify-end gap-4">
        {renderActions()}
      </div>
    </div>
  );
}