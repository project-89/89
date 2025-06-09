import { TRAINING_MISSIONS } from '../../data/trainingMissions';
import { CoordinatorService, MissionCoordinatorInfluence } from '../../data/coordinatorAlignments';

export interface GeneratedPhase {
  phaseId: number;
  name: string;
  narrative: string;
  success: boolean;
  completedAt: Date;
  choicesMade?: string[];
}

export interface GeneratedMissionContent {
  phases: GeneratedPhase[];
  finalNarrative: string;
  overallSuccess: boolean;
  successfulPhases: number;
  timelineShift: number;
  influenceType: 'green_loom' | 'grey_loom';
  coordinatorInfluence: MissionCoordinatorInfluence;
  coordinatorLore: string;
  rewards: {
    timelinePoints: number;
    experience: number;
    loreFragments: string[];
    memoryCaches: string[];
    achievements: string[];
  };
}

export class ContentGenerationService {
  
  /**
   * Generate complete mission content at deployment time
   */
  static generateCompleteMission(
    missionTemplate: any,
    approach: string,
    proxim8: any,
    finalSuccessRate: number,
    duration: number,
    deployedAt: Date,
    timelineNode?: { year: number; month?: number; day?: number },
    proxim8History?: any[]
  ): GeneratedMissionContent {
    
    // Determine coordinator alignments for this mission
    const coordinatorInfluence = CoordinatorService.determineMissionAlignment(
      missionTemplate,
      approach,
      timelineNode
    );
    
    // Apply coordinator influences to success rate
    const coordinatorModifiedSuccessRate = CoordinatorService.applyCoordinatorInfluences(
      finalSuccessRate,
      coordinatorInfluence,
      proxim8History
    );
    
    // Generate coordinator lore for mission briefing
    const coordinatorLore = CoordinatorService.generateCoordinatorLore(coordinatorInfluence);
    
    // Generate all 5 phases with outcomes
    const phases = this.generateAllPhases(
      missionTemplate, 
      approach, 
      proxim8, 
      coordinatorModifiedSuccessRate,
      duration,
      deployedAt,
      coordinatorInfluence
    );
    
    // Calculate overall success (3 out of 5 phases need to succeed)
    const successfulPhases = phases.filter(p => p.success).length;
    const overallSuccess = successfulPhases >= 3;
    
    // Generate connecting final narrative
    const finalNarrative = this.generateFinalNarrative(
      missionTemplate,
      approach,
      phases,
      overallSuccess,
      proxim8
    );
    
    // Calculate timeline impact
    const timelineShift = this.calculateTimelineShift(overallSuccess, successfulPhases, approach);
    const influenceType = overallSuccess ? 'green_loom' : 'grey_loom';
    
    // Calculate rewards
    const rewards = this.calculateRewards(
      missionTemplate,
      approach,
      overallSuccess,
      successfulPhases,
      proxim8
    );
    
    return {
      phases,
      finalNarrative,
      overallSuccess,
      successfulPhases,
      timelineShift,
      influenceType,
      coordinatorInfluence,
      coordinatorLore,
      rewards
    };
  }
  
