import { FileText, Target, Clock, MapPin, Play, AlertTriangle, Shield, Users, Zap } from "lucide-react";
import { useState } from "react";
import type { TrainingMission } from "@/lib/api/missions";
import type { MissionPhase } from "@/types/mission";

interface BriefingPanelProps {
  mission: TrainingMission;
  phase: MissionPhase;
}

export function BriefingPanel({ mission, phase }: BriefingPanelProps) {
  const [showVideo, setShowVideo] = useState(false);
  const briefingData = typeof mission.briefing === 'object' && mission.briefing !== null 
    ? mission.briefing as any
    : { text: mission.briefing };

  const briefingVideoUrl = briefingData.videoUrl || mission.briefingVideo || null;
  const threatLevel = briefingData.threatLevel || 
    (typeof mission.difficulty === 'object' ? mission.difficulty.threatLevel : null) || 
    "moderate";

  // Threat level colors
  const threatColors = {
    low: "text-green-400 border-green-400/30 bg-green-400/10",
    moderate: "text-yellow-400 border-yellow-400/30 bg-yellow-400/10",
    high: "text-orange-400 border-orange-400/30 bg-orange-400/10",
    critical: "text-red-400 border-red-400/30 bg-red-400/10"
  };

  return (
    <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-700/50 rounded-lg h-full flex flex-col relative overflow-hidden">
      {/* Background Animation */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0 bg-gradient-to-br from-green-400 via-transparent to-blue-400 animate-pulse" />
      </div>
      
      <div className="p-4 md:p-6 space-y-6 flex-1 overflow-y-auto relative z-10">
        {/* Header with Threat Level */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FileText className="w-5 h-5 text-green-400" />
            <h3 className="font-orbitron text-lg font-bold text-white">
              MISSION BRIEFING
            </h3>
          </div>
          <div className={`flex items-center gap-2 px-3 py-1 rounded-full border ${threatColors[threatLevel as keyof typeof threatColors] || threatColors.moderate}`}>
            <AlertTriangle className="w-3 h-3" />
            <span className="font-space-mono text-xs uppercase">{threatLevel}</span>
          </div>
        </div>

        {/* Video Section (if available) */}
        {briefingVideoUrl && (
          <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
            {showVideo ? (
              <div className="relative w-full h-full">
                <iframe
                  src={briefingVideoUrl}
                  className="absolute inset-0 w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            ) : (
              <button
                onClick={() => setShowVideo(true)}
                className="absolute inset-0 flex items-center justify-center bg-gray-800/50 hover:bg-gray-800/30 transition-colors group"
              >
                <div className="flex flex-col items-center gap-2">
                  <Play className="w-12 h-12 text-green-400 group-hover:scale-110 transition-transform" />
                  <span className="font-space-mono text-sm text-gray-300">PLAY BRIEFING VIDEO</span>
                </div>
              </button>
            )}
          </div>
        )}

        {/* Mission Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <p className="font-space-mono text-xs text-gray-500 uppercase">
                Primary Objective
              </p>
              <p className="font-space-mono text-sm text-gray-300 leading-relaxed">
                {mission.description}
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <p className="font-space-mono text-xs text-gray-500 uppercase flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  Date
                </p>
                <p className="font-space-mono text-sm text-gray-300">
                  {mission.date}
                </p>
              </div>
              <div className="space-y-2">
                <p className="font-space-mono text-xs text-gray-500 uppercase flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  Location
                </p>
                <p className="font-space-mono text-sm text-gray-300">
                  {mission.location}
                </p>
              </div>
            </div>
            {mission.duration && (
              <div className="space-y-2">
                <p className="font-space-mono text-xs text-gray-500 uppercase flex items-center gap-1">
                  <Zap className="w-3 h-3" />
                  Mission Duration
                </p>
                <p className="font-space-mono text-sm text-gray-300">
                  {mission.duration}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Classified Briefing */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <p className="font-space-mono text-xs text-green-400 uppercase">
              Classified Intel
            </p>
          </div>
          <div className="bg-black/30 rounded-lg p-4 border border-green-400/20">
            <p className="font-space-mono text-sm text-gray-300 leading-relaxed">
              {briefingData.text || `Agent, The ${mission.title} represents a critical inflection point in the timeline war. Our quantum analysts have identified this moment as a key vulnerability in Oneirocom's control matrix. Your intervention here could cascade across multiple probability branches, weakening their grip on human consciousness. The window for action is narrow - their temporal shielding is at its weakest during this event. We must strike with precision.`}
            </p>
          </div>
        </div>

        {/* Dynamic Mission Data */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Objectives List */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-yellow-400" />
              <p className="font-space-mono text-xs text-yellow-400 uppercase">
                Mission Objectives
              </p>
            </div>
            <ul className="space-y-2">
              {briefingData.objectives ? (
                briefingData.objectives.map((objective: string, index: number) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-green-400 mt-0.5">▸</span>
                    <span className="font-space-mono text-sm text-gray-300">
                      {objective}
                    </span>
                  </li>
                ))
              ) : (
                <>
                  <li className="flex items-start gap-2">
                    <span className="text-green-400 mt-0.5">▸</span>
                    <span className="font-space-mono text-sm text-gray-300">
                      Infiltrate target location during vulnerability window
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-400 mt-0.5">▸</span>
                    <span className="font-space-mono text-sm text-gray-300">
                      Deploy temporal manipulation device undetected
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-400 mt-0.5">▸</span>
                    <span className="font-space-mono text-sm text-gray-300">
                      Extract without compromising timeline integrity
                    </span>
                  </li>
                </>
              )}
            </ul>
          </div>

          {/* Mission Parameters */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-blue-400" />
              <p className="font-space-mono text-xs text-blue-400 uppercase">
                Mission Parameters
              </p>
            </div>
            <div className="space-y-2">
              {mission.compatibility && (
                <div className="flex justify-between items-center">
                  <span className="font-space-mono text-xs text-gray-500">Compatibility:</span>
                  <span className="font-space-mono text-xs text-gray-300">
                    {Array.isArray(mission.compatibility) 
                      ? mission.compatibility.join(", ")
                      : mission.compatibility.preferred?.join(", ") || "Any"}
                  </span>
                </div>
              )}
              {mission.difficulty && (
                <>
                  <div className="flex justify-between items-center">
                    <span className="font-space-mono text-xs text-gray-500">Complexity:</span>
                    <span className="font-space-mono text-xs text-gray-300">
                      {typeof mission.difficulty === 'number' 
                        ? `${mission.difficulty}/10`
                        : `${mission.difficulty.value || mission.difficulty}/10`}
                    </span>
                  </div>
                  {typeof mission.difficulty === 'object' && mission.difficulty.securityLevel && (
                    <div className="flex justify-between items-center">
                      <span className="font-space-mono text-xs text-gray-500">Security Level:</span>
                      <span className="font-space-mono text-xs text-gray-300">{mission.difficulty.securityLevel}</span>
                    </div>
                  )}
                </>
              )}
              {mission.phases && mission.phases.length > 0 && (
                <div className="flex justify-between items-center">
                  <span className="font-space-mono text-xs text-gray-500">Phases:</span>
                  <span className="font-space-mono text-xs text-gray-300">{mission.phases.length}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Critical Intel (if available) */}
        {briefingData.criticalIntel && (
          <div className="bg-red-900/20 border border-red-700/50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-red-400" />
              <p className="font-space-mono text-xs text-red-400 uppercase">
                Critical Intel
              </p>
            </div>
            <p className="font-space-mono text-sm text-gray-300">
              {briefingData.criticalIntel}
            </p>
          </div>
        )}

        {/* Phase-specific content */}
        {phase === "completed" && (
          <div className="border-t border-gray-700/50 pt-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-2 bg-green-400 rounded-full" />
              <p className="font-space-mono text-xs text-green-400 uppercase">
                Mission Debrief
              </p>
            </div>
            <div className="bg-green-900/20 border border-green-700/50 rounded-lg p-4">
              <p className="font-space-mono text-sm text-gray-300">
                {briefingData.debrief || `Timeline manipulation successful. Oneirocom control reduced by ${6 + mission.sequence}%. Your actions have created ripples across probability streams.`}
              </p>
            </div>
          </div>
        )}

        {phase === "failed" && (
          <div className="border-t border-gray-700/50 pt-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-2 bg-red-400 rounded-full" />
              <p className="font-space-mono text-xs text-red-400 uppercase">
                Mission Failed
              </p>
            </div>
            <div className="bg-red-900/20 border border-red-700/50 rounded-lg p-4">
              <p className="font-space-mono text-sm text-gray-300">
                Mission parameters were not met. Timeline remains unchanged. Regroup and prepare for another attempt when the window reopens.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}