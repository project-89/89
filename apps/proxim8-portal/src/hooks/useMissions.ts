"use client";

import { useState, useEffect } from 'react';
import { 
  getMissions, 
  deployMission as apiDeployMission, 
  type MissionWithProgress, 
  type Agent,
  type MissionType,
  type ApproachType
} from '@/lib/api/missions';

export interface UseMissionsResult {
  missions: MissionWithProgress[];
  agent: Agent | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  deployMission: (
    missionId: string, 
    proxim8Id: string, 
    approach: ApproachType,
    missionType?: MissionType
  ) => Promise<void>;
  isDeploying: boolean;
}

interface UseMissionsOptions {
  type?: MissionType | 'all';
}

// Simple in-memory cache to prevent redundant fetches
const missionsCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 5000; // 5 seconds

// Track ongoing fetches to prevent duplicates
const ongoingFetches = new Map<string, Promise<void>>();

// Clear cache on page reload for debugging
if (typeof window !== 'undefined') {
  console.log('[useMissions] Clearing cache on reload');
  missionsCache.clear();
  ongoingFetches.clear();
}

export function useMissions(options: UseMissionsOptions = {}): UseMissionsResult {
  const [missions, setMissions] = useState<MissionWithProgress[]>([]);
  const [agent, setAgent] = useState<Agent | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeploying, setIsDeploying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { type = 'all' } = options;

  const fetchMissions = async (forceRefresh = false) => {
    const cacheKey = `missions-${type}`;
    
    console.log('[useMissions] fetchMissions called', { type, forceRefresh, cacheKey });
    
    // Check if there's already an ongoing fetch for this type
    const ongoingFetch = ongoingFetches.get(cacheKey);
    if (ongoingFetch && !forceRefresh) {
      console.log('[useMissions] Returning ongoing fetch');
      return ongoingFetch;
    }
    
    // Create the fetch promise
    const fetchPromise = (async () => {
      try {
        // Check cache first
        const cached = missionsCache.get(cacheKey);
        
        if (!forceRefresh && cached && Date.now() - cached.timestamp < CACHE_DURATION) {
          console.log('[useMissions] Using cached data', cached);
          setMissions(cached.data.missions);
          setAgent(cached.data.agent);
          setIsLoading(false);
          return;
        }
        
        console.log('[useMissions] Making API call to getMissions');
        setIsLoading(true);
        setError(null);
        
        const data = await getMissions(type);
        
        // Update cache
        missionsCache.set(cacheKey, { data, timestamp: Date.now() });
        
        setMissions(data.missions);
        setAgent(data.agent);
      } catch (err) {
        console.error('Error fetching missions:', err);
        
        // Handle specific error types
      if (err && typeof err === 'object' && 'status' in err) {
        const apiError = err as any;
        if (apiError.status === 401) {
          setError('Authentication required. Please connect your wallet to access missions.');
        } else if (apiError.status === 403) {
          setError('Access denied. Please ensure you own a Proxim8 NFT to access missions.');
        } else if (apiError.status >= 500) {
          setError('Server error. Mission system temporarily unavailable.');
        } else {
          setError(apiError.message || 'Failed to fetch missions');
        }
      } else {
        setError(err instanceof Error ? err.message : 'Failed to fetch missions');
      }
      } finally {
        setIsLoading(false);
        // Remove from ongoing fetches
        ongoingFetches.delete(cacheKey);
      }
    })();
    
    // Store the ongoing fetch
    ongoingFetches.set(cacheKey, fetchPromise);
    
    return fetchPromise;
  };

  const handleDeployMission = async (
    missionId: string, 
    proxim8Id: string, 
    approach: ApproachType,
    missionType?: MissionType
  ) => {
    try {
      setIsDeploying(true);
      setError(null);
      
      await apiDeployMission(missionId, proxim8Id, approach, missionType);
      
      // Clear cache and refresh missions to get updated status
      missionsCache.clear();
      await fetchMissions(true);
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
    console.log('[useMissions] useEffect triggered', { type });
    fetchMissions();
  }, [type]); // Re-fetch if type changes

  return {
    missions,
    agent,
    isLoading,
    isDeploying,
    error,
    refetch: () => fetchMissions(true), // Force refresh when explicitly called
    deployMission: handleDeployMission
  };
}

// Convenience hook for training missions only
export function useTrainingMissions() {
  return useMissions({ type: 'training' });
}