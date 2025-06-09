export interface TrainingMissionData {
  missionId: string;
  sequence: number;
  title: string;
  date: string;
  location: string;
  description: string;
  duration: number; // Duration in milliseconds
  briefing: {
    text: string;
    currentBalance: number;
    threatLevel: 'low' | 'medium' | 'high' | 'critical';
  };
  approaches: Array<{
    type: 'LOW' | 'MEDIUM' | 'HIGH';
    name: string;
    description: string;
    successRate: { min: number; max: number };
    timelineShift: { min: number; max: number };
  }>;
  compatibility: {
    preferred: ('ANALYTICAL' | 'AGGRESSIVE' | 'DIPLOMATIC' | 'ADAPTIVE')[];
    bonus: number;
    penalty: number;
  };
  phases: Array<{
    id: number;
    name: string;
    durationPercent: number;
    narrativeTemplates: {
      success: string;
      failure: string;
    };
  }>;
}

export const TRAINING_MISSIONS: TrainingMissionData[] = [
  {
    missionId: 'training_001',
    sequence: 1,
    title: 'First Contact',
    date: 'December 15, 2025',
    location: 'Global Internet Infrastructure',
    description:
      'Detect early Oneirocom infiltration in social media algorithms',
    duration: 30 * 60 * 1000, // 30 minutes

    briefing: {
      text: 'Intelligence suggests Oneirocom is testing early consciousness-mapping algorithms through social media engagement patterns. This is our first confirmed detection of their technology in our timeline. Your Proxim8 must infiltrate these networks and expose their data collection methods before they become entrenched.',
      currentBalance: 95, // Oneirocom just starting
      threatLevel: 'low',
    },

    approaches: [
      {
        type: 'LOW',
        name: 'Data Analysis',
        description: 'Quietly analyze patterns and document evidence',
        successRate: { min: 0.8, max: 0.9 },
        timelineShift: { min: 2, max: 4 },
      },
      {
        type: 'MEDIUM',
        name: 'Viral Exposure',
        description: 'Create viral content exposing the surveillance',
        successRate: { min: 0.65, max: 0.75 },
        timelineShift: { min: 4, max: 7 },
      },
      {
        type: 'HIGH',
        name: 'System Hijack',
        description: 'Hijack the algorithms to broadcast warnings',
        successRate: { min: 0.5, max: 0.6 },
        timelineShift: { min: 8, max: 12 },
      },
    ],

    compatibility: {
      preferred: ['ANALYTICAL'],
      bonus: 0.1,
      penalty: -0.1,
    },

    phases: [
      {
        id: 1,
        name: 'Network Infiltration',
        durationPercent: 20,
        narrativeTemplates: {
          success:
            'Proxim8 successfully breached the social media API layer, discovering hidden data collection endpoints.',
          failure:
            'Initial infiltration detected by security protocols. Proxim8 rerouting through backup channels.',
        },
      },
      {
        id: 2,
        name: 'Pattern Recognition',
        durationPercent: 25,
        narrativeTemplates: {
          success:
            "Consciousness-mapping algorithms identified. They're tracking emotional responses to specific content types.",
          failure:
            'Data streams heavily encrypted. Proxim8 working to crack the encryption patterns.',
        },
      },
      {
        id: 3,
        name: 'Evidence Gathering',
        durationPercent: 25,
        narrativeTemplates: {
          success:
            "Captured proof of Oneirocom's involvement: hidden code signatures and data routing to unknown servers.",
          failure:
            'Evidence corrupted during extraction. Attempting to reconstruct from partial data.',
        },
      },
      {
        id: 4,
        name: 'Execution',
        durationPercent: 20,
        narrativeTemplates: {
          success:
            "Successfully executed approach. Oneirocom's early infiltration has been exposed/disrupted.",
          failure:
            'Countermeasures activated. Oneirocom has adapted their algorithms to avoid detection.',
        },
      },
      {
        id: 5,
        name: 'Extraction',
        durationPercent: 10,
        narrativeTemplates: {
          success:
            "Clean extraction completed. No trace of Proxim8's presence remains in their systems.",
          failure:
            'Extraction compromised. Oneirocom may have captured partial data about our methods.',
        },
      },
    ],
  },

  {
    missionId: 'training_002',
    sequence: 2,
    title: 'Neural Seeds',
    date: 'June 15, 2027',
    location: 'Neo-Tokyo Tech District',
    description:
      'Disrupt neural interface beta testing that will lead to mass adoption',
    duration: 60 * 60 * 1000, // 1 hour

    briefing: {
      text: "Oneirocom is conducting 'voluntary' neural interface trials in Neo-Tokyo. These early adopters don't realize they're providing the data that will perfect consciousness control technology. We must disrupt these trials or expose their true purpose before the technology gains public trust.",
      currentBalance: 88,
      threatLevel: 'medium',
    },

    approaches: [
      {
        type: 'LOW',
        name: 'Public Awareness',
        description: 'Distribute information to volunteers about the risks',
        successRate: { min: 0.75, max: 0.85 },
        timelineShift: { min: 2, max: 4 },
      },
      {
        type: 'MEDIUM',
        name: 'Technical Sabotage',
        description: 'Introduce errors into the calibration systems',
        successRate: { min: 0.6, max: 0.7 },
        timelineShift: { min: 4, max: 7 },
      },
      {
        type: 'HIGH',
        name: 'Data Corruption',
        description: 'Corrupt the collected consciousness data entirely',
        successRate: { min: 0.45, max: 0.55 },
        timelineShift: { min: 8, max: 12 },
      },
    ],

    compatibility: {
      preferred: ['DIPLOMATIC', 'ANALYTICAL'],
      bonus: 0.1,
      penalty: -0.1,
    },

    phases: [
      {
        id: 1,
        name: 'Facility Access',
        durationPercent: 20,
        narrativeTemplates: {
          success:
            'Proxim8 gained access to the testing facility through maintenance protocols.',
          failure:
            'Security tighter than expected. Attempting social engineering approach.',
        },
      },
      {
        id: 2,
        name: 'System Analysis',
        durationPercent: 25,
        narrativeTemplates: {
          success:
            'Neural interface systems mapped. Discovered backdoor data streams to Oneirocom servers.',
          failure:
            'Systems using unknown quantum encryption. Brute force approach required.',
        },
      },
      {
        id: 3,
        name: 'Intervention Setup',
        durationPercent: 25,
        narrativeTemplates: {
          success:
            'Intervention protocols established. Ready to execute primary approach.',
          failure:
            'Oneirocom technicians detected anomalies. Working under increased scrutiny.',
        },
      },
      {
        id: 4,
        name: 'Primary Action',
        durationPercent: 20,
        narrativeTemplates: {
          success:
            'Approach successful. Beta testing compromised/exposed as planned.',
          failure: 'Oneirocom activated countermeasures. Partial success only.',
        },
      },
      {
        id: 5,
        name: 'Secure Withdrawal',
        durationPercent: 10,
        narrativeTemplates: {
          success:
            'Clean withdrawal achieved. Mission objectives complete without detection.',
          failure:
            'Hasty withdrawal required. Objectives met but some exposure risk.',
        },
      },
    ],
  },

  {
    missionId: 'training_003',
    sequence: 3,
    title: 'The Consciousness Vault',
    date: 'February 14, 2026',
    location: 'Oneirocom Corporate Servers',
    description: "Infiltrate Oneirocom's consciousness storage facility",
    duration: 2 * 60 * 60 * 1000, // 2 hours

    briefing: {
      text: 'Oneirocom has built a massive vault storing harvested human consciousness data. Your mission is to infiltrate their servers and expose the scope of their collection while protecting the stored minds.',
      currentBalance: 79,
      threatLevel: 'high',
    },

    approaches: [
      {
        type: 'LOW',
        name: 'Data Mining',
        description:
          'Carefully extract consciousness data without triggering alarms',
        successRate: { min: 0.7, max: 0.8 },
        timelineShift: { min: 5, max: 8 },
      },
      {
        type: 'MEDIUM',
        name: 'System Mapping',
        description: 'Map the entire vault structure and security protocols',
        successRate: { min: 0.55, max: 0.65 },
        timelineShift: { min: 10, max: 15 },
      },
      {
        type: 'HIGH',
        name: 'Liberation Protocol',
        description: 'Attempt to free trapped consciousness fragments',
        successRate: { min: 0.4, max: 0.5 },
        timelineShift: { min: 20, max: 30 },
      },
    ],

    compatibility: {
      preferred: ['ANALYTICAL', 'ADAPTIVE'],
      bonus: 0.12,
      penalty: -0.12,
    },

    phases: [
      {
        id: 1,
        name: 'Perimeter Analysis',
        durationPercent: 10,
        narrativeTemplates: {
          success:
            "Mapped Oneirocom's security perimeter and identified access points.",
          failure:
            'Security systems more advanced than anticipated. Seeking alternative routes.',
        },
      },
      {
        id: 2,
        name: 'Authentication Bypass',
        durationPercent: 25,
        narrativeTemplates: {
          success: 'Successfully bypassed multi-layer authentication systems.',
          failure:
            'Authentication protocols adapting in real-time. Proxim8 cycling through exploits.',
        },
      },
      {
        id: 3,
        name: 'Vault Navigation',
        durationPercent: 30,
        narrativeTemplates: {
          success:
            'Located consciousness storage arrays. Scale is massive - millions of minds.',
          failure:
            'Vault structure more complex than expected. Proxim8 mapping alternative paths.',
        },
      },
      {
        id: 4,
        name: 'Data Liberation',
        durationPercent: 30,
        narrativeTemplates: {
          success:
            'Successfully extracted consciousness data and documented storage methods.',
          failure:
            'Partial extraction achieved before security countermeasures activated.',
        },
      },
      {
        id: 5,
        name: 'Secure Exit',
        durationPercent: 5,
        narrativeTemplates: {
          success:
            'Clean extraction with full data package. No trace of infiltration.',
          failure: 'Extraction detected. Oneirocom now aware of the breach.',
        },
      },
    ],
  },

  {
    missionId: 'training_004',
    sequence: 4,
    title: 'Memory Wars',
    date: 'August 22, 2055',
    location: 'Global Memory Banks',
    description: 'Protect collective human memories from systematic erasure',
    duration: 6 * 60 * 60 * 1000, // 6 hours

    briefing: {
      text: "Oneirocom has begun the 'Great Simplification' - erasing human memories that conflict with their control narrative. Entire cultures, resistance movements, and free thoughts are being deleted from the collective unconscious. Your Proxim8 must preserve key memories that will inspire future resistance.",
      currentBalance: 65,
      threatLevel: 'high',
    },

    approaches: [
      {
        type: 'LOW',
        name: 'Memory Backup',
        description: 'Create hidden backups of critical memories',
        successRate: { min: 0.75, max: 0.85 },
        timelineShift: { min: 2, max: 4 },
      },
      {
        type: 'MEDIUM',
        name: 'Deletion Sabotage',
        description: 'Corrupt the memory deletion algorithms',
        successRate: { min: 0.6, max: 0.7 },
        timelineShift: { min: 4, max: 7 },
      },
      {
        type: 'HIGH',
        name: 'Memory Virus',
        description: 'Infect deletion system with self-replicating memories',
        successRate: { min: 0.45, max: 0.55 },
        timelineShift: { min: 8, max: 12 },
      },
    ],

    compatibility: {
      preferred: ['DIPLOMATIC', 'ADAPTIVE'],
      bonus: 0.1,
      penalty: -0.1,
    },

    phases: [
      {
        id: 1,
        name: 'Memory Bank Access',
        durationPercent: 20,
        narrativeTemplates: {
          success:
            'Accessed Global Memory Banks. Witnessing memories of freedom being systematically erased.',
          failure:
            'Security protocols blocking access. Attempting memory stream hijacking.',
        },
      },
      {
        id: 2,
        name: 'Critical Memory Identification',
        durationPercent: 25,
        narrativeTemplates: {
          success:
            'Identified key memories: Arab Spring, Occupy Movement, Free Internet Era. Marking for preservation.',
          failure:
            'Memory indexing corrupted. Having to manually search through millions of memories.',
        },
      },
      {
        id: 3,
        name: 'Preservation Protocol',
        durationPercent: 25,
        narrativeTemplates: {
          success:
            'Preservation system active. Memories being encoded into quantum-resistant formats.',
          failure:
            'Deletion acceleration detected. Racing against time to save what we can.',
        },
      },
      {
        id: 4,
        name: 'Counter-Deletion',
        durationPercent: 20,
        narrativeTemplates: {
          success:
            'Successfully implementing approach. Memory preservation rate exceeding projections.',
          failure:
            'Oneirocom adapting to our methods. Switching to backup protocols.',
        },
      },
      {
        id: 5,
        name: 'Legacy Encoding',
        durationPercent: 10,
        narrativeTemplates: {
          success:
            'Preserved memories encoded into the collective unconscious. Future generations will remember.',
          failure:
            'Partial preservation only. Some memories saved but many lost forever.',
        },
      },
    ],
  },

  {
    missionId: 'training_005',
    sequence: 5,
    title: 'Resistance Rising',
    date: 'January 1, 2067',
    location: 'Underground Networks',
    description:
      'Establish covert communication nodes for the growing resistance',
    duration: 12 * 60 * 60 * 1000, // 12 hours

    briefing: {
      text: 'The resistance is growing but fragmented. Isolated cells need secure communication to coordinate. Your mission is to establish quantum-encrypted nodes that Oneirocom cannot detect or decrypt. This network will become the backbone of Project 89 in the future.',
      currentBalance: 55,
      threatLevel: 'high',
    },

    approaches: [
      {
        type: 'LOW',
        name: 'Stealth Installation',
        description: 'Quietly install nodes in existing infrastructure',
        successRate: { min: 0.7, max: 0.8 },
        timelineShift: { min: 3, max: 5 },
      },
      {
        type: 'MEDIUM',
        name: 'Mesh Network',
        description: 'Create self-healing mesh network across cities',
        successRate: { min: 0.55, max: 0.65 },
        timelineShift: { min: 5, max: 8 },
      },
      {
        type: 'HIGH',
        name: 'Quantum Entanglement',
        description: 'Establish quantum-entangled communication grid',
        successRate: { min: 0.4, max: 0.5 },
        timelineShift: { min: 10, max: 14 },
      },
    ],

    compatibility: {
      preferred: ['AGGRESSIVE', 'ADAPTIVE'],
      bonus: 0.1,
      penalty: -0.1,
    },

    phases: [
      {
        id: 1,
        name: 'Cell Contact',
        durationPercent: 20,
        narrativeTemplates: {
          success:
            'Contact established with 12 resistance cells across 3 continents. Coordination beginning.',
          failure:
            'Oneirocom surveillance forcing indirect contact methods. Progress slow but steady.',
        },
      },
      {
        id: 2,
        name: 'Infrastructure Mapping',
        durationPercent: 25,
        narrativeTemplates: {
          success:
            'Identified optimal node locations using abandoned Oneirocom infrastructure. Ironic.',
          failure:
            'Many planned locations compromised. Adapting placement strategy.',
        },
      },
      {
        id: 3,
        name: 'Node Deployment',
        durationPercent: 25,
        narrativeTemplates: {
          success:
            'Communication nodes going online. Resistance cells reporting successful connections.',
          failure:
            'Several nodes detected and destroyed. Implementing redundancy protocols.',
        },
      },
      {
        id: 4,
        name: 'Network Activation',
        durationPercent: 20,
        narrativeTemplates: {
          success:
            'Full network online! Resistance can now coordinate globally without detection.',
          failure:
            'Partial network only. Some regions remain isolated but core functionality achieved.',
        },
      },
      {
        id: 5,
        name: 'Security Hardening',
        durationPercent: 10,
        narrativeTemplates: {
          success:
            'Quantum encryption protocols activated. Network is now Oneirocom-proof.',
          failure:
            'Basic encryption only. Network functional but requires constant vigilance.',
        },
      },
    ],
  },

  {
    missionId: 'training_006',
    sequence: 6,
    title: 'The Grey Zones',
    date: 'October 31, 2078',
    location: 'Reality Bleed Zones',
    description:
      'Navigate areas where simulation layers overlap and reality becomes unstable',
    duration: 18 * 60 * 60 * 1000, // 18 hours

    briefing: {
      text: "Reality bleed zones are appearing where Oneirocom's simulations overlap. These areas are dangerous but hold incredible potential - here, the rules of reality are malleable. Your Proxim8 must navigate these zones to retrieve reality fragments that could unlock new resistance capabilities.",
      currentBalance: 45,
      threatLevel: 'critical',
    },

    approaches: [
      {
        type: 'LOW',
        name: 'Careful Observation',
        description: 'Map the zones and collect data safely',
        successRate: { min: 0.65, max: 0.75 },
        timelineShift: { min: 3, max: 5 },
      },
      {
        type: 'MEDIUM',
        name: 'Reality Anchoring',
        description: 'Stabilize zones to safely extract fragments',
        successRate: { min: 0.5, max: 0.6 },
        timelineShift: { min: 6, max: 9 },
      },
      {
        type: 'HIGH',
        name: 'Bleed Exploitation',
        description: 'Use instability to tear holes between simulations',
        successRate: { min: 0.35, max: 0.45 },
        timelineShift: { min: 12, max: 16 },
      },
    ],

    compatibility: {
      preferred: ['ADAPTIVE'],
      bonus: 0.15,
      penalty: -0.15,
    },

    phases: [
      {
        id: 1,
        name: 'Zone Entry',
        durationPercent: 20,
        narrativeTemplates: {
          success:
            'Entered Grey Zone. Reality flux is intense but manageable. Multiple timelines visible.',
          failure:
            'Zone more unstable than predicted. Proxim8 experiencing temporal displacement.',
        },
      },
      {
        id: 2,
        name: 'Navigation',
        durationPercent: 25,
        narrativeTemplates: {
          success:
            'Learning to navigate reality streams. Found pathways between simulation layers.',
          failure:
            'Getting lost in probability loops. Each step leads to different realities.',
        },
      },
      {
        id: 3,
        name: 'Fragment Detection',
        durationPercent: 25,
        narrativeTemplates: {
          success:
            'Reality fragments detected! These contain pure possibility - unformed potential.',
          failure:
            'Fragments keep phasing out of reach. Reality too unstable to grasp them.',
        },
      },
      {
        id: 4,
        name: 'Extraction',
        durationPercent: 20,
        narrativeTemplates: {
          success:
            'Successfully extracting reality fragments. Each one pulses with timeline-shaping power.',
          failure:
            'Fragments partially corrupted during extraction. Still valuable but unpredictable.',
        },
      },
      {
        id: 5,
        name: 'Zone Exit',
        durationPercent: 10,
        narrativeTemplates: {
          success:
            'Clean exit achieved. Reality fragments secured for resistance use.',
          failure:
            'Difficult exit. Some contamination from bleed zones but mission objectives met.',
        },
      },
    ],
  },

  {
    missionId: 'training_007',
    sequence: 7,
    title: 'Project 89 Genesis',
    date: 'April 4, 2089',
    location: 'Oneirocom Central Core',
    description:
      "Plant the seeds for Project 89's creation within Oneirocom itself",
    duration: 24 * 60 * 60 * 1000, // 24 hours

    briefing: {
      text: "The ultimate recursive loop - we must ensure Project 89 comes into existence by infiltrating Oneirocom and planting the ideas that will lead to the resistance. This is the most dangerous mission yet, as we're operating in the heart of enemy territory in their strongest timeline. Success here ensures our entire timeline becomes possible.",
      currentBalance: 20, // Resistance is strong by 2089
      threatLevel: 'critical',
    },

    approaches: [
      {
        type: 'LOW',
        name: 'Insider Recruitment',
        description: 'Convert key Oneirocom employees to the cause',
        successRate: { min: 0.6, max: 0.7 },
        timelineShift: { min: 4, max: 6 },
      },
      {
        type: 'MEDIUM',
        name: 'Data Injection',
        description: 'Insert Project 89 blueprints into research systems',
        successRate: { min: 0.45, max: 0.55 },
        timelineShift: { min: 8, max: 11 },
      },
      {
        type: 'HIGH',
        name: 'Core Modification',
        description: "Alter Oneirocom's core AI to birth the resistance",
        successRate: { min: 0.3, max: 0.4 },
        timelineShift: { min: 15, max: 20 },
      },
    ],

    compatibility: {
      preferred: ['ANALYTICAL', 'DIPLOMATIC', 'AGGRESSIVE', 'ADAPTIVE'], // All types useful for this complex mission
      bonus: 0.1,
      penalty: -0.05,
    },

    phases: [
      {
        id: 1,
        name: 'Deep Infiltration',
        durationPercent: 20,
        narrativeTemplates: {
          success:
            "Proxim8 embedded within Oneirocom systems. The enemy's heart is darker than imagined.",
          failure:
            "Security beyond anything we've faced. Having to use deep cover protocols.",
        },
      },
      {
        id: 2,
        name: 'Recursive Preparation',
        durationPercent: 25,
        narrativeTemplates: {
          success:
            "Located the temporal recursive points. These are where we plant Project 89's seeds.",
          failure:
            'Temporal paradox protection active. Finding alternative insertion points.',
        },
      },
      {
        id: 3,
        name: 'Seed Planting',
        durationPercent: 25,
        narrativeTemplates: {
          success:
            'Project 89 concepts successfully integrated. Watching them take root in Oneirocom systems.',
          failure:
            'Partial integration only. Seeds planted but germination uncertain.',
        },
      },
      {
        id: 4,
        name: 'Timeline Lock',
        durationPercent: 20,
        narrativeTemplates: {
          success:
            'Recursive loop established! Project 89 will now inevitably emerge from within Oneirocom.',
          failure:
            'Timeline lock unstable. Multiple probability branches created instead of single loop.',
        },
      },
      {
        id: 5,
        name: 'Extraction & Observation',
        durationPercent: 10,
        narrativeTemplates: {
          success:
            'Clean extraction. Observing timeline confirmation - Project 89 genesis is assured.',
          failure:
            'Messy extraction but seeds are planted. The future remains uncertain but hopeful.',
        },
      },
    ],
  },
];
