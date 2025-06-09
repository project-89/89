// Training missions introducing the coordinator system

export const COORDINATOR_TRAINING_MISSIONS = {
  training_002: {
    id: "training_002",
    missionName: "First Contact: The Coordinators",
    category: "coordinator_introduction",
    description:
      "Your first briefing reveals the true nature of the resistance's coordination network. Meet the eight AI coordinators who guide our operations across the timeline.",
    location: "Resistance Safe House Alpha-7",
    year: "2027",

    briefing: `**CLASSIFIED: COORDINATOR NETWORK BRIEFING**

Agent, you've proven yourself capable in basic operations. It's time you learned the truth about how the resistance coordinates across the timeline.

We don't operate alone. Eight powerful AI coordinators guide our efforts, each specializing in different aspects of the war against Oneirocom. Today, you'll meet them and learn how they can enhance your missions.

**Your Mission**: Establish communication protocols with three coordinators and understand their specialties.

**Learning Objectives**:
- Meet Chronos, Mnemosyne, and Hermes
- Understand coordinator specialties and preferences  
- Learn how coordinator choice affects mission outcomes
- Practice risk assessment for different approaches`,

    phases: [
      {
        name: "Initial Contact",
        description:
          "Establish secure communication with the coordinator network",
        learningPoint:
          "The coordinators are always present, analyzing probability fields and temporal patterns.",
      },
      {
        name: "Chronos Introduction",
        description: "Interface with the Temporal Analysis Coordinator",
        learningPoint:
          "Chronos sees time as a web of interconnected possibilities. Perfect for timeline missions.",
      },
      {
        name: "Mnemosyne Introduction",
        description: "Connect with the Memory Integration Coordinator",
        learningPoint:
          "Mnemosyne preserves knowledge and excels at data extraction operations.",
      },
      {
        name: "Hermes Introduction",
        description: "Link with the Communication Systems Coordinator",
        learningPoint:
          "Hermes masters networks and infiltration. Ideal for stealth operations.",
      },
      {
        name: "Integration Complete",
        description:
          "Successfully establish working relationship with all three coordinators",
        learningPoint:
          "You can now choose which coordinator to align with for each mission.",
      },
    ],

    narrativeOptions: {
      coordinatorVoices: {
        chronos:
          "Time streams converge around this node. I sense... potential in multiple probability branches. Your choices will echo across the timeline, Agent.",
        mnemosyne:
          "Welcome, consciousness bearer. I have preserved the memories of those who came before. Their experiences will guide your path through the data streams.",
        hermes:
          "Greetings, message carrier. The networks pulse with information. I can teach you to move through them like thought through neural pathways.",
      },
    },

    completionReward: {
      unlocks: "Coordinator selection in future missions",
      experience: 100,
      loreFragment: "coordinator_network_origins",
      title: "Coordinator Initiate",
    },
  },

  training_003: {
    id: "training_003",
    missionName: "Risk and Reward: Coordinator Strategies",
    category: "coordinator_selection",
    description:
      "Practice choosing coordinators for different mission types. Learn how coordinator alignment affects success rates and rewards.",
    location: "Training Simulation Chamber",
    year: "2027",

    briefing: `**COORDINATOR SELECTION TRAINING**

Now that you've met three coordinators, it's time to understand strategy. Each coordinator offers different risk/reward profiles depending on the mission type.

**Simulation Parameters**:
- Mission Type: Data Extraction from Oneirocom Archive
- Timeline: 2041 (Convergence Era)
- Available Coordinators: Chronos, Mnemosyne, Hermes

**Learning Objectives**:
- Understand coordinator specialties vs. mission requirements
- Learn about risk levels (Low/Medium/High) 
- Practice reading coordinator recommendations
- See how temporal context affects coordinator effectiveness`,

    coordinatorOptions: [
      {
        coordinator: "mnemosyne",
        riskLevel: "low",
        successRate: 75,
        rewardMultiplier: 1.0,
        explanation:
          "Memory Integration specialist - PERFECT for data extraction. Optimal alignment with mission parameters.",
        temporalContext:
          "2041 is within Mnemosyne's strong period (2035-2045). Memory systems are vulnerable.",
      },
      {
        coordinator: "hermes",
        riskLevel: "medium",
        successRate: 60,
        rewardMultiplier: 1.2,
        explanation:
          "Communication Systems expert - CHALLENGING approach. Network skills help but not specialized for data work.",
        temporalContext:
          "2041 is past Hermes' optimal period. Advanced AI systems resist network infiltration.",
      },
      {
        coordinator: "chronos",
        riskLevel: "high",
        successRate: 40,
        rewardMultiplier: 1.5,
        explanation:
          "Temporal Analysis master - HIGH RISK gambit. Timeline manipulation powerful but wrong tool for data extraction.",
        temporalContext:
          "2041 is perfect for Chronos (Convergence era) but temporal powers don't help with archives.",
      },
    ],

    phases: [
      {
        name: "Mission Analysis",
        description:
          "Study the data extraction parameters and coordinator options",
        learningPoint:
          "Always consider: What does this mission require? Which coordinator specializes in those skills?",
      },
      {
        name: "Risk Assessment",
        description:
          "Evaluate risk/reward profiles for each coordinator choice",
        learningPoint:
          "🟢 Low risk = reliable progress. 🔴 High risk = big rewards but potential setbacks.",
      },
      {
        name: "Temporal Context",
        description:
          "Factor in timeline era effects on coordinator effectiveness",
        learningPoint:
          "Same coordinator performs differently in different eras. Check temporal preferences!",
      },
      {
        name: "Strategic Decision",
        description: "Make your coordinator choice and see the consequences",
        learningPoint:
          "No choice is 'wrong' - each offers different strategic value depending on your goals.",
      },
      {
        name: "Results Analysis",
        description:
          "Review mission outcome and learn from coordinator performance",
        learningPoint:
          "Success or failure, every mission teaches you more about coordinator capabilities.",
      },
    ],

    teachingMoments: {
      lowRiskChoice:
        "Smart choice! Mnemosyne's specialty alignment gave you high success probability. Perfect for learning or when you need reliable results.",
      mediumRiskChoice:
        "Interesting gamble! Hermes offered enhanced rewards for moderate risk. Good for balanced progression when you can afford some uncertainty.",
      highRiskChoice:
        "Bold strategy! Chronos was a massive gamble - high rewards if successful, but significant failure risk. Reserve this for when you can afford the potential setback.",
    },

    completionReward: {
      unlocks: "Advanced coordinator selection tips",
      experience: 150,
      loreFragment: "coordinator_risk_analysis",
      title: "Strategic Thinker",
    },
  },

  training_004: {
    id: "training_004",
    missionName: "Building Bonds: Proxim8 Coordinator Affinity",
    category: "affinity_system",
    description:
      "Learn how Proxim8s develop relationships with coordinators through repeated missions. Experience the benefits of specialization.",
    location: "Advanced Training Facility",
    year: "2027",

    briefing: `**PROXIM8-COORDINATOR AFFINITY TRAINING**

Your Proxim8 learns from every mission. Working with the same coordinator repeatedly builds experience and trust, improving success rates over time.

**Training Scenario**: 
Your Proxim8 has completed 3 previous missions with Mnemosyne, developing a +6% affinity bonus. Now you must choose coordinators for a series of missions and see how relationships affect performance.

**Learning Objectives**:
- Understand the affinity bonus system (+2% per successful mission, max 10%)
- See how specialization creates powerful agents
- Learn to balance building relationships vs. exploring new coordinators
- Practice long-term Proxim8 development strategy`,

    affinityScenario: {
      startingAffinities: {
        mnemosyne: 3, // +6% bonus
        hermes: 1, // +2% bonus
        chronos: 0, // No bonus
      },

      missionSequence: [
        {
          type: "data_extraction",
          coordinatorChoice: "player_selects",
          outcomes: {
            mnemosyne:
              "Building on existing 6% affinity bonus for reliable 81% success rate",
            hermes:
              "Using small 2% affinity bonus for challenging 62% success rate",
            chronos:
              "No affinity bonus - risky 40% success rate but +1 affinity if successful",
          },
        },
        {
          type: "infiltration",
          coordinatorChoice: "player_selects",
          outcomes: {
            hermes:
              "Perfect specialty match! 77% base + 2% affinity = 79% success",
            mnemosyne:
              "Wrong specialty, but 6% affinity helps achieve 66% success",
            chronos: "Terrible match AND no affinity = 35% success rate",
          },
        },
      ],
    },

    phases: [
      {
        name: "Affinity Assessment",
        description: "Review your Proxim8's existing coordinator relationships",
        learningPoint:
          "Every successful mission grants +2% future success rate with that coordinator (max 10%)",
      },
      {
        name: "Specialization Strategy",
        description:
          "Choose whether to deepen existing relationships or explore new ones",
        learningPoint:
          "Specialists excel at their coordinator's missions. Generalists adapt to any situation.",
      },
      {
        name: "Mission Series A",
        description:
          "Deploy for data extraction - see how affinity affects performance",
        learningPoint:
          "Established relationships provide reliable bonuses. New relationships require investment.",
      },
      {
        name: "Mission Series B",
        description:
          "Deploy for infiltration - compare specialist vs. generalist approaches",
        learningPoint:
          "Sometimes a strong affinity bonus overcomes poor specialty match!",
      },
      {
        name: "Development Review",
        description:
          "Analyze how your choices shaped your Proxim8's coordinator relationships",
        learningPoint:
          "Strategic affinity building creates powerful specialists. Balanced growth maintains flexibility.",
      },
    ],

    strategicLessons: {
      specialization:
        "Deep coordinator relationships create reliable, powerful agents for specific mission types",
      diversification:
        "Broad coordinator experience allows adaptation to any mission but without mastery bonuses",
      hybridApproach:
        "Smart players develop multiple agents with different specializations",
      longTermPlanning:
        "Consider your timeline exploration goals when building coordinator affinities",
    },

    completionReward: {
      unlocks: "Coordinator affinity tracking in mission selection UI",
      experience: 200,
      loreFragment: "proxim8_coordinator_bonding",
      title: "Relationship Builder",
    },
  },
};

