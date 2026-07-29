export interface WealthSummaryInput {
  accountsTotal: number;
  investmentsTotal: number;
  propertiesTotal: number;
  contentsTotal: number;
  liabilitiesTotal: number;
}

export interface WealthSummaryResult {
  liquidAssets: { accountsTotal: number; investmentsTotal: number; total: number };
  nonLiquidAssets: { propertiesTotal: number; contentsTotal: number; total: number };
  liabilitiesTotal: number;
  netWealth: number;
}

/**
 * Liquid assets = accounts + investments. Non-liquid assets = properties +
 * contents. Net wealth = liquid + non-liquid − liabilities. Each input total
 * is pre-computed by the caller (summed transaction amounts for accounts,
 * latest valuation per entity for investments/properties/liabilities), since
 * that step needs DB access and this function stays pure for testability.
 */
export function computeWealthSummary(input: WealthSummaryInput): WealthSummaryResult {
  const { accountsTotal, investmentsTotal, propertiesTotal, contentsTotal, liabilitiesTotal } = input;
  const liquidTotal = accountsTotal + investmentsTotal;
  const nonLiquidTotal = propertiesTotal + contentsTotal;

  return {
    liquidAssets: { accountsTotal, investmentsTotal, total: liquidTotal },
    nonLiquidAssets: { propertiesTotal, contentsTotal, total: nonLiquidTotal },
    liabilitiesTotal,
    netWealth: liquidTotal + nonLiquidTotal - liabilitiesTotal,
  };
}

/** Sums each entity's latest valuation, treating an entity with no valuation yet as 0. */
export function sumLatestValuations(entityIds: number[], latestByEntity: Map<number, number>): number {
  let total = 0;
  for (const id of entityIds) {
    total += latestByEntity.get(id) ?? 0;
  }
  return total;
}
