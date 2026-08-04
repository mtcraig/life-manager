import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { EnergyReadingRow } from './repo';
import type { UtilityTariffRow } from './tariffRepo';

let readingRows: EnergyReadingRow[] = [];
const tariffsById = new Map<number, UtilityTariffRow>();
let nextTariffId = 1;

vi.mock('./repo', () => ({
  listEnergyReadings: vi.fn(() => readingRows),
}));

vi.mock('./tariffRepo', () => ({
  listUtilityTariffs: vi.fn(() => [...tariffsById.values()]),
  getUtilityTariffById: vi.fn((id: number) => tariffsById.get(id)),
  insertUtilityTariff: vi.fn((fields: Omit<UtilityTariffRow, 'id' | 'createdAt' | 'updatedAt'>) => {
    const row: UtilityTariffRow = {
      id: nextTariffId++,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      ...fields,
    };
    tariffsById.set(row.id, row);
    return row;
  }),
  updateUtilityTariff: vi.fn((id: number, fields: Partial<UtilityTariffRow>) => {
    const existing = tariffsById.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...fields, updatedAt: Date.now() };
    tariffsById.set(id, updated);
    return updated;
  }),
  deleteUtilityTariff: vi.fn((id: number) => tariffsById.delete(id)),
}));

const { createUtilityTariff, updateUtilityTariff, getUtilityCostSeries } = await import('./service');

function makeTariff(overrides: Partial<UtilityTariffRow> & { id: number }): UtilityTariffRow {
  return {
    meterType: 'electricity',
    providerName: 'Provider A',
    startDate: '2026-01-01',
    endDate: null,
    standingChargePerDay: 0.5,
    unitRate: 0.2,
    wastewaterStandingChargePerDay: null,
    wastewaterUnitRate: null,
    rainwaterRemovalStandingChargePerDay: null,
    notes: null,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    ...overrides,
  };
}

function makeReading(overrides: Partial<EnergyReadingRow> & { id: number }): EnergyReadingRow {
  return {
    meterType: 'electricity',
    readingDate: '2026-01-01',
    value: 0,
    unit: 'kWh',
    notes: null,
    createdAt: Date.now(),
    ...overrides,
  };
}

beforeEach(() => {
  readingRows = [];
  tariffsById.clear();
  nextTariffId = 1;
});

describe('createUtilityTariff', () => {
  it('rejects a tariff that overlaps an existing one for the same meter type', () => {
    tariffsById.set(1, makeTariff({ id: 1, startDate: '2026-01-01', endDate: '2026-02-14' }));

    expect(() =>
      createUtilityTariff({
        meterType: 'electricity',
        providerName: 'Provider B',
        startDate: '2026-02-01',
        endDate: '2026-03-01',
        standingChargePerDay: 0.5,
        unitRate: 0.2,
      }),
    ).toThrow();
  });

  it('allows back-to-back tariffs that do not overlap', () => {
    tariffsById.set(1, makeTariff({ id: 1, startDate: '2026-01-01', endDate: '2026-02-14' }));

    expect(() =>
      createUtilityTariff({
        meterType: 'electricity',
        providerName: 'Provider B',
        startDate: '2026-02-15',
        standingChargePerDay: 0.5,
        unitRate: 0.2,
      }),
    ).not.toThrow();
  });

  it('rejects endDate before startDate', () => {
    expect(() =>
      createUtilityTariff({
        meterType: 'gas',
        providerName: 'Provider A',
        startDate: '2026-02-01',
        endDate: '2026-01-01',
        standingChargePerDay: 0.5,
        unitRate: 0.2,
      }),
    ).toThrow();
  });

  it('rejects a water tariff with only one of the wastewater standing charge/unit rate set', () => {
    expect(() =>
      createUtilityTariff({
        meterType: 'water',
        providerName: 'Water Co',
        startDate: '2026-01-01',
        standingChargePerDay: 0.3,
        unitRate: 1.5,
        wastewaterStandingChargePerDay: 0.2,
      }),
    ).toThrow();
  });

  it('silently nulls wastewater/rainwater fields for non-water meter types even if sent', () => {
    const dto = createUtilityTariff({
      meterType: 'electricity',
      providerName: 'Provider A',
      startDate: '2026-01-01',
      standingChargePerDay: 0.5,
      unitRate: 0.2,
      wastewaterStandingChargePerDay: 0.9,
      wastewaterUnitRate: 0.9,
      rainwaterRemovalStandingChargePerDay: 0.9,
    });

    expect(dto.wastewaterStandingChargePerDay).toBeNull();
    expect(dto.wastewaterUnitRate).toBeNull();
    expect(dto.rainwaterRemovalStandingChargePerDay).toBeNull();
  });
});

