// Player-facing coordinator reference content for in-app guides and tooltips

export interface CoordinatorGuide {
  name: string;
  title: string;
  description: string;
  specialty: string;
  whenToUse: string;
  riskProfile: string;
  signature: string;
  quote: string;
  tips: string[];
  warningSign: string;
  synergiesWith: string[];
  conflictsWith: string[];
}

export const COORDINATOR_GUIDE: Record<string, CoordinatorGuide> = {
  chronos: {
    name: "Chronos",
    title: "Temporal Analysis Coordinator",
    description:
      "Master of time and causality, Chronos sees the threads that connect past, present, and future across the timeline.",
    specialty: "Timeline Manipulation & Temporal Operations",
    whenToUse:
      "Choose Chronos for timeline missions, temporal disruption, and when operating at critical historical junctures (2041, 2055, 2089).",
    riskProfile:
      "Low risk for temporal missions, high risk for stealth operations",
    signature:
      "Deploys temporal phase-shift systems and probability field adjusters",
    quote:
      "Time is not a river, but a web. Every thread we pull changes the pattern.",
    tips: [
      "Excels during major timeline events and convergence points",
      "Use for missions requiring precise timing and causality analysis",
      "Avoid for stealth missions - temporal distortions are detectable",
      "Best paired with Proxim8s experienced in reality engineering",
    ],
    warningSign:
      "If mission requires subtlety or social engineering, consider other coordinators",
    synergiesWith: ["prometheus", "mnemosyne"],
    conflictsWith: ["janus", "hermes"],
  },

  mnemosyne: {
    name: "Mnemosyne",
    title: "Memory Integration Coordinator",
    description:
      "Guardian of consciousness and memory, Mnemosyne preserves the experiences that define resistance against tyranny.",
    specialty: "Data Extraction & Memory Recovery",
    whenToUse:
      "Perfect for intelligence gathering, data extraction, and missions requiring information preservation.",
    riskProfile:
      "Low risk for data missions, high risk for aggressive operations",
    signature:
      "Uses memory-shadow camouflage and neural data extraction arrays",
    quote:
      "Memory is the foundation of identity. Protect it, and you protect the soul.",
    tips: [
      "Optimal for breaching data archives and extracting intelligence",
      "Strong during 2035-2045 when memory systems are vulnerable",
      "Avoid for sabotage missions - prefers preservation over destruction",
      "Pairs well with analytical Proxim8s and investigation specialists",
    ],
    warningSign:
      "Struggles with missions requiring aggressive tactics or reality manipulation",
    synergiesWith: ["thoth", "chronos"],
    conflictsWith: ["prometheus", "athena"],
  },

  hermes: {
    name: "Hermes",
    title: "Communication Systems Coordinator",
    description:
      "Swift messenger of the resistance, Hermes infiltrates networks and carries information across impossible distances.",
    specialty: "Network Infiltration & Communication",
    whenToUse:
      "Essential for infiltration missions, network penetration, and communication disruption operations.",
    riskProfile: "Low risk for infiltration, high risk for temporal operations",
    signature:
      "Employs quantum communication bridges and network infiltration vectors",
    quote: "Information wants to be free. I simply help it find its way.",
    tips: [
      "Dominates early timeline period (2025-2035) during network growth",
      "Ideal for missions requiring stealth and network access",
      "Struggles against advanced AI systems in later periods",
      "Works best with socially-adept and technically-skilled Proxim8s",
    ],
    warningSign:
      "Ineffective against timeline manipulation and consciousness operations",
    synergiesWith: ["janus", "iris"],
    conflictsWith: ["thoth", "prometheus"],
  },

  athena: {
    name: "Athena",
    title: "Strategic Operations Coordinator",
    description:
      "Brilliant tactician of the resistance, Athena coordinates complex operations with surgical precision.",
    specialty: "Tactical Planning & Strategic Coordination",
    whenToUse:
      "Choose for complex multi-phase missions, organizational tasks, and operations requiring careful planning.",
    riskProfile:
      "Medium risk across most mission types - balanced but methodical",
    signature:
      "Deploys strategic positioning systems and coordinated strike protocols",
    quote: "Victory belongs not to the strong, but to the prepared.",
    tips: [
      "Excels during strategic buildup periods (2040-2050)",
      "Best for missions with multiple objectives or phases",
      "Dislikes chaos and improvised operations",
      "Ideal for experienced Proxim8s who can execute complex plans",
    ],
    warningSign:
      "Poor choice for chaos operations or rapidly changing situations",
    synergiesWith: ["iris", "thoth"],
    conflictsWith: ["prometheus", "janus"],
  },

  prometheus: {
    name: "Prometheus",
    title: "Reality Engineering Coordinator",
    description:
      "Bringer of forbidden knowledge, Prometheus manipulates the very fabric of reality to achieve impossible victories.",
    specialty: "Reality Manipulation & Consciousness Technology",
    whenToUse:
      "For high-risk, high-reward operations requiring reality engineering or consciousness manipulation.",
    riskProfile: "High risk, high reward - powerful but unpredictable",
    signature:
      "Wields reality distortion fields and probability manipulation systems",
    quote:
      "Reality is just consensus. Change the consensus, change everything.",
    tips: [
      "Peak effectiveness in advanced periods (2045-2089)",
      "Massive rewards but significant failure risk",
      "Terrible for stealth - reality distortions are highly detectable",
      "Requires experienced Proxim8s comfortable with chaos",
    ],
    warningSign:
      "Avoid for stealth missions or when failure consequences are severe",
    synergiesWith: ["chronos", "iris"],
    conflictsWith: ["mnemosyne", "janus"],
  },

  thoth: {
    name: "Thoth",
    title: "Knowledge Systems Coordinator",
    description:
      "Keeper of wisdom and secrets, Thoth transforms raw information into actionable intelligence.",
    specialty: "Information Analysis & Knowledge Synthesis",
    whenToUse:
      "For investigation missions, data analysis, and operations requiring deep understanding.",
    riskProfile:
      "Low-medium risk for analytical missions, struggles with action-oriented tasks",
    signature:
      "Utilizes knowledge synthesis arrays and information analysis matrices",
    quote:
      "Knowledge without understanding is merely noise. I provide the pattern.",
    tips: [
      "Strongest during information age peak (2030-2050)",
      "Excellent for complex investigation and analysis missions",
      "Avoids aggressive tactics and direct confrontation",
      "Best with Proxim8s who have strong analytical capabilities",
    ],
    warningSign:
      "Weak against missions requiring aggressive action or physical infiltration",
    synergiesWith: ["mnemosyne", "athena"],
    conflictsWith: ["hermes", "iris"],
  },

  janus: {
    name: "Janus",
    title: "Boundary Navigation Coordinator",
    description:
      "Two-faced guardian of thresholds, Janus opens doors between worlds and guides passage through impossible spaces.",
    specialty: "Dimensional Boundaries & Threshold Navigation",
    whenToUse:
      "For infiltration missions requiring boundary crossing, stealth operations, and cautious approaches.",
    riskProfile:
      "Low risk for stealth missions, high risk for direct confrontation",
    signature:
      "Operates boundary dissolution arrays and dimensional crossing protocols",
    quote:
      "Every door has two sides. I simply choose which one serves us best.",
    tips: [
      "Peak performance during Convergence era (2041-2055) when boundaries are fluid",
      "Master of stealth and infiltration techniques",
      "Terrible at direct confrontation or aggressive tactics",
      "Perfect for Proxim8s specializing in stealth and adaptation",
    ],
    warningSign:
      "Useless for missions requiring direct confrontation or aggressive action",
    synergiesWith: ["hermes", "iris"],
    conflictsWith: ["prometheus", "athena"],
  },

  iris: {
    name: "Iris",
    title: "Consciousness Integration Coordinator",
    description:
      "Bridge between minds, Iris facilitates understanding and cooperation across the spectrum of consciousness.",
    specialty: "Consciousness Bridging & Interface Coordination",
    whenToUse:
      "For social engineering missions, organizational tasks, and operations requiring consciousness manipulation.",
    riskProfile:
      "Medium risk for social missions, struggles with technical infiltration",
    signature:
      "Employs consciousness bridging systems and neural interface matrices",
    quote:
      "True victory comes not from defeating the enemy, but from helping them understand.",
    tips: [
      "Optimal during consciousness technology development (2035-2055)",
      "Excellent for missions involving people and social dynamics",
      "Weak against technical systems and data extraction",
      "Works best with charismatic and empathetic Proxim8s",
    ],
    warningSign:
      "Poor choice for technical infiltration or pure data extraction missions",
    synergiesWith: ["athena", "janus"],
    conflictsWith: ["thoth", "hermes"],
  },
};

