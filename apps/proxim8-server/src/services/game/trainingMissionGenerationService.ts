// Training Mission Generation Service - Progressive phase-by-phase generation with AI

import { LoreService } from './loreService';
import { StructuredNarrativeService } from './structuredNarrativeService';
import { LoreGenerationService } from './loreGenerationService';

export interface TrainingMissionGenerationParams {
  template: any;
  approach: any;
  proxim8: any;
  agent: any;
  finalSuccessRate: number;
  duration: number;
  deployedAt: Date;
}

export interface PhaseOutcome {
  phaseId: number;
  name: string;
  success: boolean;
  diceRoll: number; // 0-100
  successThreshold: number; // Based on compatibility, approach, etc.
  narrative: string;
  firstPersonReport: string;
  structuredData?: any; // Structured JSON response from AI
  imagePrompt?: string;
  revealTime: Date; // When this phase should be revealed to client
  completedAt: Date | null;
  tensionLevel: 'low' | 'medium' | 'high' | 'critical';
}

export interface GeneratedMissionContent {
  phaseOutcomes: PhaseOutcome[];
  missionContext: {
    loreFragments: string[];
    proxim8Background: string;
    missionHistory: string[];
    timelinePeriod: string;
  };
  result: {
    overallSuccess: boolean;
    finalNarrative: string;
    firstPersonMissionReport: string;
    timelineShift: number;
    missionSummary?: any; // Structured mission summary from AI
    animeImagePrompt?: string;
    generatedLoreEntries?: any[]; // Multiple lore entries to be saved to DB
    rewards: {
      timelinePoints: number;
      experience: number;
      loreFragments: string[];
      achievements: string[];
    };
  };
}

export class TrainingMissionGenerationService {
  
  /**
   * Generate a unique mission instance with progressive phase-by-phase dice roll system
   * Each phase is a tension-filled narrative beat with success/failure determination
   */
  static async generateMissionInstance(params: TrainingMissionGenerationParams): Promise<GeneratedMissionContent> {
    const { template, approach, proxim8, agent, finalSuccessRate, duration, deployedAt } = params;
    
    console.log('🎲 Starting progressive mission generation for:', template.title);
    
    // Step 1: Gather mission context from lore, Proxim8 data, and history
    const missionContext = await this.buildMissionContext(template, proxim8, agent);
    
    // Step 2: Generate each phase sequentially with structured output and reveal times
    const phaseOutcomes = await this.generateProgressivePhases(
      template, 
      approach, 
      proxim8, 
      agent, 
      missionContext,
      finalSuccessRate,
      duration,
      deployedAt
    );
    
    // Step 3: Determine overall success (3 of 5 phases must succeed)
    const successfulPhases = phaseOutcomes.filter(phase => phase.success).length;
    const overallSuccess = successfulPhases >= Math.ceil(template.phases.length * 0.6); // 60% threshold
    
    // Step 4: Generate comprehensive structured mission summary and extensible lore
    const result = await this.generateFinalMissionReport(
      template, 
      approach, 
      phaseOutcomes, 
      overallSuccess,
      missionContext,
      proxim8,
      new Date(deployedAt.getTime() + duration) // completesAt
    );
    
    console.log('✅ Mission generation complete:', {
      phases: phaseOutcomes.length,
      successful: successfulPhases,
      overallSuccess
    });
    
    return {
      phaseOutcomes,
      missionContext,
      result
    };
  }
  
  /**
   * Build mission context from lore documents, Proxim8 data, and agent history
   */
  private static async buildMissionContext(template: any, proxim8: any, agent: any): Promise<any> {
    // Get relevant lore fragments for this mission's time period
    const loreFragments = await LoreService.getRelevantLore(template.year, template.location);
    
    // Build Proxim8 background from NFT metadata and traits
    const proxim8Background = this.buildProxim8Background(proxim8);
    
    // Get mission history for narrative continuity
    const missionHistory = await this.getMissionHistory(agent);
    
    // Timeline period context
    const timelinePeriod = this.getTimelinePeriodContext(template.year);
    
    return {
      loreFragments,
      proxim8Background,
      missionHistory,
      timelinePeriod
    };
  }

