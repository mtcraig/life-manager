import { useQuery } from '@tanstack/react-query';
import type { AccountBalanceTrendQuery, MoneyFlowQuery } from '@life-manager/shared';
import { fetchAccountBalanceTrend, fetchMoneyFlow } from '../api/analytics.js';

export function useMoneyFlow(query: Partial<MoneyFlowQuery>) {
  return useQuery({
    queryKey: ['analytics', 'money-flow', query],
    queryFn: () => fetchMoneyFlow(query),
  });
}

export function useAccountBalanceTrend(query: AccountBalanceTrendQuery) {
  return useQuery({
    queryKey: ['analytics', 'account-balance-trend', query],
    queryFn: () => fetchAccountBalanceTrend(query),
    enabled: query.accountId !== undefined,
  });
}
