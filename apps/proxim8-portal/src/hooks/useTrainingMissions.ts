"use client";

import { useState, useEffect } from 'react';
import { getTrainingMissions, deployMission as apiDeployMission, TrainingMission, Agent } from '@/lib/api/training';

export interface UseTrainingMissionsResult {
  missions: TrainingMission[];
  agent: Agent | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  deployMission: (missionId: string, proxim8Id: string, approach: 'low' | 'medium' | 'high') => Promise<void>;
  isDeploying: boolean;
}

export function useTrainingMissions(): UseTrainingMissionsResult {
  const [missions, setMissions] = useState<TrainingMission[]>([]);
  const [agent, setAgent] = useState<Agent | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeploying, setIsDeploying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMissions = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const data = await getTrainingMissions();
      setMissions(data.missions);
      setAgent(data.agent);
    } catch (err) {
      console.error('Error fetching training missions:', err);
      
      // Handle specific error types
      if (err && typeof err === 'object' && 'status' in err) {
        const apiError = err as any;
        if (apiError.status === 401) {
          setError('Authentication required. Please connect your wallet to access training missions.');
        } else if (apiError.status === 403) {
          setError('Access denied. Please ensure you own a Proxim8 NFT to access training.');
        } else if (apiError.status >= 500) {
          setError('Server error. Training system temporarily unavailable.');
        } else {
          setError(apiError.message || 'Failed to fetch training missions');
        }
      } else {
        setError(err instanceof Error ? err.message : 'Failed to fetch training missions');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeployMission = async (missionId: string, proxim8Id: string, approach: 'low' | 'medium' | 'high') => {
    try {
      setIsDeploying(true);
      setError(null);
      
      await apiDeployMission(missionId, proxim8Id, approach);
      
      // Refresh missions to get updated status
      await fetchMissions();
    } catch (err) {
      console.error('Error deploying mission:', err);
      
      if (err && typeof err === 'object' && 'status' in err) {
        const apiError = err as any;
        if (apiError.status === 400) {
          setError('Invalid mission deployment parameters. Please check your selection.');
        } else if (apiError.status === 401) {
          setError('Authentication required to deploy missions.');
        } else if (apiError.status === 403) {
          setError('Access denied. Ensure you own the selected Proxim8.');
        } else {
          setError(apiError.message || 'Failed to deploy mission');
        }
      } else {
        setError(err instanceof Error ? err.message : 'Failed to deploy mission');
      }
      throw err; // Re-throw so the UI can handle it
    } finally {
      setIsDeploying(false);
    }
  };

  useEffect(() => {
    fetchMissions();
  }, []);

  return {
    missions,
    agent,
    isLoading,
    isDeploying,
    error,
    refetch: fetchMissions,
    deployMission: handleDeployMission
  };
}