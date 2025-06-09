import { TRAINING_MISSIONS } from '../../data/trainingMissions';
import MissionDeployment from '../../models/game/MissionDeployment';
import MissionTemplate from '../../models/game/MissionTemplate';
import Agent from '../../models/game/Agent';
import { LoreFragment } from '../../models/LoreFragment';
import { ContentGenerationService } from './contentGenerationService';

export interface MissionCompatibility {
  overall: number;
  personalityBonus: number;
  experienceBonus: number;
  levelBonus: number;
}

export interface MissionDeploymentParams {
  agentId: string;
  missionId: string;
  missionType: 'training' | 'timeline' | 'critical' | 'event';
  proxim8Id: string;
  approach: 'aggressive' | 'balanced' | 'cautious' | 'low' | 'medium' | 'high';
  timelineNode?: {
    year: number;
    month?: number;
    day?: number;
    isCriticalJuncture?: boolean;
  };
}

export class MissionService {
  
  /**
   * Get mission template by ID and type
   */
  static async getMissionTemplate(missionId: string, missionType: string): Promise<any> {
    // For training missions, use legacy data structure
    if (missionType === 'training') {
      return TRAINING_MISSIONS.find((m: any) => m.id === missionId);
    }
    
    // For other mission types, use database templates
    const template = await MissionTemplate.findOne({
      templateId: missionId,
      missionType,
      isActive: true
    });
    
    return template;
  }
  
  /**
   * Generate a timeline mission for a specific date
   */
  static async generateTimelineMission(
    year: number,
    month?: number,
    day?: number,
    category?: string,
    difficulty?: number
  ): Promise<any> {
    // Find suitable templates for this timeline position
    const templates = await (MissionTemplate as any).findForTimeline(year, category, difficulty);
    
    if (templates.length === 0) {
      throw new Error('No suitable mission templates found for this timeline position');
    }
    
    // Select template based on weights/preferences
    const selectedTemplate = templates[Math.floor(Math.random() * templates.length)];
    
    // Generate contextual mission
    const generatedMission = selectedTemplate.generateMission({
      year,
      location: `Timeline Node ${year}${month ? `/${month}` : ''}${day ? `/${day}` : ''}`
    });
    
    return generatedMission;
  }
  
  /**
   * Calculate compatibility score between a Proxim8 and mission
   */
  static calculateCompatibility(proxim8: any, missionTemplate: any): MissionCompatibility {
    // Base personality compatibility
    const personalityMatrix = {
      analytical: {
        sabotage: 0.6,
        expose: 0.9,
        organize: 0.7,
        investigate: 0.95,
        infiltrate: 0.8
      },
      aggressive: {
        sabotage: 0.95,
        expose: 0.7,
        organize: 0.6,
        investigate: 0.6,
        infiltrate: 0.8
      },
      diplomatic: {
        sabotage: 0.5,
        expose: 0.8,
        organize: 0.95,
        investigate: 0.7,
        infiltrate: 0.9
      },
      adaptive: {
        sabotage: 0.8,
        expose: 0.8,
        organize: 0.8,
        investigate: 0.8,
        infiltrate: 0.85
      }
    };
    
    const personalityBonus = (personalityMatrix as any)[proxim8.personality]?.[missionTemplate.primaryApproach] || 0.7;
    
    // Experience bonus (diminishing returns)
    const experienceBonus = Math.min(0.15, (proxim8.experience / 1000) * 0.1);
    
    // Level bonus
    const levelBonus = Math.min(0.1, (proxim8.level - 1) * 0.02);
    
    const overall = Math.min(0.95, personalityBonus + experienceBonus + levelBonus);
    
    return {
      overall,
      personalityBonus,
      experienceBonus,
      levelBonus
    };
  }
  
