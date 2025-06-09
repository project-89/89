import { Clock, Zap, Shield, Activity } from "lucide-react";
import type { TrainingMission } from "@/lib/api/missions";
import type { MissionPhase } from "@/types/mission";
import { 
  getMissionDuration, 
  calculateDifficulty,
  getDifficultyText,
  calculateImpact
} from "@/utils/missionHelpers";

interface MissionHeaderProps {
  mission: TrainingMission;
  phase: MissionPhase;
  deployment?: any;
}

export function MissionHeader({ mission, phase, deployment }: MissionHeaderProps) {
  const getStatusBadge = () => {
    const badges = {
      available: { color: "bg-blue-500", text: "AVAILABLE" },
      planning: { color: "bg-purple-500", text: "PLANNING" },
      deploying: { color: "bg-amber-500", text: "DEPLOYING" },
      "in-progress": { color: "bg-green-500", text: "IN PROGRESS" },
      completed: { color: "bg-emerald-500", text: "COMPLETED" },
      failed: { color: "bg-red-500", text: "FAILED" },
    };
    
    return badges[phase] || badges.available;
  };

  const badge = getStatusBadge();
  const oneirocumControl = 100 - (mission.sequence - 1) * 10;
  
  // Get mission display values using helpers
  const duration = getMissionDuration(mission);
  const difficulty = calculateDifficulty(mission);
  const difficultyText = getDifficultyText(difficulty);
  const impact = calculateImpact(mission);

  return (
    <header className="px-4 md:px-6 pb-4 space-y-4">
      {/* Title and Status */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="font-orbitron text-2xl md:text-3xl font-bold text-white">
              {mission.title}
            </h1>
            <span className={`px-3 py-1 ${badge.color} text-white font-space-mono text-xs rounded-full`}>
              {badge.text}
            </span>
          </div>
          <p className="font-space-mono text-sm text-gray-400">
            {mission.location} • {mission.date}
          </p>
        </div>

        {/* Quick Stats - Hidden on mobile, shown on tablet+ */}
        <div className="hidden sm:flex items-center gap-6">
          <div className="text-center">
            <Clock className="w-5 h-5 text-gray-500 mx-auto mb-1" />
            <p className="font-space-mono text-xs text-gray-500">DURATION</p>
            <p className="font-orbitron text-sm font-bold text-white">
              {duration}
            </p>
          </div>
          <div className="text-center">
            <Zap className="w-5 h-5 text-gray-500 mx-auto mb-1" />
            <p className="font-space-mono text-xs text-gray-500">IMPACT</p>
            <p className="font-orbitron text-sm font-bold text-white">
              {impact}%
            </p>
          </div>
          <div className="text-center">
            <Shield className="w-5 h-5 text-gray-500 mx-auto mb-1" />
            <p className="font-space-mono text-xs text-gray-500">DIFFICULTY</p>
            <p className="font-orbitron text-sm font-bold text-white">
              {difficultyText}
            </p>
          </div>
        </div>
      </div>

      {/* Timeline Control Bar */}
      <div className="bg-gray-800/50 border border-gray-700/50 rounded-lg p-3">
        <div className="flex justify-between items-center mb-2">
          <span className="font-space-mono text-xs text-gray-400">
            TIMELINE CONTROL
          </span>
          <span className="font-space-mono text-xs text-gray-300">
            {100 - oneirocumControl}% RESISTANCE
          </span>
        </div>
        <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-red-500 to-red-600 relative transition-all duration-1000"
            style={{ width: `${oneirocumControl}%` }}
          >
            <div className="absolute right-0 top-0 bottom-0 w-1 bg-white/50 animate-pulse" />
          </div>
        </div>
        <div className="flex justify-between mt-2">
          <span className="font-space-mono text-xs text-red-400">
            ONEIROCOM: {oneirocumControl}%
          </span>
          <span className="font-space-mono text-xs text-green-400">
            GREEN LOOM: {100 - oneirocumControl}%
          </span>
        </div>
      </div>

      {/* Mobile Quick Stats - Shown only on mobile */}
      <div className="flex sm:hidden items-center justify-around py-3 bg-gray-800/30 rounded-lg">
        <div className="text-center">
          <Activity className="w-4 h-4 text-gray-500 mx-auto mb-1" />
          <p className="font-space-mono text-xs text-white">
            {duration}
          </p>
        </div>
        <div className="text-center">
          <Zap className="w-4 h-4 text-gray-500 mx-auto mb-1" />
          <p className="font-space-mono text-xs text-white">
            +{impact}%
          </p>
        </div>
        <div className="text-center">
          <Shield className="w-4 h-4 text-gray-500 mx-auto mb-1" />
          <p className="font-space-mono text-xs text-white">
            {difficultyText.substring(0, 3)}
          </p>
        </div>
      </div>
    </header>
  );
}