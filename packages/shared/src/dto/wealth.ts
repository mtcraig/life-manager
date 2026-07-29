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
