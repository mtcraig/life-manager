import { useMutation, useQuery } from '@tanstack/react-query';
import { fetchHealth } from '../api/health.js';
import * as systemApi from '../api/system.js';

export function useShutdown() {
  return useMutation({
    mutationFn: () => systemApi.shutdownServers(),
  });
}

export function useServerStatus() {
  return useQuery({
    queryKey: ['health'],
    queryFn: fetchHealth,
    refetchInterval: 5000,
    retry: false,
  });
}
