import { describe, expect, it } from 'vitest';
import { computeForecast } from './forecast';
import type { ForecastRecurringItem } from './forecast';

const BASE_PARAMS = {
  currentBalance: 100000,
  recurringItems: [] as ForecastRecurringItem[],
  variableCategoryMonthlyAverages: new Map<number, number>(),
  horizonDays: 10,
  fromDate: '2026-08-01',
  comfortableThreshold: 20000,
};

describe('computeForecast', () => {
  it('produces a flat projection with no recurring items and no variable spend', () => {
    const result = computeForecast(BASE_PARAMS);
    expect(result.points).toHaveLength(10);
    expect(result.points.every((p) => p.projectedBalance === 100000)).toBe(true);
    expect(result.events).toEqual([]);
  });

  it('applies a monthly recurring bill on its projected date within the horizon', () => {
    const result = computeForecast({
      ...BASE_PARAMS,
      recurringItems: [
        { normalizedDescription: 'MORTGAGE', categoryId: 20, averageAmount: -50000, cadence: 'monthly', confidence: 'high', lastDate: '2026-07-03' },
      ],
      horizonDays: 10,
    });
    // lastDate + 30 days = 2026-08-02, within [2026-08-01, 2026-08-11)
    const eventPoint = result.points.find((p) => p.date === '2026-08-02')!;
    expect(eventPoint.projectedBalance).toBe(50000);
    expect(result.events).toEqual([
      {
        date: '2026-08-02',
        description: 'MORTGAGE',
        amount: -50000,
        categoryId: 20,
        confidence: 'high',
        runningBalance: 50000,
      },
    ]);
  });

  it('rolls a stale lastDate forward into the horizon rather than posting in the past', () => {
    const result = computeForecast({
      ...BASE_PARAMS,
      recurringItems: [
        { normalizedDescription: 'RENT', categoryId: 20, averageAmount: -80000, cadence: 'monthly', confidence: 'high', lastDate: '2026-06-15' },
      ],
      fromDate: '2026-08-01',
      horizonDays: 20,
    });
    // 06-15 -> 07-15 -> 08-14 is the first occurrence on/after fromDate
    expect(result.events).toHaveLength(1);
    expect(result.events[0]!.date).toBe('2026-08-14');
  });

  it('applies a weekly recurring item on every occurrence within the horizon', () => {
    const result = computeForecast({
      ...BASE_PARAMS,
      recurringItems: [
        { normalizedDescription: 'CLEANER', categoryId: 3, averageAmount: -2000, cadence: 'weekly', confidence: 'high', lastDate: '2026-07-25' },
      ],
      horizonDays: 14,
    });
    expect(result.events.map((e) => e.date)).toEqual(['2026-08-01', '2026-08-08']);
  });

  it('spreads variable category spend as a smoothed daily decrement', () => {
    const result = computeForecast({
      ...BASE_PARAMS,
      variableCategoryMonthlyAverages: new Map([[2, 31000]]), // 31000 pence over a 31-day month = 1000/day
      horizonDays: 3,
    });
    expect(result.points).toEqual([
      { date: '2026-08-01', projectedBalance: 99000 },
      { date: '2026-08-02', projectedBalance: 98000 },
      { date: '2026-08-03', projectedBalance: 97000 },
    ]);
  });

  it('excludes variable spend for a category already represented by a recurring item, to avoid double-counting', () => {
    const result = computeForecast({
      ...BASE_PARAMS,
      recurringItems: [
        { normalizedDescription: 'ENERGY DD', categoryId: 3, averageAmount: -9000, cadence: 'monthly', confidence: 'high', lastDate: '2026-07-01' },
      ],
      variableCategoryMonthlyAverages: new Map([[3, 31000]]),
      horizonDays: 3,
    });
    expect(result.points.every((p) => p.projectedBalance === 100000)).toBe(true);
  });

  it('classifies day health against the comfortable threshold', () => {
    const result = computeForecast({
      ...BASE_PARAMS,
      currentBalance: 25000,
      recurringItems: [
        // lastDate + 30 days = 2026-08-02, i.e. the second day of the horizon
        { normalizedDescription: 'BIG BILL', categoryId: 20, averageAmount: -30000, cadence: 'monthly', confidence: 'high', lastDate: '2026-07-03' },
      ],
      comfortableThreshold: 20000,
      horizonDays: 3,
    });
    expect(result.health[0]!.status).toBe('comfortable'); // 2026-08-01: 25000 >= 20000, no event yet
    expect(result.health[1]!.status).toBe('belowZero'); // 2026-08-02: 25000 - 30000 = -5000
  });

  it('finds the lowest point across the whole horizon, not just the final day', () => {
    const result = computeForecast({
      ...BASE_PARAMS,
      recurringItems: [
        { normalizedDescription: 'BILL', categoryId: 20, averageAmount: -60000, cadence: 'monthly', confidence: 'high', lastDate: '2026-07-05' },
        { normalizedDescription: 'SALARY', categoryId: 5, averageAmount: 200000, cadence: 'monthly', confidence: 'high', lastDate: '2026-07-01' },
      ],
      horizonDays: 15,
    });
    // BILL posts on 08-04 (100000 -> 40000), SALARY posts on 07-31 rolled to 08-30 (outside horizon)
    expect(result.projectedLow.balance).toBe(40000);
    expect(result.projectedLow.date).toBe('2026-08-04');
  });
});
