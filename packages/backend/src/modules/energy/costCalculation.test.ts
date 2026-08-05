import { describe, expect, it } from 'vitest';
import {
  aggregateToYears,
  aggregateUsageToYears,
  calculateMonthlyCosts,
  calculateMonthlyUsage,
  type TariffPeriod,
} from './costCalculation';

function tariff(overrides: Partial<TariffPeriod> & Pick<TariffPeriod, 'startDate'>): TariffPeriod {
  return {
    endDate: null,
    standingChargePerDay: 0,
    unitRate: 0,
    wastewaterStandingChargePerDay: null,
    wastewaterUnitRate: null,
    rainwaterRemovalStandingChargePerDay: null,
    calorificValue: null,
    ...overrides,
  };
}

describe('calculateMonthlyCosts', () => {
  it('computes cost for a single interval fully within one tariff and one month', () => {
    const readings = [
      { readingDate: '2026-01-01', value: 100 },
      { readingDate: '2026-01-11', value: 150 },
    ];
    const tariffs = [tariff({ startDate: '2026-01-01', standingChargePerDay: 0.5, unitRate: 0.2 })];

    const result = calculateMonthlyCosts(readings, tariffs, 'electricity');

    expect(result).toHaveLength(1);
    expect(result[0]!.month).toBe('2026-01');
    expect(result[0]!.cost).toBeCloseTo(0.5 * 10 + 0.2 * 50, 6);
  });

  it('prorates cost across a tariff rate change mid-interval', () => {
    const readings = [
      { readingDate: '2026-01-01', value: 0 },
      { readingDate: '2026-01-21', value: 200 },
    ];
    const tariffs = [
      tariff({ startDate: '2026-01-01', endDate: '2026-01-12', standingChargePerDay: 0.5, unitRate: 0.1 }),
      tariff({ startDate: '2026-01-13', endDate: null, standingChargePerDay: 0.6, unitRate: 0.12 }),
    ];

    const result = calculateMonthlyCosts(readings, tariffs, 'electricity');

    expect(result).toHaveLength(1);
    expect(result[0]!.month).toBe('2026-01');
    const expectedFirst = 0.5 * 12 + 0.1 * (10 * 12);
    const expectedSecond = 0.6 * 8 + 0.12 * (10 * 8);
    expect(result[0]!.cost).toBeCloseTo(expectedFirst + expectedSecond, 6);
  });

  it('splits cost across a calendar-month boundary proportionally by days', () => {
    const readings = [
      { readingDate: '2026-01-25', value: 0 },
      { readingDate: '2026-02-05', value: 110 },
    ];
    const tariffs = [tariff({ startDate: '2026-01-01', standingChargePerDay: 1, unitRate: 0.05 })];

    const result = calculateMonthlyCosts(readings, tariffs, 'electricity');

    expect(result).toHaveLength(2);
    expect(result[0]!.month).toBe('2026-01');
    expect(result[0]!.cost).toBeCloseTo(1 * 7 + 0.05 * (10 * 7), 6);
    expect(result[1]!.month).toBe('2026-02');
    expect(result[1]!.cost).toBeCloseTo(1 * 4 + 0.05 * (10 * 4), 6);
    expect(result[0]!.cost + result[1]!.cost).toBeCloseTo(1 * 11 + 0.05 * 110, 6);
  });

  it('converts gas usage from m3 to kWh via the volume correction factor and calorific value before applying the unit rate', () => {
    const readings = [
      { readingDate: '2026-01-01', value: 0 },
      { readingDate: '2026-02-01', value: 310 },
    ];
    const tariffs = [
      tariff({ startDate: '2026-01-01', standingChargePerDay: 0.3, unitRate: 0.06, calorificValue: 39.5 }),
    ];

    const result = calculateMonthlyCosts(readings, tariffs, 'gas');

    const usageKwh = (310 * 1.02264 * 39.5) / 3.6;
    expect(result).toHaveLength(1);
    expect(result[0]!.cost).toBeCloseTo(0.3 * 31 + 0.06 * usageKwh, 6);
  });

  it('computes water cost from just the freshwater component when wastewater/rainwater are unset', () => {
    const readings = [
      { readingDate: '2026-01-01', value: 0 },
      { readingDate: '2026-01-11', value: 50 },
    ];
    const tariffs = [tariff({ startDate: '2026-01-01', standingChargePerDay: 0.3, unitRate: 1.5 })];

    const result = calculateMonthlyCosts(readings, tariffs, 'water');

    expect(result).toHaveLength(1);
    expect(result[0]!.cost).toBeCloseTo(0.3 * 10 + 1.5 * 50, 6);
    expect(Number.isNaN(result[0]!.cost)).toBe(false);
  });

  it('sums all three water components when configured', () => {
    const readings = [
      { readingDate: '2026-01-01', value: 0 },
      { readingDate: '2026-01-11', value: 50 },
    ];
    const tariffs = [
      tariff({
        startDate: '2026-01-01',
        standingChargePerDay: 0.3,
        unitRate: 1.5,
        wastewaterStandingChargePerDay: 0.2,
        wastewaterUnitRate: 0.8,
        rainwaterRemovalStandingChargePerDay: 0.1,
      }),
    ];

    const result = calculateMonthlyCosts(readings, tariffs, 'water');

    const freshwater = 0.3 * 10 + 1.5 * 50;
    const wastewater = 0.2 * 10 + 0.8 * 50;
    const rainwater = 0.1 * 10;
    expect(result[0]!.cost).toBeCloseTo(freshwater + wastewater + rainwater, 6);
  });

  it('contributes zero cost for a sub-interval with no covering tariff', () => {
    const readings = [
      { readingDate: '2026-01-01', value: 0 },
      { readingDate: '2026-01-21', value: 200 },
    ];
    const tariffs = [tariff({ startDate: '2026-01-10', endDate: null, standingChargePerDay: 0.4, unitRate: 0.2 })];

    const result = calculateMonthlyCosts(readings, tariffs, 'electricity');

    expect(result).toHaveLength(1);
    const expectedCovered = 0.4 * 11 + 0.2 * (10 * 11);
    expect(result[0]!.cost).toBeCloseTo(expectedCovered, 6);
  });

  it('contributes nothing for the first reading, which has no prior reading to diff against', () => {
    const result = calculateMonthlyCosts(
      [{ readingDate: '2026-01-01', value: 100 }],
      [tariff({ startDate: '2026-01-01', standingChargePerDay: 1, unitRate: 1 })],
      'electricity',
    );
    expect(result).toEqual([]);
  });
});

