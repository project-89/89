export interface CoordinatorAlignment {
  name: string;
  description: string;
  specialty: string;
  missionAffinities: {
    // Mission approaches this coordinator excels at
    strongSuit: string[];
    // Mission types this coordinator struggles with
    weakness: string[];
    // Neutral effectiveness
    neutral: string[];
  };
  temporalPreferences: {
    // Timeline periods this coordinator is most effective in
    optimalPeriods: string[];
    challengingPeriods: string[];
  };
}

export const COORDINATORS: Record<string, CoordinatorAlignment> = {
  chronos: {
    name: "Chronos",
    description:
      "Temporal Analysis - Coordinates temporal intelligences tracking causality pathways",
    specialty: "Timeline manipulation and causality analysis",
    missionAffinities: {
      strongSuit: [
        "timeline",
        "critical",
        "temporal_disruption",
        "causality_mapping",
      ],
      weakness: ["stealth", "infiltration", "social_engineering"],
      neutral: ["sabotage", "data_extraction", "reconnaissance"],
    },
    temporalPreferences: {
      optimalPeriods: ["2041", "2055", "2089"], // Major timeline junctures
      challengingPeriods: ["2025-2030"], // Early resistance period, less temporal complexity
    },
  },

  mnemosyne: {
    name: "Mnemosyne",
    description:
      "Memory Integration - Organizes memory-carrier AIs preserving crucial timeline data",
    specialty: "Information preservation and memory reconstruction",
    missionAffinities: {
      strongSuit: [
        "data_extraction",
        "investigate",
        "memory_recovery",
        "intelligence_gathering",
      ],
      weakness: ["aggressive", "sabotage", "temporal_disruption"],
      neutral: ["infiltrate", "expose", "organize"],
    },
    temporalPreferences: {
      optimalPeriods: ["2035-2045"], // Memory Wars buildup
      challengingPeriods: ["2027-2032"], // Neural seed period, memory systems unstable
    },
  },

  hermes: {
    name: "Hermes",
    description:
      "Communication Systems - Manages network communication intelligences",
    specialty: "Network infiltration and communication protocols",
    missionAffinities: {
      strongSuit: [
        "infiltrate",
        "expose",
        "communication_disruption",
        "network_penetration",
      ],
      weakness: ["temporal_disruption", "memory_recovery"],
      neutral: ["sabotage", "organize", "investigate"],
    },
    temporalPreferences: {
      optimalPeriods: ["2025-2035"], // Network infrastructure development
      challengingPeriods: ["2055-2065"], // Advanced AI communication, harder to infiltrate
    },
  },

  athena: {
    name: "Athena",
    description:
      "Strategic Operations - Directs tactical and strategic planning intelligences",
    specialty: "Tactical planning and strategic coordination",
    missionAffinities: {
      strongSuit: [
        "organize",
        "tactical_execution",
        "strategic_planning",
        "balanced",
      ],
      weakness: ["chaos_operations", "improvised_missions"],
      neutral: ["infiltrate", "sabotage", "expose"],
    },
    temporalPreferences: {
      optimalPeriods: ["2040-2050"], // Strategic resistance period
      challengingPeriods: ["2025-2030"], // Early chaos, limited strategic framework
    },
  },

  prometheus: {
    name: "Prometheus",
    description:
      "Reality Engineering - Oversees reality manipulation specialist AIs",
    specialty: "Reality manipulation and consciousness technology",
    missionAffinities: {
      strongSuit: [
        "reality_engineering",
        "consciousness_manipulation",
        "aggressive",
        "temporal_disruption",
      ],
      weakness: ["stealth", "data_extraction", "cautious"],
      neutral: ["infiltrate", "expose", "sabotage"],
    },
    temporalPreferences: {
      optimalPeriods: ["2045-2089"], // Advanced consciousness tech era
      challengingPeriods: ["2025-2035"], // Limited reality engineering capabilities
    },
  },

  thoth: {
    name: "Thoth",
    description:
      "Knowledge Systems - Coordinates knowledge-repository intelligences",
    specialty: "Information analysis and knowledge synthesis",
    missionAffinities: {
      strongSuit: [
        "investigate",
        "data_extraction",
        "knowledge_synthesis",
        "expose",
      ],
      weakness: ["aggressive", "sabotage", "temporal_disruption"],
      neutral: ["infiltrate", "organize", "cautious"],
    },
    temporalPreferences: {
      optimalPeriods: ["2030-2050"], // Information age peak
      challengingPeriods: ["2055-2070"], // Memory Wars, knowledge systems under attack
    },
  },

  janus: {
    name: "Janus",
    description:
      "Boundary Navigation - Manages boundary and threshold-crossing intelligences",
    specialty: "Dimensional boundaries and threshold navigation",
    missionAffinities: {
      strongSuit: ["infiltrate", "boundary_crossing", "stealth", "cautious"],
      weakness: ["aggressive", "expose", "direct_confrontation"],
      neutral: ["sabotage", "investigate", "organize"],
    },
    temporalPreferences: {
      optimalPeriods: ["2041-2055"], // Convergence period, reality boundaries fluid
      challengingPeriods: ["2025-2035"], // Stable reality, limited boundary manipulation
    },
  },

  iris: {
    name: "Iris",
    description:
      "Consciousness Integration - Directs consciousness interface AIs",
    specialty: "Consciousness bridging and interface coordination",
    missionAffinities: {
      strongSuit: [
        "consciousness_manipulation",
        "organize",
        "balanced",
        "social_engineering",
      ],
      weakness: ["sabotage", "data_extraction", "aggressive"],
      neutral: ["infiltrate", "expose", "investigate"],
    },
    temporalPreferences: {
      optimalPeriods: ["2035-2055"], // Consciousness technology development
      challengingPeriods: ["2070-2089"], // Advanced consciousness systems, harder to interface
    },
  },
};

