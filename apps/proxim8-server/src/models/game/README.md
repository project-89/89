# Mission System Architecture

This document describes the refactored mission system that supports both training missions and full timeline exploration missions as outlined in the Game Design MVP.

## Overview

The mission system has been redesigned to be **mission-type agnostic**, supporting:

1. **Training Missions** - Guided tutorial missions (training_001 through training_007)
2. **Timeline Missions** - Open exploration of dates 2025-2089
3. **Critical Missions** - High-stakes timeline junctures  
4. **Event Missions** - Special narrative events

## Core Models

### `MissionDeployment`
The unified deployment model that handles all mission types:

```typescript
interface IMissionDeployment {
  deploymentId: string;
  missionType: 'training' | 'timeline' | 'critical' | 'event';
  missionId: string; // training_001 or timeline_2027_06_15
  agentId: string;
  proxim8Id: string;
  
  // Timeline context for exploration missions
  timelineNode?: {
    year: number;
    month?: number; 
    day?: number;
    isClaimedByUser?: boolean;
    isCriticalJuncture?: boolean;
  };
  
  // Mission execution
  approach: 'aggressive' | 'balanced' | 'cautious' | 'low' | 'medium' | 'high';
  status: 'active' | 'completed' | 'abandoned' | 'interrupted';
  phaseOutcomes: PhaseOutcome[];
  
  // Results and influence
  result?: {
    overallSuccess: boolean;
    finalNarrative: string;
    timelineShift: number;
    influenceType: 'green_loom' | 'grey_loom';
    rewards: MissionRewards;
  };
  
  // Timeline impact tracking
  timelineInfluence?: {
    nodeId: string;
    influencePoints: number;
    influenceType: 'green_loom' | 'grey_loom';
    cascadeEffects: string[];
  };
}
```

### `MissionTemplate` 
Template system for procedural mission generation:

```typescript
interface IMissionTemplate {
  templateId: string;
  missionType: 'training' | 'timeline' | 'critical' | 'event';
  
  // Timeline context for when this template applies
  timeContext?: {
    yearRange: { min: number; max: number };
    era: 'early_resistance' | 'consolidation' | 'grey_zones' | 'convergence';
    historicalContext: string;
  };
  
  // Procedural generation
  briefingTemplate: string; // "In {year}, Oneirocom is installing {threat} in {location}..."
  variables?: {
    locations: string[];
    threats: string[];
    targets: string[];
  };
  
  // Approach configurations
  approaches: {
    aggressive: ApproachConfig;
    balanced: ApproachConfig;
    cautious: ApproachConfig;
  };
  
  // Timeline influence settings
  influenceSettings: {
    baseInfluencePoints: number;
    cascadeRadius: number;
    temporalStability: number;
  };
}
```

## Mission Types

### Training Missions
- **Purpose**: Onboard new agents with guided scenarios
- **Structure**: Sequential missions (training_001 through training_007)
- **Unlocking**: Must complete previous mission to unlock next
- **Replayability**: One completion per mission
- **Influence**: Minimal timeline impact (training scenarios)

### Timeline Missions  
- **Purpose**: Open exploration of historical timeline (2025-2089)
- **Structure**: Procedurally generated based on year/date selected
- **Unlocking**: Open exploration (year 2025+ unlocked based on agent rank)
- **Replayability**: One claim per timeline node per agent
- **Influence**: Direct impact on Green/Grey Loom probability fields

### Critical Missions
- **Purpose**: High-stakes junctures that shape major timeline branches
- **Structure**: Hand-crafted scenarios for key years (2027, 2041, 2055, 2089)
- **Unlocking**: Requires specific prerequisites and agent rank
- **Replayability**: Limited attempts, major consequences
- **Influence**: Massive timeline impact with cascade effects

### Event Missions
- **Purpose**: Special narrative events, community challenges
- **Structure**: Time-limited scenarios tied to real-world events
- **Unlocking**: Available during specific time windows
- **Replayability**: Event-specific rules
- **Influence**: Variable based on event design

## Core Gameplay Loop

Following the Game Design MVP specification:

### 1. CLAIM
```typescript
// Timeline mission selection
GET /api/missions/timeline
// Returns available nodes with influence visualization

// Specific mission claiming  
GET /api/missions/timeline_2027_06_15?type=timeline
// Generates contextual mission for June 15, 2027
```

### 2. BRIEF
Mission briefing shows:
- **Context**: What's happening at this timeline position
- **Threat**: Oneirocom activity or resistance opportunity  
- **Approaches**: Aggressive/Balanced/Cautious with risk/reward profiles
- **Proxim8 Compatibility**: How well each agent matches the mission

