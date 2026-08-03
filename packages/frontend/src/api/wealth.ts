import type { NetWorthTrendPointDto, WealthSummaryDto } from '@life-manager/shared';
import { apiFetch } from './client.js';

export function fetchWealthSummary() {
  return apiFetch<WealthSummaryDto>('/wealth');
}

export function fetchNetWorthTrend() {
  return apiFetch<NetWorthTrendPointDto[]>('/wealth/trend');
}