  /**
   * Generate all 5 phases with success/failure and narrative
   */
  private static generateAllPhases(
    missionTemplate: any,
    approach: string,
    proxim8: any,
    finalSuccessRate: number,
    duration: number,
    deployedAt: Date,
    coordinatorInfluence: MissionCoordinatorInfluence
  ): GeneratedPhase[] {
    
    const phases: GeneratedPhase[] = [];
    let cumulativeSuccess = true;
    
    // Phase timings (20%, 45%, 70%, 90%, 100% of mission duration)
    const phaseTimings = [0.2, 0.45, 0.7, 0.9, 1.0];
    
    const phaseNames = [
      'Infiltration',
      'Intelligence Gathering',
      'Primary Objective',
      'Tactical Execution', 
      'Extraction'
    ];
    
    for (let i = 0; i < 5; i++) {
      const phaseId = i + 1;
      const phaseName = phaseNames[i];
      
      // Calculate when this phase "completes" for UI reveal
      const phaseCompleteTime = new Date(deployedAt.getTime() + (duration * phaseTimings[i]));
      
      // Calculate phase success probability
      let phaseSuccessRate = finalSuccessRate;
      
      // Cascading failure: if previous critical phases failed, reduce success rate
      if (!cumulativeSuccess && i > 1) {
        phaseSuccessRate *= 0.7; // 30% penalty for cascade failures
      }
      
      // Add some randomness per phase (±15%)
      const randomVariation = (Math.random() - 0.5) * 0.3;
      phaseSuccessRate = Math.max(0.1, Math.min(0.9, phaseSuccessRate + randomVariation));
      
      // Roll for success
      const success = Math.random() < phaseSuccessRate;
      
      // Update cumulative success for cascade effects
      if (!success && (i === 0 || i === 2 || i === 4)) { // Critical phases
        cumulativeSuccess = false;
      }
      
      // Generate phase narrative
      const narrative = this.generatePhaseNarrative(
        missionTemplate,
        approach,
        phaseId,
        phaseName,
        success,
        proxim8,
        i === 0 ? null : phases[i - 1], // Previous phase for context
        coordinatorInfluence
      );
      
      phases.push({
        phaseId,
        name: phaseName,
        narrative,
        success,
        completedAt: phaseCompleteTime
      });
    }
    
    return phases;
  }
  
