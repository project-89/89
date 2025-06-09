import { BriefingPanel } from "./panels/BriefingPanel";
import { ActionPanel } from "./panels/ActionPanel";
import { IntelPanel } from "./panels/IntelPanel";
import type { TrainingMission } from "@/lib/api/missions";
import type { MissionPhase, MissionSelections } from "@/types/mission";

interface MissionContentProps {
  mission: TrainingMission;
  phase: MissionPhase;
  selections: MissionSelections;
  deployment?: any;
  activePanel: "briefing" | "action" | "intel";
  isMobile: boolean;
  onUpdateSelections: (selections: Partial<MissionSelections>) => void;
  onStartDeployment: () => void;
  onSwitchPanel?: (panel: "briefing" | "action" | "intel") => void;
}

export function MissionContent({
  mission,
  phase,
  selections,
  deployment,
  activePanel,
  isMobile,
  onUpdateSelections,
  onStartDeployment,
  onSwitchPanel,
}: MissionContentProps) {
  // Mobile view - single panel
  if (isMobile) {
    return (
      <div className="px-4 pb-24">
        {activePanel === "briefing" && (
          <BriefingPanel mission={mission} phase={phase} />
        )}
        {activePanel === "action" && (
          <ActionPanel
            mission={mission}
            phase={phase}
            selections={selections}
            deployment={deployment}
            onUpdateSelections={onUpdateSelections}
            onStartDeployment={onStartDeployment}
            onSwitchToIntel={() => onSwitchPanel?.("intel")}
            isMobile={isMobile}
          />
        )}
        {activePanel === "intel" && (
          <IntelPanel
            mission={mission}
            phase={phase}
            deployment={deployment}
            selections={selections}
            onStartDeployment={onStartDeployment}
          />
        )}
      </div>
    );
  }

  // Tablet view - 2 columns
  if (window.innerWidth < 1024) {
    return (
      <div className="px-6 pb-24 grid grid-cols-2 pt-6 gap-6">
        <ActionPanel
          mission={mission}
          phase={phase}
          selections={selections}
          deployment={deployment}
          onUpdateSelections={onUpdateSelections}
          onStartDeployment={onStartDeployment}
        />
        <IntelPanel
          mission={mission}
          phase={phase}
          deployment={deployment}
          selections={selections}
          onStartDeployment={onStartDeployment}
        />
      </div>
    );
  }

  // Desktop view - 3 columns (ActionPanel left, BriefingPanel center, IntelPanel right)
  return (
    <div className="px-6 pb-24 grid grid-cols-12 pt-6 gap-6">
      <div className="col-span-3">
        <ActionPanel
          mission={mission}
          phase={phase}
          selections={selections}
          deployment={deployment}
          onUpdateSelections={onUpdateSelections}
          onStartDeployment={onStartDeployment}
        />
      </div>
      <div className="col-span-6">
        <BriefingPanel mission={mission} phase={phase} />
      </div>
      <div className="col-span-3">
        <IntelPanel
          mission={mission}
          phase={phase}
          deployment={deployment}
          selections={selections}
          onStartDeployment={onStartDeployment}
        />
      </div>
    </div>
  );
}