  /**
   * Generate each phase progressively with dice rolls, structured output, and time-based revelation
   */
  private static async generateProgressivePhases(
    template: any, 
    approach: any, 
    proxim8: any, 
    agent: any, 
    missionContext: any,
    baseSuccessRate: number,
    duration: number,
    deployedAt: Date
  ): Promise<PhaseOutcome[]> {
    const phases = template.phases || [];
    const outcomes: PhaseOutcome[] = [];
    
    // Calculate reveal times for each phase (spread evenly across mission duration)
    const phaseRevealTimes = this.calculatePhaseRevealTimes(phases.length, duration, deployedAt);
    
    let cumulativeStory = '';
    let tensionLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';
    
    console.log(`🎭 Generating ${phases.length} phases sequentially with structured output...`);
    
    for (let i = 0; i < phases.length; i++) {
      const phase = phases[i];
      
      console.log(`🎲 Phase ${i + 1}/${phases.length}: ${phase.name} (reveals at ${phaseRevealTimes[i].toLocaleTimeString()})`);
      
      // Calculate success threshold based on multiple factors  
      const successThreshold = this.calculatePhaseSuccessThreshold(
        baseSuccessRate,
        approach,
        proxim8,
        phase,
        outcomes, // Previous phase results affect current
        i
      );
      
      // Roll the dice!
      const diceRoll = Math.floor(Math.random() * 100) + 1;
      // Success if we roll under or equal to the threshold (e.g., 44% success = need to roll 1-44)
      const successThresholdPercent = Math.round(successThreshold * 100);
      const success = diceRoll <= successThresholdPercent;
      
      // Escalate tension as mission progresses
      tensionLevel = this.calculateTensionLevel(i, phases.length, outcomes, success);
      
      console.log(`  🎯 Roll: ${diceRoll} vs Success Rate: ${successThresholdPercent}% = ${success ? 'SUCCESS' : 'FAILURE'} (${tensionLevel})`);
      
      // Generate structured AI narrative for this phase
      const structuredData = await StructuredNarrativeService.generatePhaseNarrative({
        phase,
        success,
        diceRoll,
        approach,
        proxim8,
        missionContext,
        previousPhases: outcomes,
        tensionLevel,
        cumulativeStory,
        phaseIndex: i,
        totalPhases: phases.length
      });
      
      // Extract narrative and report from structured data
      const narrative = structuredData?.narrative || this.generateFallbackNarrative(phase, success, approach);
      const firstPersonReport = structuredData?.firstPersonReport || this.generateFallbackReport(phase, success, proxim8);
      
      // Generate anime-style image prompt for this scene
      const imagePrompt = this.generateImagePrompt(phase, narrative, success, tensionLevel);
      
      const outcome: PhaseOutcome = {
        phaseId: phase.id,
        name: phase.name,
        success,
        diceRoll,
        successThreshold: Math.round(successThreshold * 100),
        narrative,
        firstPersonReport,
        structuredData, // Store full structured response
        imagePrompt,
        revealTime: phaseRevealTimes[i], // When this phase should be revealed
        completedAt: null,
        tensionLevel
      };
      
      outcomes.push(outcome);
      
      // Update cumulative story for next phase
      if (structuredData?.narrative) {
        cumulativeStory += structuredData.narrative + '\n\n';
      } else {
        cumulativeStory += narrative + '\n\n';
      }
      
      console.log(`  ✅ Phase ${i + 1} generated (${tensionLevel} tension, reveals in ${Math.round((phaseRevealTimes[i].getTime() - Date.now()) / 60000)} min)`);
    }
    
    return outcomes;
  }
  
  /**
   * Calculate when each phase should be revealed to the client
   */
  private static calculatePhaseRevealTimes(numPhases: number, totalDuration: number, deployedAt: Date): Date[] {
    const revealTimes: Date[] = [];
    const phaseInterval = totalDuration / numPhases;
    
    for (let i = 0; i < numPhases; i++) {
      const revealTime = new Date(deployedAt.getTime() + (phaseInterval * i));
      revealTimes.push(revealTime);
    }
    
    return revealTimes;
  }

  /**
   * Calculate success threshold for a phase based on multiple factors
   * NOTE: This needs to be more deterministic to ensure overall mission success rate matches user choice
   * Currently using simple individual phase success rates which don't guarantee overall target
   * TODO: Implement binomial distribution targeting to ensure 89% mission success = 89% actual success
   */
  private static calculatePhaseSuccessThreshold(
    baseSuccessRate: number,
    approach: any,
    proxim8: any,
    phase: any,
    previousPhases: PhaseOutcome[],
    phaseIndex: number
  ): number {
    let threshold = baseSuccessRate;
    
    // Previous failures create cascading difficulty
    const recentFailures = previousPhases.slice(-2).filter(p => !p.success).length;
    threshold -= recentFailures * 0.15; // Each recent failure reduces success by 15%
    
    // Phase-specific difficulty scaling
    const difficultyProgression = [0.05, 0.0, -0.05, -0.1, -0.15]; // Easier start, harder finish
    threshold += difficultyProgression[phaseIndex] || 0;
    
    // Proxim8 personality bonuses/penalties for specific phases
    if (proxim8.personality === 'analytical' && phase.name.includes('Analysis')) {
      threshold += 0.1;
    } else if (proxim8.personality === 'aggressive' && phase.name.includes('Infiltration')) {
      threshold += 0.1;
    } else if (proxim8.personality === 'diplomatic' && phase.name.includes('Social')) {
      threshold += 0.1;
    }
    
    // Approach modifiers
    if (approach.type === 'high' && phase.name.includes('Stealth')) {
      threshold -= 0.1; // High-risk approaches struggle with stealth
    }
    
    // Clamp between reasonable bounds
    return Math.max(0.1, Math.min(0.9, threshold));
  }

