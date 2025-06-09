import mongoose, { Schema, Document } from 'mongoose';

export interface IGlobalTimelineState extends Document {
  // Overall timeline tracking
  currentDate: Date; // Current date in real world
  timelineStartDate: Date; // Start of the timeline (2025)
  timelineEndDate: Date; // End of the timeline (2089)
  
  // Global probability tracking
  globalGreenLoomProbability: number; // Overall Green Loom probability (0-100)
  globalOneirocomProbability: number; // Overall Oneirocom probability (0-100)
  
  // Period-specific probabilities
  periodProbabilities: [{
    periodName: string; // e.g., "Early Period", "Escalation Period"
    startYear: number;
    endYear: number;
    greenLoomProbability: number;
    oneirocomProbability: number;
    totalEvents: number;
    disruptedEvents: number;
    contestedEvents: number;
  }];
  
  // Community statistics
  totalAgents: number; // Total registered agents
  activeAgentsToday: number; // Agents active in last 24h
  activeAgentsWeek: number; // Agents active in last 7 days
  totalMissionsDeployed: number;
  totalMissionsSucceeded: number;
  totalTimelineShifts: number; // Cumulative probability shifts
  
  // Major event tracking
  convergenceEvents: [{
    eventId: string;
    eventName: string;
    targetDate: Date;
    requiredAgents: number;
    currentParticipants: number;
    status: 'upcoming' | 'active' | 'completed' | 'failed';
    outcome?: 'green_loom' | 'oneirocom';
  }];
  
  // Timeline momentum
  momentum: {
    current: number; // -100 to 100 (negative = Oneirocom, positive = Green Loom)
    trend: 'declining' | 'stable' | 'rising'; // Based on recent missions
    lastUpdated: Date;
  };
  
  // Cascade tracking
  activeCascades: [{
    sourceEventId: string;
    cascadeType: string;
    affectedEvents: string[];
    magnitude: number;
    expiresAt: Date;
  }];
  
  // Daily snapshots for trends
  dailySnapshots: [{
    date: Date;
    greenLoomProbability: number;
    missionsCompleted: number;
    activeAgents: number;
    majorEventsOccurred: string[];
  }];
  
  // Leaderboards cache
  topAgents: [{
    agentId: string;
    codename: string;
    timelinePoints: number;
    greenLoomContribution: number;
    rank: string;
  }];
  
  // System status
  maintenanceMode: boolean;
  announcementMessage?: string;
  nextMajorEvent?: {
    eventId: string;
    eventName: string;
    date: Date;
    description: string;
  };
  
