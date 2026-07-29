import { describe, expect, it } from 'vitest';
import { monthsBetween, projectFutureValue } from './projection';

describe('projectFutureValue', () => {
  it('compounds principal and contributions monthly at a positive rate', () => {
    const result = projectFutureValue({
      currentValue: 100000,
      monthlyContribution: 10000,
      growthRatePct: 6,
      months: 12,
    });
    // FV = 100000*(1.005)^12 + 10000*((1.005)^12 - 1)/0.005
    expect(result).toBeCloseTo(100000 * Math.pow(1.005, 12) + 10000 * ((Math.pow(1.005, 12) - 1) / 0.005), 6);
    expect(result).toBeGreaterThan(100000 + 10000 * 12);
  });

  it('falls back to linear accumulation when growth rate is zero', () => {
    const result = projectFutureValue({
      currentValue: 50000,
      monthlyContribution: 1000,
      growthRatePct: 0,
      months: 24,
    });
    expect(result).toBe(50000 + 1000 * 24);
  });

  it('returns the current value unchanged when months is zero', () => {
    const result = projectFutureValue({
      currentValue: 75000,
      monthlyContribution: 5000,
      growthRatePct: 4,
      months: 0,
    });
    expect(result).toBe(75000);
  });

  it('handles zero contribution as pure compound growth', () => {
    const result = projectFutureValue({
      currentValue: 100000,
      monthlyContribution: 0,
      growthRatePct: 12,
      months: 12,
    });
    expect(result).toBeCloseTo(100000 * Math.pow(1.01, 12), 6);
  });
});

describe('monthsBetween', () => {
  it('computes whole months between two dates', () => {
    expect(monthsBetween('2026-01-15', '2027-01-15')).toBe(12);
    expect(monthsBetween('2026-01-01', '2026-07-01')).toBe(6);
  });

  it('floors partial months rather than rounding', () => {
    expect(monthsBetween('2026-01-20', '2026-02-10')).toBe(0);
  });

  it('never returns negative months for a past target date', () => {
    expect(monthsBetween('2026-07-29', '2020-01-01')).toBe(0);
  });
});
