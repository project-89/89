import { FileText, Zap, Brain } from "lucide-react";
import type { MissionPhase } from "@/types/mission";

interface MobileNavigationProps {
  activePanel: "briefing" | "action" | "intel";
  onPanelChange: (panel: "briefing" | "action" | "intel") => void;
  phase: MissionPhase;
}

export function MobileNavigation({ activePanel, onPanelChange, phase }: MobileNavigationProps) {
  const tabs = [
    {
      id: "briefing" as const,
      label: "BRIEFING",
      icon: <FileText className="w-4 h-4" />,
      available: true,
    },
    {
      id: "action" as const,
      label: phase === "planning" ? "DEPLOY" : phase === "in-progress" ? "STATUS" : "REPORT",
      icon: <Zap className="w-4 h-4" />,
      available: true,
    },
    {
      id: "intel" as const,
      label: "INTEL",
      icon: <Brain className="w-4 h-4" />,
      available: phase !== "available",
    },
  ];

  return (
    <nav className="sticky top-0 z-20 bg-gray-900/95 backdrop-blur-sm border-y border-gray-700/50 md:hidden">
      <div className="flex">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => tab.available && onPanelChange(tab.id)}
            disabled={!tab.available}
            className={`
              flex-1 flex items-center justify-center gap-2 px-4 py-3 font-space-mono text-xs uppercase transition-all
              ${activePanel === tab.id
                ? "text-white bg-gray-800 border-b-2 border-green-500"
                : tab.available
                  ? "text-gray-400 hover:text-white hover:bg-gray-800/50"
                  : "text-gray-600 cursor-not-allowed"
              }
            `}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}