import { useQuery } from '@tanstack/react-query';
import type {
  AccountBalanceTrendQuery,
  CategorySummaryQuery,
  MoneyFlowQuery,
  TopTransactionsQuery,
} from '@life-manager/shared';
import {
  fetchAccountBalanceTrend,
  fetchCategorySummary,
  fetchCategorySummaryByMonth,
  fetchMoneyFlow,
  fetchTopTransactions,
} from '../api/analytics.js';

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

export function useCategorySummary(query: Partial<CategorySummaryQuery>) {
  return useQuery({
    queryKey: ['analytics', 'category-summary', query],
    queryFn: () => fetchCategorySummary(query),
  });
}

export function useCategorySummaryByMonth(query: Partial<CategorySummaryQuery>) {
  return useQuery({
    queryKey: ['analytics', 'category-summary-by-month', query],
    queryFn: () => fetchCategorySummaryByMonth(query),
  });
}

export function useTopTransactions(query: Partial<TopTransactionsQuery>) {
  return useQuery({
    queryKey: ['analytics', 'top-transactions', query],
    queryFn: () => fetchTopTransactions(query),
  });
}
