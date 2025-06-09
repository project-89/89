import { Shield, Check } from "lucide-react";

interface DeploymentProgressProps {
  stage: 'deploying' | 'processing' | 'ready';
  progress: number;
  selectedProxim8?: {
    name: string;
    image: string;
  };
}

export function DeploymentProgress({ stage, progress, selectedProxim8 }: DeploymentProgressProps) {
  return (
    <div className="py-12">
      <div className="max-w-md mx-auto">
        {/* Title based on stage */}
        <div className="text-center mb-8">
          <h3 className="font-orbitron text-xl font-bold text-white mb-2">
            {stage === 'deploying' && 'INITIATING TEMPORAL BREACH'}
            {stage === 'processing' && 'AI PHASE GENERATION'}
            {stage === 'ready' && 'DEPLOYMENT SUCCESSFUL'}
          </h3>
          <p className="font-space-mono text-sm text-gray-400">
            {stage === 'deploying' && 'Establishing quantum tunnel to target timeline...'}
            {stage === 'processing' && 'Generating mission phases and analyzing probability matrices...'}
            {stage === 'ready' && 'Your agent has successfully infiltrated the timeline'}
          </p>
        </div>

        {/* Proxim8 Portrait with effects */}
        {selectedProxim8 && (
          <div className="flex justify-center mb-8">
            <div className="relative">
              <div className="w-32 h-32 rounded-full overflow-hidden border-2 border-yellow-500 relative">
                <img 
                  src={selectedProxim8.image} 
                  alt={selectedProxim8.name}
                  className="w-full h-full object-cover"
                  style={{
                    filter: stage === 'ready' 
                      ? 'none'
                      : 'hue-rotate(120deg) brightness(1.3)',
                  }}
                />
                {stage !== 'ready' && (
                  <div className="absolute inset-0 rounded-lg animate-ping bg-yellow-500/20" />
                )}
                {stage === 'ready' && (
                  <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                    <Check className="w-5 h-5 text-white" />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Progress Bar or Status */}
        <div className="space-y-3">
          {stage !== 'ready' ? (
            <>
              <div className="bg-gray-800 rounded-full h-4 overflow-hidden">
                <div 
                  className={`h-full transition-all duration-300 relative ${
                    stage === 'deploying' 
                      ? 'bg-gradient-to-r from-yellow-500 via-green-500 to-blue-500'
                      : 'bg-gradient-to-r from-purple-500 via-pink-500 to-purple-500 animate-pulse'
                  }`}
                  style={{ width: stage === 'deploying' ? `${progress}%` : '100%' }}
                >
                  <div className="absolute right-0 top-0 bottom-0 w-8 bg-white/50 animate-pulse" />
                </div>
              </div>
              <div className="flex justify-between font-space-mono text-xs">
                <span className="text-gray-400">
                  {stage === 'deploying' ? 'QUANTUM TUNNEL ACTIVE' : 'AI PHASE GENERATION'}
                </span>
                <span className="text-yellow-400">
                  {stage === 'deploying' ? `${Math.floor(progress)}%` : 'PROCESSING...'}
                </span>
              </div>
            </>
          ) : (
            <div className="bg-green-500/10 border border-green-500 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-orbitron text-lg font-bold text-green-400">MISSION READY</p>
                  <p className="font-space-mono text-xs text-gray-400 mt-1">
                    Your agent has entered the timeline and is beginning operations
                  </p>
                </div>
                <Shield className="w-8 h-8 text-green-400" />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}