import { Request, Response } from 'express';
import MissionDeployment from '../models/game/MissionDeployment';
import MissionTemplate from '../models/game/MissionTemplate';
import Agent from '../models/game/Agent';
import { MissionService } from '../services/game/missionService';

export interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    walletAddress: string;
  };
}

/**
 * Get all missions (training + available timeline missions) for a user
 */
export const getMissions = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { userId } = req.user!;
    const { type } = req.query; // 'training', 'timeline', 'all'
    
    // Get agent data
    const agent = await Agent.findOne({ userId });
    
    // Get user's mission deployment history
    const deployments = await MissionDeployment.find({ 
      agentId: userId 
    }).lean();
    
    let missions: any[] = [];
    
    // Include training missions if requested
    if (!type || type === 'training' || type === 'all') {
      // Fetch training missions from database
      const query: any = { missionType: 'training', isActive: true };
      const trainingMissions = await MissionTemplate.find(query).sort({ sequence: 1 }).lean();
      
      const trainingMissionsWithProgress = trainingMissions.map((mission: any) => {
        const missionId = mission.templateId || mission._id.toString();
        const deployment = deployments.find(d => d.missionId === missionId && d.missionType === 'training');
        
        return {
          ...mission,
          id: missionId, // Ensure id field exists for client compatibility
          missionId: missionId, // Also include missionId for compatibility
          userProgress: {
            isUnlocked: canUserAccessMission(mission, deployments, 'training'),
            isCompleted: deployment?.status === 'completed',
            isActive: deployment?.status === 'active',
            completedAt: deployment?.result ? deployment.updatedAt : null,
            successRate: deployment?.result?.overallSuccess,
            lastAttempt: deployment?.deployedAt,
            deployment: deployment ? {
              deploymentId: deployment.deploymentId,
              status: deployment.status,
              completesAt: deployment.completesAt
            } : null
          }
        };
      });
      
      missions = missions.concat(trainingMissionsWithProgress);
    }
    
    // Include timeline missions if requested
    if (type === 'timeline' || type === 'all') {
      // For MVP, we'll generate a basic timeline view
      // In full implementation, this would show the timeline geography
      const timelineMissions = await generateTimelineOverview(userId, deployments);
      missions = missions.concat(timelineMissions);
    }
    
    res.json({
      success: true,
      data: {
        missions,
        agent: agent ? {
          codename: agent.codename,
          rank: agent.rank,
          timelinePoints: agent.timelinePoints,
          availableProxim8s: (agent as any).getAvailableProxim8s().length,
          timelineInfluence: agent.timelineInfluence
        } : null
      }
    });
  } catch (error) {
    console.error('Error fetching missions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch missions'
    });
  }
};

/**
 * Get specific mission details
 */
export const getMissionDetails = async (req: AuthenticatedRequest, res: Response): Promise<any> => {
  try {
    const { missionId } = req.params;
    const { type = 'training' } = req.query;
    const { userId } = req.user!;
    
    let missionTemplate;
    
    if (type === 'training') {
      // Find training mission template from database
      missionTemplate = await MissionTemplate.findOne({
        $or: [
          { templateId: missionId },
          { _id: missionId }
        ],
        missionType: 'training',
        isActive: true
      }).lean();
      
      if (!missionTemplate) {
        return res.status(404).json({
          success: false,
          error: 'Training mission not found'
        });
      }
      // Ensure id field exists for consistency
      const templateId = missionTemplate.templateId || missionTemplate._id.toString();
      missionTemplate = { ...missionTemplate, id: templateId, missionId: templateId };
    } else {
      // Find timeline mission template or generate one
      missionTemplate = await MissionTemplate.findOne({
        templateId: missionId,
        missionType: type,
        isActive: true
      });
      
      if (!missionTemplate) {
        // Try to generate a timeline mission for this ID
        try {
          const timelineParts = missionId.split('_');
          if (timelineParts[0] === 'timeline' && timelineParts.length >= 2) {
            const year = parseInt(timelineParts[1]);
            const month = timelineParts.length > 2 ? parseInt(timelineParts[2]) : undefined;
            const day = timelineParts.length > 3 ? parseInt(timelineParts[3]) : undefined;
            
            missionTemplate = await MissionService.generateTimelineMission(year, month, day);
            missionTemplate.id = missionId; // Set the ID for consistency
          }
        } catch (genError) {
          console.error('Error generating timeline mission:', genError);
        }
        
        if (!missionTemplate) {
          return res.status(404).json({
            success: false,
            error: 'Mission not found'
          });
        }
      }
    }
    
    // Check if user has deployment for this mission
    const deployment = await MissionDeployment.findOne({
      agentId: userId,
      missionId,
      missionType: type
    });
    
    // Get agent data for compatibility calculations
    const agent = await Agent.findOne({ userId });
    
    // Calculate compatibility for each available Proxim8
    let proxim8Compatibility = null;
    if (agent) {
      const availableProxim8s = (agent as any).getAvailableProxim8s();
      proxim8Compatibility = availableProxim8s.map((proxim8: any) => ({
        ...proxim8.toObject(),
        compatibility: MissionService.calculateCompatibility(proxim8, missionTemplate)
      }));
    }
    
    res.json({
      success: true,
      data: {
        mission: {
          ...missionTemplate,
          missionType: type
        },
        deployment: deployment ? (deployment as any).getClientState() : null,
        agent: agent ? {
          availableProxim8s: proxim8Compatibility,
          canDeploy: (agent as any).canDeployMission().allowed
        } : null
      }
    });
  } catch (error) {
    console.error('Error fetching mission details:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch mission details'
    });
  }
};

