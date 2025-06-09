export function QuantumExtraction() {
  return (
    <div className="flex flex-col items-center justify-center h-full">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="relative inline-block mb-6">
            {/* Outer ring */}
            <div className="absolute inset-0 rounded-full border-2 border-purple-500/30 animate-ping" />
            <div className="absolute inset-0 rounded-full border-2 border-purple-500/50 animate-ping animation-delay-200" />

            {/* Core */}
            <div className="relative w-24 h-24 rounded-full bg-purple-900/20 border border-purple-500/50 flex items-center justify-center">
              <div className="w-16 h-16 rounded-full bg-purple-800/30 border border-purple-400/50 flex items-center justify-center animate-pulse">
                <div className="w-8 h-8 rounded-full bg-purple-600/50 animate-spin" />
              </div>
            </div>
          </div>

          <h3 className="font-orbitron text-xl font-bold text-white mb-2">
            EXTRACTING QUANTUM MEMORY
          </h3>
          <p className="font-space-mono text-sm text-gray-400">
            Accessing timeline echoes from the quantum substrate...
          </p>
        </div>

        {/* Progress indicators */}
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse" />
            <span className="font-space-mono text-xs text-purple-400">
              Scanning probability fields...
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse animation-delay-200" />
            <span className="font-space-mono text-xs text-purple-400">
              Decrypting memory fragments...
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse animation-delay-400" />
            <span className="font-space-mono text-xs text-purple-400">
              Reconstructing timeline data...
            </span>
          </div>
        </div>

        <div className="text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500/10 border border-purple-500/30 rounded-lg">
            <div className="w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
            <span className="font-space-mono text-xs text-purple-400">
              QUANTUM LINK ESTABLISHED
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}