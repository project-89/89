import {
  AgentRank,
  GameAgent,
  GameProxim8,
  Proxim8Personality,
} from '../../generated/prisma';
import { prisma } from '../prisma.service';

export interface CreateGameAgentData {
  accountId: string;
  codename?: string;
}

export interface CreateGameProxim8Data {
  gameAgentId: string;
  nftId: string;
  name: string;
  personality: Proxim8Personality;
}

export interface GameAgentStats {
  totalMissions: number;
  completedMissions: number;
  successRate: number;
  totalTimelineShift: number;
  rank: AgentRank;
  nextRankThreshold?: number;
}

export class GameAgentService {
  /**
   * Create a new game agent for an account
   */
  static async createGameAgent(data: CreateGameAgentData): Promise<GameAgent> {
    const existingAgent = await prisma.gameAgent.findUnique({
      where: { accountId: data.accountId },
    });

    if (existingAgent) {
      throw new Error('Game agent already exists for this account');
    }

    return await prisma.gameAgent.create({
      data: {
        accountId: data.accountId,
        codename: data.codename,
        rank: AgentRank.OBSERVER,
        timelinePoints: 0,
      },
    });
  }

  /**
   * Get or create a game agent for an account
   */
  static async getOrCreateGameAgent(accountId: string): Promise<GameAgent> {
    let gameAgent = await prisma.gameAgent.findUnique({
      where: { accountId },
      include: {
        proxim8s: true,
        missionDeployments: {
          orderBy: { deployedAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!gameAgent) {
      // Create new game agent
      const newAgent = await prisma.gameAgent.create({
        data: {
          accountId,
          rank: AgentRank.OBSERVER,
          timelinePoints: 0,
        },
      });

      // Fetch with relations
      gameAgent = await prisma.gameAgent.findUnique({
        where: { id: newAgent.id },
        include: {
          proxim8s: true,
          missionDeployments: {
            orderBy: { deployedAt: 'desc' },
            take: 10,
          },
        },
      });
    }

    return gameAgent!;
  }

  /**
   * Add a Proxim8 to a game agent
   */
  static async addProxim8(data: CreateGameProxim8Data): Promise<GameProxim8> {
    // Check if game agent exists
    const gameAgent = await prisma.gameAgent.findUnique({
      where: { id: data.gameAgentId },
    });

    if (!gameAgent) {
      throw new Error('Game agent not found');
    }

    // Check if Proxim8 already exists for this NFT
    const existingProxim8 = await prisma.gameProxim8.findUnique({
      where: {
        gameAgentId_nftId: {
          gameAgentId: data.gameAgentId,
          nftId: data.nftId,
        },
      },
    });

    if (existingProxim8) {
      throw new Error('Proxim8 already exists for this NFT');
    }

    // TODO: Verify NFT ownership through the NFT service

    return await prisma.gameProxim8.create({
      data: {
        gameAgentId: data.gameAgentId,
        nftId: data.nftId,
        name: data.name,
        personality: data.personality,
        level: 1,
        experience: 0,
        isDeployed: false,
      },
    });
  }

  /**
   * Level up a Proxim8 based on experience
   */
  static async checkAndLevelUpProxim8(proxim8Id: string): Promise<GameProxim8> {
    const proxim8 = await prisma.gameProxim8.findUnique({
      where: { id: proxim8Id },
    });

    if (!proxim8) {
      throw new Error('Proxim8 not found');
    }

    // Calculate required experience for next level (exponential growth)
    const getRequiredExp = (level: number) =>
      Math.floor(100 * Math.pow(1.5, level - 1));

    let newLevel = proxim8.level;
    let remainingExp = proxim8.experience;

    // Check if level up is possible
    while (remainingExp >= getRequiredExp(newLevel)) {
      remainingExp -= getRequiredExp(newLevel);
      newLevel++;
    }

    if (newLevel > proxim8.level) {
      // Level up occurred
      return await prisma.gameProxim8.update({
        where: { id: proxim8Id },
        data: {
          level: newLevel,
        },
      });
    }

    return proxim8;
  }

  /**
   * Calculate agent rank based on timeline points
   */
  static calculateRank(timelinePoints: number): AgentRank {
    if (timelinePoints >= 1000) return AgentRank.ARCHITECT;
    if (timelinePoints >= 500) return AgentRank.SENIOR_AGENT;
    if (timelinePoints >= 100) return AgentRank.FIELD_AGENT;
    return AgentRank.OBSERVER;
  }

  /**
   * Get rank thresholds
   */
  static getRankThresholds(): Record<AgentRank, number> {
    return {
      [AgentRank.OBSERVER]: 0,
      [AgentRank.FIELD_AGENT]: 100,
      [AgentRank.SENIOR_AGENT]: 500,
      [AgentRank.ARCHITECT]: 1000,
    };
  }

  /**
   * Update agent rank if needed
   */
  static async updateAgentRank(gameAgentId: string): Promise<GameAgent> {
    const gameAgent = await prisma.gameAgent.findUnique({
      where: { id: gameAgentId },
    });

    if (!gameAgent) {
      throw new Error('Game agent not found');
    }

    const newRank = GameAgentService.calculateRank(gameAgent.timelinePoints);

    if (newRank !== gameAgent.rank) {
      return await prisma.gameAgent.update({
        where: { id: gameAgentId },
        data: { rank: newRank },
      });
    }

    return gameAgent;
  }

  /**
   * Get comprehensive stats for a game agent
   */
  static async getAgentStats(gameAgentId: string): Promise<GameAgentStats> {
    const gameAgent = await prisma.gameAgent.findUnique({
      where: { id: gameAgentId },
      include: {
        missionDeployments: true,
      },
    });

    if (!gameAgent) {
      throw new Error('Game agent not found');
    }

    const totalMissions = gameAgent.missionDeployments.length;
    const completedMissions = gameAgent.missionDeployments.filter(
      (d) => d.status === 'COMPLETED'
    ).length;

    const successRate =
      totalMissions > 0 ? (completedMissions / totalMissions) * 100 : 0;

    // Calculate total timeline shift from mission results
    const totalTimelineShift = gameAgent.missionDeployments
      .filter((d) => d.result && d.status === 'COMPLETED')
      .reduce((sum, deployment) => {
        const result = deployment.result as any;
        return sum + (result?.timelineShift || 0);
      }, 0);

    const currentRank = GameAgentService.calculateRank(
      gameAgent.timelinePoints
    );
    const thresholds = GameAgentService.getRankThresholds();

    // Find next rank threshold
    let nextRankThreshold: number | undefined;
    const rankOrder = [
      AgentRank.OBSERVER,
      AgentRank.FIELD_AGENT,
      AgentRank.SENIOR_AGENT,
      AgentRank.ARCHITECT,
    ];

    const currentRankIndex = rankOrder.indexOf(currentRank);
    if (currentRankIndex < rankOrder.length - 1) {
      const nextRank = rankOrder[currentRankIndex + 1];
      nextRankThreshold = thresholds[nextRank];
    }

    return {
      totalMissions,
      completedMissions,
      successRate: Math.round(successRate * 100) / 100, // Round to 2 decimals
      totalTimelineShift,
      rank: currentRank,
      nextRankThreshold,
    };
  }

  /**
   * Get available Proxim8s for mission deployment
   */
  static async getAvailableProxim8s(
    gameAgentId: string
  ): Promise<GameProxim8[]> {
    return await prisma.gameProxim8.findMany({
      where: {
        gameAgentId,
        isDeployed: false,
      },
      orderBy: [{ level: 'desc' }, { experience: 'desc' }],
    });
  }

  /**
   * Get deployed Proxim8s with their current missions
   */
  static async getDeployedProxim8s(gameAgentId: string) {
    const deployedProxim8s = await prisma.gameProxim8.findMany({
      where: {
        gameAgentId,
        isDeployed: true,
      },
      include: {
        missionDeployments: {
          where: { status: 'ACTIVE' },
          orderBy: { deployedAt: 'desc' },
          take: 1,
        },
      },
    });

    return deployedProxim8s.map((proxim8) => ({
      ...proxim8,
      currentMission: proxim8.missionDeployments[0] || null,
    }));
  }

  /**
   * Get personality distribution for an agent's Proxim8s
   */
  static async getPersonalityDistribution(gameAgentId: string) {
    const proxim8s = await prisma.gameProxim8.findMany({
      where: { gameAgentId },
      select: { personality: true },
    });

    const distribution = {
      ANALYTICAL: 0,
      AGGRESSIVE: 0,
      DIPLOMATIC: 0,
      ADAPTIVE: 0,
    };

    proxim8s.forEach((p) => {
      distribution[p.personality]++;
    });

    return distribution;
  }

  /**
   * Suggest best Proxim8 for a mission
   */
  static async suggestProxim8ForMission(
    gameAgentId: string,
    missionId: string
  ): Promise<{ proxim8: GameProxim8; compatibility: number } | null> {
    // This would integrate with MissionService.calculateCompatibility
    // For now, return the highest level available Proxim8
    const availableProxim8s =
      await GameAgentService.getAvailableProxim8s(gameAgentId);

    if (availableProxim8s.length === 0) {
      return null;
    }

    // Simple suggestion: highest level Proxim8
    const bestProxim8 = availableProxim8s[0];

    return {
      proxim8: bestProxim8,
      compatibility: 0.75, // Placeholder - would use actual compatibility calculation
    };
  }
}
