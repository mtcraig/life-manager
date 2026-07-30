import { and, desc, eq, isNull } from 'drizzle-orm';
import { db } from '../../db/client';
import { liabilities, liabilityValuations } from '../../db/schema/liabilities';

export interface LiabilityRow {
  id: number;
  name: string;
  kind: string | null;
  notes: string | null;
  archivedAt: number | null;
  createdAt: number;
  updatedAt: number;
}

export interface LiabilityWriteFields {
  name: string;
  kind: string | null;
  notes: string | null;
}

export interface ValuationRow {
  id: number;
  liabilityId: number;
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

export function listLiabilities(includeArchived: boolean): LiabilityRow[] {
  if (includeArchived) {
    return db.select().from(liabilities).all();
  }
  return db.select().from(liabilities).where(isNull(liabilities.archivedAt)).all();
}

export function getLiabilityById(id: number): LiabilityRow | undefined {
  return db.select().from(liabilities).where(eq(liabilities.id, id)).get();
}

export function insertLiability(fields: LiabilityWriteFields): LiabilityRow {
  const now = Date.now();
  return db
    .insert(liabilities)
    .values({ ...fields, createdAt: now, updatedAt: now })
    .returning()
    .get();
}

export function updateLiability(
  id: number,
  fields: Partial<LiabilityWriteFields>,
): LiabilityRow | undefined {
  return db
    .update(liabilities)
    .set({ ...fields, updatedAt: Date.now() })
    .where(eq(liabilities.id, id))
    .returning()
    .get();
}

export function archiveLiability(id: number): LiabilityRow | undefined {
  return db
    .update(liabilities)
    .set({ archivedAt: Date.now(), updatedAt: Date.now() })
    .where(eq(liabilities.id, id))
    .returning()
    .get();
}

/** Cascades: valuations have no onDelete cascade at the FK level, so they're
 * deleted before the liability, all inside one transaction. */
export function deleteLiability(id: number): boolean {
  return db.transaction((tx) => {
    tx.delete(liabilityValuations).where(eq(liabilityValuations.liabilityId, id)).run();
    const result = tx.delete(liabilities).where(eq(liabilities.id, id)).run();
    return result.changes > 0;
  });
}

export function listValuations(liabilityId: number): ValuationRow[] {
  return db
    .select()
    .from(liabilityValuations)
    .where(eq(liabilityValuations.liabilityId, liabilityId))
    .orderBy(liabilityValuations.asOfDate)
    .all();
}

export function insertValuation(liabilityId: number, fields: ValuationWriteFields): ValuationRow {
  return db
    .insert(liabilityValuations)
    .values({ ...fields, liabilityId, createdAt: Date.now() })
    .returning()
    .get();
}

export function getValuationById(liabilityId: number, valuationId: number): ValuationRow | undefined {
  return db
    .select()
    .from(liabilityValuations)
    .where(and(eq(liabilityValuations.id, valuationId), eq(liabilityValuations.liabilityId, liabilityId)))
    .get();
}

export function updateValuation(
  liabilityId: number,
  valuationId: number,
  fields: Partial<ValuationWriteFields>,
): ValuationRow | undefined {
  return db
    .update(liabilityValuations)
    .set(fields)
    .where(and(eq(liabilityValuations.id, valuationId), eq(liabilityValuations.liabilityId, liabilityId)))
    .returning()
    .get();
}

export function deleteValuation(liabilityId: number, valuationId: number): boolean {
  const result = db
    .delete(liabilityValuations)
    .where(and(eq(liabilityValuations.id, valuationId), eq(liabilityValuations.liabilityId, liabilityId)))
    .run();
  return result.changes > 0;
}

/**
 * Latest recorded value per liability (by as_of_date), across every liability —
 * used for both the per-liability "currentValue" list field and the Wealth
 * aggregation total, so it's fetched once rather than N+1.
 */
export function listLatestValuationsForAll(): Map<number, number> {
  const rows = db
    .select()
    .from(liabilityValuations)
    .orderBy(desc(liabilityValuations.asOfDate))
    .all();
  const latest = new Map<number, number>();
  for (const row of rows) {
    if (!latest.has(row.liabilityId)) {
      latest.set(row.liabilityId, row.value);
    }
  }
  return latest;
}
