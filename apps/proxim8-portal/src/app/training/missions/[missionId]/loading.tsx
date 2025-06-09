export default function MissionLoading() {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="relative w-24 h-24 mx-auto">
          <div className="absolute inset-0 border-4 border-green-500/20 rounded-full animate-ping" />
          <div className="absolute inset-0 border-4 border-green-500/40 rounded-full animate-ping animation-delay-200" />
          <div className="relative w-full h-full border-4 border-green-500 rounded-full flex items-center justify-center">
            <div className="w-16 h-16 border-4 border-green-500/50 rounded-full animate-spin" />
          </div>
        </div>
        <div>
          <h2 className="font-orbitron text-xl font-bold text-white mb-2">
            ACCESSING MISSION DATA
          </h2>
          <p className="font-space-mono text-sm text-gray-400">
            Establishing quantum link...
          </p>
        </div>
      </div>
    </div>
  );
}