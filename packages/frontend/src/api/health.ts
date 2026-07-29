import type { HealthCheckDto } from '@life-manager/shared';
import { apiFetch } from './client.js';

export function fetchHealth() {
  return apiFetch<HealthCheckDto>('/health');
}
