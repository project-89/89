# Mission Dashboard Implementation Plan

## Overview
Transform the current modal-based mission system into a full-page dashboard experience that's mobile-first and provides room for expansion into complex multi-agent missions.

## Design Principles
1. **Mobile-First**: Design for mobile screens, enhance for desktop
2. **State-Driven**: UI adapts based on mission phase
3. **Reuse Components**: Leverage existing modal components
4. **Progressive Disclosure**: Show information as needed
5. **Immersive Experience**: Maintain the tactical ops feel

## Architecture

### Route Structure
```
/training/missions/[missionId]/
├── page.tsx                 # Main mission dashboard
├── loading.tsx              # Loading state
└── error.tsx               # Error boundary
```

### Mission Phases
1. **Available** - Mission can be started
2. **Planning** - Selecting approach and agents
3. **Deploying** - Animation phase (~1 min)
4. **In-Progress** - Real-time mission execution
5. **Completed** - Success/failure with rewards

### Component Structure
```
MissionDashboard/
├── MissionHeader.tsx        # Fixed header with status
├── MissionHero.tsx         # Adaptive hero section
├── MissionContent.tsx      # Main content container
│   ├── BriefingPanel.tsx  # Left panel content
│   ├── ActionPanel.tsx    # Center dynamic content
│   └── IntelPanel.tsx     # Right panel content
├── MissionActionBar.tsx    # Sticky bottom actions
└── MobileNavigation.tsx    # Mobile-specific nav
```

## Mobile-First Layout

### Mobile View (< 768px)
```
┌─────────────────────┐
│   Mission Header    │ <- Collapsible
├─────────────────────┤
│    Mission Hero     │ <- Swipeable
├─────────────────────┤
│   Tab Navigation    │ <- Sticky
├─────────────────────┤
│   Active Content    │ <- Scrollable
│   (Single Panel)    │
├─────────────────────┤
│   Action Bar        │ <- Fixed bottom
└─────────────────────┘
```

### Tablet View (768px - 1024px)
```
┌─────────────────────────────┐
│      Mission Header         │
├─────────────────────────────┤
│       Mission Hero          │
├──────────────┬──────────────┤
│   Briefing   │   Action     │
│    Panel     │    Panel     │
├──────────────┴──────────────┤
│         Action Bar          │
└─────────────────────────────┘
```

### Desktop View (> 1024px)
```
┌─────────────────────────────────────────┐
│            Mission Header               │
├─────────────────────────────────────────┤
│             Mission Hero                │
├───────────┬─────────────┬───────────────┤
│ Briefing  │   Action    │    Intel      │
│  Panel    │   Panel     │    Panel      │
├───────────┴─────────────┴───────────────┤
│            Action Bar                   │
└─────────────────────────────────────────┘
```

## Implementation Phases

### Phase 1: Foundation (Tonight)
- [x] Create execution plan
- [ ] Set up route structure
- [ ] Create base layout components
- [ ] Implement responsive grid system

### Phase 2: Core Components
- [ ] Build MissionHeader with status system
- [ ] Create adaptive MissionHero
- [ ] Implement panel components
- [ ] Add mobile navigation

### Phase 3: State Management
- [ ] Create mission state hook
- [ ] Implement phase transitions
- [ ] Add loading/error states
- [ ] Connect to existing APIs

### Phase 4: Content Integration
- [ ] Migrate modal components
- [ ] Adapt for new layout
- [ ] Implement mobile gestures
- [ ] Add animations

### Phase 5: Polish & Optimization
- [ ] Performance optimization
- [ ] Accessibility improvements
- [ ] Error handling
- [ ] Testing

## Technical Decisions

### Styling Approach
- Use Tailwind CSS for consistency
- CSS Grid for main layout
- Flexbox for component layouts
- CSS animations for transitions

### State Management
```typescript
interface MissionDashboardState {
  phase: MissionPhase;
  selections: {
    approach?: Approach;
    agents: string[];
  };
  deployment?: DeploymentData;
  report?: MissionReport;
}
```

### Mobile Interactions
- Swipe between panels on mobile
- Pull-to-refresh for status updates
- Bottom sheet for detailed views
- Haptic feedback for actions

### Performance Considerations
- Lazy load heavy components
- Virtualize long lists
- Optimistic UI updates
- Progressive image loading

## API Integration Points
1. Mission data fetching
2. Real-time status updates (polling/websocket)
3. Agent selection validation
4. Deployment triggering
5. Reward claiming

## Accessibility Features
- Keyboard navigation
- Screen reader support
- Focus management
- ARIA labels
- High contrast mode support

## Future Expansion Support
- Multi-agent slots ready
- Team composition UI
- Resource management area
- Social features placeholder
- Advanced mission types

## Success Metrics
- Mobile load time < 3s
- Smooth transitions (60fps)
- Intuitive navigation
- Clear state indicators
- Responsive on all devices