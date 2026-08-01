import type {
  AccountBalanceTrendQuery,
  BalanceTrendPointDto,
  CategoryMonthSummaryRowDto,
  CategorySummaryQuery,
  CategorySummaryRowDto,
  MoneyFlowQuery,
  MoneyFlowResultDto,
  TopTransactionsQuery,
  TopTransactionsResultDto,
  TransactionDateBoundsDto,
  TransactionDateBoundsQuery,
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

export function fetchCategorySummary(query: Partial<CategorySummaryQuery>) {
  return apiFetch<CategorySummaryRowDto[]>(`/analytics/category-summary?${toParams(query)}`);
}

export function fetchCategorySummaryByMonth(query: Partial<CategorySummaryQuery>) {
  return apiFetch<CategoryMonthSummaryRowDto[]>(`/analytics/category-summary-by-month?${toParams(query)}`);
}

export function fetchTopTransactions(query: Partial<TopTransactionsQuery>) {
  return apiFetch<TopTransactionsResultDto>(`/analytics/top-transactions?${toParams(query)}`);
}

export function fetchTransactionDateBounds(query: Partial<TransactionDateBoundsQuery>) {
  return apiFetch<TransactionDateBoundsDto>(`/analytics/transaction-date-bounds?${toParams(query)}`);
}
