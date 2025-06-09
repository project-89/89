// Test mission with very short duration for debugging
export const TEST_MISSION = {
  missionId: "training_test",
  sequence: 0,
  title: "Test Mission - 30 Second Duration",
  date: "Test Date",
  location: "Test Environment",
  description: "Test mission for debugging auto-completion",
  imagePrompt: "Test environment with digital elements",
  duration: 30 * 1000, // 30 seconds for quick testing
  
  briefing: {
    text: "This is a test mission that completes in 30 seconds. Use it to verify auto-completion is working correctly.",
    currentBalance: 50,
    threatLevel: "low" as const
  },
  
  approaches: [
    {
      type: "low" as const,
      name: "Test Low",
      description: "Low risk test approach",
      successRate: { min: 0.80, max: 0.90 },
      timelineShift: { min: 1, max: 2 }
    },
    {
      type: "medium" as const,
      name: "Test Medium",
      description: "Medium risk test approach",
      successRate: { min: 0.65, max: 0.75 },
      timelineShift: { min: 2, max: 3 }
    },
    {
      type: "high" as const,
      name: "Test High",
      description: "High risk test approach",
      successRate: { min: 0.50, max: 0.60 },
      timelineShift: { min: 3, max: 4 }
    }
  ],
  
  compatibility: {
    preferred: ["analytical", "adaptive"] as any[],
    bonus: 0.10,
    penalty: -0.10
  },
  
  phases: [
    {
      id: 1,
      name: "Test Phase 1",
      durationPercent: 20,
      narrativeTemplates: {
        success: "Test phase 1 completed successfully.",
        failure: "Test phase 1 failed."
      }
    },
    {
      id: 2,
      name: "Test Phase 2",
      durationPercent: 20,
      narrativeTemplates: {
        success: "Test phase 2 completed successfully.",
        failure: "Test phase 2 failed."
      }
    },
    {
      id: 3,
      name: "Test Phase 3",
      durationPercent: 20,
      narrativeTemplates: {
        success: "Test phase 3 completed successfully.",
        failure: "Test phase 3 failed."
      }
    },
    {
      id: 4,
      name: "Test Phase 4",
      durationPercent: 20,
      narrativeTemplates: {
        success: "Test phase 4 completed successfully.",
        failure: "Test phase 4 failed."
      }
    },
    {
      id: 5,
      name: "Test Phase 5",
      durationPercent: 20,
      narrativeTemplates: {
        success: "Test phase 5 completed successfully.",
        failure: "Test phase 5 failed."
      }
    }
  ]
};