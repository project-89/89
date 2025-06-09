import { useQuery, useMutation, useQueryClient, UseMutationOptions } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type { Mission, Agent, Knowledge, Video, Notification } from '@prisma/client';

// Mission hooks
export function useMissions(params?: any) {
  return useQuery({
    queryKey: ['missions', params],
    queryFn: () => apiClient.findMany<Mission>('mission', params),
  });
}

export function useMission(id: string, params?: any) {
  return useQuery({
    queryKey: ['missions', id, params],
    queryFn: () => apiClient.findOne<Mission>('mission', id, params),
    enabled: !!id,
  });
}

export function useCreateMission(options?: UseMutationOptions<Mission, Error, any>) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: any) => apiClient.create<Mission>('mission', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['missions'] });
    },
    ...options,
  });
}

// Agent hooks
export function useAgents(params?: any) {
  return useQuery({
    queryKey: ['agents', params],
    queryFn: () => apiClient.findMany<Agent>('agent', params),
  });
}

export function useAgent(id: string) {
  return useQuery({
    queryKey: ['agents', id],
    queryFn: () => apiClient.findOne<Agent>('agent', id),
    enabled: !!id,
  });
}

export function useUpdateAgent(id: string) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: any) => apiClient.update<Agent>('agent', id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agents', id] });
      queryClient.invalidateQueries({ queryKey: ['agents'] });
    },
  });
}

// Knowledge hooks
export function useKnowledge(params?: any) {
  return useQuery({
    queryKey: ['knowledge', params],
    queryFn: () => apiClient.findMany<Knowledge>('knowledge', params),
  });
}

export function useCreateKnowledge() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: any) => apiClient.create<Knowledge>('knowledge', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['knowledge'] });
    },
  });
}

// Video hooks
export function useVideos(params?: any) {
  return useQuery({
    queryKey: ['videos', params],
    queryFn: () => apiClient.findMany<Video>('video', params),
  });
}

export function useVideo(id: string) {
  return useQuery({
    queryKey: ['videos', id],
    queryFn: () => apiClient.findOne<Video>('video', id),
    enabled: !!id,
  });
}

export function useUpdateVideo(id: string) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: any) => apiClient.update<Video>('video', id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['videos', id] });
      queryClient.invalidateQueries({ queryKey: ['videos'] });
    },
  });
}

export function useDeleteVideo(id: string) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: () => apiClient.delete<Video>('video', id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['videos'] });
    },
  });
}

// Notification hooks
export function useNotifications(params?: any) {
  return useQuery({
    queryKey: ['notifications', params],
    queryFn: () => apiClient.findMany<Notification>('notification', params),
  });
}

export function useMarkNotificationRead(id: string) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: () => apiClient.update<Notification>('notification', id, { read: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}