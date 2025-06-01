// @ts-nocheck

import { TimelineEvent, GlobalTimelineState, Mission } from "../../models/game";
import { logger } from "../../utils/logger";

export class TimelineService {
  /**
   * Get available timeline events for a specific date range
   */
  static async getAvailableEvents(
    startDate: Date,
    endDate: Date,
    agentId?: string
  ) {
    try {
      const query: any = {
        date: { $gte: startDate, $lte: endDate },
      };

      // Get global state to check prerequisites
      const globalState = await GlobalTimelineState.getInstance();

      // Filter by global Green Loom requirement
      if (globalState.globalGreenLoomProbability) {
        query.$or = [
          { requiredGreenLoomProbability: { $exists: false } },
          {
            requiredGreenLoomProbability: {
              $lte: globalState.globalGreenLoomProbability,
            },
          },
        ];
      }

      // Filter by lock date
      query.$and = [
        {
          $or: [
            { lockedUntil: { $exists: false } },
            { lockedUntil: { $lte: new Date() } },
          ],
        },
      ];

      const events = await TimelineEvent.find(query).sort({ date: 1 }).lean();

      // If agentId provided, check which events have active missions
      if (agentId) {
        const activeMissions = await Mission.find({
          agentId,
          status: { $in: ["preparing", "active"] },
        }).select("timelineEventId");

        const activeMissionEventIds = activeMissions.map(
          (m) => m.timelineEventId
        );

        return events.map((event) => ({
          ...event,
          hasActiveMission: activeMissionEventIds.includes(event.eventId),
        }));
      }

      return events;
    } catch (error) {
      logger.error("Error getting available events:", error);
      throw error;
    }
  }

  /**
   * Get a specific timeline event with enriched data
   */
  static async getEventDetails(eventId: string, agentId?: string) {
    try {
      const event = await TimelineEvent.findOne({ eventId }).lean();
      if (!event) {
        throw new Error("Timeline event not found");
      }

      // Get intervention statistics
      const missions = await Mission.find({
        timelineEventId: eventId,
        status: "completed",
      }).select("approach result.success");

      const approachStats = {
        sabotage: { attempts: 0, successes: 0 },
        expose: { attempts: 0, successes: 0 },
        organize: { attempts: 0, successes: 0 },
      };

      missions.forEach((mission) => {
        const approach = mission.approach as "sabotage" | "expose" | "organize";
        approachStats[approach].attempts++;
        if (mission.result?.success) {
          approachStats[approach].successes++;
        }
      });

      // Check if agent has mission on this event
      let agentMission = null;
      if (agentId) {
        agentMission = await Mission.findOne({
          agentId,
          timelineEventId: eventId,
          status: { $in: ["preparing", "active", "completed"] },
        }).select("status approach deployedAt completesAt");
      }

      return {
        ...event,
        statistics: {
          totalInterventions: event.totalInterventions,
          successRate:
            event.totalInterventions > 0
              ? Math.round(
                  (event.successfulInterventions / event.totalInterventions) *
                    100
                )
              : 0,
          approachStats,
        },
        agentMission,
      };
    } catch (error) {
      logger.error("Error getting event details:", error);
      throw error;
    }
  }

  /**
   * Update timeline probabilities after a mission
   */
  static async updateTimelineProbabilities(
    eventId: string,
    probabilityShift: number,
    success: boolean
  ) {
    try {
      const event = await TimelineEvent.findOne({ eventId });
      if (!event) {
        throw new Error("Timeline event not found");
      }

      // Update event probabilities
      event.greenLoomProbability = Math.min(
        100,
        Math.max(
          0,
          event.greenLoomProbability + (success ? probabilityShift : 0)
        )
      );
      event.oneirocomProbability = 100 - event.greenLoomProbability;

      // Update intervention counts
      event.totalInterventions++;
      if (success) {
        event.successfulInterventions++;
      }
      event.lastInterventionAt = new Date();

      // Update canonical status
      await event.updateCanonicalStatus();

      // Process cascade effects if successful
      if (success && event.cascadeEffects.length > 0) {
        await this.processCascadeEffects(event.cascadeEffects);
      }

      // Update global timeline state
      const globalState = await GlobalTimelineState.getInstance();
      await globalState.recalculateProbabilities();

      return event;
    } catch (error) {
      logger.error("Error updating timeline probabilities:", error);
      throw error;
    }
  }

