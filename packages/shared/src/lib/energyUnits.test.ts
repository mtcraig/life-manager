import { describe, expect, it } from 'vitest';
import { normalizeWaterUsageToM3 } from './energyUnits.js';

describe('normalizeWaterUsageToM3', () => {
  it('converts litres to m3', () => {
    expect(normalizeWaterUsageToM3(1500, 'litres')).toBe(1.5);
  });

  it('passes m3 through unchanged', () => {
    expect(normalizeWaterUsageToM3(42.5, 'm3')).toBe(42.5);
  });

  it('normalizes each reading independently before a delta is taken', () => {
    const prior = normalizeWaterUsageToM3(120000, 'litres');
    const current = normalizeWaterUsageToM3(125, 'm3');
    expect(current - prior).toBe(5);
  });
});
