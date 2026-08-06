import { asc, desc, eq } from 'drizzle-orm';
import { db } from '../../db/client';
import { categorisationRules } from '../../db/schema/categorisation-rules';

export interface CategorisationRuleRow {
  id: number;
  pattern: string;
  categoryId: number;
  vendorId: number;
  matchType: string;
  priority: number;
  source: string;
  createdAt: number;
  updatedAt: number;
}

export interface CategorisationRuleWriteFields {
  pattern: string;
  categoryId: number;
  vendorId: number;
  matchType: string;
  priority: number;
  source: string;
}

/** Ordered by priority (desc) then id (asc) — the order the matcher relies on for tie-breaking. */
export function listRules(): CategorisationRuleRow[] {
  return db
    .select()
    .from(categorisationRules)
    .orderBy(desc(categorisationRules.priority), asc(categorisationRules.id))
    .all();
}

export function getRuleById(id: number): CategorisationRuleRow | undefined {
  return db.select().from(categorisationRules).where(eq(categorisationRules.id, id)).get();
}

export function insertRule(fields: CategorisationRuleWriteFields): CategorisationRuleRow {
  const now = Date.now();
  return db
    .insert(categorisationRules)
    .values({ ...fields, createdAt: now, updatedAt: now })
    .returning()
    .get();
}

export function updateRule(
  id: number,
  fields: Partial<CategorisationRuleWriteFields>,
): CategorisationRuleRow | undefined {
  return db
    .update(categorisationRules)
    .set({ ...fields, updatedAt: Date.now() })
    .where(eq(categorisationRules.id, id))
    .returning()
    .get();
}

export function deleteRule(id: number): void {
  db.delete(categorisationRules).where(eq(categorisationRules.id, id)).run();
}

export function deleteAllRules(): void {
  db.delete(categorisationRules).run();
}
