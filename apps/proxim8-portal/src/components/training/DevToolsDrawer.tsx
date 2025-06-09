"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, Code, Database, Zap, Shield } from "lucide-react";
import type { TrainingMissionData } from "./TrainingMissionCard";

interface DevToolsDrawerProps {
  mission: TrainingMissionData | null;
  deployment?: any; // Full deployment data from backend
  rawMissionData?: any; // Raw mission template data
  isOpen: boolean;
  onToggle: () => void;
  onClearMission?: (missionId: string) => void;
  onCompleteMission?: (deploymentId: string) => void;
}

export function DevToolsDrawer({ 
  mission, 
  deployment, 
  rawMissionData,
  isOpen, 
  onToggle,
  onClearMission,
  onCompleteMission
}: DevToolsDrawerProps) {
  const [activeTab, setActiveTab] = useState<"mission" | "deployment" | "phases" | "raw">("mission");

  if (!mission) return null;

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={onToggle}
        className={`
          fixed top-1/2 -translate-y-1/2 z-[60]
          bg-gray-800 border border-gray-700 rounded-l-lg
          p-2 hover:bg-gray-700 transition-all
          ${isOpen ? "right-[400px]" : "right-0"}
        `}
        title="Toggle Developer Tools"
      >
        <div className="flex items-center gap-1">
          {isOpen ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          <Code className="w-4 h-4" />
        </div>
      </button>

      {/* Drawer */}
      <div
        className={`
          fixed top-0 right-0 h-full w-[400px] z-[60]
          bg-gray-900 border-l border-gray-700
          transform transition-transform duration-300
          ${isOpen ? "translate-x-0" : "translate-x-full"}
          overflow-hidden flex flex-col
        `}
      >
        {/* Header */}
        <div className="p-4 border-b border-gray-700">
          <h3 className="font-orbitron text-sm font-bold text-white flex items-center gap-2">
            <Code className="w-4 h-4 text-blue-400" />
            DEVELOPER TOOLS
          </h3>
          <p className="font-space-mono text-xs text-gray-400 mt-1">
            Mission: {mission.title}
          </p>
          
          {/* Dev Controls */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mt-3 flex gap-2">
              {deployment && (
                <>
                  <button
                    onClick={() => onCompleteMission?.(deployment.deploymentId)}
                    className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-xs font-space-mono rounded transition-colors"
                    title="Force complete mission and reveal all phases"
                  >
                    Force Complete
                  </button>
                  <button
                    onClick={() => onClearMission?.(mission.id)}
                    className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-xs font-space-mono rounded transition-colors"
                    title="Clear mission deployment data"
                  >
                    Reset Mission
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-700">
          <button
            onClick={() => setActiveTab("mission")}
            className={`
              flex-1 px-3 py-2 font-space-mono text-xs transition-all
              ${activeTab === "mission" 
                ? "bg-gray-800 text-white border-b-2 border-blue-400" 
                : "text-gray-400 hover:text-white hover:bg-gray-800/50"
              }
            `}
          >
            Mission
          </button>
          <button
            onClick={() => setActiveTab("deployment")}
            className={`
              flex-1 px-3 py-2 font-space-mono text-xs transition-all
              ${activeTab === "deployment" 
                ? "bg-gray-800 text-white border-b-2 border-blue-400" 
                : "text-gray-400 hover:text-white hover:bg-gray-800/50"
              }
            `}
          >
            Deployment
          </button>
          <button
            onClick={() => setActiveTab("phases")}
            className={`
              flex-1 px-3 py-2 font-space-mono text-xs transition-all
              ${activeTab === "phases" 
                ? "bg-gray-800 text-white border-b-2 border-blue-400" 
                : "text-gray-400 hover:text-white hover:bg-gray-800/50"
              }
            `}
            disabled={!deployment?.phases}
          >
            Phases
          </button>
          <button
            onClick={() => setActiveTab("raw")}
            className={`
              flex-1 px-3 py-2 font-space-mono text-xs transition-all
              ${activeTab === "raw" 
                ? "bg-gray-800 text-white border-b-2 border-blue-400" 
                : "text-gray-400 hover:text-white hover:bg-gray-800/50"
              }
            `}
          >
            Raw
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 font-space-mono text-xs">
          {activeTab === "mission" && (
            <div className="space-y-4">
              <div>
                <h4 className="text-gray-400 mb-2">Basic Info</h4>
                <pre className="bg-gray-800 p-3 rounded overflow-x-auto">
{JSON.stringify({
  id: mission.id,
  sequence: mission.sequence,
  status: mission.status,
  duration: mission.duration,
  oneirocumControl: mission.oneirocumControl,
  approaches: mission.approaches
}, null, 2)}
                </pre>
              </div>
              
              <div>
                <h4 className="text-gray-400 mb-2">Dates & Location</h4>
                <pre className="bg-gray-800 p-3 rounded overflow-x-auto">
{JSON.stringify({
  date: mission.date,
  location: mission.location,
  imageUrl: mission.imageUrl
}, null, 2)}
                </pre>
              </div>

              <div>
                <h4 className="text-gray-400 mb-2">Content</h4>
                <pre className="bg-gray-800 p-3 rounded overflow-x-auto">
{JSON.stringify({
  title: mission.title,
  description: mission.description,
  briefing: mission.briefing
}, null, 2)}
                </pre>
              </div>
            </div>
          )}

          {activeTab === "deployment" && (
            <div className="space-y-4">
              {deployment ? (
                <>
                  <div>
                    <h4 className="text-gray-400 mb-2">Deployment Info</h4>
                    <pre className="bg-gray-800 p-3 rounded overflow-x-auto">
{JSON.stringify({
  deploymentId: deployment.deploymentId,
  status: deployment.status,
  approach: deployment.approach,
  proxim8Id: deployment.proxim8Id,
  currentPhase: deployment.currentPhase,
  finalSuccessRate: deployment.finalSuccessRate
}, null, 2)}
                    </pre>
                  </div>

                  <div>
                    <h4 className="text-gray-400 mb-2">Timing</h4>
                    <pre className="bg-gray-800 p-3 rounded overflow-x-auto">
{JSON.stringify({
  deployedAt: deployment.deployedAt,
  completesAt: deployment.completesAt,
  duration: deployment.duration
}, null, 2)}
                    </pre>
                  </div>

                  {deployment.result && (
                    <div>
                      <h4 className="text-gray-400 mb-2">Result</h4>
                      <pre className="bg-gray-800 p-3 rounded overflow-x-auto">
{JSON.stringify(deployment.result, null, 2)}
                      </pre>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-gray-500">No deployment data available</p>
              )}
            </div>
          )}

          {activeTab === "phases" && (
            <div className="space-y-4">
              {deployment?.phases ? (
                deployment.phases.map((phase: any, index: number) => (
                  <div key={phase.phaseId || index} className="border border-gray-700 rounded p-3">
                    <h4 className="text-white mb-2 flex items-center gap-2">
                      Phase {index + 1}: {phase.name}
                      {phase.success && <Shield className="w-3 h-3 text-green-400" />}
                      {phase.success === false && <Zap className="w-3 h-3 text-red-400" />}
                    </h4>
                    <pre className="bg-gray-800 p-2 rounded text-xs overflow-x-auto">
{JSON.stringify({
  phaseId: phase.phaseId,
  success: phase.success,
  diceRoll: phase.diceRoll,
  successThreshold: phase.successThreshold,
  tensionLevel: phase.tensionLevel,
  revealTime: phase.revealTime,
  completedAt: phase.completedAt
}, null, 2)}
                    </pre>
                    {phase.narrative && (
                      <div className="mt-2">
                        <p className="text-gray-400 mb-1">Narrative:</p>
                        <p className="text-gray-300 text-xs">{phase.narrative}</p>
                      </div>
                    )}
                    {phase.firstPersonReport && (
                      <div className="mt-2">
                        <p className="text-gray-400 mb-1">First Person:</p>
                        <p className="text-gray-300 text-xs">{phase.firstPersonReport}</p>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-gray-500">No phase data available</p>
              )}
            </div>
          )}

          {activeTab === "raw" && (
            <div className="space-y-4">
              <div>
                <h4 className="text-gray-400 mb-2 flex items-center gap-2">
                  <Database className="w-3 h-3" />
                  Complete Mission Object
                </h4>
                <pre className="bg-gray-800 p-3 rounded overflow-x-auto text-[10px]">
{JSON.stringify(mission, null, 2)}
                </pre>
              </div>

              {deployment && (
                <div>
                  <h4 className="text-gray-400 mb-2 flex items-center gap-2">
                    <Database className="w-3 h-3" />
                    Complete Deployment Object
                  </h4>
                  <pre className="bg-gray-800 p-3 rounded overflow-x-auto text-[10px]">
{JSON.stringify(deployment, null, 2)}
                  </pre>
                </div>
              )}

              {rawMissionData && (
                <div>
                  <h4 className="text-gray-400 mb-2 flex items-center gap-2">
                    <Database className="w-3 h-3" />
                    Raw Mission Template
                  </h4>
                  <pre className="bg-gray-800 p-3 rounded overflow-x-auto text-[10px]">
{JSON.stringify(rawMissionData, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}