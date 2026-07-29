import type { IngestionEventDto } from '@life-manager/shared';
import { apiFetch } from './client.js';

export function fetchIngestionEvents() {
  return apiFetch<IngestionEventDto[]>('/ingestion-events');
}
