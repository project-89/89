import mongoose, { Schema, Document } from "mongoose";

export interface IMemoryCache extends Document {
  // Core identifiers
  cacheId: string; // Unique identifier
  title: string; // Display title
  type: "image" | "audio" | "video" | "document" | "hologram" | "data_stream";

  // Content
  description: string; // What this memory contains
  mediaUrl?: string; // URL to actual media file (if applicable)
  thumbnailUrl?: string; // Preview image
  transcript?: string; // For audio/video content
  dataContent?: any; // For data streams or complex content

  // Source and context
  sourceEvent?: string; // Timeline event ID
  sourceMission?: string; // Mission that captured this
  capturedBy?: string; // In-universe who captured it (e.g., "Proxim8-7749")
  captureDate?: Date; // When captured in timeline
  location?: string; // Where in the timeline world

  // Rarity and value
  rarity: "common" | "uncommon" | "rare" | "legendary" | "mythic";
  memoryValue: number; // Point value or importance (1-100)

  // Technical properties
  corruptionLevel: number; // 0-100, affects clarity/completeness
  encryptionStatus: "none" | "partial" | "full" | "quantum";
  authenticityVerified: boolean;

  // Narrative connections
  tags: string[]; // e.g., ["oneirocom_facility", "surveillance", "2027"]
  relatedCharacters?: string[];
  relatedEvents?: string[];
  relatedCaches?: string[]; // Other memories that connect
  relatedFragments?: string[]; // Lore fragments referenced

  // Discovery tracking
  totalDiscoveries: number;
  firstDiscoveredBy?: string;
  firstDiscoveredAt?: Date;

  // Special properties
  hiddenContent?: {
    requirement: string; // What's needed to unlock
    unlockedContent: string; // Additional info when unlocked
    isUnlocked: boolean;
  };

  // Effects when collected
  effects?: {
    revealsLocation?: string; // Unlocks new area/event
    unlocksFragment?: string; // Gives access to lore fragment
    providesClue?: string; // Narrative hint
    grantsAbility?: string; // Future: special abilities
  };

