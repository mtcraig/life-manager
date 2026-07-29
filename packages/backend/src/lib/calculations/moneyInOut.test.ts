import { describe, expect, it } from 'vitest';
import { computeMoneyInOut } from './moneyInOut';

describe('computeMoneyInOut', () => {
  it('sums positive amounts as money in and negative amounts as money out', () => {
    const result = computeMoneyInOut([
      { amount: 1000, isTransfer: false },
      { amount: -300, isTransfer: false },
      { amount: -200, isTransfer: false },
    ]);
    expect(result).toEqual({ moneyIn: 1000, moneyOut: -500, net: 500 });
  });

  it('excludes is_transfer rows entirely', () => {
    const result = computeMoneyInOut([
      { amount: 1000, isTransfer: false },
      { amount: -5000, isTransfer: true },
      { amount: 5000, isTransfer: true },
    ]);
    expect(result).toEqual({ moneyIn: 1000, moneyOut: 0, net: 1000 });
  });

  it('includes uncategorised transactions (isTransfer: false) in the totals', () => {
    const result = computeMoneyInOut([{ amount: -750, isTransfer: false }]);
    expect(result).toEqual({ moneyIn: 0, moneyOut: -750, net: -750 });
  });

  it('returns zeroes for an empty list', () => {
    expect(computeMoneyInOut([])).toEqual({ moneyIn: 0, moneyOut: 0, net: 0 });
  });
});