  /**
   * Generate realistic phase outcomes for a mission
   */
  static generatePhaseOutcomes(missionTemplate: any, baseSuccessRate: number): any[] {
    const phases = [];
    let cumulativeSuccess = true;
    
    for (let i = 1; i <= 5; i++) {
      // Each phase affects the next - cascading failures
      const phaseModifier = cumulativeSuccess ? 0 : -0.1;
      const randomVariation = (Math.random() - 0.5) * 0.15; // ±7.5% variation
      
      const phaseSuccessRate = Math.max(0.1, Math.min(0.9, baseSuccessRate + phaseModifier + randomVariation));
      const success = Math.random() < phaseSuccessRate;
      
      if (!success) {
        cumulativeSuccess = false;
      }
      
      phases.push({
        phaseId: i,
        success,
        narrative: null, // Generated during mission progression
        completedAt: null
      });
    }
    
    return phases;
  }
  
  /**
   * Deploy a mission for an agent
   */
  static async deployMission(params: MissionDeploymentParams) {
    const { agentId, missionId, missionType, proxim8Id, approach, timelineNode } = params;
    
    // Validate mission template exists
    const missionTemplate = await this.getMissionTemplate(missionId, missionType);
    if (!missionTemplate) {
      throw new Error('Mission template not found');
    }
    
    // Check deployment eligibility using static method
    const canDeploy = await (MissionDeployment as any).canDeployMission(agentId, missionId, missionType);
    if (!canDeploy.canDeploy) {
      throw new Error(canDeploy.reason || 'Cannot deploy mission');
    }
    
    // Get agent and validate Proxim8
    const agent = await Agent.findOne({ userId: agentId });
    if (!agent) {
      throw new Error('Agent not found');
    }
    
    const proxim8 = agent.proxim8s.find(p => p.nftId === proxim8Id);
    if (!proxim8) {
      throw new Error('Proxim8 not found');
    }
    
    if (proxim8.isDeployed) {
      throw new Error('Proxim8 is already deployed');
    }
    
    // Calculate mission parameters - handle both legacy and new approach formats
    let missionApproach;
    if (missionTemplate.approaches) {
      // New format: aggressive/balanced/cautious or legacy low/medium/high
      missionApproach = missionTemplate.approaches[approach];
    }
    
    if (!missionApproach) {
      throw new Error('Invalid approach for mission');
    }
    
    const duration = missionApproach.duration;
    const completesAt = new Date(Date.now() + duration);
    
    // Calculate success rate with compatibility
    const compatibility = this.calculateCompatibility(proxim8, missionTemplate);
    const baseSuccessRate = missionApproach.baseSuccessRate;
    const finalSuccessRate = Math.min(0.95, baseSuccessRate * compatibility.overall);
    
    // Get Proxim8's mission history for coordinator learning effects
    const proxim8History = await this.getProxim8MissionHistory(agentId, proxim8Id);
    
    // Generate complete mission content at deployment time (MVP approach)
    const deployedAt = new Date();
    const generatedContent = ContentGenerationService.generateCompleteMission(
      missionTemplate,
      approach,
      proxim8,
      finalSuccessRate,
      duration,
      deployedAt,
      timelineNode,
      proxim8History
    );
    
    // Convert generated phases to the format expected by the model
    const phaseOutcomes = generatedContent.phases.map(phase => ({
      phaseId: phase.phaseId,
      success: phase.success,
      narrative: phase.narrative,
      completedAt: phase.completedAt
    }));
    
    // Create deployment with all content pre-generated
    const deployment = new MissionDeployment({
      missionId,
      missionType,
      agentId,
      proxim8Id,
      approach,
      deployedAt,
      completesAt,
      duration,
      finalSuccessRate,
      phaseOutcomes,
      timelineNode,
      status: 'completed', // Mission is actually complete, just revealing over time
      result: {
        overallSuccess: generatedContent.overallSuccess,
        finalNarrative: generatedContent.finalNarrative,
        timelineShift: generatedContent.timelineShift,
        influenceType: generatedContent.influenceType,
        rewards: generatedContent.rewards
      },
      // Store coordinator influence data
      coordinatorInfluence: generatedContent.coordinatorInfluence,
      // Set timeline influence if this is a timeline mission
      timelineInfluence: missionType === 'timeline' && timelineNode ? {
        nodeId: `${timelineNode.year}${timelineNode.month ? `_${timelineNode.month}` : ''}${timelineNode.day ? `_${timelineNode.day}` : ''}`,
        influencePoints: Math.floor(generatedContent.timelineShift * 100),
        influenceType: generatedContent.influenceType,
        cascadeEffects: [] // Calculate cascade effects based on mission template
      } : undefined
    });
    
    await deployment.save();
    
    // Mark Proxim8 as deployed (will be freed when mission timer expires)
    proxim8.isDeployed = true;
    proxim8.currentMissionId = deployment.deploymentId;
    agent.lastMissionDeployedAt = new Date();
    agent.dailyMissionCount += 1;
    
    // Since mission is pre-generated, update agent progression immediately
    await this.updateAgentProgressFromDeployment(deployment, agent);
    
    await agent.save();
    
    return deployment;
  }
  
