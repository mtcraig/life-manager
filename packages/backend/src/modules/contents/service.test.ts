import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { AreaRow } from '../areas/repo';
import type { PropertyRow } from '../properties/repo';
import type { ContentsItemRow } from './repo';

const areasByName = new Map<string, AreaRow>();
const propertiesByName = new Map<string, PropertyRow>();
const items: ContentsItemRow[] = [];
let nextAreaId = 1;
let nextPropertyId = 1;
let nextItemId = 1;

function makePropertyRow(name: string, archivedAt: number | null = null): PropertyRow {
  return {
    id: nextPropertyId++,
    name,
    address: null,
    notes: null,
    lat: null,
    lng: null,
    archivedAt,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

vi.mock('../areas/repo', () => ({
  getAreaByName: vi.fn((name: string) => areasByName.get(name)),
  insertArea: vi.fn((name: string) => {
    const row: AreaRow = { id: nextAreaId++, name, createdAt: Date.now() };
    areasByName.set(name, row);
    return row;
  }),
}));

vi.mock('../properties/repo', () => ({
  getPropertyByName: vi.fn((name: string) => propertiesByName.get(name)),
  listProperties: vi.fn((includeArchived: boolean) => {
    const all = [...propertiesByName.values()].sort((a, b) => a.name.localeCompare(b.name));
    return includeArchived ? all : all.filter((p) => p.archivedAt === null);
  }),
}));

vi.mock('./repo', () => ({
  insertContentsItem: vi.fn((fields: Omit<ContentsItemRow, 'id' | 'createdAt' | 'updatedAt'>) => {
    const row: ContentsItemRow = { id: nextItemId++, createdAt: Date.now(), updatedAt: Date.now(), ...fields };
    items.push(row);
    return row;
  }),
  getContentsItemById: vi.fn((id: number) => items.find((item) => item.id === id)),
  updateContentsItem: vi.fn((id: number, fields: Partial<ContentsItemRow>) => {
    const index = items.findIndex((item) => item.id === id);
    if (index === -1) return undefined;
    items[index] = { ...items[index]!, ...fields, updatedAt: Date.now() };
    return items[index];
  }),
}));

const { bulkImportContentsItems, createContentsItem, updateContentsItem } = await import('./service');

beforeEach(() => {
  areasByName.clear();
  propertiesByName.clear();
  items.length = 0;
  nextAreaId = 1;
  nextPropertyId = 1;
  nextItemId = 1;
  // A default active property so existing tests that omit the "property" column keep resolving
  // via the top-active-property fallback, mirroring the common "most people have one place" case.
  const home = makePropertyRow('Home');
  propertiesByName.set(home.name, home);
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

  it('resolves an explicit property column by name', () => {
    const cottage = makePropertyRow('Cottage');
    propertiesByName.set(cottage.name, cottage);

    bulkImportContentsItems('name,area,property,value\nSofa,Living room,Cottage,50000\n');

    expect(items[0]).toMatchObject({ propertyId: cottage.id });
  });

  it('defaults to the top active property when the property column is blank', () => {
    const home = propertiesByName.get('Home')!;

    bulkImportContentsItems('name,area,property,value\nSofa,Living room,,50000\n');

    expect(items[0]).toMatchObject({ propertyId: home.id });
  });

  it('defaults to the top active property when the property column is omitted entirely', () => {
    const home = propertiesByName.get('Home')!;

    bulkImportContentsItems('name,area,value\nSofa,Living room,50000\n');

    expect(items[0]).toMatchObject({ propertyId: home.id });
  });

  it('throws on an unrecognized property name rather than creating one', () => {
    expect(() =>
      bulkImportContentsItems('name,area,property,value\nSofa,Living room,Nonexistent,50000\n'),
    ).toThrow(/Unknown property "Nonexistent"/);
  });

  it('throws a clear error when no active property exists and none is specified', () => {
    propertiesByName.clear();

    expect(() => bulkImportContentsItems('name,area,value\nSofa,Living room,50000\n')).toThrow(
      /No active property exists/,
    );
  });

  it('ignores an archived property for the default but still allows selecting it by name', () => {
    propertiesByName.clear();
    const archived = makePropertyRow('Old Cottage', Date.now());
    propertiesByName.set(archived.name, archived);

    expect(() => bulkImportContentsItems('name,area,value\nSofa,Living room,50000\n')).toThrow(
      /No active property exists/,
    );

    bulkImportContentsItems('name,area,property,value\nSofa,Living room,Old Cottage,50000\n');
    expect(items[0]).toMatchObject({ propertyId: archived.id });
  });
});

describe('createContentsItem', () => {
  it('round-trips the required propertyId', () => {
    const dto = createContentsItem({
      name: 'Sofa',
      areaId: 1,
      propertyId: 7,
      value: 50000,
    });

    expect(dto.propertyId).toBe(7);
  });
});

describe('updateContentsItem', () => {
  it('updates propertyId when provided', () => {
    const created = createContentsItem({ name: 'Sofa', areaId: 1, propertyId: 7, value: 50000 });

    const updated = updateContentsItem(created.id, { propertyId: 9 });

    expect(updated.propertyId).toBe(9);
  });

  it('leaves propertyId untouched when omitted from the update', () => {
    const created = createContentsItem({ name: 'Sofa', areaId: 1, propertyId: 7, value: 50000 });

    const updated = updateContentsItem(created.id, { name: 'Sofa bed' });

    expect(updated.propertyId).toBe(7);
    expect(updated.name).toBe('Sofa bed');
  });
});