  // Canon status
  canonicalStatus: "verified" | "unverified" | "fabricated";
  evidenceWeight: number; // How much this proves/disproves events

  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

const MemoryCacheSchema = new Schema(
  {
    cacheId: { type: String, required: true, unique: true, index: true },
    title: { type: String, required: true },
    type: {
      type: String,
      enum: ["image", "audio", "video", "document", "hologram", "data_stream"],
      required: true,
      index: true,
    },

    description: { type: String, required: true },
    mediaUrl: { type: String },
    thumbnailUrl: { type: String },
    transcript: { type: String },
    dataContent: { type: Schema.Types.Mixed },

    sourceEvent: { type: String, index: true },
    sourceMission: { type: String },
    capturedBy: { type: String },
    captureDate: { type: Date },
    location: { type: String },

    rarity: {
      type: String,
      enum: ["common", "uncommon", "rare", "legendary", "mythic"],
      required: true,
      index: true,
    },
    memoryValue: { type: Number, default: 50, min: 1, max: 100 },

    corruptionLevel: { type: Number, default: 0, min: 0, max: 100 },
    encryptionStatus: {
      type: String,
      enum: ["none", "partial", "full", "quantum"],
      default: "none",
    },
    authenticityVerified: { type: Boolean, default: true },

    tags: [{ type: String, index: true }],
    relatedCharacters: [{ type: String }],
    relatedEvents: [{ type: String }],
    relatedCaches: [{ type: String }],
    relatedFragments: [{ type: String }],

    totalDiscoveries: { type: Number, default: 0 },
    firstDiscoveredBy: { type: String },
    firstDiscoveredAt: { type: Date },

    hiddenContent: {
      requirement: { type: String },
      unlockedContent: { type: String },
      isUnlocked: { type: Boolean, default: false },
    },

    effects: {
      revealsLocation: { type: String },
      unlocksFragment: { type: String },
      providesClue: { type: String },
      grantsAbility: { type: String },
    },

    canonicalStatus: {
      type: String,
      enum: ["verified", "unverified", "fabricated"],
      default: "unverified",
    },
    evidenceWeight: { type: Number, default: 5, min: 0, max: 10 },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient queries
MemoryCacheSchema.index({ tags: 1 });
MemoryCacheSchema.index({ rarity: 1, memoryValue: -1 });
MemoryCacheSchema.index({ sourceEvent: 1, type: 1 });

// Method to apply corruption to content
MemoryCacheSchema.methods.getCorruptedContent = function () {
  if (this.corruptionLevel === 0) return this.description;

  const corruption = this.corruptionLevel / 100;
  const words = this.description.split(" ");

  return words
    .map((word: string) => {
      if (Math.random() < corruption) {
        // Replace with glitch text
        const glitchChars = "█▓▒░╳╱╲┼┤├";
        const glitchLength = Math.floor(Math.random() * word.length) + 1;
        return glitchChars.repeat(glitchLength);
      }
      return word;
    })
    .join(" ");
};

// Method to check if can be decrypted
MemoryCacheSchema.methods.canDecrypt = function (agent: any): boolean {
  switch (this.encryptionStatus) {
    case "none":
      return true;
    case "partial":
      return agent.rank !== "recruit";
    case "full":
      return ["specialist", "commander", "legend"].includes(agent.rank);
    case "quantum":
      return (
        agent.rank === "legend" ||
        agent.achievements.some((a: any) => a.id === "quantum_decoder")
      );
    default:
      return false;
  }
};

// Static method to generate memory cache for mission
MemoryCacheSchema.statics.generateForMission = async function (
  mission: any,
  success: boolean
): Promise<any> {
  const types = ["image", "audio", "video", "document"];
  const selectedType = types[Math.floor(Math.random() * types.length)];

  // Generate based on mission approach and outcome
  const templates = {
    sabotage: {
      success: {
        image: "Security footage of compromised systems",
        audio: "Intercepted Oneirocom emergency communications",
        video: "Surveillance capture of system malfunction",
        document: "System diagnostic report showing anomalies",
      },
      failure: {
        image: "Blurred security photo of detection",
        audio: "Oneirocom security alert broadcast",
        video: "Corrupted footage of failed infiltration",
        document: "Incident report filed by Oneirocom",
      },
    },
    expose: {
      success: {
        image: "Leaked classified documents",
        audio: "Recorded confession from insider",
        video: "Hidden camera footage of illegal activity",
        document: "Internal memo revealing true intentions",
      },
      failure: {
        image: "Redacted document pages",
        audio: "Scrambled transmission attempt",
        video: "Deleted footage recovery attempt",
        document: "Disinformation report",
      },
    },
    organize: {
      success: {
        image: "Resistance gathering documentation",
        audio: "Encrypted resistance communications",
        video: "Underground meeting footage",
        document: "Resistance network protocols",
      },
      failure: {
        image: "Surveillance photo of known operative",
        audio: "Intercepted and decoded messages",
        video: "Raid footage on safe house",
        document: "Oneirocom infiltration report",
      },
    },
  };

  const approach = mission.approach as "sabotage" | "expose" | "organize";
  const outcome = success ? "success" : "failure";
  const description =
    templates[approach][outcome][
      selectedType as keyof (typeof templates)[typeof approach][typeof outcome]
    ];

  const cache = new this({
    cacheId: `cache_${mission.missionId}_${Date.now()}`,
    title: `Mission ${mission.missionId.slice(-6)} Evidence`,
    type: selectedType,
    description,
    sourceEvent: mission.timelineEventId,
    sourceMission: mission.missionId,
    capturedBy: `Proxim8-${mission.proxim8Id.slice(-4)}`,
    captureDate: new Date(mission.deployedAt),
    rarity: success ? (Math.random() > 0.7 ? "rare" : "uncommon") : "common",
    memoryValue: success
      ? Math.floor(Math.random() * 50) + 50
      : Math.floor(Math.random() * 30) + 20,
    corruptionLevel: success
      ? Math.floor(Math.random() * 20)
      : Math.floor(Math.random() * 50) + 20,
    encryptionStatus: Math.random() > 0.8 ? "partial" : "none",
    authenticityVerified: success,
    tags: [
      approach,
      mission.timelineEventId,
      success ? "evidence" : "compromised",
    ],
  });

  return cache;
};

export default mongoose.model<IMemoryCache>("MemoryCache", MemoryCacheSchema);