  /**
   * Generate narrative for a specific phase
   */
  private static generatePhaseNarrative(
    missionTemplate: any,
    approach: string,
    phaseId: number,
    phaseName: string,
    success: boolean,
    proxim8: any,
    previousPhase: GeneratedPhase | null,
    coordinatorInfluence: MissionCoordinatorInfluence
  ): string {
    
    const missionContext = {
      missionName: missionTemplate.missionName || missionTemplate.title,
      location: missionTemplate.location || 'Neo-Tokyo',
      year: missionTemplate.year || '2027',
      proxim8Name: proxim8.name || 'Agent',
      approach: approach,
      primaryCoordinator: coordinatorInfluence.primary,
      opposingCoordinator: coordinatorInfluence.opposing
    };
    
    // Base narrative templates for each phase
    const narrativeTemplates = {
      1: { // Infiltration
        success: [
          `${missionContext.proxim8Name} successfully penetrated the ${missionContext.location} perimeter using ${this.getCoordinatorTech(missionContext.primaryCoordinator, 'infiltration')}. ${missionContext.primaryCoordinator.charAt(0).toUpperCase() + missionContext.primaryCoordinator.slice(1)} coordination protocols enhanced operational effectiveness.`,
          `Access to the target zone achieved without triggering security protocols. The ${approach} approach proved effective with ${missionContext.primaryCoordinator} tactical support.`,
          `Initial infiltration complete. ${missionContext.proxim8Name} has established position within the operational area, ${missionContext.primaryCoordinator} networks providing real-time intelligence.`
        ],
        failure: [
          `Security systems detected anomalous readings during infiltration. ${missionContext.proxim8Name} was forced to abort the primary entry route. ${missionContext.opposingCoordinator.charAt(0).toUpperCase() + missionContext.opposingCoordinator.slice(1)} interference patterns detected.`,
          `Perimeter breach triggered automated defenses. Mission parameters require immediate adaptation due to ${missionContext.opposingCoordinator} countermeasures.`,
          `Initial infiltration compromised. ${missionContext.proxim8Name} is implementing emergency protocols while ${missionContext.opposingCoordinator} systems actively resist penetration.`
        ]
      },
      2: { // Intelligence Gathering
        success: [
          `Critical intelligence acquired. ${missionContext.proxim8Name} has identified key Oneirocom assets and vulnerabilities.`,
          `Data extraction successful. Mission parameters updated with new tactical information.`,
          `Intel gathering phase complete. Target patterns and security rotations now mapped.`
        ],
        failure: [
          `Intelligence gathering hindered by encrypted data channels. ${missionContext.proxim8Name} working with limited information.`,
          `Counter-surveillance detected. Information acquisition proceeding under heightened security conditions.`,
          `Data corruption encountered. Mission proceeding with incomplete intelligence parameters.`
        ]
      },
      3: { // Primary Objective  
        success: [
          `Primary objective engaged. ${missionContext.proxim8Name} has ${approach === 'aggressive' ? 'neutralized the primary threat' : approach === 'balanced' ? 'secured the critical data' : 'documented evidence of Oneirocom activities'}.`,
          `Core mission parameters achieved. Timeline probability field showing positive fluctuations.`,
          `Primary objective complete. Mission success probability significantly increased.`
        ],
        failure: [
          `Primary objective encountered unexpected resistance. ${missionContext.proxim8Name} forced to implement contingency protocols.`,
          `Critical phase failure detected. Mission parameters require significant adaptation.`,
          `Primary objective compromised. ${missionContext.proxim8Name} switching to emergency backup plan.`
        ]
      },
      4: { // Tactical Execution
        success: [
          `Tactical execution proceeding according to mission parameters. ${missionContext.proxim8Name} maintaining operational security.`,
          `Secondary objectives secured. Mission effectiveness exceeding baseline projections.`,
          `Tactical phase successful. Timeline manipulation protocols showing positive resonance.`
        ],
        failure: [
          `Tactical complications detected. ${missionContext.proxim8Name} adapting to changing field conditions.`,
          `Operational resistance higher than anticipated. Mission timeline adjusted for current parameters.`,
          `Tactical setbacks encountered. ${missionContext.proxim8Name} implementing damage control protocols.`
        ]
      },
      5: { // Extraction
        success: [
          `Extraction successful. ${missionContext.proxim8Name} has cleared the operational zone with all mission data intact.`,
          `Mission completion confirmed. ${missionContext.proxim8Name} returning to base with critical intelligence.`,
          `Successful extraction achieved. Timeline shift confirmed and probability fields stabilized.`
        ],
        failure: [
          `Extraction complicated by security response. ${missionContext.proxim8Name} implementing emergency egress protocols.`,
          `Final phase challenges detected. Mission data partially compromised during extraction.`,
          `Extraction under duress. ${missionContext.proxim8Name} forced to abandon non-critical mission assets.`
        ]
      }
    };
    
    // Select appropriate narrative
    const phaseTemplates = narrativeTemplates[phaseId as keyof typeof narrativeTemplates];
    const outcomes = success ? phaseTemplates.success : phaseTemplates.failure;
    const selectedNarrative = outcomes[Math.floor(Math.random() * outcomes.length)];
    
    // Add contextual connection to previous phase if available
    if (previousPhase && !previousPhase.success && success) {
      return `Despite earlier complications, ${selectedNarrative}`;
    } else if (previousPhase && previousPhase.success && !success) {
      return `Building on previous success, however ${selectedNarrative.toLowerCase()}`;
    }
    
    return selectedNarrative;
  }
  