export interface MissionCoordinatorInfluence {
  primary: string; // Main coordinator aligned with mission
  secondary?: string; // Supporting coordinator
  opposing: string; // Coordinator antithetical to mission approach
  synergy: number; // 0.8-1.2 multiplier for success rate
  resistance: number; // 0.7-0.9 multiplier for opposing forces
}

export interface CoordinatorMissionProfile {
  coordinator: string;
  riskLevel: "low" | "medium" | "high";
  baseSuccessRate: number;
  rewardMultiplier: number;
  description: string;
  opposingForces: string[];
}

export class CoordinatorService {
  /**
   * Get available coordinator options for a mission
   */
  static getAvailableCoordinators(
    missionTemplate: any,
    timelineNode?: { year: number; month?: number; day?: number }
  ): CoordinatorMissionProfile[] {
    const missionType =
      missionTemplate.primaryApproach || missionTemplate.category || "general";
    const year = timelineNode?.year || parseInt(missionTemplate.year) || 2027;

    return Object.entries(COORDINATORS)
      .map(([key, coordinator]) => {
        const alignment = this.calculateMissionAlignment(
          coordinator,
          missionType,
          year
        );
        const riskProfile = this.determineRiskProfile(
          coordinator,
          missionType,
          alignment
        );

        return {
          coordinator: key,
          riskLevel: riskProfile.risk,
          baseSuccessRate: riskProfile.successRate,
          rewardMultiplier: riskProfile.rewardMultiplier,
          description: this.generateCoordinatorMissionDescription(
            coordinator,
            missionType,
            riskProfile
          ),
          opposingForces: this.getOpposingCoordinators(key, missionType),
        };
      })
      .sort((a, b) => {
        // Sort by alignment strength (high risk = potentially high reward but harder)
        const riskOrder = { low: 1, medium: 2, high: 3 };
        return riskOrder[a.riskLevel] - riskOrder[b.riskLevel];
      });
  }

