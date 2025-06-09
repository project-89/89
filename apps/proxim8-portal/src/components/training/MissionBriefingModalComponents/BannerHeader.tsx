import { Users, Activity, Trophy } from "lucide-react";

interface BannerHeaderProps {
  eventTitle: string;
  eventDate: string;
  eventImageUrl?: string;
  agentsActive?: number;
  totalDeployments?: number;
  successRate?: number;
}

export function BannerHeader({ 
  eventTitle, 
  eventDate, 
  eventImageUrl,
  agentsActive,
  totalDeployments,
  successRate 
}: BannerHeaderProps) {
  return (
    <div className="relative h-48 md:h-56 overflow-hidden rounded-t-lg flex-shrink-0">
      <img
        src={eventImageUrl || "/background-1.png"}
        alt={eventTitle}
        className="w-full h-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/50 to-transparent" />

      {/* Mission Stats Overlay */}
      <div className="absolute bottom-0 left-0 right-0 p-6">
        <div className="flex items-end justify-between">
          <div>
            <p className="font-space-mono text-xs text-gray-400 mb-1">
              {eventDate}
            </p>
            <h2 className="font-orbitron text-2xl font-bold text-white">
              {eventTitle}
            </h2>
          </div>
          {/* Mission Stats - Hidden until we have real data */}
          {/* TODO: Connect to real mission stats from backend
          <div className="flex gap-6">
            <div className="text-center">
              <Users className="w-5 h-5 text-gray-400 mx-auto mb-1" />
              <p className="font-space-mono text-xs text-gray-500">AGENTS</p>
              <p className="font-orbitron text-sm font-bold text-white">{agentsActive || 0}</p>
            </div>
            <div className="text-center">
              <Activity className="w-5 h-5 text-gray-400 mx-auto mb-1" />
              <p className="font-space-mono text-xs text-gray-500">PLAYS</p>
              <p className="font-orbitron text-sm font-bold text-white">{totalDeployments || 0}</p>
            </div>
            <div className="text-center">
              <Trophy className="w-5 h-5 text-gray-400 mx-auto mb-1" />
              <p className="font-space-mono text-xs text-gray-500">SUCCESS</p>
              <p className="font-orbitron text-sm font-bold text-white">{successRate || 0}%</p>
            </div>
          </div>
          */}
        </div>
      </div>
    </div>
  );
}