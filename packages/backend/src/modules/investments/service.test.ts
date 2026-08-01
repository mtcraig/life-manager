import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { InvestmentRow, ValuationRow } from './repo';

const investmentsByName = new Map<string, InvestmentRow>();
const valuationsByKey = new Map<string, ValuationRow>();
let nextInvestmentId = 1;
let nextValuationId = 1;

vi.mock('./repo', () => ({
  getInvestmentByName: vi.fn((name: string) => investmentsByName.get(name)),
  insertInvestment: vi.fn((fields: { name: string; kind: string | null; notes: string | null }) => {
    const row: InvestmentRow = {
      id: nextInvestmentId++,
      name: fields.name,
      kind: fields.kind,
      notes: fields.notes,
      archivedAt: null,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    investmentsByName.set(fields.name, row);
    return row;
  }),
  insertValuation: vi.fn(
    (investmentId: number, fields: { asOfDate: string; value: number; notes: string | null }) => {
      const key = `${investmentId}:${fields.asOfDate}`;
      if (valuationsByKey.has(key)) {
        throw new Error('UNIQUE constraint failed: investment_valuations.investment_id, investment_valuations.as_of_date');
      }
      const row: ValuationRow = { id: nextValuationId++, investmentId, createdAt: Date.now(), ...fields };
      valuationsByKey.set(key, row);
      return row;
    },
  ),
}));

const { bulkImportValuations } = await import('./service');

beforeEach(() => {
  investmentsByName.clear();
  valuationsByKey.clear();
  nextInvestmentId = 1;
  nextValuationId = 1;
});

describe('bulkImportValuations', () => {
  it('creates a new investment by name and its valuation', () => {
    const result = bulkImportValuations('entityName,asOfDate,value,notes\nISA,2026-01-01,1000.50,opening');

    expect(result).toEqual({ valuationsCreated: 1, entitiesCreated: 1 });
    expect(investmentsByName.get('ISA')).toBeDefined();
    expect(valuationsByKey.get('1:2026-01-01')).toMatchObject({ value: 100050, notes: 'opening' });
  });

  it('reuses an existing investment by name instead of creating a duplicate', () => {
    bulkImportValuations('entityName,asOfDate,value,notes\nISA,2026-01-01,1000,\n');
    const result = bulkImportValuations('entityName,asOfDate,value,notes\nISA,2026-02-01,1100,\n');

    expect(result).toEqual({ valuationsCreated: 1, entitiesCreated: 0 });
    expect(investmentsByName.size).toBe(1);
  });

  it('skips a row whose entity+date valuation already exists, so re-pasting is safe', () => {
    bulkImportValuations('entityName,asOfDate,value,notes\nISA,2026-01-01,1000,\n');
    const result = bulkImportValuations('entityName,asOfDate,value,notes\nISA,2026-01-01,1000,\n');

    expect(result).toEqual({ valuationsCreated: 0, entitiesCreated: 0 });
  });

  it('throws on a row missing a required column', () => {
    expect(() => bulkImportValuations('entityName,asOfDate,value\nISA,2026-01-01,\n')).toThrow(
      /missing required column/,
    );
  });

  it('throws on an unparseable numeric value', () => {
    expect(() =>
      bulkImportValuations('entityName,asOfDate,value\nISA,2026-01-01,not-a-number\n'),
    ).toThrow(/Invalid numeric value/);
  });
});
