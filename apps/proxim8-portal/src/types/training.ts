// Training mission type definitions

export interface TrainingMission {
  // Core identification
  missionId: string;
  sequence: number; // 1-7
  title: string;
  date: string;
  location: string;
  description: string;
  imageUrl: string;
  duration: number; // in milliseconds
  
  // Mission briefing
  briefing: {
    text: string;
    currentBalance: number; // 0-100 Oneirocom control
    threatLevel: "low" | "medium" | "high" | "critical";
  };
  
  // Approach options
  approaches: {
    type: "low" | "medium" | "high";
    name: string;
    description: string;
    successRate: { min: number; max: number };
    timelineShift: { min: number; max: number };
  }[];
  
  // Proxim8 compatibility
  compatibility: {
    preferred: ("analytical" | "aggressive" | "diplomatic" | "adaptive")[];
    bonus: number; // e.g., 0.1 for +10%
    penalty: number; // e.g., -0.1 for -10%
  };
  
  // Mission status
  status: "locked" | "available" | "active" | "completed";
  progress?: number; // 0-100 for active missions
  
  // If deployed
  deployment?: {
    deployedAt: Date;
    completesAt: Date;
    proxim8Id: string;
    approach: "low" | "medium" | "high";
    currentPhase: number;
  };
}

export interface MissionPhase {
  id: number; // 1-5
  name: string;
  status: "pending" | "active" | "success" | "failure";
  narrative?: string;
  timestamp?: Date;
}

export interface MissionDeployment {
  missionId: string;
  agentId: string;
  proxim8Id: string;
  approach: "low" | "medium" | "high";
  deployedAt: Date;
  completesAt: Date;
  status: "active" | "completed";
  
  // Phase tracking
  phases: MissionPhase[];
  currentPhase: number;
  
  // Results (when completed)
  result?: {
    success: boolean;
    narrative: string;
    imageUrl?: string;
    timelineShift: number;
    rewards: {
      timelinePoints: number;
      experience: number;
      loreFragments?: string[];
      achievements?: string[];
    };
  };
}

// Helper type for converting to TimelineEvent (for compatibility with existing components)
export interface TimelineEventAdapter {
  id: string;
  date: string;
  title: string;
  description: string;
  importance: "low" | "medium" | "high" | "critical";
  oneirocumControl: number;
  status: "active" | "in-progress" | "completed-success" | "completed-failure";
  approaches: string[];
  agentsActive: number;
  briefing?: string;
}