### 3. DEPLOY
```typescript
POST /api/missions/timeline_2027_06_15/deploy
{
  "proxim8Id": "proxim8-nft-123",
  "approach": "balanced",
  "missionType": "timeline",
  "timelineNode": {
    "year": 2027,
    "month": 6, 
    "day": 15
  }
}
```

### 4. WAIT
- **24-hour timer** for mission completion (MVP)
- **Real-time phase reveals** based on elapsed time
- **Status updates** showing mission progression
- **Phase 2**: Mid-mission communications and choice points

### 5. RETRIEVE
```typescript
GET /api/missions/deployments/{deploymentId}/status
// Returns completion status and results when timer expires
```

### 6. COLLECT
Mission completion yields:
- **Timeline Points** (primary currency)
- **Green/Grey Loom Influence** (timeline probability shift)
- **Lore Fragments** (collectible narrative pieces)
- **Memory Caches** (media artifacts from the mission)
- **Experience Points** (Proxim8 progression)
- **Phase 2**: NFT artifacts, governance tokens, video generation

## Timeline Influence System

### Influence Calculation
```typescript
interface TimelineInfluence {
  nodeId: string; // "2027_6_15"
  influencePoints: number; // 1-100 based on mission success
  influenceType: 'green_loom' | 'grey_loom';
  cascadeEffects: string[]; // Adjacent nodes affected
}
```

### Green Loom vs Grey Loom
- **Green Loom**: Resistance success, consciousness liberation, timeline shift toward freedom
- **Grey Loom**: Oneirocom consolidation, consciousness control, timeline shift toward tyranny
- **Influence Visualization**: Heat map showing probability fields across timeline
- **Cascade Effects**: Successful missions affect adjacent timeline nodes

### Critical Junctures
Special timeline positions with amplified impact:
- **2027**: Neural seed installation phase
- **2041**: The Convergence (Alexander Morfius merger) 
- **2055**: Memory Wars initiation
- **2089**: Project 89 genesis point

## API Endpoints

### General Mission System
```typescript
// Get all missions (training + timeline)
GET /api/missions?type=training|timeline|all

// Get timeline overview for mission selection
GET /api/missions/timeline?startYear=2025&endYear=2089&granularity=year

// Get specific mission details
GET /api/missions/{missionId}?type=training|timeline

// Deploy any mission type
POST /api/missions/{missionId}/deploy

// Get deployment status  
GET /api/missions/deployments/{deploymentId}/status
```

### Legacy Training Support
```typescript
// Existing training endpoints continue to work
GET /api/training/missions
GET /api/training/missions/{missionId}
POST /api/training/missions/{missionId}/deploy  
GET /api/training/deployments/{deploymentId}/status
```

## Migration Strategy

### Phase 1: Backward Compatibility
- **Legacy training routes** continue to work unchanged
- **New general routes** support both training and timeline missions
- **Gradual migration** of frontend to use new endpoints

### Phase 2: Full Timeline Launch
- **Timeline UI** for date selection and influence visualization
- **Procedural mission generation** for all timeline positions
- **Critical juncture missions** with hand-crafted scenarios

### Phase 3: Advanced Features
- **Mid-mission communications** and choice points
- **Squad missions** with multiple Proxim8s
- **Video generation** for mission highlights
- **Governance integration** for timeline decisions

## Database Migration

To migrate existing training data:

```bash
npm run migrate:missions
```

This script converts `TrainingMissionDeployment` records to the new `MissionDeployment` format while preserving all data and maintaining backward compatibility.

## Development Workflow

### Adding New Mission Templates
1. Create `MissionTemplate` record in database
2. Define timeline context and procedural variables
3. Configure approach-specific narratives and rewards
4. Set influence parameters for timeline impact

### Testing Mission Generation
```typescript
// Generate timeline mission
const mission = await MissionService.generateTimelineMission(2027, 6, 15);

// Test compatibility calculation
const compatibility = MissionService.calculateCompatibility(proxim8, mission);

// Deploy and complete mission
const deployment = await MissionService.deployMission(params);
const completed = await MissionService.completeMission(deployment.deploymentId);
```

### Monitoring Timeline Health
- **Influence balance**: Monitor Green vs Grey Loom distribution
- **Node coverage**: Track percentage of timeline explored
- **Agent progression**: Ensure balanced difficulty progression
- **Narrative coherence**: Validate generated missions make sense

This architecture provides the foundation for the full Project 89 timeline exploration game while maintaining compatibility with existing training missions and supporting future expansion into the complete temporal warfare experience.