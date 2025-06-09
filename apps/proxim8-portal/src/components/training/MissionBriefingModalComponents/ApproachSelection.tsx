import { Zap, Swords, Search, Users } from "lucide-react";
import type { Approach } from "@/lib/timeline-data";

interface ApproachOption {
  type: Approach;
  icon: React.ReactNode;
  name: string;
  description: string;
  risk: string;
}

const APPROACH_OPTIONS: ApproachOption[] = [
  {
    type: "sabotage",
    icon: <Swords className="w-5 h-5" />,
    name: "Direct Sabotage",
    description: "Disrupt Oneirocom operations through system infiltration",
    risk: "High Risk, High Impact",
  },
  {
    type: "expose",
    icon: <Search className="w-5 h-5" />,
    name: "Information Warfare",
    description: "Expose corporate secrets and awaken public consciousness",
    risk: "Medium Risk, Strategic Impact",
  },
  {
    type: "organize",
    icon: <Users className="w-5 h-5" />,
    name: "Resistance Building",
    description: "Recruit allies and establish underground networks",
    risk: "Low Risk, Long-term Impact",
  },
];

interface ApproachSelectionProps {
  selectedApproach: Approach | null;
  onSelectApproach: (approach: Approach) => void;
  availableApproaches?: Approach[];
}

export function ApproachSelection({
  selectedApproach,
  onSelectApproach,
  availableApproaches,
}: ApproachSelectionProps) {
  const options = APPROACH_OPTIONS.filter(
    (opt) => !availableApproaches || availableApproaches.includes(opt.type)
  );

  return (
    <div className="space-y-3">
      {options.map((approach) => (
        <button
          key={approach.type}
          onClick={() => onSelectApproach(approach.type)}
          className={`
            w-full p-4 rounded-lg border-2 transition-all text-left
            ${
              selectedApproach === approach.type
                ? "border-primary-500 bg-primary-500/10"
                : "border-gray-700 bg-gray-800/30 hover:border-gray-600 hover:bg-gray-800/50"
            }
          `}
        >
          <div className="flex items-start gap-3">
            <div
              className={`
              p-2 rounded-lg mt-1
              ${selectedApproach === approach.type ? "bg-primary-500" : "bg-gray-700"}
            `}
            >
              {approach.icon}
            </div>
            <div className="flex-1">
              <h4 className="font-orbitron text-sm font-bold text-white uppercase">
                {approach.name}
              </h4>
              <p className="font-space-mono text-xs text-gray-400 mt-1">
                {approach.description}
              </p>
              <p
                className={`
                font-space-mono text-xs mt-2
                ${selectedApproach === approach.type ? "text-primary-400" : "text-gray-500"}
              `}
              >
                {approach.risk}
              </p>
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}
