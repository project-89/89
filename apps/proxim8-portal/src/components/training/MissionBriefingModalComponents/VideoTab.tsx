interface VideoTabProps {
  eventTitle?: string;
  eventVideoUrl?: string;
  onSkipToBriefing: () => void;
}

export function VideoTab({ eventTitle, eventVideoUrl, onSkipToBriefing }: VideoTabProps) {
  return (
    <div className="space-y-6">
      {/* Video Player Container */}
      <div className="relative aspect-video bg-black rounded-lg overflow-hidden border border-gray-700">
        {/* Mock video player - in production would be actual video */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center space-y-4">
            {/* Play button overlay */}
            <button className="w-20 h-20 rounded-full bg-white/10 border-2 border-white/30 flex items-center justify-center hover:bg-white/20 transition-all group">
              <div className="w-0 h-0 border-l-[20px] border-l-white border-y-[12px] border-y-transparent ml-2 group-hover:scale-110 transition-transform" />
            </button>

            <div>
              <h3 className="font-orbitron text-lg font-bold text-white mb-2">
                SERAPH BRIEFING
              </h3>
              <p className="font-space-mono text-sm text-gray-400">
                Quantum transmission from Timeline Command
              </p>
            </div>
          </div>
        </div>

        {/* Video controls bar */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
          <div className="flex items-center gap-4">
            <button className="text-white/80 hover:text-white">
              <div className="w-0 h-0 border-l-[8px] border-l-white border-y-[5px] border-y-transparent" />
            </button>

            <div className="flex-1">
              <div className="h-1 bg-white/20 rounded-full">
                <div className="h-full w-0 bg-white rounded-full" />
              </div>
            </div>

            <span className="font-space-mono text-xs text-white/80">
              0:00 / 1:47
            </span>
          </div>
        </div>
      </div>

      {/* Video Info */}
      <div className="bg-gray-800/30 border border-gray-700/50 rounded-lg p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-full bg-green-500/20 border border-green-500/50 flex items-center justify-center flex-shrink-0">
            <span className="font-orbitron text-lg font-bold text-green-400">
              S
            </span>
          </div>
          <div className="flex-1">
            <h4 className="font-orbitron text-sm font-bold text-white mb-2">
              SERAPH - TIMELINE COMMAND
            </h4>
            <p className="font-space-mono text-sm text-gray-300 leading-relaxed">
              "Agent, this briefing contains classified information about a
              critical timeline vulnerability. The{" "}
              {eventTitle || "upcoming event"} represents a nexus point where
              Oneirocom's control can be disrupted. Watch carefully - the
              details matter. Every action we take ripples across probability
              streams. Make them count."
            </p>
            <div className="mt-3 flex items-center gap-4 text-xs text-gray-500 font-space-mono">
              <span>Duration: 1:47</span>
              <span>•</span>
              <span>Classification: EYES ONLY</span>
              <span>•</span>
              <span>Quantum Encrypted</span>
            </div>
          </div>
        </div>
      </div>

      {/* Optional Skip Button */}
      <div className="text-center">
        <button
          onClick={onSkipToBriefing}
          className="font-space-mono text-sm text-gray-400 hover:text-white transition-colors"
        >
          Skip to text briefing →
        </button>
      </div>
    </div>
  );
}