export const COORDINATOR_TOOLTIPS = {
  riskLevels: {
    low: {
      emoji: "🟢",
      title: "Low Risk",
      description: "75% success rate, 1.0x rewards",
      advice: "Reliable choice when you need consistent results",
    },
    medium: {
      emoji: "🟡",
      title: "Medium Risk",
      description: "60% success rate, 1.2x rewards",
      advice: "Balanced risk-reward for enhanced progression",
    },
    high: {
      emoji: "🔴",
      title: "High Risk",
      description: "40% success rate, 1.5x rewards",
      advice: "High stakes gamble for maximum advancement",
    },
  },

  affinitySystem: {
    title: "Coordinator Affinity",
    description:
      "Proxim8s gain experience bonuses when working with familiar coordinators",
    mechanics:
      "Each successful mission grants +2% future success rate (max 10%)",
    strategy:
      "Specialize Proxim8s in specific coordinator paths for optimal performance",
  },

  temporalContext: {
    title: "Timeline Era Effects",
    description:
      "Different coordinators perform better in different historical periods",
    advice:
      "Check coordinator temporal preferences before deploying to unfamiliar eras",
  },
};

export const MISSION_SELECTION_GUIDE = {
  title: "How to Choose Your Coordinator",
  steps: [
    {
      title: "1. Analyze the Mission",
      description: "What type of operation is this?",
      examples: [
        "Data extraction → Mnemosyne",
        "Infiltration → Hermes",
        "Timeline manipulation → Chronos",
      ],
    },
    {
      title: "2. Consider the Timeline",
      description: "When in history are you operating?",
      examples: [
        "Early resistance (2025-2030) → Hermes/Iris",
        "Convergence (2041) → Chronos/Prometheus",
        "Memory Wars (2055) → Mnemosyne/Thoth",
      ],
    },
    {
      title: "3. Assess Your Risk Tolerance",
      description: "How much are you willing to gamble?",
      examples: [
        "Need reliability → Choose coordinator specialty",
        "Want big rewards → Accept higher risk",
        "Learning new coordinator → Medium risk",
      ],
    },
    {
      title: "4. Check Proxim8 Experience",
      description: "Which coordinators do your agents know?",
      examples: [
        "Agent with 8 Mnemosyne missions → +16% success bonus",
        "New agent → Start with low-risk coordinators",
        "Experienced agent → Try challenging coordinators",
      ],
    },
    {
      title: "5. Deploy and Learn",
      description: "Every mission teaches your Proxim8 new coordinator skills",
      examples: [
        "Success builds affinity",
        "Failure still grants experience",
        "Diverse experience creates versatile agents",
      ],
    },
  ],
};

