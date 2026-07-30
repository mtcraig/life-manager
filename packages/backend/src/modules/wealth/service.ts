import type { WealthSummaryDto } from '@life-manager/shared';
import * as accountsRepo from '../accounts/repo';
import * as transactionsRepo from '../transactions/repo';
import * as investmentsRepo from '../investments/repo';
import * as propertiesRepo from '../properties/repo';
import * as liabilitiesRepo from '../liabilities/repo';
import * as contentsRepo from '../contents/repo';
import { computeWealthSummary, sumLatestValuations } from '../../lib/calculations/wealth';

export function getWealthSummary(): WealthSummaryDto {
  const activeAccountIds = accountsRepo.listAccounts().map((a) => a.id);
  const accountTotals = transactionsRepo.sumAmountsByAccount();
  const accountsTotal = activeAccountIds.reduce(
    (sum, id) => sum + (accountTotals.get(id) ?? 0),
    0,
  );

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
  const liabilitiesTotal = sumLatestValuations(
    activeLiabilityIds,
    liabilitiesRepo.listLatestValuationsForAll(),
  );

  return computeWealthSummary({
    accountsTotal,
    investmentsTotal,
    propertiesTotal,
    contentsTotal,
    liabilitiesTotal,
  });
}
