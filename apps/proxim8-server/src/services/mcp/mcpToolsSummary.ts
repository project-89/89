import { z } from 'zod';
import { TRAINING_MISSIONS } from '../../data/trainingMissions';
import { logger } from '../../utils/logger';

// Schema for summary list
export const GetMissionsSummarySchema = z.object({
  status: z.enum(['all', 'active', 'completed', 'locked']).optional().default('all'),
  includeStats: z.boolean().optional().default(false),
});

// Schema for single mission detail
export const GetMissionDetailSchema = z.object({
  missionId: z.string().describe("Mission ID to get full details for"),
});

// Summary mission type
export interface MissionSummary {
  missionId: string;
  sequence: number;
  title: string;
  location: string;
  date: string;
  difficulty: number;
  duration: number;
  threatLevel: string;
  status?: string;
  completionRate?: number;
}

// MCP tool implementations for summary views
export const mcpSummaryTools = {
  // Get missions summary - high level view
  async getMissionsSummary({ status, includeStats }: z.infer<typeof GetMissionsSummarySchema>) {
    logger.info("Executing get_missions_summary tool");
    try {
      const missions = TRAINING_MISSIONS;
      
      // Create summaries
      const summaries: MissionSummary[] = missions.map(m => ({
        missionId: m.missionId,
        sequence: m.sequence,
        title: m.title,
        location: m.location,
        date: m.date,
        difficulty: m.difficulty || Math.ceil(m.sequence * 1.5),
        duration: Math.round(m.duration / 1000 / 60), // Convert to minutes
        threatLevel: m.briefing.threatLevel,
        status: m.sequence === 1 ? 'active' : m.sequence <= 3 ? 'unlocked' : 'locked',
      }));

      // Apply status filter
      let filtered = summaries;
      if (status !== 'all') {
        filtered = summaries.filter(m => {
          if (status === 'active') return m.status === 'active';
          if (status === 'completed') return false; // No completions in training data
          if (status === 'locked') return m.status === 'locked';
          return true;
        });
      }

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            total: filtered.length,
            missions: filtered,
            stats: includeStats ? {
              totalMissions: missions.length,
              avgDifficulty: missions.reduce((acc, m) => acc + (m.difficulty || 5), 0) / missions.length,
              totalDuration: missions.reduce((acc, m) => acc + m.duration, 0) / 1000 / 60, // Total minutes
            } : undefined
          }, null, 2)
        }]
      };
    } catch (error) {
      logger.error("Error in getMissionsSummary:", error);
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            error: error instanceof Error ? error.message : "Unknown error occurred"
          }, null, 2)
        }]
      };
    }
  },

  // Get single mission with full details
  async getMissionDetail({ missionId }: z.infer<typeof GetMissionDetailSchema>) {
    logger.info(`Executing get_mission_detail for ${missionId}`);
    try {
      const mission = TRAINING_MISSIONS.find(m => m.missionId === missionId);
      
      if (!mission) {
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              error: `Mission not found: ${missionId}`
            }, null, 2)
          }]
        };
      }

      return {
        content: [{
          type: 'text',
          text: JSON.stringify(mission, null, 2)
        }]
      };
    } catch (error) {
      logger.error("Error in getMissionDetail:", error);
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            error: error instanceof Error ? error.message : "Unknown error occurred"
          }, null, 2)
        }]
      };
    }
  }
};