  // Metadata
  lastCalculatedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const GlobalTimelineStateSchema = new Schema({
  currentDate: { type: Date, default: Date.now },
  timelineStartDate: { type: Date, default: new Date('2025-01-01') },
  timelineEndDate: { type: Date, default: new Date('2089-12-31') },
  
  globalGreenLoomProbability: { type: Number, default: 15, min: 0, max: 100 },
  globalOneirocomProbability: { type: Number, default: 85, min: 0, max: 100 },
  
  periodProbabilities: [{
    periodName: { type: String, required: true },
    startYear: { type: Number, required: true },
    endYear: { type: Number, required: true },
    greenLoomProbability: { type: Number, required: true, min: 0, max: 100 },
    oneirocomProbability: { type: Number, required: true, min: 0, max: 100 },
    totalEvents: { type: Number, default: 0 },
    disruptedEvents: { type: Number, default: 0 },
    contestedEvents: { type: Number, default: 0 }
  }],
  
  totalAgents: { type: Number, default: 0 },
  activeAgentsToday: { type: Number, default: 0 },
  activeAgentsWeek: { type: Number, default: 0 },
  totalMissionsDeployed: { type: Number, default: 0 },
  totalMissionsSucceeded: { type: Number, default: 0 },
  totalTimelineShifts: { type: Number, default: 0 },
  
  convergenceEvents: [{
    eventId: { type: String, required: true },
    eventName: { type: String, required: true },
    targetDate: { type: Date, required: true },
    requiredAgents: { type: Number, required: true },
    currentParticipants: { type: Number, default: 0 },
    status: { 
      type: String, 
      enum: ['upcoming', 'active', 'completed', 'failed'], 
      default: 'upcoming' 
    },
    outcome: { type: String, enum: ['green_loom', 'oneirocom'] }
  }],
  
  momentum: {
    current: { type: Number, default: 0, min: -100, max: 100 },
    trend: { type: String, enum: ['declining', 'stable', 'rising'], default: 'stable' },
    lastUpdated: { type: Date, default: Date.now }
  },
  
  activeCascades: [{
    sourceEventId: { type: String, required: true },
    cascadeType: { type: String, required: true },
    affectedEvents: [{ type: String }],
    magnitude: { type: Number, required: true },
    expiresAt: { type: Date, required: true }
  }],
  
  dailySnapshots: [{
    date: { type: Date, required: true },
    greenLoomProbability: { type: Number, required: true },
    missionsCompleted: { type: Number, default: 0 },
    activeAgents: { type: Number, default: 0 },
    majorEventsOccurred: [{ type: String }]
  }],
  
  topAgents: [{
    agentId: { type: String, required: true },
    codename: { type: String, required: true },
    timelinePoints: { type: Number, required: true },
    greenLoomContribution: { type: Number, required: true },
    rank: { type: String, required: true }
  }],
  
  maintenanceMode: { type: Boolean, default: false },
  announcementMessage: { type: String },
  nextMajorEvent: {
    eventId: { type: String },
    eventName: { type: String },
    date: { type: Date },
    description: { type: String }
  },
  
  lastCalculatedAt: { type: Date, default: Date.now }
}, {
  timestamps: true
});

// Ensure we only have one global state document
GlobalTimelineStateSchema.index({ _id: 1 });

// Static method to get or create singleton
GlobalTimelineStateSchema.statics.getInstance = async function() {
  let state = await this.findOne();
  if (!state) {
    state = await this.create({
      periodProbabilities: [
        {
          periodName: 'Early Period',
          startYear: 2025,
          endYear: 2035,
          greenLoomProbability: 15,
          oneirocomProbability: 85
        },
        {
          periodName: 'Escalation Period',
          startYear: 2036,
          endYear: 2055,
          greenLoomProbability: 15,
          oneirocomProbability: 85
        },
        {
          periodName: 'Consolidation Period',
          startYear: 2056,
          endYear: 2075,
          greenLoomProbability: 15,
          oneirocomProbability: 85
        },
        {
          periodName: 'Dominance Period',
          startYear: 2076,
          endYear: 2089,
          greenLoomProbability: 15,
          oneirocomProbability: 85
        }
      ]
    });
  }
  return state;
};

// Method to recalculate global probabilities
GlobalTimelineStateSchema.methods.recalculateProbabilities = async function() {
  const TimelineEvent = mongoose.model('TimelineEvent');
  
  // Get all events
  const events = await TimelineEvent.find({});
  
  // Calculate weighted average based on event importance and success
  let totalWeight = 0;
  let weightedGreenLoom = 0;
  
  events.forEach(event => {
    const weight = event.threatLevel === 'critical' ? 3 : 
                   event.threatLevel === 'high' ? 2 : 
                   event.threatLevel === 'moderate' ? 1.5 : 1;
    
    totalWeight += weight;
    weightedGreenLoom += event.greenLoomProbability * weight;
  });
  
  if (totalWeight > 0) {
    this.globalGreenLoomProbability = Math.round(weightedGreenLoom / totalWeight);
    this.globalOneirocomProbability = 100 - this.globalGreenLoomProbability;
  }
  
  // Update period probabilities
  for (const period of this.periodProbabilities) {
    const periodEvents = events.filter(e => {
      const year = new Date(e.date).getFullYear();
      return year >= period.startYear && year <= period.endYear;
    });
    
    if (periodEvents.length > 0) {
      const avgGreenLoom = periodEvents.reduce((sum, e) => sum + e.greenLoomProbability, 0) / periodEvents.length;
      period.greenLoomProbability = Math.round(avgGreenLoom);
      period.oneirocomProbability = 100 - period.greenLoomProbability;
      period.totalEvents = periodEvents.length;
      period.disruptedEvents = periodEvents.filter(e => e.canonicalStatus === 'green_loom').length;
      period.contestedEvents = periodEvents.filter(e => e.canonicalStatus === 'contested').length;
    }
  }
  
  // Update momentum
  const recentMissions = await mongoose.model('Mission').countDocuments({
    completedAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
    'result.success': true
  });
  
  const previousMomentum = this.momentum.current;
  if (recentMissions > 50) {
    this.momentum.current = Math.min(100, this.momentum.current + 5);
    this.momentum.trend = 'rising';
  } else if (recentMissions < 20) {
    this.momentum.current = Math.max(-100, this.momentum.current - 5);
    this.momentum.trend = 'declining';
  } else {
    this.momentum.trend = 'stable';
  }
  
  this.momentum.lastUpdated = new Date();
  this.lastCalculatedAt = new Date();
  
  return this.save();
};

// Method to add daily snapshot
GlobalTimelineStateSchema.methods.createDailySnapshot = async function() {
  const Mission = mongoose.model('Mission');
  const Agent = mongoose.model('Agent');
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const missionsToday = await Mission.countDocuments({
    completedAt: { 
      $gte: today,
      $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
    }
  });
  
  const activeAgentsToday = await Agent.countDocuments({
    lastActiveAt: { $gte: today }
  });
  
  this.dailySnapshots.push({
    date: today,
    greenLoomProbability: this.globalGreenLoomProbability,
    missionsCompleted: missionsToday,
    activeAgents: activeAgentsToday,
    majorEventsOccurred: [] // To be populated by event system
  });
  
  // Keep only last 30 days
  if (this.dailySnapshots.length > 30) {
    this.dailySnapshots = this.dailySnapshots.slice(-30);
  }
  
  return this.save();
};

export default mongoose.model<IGlobalTimelineState>('GlobalTimelineState', GlobalTimelineStateSchema);