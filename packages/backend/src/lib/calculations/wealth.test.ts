import { describe, expect, it } from 'vitest';
import { computeWealthSummary, sumLatestValuations } from './wealth';

describe('computeWealthSummary', () => {
  it('sums liquid, non-liquid, and net wealth correctly', () => {
    const result = computeWealthSummary({
      accountsTotal: 500000,
      investmentsTotal: 200000,
      propertiesTotal: 30000000,
      contentsTotal: 125000,
      liabilitiesTotal: 20000000,
    });

    expect(result.liquidAssets).toEqual({
      accountsTotal: 500000,
      investmentsTotal: 200000,
      total: 700000,
    });
    expect(result.nonLiquidAssets).toEqual({
      propertiesTotal: 30000000,
      contentsTotal: 125000,
      total: 30125000,
    });
    expect(result.liabilitiesTotal).toBe(20000000);
    expect(result.netWealth).toBe(700000 + 30125000 - 20000000);
  });

  it('allows net wealth to go negative when liabilities exceed assets', () => {
    const result = computeWealthSummary({
      accountsTotal: 0,
      investmentsTotal: 0,
      propertiesTotal: 0,
      contentsTotal: 0,
      liabilitiesTotal: 500000,
    });
    expect(result.netWealth).toBe(-500000);
  });

  it('handles all-zero totals', () => {
    const result = computeWealthSummary({
      accountsTotal: 0,
      investmentsTotal: 0,
      propertiesTotal: 0,
      contentsTotal: 0,
      liabilitiesTotal: 0,
    });
    expect(result.netWealth).toBe(0);
  });
});

describe('sumLatestValuations', () => {
  it('sums the latest valuation for each requested entity id', () => {
    const latestByEntity = new Map([
      [1, 100000],
      [2, 250000],
      [3, 75000],
    ]);
    expect(sumLatestValuations([1, 2, 3], latestByEntity)).toBe(425000);
  });

  it('treats an entity with no valuation as zero', () => {
    const latestByEntity = new Map([[1, 100000]]);
    expect(sumLatestValuations([1, 2], latestByEntity)).toBe(100000);
  });

  it('returns zero for an empty entity list', () => {
    expect(sumLatestValuations([], new Map())).toBe(0);
  });
});
