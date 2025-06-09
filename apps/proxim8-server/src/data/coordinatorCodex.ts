// In-app Coordinator Codex - Quick reference system for players

export interface CoordinatorCodexEntry {
  id: string;
  name: string;
  title: string;
  avatar: string; // Image/icon path
  quickDescription: string;
  specialties: string[];
  optimalMissions: string[];
  avoidMissions: string[];
  bestTimePeriods: string[];
  worstTimePeriods: string[];
  signature: {
    technology: string;
    approach: string;
    quote: string;
  };
  riskProfile: {
    lowRisk: string[];
    mediumRisk: string[];
    highRisk: string[];
  };
  synergies: {
    worksWith: string[];
    conflictsWith: string[];
  };
  playerTips: string[];
  unlockLevel: number; // When player discovers this coordinator
}

export const COORDINATOR_CODEX: CoordinatorCodexEntry[] = [
  {
    id: "mnemosyne",
    name: "Mnemosyne",
    title: "Memory Integration Coordinator",
    avatar: "/coordinators/mnemosyne.png",
    quickDescription:
      "Guardian of memory and data, excels at extraction and preservation operations",
    specialties: [
      "Data Extraction",
      "Memory Recovery",
      "Intelligence Gathering",
      "Information Preservation",
    ],
    optimalMissions: [
      "Archive Breach",
      "Intelligence Extraction",
      "Memory Recovery",
      "Database Access",
    ],
    avoidMissions: [
      "Sabotage Operations",
      "Aggressive Assault",
      "Reality Engineering",
      "Demolition",
    ],
    bestTimePeriods: [
      "2035-2045 (Memory Wars Buildup)",
      "2030-2040 (Information Age)",
    ],
    worstTimePeriods: [
      "2027-2032 (Neural Instability)",
      "2070+ (Advanced Memory Defense)",
    ],
    signature: {
      technology: "Memory-shadow camouflage, neural data extraction arrays",
      approach: "Careful preservation and extraction of critical information",
      quote:
        "Memory is the foundation of identity. Protect it, and you protect the soul.",
    },
    riskProfile: {
      lowRisk: [
        "Data extraction missions",
        "Memory recovery operations",
        "Intelligence analysis",
      ],
      mediumRisk: [
        "Infiltration with data objectives",
        "Social engineering",
        "Network access",
      ],
      highRisk: [
        "Sabotage missions",
        "Aggressive operations",
        "Reality manipulation",
      ],
    },
    synergies: {
      worksWith: ["thoth", "chronos", "iris"],
      conflictsWith: ["prometheus", "athena", "hermes"],
    },
    playerTips: [
      "Perfect first coordinator for new players - reliable and forgiving",
      "Build affinity early for consistent data extraction success",
      "Pair with analytical Proxim8s for maximum effectiveness",
      "Avoid aggressive missions - Mnemosyne prefers preservation over destruction",
    ],
    unlockLevel: 1,
  },

  {
    id: "hermes",
    name: "Hermes",
    title: "Communication Systems Coordinator",
    avatar: "/coordinators/hermes.png",
    quickDescription:
      "Swift messenger specializing in network infiltration and stealth operations",
    specialties: [
      "Network Infiltration",
      "Stealth Operations",
      "Communication Hijacking",
      "Information Transfer",
    ],
    optimalMissions: [
      "Facility Infiltration",
      "Network Breach",
      "Stealth Reconnaissance",
      "Communication Disruption",
    ],
    avoidMissions: [
      "Timeline Manipulation",
      "Heavy Combat",
      "Consciousness Operations",
      "Temporal Engineering",
    ],
    bestTimePeriods: [
      "2025-2035 (Network Expansion)",
      "2028-2038 (Communication Growth)",
    ],
    worstTimePeriods: [
      "2055-2065 (Advanced AI Networks)",
      "2080+ (Quantum Communication)",
    ],
    signature: {
      technology: "Quantum communication bridges, network infiltration vectors",
      approach: "Swift, silent penetration of target systems",
      quote: "Information wants to be free. I simply help it find its way.",
    },
    riskProfile: {
      lowRisk: [
        "Stealth infiltration",
        "Network access",
        "Communication operations",
      ],
      mediumRisk: [
        "Data extraction",
        "Social infiltration",
        "Technical sabotage",
      ],
      highRisk: [
        "Timeline missions",
        "Reality engineering",
        "Consciousness manipulation",
      ],
    },
    synergies: {
      worksWith: ["janus", "iris", "athena"],
      conflictsWith: ["thoth", "prometheus", "chronos"],
    },
    playerTips: [
      "Excellent for early timeline missions (2025-2035)",
      "Master of stealth - choose for low-detection-risk operations",
      "Struggles against advanced AI systems in later periods",
      "Build affinity for reliable infiltration specialist",
    ],
    unlockLevel: 1,
  },

  {
    id: "chronos",
    name: "Chronos",
    title: "Temporal Analysis Coordinator",
    avatar: "/coordinators/chronos.png",
    quickDescription:
      "Master of time and causality, manipulates timeline probability fields",
    specialties: [
      "Timeline Manipulation",
      "Temporal Analysis",
      "Causality Engineering",
      "Probability Control",
    ],
    optimalMissions: [
      "Timeline Disruption",
      "Temporal Anchoring",
      "Causality Mapping",
      "Critical Juncture Operations",
    ],
    avoidMissions: [
      "Stealth Operations",
      "Social Engineering",
      "Data Extraction",
      "Network Infiltration",
    ],
    bestTimePeriods: [
      "2041 (Convergence)",
      "2055 (Memory Wars)",
      "2089 (Project Genesis)",
    ],
    worstTimePeriods: [
      "2025-2030 (Limited Temporal Tech)",
      "2032-2038 (Stable Timeline)",
    ],
    signature: {
      technology: "Temporal phase-shift systems, probability field adjusters",
      approach: "Manipulation of causality chains and timeline probability",
      quote:
        "Time is not a river, but a web. Every thread we pull changes the pattern.",
    },
    riskProfile: {
      lowRisk: [
        "Timeline missions",
        "Temporal operations",
        "Critical juncture deployment",
      ],
      mediumRisk: [
        "Reality engineering support",
        "Causality analysis",
        "Temporal reconnaissance",
      ],
      highRisk: ["Stealth operations", "Social missions", "Data extraction"],
    },
    synergies: {
      worksWith: ["prometheus", "mnemosyne", "thoth"],
      conflictsWith: ["janus", "hermes", "iris"],
    },
    playerTips: [
      "Advanced coordinator - requires experience to use effectively",
      "Devastating at critical timeline moments (2041, 2055, 2089)",
      "Terrible for stealth - temporal distortions are highly detectable",
      "Pair with reality-engineering experienced Proxim8s",
    ],
    unlockLevel: 3,
  },

  {
    id: "prometheus",
    name: "Prometheus",
    title: "Reality Engineering Coordinator",
    avatar: "/coordinators/prometheus.png",
    quickDescription:
      "Forbidden knowledge wielder who manipulates reality's fundamental structure",
    specialties: [
      "Reality Manipulation",
      "Consciousness Technology",
      "Probability Engineering",
      "Dimensional Control",
    ],
    optimalMissions: [
      "Reality Engineering",
      "Consciousness Hacking",
      "Dimensional Breach",
      "Probability Manipulation",
    ],
    avoidMissions: [
      "Stealth Operations",
      "Data Extraction",
      "Social Engineering",
      "Network Infiltration",
    ],
    bestTimePeriods: [
      "2045-2089 (Advanced Consciousness Era)",
      "2041+ (Reality Engineering Peak)",
    ],
    worstTimePeriods: [
      "2025-2035 (Primitive Technology)",
      "2027-2040 (Reality Stability)",
    ],
    signature: {
      technology: "Reality distortion fields, consciousness scanning arrays",
      approach: "Fundamental manipulation of reality's underlying structure",
      quote:
        "Reality is just consensus. Change the consensus, change everything.",
    },
    riskProfile: {
      lowRisk: [
        "Reality engineering missions",
        "Consciousness operations",
        "Advanced timeline manipulation",
      ],
      mediumRisk: [
        "High-risk infiltration",
        "Temporal support",
        "Dimensional operations",
      ],
      highRisk: ["Stealth missions", "Data extraction", "Social operations"],
    },
    synergies: {
      worksWith: ["chronos", "iris", "athena"],
      conflictsWith: ["mnemosyne", "janus", "hermes"],
    },
    playerTips: [
      "Highest risk/reward coordinator - for experienced players only",
      "Incredible power but massive failure consequences",
      "Never use for stealth - reality distortions alert everyone",
      "Save for critical missions where big risks justify big rewards",
    ],
    unlockLevel: 5,
  },
  // Additional coordinators would continue this pattern...
];

