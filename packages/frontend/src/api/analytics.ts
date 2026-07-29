import type {
  AccountBalanceTrendQuery,
  BalanceTrendPointDto,
  MoneyFlowQuery,
  MoneyFlowResultDto,
} from '@life-manager/shared';
import { apiFetch } from './client.js';

function toParams(query: Record<string, string | number | undefined>): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== '') params.set(key, String(value));
  }
  return params.toString();
}

export function fetchMoneyFlow(query: Partial<MoneyFlowQuery>) {
  return apiFetch<MoneyFlowResultDto>(`/analytics/money-flow?${toParams(query)}`);
}

export function fetchAccountBalanceTrend(query: AccountBalanceTrendQuery) {
  return apiFetch<BalanceTrendPointDto[]>(`/analytics/account-balance-trend?${toParams(query)}`);
}
