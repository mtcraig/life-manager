import type { WealthSummaryDto } from '@life-manager/shared';
import { apiFetch } from './client.js';

export function fetchWealthSummary() {
  return apiFetch<WealthSummaryDto>('/wealth');
}
