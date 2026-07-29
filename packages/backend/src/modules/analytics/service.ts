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
 * Cumulative running balance per day for a single account. Points are relative
 * (net movement since the account's first ingested transaction) until the
 * first bank-reported balance is seen — from there on, points are snapped to
 * the bank's own figures whenever the account's CSV mapping includes a
 * balance column, so the most recent point is authoritative whenever the
 * latest import carried one. See computeBalanceTrend for the snap algorithm.
 * Includes transfers, unlike getMoneyFlow, since transfers still move real
 * money in or out of an account.
 */
export function getAccountBalanceTrend(query: AccountBalanceTrendQuery): BalanceTrendPointDto[] {
  const rows = transactionsRepo.listTransactionAmountsWithTransferFlag(query);
  return computeBalanceTrend(rows);
}
