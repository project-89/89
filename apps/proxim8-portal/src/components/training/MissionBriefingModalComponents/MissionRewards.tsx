import { Trophy, Shield, Activity } from "lucide-react";

interface Rewards {
  timelinePoints?: number;
  experience?: number;
  loreFragments?: string[];
}

interface MissionRewardsProps {
  rewards?: Rewards;
}

export function MissionRewards({ rewards }: MissionRewardsProps) {
  const timelinePoints = rewards?.timelinePoints || 100;
  const experience = rewards?.experience || 50;
  const hasLore = rewards?.loreFragments && rewards.loreFragments.length > 0;

  return (
    <div className="bg-gray-800/30 border border-gray-700/50 rounded-lg p-4">
      <h4 className="font-orbitron text-sm font-bold text-white mb-3 flex items-center gap-2">
        <Trophy className="w-4 h-4 text-yellow-400" />
        MISSION REWARDS
      </h4>
      <div className="space-y-3">
        <div className="flex items-center justify-between p-2 bg-yellow-500/10 rounded">
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-yellow-400" />
            <span className="font-space-mono text-sm text-gray-300">Timeline Points</span>
          </div>
          <span className="font-orbitron text-sm font-bold text-yellow-400">+{timelinePoints}</span>
        </div>
        
        <div className="flex items-center justify-between p-2 bg-purple-500/10 rounded">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-purple-400" />
            <span className="font-space-mono text-sm text-gray-300">Lore Fragment</span>
          </div>
          <span className="font-orbitron text-sm font-bold text-purple-400">
            {hasLore ? "UNLOCKED" : "PENDING"}
          </span>
        </div>
        
        <div className="flex items-center justify-between p-2 bg-blue-500/10 rounded">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-blue-400" />
            <span className="font-space-mono text-sm text-gray-300">XP Gained</span>
          </div>
          <span className="font-orbitron text-sm font-bold text-blue-400">+{experience}</span>
        </div>
      </div>
    </div>
  );
}