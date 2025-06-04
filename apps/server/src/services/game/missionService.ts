import {
  TRAINING_MISSIONS,
  TrainingMissionData,
} from '../../data/trainingMissions';
import {
  DeploymentStatus,
  GameProxim8,
  MissionApproach,
  TrainingMissionDeployment,
} from '../../generated/prisma';
import { prisma } from '../prisma.service';

export interface MissionCompatibility {
  overall: number;
  personalityBonus: number;
  experienceBonus: number;
  levelBonus: number;
}

export interface PhaseOutcome {
  phaseId: number;
  success: boolean;
  narrative: string | null;
  completedAt: Date | null;
}

export interface MissionResult {
  overallSuccess: boolean;
  finalNarrative: string;
  timelineShift: number;
  rewards: {
    timelinePoints: number;
    experience: number;
    loreFragments?: string[];
  };
}

export interface DeploymentProgress {
  progress: number;
  timeRemaining: number;
  currentPhase: number;
  isComplete: boolean;
}

export class MissionService {
  /**
   * Calculate compatibility between a Proxim8 and a mission
   */
  static calculateCompatibility(
    proxim8: GameProxim8,
    missionTemplate: TrainingMissionData
  ): MissionCompatibility {
    const personalityMatrix = {
      ANALYTICAL: { expose: 0.9, investigate: 0.95, analyze: 0.95 },
      AGGRESSIVE: { sabotage: 0.95, infiltrate: 0.8, disrupt: 0.9 },
      DIPLOMATIC: { organize: 0.95, infiltrate: 0.9, negotiate: 0.9 },
      ADAPTIVE: { sabotage: 0.8, expose: 0.8, organize: 0.8, investigate: 0.8 },
    };

    // Base compatibility based on preferred personalities
    const isPreferred = missionTemplate.compatibility.preferred.includes(
      proxim8.personality
    );
    const personalityBonus = isPreferred
      ? missionTemplate.compatibility.bonus
      : missionTemplate.compatibility.penalty;

    // Experience bonus (up to 15% for 1000+ experience)
    const experienceBonus = Math.min(0.15, (proxim8.experience / 1000) * 0.1);

    // Level bonus (2% per level above 1, max 10%)
    const levelBonus = Math.min(0.1, (proxim8.level - 1) * 0.02);

    // Base success rate starts at 0.7
    const baseRate = 0.7;
    const overall = Math.min(
      0.95,
      Math.max(0.1, baseRate + personalityBonus + experienceBonus + levelBonus)
    );

    return {
      overall,
      personalityBonus,
      experienceBonus,
      levelBonus,
    };
  }

  /**
   * Generate phase outcomes for a mission deployment
   */
  static generatePhaseOutcomes(
    missionTemplate: TrainingMissionData,
    baseSuccessRate: number,
    approach: MissionApproach
  ): PhaseOutcome[] {
    const phases: PhaseOutcome[] = [];
    let cumulativeSuccess = true;

    // Get approach-specific success rate modifiers
    const selectedApproach = missionTemplate.approaches.find(
      (a) => a.type === approach
    );
    if (!selectedApproach) {
      throw new Error(`Invalid approach: ${approach}`);
    }

    // Calculate actual success rate based on approach
    const approachSuccessRate =
      selectedApproach.successRate.min +
      Math.random() *
        (selectedApproach.successRate.max - selectedApproach.successRate.min);

    const finalSuccessRate = (baseSuccessRate + approachSuccessRate) / 2;

    for (let i = 1; i <= 5; i++) {
      const phaseModifier = cumulativeSuccess ? 0 : -0.1; // Failure in previous phase reduces chances
      const randomVariation = (Math.random() - 0.5) * 0.15; // ±7.5% random variation
      const phaseSuccessRate = Math.max(
        0.1,
        Math.min(0.9, finalSuccessRate + phaseModifier + randomVariation)
      );
      const success = Math.random() < phaseSuccessRate;

      if (!success) {
        cumulativeSuccess = false;
      }

      phases.push({
        phaseId: i,
        success,
        narrative: null, // Will be populated by AI or templates
        completedAt: null, // Will be set as mission progresses
      });
    }

    return phases;
  }