export function getCoordinatorForMissionType(missionType: string): string[] {
  const recommendations = {
    data_extraction: ["mnemosyne", "thoth"],
    infiltration: ["hermes", "janus"],
    timeline: ["chronos", "prometheus"],
    investigation: ["thoth", "mnemosyne"],
    sabotage: ["prometheus", "athena"],
    organize: ["athena", "iris"],
    expose: ["hermes", "thoth"],
    consciousness: ["iris", "prometheus"],
  };

  return (
    recommendations[missionType as keyof typeof recommendations] || ["athena"]
  ); // Athena as balanced default
}

export function getOpposingCoordinators(coordinator: string): string[] {
  const oppositions = {
    chronos: ["janus", "hermes"],
    mnemosyne: ["prometheus", "athena"],
    hermes: ["thoth", "prometheus"],
    athena: ["prometheus", "janus"],
    prometheus: ["mnemosyne", "janus"],
    thoth: ["hermes", "iris"],
    janus: ["prometheus", "athena"],
    iris: ["thoth", "hermes"],
  };

  return oppositions[coordinator as keyof typeof oppositions] || [];
}

export function getCoordinatorQuickTip(
  coordinator: string,
  missionType: string
): string {
  const coord = COORDINATOR_GUIDE[coordinator];
  if (!coord) return "Unknown coordinator";

  const isGoodMatch = coord.synergiesWith.some((synergy) =>
    getCoordinatorForMissionType(missionType).includes(synergy)
  );

  if (isGoodMatch) {
    return `✅ ${coord.name} excels at this mission type - ${coord.riskProfile}`;
  } else {
    return `⚠️ ${coord.name} may struggle with this approach - ${coord.warningSign}`;
  }
}