/**
 * Deploy a mission
 */
export const deployMission = async (req: AuthenticatedRequest, res: Response): Promise<any> => {
  try {
    const { missionId } = req.params;
    const { proxim8Id, approach, missionType = 'training', timelineNode } = req.body;
    const { userId } = req.user!;
    
    // Validate inputs
    const validApproaches = ['aggressive', 'balanced', 'cautious', 'low', 'medium', 'high'];
    if (!proxim8Id || !approach || !validApproaches.includes(approach)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid deployment parameters'
      });
    }
    
    // Deploy mission using service
    const deployment = await MissionService.deployMission({
      agentId: userId,
      missionId,
      missionType,
      proxim8Id,
      approach,
      timelineNode
    });
    
    res.json({
      success: true,
      data: {
        deployment: (deployment as any).getClientState(),
        message: 'Mission deployed successfully'
      }
    });
  } catch (error) {
    console.error('Error deploying mission:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to deploy mission'
    });
  }
};

/**
 * Get mission deployment status
 */
export const getMissionStatus = async (req: AuthenticatedRequest, res: Response): Promise<any> => {
  try {
    const { deploymentId } = req.params;
    const { userId } = req.user!;
    
    const deployment = await MissionDeployment.findOne({
      deploymentId,
      agentId: userId
    });
    
    if (!deployment) {
      return res.status(404).json({
        success: false,
        error: 'Mission deployment not found'
      });
    }
    
    // Check if mission timer has expired and Proxim8 should be freed
    if (new Date() >= deployment.completesAt) {
      // Get progress to check if timer expired
      const progressData = MissionService.getMissionProgress(deployment);
      
      if (progressData.isTimerExpired) {
        // Free up the Proxim8 since timer has expired
        await MissionService.handleMissionExpiration(deployment.deploymentId);
      }
      
      // Return full mission results since timer has expired
      return res.json({
        success: true,
        data: {
          ...(deployment as any).getClientState(),
          progress: progressData
        }
      });
    }
    
    // Get progressive mission progress (phases revealed over time)
    const progressData = MissionService.getMissionProgress(deployment);
    
    res.json({
      success: true,
      data: {
        ...(deployment as any).getClientState(),
        progress: progressData
      }
    });
  } catch (error) {
    console.error('Error fetching mission status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch mission status'
    });
  }
};

/**
 * Get timeline overview for mission selection
 */
export const getTimelineOverview = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { userId } = req.user!;
    const { 
      startYear = 2025, 
      endYear = 2089, 
      granularity = 'year' // 'year', 'month', 'day'
    } = req.query;
    
    // Get all timeline deployments for influence visualization
    const allDeployments = await MissionDeployment.find({
      missionType: { $in: ['timeline', 'critical'] },
      status: { $in: ['active', 'completed'] }
    }).lean();
    
    // Get user's deployments
    const userDeployments = allDeployments.filter(d => d.agentId === userId);
    
    // Generate timeline nodes
    const timelineNodes = [];
    const start = parseInt(startYear as string);
    const end = parseInt(endYear as string);
    
    for (let year = start; year <= end; year++) {
      if (granularity === 'year') {
        const nodeId = `timeline_${year}`;
        const existingDeployment = allDeployments.find(d => 
          d.timelineNode?.year === year && !d.timelineNode?.month
        );
        const userDeployment = userDeployments.find(d => 
          d.timelineNode?.year === year && !d.timelineNode?.month
        );
        
        timelineNodes.push({
          nodeId,
          year,
          status: getUserDeploymentStatus(userDeployment),
          isClaimedByOther: existingDeployment && !userDeployment,
          claimedBy: existingDeployment?.agentId,
          influence: calculateNodeInfluence(allDeployments, year),
          canDeploy: !existingDeployment,
          isCriticalJuncture: isCriticalYear(year)
        });
      }
      // Add month/day granularity logic here for Phase 2
    }
    
    res.json({
      success: true,
      data: {
        timeline: timelineNodes,
        summary: {
          totalNodes: timelineNodes.length,
          claimedByUser: timelineNodes.filter(n => n.status !== 'unclaimed').length,
          availableNodes: timelineNodes.filter(n => n.canDeploy).length,
          criticalJunctures: timelineNodes.filter(n => n.isCriticalJuncture).length
        }
      }
    });
  } catch (error) {
    console.error('Error fetching timeline overview:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch timeline overview'
    });
  }
};