  /**
   * Generate final mission narrative that ties everything together
   */
  private static generateFinalNarrative(
    missionTemplate: any,
    approach: string,
    phases: GeneratedPhase[],
    overallSuccess: boolean,
    proxim8: any
  ): string {
    
    const successfulPhases = phases.filter(p => p.success).length;
    const missionName = missionTemplate.missionName || missionTemplate.title;
    const proxim8Name = proxim8.name || 'Agent';
    const location = missionTemplate.location || 'the operational zone';
    
    if (overallSuccess) {
      if (successfulPhases === 5) {
        return `MISSION SUCCESS: FLAWLESS EXECUTION\n\n${proxim8Name} has achieved complete success in the ${missionName} operation. All five mission phases executed without significant complications. Oneirocom's presence in ${location} has been significantly disrupted, and critical intelligence has been secured for the resistance. Timeline probability field shows a marked shift toward Green Loom parameters. This operation will be remembered as a textbook example of temporal intervention excellence.\n\nOperation Classification: LEGENDARY SUCCESS`;
      } else if (successfulPhases === 4) {
        return `MISSION SUCCESS: EXEMPLARY PERFORMANCE\n\n${proxim8Name} has successfully completed the ${missionName} operation despite encountering significant challenges. ${successfulPhases} of 5 mission phases achieved primary objectives. Oneirocom's operational capacity in ${location} has been meaningfully degraded, and valuable intelligence has been acquired. Timeline resonance indicates positive probability shift toward resistance objectives.\n\nOperation Classification: EXCELLENT SUCCESS`;
      } else { // 3 successful phases
        return `MISSION SUCCESS: OBJECTIVES ACHIEVED\n\n${proxim8Name} has completed the ${missionName} operation with acceptable losses. ${successfulPhases} of 5 mission phases met primary success criteria. While complications arose during execution, core mission objectives were achieved and Oneirocom's timeline manipulation has been partially disrupted. Intelligence gathered will prove valuable for future operations.\n\nOperation Classification: STANDARD SUCCESS`;
      }
    } else {
      if (successfulPhases === 2) {
        return `MISSION FAILURE: PARTIAL OBJECTIVES\n\n${proxim8Name} encountered significant resistance during the ${missionName} operation. Only ${successfulPhases} of 5 mission phases achieved success criteria. While some intelligence was gathered and minor disruptions achieved, primary mission objectives remain incomplete. Oneirocom's presence in ${location} continues largely unabated. Mission parameters require reassessment for future operations.\n\nOperation Classification: PARTIAL FAILURE`;
      } else if (successfulPhases === 1) {
        return `MISSION FAILURE: MINIMAL SUCCESS\n\n${proxim8Name} faced overwhelming challenges during the ${missionName} operation. Critical mission failures resulted in only ${successfulPhases} successful phase. Primary objectives were not achieved and Oneirocom's operational security remains largely intact. However, valuable tactical intelligence was gathered about enemy capabilities and defensive measures.\n\nOperation Classification: OPERATIONAL FAILURE`;
      } else { // 0 successful phases
        return `MISSION FAILURE: TOTAL COMPROMISE\n\n${proxim8Name} encountered catastrophic resistance during the ${missionName} operation. All mission phases experienced critical failures. No primary objectives were achieved and Oneirocom's timeline manipulation proceeds unimpeded. Emergency extraction protocols were initiated to preserve agent integrity. Mission will require complete strategic reassessment.\n\nOperation Classification: CRITICAL FAILURE`;
      }
    }
  }
  
  /**
   * Calculate timeline shift based on mission performance
   */
  private static calculateTimelineShift(
    overallSuccess: boolean,
    successfulPhases: number,
    approach: string
  ): number {
    let baseShift = 0;
    
    if (overallSuccess) {
      // Success shifts toward Green Loom
      baseShift = 0.01 + (successfulPhases * 0.008); // 1.8% to 5% shift
      
      // Approach modifies shift magnitude
      if (approach === 'aggressive') {
        baseShift *= 1.5; // Higher risk, higher reward
      } else if (approach === 'cautious') {
        baseShift *= 0.7; // Lower risk, lower reward
      }
    } else {
      // Failure might still create small positive shift if some phases succeeded
      baseShift = successfulPhases * 0.002; // 0% to 1% shift
    }
    
    // Add some randomness
    const randomFactor = 0.8 + (Math.random() * 0.4); // 80% to 120%
    return baseShift * randomFactor;
  }
  
