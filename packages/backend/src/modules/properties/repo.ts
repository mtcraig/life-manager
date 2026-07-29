import { desc, eq, isNull } from 'drizzle-orm';
import { db } from '../../db/client';
import { properties, propertyValuations } from '../../db/schema/properties';

export interface PropertyRow {
  id: number;
  name: string;
  address: string | null;
  notes: string | null;
  archivedAt: number | null;
  createdAt: number;
  updatedAt: number;
}

export interface PropertyWriteFields {
  name: string;
  address: string | null;
  notes: string | null;
}

export interface ValuationRow {
  id: number;
  propertyId: number;
  asOfDate: string;
  value: number;
  notes: string | null;
  createdAt: number;
}

export interface ValuationWriteFields {
  asOfDate: string;
  value: number;
  notes: string | null;
}

export function listProperties(includeArchived: boolean): PropertyRow[] {
  if (includeArchived) {
    return db.select().from(properties).all();
  }
  return db.select().from(properties).where(isNull(properties.archivedAt)).all();
}

export function getPropertyById(id: number): PropertyRow | undefined {
  return db.select().from(properties).where(eq(properties.id, id)).get();
}

export function insertProperty(fields: PropertyWriteFields): PropertyRow {
  const now = Date.now();
  return db
    .insert(properties)
    .values({ ...fields, createdAt: now, updatedAt: now })
    .returning()
    .get();
}

export function updateProperty(
  id: number,
  fields: Partial<PropertyWriteFields>,
): PropertyRow | undefined {
  return db
    .update(properties)
    .set({ ...fields, updatedAt: Date.now() })
    .where(eq(properties.id, id))
    .returning()
    .get();
}

export function archiveProperty(id: number): PropertyRow | undefined {
  return db
    .update(properties)
    .set({ archivedAt: Date.now(), updatedAt: Date.now() })
    .where(eq(properties.id, id))
    .returning()
    .get();
}

export function listValuations(propertyId: number): ValuationRow[] {
  return db
    .select()
    .from(propertyValuations)
    .where(eq(propertyValuations.propertyId, propertyId))
    .orderBy(propertyValuations.asOfDate)
    .all();
}

export function insertValuation(propertyId: number, fields: ValuationWriteFields): ValuationRow {
  return db
    .insert(propertyValuations)
    .values({ ...fields, propertyId, createdAt: Date.now() })
    .returning()
    .get();
}

/**
 * Latest recorded value per property (by as_of_date), across every property —
 * used for both the per-property "currentValue" list field and the Wealth
 * aggregation total, so it's fetched once rather than N+1.
 */
export function listLatestValuationsForAll(): Map<number, number> {
  const rows = db
    .select()
    .from(propertyValuations)
    .orderBy(desc(propertyValuations.asOfDate))
    .all();
  const latest = new Map<number, number>();
  for (const row of rows) {
    if (!latest.has(row.propertyId)) {
      latest.set(row.propertyId, row.value);
    }
  }
  return latest;
}
