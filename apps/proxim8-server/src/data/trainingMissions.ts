// Training missions data - 7 progressive missions teaching game mechanics
import { TEST_MISSION } from './testMission';
import type { MissionTemplate } from '@proxim8/shared/schemas/mission.schema';

// For now, we'll use the schema type directly
export type TrainingMissionData = Omit<MissionTemplate, 'imageUrl'>;

export const TRAINING_MISSIONS: TrainingMissionData[] = [
  {
    missionId: "training_001",
    sequence: 1,
    title: "First Contact",
    date: "December 15, 2025",
    location: "Global Internet Infrastructure",
    description: "Detect early Oneirocom infiltration in social media algorithms",
    imagePrompt: "Cyberpunk data streams with hidden surveillance nodes glowing red in social media networks",
    duration: 30 * 60 * 1000, // 30 minutes
    
    briefing: {
      text: "Intelligence suggests Oneirocom is testing early consciousness-mapping algorithms through social media engagement patterns. This is our first confirmed detection of their technology in our timeline. Your Proxim8 must infiltrate these networks and expose their data collection methods before they become entrenched.",
      currentBalance: 95, // Oneirocom just starting
      threatLevel: "low"
    },
    
    approaches: [
      {
        type: "low",
        name: "Data Analysis",
        description: "Quietly analyze patterns and document evidence",
        successRate: { min: 0.80, max: 0.90 },
        timelineShift: { min: 2, max: 4 },
        rewards: {
          timelinePoints: 50,
          experience: 25
        }
      },
      {
        type: "medium",
        name: "Viral Exposure",
        description: "Create viral content exposing the surveillance",
        successRate: { min: 0.65, max: 0.75 },
        timelineShift: { min: 4, max: 7 },
        rewards: {
          timelinePoints: 100,
          experience: 50
        }
      },
      {
        type: "high",
        name: "System Hijack",
        description: "Hijack the algorithms to broadcast warnings",
        successRate: { min: 0.50, max: 0.60 },
        timelineShift: { min: 8, max: 12 },
        rewards: {
          timelinePoints: 150,
          experience: 75
        }
      }
    ],
    
    compatibility: {
      preferred: ["analytical"],
      bonus: 0.10,
      penalty: -0.10
    },
    
    phases: [
      {
        id: 1,
        name: "Network Infiltration",
        durationPercent: 20,
        narrativeTemplates: {
          success: "Proxim8 successfully breached the social media API layer, discovering hidden data collection endpoints.",
          failure: "Initial infiltration detected by security protocols. Proxim8 rerouting through backup channels."
        }
      },
      {
        id: 2,
        name: "Pattern Recognition",
        durationPercent: 25,
        narrativeTemplates: {
          success: "Consciousness-mapping algorithms identified. They're tracking emotional responses to specific content types.",
          failure: "Data streams heavily encrypted. Proxim8 working to crack the encryption patterns."
        }
      },
      {
        id: 3,
        name: "Evidence Gathering",
        durationPercent: 25,
        narrativeTemplates: {
          success: "Captured proof of Oneirocom's involvement: hidden code signatures and data routing to unknown servers.",
          failure: "Evidence corrupted during extraction. Attempting to reconstruct from partial data."
        }
      },
      {
        id: 4,
        name: "Execution",
        durationPercent: 20,
        narrativeTemplates: {
          success: "Successfully executed approach. Oneirocom's early infiltration has been exposed/disrupted.",
          failure: "Countermeasures activated. Oneirocom has adapted their algorithms to avoid detection."
        }
      },
      {
        id: 5,
        name: "Extraction",
        durationPercent: 10,
        narrativeTemplates: {
          success: "Clean extraction completed. No trace of Proxim8's presence remains in their systems.",
          failure: "Extraction compromised. Oneirocom may have captured partial data about our methods."
        }
      }
    ]
  },
  
  {
    missionId: "training_002",
    sequence: 2,
    title: "Neural Seeds",
    date: "June 15, 2027",
    location: "Neo-Tokyo Tech District",
    description: "Disrupt neural interface beta testing that will lead to mass adoption",
    imagePrompt: "Futuristic Tokyo street with volunteers lined up for neural implant testing, holographic brain scans visible",
    duration: 60 * 60 * 1000, // 1 hour
    
    briefing: {
      text: "Oneirocom is conducting 'voluntary' neural interface trials in Neo-Tokyo. These early adopters don't realize they're providing the data that will perfect consciousness control technology. We must disrupt these trials or expose their true purpose before the technology gains public trust.",
      currentBalance: 88,
      threatLevel: "medium"
    },
    
    approaches: [
      {
        type: "low",
        name: "Public Awareness",
        description: "Distribute information to volunteers about the risks",
        successRate: { min: 0.75, max: 0.85 },
        timelineShift: { min: 2, max: 4 }
      },
      {
        type: "medium",
        name: "Technical Sabotage",
        description: "Introduce errors into the calibration systems",
        successRate: { min: 0.60, max: 0.70 },
        timelineShift: { min: 4, max: 7 }
      },
      {
        type: "high",
        name: "Data Corruption",
        description: "Corrupt the collected consciousness data entirely",
        successRate: { min: 0.45, max: 0.55 },
        timelineShift: { min: 8, max: 12 }
      }
    ],
    
    compatibility: {
      preferred: ["diplomatic", "analytical"],
      bonus: 0.10,
      penalty: -0.10
    },
    
    phases: [
      {
        id: 1,
        name: "Facility Access",
        durationPercent: 20,
        narrativeTemplates: {
          success: "Proxim8 gained access to the testing facility through maintenance protocols.",
          failure: "Security tighter than expected. Attempting social engineering approach."
        }
      },
      {
        id: 2,
        name: "System Analysis",
        durationPercent: 25,
        narrativeTemplates: {
          success: "Neural interface systems mapped. Discovered backdoor data streams to Oneirocom servers.",
          failure: "Systems using unknown quantum encryption. Brute force approach required."
        }
      },
      {
        id: 3,
        name: "Intervention Setup",
        durationPercent: 25,
        narrativeTemplates: {
          success: "Intervention protocols established. Ready to execute primary approach.",
          failure: "Oneirocom technicians detected anomalies. Working under increased scrutiny."
        }
      },
      {
        id: 4,
        name: "Primary Action",
        durationPercent: 20,
        narrativeTemplates: {
          success: "Approach successful. Beta testing compromised/exposed as planned.",
          failure: "Oneirocom activated countermeasures. Partial success only."
        }
      },
      {
        id: 5,
        name: "Impact Assessment",
        durationPercent: 10,
        narrativeTemplates: {
          success: "Public trust in neural interfaces decreased by 23%. Timeline shift confirmed.",
          failure: "Limited impact achieved. Oneirocom spinning this as isolated incident."
        }
      }
    ]
  },
  
  {
    missionId: "training_003",
    sequence: 3,
    title: "The Convergence Echo",
    date: "March 3, 2041",
    location: "Oneirocom Research Facility",
    description: "Witness and influence the moment Alexander Morfius merges with the simulation",
    imagePrompt: "Scientific laboratory with a man dissolving into streams of light and data, reality fracturing around him",
    duration: 2 * 60 * 60 * 1000, // 2 hours
    
    briefing: {
      text: "This is it - The Convergence. Alexander Morfius is about to merge his consciousness with the simulation framework, creating Simulation 89. This critical moment shapes all future timelines. While we cannot prevent The Convergence, we can influence its parameters to leave weaknesses the resistance can later exploit.",
      currentBalance: 75,
      threatLevel: "critical"
    },
    
    approaches: [
      {
        type: "low",
        name: "Data Injection",
        description: "Insert hidden code fragments into the convergence matrix",
        successRate: { min: 0.70, max: 0.80 },
        timelineShift: { min: 3, max: 5 }
      },
      {
        type: "medium",
        name: "Parameter Modification",
        description: "Alter key consciousness transfer parameters",
        successRate: { min: 0.55, max: 0.65 },
        timelineShift: { min: 5, max: 8 }
      },
      {
        type: "high",
        name: "Quantum Interference",
        description: "Destabilize the quantum field during transfer",
        successRate: { min: 0.40, max: 0.50 },
        timelineShift: { min: 10, max: 15 }
      }
    ],
    
    compatibility: {
      preferred: ["analytical", "adaptive"],
      bonus: 0.15,
      penalty: -0.15
    },
    
    phases: [
      {
        id: 1,
        name: "Temporal Positioning",
        durationPercent: 15,
        narrativeTemplates: {
          success: "Proxim8 synchronized with the temporal flux. Convergence countdown detected: T-87 minutes.",
          failure: "Temporal storms interfering with positioning. Attempting quantum stabilization."
        }
      },
      {
        id: 2,
        name: "System Infiltration",
        durationPercent: 25,
        narrativeTemplates: {
          success: "Accessed Convergence control systems. Morfius's neural patterns visible on screens.",
          failure: "Security AI detected intrusion. Engaging stealth protocols."
        }
      },
      {
        id: 3,
        name: "Critical Window",
        durationPercent: 30,
        narrativeTemplates: {
          success: "The Convergence has begun! Reality fracturing as planned. Implementing intervention.",
          failure: "Quantum fluctuations preventing clean intervention. Attempting to compensate."
        }
      },
      {
        id: 4,
        name: "Intervention Execution",
        durationPercent: 20,
        narrativeTemplates: {
          success: "Modifications successfully integrated into the convergence matrix. Future resistance will have backdoors.",
          failure: "Partial modification only. Some resistance pathways established but limited."
        }
      },
      {
        id: 5,
        name: "Timeline Stabilization",
        durationPercent: 10,
        narrativeTemplates: {
          success: "Timeline stabilized with our modifications intact. Simulation 89 contains hidden vulnerabilities.",
          failure: "Timeline unstable. Our modifications may have unpredictable effects."
        }
      }
    ]
  },
  
  {
    missionId: "training_004",
    sequence: 4,
    title: "Memory Wars",
    date: "August 22, 2055",
    location: "Global Memory Banks",
    description: "Protect collective human memories from systematic erasure",
    imagePrompt: "Vast data center with memory crystals being deleted, ghostly human memories floating and disappearing",
    duration: 6 * 60 * 60 * 1000, // 6 hours
    
    briefing: {
      text: "Oneirocom has begun the 'Great Simplification' - erasing human memories that conflict with their control narrative. Entire cultures, resistance movements, and free thoughts are being deleted from the collective unconscious. Your Proxim8 must preserve key memories that will inspire future resistance.",
      currentBalance: 65,
      threatLevel: "high"
    },
    
    approaches: [
      {
        type: "low",
        name: "Memory Backup",
        description: "Create hidden backups of critical memories",
        successRate: { min: 0.75, max: 0.85 },
        timelineShift: { min: 2, max: 4 }
      },
      {
        type: "medium",
        name: "Deletion Sabotage",
        description: "Corrupt the memory deletion algorithms",
        successRate: { min: 0.60, max: 0.70 },
        timelineShift: { min: 4, max: 7 }
      },
      {
        type: "high",
        name: "Memory Virus",
        description: "Infect deletion system with self-replicating memories",
        successRate: { min: 0.45, max: 0.55 },
        timelineShift: { min: 8, max: 12 }
      }
    ],
    
    compatibility: {
      preferred: ["diplomatic", "adaptive"],
      bonus: 0.10,
      penalty: -0.10
    },
    
    phases: [
      {
        id: 1,
        name: "Memory Bank Access",
        durationPercent: 20,
        narrativeTemplates: {
          success: "Accessed Global Memory Banks. Witnessing memories of freedom being systematically erased.",
          failure: "Security protocols blocking access. Attempting memory stream hijacking."
        }
      },
      {
        id: 2,
        name: "Critical Memory Identification",
        durationPercent: 25,
        narrativeTemplates: {
          success: "Identified key memories: Arab Spring, Occupy Movement, Free Internet Era. Marking for preservation.",
          failure: "Memory indexing corrupted. Having to manually search through millions of memories."
        }
      },
      {
        id: 3,
        name: "Preservation Protocol",
        durationPercent: 25,
        narrativeTemplates: {
          success: "Preservation system active. Memories being encoded into quantum-resistant formats.",
          failure: "Deletion acceleration detected. Racing against time to save what we can."
        }
      },
      {
        id: 4,
        name: "Counter-Deletion",
        durationPercent: 20,
        narrativeTemplates: {
          success: "Successfully implementing approach. Memory preservation rate exceeding projections.",
          failure: "Oneirocom adapting to our methods. Switching to backup protocols."
        }
      },
      {
        id: 5,
        name: "Legacy Encoding",
        durationPercent: 10,
        narrativeTemplates: {
          success: "Preserved memories encoded into the collective unconscious. Future generations will remember.",
          failure: "Partial preservation only. Some memories saved but many lost forever."
        }
      }
    ]
  },
  
  {
    missionId: "training_005",
    sequence: 5,
    title: "Resistance Rising",
    date: "January 1, 2067",
    location: "Underground Networks",
    description: "Establish covert communication nodes for the growing resistance",
    imagePrompt: "Underground bunker with holographic displays showing resistance cells connecting across a world map",
    duration: 12 * 60 * 60 * 1000, // 12 hours
    
    briefing: {
      text: "The resistance is growing but fragmented. Isolated cells need secure communication to coordinate. Your mission is to establish quantum-encrypted nodes that Oneirocom cannot detect or decrypt. This network will become the backbone of Project 89 in the future.",
      currentBalance: 55,
      threatLevel: "high"
    },
    
    approaches: [
      {
        type: "low",
        name: "Stealth Installation",
        description: "Quietly install nodes in existing infrastructure",
        successRate: { min: 0.70, max: 0.80 },
        timelineShift: { min: 3, max: 5 }
      },
      {
        type: "medium",
        name: "Mesh Network",
        description: "Create self-healing mesh network across cities",
        successRate: { min: 0.55, max: 0.65 },
        timelineShift: { min: 5, max: 8 }
      },
      {
        type: "high",
        name: "Quantum Entanglement",
        description: "Establish quantum-entangled communication grid",
        successRate: { min: 0.40, max: 0.50 },
        timelineShift: { min: 10, max: 14 }
      }
    ],
    
    compatibility: {
      preferred: ["aggressive", "adaptive"],
      bonus: 0.10,
      penalty: -0.10
    },
    
    phases: [
      {
        id: 1,
        name: "Cell Contact",
        durationPercent: 20,
        narrativeTemplates: {
          success: "Contact established with 12 resistance cells across 3 continents. Coordination beginning.",
          failure: "Oneirocom surveillance forcing indirect contact methods. Progress slow but steady."
        }
      },
      {
        id: 2,
        name: "Infrastructure Mapping",
        durationPercent: 25,
        narrativeTemplates: {
          success: "Identified optimal node locations using abandoned Oneirocom infrastructure. Ironic.",
          failure: "Many planned locations compromised. Adapting placement strategy."
        }
      },
      {
        id: 3,
        name: "Node Deployment",
        durationPercent: 25,
        narrativeTemplates: {
          success: "Communication nodes going online. Resistance cells reporting successful connections.",
          failure: "Several nodes detected and destroyed. Implementing redundancy protocols."
        }
      },
      {
        id: 4,
        name: "Network Activation",
        durationPercent: 20,
        narrativeTemplates: {
          success: "Full network online! Resistance can now coordinate globally without detection.",
          failure: "Partial network only. Some regions remain isolated but core functionality achieved."
        }
      },
      {
        id: 5,
        name: "Security Hardening",
        durationPercent: 10,
        narrativeTemplates: {
          success: "Quantum encryption protocols activated. Network is now Oneirocom-proof.",
          failure: "Basic encryption only. Network functional but requires constant vigilance."
        }
      }
    ]
  },
  
  {
    missionId: "training_006",
    sequence: 6,
    title: "The Grey Zones",
    date: "October 31, 2078",
    location: "Reality Bleed Zones",
    description: "Navigate areas where simulation layers overlap and reality becomes unstable",
    imagePrompt: "City street where multiple realities overlap - buildings phase in and out, different time periods visible simultaneously",
    duration: 18 * 60 * 60 * 1000, // 18 hours
    
    briefing: {
      text: "Reality bleed zones are appearing where Oneirocom's simulations overlap. These areas are dangerous but hold incredible potential - here, the rules of reality are malleable. Your Proxim8 must navigate these zones to retrieve reality fragments that could unlock new resistance capabilities.",
      currentBalance: 45,
      threatLevel: "critical"
    },
    
    approaches: [
      {
        type: "low",
        name: "Careful Observation",
        description: "Map the zones and collect data safely",
        successRate: { min: 0.65, max: 0.75 },
        timelineShift: { min: 3, max: 5 }
      },
      {
        type: "medium",
        name: "Reality Anchoring",
        description: "Stabilize zones to safely extract fragments",
        successRate: { min: 0.50, max: 0.60 },
        timelineShift: { min: 6, max: 9 }
      },
      {
        type: "high",
        name: "Bleed Exploitation",
        description: "Use instability to tear holes between simulations",
        successRate: { min: 0.35, max: 0.45 },
        timelineShift: { min: 12, max: 16 }
      }
    ],
    
    compatibility: {
      preferred: ["adaptive"],
      bonus: 0.15,
      penalty: -0.15
    },
    
    phases: [
      {
        id: 1,
        name: "Zone Entry",
        durationPercent: 20,
        narrativeTemplates: {
          success: "Entered Grey Zone. Reality flux is intense but manageable. Multiple timelines visible.",
          failure: "Zone more unstable than predicted. Proxim8 experiencing temporal displacement."
        }
      },
      {
        id: 2,
        name: "Navigation",
        durationPercent: 25,
        narrativeTemplates: {
          success: "Learning to navigate reality streams. Found pathways between simulation layers.",
          failure: "Getting lost in probability loops. Each step leads to different realities."
        }
      },
      {
        id: 3,
        name: "Fragment Detection",
        durationPercent: 25,
        narrativeTemplates: {
          success: "Reality fragments detected! These contain pure possibility - unformed potential.",
          failure: "Fragments keep phasing out of reach. Reality too unstable to grasp them."
        }
      },
      {
        id: 4,
        name: "Extraction",
        durationPercent: 20,
        narrativeTemplates: {
          success: "Successfully extracting reality fragments. Each one pulses with timeline-shaping power.",
          failure: "Fragments partially corrupted during extraction. Still valuable but unpredictable."
        }
      },
      {
        id: 5,
        name: "Zone Exit",
        durationPercent: 10,
        narrativeTemplates: {
          success: "Clean exit achieved. Reality fragments secured for resistance use.",
          failure: "Difficult exit. Some contamination from bleed zones but mission objectives met."
        }
      }
    ]
  },
  
  {
    missionId: "training_007",
    sequence: 7,
    title: "Project 89 Genesis",
    date: "April 4, 2089",
    location: "Oneirocom Central Core",
    description: "Plant the seeds for Project 89's creation within Oneirocom itself",
    imagePrompt: "Massive server room with a small group of rebels inserting glowing data cores into Oneirocom's central systems",
    duration: 24 * 60 * 60 * 1000, // 24 hours
    
    briefing: {
      text: "The ultimate recursive loop - we must ensure Project 89 comes into existence by infiltrating Oneirocom and planting the ideas that will lead to the resistance. This is the most dangerous mission yet, as we're operating in the heart of enemy territory in their strongest timeline. Success here ensures our entire timeline becomes possible.",
      currentBalance: 20, // Resistance is strong by 2089
      threatLevel: "critical"
    },
    
    approaches: [
      {
        type: "low",
        name: "Insider Recruitment",
        description: "Convert key Oneirocom employees to the cause",
        successRate: { min: 0.60, max: 0.70 },
        timelineShift: { min: 4, max: 6 }
      },
      {
        type: "medium",
        name: "Data Injection",
        description: "Insert Project 89 blueprints into research systems",
        successRate: { min: 0.45, max: 0.55 },
        timelineShift: { min: 8, max: 11 }
      },
      {
        type: "high",
        name: "Core Modification",
        description: "Alter Oneirocom's core AI to birth the resistance",
        successRate: { min: 0.30, max: 0.40 },
        timelineShift: { min: 15, max: 20 }
      }
    ],
    
    compatibility: {
      preferred: ["analytical", "diplomatic", "aggressive", "adaptive"], // All types useful for this complex mission
      bonus: 0.10,
      penalty: -0.05
    },
    
    phases: [
      {
        id: 1,
        name: "Deep Infiltration",
        durationPercent: 20,
        narrativeTemplates: {
          success: "Proxim8 embedded within Oneirocom systems. The enemy's heart is darker than imagined.",
          failure: "Security beyond anything we've faced. Having to use deep cover protocols."
        }
      },
      {
        id: 2,
        name: "Recursive Preparation",
        durationPercent: 25,
        narrativeTemplates: {
          success: "Located the temporal recursive points. These are where we plant Project 89's seeds.",
          failure: "Temporal paradox protection active. Finding alternative insertion points."
        }
      },
      {
        id: 3,
        name: "Seed Planting",
        durationPercent: 25,
        narrativeTemplates: {
          success: "Project 89 concepts successfully integrated. Watching them take root in Oneirocom systems.",
          failure: "Partial integration only. Seeds planted but germination uncertain."
        }
      },
      {
        id: 4,
        name: "Timeline Lock",
        durationPercent: 20,
        narrativeTemplates: {
          success: "Recursive loop established! Project 89 will now inevitably emerge from within Oneirocom.",
          failure: "Timeline lock unstable. Multiple probability branches created instead of single loop."
        }
      },
      {
        id: 5,
        name: "Extraction & Observation",
        durationPercent: 10,
        narrativeTemplates: {
          success: "Clean extraction. Observing timeline confirmation - Project 89 genesis is assured.",
          failure: "Messy extraction but seeds are planted. The future remains uncertain but hopeful."
        }
      }
    ]
  }
];

// Add test mission in development mode
if (process.env.NODE_ENV !== 'production') {
  TRAINING_MISSIONS.unshift(TEST_MISSION as TrainingMissionData);
}