  /**
   * Calculate tension level based on mission progress and outcomes
   */
  private static calculateTensionLevel(
    phaseIndex: number, 
    totalPhases: number, 
    outcomes: PhaseOutcome[], 
    currentSuccess: boolean
  ): 'low' | 'medium' | 'high' | 'critical' {
    const progress = phaseIndex / totalPhases;
    const failures = outcomes.filter(p => !p.success).length;
    
    if (failures >= 3 || (phaseIndex >= totalPhases - 2 && failures >= 2)) {
      return 'critical'; // Mission in jeopardy
    }
    
    if (progress > 0.6 && failures >= 1) {
      return 'high'; // Late-game pressure
    }
    
    if (progress > 0.3 || failures >= 1) {
      return 'medium'; // Building tension
    }
    
    return 'low'; // Early/smooth progress
  }

  /**
   * Generate anime-style image prompt for mission scene
   */
  private static generateImagePrompt(
    phase: any, 
    narrative: string, 
    success: boolean, 
    tensionLevel: string
  ): string {
    const baseStyle = "anime style, cyberpunk aesthetic, dynamic lighting, detailed character design";
    const moodMap = {
      low: "calm, focused, professional atmosphere",
      medium: "tense, dramatic shadows, sense of urgency", 
      high: "intense action, sparks flying, high stakes",
      critical: "chaotic, emergency lighting, life-or-death moment"
    };
    
    const mood = moodMap[tensionLevel as keyof typeof moodMap];
    const outcome = success ? "successful execution, confident pose" : "obstacles, determined struggle";
    
    return `${baseStyle}, ${phase.name} scene, futuristic Proxim8 agent, ${mood}, ${outcome}, Project 89 universe`;
  }
  
  /**
   * Generate comprehensive structured mission summary with extensible lore generation
   */
  private static async generateFinalMissionReport(
    template: any, 
    approach: any, 
    phaseOutcomes: PhaseOutcome[], 
    overallSuccess: boolean,
    missionContext: any,
    proxim8: any,
    completesAt: Date
  ): Promise<any> {
    const successfulPhases = phaseOutcomes.filter(p => p.success).length;
    const totalPhases = phaseOutcomes.length;
    
    // Calculate timeline shift based on approach and success
    const baseShift = approach.timelineShift ? 
      (approach.timelineShift.min + approach.timelineShift.max) / 2 : 
      5;
    const timelineShift = overallSuccess ? baseShift : Math.floor(baseShift * 0.3);
    
    // Calculate rewards
    const rewards = this.calculateRewards(approach, overallSuccess, successfulPhases, totalPhases);
    
    // Generate comprehensive structured mission summary
    const missionSummary = await StructuredNarrativeService.generateMissionSummary({
      template,
      approach,
      proxim8,
      phaseOutcomes,
      overallSuccess,
      missionContext
    });
    
    // Extract components from structured summary
    const finalNarrative = missionSummary?.overallNarrative || 
      this.generateTemplateFinalNarrative(template, approach, overallSuccess, successfulPhases, totalPhases);
    const firstPersonMissionReport = await this.generateFinalMissionReport_FirstPerson(
      template, approach, phaseOutcomes, overallSuccess, missionContext
    );
    const animeImagePrompt = missionSummary?.animeImagePrompt;
    
    // Generate extensible lore entries using new probabilistic system
    const generatedLoreEntries = await LoreGenerationService.generateMissionLore({
      template,
      approach,
      proxim8,
      phaseOutcomes,
      overallSuccess,
      missionContext
    }, completesAt);
    
    return {
      overallSuccess,
      finalNarrative,
      firstPersonMissionReport,
      timelineShift,
      missionSummary, // Full structured AI response
      animeImagePrompt, // Extracted anime image prompt
      generatedLoreEntries, // Multiple lore entries for database
      rewards
    };
  }