  /**
   * Update agent progress from a pre-generated deployment
   */
  private static async updateAgentProgressFromDeployment(deployment: any, agent: any) {
    const rewards = deployment.result.rewards;
    
    // Update agent statistics
    agent.timelinePoints += rewards.timelinePoints;
    agent.totalMissionsDeployed += 1;
    
    if (deployment.result.overallSuccess) {
      agent.totalMissionsSucceeded += 1;
    } else {
      agent.totalMissionsFailed += 1;
    }
    
    agent.totalTimelineShift += deployment.result.timelineShift;
    
    // Update Proxim8
    const proxim8 = agent.proxim8s.find((p: any) => p.nftId === deployment.proxim8Id);
    if (proxim8) {
      proxim8.missionCount += 1;
      proxim8.experience += rewards.experience;
      
      // Recalculate level
      proxim8.level = Math.floor(Math.sqrt(proxim8.experience / 100)) + 1;
      
      // Update success rate
      proxim8.successRate = proxim8.missionCount > 0 ? 
        (agent.totalMissionsSucceeded / agent.totalMissionsDeployed) * 100 : 0;
    }
    
    // Update rank
    (agent as any).calculateRank();
  }
  
  /**
   * Handle mission timer expiration (free up Proxim8)
   */
  static async handleMissionExpiration(deploymentId: string) {
    const deployment = await MissionDeployment.findOne({ deploymentId });
    if (!deployment) {
      throw new Error('Deployment not found');
    }
    
    // Free up the Proxim8 since the mission timer has expired
    const agent = await Agent.findOne({ userId: deployment.agentId });
    if (agent) {
      const proxim8 = agent.proxim8s.find((p: any) => p.nftId === deployment.proxim8Id);
      if (proxim8) {
        proxim8.isDeployed = false;
        proxim8.currentMissionId = undefined;
      }
      await agent.save();
    }
    
    return deployment;
  }
  
  /**
   * Generate final mission narrative based on outcomes
   */
  private static generateFinalNarrative(missionTemplate: any, approach: any, phaseOutcomes: any[], overallSuccess: boolean): string {
    const successfulPhases = phaseOutcomes.filter(p => p.success).length;
    
    if (overallSuccess) {
      if (successfulPhases === 5) {
        return approach?.narrativeTemplates.perfectSuccess || 
               `Flawless execution. All phases completed successfully. ${missionTemplate.missionName} objectives exceeded expectations.`;
      } else {
        return approach?.narrativeTemplates.success || 
               `Mission successful despite minor setbacks. ${successfulPhases}/5 phases completed successfully.`;
      }
    } else {
      if (successfulPhases === 0) {
        return approach?.narrativeTemplates.totalFailure || 
               `Complete mission failure. All phases compromised. Emergency extraction protocols initiated.`;
      } else {
        return approach?.narrativeTemplates.failure || 
               `Mission failed to achieve primary objectives. Only ${successfulPhases}/5 phases successful.`;
      }
    }
  }
  
