export type MissionPhase = 
  | "available"
  | "planning"
  | "deploying"
  | "in-progress"
  | "completed"
  | "failed";

export interface MissionSelections {
  approach?: string;
  agents: string[];
  showAgentSelection?: boolean;
}

export interface MissionDeployment {
  deploymentId: string;
  stage: "deploying" | "processing" | "ready";
  progress: number;
  currentPhase: number;
  phases: Array<{
    phaseId: string;
    name: string;
    status: "pending" | "active" | "success" | "failure";
    narrative?: string;
    completedAt?: string;
  }>;
  completesAt?: string;
  lastUpdated?: Date;
  result?: {
    overallSuccess: boolean;
    timelineShift: number;
    finalNarrative: string;
    rewards: {
      timelinePoints: number;
      experience: number;
      loreFragments: string[];
    };
  };
}