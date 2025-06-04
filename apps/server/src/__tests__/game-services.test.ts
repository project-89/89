import { describe, expect, test } from '@jest/globals';
import { TRAINING_MISSIONS } from '../data/trainingMissions';
import {
  AIService,
  GameAgentService,
  MissionService,
  ScheduledService,
} from '../services/game';

describe('Game Services', () => {
  test('should export all required services', () => {
    expect(MissionService).toBeDefined();
    expect(GameAgentService).toBeDefined();
    expect(AIService).toBeDefined();
    expect(ScheduledService).toBeDefined();
  });

  test('should have training mission data', () => {
    expect(TRAINING_MISSIONS).toBeDefined();
    expect(TRAINING_MISSIONS.length).toBeGreaterThan(0);
    expect(TRAINING_MISSIONS[0]).toHaveProperty('missionId');
    expect(TRAINING_MISSIONS[0]).toHaveProperty('title');
    expect(TRAINING_MISSIONS[0]).toHaveProperty('phases');
  });

  test('MissionService should have required static methods', () => {
    expect(typeof MissionService.calculateCompatibility).toBe('function');
    expect(typeof MissionService.deployTrainingMission).toBe('function');
    expect(typeof MissionService.completeMission).toBe('function');
    expect(typeof MissionService.getMissionProgress).toBe('function');
  });

  test('GameAgentService should have required static methods', () => {
    expect(typeof GameAgentService.createGameAgent).toBe('function');
    expect(typeof GameAgentService.getOrCreateGameAgent).toBe('function');
    expect(typeof GameAgentService.addProxim8).toBe('function');
    expect(typeof GameAgentService.calculateRank).toBe('function');
  });

  test('AIService should have required static methods', () => {
    expect(typeof AIService.generatePhaseNarrative).toBe('function');
    expect(typeof AIService.generateMissionBriefing).toBe('function');
    expect(typeof AIService.generateMissionSummary).toBe('function');
    expect(typeof AIService.healthCheck).toBe('function');
  });

  test('ScheduledService should have required static methods', () => {
    expect(typeof ScheduledService.completeExpiredMissions).toBe('function');
    expect(typeof ScheduledService.updateMissionPhases).toBe('function');
    expect(typeof ScheduledService.runAllScheduledTasks).toBe('function');
    expect(typeof ScheduledService.healthCheck).toBe('function');
  });

  test('should calculate agent ranks correctly', () => {
    expect(GameAgentService.calculateRank(0)).toBe('OBSERVER');
    expect(GameAgentService.calculateRank(50)).toBe('OBSERVER');
    expect(GameAgentService.calculateRank(100)).toBe('FIELD_AGENT');
    expect(GameAgentService.calculateRank(500)).toBe('SENIOR_AGENT');
    expect(GameAgentService.calculateRank(1000)).toBe('ARCHITECT');
  });
});