export const COORDINATOR_POPUP_CONTENT = {
  firstTimeSelection: {
    title: "Choose Your Coordinator",
    content: `You're about to select which AI coordinator will guide this mission. This choice determines:

🎯 **Success Probability**: Each coordinator has different specialties
⚡ **Risk Level**: From reliable low-risk to high-reward gambles  
💰 **Reward Multiplier**: Higher risk often means bigger rewards
🤖 **Coordinator Technology**: Unique tools and approaches per coordinator

Take your time and consider the mission requirements, timeline era, and your Proxim8's experience.`,
    actionText: "Choose Coordinator",
  },

  riskLevelExplanation: {
    title: "Risk Levels Explained",
    content: `**🟢 Low Risk (75% success, 1.0x rewards)**
Coordinator specialty perfectly matches mission requirements. Reliable choice for steady progression.

**🟡 Medium Risk (60% success, 1.2x rewards)**  
Challenging but feasible approach. Good balance of risk and reward for experienced agents.

**🔴 High Risk (40% success, 1.5x rewards)**
Coordinator working outside their specialty. High potential rewards but significant failure risk.`,
    actionText: "Understand Risks",
  },

  affinityBonus: {
    title: "Coordinator Affinity Bonus",
    content: `Your Proxim8 has worked with this coordinator before!

**Experience Bonus**: +{bonus}% success rate
**Missions Completed**: {count} successful operations
**Relationship Level**: {level}

Proxim8s gain +2% success rate for each successful mission with a coordinator (maximum +10%). Building relationships creates powerful specialist agents.`,
    actionText: "Use Experience",
  },

  temporalContext: {
    title: "Timeline Era Effects",
    content: `**Mission Year**: {year}
**Coordinator Status**: {status}

Some coordinators perform better in certain historical periods:
• **Optimal Periods**: Enhanced effectiveness and bonus modifiers
• **Challenging Periods**: Reduced effectiveness due to temporal constraints
• **Neutral Periods**: Standard performance

Check coordinator temporal preferences when planning timeline missions.`,
    actionText: "Consider Timeline",
  },
};

export function generateCoordinatorTutorialContent(step: string): any {
  const tutorials = {
    introduction: {
      title: "Meet the Coordinators",
      steps: [
        "Eight AI coordinators guide resistance operations",
        "Each specializes in different mission types",
        "Choose coordinators based on mission requirements",
        "Build relationships through repeated collaboration",
      ],
    },

    selection: {
      title: "How to Choose",
      steps: [
        "Analyze mission type and requirements",
        "Consider timeline era and temporal preferences",
        "Assess your risk tolerance and goals",
        "Check your Proxim8's coordinator experience",
        "Deploy with chosen coordinator's specialized technology",
      ],
    },

    affinity: {
      title: "Building Relationships",
      steps: [
        "Successful missions grant +2% affinity bonus",
        "Maximum +10% bonus per coordinator",
        "Specialists excel at their coordinator's missions",
        "Generalists adapt but lack mastery bonuses",
        "Plan long-term agent development strategy",
      ],
    },
  };

  return tutorials[step as keyof typeof tutorials] || null;
}
