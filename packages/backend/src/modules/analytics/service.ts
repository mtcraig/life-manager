import type {
  AccountBalanceTrendQuery,
  BalanceTrendPointDto,
  MoneyFlowQuery,
  MoneyFlowResultDto,
} from '@life-manager/shared';
import { computeBalanceTrend } from '../../lib/calculations/balanceTrend';
import { groupMoneyFlowByDate } from '../../lib/calculations/moneyFlow';
import * as transactionsRepo from '../transactions/repo';

export function getMoneyFlow(query: MoneyFlowQuery): MoneyFlowResultDto {
  const rows = transactionsRepo.listTransactionAmountsWithTransferFlag(query);
  return groupMoneyFlowByDate(rows);
}

/**
 * Cumulative running balance per day for a single account, derived purely from
 * ingested transaction amounts (there's no separate opening-balance field) —
 * so this reflects net movement since the account's first ingested transaction,
 * not necessarily the real-world bank balance. Includes transfers, unlike
 * getMoneyFlow, since transfers still move real money in or out of an account.
 */
export function getAccountBalanceTrend(query: AccountBalanceTrendQuery): BalanceTrendPointDto[] {
  const rows = transactionsRepo.listTransactionAmountsWithTransferFlag(query);
  return computeBalanceTrend(rows);
}