describe('updateUtilityTariff', () => {
  it('rejects an update that would overlap another tariff for the same meter type', () => {
    tariffsById.set(1, makeTariff({ id: 1, startDate: '2026-01-01', endDate: '2026-02-14' }));
    tariffsById.set(2, makeTariff({ id: 2, startDate: '2026-02-15', endDate: null }));

    expect(() => updateUtilityTariff(2, { startDate: '2026-02-10' })).toThrow();
  });

  it('throws a 404 for an unknown id', () => {
    expect(() => updateUtilityTariff(999, { providerName: 'X' })).toThrow();
  });
});

describe('getUtilityCostSeries', () => {
  it('always computes against the full reading history so a year boundary is prorated correctly', () => {
    readingRows = [
      makeReading({ id: 1, readingDate: '2025-12-15', value: 0 }),
      makeReading({ id: 2, readingDate: '2026-01-20', value: 360 }),
    ];
    tariffsById.set(
      1,
      makeTariff({ id: 1, startDate: '2025-01-01', endDate: null, standingChargePerDay: 0.5, unitRate: 0.1 }),
    );

    const series = getUtilityCostSeries({ year: 2026 });

    expect(series.granularity).toBe('month');
    expect(series.points).toHaveLength(1);
    // dailyUsageRate = 360/36 days = 10/day; Jan portion of the interval is
    // 2026-01-01 -> 2026-01-20 = 19 days: 0.5*19 + 0.1*(10*19) = 28.5 -> 2850p.
    // Getting this right requires the Dec 2025 reading to still be used to
    // compute the daily rate, even though only the Jan slice appears in output.
    expect(series.points[0]!.period).toBe('2026-01');
    expect(series.points[0]!.electricity).toBe(2850);
  });

  it('returns yearly aggregates when no year is requested', () => {
    readingRows = [
      makeReading({ id: 1, meterType: 'gas', readingDate: '2025-01-01', value: 0, unit: 'm3' }),
      makeReading({ id: 2, meterType: 'gas', readingDate: '2026-01-15', value: 379, unit: 'm3' }),
    ];
    tariffsById.set(
      1,
      makeTariff({
        id: 1,
        meterType: 'gas',
        startDate: '2025-01-01',
        endDate: null,
        standingChargePerDay: 0.2,
        unitRate: 0.3,
      }),
    );

    const series = getUtilityCostSeries({});

    expect(series.granularity).toBe('year');
    expect(series.points.map((p) => p.period)).toEqual(['2025', '2026']);
  });

  it('defaults a meter with no data for a period to 0 rather than omitting it', () => {
    readingRows = [
      makeReading({ id: 1, readingDate: '2026-01-01', value: 0 }),
      makeReading({ id: 2, readingDate: '2026-02-01', value: 100 }),
    ];
    tariffsById.set(1, makeTariff({ id: 1, startDate: '2026-01-01', endDate: null }));

    const series = getUtilityCostSeries({ year: 2026 });

    expect(series.points.every((p) => p.gas === 0 && p.water === 0)).toBe(true);
  });
});