  /**
   * Calculate mission progress based on time elapsed
   */
  static getMissionProgress(
    deployment: TrainingMissionDeployment
  ): DeploymentProgress {
    const now = Date.now();
    const elapsed = now - deployment.deployedAt.getTime();
    const progress = Math.min(1, elapsed / deployment.duration);

    return {
      progress: Math.round(progress * 100),
      timeRemaining: Math.max(0, deployment.completesAt.getTime() - now),
      currentPhase: Math.min(5, Math.floor(progress * 5) + 1),
      isComplete: progress >= 1,
    };
  }

  /**
   * Check if a phase should be revealed to the client
   */
  static shouldRevealPhase(
    deployment: TrainingMissionDeployment,
    phaseId: number
  ): boolean {
    if (deployment.status !== DeploymentStatus.ACTIVE) {
      return true; // Show all phases for completed/abandoned missions
    }

    const now = Date.now();
    const elapsed = now - deployment.deployedAt.getTime();
    const progress = elapsed / deployment.duration;

    // Phase timing: 20%, 45%, 70%, 90%, 100%
    const phaseTimings = [0.2, 0.45, 0.7, 0.9, 1.0];

    return progress >= phaseTimings[phaseId - 1];
  }

  /**
   * Deploy a training mission
   */
  static async deployTrainingMission(params: {
    gameAgentId: string;
    missionId: string;
    gameProxim8Id: string;
    approach: MissionApproach;
  }): Promise<TrainingMissionDeployment> {
    const { gameAgentId, missionId, gameProxim8Id, approach } = params;

    // Get mission template
    const missionTemplate = TRAINING_MISSIONS.find(
      (m) => m.missionId === missionId
    );
    if (!missionTemplate) {
      throw new Error(`Mission template not found: ${missionId}`);
    }

    // Get game agent and proxim8
    const gameAgent = await prisma.gameAgent.findUnique({
      where: { id: gameAgentId },
      include: { proxim8s: true },
    });

    if (!gameAgent) {
      throw new Error('Game agent not found');
    }

    const gameProxim8 = gameAgent.proxim8s.find((p) => p.id === gameProxim8Id);
    if (!gameProxim8) {
      throw new Error('Proxim8 not found or not owned by agent');
    }

    if (gameProxim8.isDeployed) {
      throw new Error('Proxim8 is already deployed on a mission');
    }

    // Check if agent can access this mission
    const canAccess = await MissionService.canUserAccessMission(
      gameAgentId,
      missionId
    );
    if (!canAccess) {
      throw new Error(
        'Mission not unlocked. Complete previous missions first.'
      );
    }

    // Calculate compatibility and success rate
    const compatibility = MissionService.calculateCompatibility(
      gameProxim8,
      missionTemplate
    );

    // Generate phase outcomes
    const phaseOutcomes = MissionService.generatePhaseOutcomes(
      missionTemplate,
      compatibility.overall,
      approach
    );

    // Calculate mission completion time
    const deployedAt = new Date();
    const completesAt = new Date(
      deployedAt.getTime() + missionTemplate.duration
    );

    // Generate unique deployment ID
    const deploymentId = `training_deploy_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Create deployment
    const deployment = await prisma.trainingMissionDeployment.create({
      data: {
        deploymentId,
        missionId,
        gameAgentId,
        gameProxim8Id,
        approach,
        deployedAt,
        completesAt,
        duration: missionTemplate.duration,
        finalSuccessRate: compatibility.overall,
        phaseOutcomes: phaseOutcomes as any, // Prisma Json type
        status: DeploymentStatus.ACTIVE,
        currentPhase: 0,
      },
    });

    // Mark Proxim8 as deployed
    await prisma.gameProxim8.update({
      where: { id: gameProxim8Id },
      data: {
        isDeployed: true,
        lastMissionAt: deployedAt,
      },
    });

    return deployment;
  }

  /**
   * Check if a user can access a specific mission
   */
  static async canUserAccessMission(
    gameAgentId: string,
    missionId: string
  ): Promise<boolean> {
    const missionTemplate = TRAINING_MISSIONS.find(
      (m) => m.missionId === missionId
    );
    if (!missionTemplate) return false;

    // First mission is always accessible
    if (missionTemplate.sequence === 1) return true;

    // Check if previous mission is completed
    const previousSequence = missionTemplate.sequence - 1;
    const previousMissionId = `training_${String(previousSequence).padStart(3, '0')}`;

    const previousDeployment = await prisma.trainingMissionDeployment.findFirst(
      {
        where: {
          gameAgentId,
          missionId: previousMissionId,
          status: DeploymentStatus.COMPLETED,
        },
      }
    );

    return !!previousDeployment;
  }

  /**
   * Get client-safe state for a deployment
   */
  static getClientState(deployment: TrainingMissionDeployment) {
    const phaseOutcomes = deployment.phaseOutcomes as unknown as PhaseOutcome[];

    const phases = phaseOutcomes.map((phase) => {
      const shouldReveal = MissionService.shouldRevealPhase(
        deployment,
        phase.phaseId
      );

      if (shouldReveal) {
        return {
          phaseId: phase.phaseId,
          success: phase.success,
          narrative: phase.narrative || 'Phase in progress...',
          completedAt: phase.completedAt,
          status: phase.completedAt
            ? phase.success
              ? 'success'
              : 'failure'
            : 'active',
        };
      } else {
        return {
          phaseId: phase.phaseId,
          status: 'pending',
        };
      }
    });

    return {
      deploymentId: deployment.deploymentId,
      missionId: deployment.missionId,
      status: deployment.status,
      currentPhase: deployment.currentPhase,
      deployedAt: deployment.deployedAt,
      completesAt: deployment.completesAt,
      phases,
      result:
        deployment.status === DeploymentStatus.COMPLETED
          ? deployment.result
          : undefined,
    };
  }

  /**
   * Complete a mission and calculate rewards
   */
  static async completeMission(
    deploymentId: string
  ): Promise<TrainingMissionDeployment> {
    const deployment = await prisma.trainingMissionDeployment.findUnique({
      where: { deploymentId },
      include: { gameAgent: true, gameProxim8: true },
    });

    if (!deployment) {
      throw new Error('Deployment not found');
    }

    if (deployment.status !== DeploymentStatus.ACTIVE) {
      throw new Error('Mission is not active');
    }

    const phaseOutcomes = deployment.phaseOutcomes as unknown as PhaseOutcome[];
    const successCount = phaseOutcomes.filter((p) => p.success).length;
    const overallSuccess = successCount >= 3; // Need majority success

    // Get mission template for rewards calculation
    const missionTemplate = TRAINING_MISSIONS.find(
      (m) => m.missionId === deployment.missionId
    );
    if (!missionTemplate) {
      throw new Error('Mission template not found');
    }

    // Get approach for timeline shift calculation
    const selectedApproach = missionTemplate.approaches.find(
      (a) => a.type === deployment.approach
    );
    if (!selectedApproach) {
      throw new Error('Approach not found');
    }

    // Calculate rewards
    const baseTimelineShift =
      selectedApproach.timelineShift.min +
      Math.random() *
        (selectedApproach.timelineShift.max -
          selectedApproach.timelineShift.min);

    const successMultiplier = overallSuccess ? 1.0 : 0.5;
    const timelineShift = Math.round(baseTimelineShift * successMultiplier);

    const baseExperience = 50 * missionTemplate.sequence;
    const experience = Math.round(baseExperience * successMultiplier);

    const result: MissionResult = {
      overallSuccess,
      finalNarrative: `Mission ${overallSuccess ? 'completed successfully' : 'partially successful'}. Timeline shifted by ${timelineShift} points.`,
      timelineShift,
      rewards: {
        timelinePoints: timelineShift,
        experience,
        loreFragments: overallSuccess
          ? [`lore_fragment_${deployment.missionId}`]
          : [],
      },
    };

    // Update deployment
    const updatedDeployment = await prisma.trainingMissionDeployment.update({
      where: { id: deployment.id },
      data: {
        status: DeploymentStatus.COMPLETED,
        result: result as any,
        currentPhase: 5,
      },
    });

    // Update game agent timeline points
    await prisma.gameAgent.update({
      where: { id: deployment.gameAgentId },
      data: {
        timelinePoints: {
          increment: timelineShift,
        },
      },
    });

    // Update Proxim8 experience and mark as not deployed
    await prisma.gameProxim8.update({
      where: { id: deployment.gameProxim8Id },
      data: {
        experience: {
          increment: experience,
        },
        isDeployed: false,
      },
    });

    return updatedDeployment;
  }
}
