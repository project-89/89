import { Shield, Eye, Lock, Sparkles } from "lucide-react";
import type { Lore } from "@/types/lore";

interface LoreFragment {
  id: string;
  title: string;
  subtitle?: string;
  content: string[];
  author?: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'legendary' | 'mythic';
  imageUrl?: string;
}

interface LoreFragmentsDisplayProps {
  fragments: Lore[] | LoreFragment[];
  claimedFragments: string[];
  isLoading?: boolean;
  onClaimLore?: () => void;
  onViewLore?: (fragment: Lore | LoreFragment) => void;
  isExtractingLore?: boolean;
  loreClaimed?: boolean;
}

export function LoreFragmentsDisplay({ 
  fragments, 
  claimedFragments,
  isLoading,
  onClaimLore,
  onViewLore,
  isExtractingLore,
  loreClaimed
}: LoreFragmentsDisplayProps) {
  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case "legendary": return "text-yellow-400 border-yellow-500/50 bg-yellow-900/20";
      case "rare": return "text-purple-400 border-purple-500/50 bg-purple-900/20";
      default: return "text-blue-400 border-blue-500/50 bg-blue-900/20";
    }
  };

  const unclaimedFragments = fragments.filter(
    fragment => !claimedFragments.includes(fragment.id)
  );

  if (isLoading) {
    return (
      <div className="mt-6 p-6 bg-purple-900/10 border border-purple-500/30 rounded-lg">
        <div className="flex items-center gap-3">
          <div className="w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
          <span className="font-space-mono text-sm text-purple-400">Loading mission lore...</span>
        </div>
      </div>
    );
  }

  if (fragments.length === 0) {
    return null;
  }

  return (
    <div className="mt-6 space-y-4 bg-purple-900/10 border border-purple-500/30 rounded-lg p-6">
      <h4 className="font-orbitron text-lg font-bold text-white flex items-center gap-2">
        <Shield className="w-5 h-5 text-purple-400" />
        DISCOVERED LORE FRAGMENTS
        {unclaimedFragments.length > 0 && (
          <span className="ml-auto bg-purple-500 text-white text-xs font-bold px-2 py-1 rounded-full animate-pulse">
            {unclaimedFragments.length} NEW
          </span>
        )}
      </h4>
      
      <div className="space-y-2">
        {/* Claimed Fragments */}
        {fragments
          .filter(fragment => claimedFragments.includes(fragment.id))
          .map((fragment) => {
            const rarityStyle = getRarityColor((fragment as any).rarity || 'common');
            return (
              <button
                key={fragment.id}
                onClick={() => onViewLore?.(fragment)}
                className={`
                  w-full p-4 rounded-lg border-2 text-left transition-all
                  hover:scale-[1.02] ${rarityStyle}
                `}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h5 className="font-orbitron text-sm font-bold">{fragment.title}</h5>
                    <p className="font-space-mono text-xs mt-1 opacity-75">
                      {(fragment as any).subtitle || (fragment as any).author || 'Classified Intel'}
                    </p>
                  </div>
                  <Eye className="w-4 h-4 ml-2 opacity-75" />
                </div>
              </button>
            );
          })}

        {/* Unclaimed Fragments */}
        {unclaimedFragments.map((fragment) => {
          const rarityStyle = getRarityColor((fragment as any).rarity || 'common');
          return (
            <button
              key={fragment.id}
              onClick={onClaimLore}
              disabled={isExtractingLore || loreClaimed}
              className={`
                w-full p-4 rounded-lg border-2 text-left transition-all relative overflow-hidden
                ${isExtractingLore || loreClaimed 
                  ? 'opacity-50 cursor-not-allowed' 
                  : 'hover:scale-[1.02] cursor-pointer'
                } ${rarityStyle}
              `}
            >
              <div className="flex items-start justify-between relative z-10">
                <div className="flex-1">
                  <h5 className="font-orbitron text-sm font-bold">{fragment.title}</h5>
                  <p className="font-space-mono text-xs mt-1 opacity-75">
                    {(fragment as any).subtitle || 'Click to extract quantum memory'}
                  </p>
                </div>
                {loreClaimed ? (
                  <Sparkles className="w-4 h-4 ml-2" />
                ) : (
                  <Lock className="w-4 h-4 ml-2 opacity-75" />
                )}
              </div>
              {!loreClaimed && !isExtractingLore && (
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer" />
              )}
            </button>
          );
        })}
      </div>

      {!loreClaimed && unclaimedFragments.length > 0 && !isExtractingLore && (
        <button
          onClick={onClaimLore}
          className="w-full mt-4 px-4 py-3 bg-purple-500 hover:bg-purple-600 text-white font-orbitron text-sm font-bold uppercase rounded-lg transition-all transform hover:scale-[1.02]"
        >
          Extract Quantum Memory
        </button>
      )}
    </div>
  );
}