  /**
   * Process cascade effects from successful missions
   */
  static async processCascadeEffects(cascadeEffects: any[]) {
    try {
      for (const cascade of cascadeEffects) {
        const affectedEvent = await TimelineEvent.findOne({
          eventId: cascade.affectedEventId,
        });

        if (!affectedEvent) continue;

        switch (cascade.effectType) {
          case "difficulty":
            affectedEvent.baseDifficulty = Math.max(
              1,
              Math.min(
                10,
                affectedEvent.baseDifficulty + cascade.effectMagnitude
              )
            );
            break;

          case "probability":
            affectedEvent.greenLoomProbability = Math.min(
              100,
              Math.max(
                0,
                affectedEvent.greenLoomProbability + cascade.effectMagnitude
              )
            );
            affectedEvent.oneirocomProbability =
              100 - affectedEvent.greenLoomProbability;
            break;

          case "unlock":
            // Remove lock if it exists
            affectedEvent.lockedUntil = undefined;
            break;

          case "lock":
            // Lock for specified days
            const lockDays = cascade.effectMagnitude;
            affectedEvent.lockedUntil = new Date(
              Date.now() + lockDays * 24 * 60 * 60 * 1000
            );
            break;
        }

        await affectedEvent.save();

        // Add to global state active cascades
        const globalState = await GlobalTimelineState.getInstance();
        globalState.activeCascades.push({
          sourceEventId: cascade.affectedEventId,
          cascadeType: cascade.effectType,
          affectedEvents: [cascade.affectedEventId],
          magnitude: cascade.effectMagnitude,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        });
        await globalState.save();
      }
    } catch (error) {
      logger.error("Error processing cascade effects:", error);
      throw error;
    }
  }

  /**
   * Get timeline visualization data
   */
  static async getTimelineVisualization(startYear = 2025, endYear = 2089) {
    try {
      const events = await TimelineEvent.find({
        year: { $gte: startYear, $lte: endYear },
      })
        .select(
          "eventId date year title threatLevel canonicalStatus greenLoomProbability oneirocomProbability isConvergenceEvent"
        )
        .sort({ date: 1 })
        .lean();

      // Group by year for visualization
      const eventsByYear: Record<number, any[]> = {};
      events.forEach((event) => {
        if (!eventsByYear[event.year]) {
          eventsByYear[event.year] = [];
        }
        eventsByYear[event.year].push(event);
      });

      // Get global state for overall probabilities
      const globalState = await GlobalTimelineState.getInstance();

      return {
        globalProbabilities: {
          greenLoom: globalState.globalGreenLoomProbability,
          oneirocom: globalState.globalOneirocomProbability,
        },
        periodProbabilities: globalState.periodProbabilities,
        eventsByYear,
        totalEvents: events.length,
        convergenceEvents: events.filter((e) => e.isConvergenceEvent),
        momentum: globalState.momentum,
      };
    } catch (error) {
      logger.error("Error getting timeline visualization:", error);
      throw error;
    }
  }

  /**
   * Check and update convergence event participation
   */
  static async updateConvergenceParticipation(
    eventId: string,
    agentId: string
  ) {
    try {
      const event = await TimelineEvent.findOne({
        eventId,
        isConvergenceEvent: true,
      });
      if (!event) {
        throw new Error("Convergence event not found");
      }

      // Update global state convergence tracking
      const globalState = await GlobalTimelineState.getInstance();
      const convergenceEvent = globalState.convergenceEvents.find(
        (ce) => ce.eventId === eventId
      );

      if (convergenceEvent) {
        convergenceEvent.currentParticipants++;

        // Check if threshold reached
        if (
          convergenceEvent.currentParticipants >=
          convergenceEvent.requiredAgents
        ) {
          convergenceEvent.status = "active";
        }

        await globalState.save();
      }

      return convergenceEvent;
    } catch (error) {
      logger.error("Error updating convergence participation:", error);
      throw error;
    }
  }
}
