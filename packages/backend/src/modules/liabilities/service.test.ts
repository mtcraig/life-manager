import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { LiabilityRow, ValuationRow } from './repo';

const liabilitiesByName = new Map<string, LiabilityRow>();
const liabilitiesById = new Map<number, LiabilityRow>();
const valuationsByKey = new Map<string, ValuationRow>();
let nextLiabilityId = 1;
let nextValuationId = 1;

vi.mock('./repo', () => ({
  getLiabilityById: vi.fn((id: number) => liabilitiesById.get(id)),
  getLiabilityByName: vi.fn((name: string) => liabilitiesByName.get(name)),
  insertLiability: vi.fn((fields: { name: string; kind: string | null; notes: string | null }) => {
    const row: LiabilityRow = { id: nextLiabilityId++, archivedAt: null, createdAt: Date.now(), updatedAt: Date.now(), ...fields };
    liabilitiesByName.set(fields.name, row);
    liabilitiesById.set(row.id, row);
    return row;
  }),
  archiveLiability: vi.fn((id: number) => {
    const existing = liabilitiesById.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, archivedAt: Date.now() };
    liabilitiesById.set(id, updated);
    return updated;
  }),
  unarchiveLiability: vi.fn((id: number) => {
    const existing = liabilitiesById.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, archivedAt: null };
    liabilitiesById.set(id, updated);
    return updated;
  }),
  listLatestValuationsForAll: vi.fn(() => new Map()),
  insertValuation: vi.fn(
    (liabilityId: number, fields: { asOfDate: string; value: number; notes: string | null }) => {
      const key = `${liabilityId}:${fields.asOfDate}`;
      if (valuationsByKey.has(key)) {
        throw new Error('UNIQUE constraint failed: liability_valuations.liability_id, liability_valuations.as_of_date');
      }
      const row: ValuationRow = { id: nextValuationId++, liabilityId, createdAt: Date.now(), ...fields };
      valuationsByKey.set(key, row);
      return row;
    },
  ),
}));

const { archiveLiability, bulkImportValuations, unarchiveLiability } = await import('./service');

beforeEach(() => {
  liabilitiesByName.clear();
  liabilitiesById.clear();
  valuationsByKey.clear();
  nextLiabilityId = 1;
  nextValuationId = 1;
});

describe('bulkImportValuations', () => {
  it('creates a new liability by name and its valuation', () => {
    const result = bulkImportValuations('entityName,asOfDate,value,notes\nMortgage,2026-01-01,150000,\n');

    expect(result).toEqual({ valuationsCreated: 1, entitiesCreated: 1 });
    expect(liabilitiesByName.get('Mortgage')).toBeDefined();
  });

  it('reuses an existing liability by name instead of creating a duplicate', () => {
    bulkImportValuations('entityName,asOfDate,value\nMortgage,2026-01-01,150000\n');
    const result = bulkImportValuations('entityName,asOfDate,value\nMortgage,2026-02-01,149000\n');

    expect(result).toEqual({ valuationsCreated: 1, entitiesCreated: 0 });
    expect(liabilitiesByName.size).toBe(1);
  });

  it('skips a row whose entity+date valuation already exists', () => {
    bulkImportValuations('entityName,asOfDate,value\nMortgage,2026-01-01,150000\n');
    const result = bulkImportValuations('entityName,asOfDate,value\nMortgage,2026-01-01,150000\n');

    expect(result).toEqual({ valuationsCreated: 0, entitiesCreated: 0 });
  });
});

describe('unarchiveLiability', () => {
  it('clears archivedAt on a previously archived liability', () => {
    bulkImportValuations('entityName,asOfDate,value\nMortgage,2026-01-01,150000\n');
    const id = liabilitiesByName.get('Mortgage')!.id;
    archiveLiability(id);
    expect(liabilitiesById.get(id)?.archivedAt).not.toBeNull();

    const result = unarchiveLiability(id);

    expect(result.archivedAt).toBeNull();
  });

  it('throws a 404 for an unknown liability id', () => {
    expect(() => unarchiveLiability(999)).toThrow();
  });
});