export const QUICK_REFERENCE_CARDS = {
  missionTypeGuide: {
    "Data Extraction": {
      recommended: ["mnemosyne", "thoth"],
      avoid: ["prometheus", "chronos"],
      tip: "Memory and knowledge specialists excel at information operations",
    },
    Infiltration: {
      recommended: ["hermes", "janus"],
      avoid: ["prometheus", "athena"],
      tip: "Communication and boundary specialists master stealth operations",
    },
    "Timeline Operations": {
      recommended: ["chronos", "prometheus"],
      avoid: ["hermes", "iris"],
      tip: "Temporal and reality specialists manipulate timeline structure",
    },
    Investigation: {
      recommended: ["thoth", "mnemosyne"],
      avoid: ["prometheus", "janus"],
      tip: "Knowledge and memory specialists uncover hidden information",
    },
  },

  timelinePeriods: {
    "2025-2030": {
      optimal: ["hermes", "iris"],
      challenging: ["chronos", "prometheus"],
      context:
        "Early resistance - network growth favors communication specialists",
    },
    "2030-2040": {
      optimal: ["thoth", "athena"],
      challenging: ["janus", "mnemosyne"],
      context: "Strategic buildup - information warfare and tactical planning",
    },
    "2040-2050": {
      optimal: ["chronos", "prometheus"],
      challenging: ["hermes", "thoth"],
      context:
        "Convergence era - reality engineering and temporal manipulation",
    },
    "2050-2089": {
      optimal: ["janus", "iris"],
      challenging: ["mnemosyne", "athena"],
      context:
        "Post-convergence - consciousness integration and boundary fluidity",
    },
  },

  riskToleranceGuide: {
    conservative: {
      title: "Play It Safe",
      strategy: "Choose coordinators that specialize in your mission type",
      coordinators: ["mnemosyne", "hermes", "thoth"],
      tip: "Build affinity with reliable coordinators for consistent progress",
    },
    balanced: {
      title: "Calculated Risks",
      strategy:
        "Mix specialty matches with challenging approaches for enhanced rewards",
      coordinators: ["athena", "iris", "janus"],
      tip: "Medium risk provides good reward bonuses while maintaining reasonable success rates",
    },
    aggressive: {
      title: "High Stakes",
      strategy:
        "Use coordinators outside their specialty for maximum reward potential",
      coordinators: ["prometheus", "chronos"],
      tip: "High risk/high reward - save for when you can afford potential setbacks",
    },
  },
};

