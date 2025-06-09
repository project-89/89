import { Request, Response } from 'express';
import TrainingMissionDeployment from '../models/game/TrainingMissionDeployment';
import Agent from '../models/game/Agent';

export interface AuthenticatedRequest extends Request {
  user?: {
    walletAddress: string;
    isAdmin?: boolean;
  };
}

/**
 * Force complete a mission (dev only)
 */
export const forceCompleteMission = async (req: AuthenticatedRequest, res: Response): Promise<any> => {
  try {
    // Only allow in development
    if (process.env.NODE_ENV === 'production') {
      return res.status(403).json({
        success: false,
        error: 'Dev endpoints are not available in production'
      });
    }

    const { deploymentId } = req.params;
    const { walletAddress } = req.user!;
    
    const deployment = await TrainingMissionDeployment.findOne({
      deploymentId,
      agentId: walletAddress
    });
    
    if (!deployment) {
      return res.status(404).json({
        success: false,
        error: 'Deployment not found'
      });
    }
    
    // Force complete the mission
    deployment.status = 'completed';
    deployment.currentPhase = deployment.phaseOutcomes.length;
    
    // Mark all phases as completed with their pre-generated results
    const now = new Date();
    deployment.phaseOutcomes = deployment.phaseOutcomes.map((phase: any) => ({
      ...phase,
      completedAt: phase.completedAt || now
    }));
    
    // Ensure result exists
    if (!deployment.result) {
      const successfulPhases = deployment.phaseOutcomes.filter((p: any) => p.success).length;
      const overallSuccess = successfulPhases >= Math.ceil(deployment.phaseOutcomes.length * 0.6);
      
      deployment.result = {
        overallSuccess,
        finalNarrative: "Mission force completed via dev tools.",
        timelineShift: overallSuccess ? 6 : 3,
        rewards: {
          timelinePoints: overallSuccess ? 100 : 50,
          experience: overallSuccess ? 50 : 25,
          loreFragments: [],
          achievements: []
        }
      } as any;
    }
    
    await deployment.save();
    
    // Free up the Proxim8
    const agent = await Agent.findOne({ walletAddress });
    if (agent) {
      const proxim8 = agent.proxim8s.find((p: any) => p.nftId === deployment.proxim8Id);
      if (proxim8) {
        proxim8.isDeployed = false;
        proxim8.currentMissionId = undefined;
        await agent.save();
      }
    }
    
    res.json({
      success: true,
      data: {
        message: 'Mission force completed',
        deployment: (deployment as any).getClientState()
      }
    });
  } catch (error) {
    console.error('Error force completing mission:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to force complete mission'
    });
  }
};

/**
 * Clear/reset a mission (dev only)
 */
export const clearMission = async (req: AuthenticatedRequest, res: Response): Promise<any> => {
  try {
    // Only allow in development
    if (process.env.NODE_ENV === 'production') {
      return res.status(403).json({
        success: false,
        error: 'Dev endpoints are not available in production'
      });
    }

    const { missionId } = req.params;
    const { walletAddress } = req.user!;
    
    // Find and delete all deployments for this mission
    const deployments = await TrainingMissionDeployment.find({
      missionId,
      agentId: walletAddress
    });
    
    // Free up any deployed Proxim8s
    const agent = await Agent.findOne({ walletAddress });
    if (agent) {
      for (const deployment of deployments) {
        const proxim8 = agent.proxim8s.find((p: any) => p.nftId === deployment.proxim8Id);
        if (proxim8 && proxim8.currentMissionId === deployment.deploymentId) {
          proxim8.isDeployed = false;
          proxim8.currentMissionId = undefined;
        }
      }
      await agent.save();
    }
    
    // Delete the deployments
    await TrainingMissionDeployment.deleteMany({
      missionId,
      agentId: walletAddress
    });
    
    res.json({
      success: true,
      data: {
        message: `Cleared ${deployments.length} deployment(s) for mission ${missionId}`,
        deletedCount: deployments.length
      }
    });
  } catch (error) {
    console.error('Error clearing mission:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to clear mission'
    });
  }
};