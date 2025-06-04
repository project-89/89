export * from './account.service';
export * from './agent.service';
export * from './agentInvite.service';
export * from './cache.service';
export * from './capability.service';
export * from './cleanup.service';
export * from './fingerprint.service';
export * from './impression.service';
export * from './knowledge.service';
export * from './mission.service';
export * from './onboarding.service';
export * from './presence.service';
export * from './price.service';
export * from './profile.service';
export * from './realityStability.service';
export * from './role.service';
export * from './skillMatching.service';
export * from './stats.service';
export * from './tag.service';
export * from './visit.service';

// Game services exports (with aliases to avoid naming conflicts)
export {
  AIService as GameAIService,
  GameAgentService,
  ScheduledService as GameScheduledService,
  MissionService as TrainingMissionService,
} from './game';

export type {
  CreateGameAgentData,
  CreateGameProxim8Data,
  DeploymentProgress,
  GameAgentStats,
  GeneratedNarrative,
  MissionBriefing,
  MissionCompatibility,
  MissionResult,
  NarrativeContext,
  PhaseOutcome,
  ScheduledTaskResult,
} from './game';
