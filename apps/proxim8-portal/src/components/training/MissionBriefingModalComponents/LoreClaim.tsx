import { ChevronLeft, Shield, Check } from "lucide-react";

interface LoreFragment {
  id: string;
  title: string;
  subtitle: string;
  content: string[];
  author: string;
  imageUrl?: string;
  rarity: "common" | "rare" | "legendary";
}

interface LoreClaimProps {
  fragment: LoreFragment;
  fragmentIndex: number;
  loreClaimed: boolean;
  eventImageUrl?: string;
  onBack: () => void;
}

export function LoreClaim({ 
  fragment, 
  fragmentIndex, 
  loreClaimed, 
  eventImageUrl,
  onBack 
}: LoreClaimProps) {
  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case "legendary":
        return "text-yellow-400 border-yellow-500/50 bg-yellow-900/20";
      case "rare":
        return "text-purple-400 border-purple-500/50 bg-purple-900/20";
      default:
        return "text-blue-400 border-blue-500/50 bg-blue-900/20";
    }
  };

  const rarityStyle = getRarityColor(fragment.rarity);

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Back button */}
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
      >
        <ChevronLeft className="w-4 h-4" />
        <span className="font-space-mono text-sm">
          Back to Mission Report
        </span>
      </button>

      <div className="text-center">
        <h3 className="font-orbitron text-2xl font-bold text-white mb-2">
          LORE FRAGMENT RECOVERED
        </h3>
        <p className="font-space-mono text-sm text-gray-400">
          Your Proxim8 extracted critical intelligence from the timeline breach
        </p>
      </div>

      {/* Lore Image */}
      <div className="relative aspect-video rounded-lg overflow-hidden border-2 border-purple-500/50">
        <img
          src={fragment.imageUrl || eventImageUrl || "/background-2.png"}
          alt="Recovered Memory"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/20 to-transparent" />
        <div className="absolute bottom-4 left-4 right-4">
          <div
            className={`bg-black/80 backdrop-blur-sm rounded p-3 border ${rarityStyle}`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p
                  className={`font-space-mono text-xs uppercase mb-1 ${rarityStyle.split(" ")[0]}`}
                >
                  {fragment.rarity} FRAGMENT #{fragmentIndex + 1}
                </p>
                <p className="font-orbitron text-sm text-white">
                  {fragment.title}
                </p>
              </div>
              <Shield className={`w-6 h-6 ${rarityStyle.split(" ")[0]}`} />
            </div>
          </div>
        </div>
      </div>

      {/* Lore Text */}
      <div className={`border rounded-lg p-6 ${rarityStyle}`}>
        <h4 className="font-orbitron text-lg font-bold text-white mb-2">
          {fragment.subtitle}
        </h4>
        <div className="prose prose-invert max-w-none">
          {fragment.content.map((paragraph, index) => (
            <p
              key={index}
              className="font-space-mono text-sm text-gray-300 mb-4 leading-relaxed"
            >
              {paragraph}
            </p>
          ))}
          <p className="font-space-mono text-xs text-gray-500 text-right italic mt-4">
            — {fragment.author}
          </p>
        </div>
      </div>

      {/* Claim Status */}
      <div className="text-center">
        {!loreClaimed ? (
          <div className="inline-flex items-center gap-3 px-6 py-3 bg-purple-500/20 border border-purple-500/50 rounded-lg">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-purple-500 border-t-transparent" />
            <span className="font-space-mono text-sm text-purple-400">
              Encrypting lore fragment to your wallet...
            </span>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="inline-flex items-center gap-3 px-6 py-3 bg-green-500/20 border border-green-500/50 rounded-lg">
              <Check className="w-5 h-5 text-green-400" />
              <span className="font-space-mono text-sm text-green-400">
                Lore fragment claimed successfully!
              </span>
            </div>
            <p className="font-space-mono text-xs text-gray-400">
              View your collection in the Lore Archive
            </p>
          </div>
        )}
      </div>
    </div>
  );
}