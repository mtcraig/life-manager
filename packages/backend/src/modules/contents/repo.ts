import { eq, sql } from 'drizzle-orm';
import { db } from '../../db/client';
import { contentsItems } from '../../db/schema/contents-items';

export interface ContentsItemRow {
  id: number;
  name: string;
  areaId: number;
  value: number;
  purchaseDate: string | null;
  notes: string | null;
  createdAt: number;
  updatedAt: number;
}

export interface ContentsItemWriteFields {
  name: string;
  areaId: number;
  value: number;
  purchaseDate: string | null;
  notes: string | null;
}

export function listContentsItems(): ContentsItemRow[] {
  return db.select().from(contentsItems).all();
}

export function getContentsItemById(id: number): ContentsItemRow | undefined {
  return db.select().from(contentsItems).where(eq(contentsItems.id, id)).get();
}

export function insertContentsItem(fields: ContentsItemWriteFields): ContentsItemRow {
  const now = Date.now();
  return db
    .insert(contentsItems)
    .values({ ...fields, createdAt: now, updatedAt: now })
    .returning()
    .get();
}

export function updateContentsItem(
  id: number,
  fields: Partial<ContentsItemWriteFields>,
): ContentsItemRow | undefined {
  return db
    .update(contentsItems)
    .set({ ...fields, updatedAt: Date.now() })
    .where(eq(contentsItems.id, id))
    .returning()
    .get();
}

export function deleteContentsItem(id: number): boolean {
  const result = db.delete(contentsItems).where(eq(contentsItems.id, id)).run();
  return result.changes > 0;
}

/** Total value of every contents item — the Wealth aggregation's contents figure. */
export function sumAllValues(): number {
  const { total } = db
    .select({ total: sql<number>`coalesce(sum(${contentsItems.value}), 0)` })
    .from(contentsItems)
    .get() as { total: number };
  return total;
}
