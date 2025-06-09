interface MissionBriefingProps {
  briefing?: string;
  defaultBriefing?: string;
}

export function MissionBriefing({ briefing, defaultBriefing }: MissionBriefingProps) {
  const briefingText = briefing || defaultBriefing || 
    `Agent, This represents a critical inflection point in the timeline war. Our quantum analysts have identified this moment as a key vulnerability in Oneirocom's control matrix. Your intervention here could cascade across multiple probability branches, weakening their grip on human consciousness. The window for action is narrow - their temporal shielding is at its weakest during this event. We must strike with precision.`;
  
  return (
    <div className="bg-gray-800/30 border border-gray-700/50 rounded-lg p-6">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
        <h3 className="font-orbitron text-sm font-bold text-white">CLASSIFIED BRIEFING</h3>
      </div>
      <p className="font-space-mono text-sm text-gray-300 leading-relaxed mb-4">
        {briefingText}
      </p>
      <p className="font-space-mono text-xs text-green-400 text-right italic">
        — SERAPH, TIMELINE COMMAND
      </p>
    </div>
  );
}