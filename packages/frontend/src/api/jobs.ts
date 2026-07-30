import type { JobDto } from '@life-manager/shared';
import { apiFetch } from './client.js';

export function fetchJob(jobId: number) {
  return apiFetch<JobDto>(`/jobs/${jobId}`);
}
