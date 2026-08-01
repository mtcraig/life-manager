import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { PropertyRow, ValuationRow } from './repo';

const propertiesByName = new Map<string, PropertyRow>();
const valuationsByKey = new Map<string, ValuationRow>();
let nextPropertyId = 1;
let nextValuationId = 1;

vi.mock('./repo', () => ({
  getPropertyByName: vi.fn((name: string) => propertiesByName.get(name)),
  insertProperty: vi.fn(
    (fields: { name: string; address: string | null; notes: string | null; lat: string | null; lng: string | null }) => {
      const row: PropertyRow = {
        id: nextPropertyId++,
        archivedAt: null,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        ...fields,
      };
      propertiesByName.set(fields.name, row);
      return row;
    },
  ),
  insertValuation: vi.fn(
    (propertyId: number, fields: { asOfDate: string; value: number; notes: string | null }) => {
      const key = `${propertyId}:${fields.asOfDate}`;
      if (valuationsByKey.has(key)) {
        throw new Error('UNIQUE constraint failed: property_valuations.property_id, property_valuations.as_of_date');
      }
      const row: ValuationRow = { id: nextValuationId++, propertyId, createdAt: Date.now(), ...fields };
      valuationsByKey.set(key, row);
      return row;
    },
  ),
}));

const { bulkImportValuations } = await import('./service');

beforeEach(() => {
  propertiesByName.clear();
  valuationsByKey.clear();
  nextPropertyId = 1;
  nextValuationId = 1;
});

describe('bulkImportValuations', () => {
  it('creates a new property by name (no address/geocode) and its valuation', () => {
    const result = bulkImportValuations('entityName,asOfDate,value,notes\nFlat 1,2026-01-01,250000,\n');

    expect(result).toEqual({ valuationsCreated: 1, entitiesCreated: 1 });
    const property = propertiesByName.get('Flat 1');
    expect(property).toMatchObject({ address: null, lat: null, lng: null });
  });

  it('reuses an existing property by name instead of creating a duplicate', () => {
    bulkImportValuations('entityName,asOfDate,value\nFlat 1,2026-01-01,250000\n');
    const result = bulkImportValuations('entityName,asOfDate,value\nFlat 1,2026-02-01,260000\n');

    expect(result).toEqual({ valuationsCreated: 1, entitiesCreated: 0 });
    expect(propertiesByName.size).toBe(1);
  });

  it('skips a row whose entity+date valuation already exists', () => {
    bulkImportValuations('entityName,asOfDate,value\nFlat 1,2026-01-01,250000\n');
    const result = bulkImportValuations('entityName,asOfDate,value\nFlat 1,2026-01-01,250000\n');

    expect(result).toEqual({ valuationsCreated: 0, entitiesCreated: 0 });
  });
});