  /**
   * Calculate mission rewards based on performance
   */
  private static calculateRewards(approach: any, overallSuccess: boolean, successfulPhases: number) {
    const basePoints = approach?.rewards?.timelinePoints || 100;
    const baseExperience = approach?.rewards?.experience || 50;
    
    // Success multiplier
    const successMultiplier = overallSuccess ? 1.0 : 0.3;
    
    // Phase bonus (extra rewards for more successful phases)
    const phaseBonusMultiplier = 1 + (successfulPhases - 3) * 0.1;
    
    const timelinePoints = Math.floor(basePoints * successMultiplier * phaseBonusMultiplier);
    const experience = Math.floor(baseExperience * successMultiplier * phaseBonusMultiplier);
    
    return {
      timelinePoints,
      experience,
      loreFragments: overallSuccess && successfulPhases >= 4 ? ['lore_fragment_placeholder'] : [],
      achievements: this.checkAchievements(overallSuccess, successfulPhases)
    };
  }
  
  /**
   * Check for achievement unlocks
   */
  private static checkAchievements(overallSuccess: boolean, successfulPhases: number): string[] {
    const achievements = [];
    
    if (overallSuccess && successfulPhases === 5) {
      achievements.push('perfect_mission');
    }
    
    if (overallSuccess) {
      achievements.push('mission_success');
    }
    
    return achievements;
  }
  
  /**
   * Update agent progress after mission completion
   */
  private static async updateAgentProgress(deployment: any, rewards: any) {
    const agent = await Agent.findOne({ userId: deployment.agentId });
    if (!agent) return;
    
    // Update agent statistics
    agent.timelinePoints += rewards.timelinePoints;
    agent.totalMissionsDeployed += 1;
    
    if (deployment.result.overallSuccess) {
      agent.totalMissionsSucceeded += 1;
    } else {
      agent.totalMissionsFailed += 1;
    }
    
    agent.totalTimelineShift += deployment.result.timelineShift;
    
    // Update Proxim8
    const proxim8 = agent.proxim8s.find(p => p.nftId === deployment.proxim8Id);
    if (proxim8) {
      proxim8.isDeployed = false;
      proxim8.currentMissionId = undefined;
      proxim8.missionCount += 1;
      proxim8.experience += rewards.experience;
      
      // Recalculate level
      proxim8.level = Math.floor(Math.sqrt(proxim8.experience / 100)) + 1;
      
      // Update success rate
      proxim8.successRate = proxim8.missionCount > 0 ? 
        (agent.totalMissionsSucceeded / agent.totalMissionsDeployed) * 100 : 0;
    }
    
    // Update rank
    (agent as any).calculateRank();
    
    await agent.save();
  }
  
  /**
   * Get mission progress with progressive phase reveals (MVP approach)
   */
  static getMissionProgress(deployment: any) {
    const now = Date.now();
    const elapsed = now - deployment.deployedAt.getTime();
    const totalDuration = deployment.duration;
    const progress = Math.min(1, elapsed / totalDuration);
    
    // Phase reveal timings (20%, 45%, 70%, 90%, 100%)
    const phaseTimings = [0.2, 0.45, 0.7, 0.9, 1.0];
    
    // Determine which phases should be revealed based on elapsed time
    const revealedPhases = deployment.phaseOutcomes.map((phase: any, index: number) => {
      const shouldReveal = progress >= phaseTimings[index];
      
      if (shouldReveal) {
        return {
          phaseId: phase.phaseId,
          name: this.getPhaseNames()[index],
          narrative: phase.narrative,
          success: phase.success,
          status: phase.success ? 'success' : 'failure',
          completedAt: phase.completedAt
        };
      } else {
        return {
          phaseId: phase.phaseId,
          name: this.getPhaseNames()[index],
          status: 'pending'
        };
      }
    });
    
    // Determine current active phase
    const currentPhaseIndex = phaseTimings.findIndex(timing => progress < timing);
    const currentPhase = currentPhaseIndex === -1 ? 5 : currentPhaseIndex + 1;
    
    // Check if mission timer has expired (Proxim8 should be freed)
    const isTimerExpired = progress >= 1.0;
    
    return {
      progress: Math.floor(progress * 100),
      currentPhase,
      phases: revealedPhases,
      isComplete: progress >= 1.0,
      isTimerExpired,
      // Include final results if mission timer has expired
      finalResults: isTimerExpired ? {
        overallSuccess: deployment.result.overallSuccess,
        finalNarrative: deployment.result.finalNarrative,
        timelineShift: deployment.result.timelineShift,
        influenceType: deployment.result.influenceType,
        rewards: deployment.result.rewards
      } : undefined
    };
  }
  