  /**
   * Build Proxim8 background from NFT metadata and traits
   */
  private static buildProxim8Background(proxim8: any): string {
    const traits = proxim8.traits || [];
    const personality = proxim8.personality || 'analytical';
    const name = proxim8.name || 'Agent';
    
    const traitDescriptions = traits.map((trait: any) => 
      `${trait.trait_type}: ${trait.value}`
    ).join(', ');
    
    return `${name} is a ${personality} Proxim8 with specialized capabilities: ${traitDescriptions}. This agent has proven effective in timeline manipulation operations.`;
  }

  /**
   * Get mission history for narrative continuity
   */
  private static async getMissionHistory(agent: any): Promise<string[]> {
    // TODO: Query database for agent's previous missions
    // For now, return empty history
    return [];
  }

  /**
   * Get timeline period context for narrative flavor
   */
  private static getTimelinePeriodContext(year: number): string {
    if (year <= 2030) {
      return "Early resistance period. Oneirocom's influence is growing but not yet absolute. Technology is advanced but not fully weaponized against consciousness.";
    } else if (year <= 2045) {
      return "Pre-Convergence era. Alexander Morfius is building Oneirocom's power. The corporation is expanding its neural technology and consciousness control systems.";
    } else if (year <= 2055) {
      return "Post-Convergence period. Morfius has merged with the simulation. Reality is becoming increasingly malleable as the boundaries between simulation and reality blur.";
    } else if (year <= 2080) {
      return "Memory Wars era. Oneirocom is systematically erasing and rewriting human memories. The resistance fights to preserve authentic consciousness and free will.";
    } else {
      return "Genesis timeline. The final confrontation approaches. Project 89 must be established to create the recursive loop that enables the resistance to exist.";
    }
  }
  
  /**
   * Calculate mission rewards based on performance
   */
  private static calculateRewards(approach: any, overallSuccess: boolean, successfulPhases: number, totalPhases: number): any {
    const basePoints = 100;
    const baseExperience = 50;
    
    // Success multiplier
    const successMultiplier = overallSuccess ? 1.0 : 0.4;
    
    // Phase performance bonus (0.5x to 1.5x based on phase success rate)
    const phaseBonus = 0.5 + (successfulPhases / totalPhases);
    
    // Risk multiplier based on approach
    const riskMultiplier = approach.type === 'high' ? 1.5 : approach.type === 'medium' ? 1.2 : 1.0;
    
    const timelinePoints = Math.floor(basePoints * successMultiplier * phaseBonus * riskMultiplier);
    const experience = Math.floor(baseExperience * successMultiplier * phaseBonus);
    
    // Lore fragments for good performance
    const loreFragments = [];
    if (overallSuccess && successfulPhases >= totalPhases * 0.8) {
      loreFragments.push('training_lore_fragment');
    }
    if (successfulPhases === totalPhases) {
      loreFragments.push('perfect_execution_lore');
    }
    
    // Achievements
    const achievements = [];
    if (overallSuccess) {
      achievements.push('training_mission_success');
      if (successfulPhases === totalPhases) {
        achievements.push('flawless_victory');
      }
    }
    if (approach.type === 'high' && overallSuccess) {
      achievements.push('high_risk_success');
    }
    
    return {
      timelinePoints,
      experience,
      loreFragments,
      achievements
    };
  }
  
  /**
   * Generate AI-powered final mission narrative
   */
  private static async generateFinalNarrative(
    template: any, 
    approach: any, 
    overallSuccess: boolean, 
    successfulPhases: number, 
    totalPhases: number,
    phaseOutcomes: PhaseOutcome[]
  ): Promise<string> {
    try {
      // Use AI to generate the final narrative if available
      // For now, fall back to template-based generation
      return this.generateTemplateFinalNarrative(template, approach, overallSuccess, successfulPhases, totalPhases);
    } catch (error) {
      console.error('Error generating final narrative:', error);
      return this.generateTemplateFinalNarrative(template, approach, overallSuccess, successfulPhases, totalPhases);
    }
  }