describe('aggregateToYears', () => {
  it('sums monthly points sharing a year prefix', () => {
    const result = aggregateToYears([
      { month: '2025-11', cost: 10 },
      { month: '2025-12', cost: 20 },
      { month: '2026-01', cost: 5 },
    ]);

    expect(result).toEqual([
      { year: '2025', cost: 30 },
      { year: '2026', cost: 5 },
    ]);
  });
});

describe('calculateMonthlyUsage', () => {
  it('computes prorated usage for a single interval fully within one month', () => {
    const readings = [
      { readingDate: '2026-01-01', value: 100 },
      { readingDate: '2026-01-11', value: 150 },
    ];

    const result = calculateMonthlyUsage(readings);

    expect(result).toHaveLength(1);
    expect(result[0]!.month).toBe('2026-01');
    expect(result[0]!.usage).toBeCloseTo(50, 6);
  });

  it('splits usage across a calendar-month boundary proportionally by days', () => {
    const readings = [
      { readingDate: '2026-01-25', value: 0 },
      { readingDate: '2026-02-05', value: 110 },
    ];

    const result = calculateMonthlyUsage(readings);

    expect(result).toHaveLength(2);
    expect(result[0]!.month).toBe('2026-01');
    expect(result[0]!.usage).toBeCloseTo(10 * 7, 6);
    expect(result[1]!.month).toBe('2026-02');
    expect(result[1]!.usage).toBeCloseTo(10 * 4, 6);
  });

  it('contributes nothing for the first reading, which has no prior reading to diff against', () => {
    const result = calculateMonthlyUsage([{ readingDate: '2026-01-01', value: 100 }]);
    expect(result).toEqual([]);
  });
});

describe('aggregateUsageToYears', () => {
  it('sums monthly usage points sharing a year prefix', () => {
    const result = aggregateUsageToYears([
      { month: '2025-11', usage: 10 },
      { month: '2025-12', usage: 20 },
      { month: '2026-01', usage: 5 },
    ]);

    expect(result).toEqual([
      { year: '2025', usage: 30 },
      { year: '2026', usage: 5 },
    ]);
  });
});
