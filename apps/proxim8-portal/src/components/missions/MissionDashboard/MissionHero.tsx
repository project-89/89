import type { TrainingMission } from "@/lib/api/missions";
import { MissionPhase, MissionDeployment } from "../../../types/mission";
import { Zap, AlertTriangle, CheckCircle, Loader, ChevronLeft, Clock, Shield, Activity } from "lucide-react";
import Link from "next/link";
import { 
  getMissionImageUrl, 
  getMissionDuration, 
  calculateDifficulty,
  getDifficultyText,
  getMissionApproach 
} from "@/utils/missionHelpers";

interface MissionHeroProps {
  mission: TrainingMission;
  phase: MissionPhase;
  deployment?: MissionDeployment | null;
  onBeginMission: () => void;
}

export function MissionHero({ mission, phase, deployment, onBeginMission }: MissionHeroProps) {
  const isFailed = phase === "failed";
  const isCompleted = phase === "completed";
  const oneirocumControl = 100 - (mission.sequence - 1) * 10;
  
  // Get mission display values using helpers
  const imageUrl = getMissionImageUrl(mission);
  const duration = getMissionDuration(mission);
  const difficulty = calculateDifficulty(mission);
  const difficultyText = getDifficultyText(difficulty);
  const mediumApproach = getMissionApproach(mission, 'medium');
  const rewards = mediumApproach?.rewards?.timelinePoints || 100;

  return (
    <section className="relative -mt-20">
      {/* Banner Image - Full opacity with overlay gradient, extends under navbar */}
      <div className="relative h-[380px] md:h-[480px] overflow-hidden">
        <img
          src={imageUrl}
          alt={mission.title}
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/60 to-black" />
        
        {/* Back Navigation - Overlaid on image, positioned below navbar */}
        <div className="absolute top-24 left-4 md:top-26 md:left-6 z-20">
          <Link
            href="/training"
            className="inline-flex items-center gap-2 text-white/80 hover:text-white transition-colors font-space-mono text-sm backdrop-blur-sm bg-black/30 px-3 py-2 rounded-lg"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to Training
          </Link>
        </div>

        {/* Mission Title and Status - Overlaid on image */}
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8 z-10">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
              <div className="flex-1">
                {/* Status Badge */}
                {(phase === "available" || isFailed || isCompleted) && (
                  <div className="mb-4">
                    {phase === "available" && (
                      <span className="inline-flex items-center gap-2 px-4 py-2 bg-gray-700/90 text-gray-300 font-space-mono text-sm rounded-full backdrop-blur-sm">
                        <Zap className="w-4 h-4" />
                        MISSION AVAILABLE
                      </span>
                    )}
                    {isFailed && (
                      <span className="inline-flex items-center gap-2 px-4 py-2 bg-red-500/90 text-white font-space-mono text-sm rounded-full backdrop-blur-sm">
                        <AlertTriangle className="w-4 h-4" />
                        MISSION FAILED
                      </span>
                    )}
                    {isCompleted && (
                      <span className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/90 text-white font-space-mono text-sm rounded-full backdrop-blur-sm">
                        <CheckCircle className="w-4 h-4" />
                        MISSION COMPLETED
                      </span>
                    )}
                  </div>
                )}
                
                {/* Mission Title */}
                <h1 className="font-orbitron text-3xl md:text-5xl font-bold text-white mb-2">
                  {mission.title}
                </h1>
                
                {/* Location and Date */}
                <p className="font-space-mono text-sm md:text-base text-white/80">
                  {mission.location} • {mission.date}
                </p>

                {/* Quick Stats - Inline with title on desktop */}
                <div className="flex flex-wrap items-center gap-6 mt-4">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-white/60" />
                    <span className="font-space-mono text-sm text-white/80">
                      {duration}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-white/60" />
                    <span className="font-space-mono text-sm text-white/80">
                      {rewards} P89
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-white/60" />
                    <span className="font-space-mono text-sm text-white/80">
                      {difficultyText}
                    </span>
                  </div>
                </div>
              </div>

              {/* Begin Operation Button - Only for available missions */}
              {phase === "available" && (
                <div className="mt-4 md:mt-0">
                  <button
                    onClick={onBeginMission}
                    className="px-6 py-3 bg-yellow-500 hover:bg-yellow-400 text-black font-orbitron font-bold rounded-lg transition-all transform hover:scale-105 shadow-lg"
                  >
                    BEGIN OPERATION
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Timeline Control Bar - Below hero image */}
      <div className="bg-gray-900 border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-6 md:px-8 py-4">
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
      </div>

      {/* Remove the separate CTA section - button is now in the banner */}
    </section>
  );
}