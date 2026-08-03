import type { ForecastDto, ForecastQuery } from '@life-manager/shared';
import { apiFetch } from './client.js';

function toParams(query: Partial<ForecastQuery>): string {
  const params = new URLSearchParams();
  if (query.accountId !== undefined) params.set('accountId', String(query.accountId));
  if (query.horizonDays !== undefined) params.set('horizonDays', String(query.horizonDays));
  return params.toString();
}

export function fetchForecast(query: Partial<ForecastQuery> = {}) {
  return apiFetch<ForecastDto>(`/forecast?${toParams(query)}`);
}