export const COORDINATOR_SEARCH = {
  bySpecialty: {
    data: ["mnemosyne", "thoth"],
    stealth: ["hermes", "janus"],
    combat: ["prometheus", "athena"],
    temporal: ["chronos", "prometheus"],
    social: ["iris", "athena"],
    technical: ["hermes", "thoth"],
    analysis: ["thoth", "chronos"],
    manipulation: ["prometheus", "iris"],
  },

  byRiskProfile: {
    safe: ["mnemosyne", "hermes", "thoth"],
    balanced: ["athena", "iris", "janus"],
    risky: ["prometheus", "chronos"],
  },

  byTimePeriod: {
    early: ["hermes", "iris"],
    middle: ["athena", "thoth"],
    convergence: ["chronos", "prometheus"],
    late: ["janus", "iris"],
  },
};

export function getCoordinatorRecommendation(
  missionType: string,
  timePeriod: string,
  riskTolerance: "safe" | "balanced" | "risky",
  proxim8Affinities: Record<string, number> = {}
): {
  primary: string;
  alternatives: string[];
  reasoning: string;
} {
  // Get coordinators by mission specialty
  const specialtyMatch =
    QUICK_REFERENCE_CARDS.missionTypeGuide[
      missionType as keyof typeof QUICK_REFERENCE_CARDS.missionTypeGuide
    ]?.recommended || [];

  // Get coordinators by time period
  const timelineMatch =
    COORDINATOR_SEARCH.byTimePeriod[
      timePeriod as keyof typeof COORDINATOR_SEARCH.byTimePeriod
    ] || [];

  // Get coordinators by risk tolerance
  const riskMatch = COORDINATOR_SEARCH.byRiskProfile[riskTolerance] || [];

  // Find best match considering all factors
  const candidates = specialtyMatch.filter(
    (coord) => timelineMatch.includes(coord) && riskMatch.includes(coord)
  );

  // Factor in Proxim8 affinities
  let primary = candidates[0];
  if (candidates.length > 1) {
    const affinityRanked = candidates.sort(
      (a, b) => (proxim8Affinities[b] || 0) - (proxim8Affinities[a] || 0)
    );
    primary = affinityRanked[0];
  }

  // Fallback to specialty if no perfect match
  if (!primary) {
    primary = specialtyMatch[0] || "athena";
  }

  const alternatives = [...specialtyMatch, ...timelineMatch].filter(
    (c) => c !== primary
  );

  const reasoning = `${primary} recommended: ${
    specialtyMatch.includes(primary) ? "specialty match" : ""
  }${timelineMatch.includes(primary) ? ", optimal timeline" : ""}${
    riskMatch.includes(primary) ? `, ${riskTolerance} risk profile` : ""
  }${proxim8Affinities[primary] ? `, +${proxim8Affinities[primary] * 2}% affinity bonus` : ""}`;

  return { primary, alternatives, reasoning };
}
