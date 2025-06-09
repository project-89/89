import { Swords, Search, Users } from "lucide-react";
import type { Approach } from "@/lib/timeline-data";

type ApproachData = {
  icon: React.ReactNode;
  risk: string;
  riskColor: string;
  reward: string;
  successRate: string;
  description: string;
};

interface MissionBriefTabProps {
  eventTitle: string;
  eventDate: string;
  eventStatus: string;
  eventBriefing?: string;
  selectedApproach?: string;
  selectedAgent?: string;
  oneirocumControl: number;
  deployment?: any;
}

export function MissionBriefTab({
  eventTitle,
  eventDate,
  eventStatus,
  eventBriefing,
  selectedApproach,
  selectedAgent,
  oneirocumControl,
  deployment
}: MissionBriefTabProps) {
  const getApproachData = (approach: string): ApproachData | null => {
    const eventName = eventTitle?.split(" ")[0] || "the target";
    const data: Record<string, ApproachData> = {
      sabotage: {
        icon: <Swords className="w-5 h-5" />,
        risk: "HIGH RISK",
        riskColor: "text-red-400",
        reward: "8-12%",
        successRate: "45-60%",
        description: `Hack ${eventName}'s demonstration systems during the public hearing`,
      },
      expose: {
        icon: <Search className="w-5 h-5" />,
        risk: "MEDIUM RISK",
        riskColor: "text-yellow-400",
        reward: "4-7%",
        successRate: "60-75%",
        description: `Leak internal documents revealing ${eventName}'s hidden agenda`,
      },
      organize: {
        icon: <Users className="w-5 h-5" />,
        risk: "LOW RISK",
        riskColor: "text-green-400",
        reward: "2-4%",
        successRate: "75-90%",
        description: `Support grassroots resistance movements against ${eventName}`,
      },
    };
    return data[approach] || null;
  };

  const selectedData = selectedApproach ? getApproachData(selectedApproach) : null;

  return (
    <div className="space-y-6">
      {/* Timeline Status - for completed missions */}
      {eventStatus === "completed-success" && (
        <div className="bg-gray-800/30 border border-gray-700/50 rounded-lg p-4">
          <div className="flex justify-between items-center mb-2">
            <span className="font-space-mono text-xs text-gray-400">
              FINAL TIMELINE STATUS
            </span>
            <span className="font-space-mono text-xs text-gray-300">
              {100 - (oneirocumControl - 6)}% RESISTANCE
            </span>
          </div>
          <div className="w-full h-3 bg-gray-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-red-500 to-red-600 relative"
              style={{ width: `${oneirocumControl - 6}%` }}
            >
              <div className="absolute right-0 top-0 bottom-0 w-1 bg-white/50" />
            </div>
          </div>
          <div className="flex justify-between mt-2">
            <span className="font-space-mono text-xs text-red-400">
              ONEIROCOM: {oneirocumControl - 6}%
            </span>
            <span className="font-space-mono text-xs text-green-400">
              GREEN LOOM: {100 - (oneirocumControl - 6)}%
            </span>
          </div>
        </div>
      )}

      {/* Mission Parameters */}
      <div className="bg-gray-800/30 border border-gray-700/50 rounded-lg p-6">
        <h3 className="font-orbitron text-sm font-bold text-white mb-4">
          MISSION PARAMETERS
        </h3>

        <div className="space-y-4">
          <div>
            <p className="font-space-mono text-xs text-gray-500 mb-1">
              OBJECTIVE
            </p>
            <p className="font-space-mono text-sm text-gray-300">
              {eventTitle}
            </p>
          </div>

          <div>
            <p className="font-space-mono text-xs text-gray-500 mb-1">DATE</p>
            <p className="font-space-mono text-sm text-gray-300">
              {eventDate}
            </p>
          </div>

          {selectedApproach && (
            <div>
              <p className="font-space-mono text-xs text-gray-500 mb-1">
                SELECTED APPROACH
              </p>
              <div className="flex items-center gap-2 mt-2">
                {selectedData?.icon}
                <span className="font-orbitron text-sm font-bold text-white uppercase">
                  {selectedApproach}
                </span>
                <span
                  className={`font-space-mono text-xs ${selectedData?.riskColor}`}
                >
                  {selectedData?.risk}
                </span>
              </div>
            </div>
          )}

          {selectedAgent && (
            <div>
              <p className="font-space-mono text-xs text-gray-500 mb-1">
                ASSIGNED AGENT
              </p>
              <p className="font-space-mono text-sm text-gray-300">
                {deployment?.proxim8Name || selectedAgent || "PROXIM8 CLASSIFIED"}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Original Briefing */}
      <div className="bg-gray-800/30 border border-gray-700/50 rounded-lg p-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
          <h3 className="font-orbitron text-sm font-bold text-white">
            CLASSIFIED BRIEFING
          </h3>
        </div>
        <p className="font-space-mono text-sm text-gray-300 leading-relaxed">
          {eventBriefing ||
            `Agent, The ${eventTitle} represents a critical inflection point in the timeline war. Our quantum analysts have identified this moment as a key vulnerability in Oneirocom's control matrix. Your intervention here could cascade across multiple probability branches, weakening their grip on human consciousness. The window for action is narrow - their temporal shielding is at its weakest during this event. We must strike with precision.`}
        </p>
      </div>
    </div>
  );
}