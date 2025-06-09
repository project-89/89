import mongoose, { Schema, Document } from "mongoose";

export interface ILoreFragment extends Document {
  // Core identifiers
  fragmentId: string; // Unique identifier
  title: string; // Display title
  category:
    | "corporate"
    | "resistance"
    | "technology"
    | "personal"
    | "historical"
    | "classified";

  // Content
  content: string; // The actual lore text
  contentType:
    | "document"
    | "transcript"
    | "message"
    | "memory"
    | "blueprint"
    | "report";

  // Source and context
  sourceEvent?: string; // Timeline event ID that can generate this
  sourceMission?: string; // Specific mission that discovered this
  author?: string; // In-universe author (e.g., "Dr. Sarah Chen", "Unknown Operative")
  dateInTimeline?: Date; // When this was created in the 2025-2089 timeline

  // Rarity and discovery
  rarity: "common" | "uncommon" | "rare" | "legendary" | "mythic";
  discoveryChance: number; // Base chance to find this (0-100)
  prerequisiteFragments?: string[]; // Other fragments needed to unlock this

  // Metadata for narrative consistency
  tags: string[]; // e.g., ["oneirocom", "neural_interface", "2027"]
  relatedCharacters?: string[]; // Character names mentioned
  relatedEvents?: string[]; // Timeline events referenced
  relatedFragments?: string[]; // Other fragments that connect to this

  // Discovery tracking
  totalDiscoveries: number; // How many agents have found this
  firstDiscoveredBy?: string; // Agent ID who found it first
  firstDiscoveredAt?: Date;

  // Display properties
  imageUrl?: string; // Optional accompanying image
  audioUrl?: string; // Optional audio log
  isRedacted: boolean; // Whether parts are censored
  redactedContent?: string; // Version with [REDACTED] sections

  // Unlock conditions
  unlockRequirements?: {
    minAgentRank?: string;
    minTimelinePoints?: number;
    specificMissionSuccess?: string;
    timelineEventCompleted?: string;
    globalGreenLoomMinimum?: number;
  };

  // Canon status
  canonicalStatus: "canon" | "disputed" | "apocryphal";
  canonicalWeight: number; // How much this affects the overall narrative

  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

const LoreFragmentSchema = new Schema(
  {
    fragmentId: { type: String, required: true, unique: true, index: true },
    title: { type: String, required: true },
    category: {
      type: String,
      enum: [
        "corporate",
        "resistance",
        "technology",
        "personal",
        "historical",
        "classified",
      ],
      required: true,
      index: true,
    },

    content: { type: String, required: true },
    contentType: {
      type: String,
      enum: [
        "document",
        "transcript",
        "message",
        "memory",
        "blueprint",
        "report",
      ],
      required: true,
    },

    sourceEvent: { type: String, index: true },
    sourceMission: { type: String },
    author: { type: String },
    dateInTimeline: { type: Date },

    rarity: {
      type: String,
      enum: ["common", "uncommon", "rare", "legendary", "mythic"],
      required: true,
      index: true,
    },
    discoveryChance: { type: Number, default: 50, min: 0, max: 100 },
    prerequisiteFragments: [{ type: String }],

    tags: [{ type: String, index: true }],
    relatedCharacters: [{ type: String }],
    relatedEvents: [{ type: String }],
    relatedFragments: [{ type: String }],

    totalDiscoveries: { type: Number, default: 0 },
    firstDiscoveredBy: { type: String },
    firstDiscoveredAt: { type: Date },

    imageUrl: { type: String },
    audioUrl: { type: String },
    isRedacted: { type: Boolean, default: false },
    redactedContent: { type: String },

    unlockRequirements: {
      minAgentRank: { type: String },
      minTimelinePoints: { type: Number },
      specificMissionSuccess: { type: String },
      timelineEventCompleted: { type: String },
      globalGreenLoomMinimum: { type: Number },
    },

    canonicalStatus: {
      type: String,
      enum: ["canon", "disputed", "apocryphal"],
      default: "canon",
    },
    canonicalWeight: { type: Number, default: 1, min: 0, max: 10 },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient queries
LoreFragmentSchema.index({ tags: 1 });
LoreFragmentSchema.index({ rarity: 1, discoveryChance: -1 });
LoreFragmentSchema.index({ totalDiscoveries: -1 });

// Method to check if agent can discover this fragment
LoreFragmentSchema.methods.canBeDiscoveredBy = async function (
  agent: any
): Promise<boolean> {
  if (!this.unlockRequirements) return true;

  const reqs = this.unlockRequirements;

  // Check rank requirement
  if (reqs.minAgentRank) {
    const rankHierarchy = [
      "recruit",
      "operative",
      "specialist",
      "commander",
      "legend",
    ];
    const requiredIndex = rankHierarchy.indexOf(reqs.minAgentRank);
    const agentIndex = rankHierarchy.indexOf(agent.rank);
    if (agentIndex < requiredIndex) return false;
  }

  // Check timeline points
  if (reqs.minTimelinePoints && agent.timelinePoints < reqs.minTimelinePoints) {
    return false;
  }

  // Check global Green Loom requirement
  if (reqs.globalGreenLoomMinimum) {
    const GlobalTimelineState = mongoose.model("GlobalTimelineState");
    const globalState = await (GlobalTimelineState as any).getInstance();
    if (globalState.globalGreenLoomProbability < reqs.globalGreenLoomMinimum) {
      return false;
    }
  }

  // Other checks would go here

  return true;
};

// Method to generate redacted version
LoreFragmentSchema.methods.generateRedactedContent = function () {
  if (!this.isRedacted) return this.content;

  // Simple redaction logic - can be made more sophisticated
  const redactionPatterns = [
    /\b(password|code|location|coordinates|name)\s*:\s*[\w\s]+/gi,
    /\b(Project\s+\d+|Operation\s+\w+|Agent\s+\w+)\b/gi,
    /\b\d{4}-\d{2}-\d{2}\b/g, // Dates
  ];

  let redacted = this.content;
  redactionPatterns.forEach((pattern) => {
    redacted = redacted.replace(pattern, "[REDACTED]");
  });

  this.redactedContent = redacted;
  return redacted;
};

// Static method to get random fragment for mission reward
LoreFragmentSchema.statics.getRandomForMission = async function (
  missionSuccess: boolean,
  eventId: string,
  agent: any
): Promise<any> {
  // Build query based on mission outcome
  const query: any = {
    sourceEvent: eventId,
  };

  // Adjust rarity based on success
  if (missionSuccess) {
    query.rarity = { $in: ["common", "uncommon", "rare"] };
  } else {
    query.rarity = { $in: ["common", "uncommon"] };
  }

  // Get all possible fragments
  const fragments = await this.find(query);

  // Filter by unlock requirements
  const availableFragments = [];
  for (const fragment of fragments) {
    if (await fragment.canBeDiscoveredBy(agent)) {
      availableFragments.push(fragment);
    }
  }

  if (availableFragments.length === 0) return null;

  // Weight by discovery chance
  const weighted = availableFragments.flatMap((f) =>
    Array(Math.ceil(f.discoveryChance / 10)).fill(f)
  );

  return weighted[Math.floor(Math.random() * weighted.length)];
};

export default mongoose.model<ILoreFragment>(
  "LoreFragment",
  LoreFragmentSchema
);
