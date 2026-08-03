import type { NetWorthTrendPointDto, WealthSummaryDto } from '@life-manager/shared';
import * as accountsRepo from '../accounts/repo';
import * as analyticsService from '../analytics/service';
import * as investmentsRepo from '../investments/repo';
import * as propertiesRepo from '../properties/repo';
import * as liabilitiesRepo from '../liabilities/repo';
import * as contentsRepo from '../contents/repo';
import * as transactionsRepo from '../transactions/repo';
import { computeWealthSummary, sumLatestValuations } from '../../lib/calculations/wealth';
import { computeBalanceTrend } from '../../lib/calculations/balanceTrend';
import { buildMonthlyDateAxis, computeNetWorthTrend } from '../../lib/calculations/netWorthTrend';
import type { AccountBalanceSeries } from '../../lib/calculations/netWorthTrend';

/**
 * credit_card accounts are liabilities, not liquid assets — their current
 * balance (money owed) is pulled out of `accountsTotal` and folded into
 * `liabilitiesTotal` instead. A card currently in credit (positive balance)
 * contributes 0 here rather than a negative liability.
 *
 * Each account's balance is the same bank-reported, self-healing running
 * total the Accounts page shows (see analytics/service.ts's
 * getAccountBalanceTrend) rather than a separate raw transaction-amount sum —
 * one balance calculation, reused everywhere, so this total and the Accounts
 * page never disagree.
 */
export function getWealthSummary(): WealthSummaryDto {
  const allAccounts = accountsRepo.listAccounts();

  let accountsTotal = 0;
  let creditCardLiabilityTotal = 0;
  for (const account of allAccounts) {
    const trend = analyticsService.getAccountBalanceTrend({ accountId: account.id });
    const balance = trend.length > 0 ? trend[trend.length - 1]!.balance : 0;
    if (account.type === 'credit_card') {
      creditCardLiabilityTotal += Math.max(0, -balance);
    } else {
      accountsTotal += balance;
    }
  }

  const activeInvestmentIds = investmentsRepo.listInvestments(false).map((i) => i.id);
  const investmentsTotal = sumLatestValuations(
    activeInvestmentIds,
    investmentsRepo.listLatestValuationsForAll(),
  );

  const activePropertyIds = propertiesRepo.listProperties(false).map((p) => p.id);
  const propertiesTotal = sumLatestValuations(
    activePropertyIds,
    propertiesRepo.listLatestValuationsForAll(),
  );

  const contentsTotal = contentsRepo.sumAllValues();

  const activeLiabilityIds = liabilitiesRepo.listLiabilities(false).map((l) => l.id);
  const liabilitiesTotal =
    sumLatestValuations(activeLiabilityIds, liabilitiesRepo.listLatestValuationsForAll()) +
    creditCardLiabilityTotal;

  return computeWealthSummary({
    accountsTotal,
    investmentsTotal,
    propertiesTotal,
    contentsTotal,
    liabilitiesTotal,
  });
}

/**
 * Net worth reindexed onto a monthly date axis, from the earliest data point
 * (across transactions and valuations) through today. See netWorthTrend.ts
 * for the reindexing/forward-fill approach and its known simplifications
 * (archived entities excluded uniformly using today's state, contents held
 * constant throughout since it has no history at all).
 */
export function getNetWorthTrend(): NetWorthTrendPointDto[] {
  const today = new Date().toISOString().slice(0, 10);

  const allAccounts = accountsRepo.listAccounts();
  const accountSeries: AccountBalanceSeries[] = allAccounts.map((account) => ({
    accountId: account.id,
    isCreditCard: account.type === 'credit_card',
    points: computeBalanceTrend(
      transactionsRepo.listTransactionAmountsWithTransferFlag({ accountId: account.id }),
    ),
  }));

  const investmentValuations = investmentsRepo.listAllValuationRows();
  const propertyValuations = propertiesRepo.listAllValuationRows();
  const liabilityValuations = liabilitiesRepo.listAllValuationRows();

  const activeInvestmentIds = investmentsRepo.listInvestments(false).map((i) => i.id);
  const activePropertyIds = propertiesRepo.listProperties(false).map((p) => p.id);
  const activeLiabilityIds = liabilitiesRepo.listLiabilities(false).map((l) => l.id);

  const contentsTotal = contentsRepo.sumAllValues();

  const earliestTransactionDate = transactionsRepo.getEarliestTransactionDate();
  const earliestValuationDate = [...investmentValuations, ...propertyValuations, ...liabilityValuations]
    .map((row) => row.asOfDate)
    .sort()[0];
  const earliestDate = [earliestTransactionDate, earliestValuationDate]
    .filter((date): date is string => date !== null && date !== undefined)
    .sort()[0];

  if (!earliestDate) return [];

  const dateAxis = buildMonthlyDateAxis(earliestDate, today);

  return computeNetWorthTrend({
    dateAxis,
    accountSeries,
    investmentValuations,
    activeInvestmentIds,
    propertyValuations,
    activePropertyIds,
    liabilityValuations,
    activeLiabilityIds,
    contentsTotal,
  });
}
