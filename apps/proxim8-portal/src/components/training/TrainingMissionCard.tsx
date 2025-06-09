"use client";

import { useState, useEffect } from "react";
import { Clock, CheckCircle, Zap, Lock, Sparkles } from "lucide-react";

export interface TrainingMissionData {
  id: string;
  sequence: number;
  title: string;
  date: string;
  location: string;
  description: string;
  imageUrl: string;
  duration: number; // in minutes
  status: "locked" | "available" | "active" | "completed" | "completed-success" | "completed-failure" | "in-progress";
  progress?: number; // 0-100 for active missions
  oneirocumControl: number;
  briefing: string;
  approaches: string[];
  hasUnclaimedLore?: boolean; // New field for lore indicator
}

interface TrainingMissionCardProps {
  mission: TrainingMissionData;
  onClick?: () => void;
  className?: string;
}

const STATUS_STYLES = {
  locked: {
    border: "border-gray-700",
    bg: "bg-gray-800",
    text: "text-gray-500",
  },
  available: {
    border: "border-yellow-500/50",
    bg: "bg-yellow-900/20",
    text: "text-yellow-400",
  },
  active: {
    border: "border-blue-500",
    bg: "bg-blue-900/20",
    text: "text-blue-400",
  },
  "in-progress": {
    border: "border-blue-500",
    bg: "bg-blue-900/20",
    text: "text-blue-400",
  },
  completed: {
    border: "border-green-500/50",
    bg: "bg-green-900/20",
    text: "text-green-400",
  },
  "completed-success": {
    border: "border-green-500/50",
    bg: "bg-green-900/20",
    text: "text-green-400",
  },
  "completed-failure": {
    border: "border-red-500/50",
    bg: "bg-red-900/20",
    text: "text-red-400",
  },
};

