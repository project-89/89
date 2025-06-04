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
      text: 'Intelligence suggests Oneirocom is testing early consciousness-mapping algorithms through social media engagement patterns. Your Proxim8 must infiltrate these networks and expose their data collection methods.',
      currentBalance: 95,
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
    title: 'The Memory Merchants',
    date: 'January 8, 2026',
    location: 'Neural Marketplace Networks',
    description: "Disrupt Oneirocom's illegal memory trading operations",
    duration: 60 * 60 * 1000, // 1 hour

    briefing: {
      text: 'Oneirocom has established underground markets trading human memories. Your Proxim8 must infiltrate these networks and shut down their operations before they can weaponize personal experiences.',
      currentBalance: 88,
      threatLevel: 'medium',
    },

    approaches: [
      {
        type: 'LOW',
        name: 'Market Analysis',
        description: 'Gather intelligence on memory trafficking methods',
        successRate: { min: 0.75, max: 0.85 },
        timelineShift: { min: 3, max: 6 },
      },
      {
        type: 'MEDIUM',
        name: 'Buyer Infiltration',
        description: 'Pose as buyers to document the trade network',
        successRate: { min: 0.6, max: 0.7 },
        timelineShift: { min: 6, max: 10 },
      },
      {
        type: 'HIGH',
        name: 'Network Disruption',
        description: 'Directly sabotage the memory extraction infrastructure',
        successRate: { min: 0.45, max: 0.55 },
        timelineShift: { min: 12, max: 18 },
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
        name: 'Market Reconnaissance',
        durationPercent: 15,
        narrativeTemplates: {
          success:
            'Located multiple memory trading nodes across darknet platforms.',
          failure:
            'Initial probes triggered security alerts. Network adapting to surveillance.',
        },
      },
      {
        id: 2,
        name: 'Vendor Mapping',
        durationPercent: 25,
        narrativeTemplates: {
          success:
            'Identified key memory merchants and their extraction methods.',
          failure: 'Vendor identities obscured by advanced encryption layers.',
        },
      },
      {
        id: 3,
        name: 'Transaction Analysis',
        durationPercent: 30,
        narrativeTemplates: {
          success:
            'Documented memory pricing algorithms and victim targeting patterns.',
          failure:
            'Transaction logs corrupted during analysis. Partial data recovered.',
        },
      },
      {
        id: 4,
        name: 'Intervention',
        durationPercent: 25,
        narrativeTemplates: {
          success:
            'Disrupted memory trafficking operations. Several extraction sites disabled.',
          failure:
            'Intervention partially successful. Some networks remain operational.',
        },
      },
      {
        id: 5,
        name: 'Evidence Compilation',
        durationPercent: 5,
        narrativeTemplates: {
          success:
            'Comprehensive evidence package prepared for resistance networks.',
          failure: 'Limited evidence gathered due to operational compromises.',
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
  // TODO: Add remaining missions (training_004 through training_007)
  // Each with increasing complexity: 6hr, 12hr, 18hr, 24hr durations
];