// Helper functions
function canUserAccessMission(mission: any, deployments: any[], missionType: string): boolean {
  // Check if mission has explicit dependencies
  if (mission.dependencies && mission.dependencies.length > 0) {
    // Check each dependency
    for (const dep of mission.dependencies) {
      const depDeployment = deployments.find(d => d.missionId === dep.missionId);
      
      if (!depDeployment || depDeployment.status !== 'completed') {
        return false; // Dependency not completed
      }
      
      // Check required outcome if specified
      if (dep.requiredOutcome !== 'any') {
        const success = depDeployment.result?.overallSuccess;
        if (dep.requiredOutcome === 'success' && !success) return false;
        if (dep.requiredOutcome === 'failure' && success) return false;
      }
    }
    return true; // All dependencies satisfied
  }
  
  // Fallback to sequential unlock for training missions without explicit dependencies
  if (missionType === 'training') {
    const missionId = mission.templateId || mission._id?.toString() || '';
    
    // Extract sequence number from missionId (format: training_001 or just a number)
    let missionNumber: number;
    if (missionId.includes('_')) {
      missionNumber = parseInt(missionId.split('_')[1]);
    } else if (mission.sequence) {
      missionNumber = mission.sequence;
    } else {
      missionNumber = parseInt(missionId);
    }
    
    // First mission is always unlocked
    if (missionNumber === 1 || isNaN(missionNumber)) return true;
    
    // Check if previous mission is completed
    const previousMissionId = `training_${String(missionNumber - 1).padStart(3, '0')}`;
    const previousDeployment = deployments.find(d => 
      d.missionId === previousMissionId && d.missionType === 'training'
    );
    
    return previousDeployment?.status === 'completed';
  }
  
  // Non-training missions without dependencies are always unlocked
  return true;
}

async function generateTimelineOverview(userId: string, deployments: any[]): Promise<any[]> {
  // For MVP, return a simple timeline overview
  // This would be expanded to show the full timeline geography
  const timelineMissions = [];
  
  // Add some sample timeline periods
  const periods = [
    { year: 2027, name: 'Neural Seed Installation', status: 'available' },
    { year: 2041, name: 'The Convergence', status: 'locked', isCritical: true },
    { year: 2055, name: 'Memory Wars', status: 'locked' },
    { year: 2089, name: 'Project 89 Genesis', status: 'locked', isCritical: true }
  ];
  
  for (const period of periods) {
    const deployment = deployments.find(d => 
      d.timelineNode?.year === period.year && d.missionType === 'timeline'
    );
    
    timelineMissions.push({
      id: `timeline_${period.year}`,
      missionType: 'timeline',
      missionName: period.name,
      year: period.year,
      description: `Influence the timeline at year ${period.year}`,
      isCriticalJuncture: period.isCritical || false,
      userProgress: {
        isUnlocked: period.status === 'available',
        isCompleted: deployment?.status === 'completed',
        isActive: deployment?.status === 'active',
        deployment: deployment ? {
          deploymentId: deployment.deploymentId,
          status: deployment.status,
          completesAt: deployment.completesAt
        } : null
      }
    });
  }
  
  return timelineMissions;
}

function getUserDeploymentStatus(deployment: any): 'unclaimed' | 'active' | 'completed' | 'failed' {
  if (!deployment) return 'unclaimed';
  if (deployment.status === 'active') return 'active';
  if (deployment.status === 'completed') {
    return deployment.result?.overallSuccess ? 'completed' : 'failed';
  }
  return 'unclaimed';
}

function calculateNodeInfluence(deployments: any[], year: number): any {
  const nodeDeployments = deployments.filter(d => d.timelineNode?.year === year);
  
  let greenLoomInfluence = 0;
  let greyLoomInfluence = 0;
  
  nodeDeployments.forEach(deployment => {
    if (deployment.timelineInfluence) {
      if (deployment.timelineInfluence.influenceType === 'green_loom') {
        greenLoomInfluence += deployment.timelineInfluence.influencePoints;
      } else {
        greyLoomInfluence += deployment.timelineInfluence.influencePoints;
      }
    }
  });
  
  return {
    greenLoom: greenLoomInfluence,
    greyLoom: greyLoomInfluence,
    dominant: greenLoomInfluence > greyLoomInfluence ? 'green_loom' : 
              greyLoomInfluence > greenLoomInfluence ? 'grey_loom' : 'neutral'
  };
}

function isCriticalYear(year: number): boolean {
  const criticalYears = [2027, 2041, 2055, 2067, 2078, 2089];
  return criticalYears.includes(year);
}