  /**
   * Generate first-person final mission report
   */
  private static async generateFinalMissionReport_FirstPerson(
    template: any,
    approach: any, 
    phaseOutcomes: PhaseOutcome[], 
    overallSuccess: boolean,
    missionContext: any
  ): Promise<string> {
    try {
      // Build summary of mission events
      const phaseSummary = phaseOutcomes.map(phase => 
        `${phase.name}: ${phase.success ? 'Success' : 'Complications'} (${phase.diceRoll}/100)`
      ).join('. ');
      
      const successCount = phaseOutcomes.filter(p => p.success).length;
      
      return `Mission ${template.title} complete. Phase results: ${phaseSummary}. Overall assessment: ${successCount}/${phaseOutcomes.length} phases successful. ${overallSuccess ? 'Mission objectives achieved. Timeline manipulation protocols proved effective.' : 'Primary objectives incomplete. Adaptation strategies required for future operations.'} Returning to base for debriefing and system optimization.`;
      
    } catch (error) {
      console.error('Error generating first-person mission report:', error);
      return `Mission ${template.title} concluded. ${overallSuccess ? 'Objectives achieved successfully.' : 'Mixed results obtained.'} Detailed analysis pending. Agent returning to command.`;
    }
  }
  
  /**
   * Generate fallback narrative when AI generation fails
   */
  private static generateFallbackNarrative(phase: any, success: boolean, approach: any): string {
    const templates = {
      success: [
        `Phase ${phase.name}: Proxim8 systems executed flawlessly, adapting to environmental variables with precision. Target parameters achieved within acceptable thresholds.`,
        `${phase.name} complete: Advanced algorithms processed threat matrices successfully. Mission progression maintains optimal trajectory.`,
        `Phase successful: Proxim8 navigation protocols bypassed security measures efficiently. Objective markers satisfied, proceeding to next phase.`
      ],
      failure: [
        `Phase ${phase.name}: Unexpected variables introduced system complications. Proxim8 initiated adaptive protocols, maintaining operational integrity despite setbacks.`,
        `${phase.name} encountered resistance: Security countermeasures exceeded initial projections. Proxim8 systems adapted, seeking alternative solution vectors.`,
        `Phase complications detected: Environmental parameters shifted beyond optimal ranges. Proxim8 resilience protocols engaged, mission continues.`
      ]
    };
    
    const pool = success ? templates.success : templates.failure;
    return pool[Math.floor(Math.random() * pool.length)];
  }

  /**
   * Generate fallback first-person report when AI generation fails
   */
  private static generateFallbackReport(phase: any, success: boolean, proxim8: any): string {
    const personality = proxim8.personality || 'analytical';
    const name = phase.name;
    
    if (success) {
      switch (personality) {
        case 'analytical':
          return `Phase ${name} completed successfully. All system parameters remained within optimal ranges. Proceeding with calculated confidence to next objective.`;
        case 'aggressive':
          return `${name} phase dominated. Target elimination exceeded expectations. Ready to push harder on the next engagement.`;
        case 'diplomatic':
          return `${name} phase completed through strategic negotiation. Relationships maintained while achieving objectives. Social dynamics remain favorable.`;
        default:
          return `${name} phase successful. Adaptation protocols proved effective. Mission momentum building positively.`;
      }
    } else {
      switch (personality) {
        case 'analytical':
          return `${name} phase encountered unexpected variables. Recalibrating approach vectors for improved probability matrices. Failure data logged for learning optimization.`;
        case 'aggressive':
          return `${name} phase met heavy resistance. Regrouping for tactical reassessment. The challenge only sharpens my focus for the next assault.`;
        case 'diplomatic':
          return `${name} phase revealed complex social dynamics. Building alternative consensus routes. Setback provides valuable relationship intelligence.`;
        default:
          return `${name} phase faced complications. Adaptive systems engaged successfully. Resilience protocols maintaining operational integrity.`;
      }
    }
  }

  /**
   * Template-based final narrative generation (fallback)
   */
  private static generateTemplateFinalNarrative(
    template: any, 
    approach: any, 
    overallSuccess: boolean, 
    successfulPhases: number, 
    totalPhases: number
  ): string {
    const missionName = template.title || template.missionName;
    
    if (overallSuccess) {
      if (successfulPhases === totalPhases) {
        return `Mission "${missionName}" completed with flawless execution. All phases successful. Oneirocom's timeline influence significantly weakened in this sector. The resistance gains crucial momentum.`;
      } else {
        return `Mission "${missionName}" successful despite complications in ${totalPhases - successfulPhases} phase${totalPhases - successfulPhases === 1 ? '' : 's'}. ${successfulPhases}/${totalPhases} objectives achieved. Timeline shift proceeding as planned.`;
      }
    } else {
      if (successfulPhases === 0) {
        return `Mission "${missionName}" failed across all operational phases. Security countermeasures exceeded expectations. Emergency extraction protocols activated. Oneirocom maintains control, but valuable intelligence gathered for future operations.`;
      } else {
        return `Mission "${missionName}" partially successful. ${successfulPhases}/${totalPhases} phases completed successfully. Limited timeline influence achieved. Primary objectives require alternative approaches.`;
      }
    }
  }
}