export function TrainingMissionCard({
  mission,
  onClick,
  className = "",
}: TrainingMissionCardProps) {
  const isLocked = mission.status === "locked";
  const isActive = mission.status === "active" || mission.status === "in-progress";
  const isCompleted = mission.status === "completed" || mission.status === "completed-success" || mission.status === "completed-failure";

  const colors = STATUS_STYLES[mission.status];

  // Phase tracking for in-progress missions
  const [currentPhase, setCurrentPhase] = useState(0);
  const [phaseUpdate, setPhaseUpdate] = useState("");
  
  // Calculate initial time remaining based on mission duration and any deployment info
  const calculateInitialTime = () => {
    // If mission has deployment info with completesAt time
    if ((mission as any).deploymentCompletesAt) {
      const now = new Date();
      const completesAt = new Date((mission as any).deploymentCompletesAt);
      const diffMs = completesAt.getTime() - now.getTime();
      
      if (diffMs > 0) {
        const hours = Math.floor(diffMs / (1000 * 60 * 60));
        const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
        return { hours, minutes };
      }
    }
    
    // Otherwise use mission duration
    const durationMinutes = mission.duration || 120; // Default 2 hours
    return { 
      hours: Math.floor(durationMinutes / 60), 
      minutes: durationMinutes % 60 
    };
  };
  
  const [timeRemaining, setTimeRemaining] = useState(calculateInitialTime());
  
  const phases = ["Infiltration", "System Analysis", "Demonstration Hack", "Extraction"];
  
  const getRandomUpdate = () => {
    const updates = [
      "Bypassing security protocols...",
      "Quantum tunneling established...",
      "Injecting timeline variance...",
      "Monitoring temporal flux...",
      "Adapting to countermeasures...",
      "Synchronizing quantum states...",
      "Executing payload delivery...",
      "Maintaining stealth mode...",
    ];
    return updates[Math.floor(Math.random() * updates.length)];
  };

  // Simulate phase progression and countdown for in-progress missions
  useEffect(() => {
    if (mission.status === "in-progress") {
      // Update phase every 15 seconds
      const phaseInterval = setInterval(() => {
        setCurrentPhase(prev => (prev < phases.length - 1 ? prev + 1 : prev));
      }, 15000);

      // Update status message every 3 seconds
      const updateInterval = setInterval(() => {
        setPhaseUpdate(getRandomUpdate());
      }, 3000);

      // Countdown timer
      const countdownInterval = setInterval(() => {
        // If we have deployment info, calculate from actual time
        if ((mission as any).deploymentCompletesAt) {
          const now = new Date();
          const completesAt = new Date((mission as any).deploymentCompletesAt);
          const diffMs = completesAt.getTime() - now.getTime();
          
          if (diffMs > 0) {
            const hours = Math.floor(diffMs / (1000 * 60 * 60));
            const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
            setTimeRemaining({ hours, minutes });
          } else {
            setTimeRemaining({ hours: 0, minutes: 0 });
          }
        } else {
          // Otherwise countdown normally
          setTimeRemaining(prev => {
            if (prev.minutes === 0 && prev.hours === 0) return prev;
            if (prev.minutes === 0) {
              return { hours: prev.hours - 1, minutes: 59 };
            }
            return { ...prev, minutes: prev.minutes - 1 };
          });
        }
      }, 10000); // Update every 10 seconds for more accurate display

      // Set initial update
      setPhaseUpdate(getRandomUpdate());

      return () => {
        clearInterval(phaseInterval);
        clearInterval(updateInterval);
        clearInterval(countdownInterval);
      };
    }
  }, [mission.status]);

  return (
    <div
      className={`
        relative group overflow-hidden rounded-lg bg-gray-900 border-2 transition-all duration-300
        w-[350px] flex-shrink-0
        ${colors.border}
        ${isLocked ? "cursor-not-allowed" : "cursor-pointer hover:scale-[1.02]"}
        ${className}
      `}
      onClick={isLocked ? undefined : onClick}
    >
      {/* 16:9 Image Area */}
      <div className="relative w-full aspect-video bg-gray-800 overflow-hidden">
        <img
          src={mission.imageUrl}
          alt={mission.title}
          className="w-full h-full object-cover"
        />

        {/* Top Overlay Info */}
        <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/80 to-transparent">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div
                className={`
                text-xs font-bold px-2 py-1 rounded
                ${colors.bg} ${colors.text} backdrop-blur-sm
              `}
              >
                MISSION {mission.sequence}
              </div>
              <div className="text-xs text-gray-300 bg-black/50 px-2 py-1 rounded backdrop-blur-sm">
                <Clock className="w-3 h-3 inline mr-1" />
                {mission.duration < 60
                  ? `${mission.duration}M`
                  : `${mission.duration / 60}H`}
              </div>
            </div>

            {/* Status Icons */}
            <div className="flex items-center gap-2">
              {isCompleted && <CheckCircle className="w-5 h-5 text-green-400" />}
              {isActive && (
                <Zap className="w-5 h-5 text-blue-400 animate-pulse" />
              )}
              {mission.hasUnclaimedLore && (
                <div className="bg-purple-500/90 backdrop-blur-sm px-2 py-1 rounded-full flex items-center gap-1 animate-pulse">
                  <Sparkles className="w-3 h-3 text-white" />
                  <span className="text-xs font-bold text-white">LORE</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Gradient */}
        <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-gray-900 to-transparent" />
      </div>

      {/* Content Area - Fixed Height */}
      <div className="p-5 h-[260px] flex flex-col">
        {/* Title */}
        <h3 className={`text-lg font-bold mb-1 uppercase ${colors.text}`}>
          {mission.title}
        </h3>

        {/* Date & Location */}
        <div className="text-xs text-gray-400 mb-3">
          {mission.date} • {mission.location}
        </div>

        {/* Description - Allow to grow but constrain */}
        <p className="text-sm text-gray-300 leading-relaxed line-clamp-3 flex-1">
          {mission.description}
        </p>

        {/* Status Footer - Fixed Height */}
        <div className="h-[80px] pt-3 border-t border-gray-800 flex items-center justify-center">
          {isLocked && (
            <div className="text-xs text-gray-500 uppercase text-center">
              Complete Mission {mission.sequence - 1} to unlock
            </div>
          )}
          {isCompleted && (
            <div className="flex flex-col items-center gap-1">
              <CheckCircle className="w-5 h-5 text-green-400" />
              <div className="text-sm font-bold text-green-400 uppercase">
                Mission Complete
              </div>
              {mission.hasUnclaimedLore && (
                <button 
                  className="mt-2 flex items-center gap-1 px-3 py-1 bg-purple-500/20 border border-purple-500/50 rounded-full text-purple-400 text-xs font-space-mono uppercase hover:bg-purple-500/30 hover:border-purple-400 transition-all animate-pulse"
                  onClick={(e) => {
                    e.stopPropagation();
                    onClick && onClick();
                  }}
                >
                  <Sparkles className="w-3 h-3" />
                  Lore Available
                </button>
              )}
            </div>
          )}
          {mission.status === "in-progress" && (
            <div className="w-full">
              {/* Progress bar */}
              <div className="w-full h-1 bg-gray-800 rounded-full overflow-hidden mb-2">
                <div 
                  className="h-full bg-gradient-to-r from-yellow-400 to-yellow-500 transition-all duration-500"
                  style={{ width: `${((currentPhase + 1) / phases.length) * 100}%` }}
                />
              </div>
              
              {/* Phase and countdown */}
              <div className="flex items-center justify-between mb-1">
                <span className="font-space-mono text-xs text-yellow-400 uppercase">
                  {phases[currentPhase]}
                </span>
                <span className="font-space-mono text-xs text-gray-400">
                  {timeRemaining.hours}h {String(timeRemaining.minutes).padStart(2, '0')}m
                </span>
              </div>
              
              {/* Update message */}
              <div className="font-space-mono text-xs text-yellow-400/60 truncate animate-pulse">
                &gt; {phaseUpdate}
              </div>
            </div>
          )}
          {mission.status === "active" && mission.progress !== undefined && (
            <div className="w-full">
              <div className="flex justify-between text-xs mb-2">
                <span className="text-gray-400 uppercase">In Progress</span>
                <span className="text-blue-400">{mission.progress}%</span>
              </div>
              <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-400 transition-all duration-300"
                  style={{ width: `${mission.progress}%` }}
                />
              </div>
            </div>
          )}
          {mission.status === "available" && (
            <button
              className={`
                w-full px-4 py-2 rounded 
                bg-yellow-500/20 border border-yellow-500
                text-yellow-400 font-bold text-sm uppercase
                hover:bg-yellow-500/30 hover:border-yellow-400
                transition-all duration-200
                flex items-center justify-center gap-2
              `}
              onClick={(e) => {
                e.stopPropagation();
                onClick && onClick();
              }}
            >
              <Zap className="w-4 h-4" />
              Ready to Deploy
            </button>
          )}
        </div>
      </div>

      {/* Active Mission Glow */}
      {isActive && (
        <div className="absolute inset-0 rounded-lg bg-blue-400/5" />
      )}

      {/* Locked Overlay */}
      {isLocked && (
        <div className="absolute inset-0 bg-gray-900/20 backdrop-blur-[1px] flex items-center justify-center">
          <div className="bg-gray-800/80 p-6 rounded-full">
            <Lock className="w-12 h-12 text-gray-400" />
          </div>
        </div>
      )}
    </div>
  );
}
