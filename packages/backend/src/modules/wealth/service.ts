import type { WealthSummaryDto } from '@life-manager/shared';
import * as accountsRepo from '../accounts/repo';
import * as analyticsService from '../analytics/service';
import * as investmentsRepo from '../investments/repo';
import * as propertiesRepo from '../properties/repo';
import * as liabilitiesRepo from '../liabilities/repo';
import * as contentsRepo from '../contents/repo';
import { computeWealthSummary, sumLatestValuations } from '../../lib/calculations/wealth';

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
