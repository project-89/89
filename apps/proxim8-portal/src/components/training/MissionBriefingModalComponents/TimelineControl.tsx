interface TimelineControlProps {
  oneirocumControl: number;
}

export function TimelineControl({ oneirocumControl }: TimelineControlProps) {
  const resistancePercent = 100 - oneirocumControl;
  
  return (
    <div className="bg-gray-800/30 border border-gray-700/50 rounded-lg p-4">
      <div className="flex justify-between items-center mb-2">
        <span className="font-space-mono text-xs text-gray-400">TIMELINE CONTROL</span>
        <span className="font-space-mono text-xs text-gray-300">
          {resistancePercent}% RESISTANCE
        </span>
      </div>
      <div className="w-full h-3 bg-gray-800 rounded-full overflow-hidden">
        <div 
          className="h-full bg-gradient-to-r from-red-500 to-red-600 relative"
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
          GREEN LOOM: {resistancePercent}%
        </span>
      </div>
    </div>
  );
}