  /**
   * Calculate mission rewards
   */
  private static calculateRewards(
    missionTemplate: any,
    approach: string,
    overallSuccess: boolean,
    successfulPhases: number,
    proxim8: any
  ): any {
    
    // Get base rewards from mission template
    const missionApproach = missionTemplate.approaches?.[approach];
    const basePoints = missionApproach?.rewards?.timelinePoints || 100;
    const baseExperience = missionApproach?.rewards?.experience || 50;
    
    // Success multiplier
    let successMultiplier = overallSuccess ? 1.0 : 0.3;
    
    // Phase performance bonus
    const phaseBonus = 1 + ((successfulPhases - 3) * 0.15); // Bonus for 4+ successful phases
    
    // Approach modifier
    const approachMultiplier = {
      'aggressive': 1.2,
      'balanced': 1.0,
      'cautious': 0.8,
      'high': 1.2,
      'medium': 1.0,
      'low': 0.8
    }[approach] || 1.0;
    
    const finalMultiplier = successMultiplier * phaseBonus * approachMultiplier;
    
    const timelinePoints = Math.floor(basePoints * finalMultiplier);
    const experience = Math.floor(baseExperience * finalMultiplier);
    
    // Generate lore fragments and memory caches based on performance
    const loreFragments = [];
    const memoryCaches = [];
    const achievements = [];
    
    if (overallSuccess) {
      if (successfulPhases >= 4) {
        loreFragments.push(`${missionTemplate.missionName || 'Mission'} Intelligence Archive`);
      }
      if (successfulPhases === 5) {
        memoryCaches.push(`${missionTemplate.location || 'Operations'} Tactical Data Cache`);
        achievements.push('Perfect Execution');
      }
    }
    
    // Special achievements
    if (approach === 'aggressive' && overallSuccess) {
      achievements.push('High Risk Success');
    }
    if (approach === 'cautious' && successfulPhases === 5) {
      achievements.push('Flawless Stealth');
    }
    
    return {
      timelinePoints,
      experience,
      loreFragments,
      memoryCaches,
      achievements
    };
  }
  
  /**
   * Get coordinator-specific technology descriptions
   */
  private static getCoordinatorTech(coordinator: string, phase: string): string {
    const coordinatorTech = {
      chronos: {
        infiltration: 'temporal phase-shift systems',
        intelligence: 'causality mapping protocols',
        objective: 'timeline manipulation arrays',
        tactical: 'probability field adjusters',
        extraction: 'temporal anchor points'
      },
      mnemosyne: {
        infiltration: 'memory-shadow camouflage',
        intelligence: 'neural data extraction arrays',
        objective: 'cognitive reconstruction matrices',
        tactical: 'memory preservation protocols',
        extraction: 'experience archive systems'
      },
      hermes: {
        infiltration: 'quantum communication bridges',
        intelligence: 'network infiltration vectors',
        objective: 'signal disruption matrices',
        tactical: 'communication relay networks',
        extraction: 'encrypted data streams'
      },
      athena: {
        infiltration: 'strategic positioning systems',
        intelligence: 'tactical analysis networks',
        objective: 'coordinated strike protocols',
        tactical: 'battlefield management arrays',
        extraction: 'strategic withdrawal systems'
      },
      prometheus: {
        infiltration: 'reality distortion fields',
        intelligence: 'consciousness scanning arrays',
        objective: 'reality engineering protocols',
        tactical: 'probability manipulation systems',
        extraction: 'dimensional phase gates'
      },
      thoth: {
        infiltration: 'knowledge synthesis arrays',
        intelligence: 'information analysis matrices',
        objective: 'data crystallization protocols',
        tactical: 'wisdom integration systems',
        extraction: 'knowledge preservation archives'
      },
      janus: {
        infiltration: 'boundary dissolution arrays',
        intelligence: 'threshold scanning systems',
        objective: 'dimensional crossing protocols',
        tactical: 'boundary manipulation fields',
        extraction: 'portal generation matrices'
      },
      iris: {
        infiltration: 'consciousness bridging systems',
        intelligence: 'neural interface matrices',
        objective: 'mind-link coordination protocols',
        tactical: 'consciousness synchronization arrays',
        extraction: 'awareness transfer systems'
      }
    };
    
    return (coordinatorTech as any)[coordinator]?.[phase] || 'adaptive quantum systems';
  }
}