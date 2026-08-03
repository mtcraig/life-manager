import type { ForecastDto } from '@life-manager/shared';
import { computeBalanceTrend } from '../../lib/calculations/balanceTrend';
import { detectRecurringItems } from '../../lib/calculations/recurringItems';
import { computeForecast } from '../../lib/calculations/forecast';
import * as accountsRepo from '../accounts/repo';
import * as transactionsRepo from '../transactions/repo';

const DEFAULT_HORIZON_DAYS = 45;
const HISTORY_MONTHS = 12;
const VARIABLE_AVERAGE_MONTHS = 3;

function monthsAgo(dateIso: string, months: number): string {
  const d = new Date(dateIso);
  d.setMonth(d.getMonth() - months);
  return d.toISOString().slice(0, 10);
}

/** Resolves the current spendable balance: one account's latest confirmed balance, or the sum across all accounts. */
function resolveCurrentBalance(accountId: number | undefined): number {
  const accountIds = accountId !== undefined ? [accountId] : accountsRepo.listAccounts().map((a) => a.id);
  let total = 0;
  for (const id of accountIds) {
    const trend = computeBalanceTrend(transactionsRepo.listTransactionAmountsWithTransferFlag({ accountId: id }));
    total += trend.length > 0 ? trend[trend.length - 1]!.balance : 0;
  }
  return total;
}

export function getForecast(accountId?: number, horizonDays: number = DEFAULT_HORIZON_DAYS): ForecastDto {
  const today = new Date().toISOString().slice(0, 10);
  const historyStart = monthsAgo(today, HISTORY_MONTHS);
  const averagesStart = monthsAgo(today, VARIABLE_AVERAGE_MONTHS);

  const historyRows = transactionsRepo.listTransactionsForRecurringAnalysis({
    accountId,
    dateFrom: historyStart,
    dateTo: today,
  });

  const recurringItems = detectRecurringItems(historyRows, today);

  const variableCategoryMonthlyAverages = new Map<number, number>();
  const recentTotalsByCategory = new Map<number, number>();
  for (const row of historyRows) {
    if (row.isTransfer || row.categoryId === null || row.amount >= 0 || row.date < averagesStart) continue;
    recentTotalsByCategory.set(row.categoryId, (recentTotalsByCategory.get(row.categoryId) ?? 0) + -row.amount);
  }
  for (const [categoryId, total] of recentTotalsByCategory) {
    variableCategoryMonthlyAverages.set(categoryId, total / VARIABLE_AVERAGE_MONTHS);
  }

  const currentBalance = resolveCurrentBalance(accountId);
  const comfortableThreshold = [...variableCategoryMonthlyAverages.values()].reduce((sum, v) => sum + v, 0);

  const result = computeForecast({
    currentBalance,
    recurringItems: recurringItems.map((item) => ({
      normalizedDescription: item.normalizedDescription,
      categoryId: item.categoryId,
      averageAmount: item.averageAmount,
      cadence: item.cadence,
      lastDate: item.lastDate,
    })),
    variableCategoryMonthlyAverages,
    horizonDays,
    fromDate: today,
    comfortableThreshold,
  });

  return {
    accountId: accountId ?? null,
    asOfBalance: currentBalance,
    horizonDays,
    points: result.points,
    recurringItems: recurringItems.map((item) => ({
      description: item.normalizedDescription,
      categoryId: item.categoryId,
      averageAmount: item.averageAmount,
      cadence: item.cadence,
      nextDate: item.nextExpectedDate,
      sampleCount: item.sampleCount,
    })),
    events: result.events,
    projectedLow: result.projectedLow,
    health: result.health,
    generatedAt: new Date().toISOString(),
  };
}