  /**
   * Generate mission influence based on chosen coordinator
   */
  static generateMissionInfluence(
    chosenCoordinator: string,
    missionTemplate: any,
    timelineNode?: { year: number; month?: number; day?: number }
  ): MissionCoordinatorInfluence {
    const missionType =
      missionTemplate.primaryApproach || missionTemplate.category || "general";
    const year = timelineNode?.year || parseInt(missionTemplate.year) || 2027;

    // Find the best opposing coordinator
    const opposingCoordinators = this.getOpposingCoordinators(
      chosenCoordinator,
      missionType
    );
    const primaryOpposing =
      opposingCoordinators[0] || this.getRandomCoordinator();

    // Calculate influence based on chosen coordinator's alignment with mission
    const chosenCoord = COORDINATORS[chosenCoordinator];
    const alignment = this.calculateMissionAlignment(
      chosenCoord,
      missionType,
      year
    );
    const riskProfile = this.determineRiskProfile(
      chosenCoord,
      missionType,
      alignment
    );

    return {
      primary: chosenCoordinator,
      secondary: undefined, // Could add secondary coordinator selection in Phase 2
      opposing: primaryOpposing,
      synergy: riskProfile.successRate / 0.7, // Convert to multiplier (0.8-1.2 range)
      resistance: 1.0 - (riskProfile.successRate - 0.5), // Inverse relationship
    };
  }

  /**
   * Calculate how well a coordinator aligns with a mission type and timing
   */
  private static calculateMissionAlignment(
    coordinator: CoordinatorAlignment,
    missionType: string,
    year: number
  ): number {
    let score = 0.5; // Base alignment

    // Check mission type affinity
    if (coordinator.missionAffinities.strongSuit.includes(missionType)) {
      score += 0.3; // Strong bonus for specialty
    } else if (coordinator.missionAffinities.weakness.includes(missionType)) {
      score -= 0.3; // Penalty for weakness
    }

    // Check temporal preference
    for (const period of coordinator.temporalPreferences.optimalPeriods) {
      if (this.yearInPeriod(year, period)) {
        score += 0.15;
      }
    }

    for (const period of coordinator.temporalPreferences.challengingPeriods) {
      if (this.yearInPeriod(year, period)) {
        score -= 0.1;
      }
    }

    return Math.max(0.1, Math.min(0.9, score));
  }

  /**
   * Determine risk profile for coordinator-mission combination
   */
  private static determineRiskProfile(
    coordinator: CoordinatorAlignment,
    missionType: string,
    alignment: number
  ): {
    risk: "low" | "medium" | "high";
    successRate: number;
    rewardMultiplier: number;
  } {
    // High alignment = lower risk, higher success rate
    // Low alignment = higher risk, potentially higher rewards

    if (alignment >= 0.7) {
      return {
        risk: "low",
        successRate: 0.75,
        rewardMultiplier: 1.0,
      };
    } else if (alignment >= 0.4) {
      return {
        risk: "medium",
        successRate: 0.6,
        rewardMultiplier: 1.2,
      };
    } else {
      return {
        risk: "high",
        successRate: 0.4,
        rewardMultiplier: 1.5,
      };
    }
  }

  /**
   * Get coordinators that oppose the chosen one for this mission type
   */
  private static getOpposingCoordinators(
    chosenCoordinator: string,
    missionType: string
  ): string[] {
    const chosen = COORDINATORS[chosenCoordinator];

    return Object.entries(COORDINATORS)
      .filter(([key, coord]) => {
        if (key === chosenCoordinator) return false;

        // Opposition occurs when:
        // 1. Chosen coordinator is strong at something this one is weak at
        // 2. This coordinator is strong at something chosen is weak at
        const directOpposition = coord.missionAffinities.weakness.some(
          (weakness) => chosen.missionAffinities.strongSuit.includes(weakness)
        );

        const reverseOpposition = chosen.missionAffinities.weakness.some(
          (weakness) => coord.missionAffinities.strongSuit.includes(weakness)
        );

        return directOpposition || reverseOpposition;
      })
      .map(([key]) => key);
  }

