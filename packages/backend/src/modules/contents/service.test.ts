import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { AreaRow } from '../areas/repo';
import type { ContentsItemRow } from './repo';

const areasByName = new Map<string, AreaRow>();
const items: ContentsItemRow[] = [];
let nextAreaId = 1;
let nextItemId = 1;

vi.mock('../areas/repo', () => ({
  getAreaByName: vi.fn((name: string) => areasByName.get(name)),
  insertArea: vi.fn((name: string) => {
    const row: AreaRow = { id: nextAreaId++, name, createdAt: Date.now() };
    areasByName.set(name, row);
    return row;
  }),
}));

vi.mock('./repo', () => ({
  insertContentsItem: vi.fn((fields: Omit<ContentsItemRow, 'id' | 'createdAt' | 'updatedAt'>) => {
    const row: ContentsItemRow = { id: nextItemId++, createdAt: Date.now(), updatedAt: Date.now(), ...fields };
    items.push(row);
    return row;
  }),
}));

const { bulkImportContentsItems } = await import('./service');

beforeEach(() => {
  areasByName.clear();
  items.length = 0;
  nextAreaId = 1;
  nextItemId = 1;
});

describe('bulkImportContentsItems', () => {
  it('creates a new area by name and the item', () => {
    const result = bulkImportContentsItems(
      'name,area,value,purchaseDate,notes\nSofa,Living room,50000,2020-01-01,leather\n',
    );

    expect(result).toEqual({ itemsCreated: 1, areasCreated: 1 });
    expect(areasByName.get('Living room')).toBeDefined();
    expect(items[0]).toMatchObject({ name: 'Sofa', value: 5000000, purchaseDate: '2020-01-01', notes: 'leather' });
  });

  it('reuses an existing area by name instead of creating a duplicate', () => {
    bulkImportContentsItems('name,area,value\nSofa,Living room,50000\n');
    const result = bulkImportContentsItems('name,area,value\nTV,Living room,80000\n');

    expect(result).toEqual({ itemsCreated: 1, areasCreated: 0 });
    expect(areasByName.size).toBe(1);
    expect(items).toHaveLength(2);
  });

  it('treats blank optional columns as null', () => {
    bulkImportContentsItems('name,area,value,purchaseDate,notes\nLamp,Bedroom,2000,,\n');

    expect(items[0]).toMatchObject({ purchaseDate: null, notes: null });
  });

  it('throws on a row missing a required column', () => {
    expect(() => bulkImportContentsItems('name,area,value\nSofa,,50000\n')).toThrow(/missing required column/);
  });

  it('throws on an unparseable numeric value', () => {
    expect(() => bulkImportContentsItems('name,area,value\nSofa,Living room,not-a-number\n')).toThrow(
      /Invalid numeric value/,
    );
  });
});
