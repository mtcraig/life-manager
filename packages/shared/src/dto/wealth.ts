export interface WealthSummaryDto {
  liquidAssets: {
    accountsTotal: number;
    investmentsTotal: number;
    total: number;
  };
  nonLiquidAssets: {
    propertiesTotal: number;
    /** Contents module lands in a later milestone; always 0 until then. */
    contentsTotal: number;
    total: number;
  };
  liabilitiesTotal: number;
  netWealth: number;
}

export interface NetWorthTrendPointDto {
  date: string; // ISO YYYY-MM-DD, a month-end (or today, for the final/current point)
  accountsTotal: number;
  investmentsTotal: number;
  propertiesTotal: number;
  liabilitiesTotal: number;
  contentsTotal: number;
  netWorth: number;
}