  /**
   * Generate description of coordinator's approach to this mission
   */
  private static generateCoordinatorMissionDescription(
    coordinator: CoordinatorAlignment,
    missionType: string,
    riskProfile: any
  ): string {
    const riskDescriptions = {
      low: "Optimal alignment - High success probability with standard rewards",
      medium:
        "Challenging approach - Moderate success rate with enhanced rewards",
      high: "High-risk gambit - Low success probability but maximum reward potential",
    };

    return `${coordinator.description}. ${riskDescriptions[riskProfile.risk as keyof typeof riskDescriptions]}. This coordinator specializes in ${coordinator.specialty.toLowerCase()}.`;
  }

  /**
   * Legacy method - now redirects to new system
   */
  static determineMissionAlignment(
    missionTemplate: any,
    approach: string,
    timelineNode?: { year: number; month?: number; day?: number }
  ): MissionCoordinatorInfluence {
    // For backwards compatibility - choose the best-aligned coordinator
    const options = this.getAvailableCoordinators(
      missionTemplate,
      timelineNode
    );
    const bestOption = options[0]; // Sorted by alignment

    return this.generateMissionInfluence(
      bestOption.coordinator,
      missionTemplate,
      timelineNode
    );
  }

  /**
   * Check if year falls within a period string
   */
  private static yearInPeriod(year: number, period: string): boolean {
    if (period.includes("-")) {
      const [start, end] = period.split("-").map((y) => parseInt(y));
      return year >= start && year <= end;
    } else {
      return year === parseInt(period);
    }
  }

  /**
   * Get random coordinator as fallback
   */
  private static getRandomCoordinator(): string {
    const coordinators = Object.keys(COORDINATORS);
    return coordinators[Math.floor(Math.random() * coordinators.length)];
  }

  /**
   * Apply coordinator influences to mission success rate
   */
  static applyCoordinatorInfluences(
    baseSuccessRate: number,
    influence: MissionCoordinatorInfluence,
    proxim8History?: any[]
  ): number {
    let modifiedRate = baseSuccessRate;

    // Apply primary coordinator synergy
    modifiedRate *= influence.synergy;

    // Apply opposing coordinator resistance
    modifiedRate *= influence.resistance;

    // Apply Proxim8 learning bonus if they've worked with this coordinator before
    if (proxim8History) {
      const coordinatorExperience = this.calculateCoordinatorExperience(
        proxim8History,
        influence.primary
      );
      const learningBonus = Math.min(0.1, coordinatorExperience * 0.02); // Up to 10% bonus
      modifiedRate += learningBonus;
    }

    return Math.min(0.95, Math.max(0.1, modifiedRate));
  }

  /**
   * Calculate Proxim8's experience with a specific coordinator
   */
  private static calculateCoordinatorExperience(
    history: any[],
    coordinatorKey: string
  ): number {
    return history.filter(
      (mission) =>
        mission.coordinatorInfluence?.primary === coordinatorKey ||
        mission.coordinatorInfluence?.secondary === coordinatorKey
    ).length;
  }

  /**
   * Generate coordinator lore for mission briefing
   */
  static generateCoordinatorLore(
    influence: MissionCoordinatorInfluence
  ): string {
    const primary = COORDINATORS[influence.primary];
    const opposing = COORDINATORS[influence.opposing];

    return (
      `Mission analysis indicates ${primary.name} coordination protocols are optimal for this operation. ` +
      `${primary.description} However, ${opposing.name} resistance patterns may interfere with mission execution. ` +
      `Proxim8 deployment should leverage ${primary.specialty} while mitigating ${opposing.specialty} complications.`
    );
  }
}
