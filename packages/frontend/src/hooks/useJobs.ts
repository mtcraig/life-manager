import { useQuery } from '@tanstack/react-query';
import * as jobsApi from '../api/jobs.js';

/** Polls a background job until it leaves the 'running' state. */
export function useJob(jobId: number | null) {
  return useQuery({
    queryKey: ['jobs', jobId],
    queryFn: () => jobsApi.fetchJob(jobId as number),
    enabled: jobId !== null,
    refetchInterval: (query) => (query.state.data?.status === 'running' ? 400 : false),
  });
}