  /**
   * Get standard phase names
   */
  private static getPhaseNames(): string[] {
    return [
      'Infiltration',
      'Intelligence Gathering',
      'Primary Objective',
      'Tactical Execution',
      'Extraction'
    ];
  }
  
  /**
   * Generate narrative for individual phases
   */
  private static generatePhaseNarrative(phase: any, phaseNumber: number): string {
    const phaseNames = [
      'Infiltration',
      'Data Gathering', 
      'Tactical Assessment',
      'Primary Objective',
      'Extraction'
    ];
    
    const phaseName = phaseNames[phaseNumber - 1] || `Phase ${phaseNumber}`;
    
    if (phase.success) {
      return `${phaseName} completed successfully. All objectives met without detection.`;
    } else {
      return `${phaseName} compromised. Operational security breached, adapting mission parameters.`;
    }
  }
  
  /**
   * Get Proxim8's mission history for learning effects
   */
  private static async getProxim8MissionHistory(agentId: string, proxim8Id: string): Promise<any[]> {
    try {
      const deployments = await MissionDeployment.find({
        agentId,
        proxim8Id,
        status: 'completed'
      }).select('coordinatorInfluence result missionType timelineNode').lean();
      
      return deployments || [];
    } catch (error) {
      console.error('Error fetching Proxim8 mission history:', error);
      return [];
    }
  }

  /**
   * Complete a mission deployment
   */
  static async completeMission(deploymentId: string): Promise<any> {
    const deployment = await MissionDeployment.findOne({ deploymentId });
    
    if (!deployment) {
      throw new Error('Mission deployment not found');
    }
    
    if (deployment.status !== 'active') {
      throw new Error('Mission is not active');
    }
    
    // Update deployment status
    deployment.status = 'completed';
    deployment.completedAt = new Date();
    
    // If result doesn't exist, generate it based on phase outcomes
    if (!deployment.result) {
      const successfulPhases = deployment.phaseOutcomes.filter((p: any) => p.success).length;
      const overallSuccess = successfulPhases >= 3; // Need 3+ successful phases
      
      deployment.result = {
        overallSuccess,
        finalNarrative: overallSuccess 
          ? "Mission completed successfully. Timeline influence established."
          : "Mission partially successful. Some objectives achieved.",
        timelineShift: overallSuccess ? deployment.finalSuccessRate * 10 : deployment.finalSuccessRate * 5,
        influenceType: 'green_loom',
        rewards: {
          timelinePoints: overallSuccess ? 100 : 50,
          experience: overallSuccess ? 50 : 25,
          loreFragments: overallSuccess ? ['lore_001'] : [],
          memoryCaches: [],
          achievements: overallSuccess ? ['first_success'] : [],
          nftArtifacts: [],
          governanceTokens: 0
        }
      };
    }
    
    await deployment.save();
    
    // Update agent experience if needed
    try {
      const agent = await Agent.findOne({ userId: deployment.agentId });
      if (agent && deployment.result.overallSuccess) {
        agent.totalMissionsSucceeded += 1;
        agent.timelinePoints += deployment.result.rewards.timelinePoints;
        await (agent as any).updateProxim8Experience(deployment.proxim8Id, deployment.result.rewards.experience);
        await agent.save();
      }
    } catch (error) {
      console.warn('Failed to update agent experience:', error);
    }
    
    return deployment;
  }
}