import { describe, expect, it } from 'vitest';
import { parseMoneyToMinorUnits } from './money';

describe('parseMoneyToMinorUnits', () => {
  it('parses a plain amount', () => {
    expect(parseMoneyToMinorUnits('12.34')).toBe(1234);
  });

  it('parses a currency-symbol amount with thousands separators', () => {
    expect(parseMoneyToMinorUnits('£1,234.56')).toBe(123456);
  });

  it('parses a parenthesised negative amount', () => {
    expect(parseMoneyToMinorUnits('(12.34)')).toBe(-1234);
  });

  it('strips embedded double quotes around an amount', () => {
    expect(parseMoneyToMinorUnits('"1,234.56"')).toBe(123456);
  });

  it('strips embedded single quotes around an amount', () => {
    expect(parseMoneyToMinorUnits("'99.99'")).toBe(9999);
  });

  it('strips quotes around a parenthesised negative amount', () => {
    expect(parseMoneyToMinorUnits('"(12.34)"')).toBe(-1234);
  });

  it('throws for an unparseable amount', () => {
    expect(() => parseMoneyToMinorUnits('not-a-number')).toThrow(/Cannot parse amount/);
  });
});
