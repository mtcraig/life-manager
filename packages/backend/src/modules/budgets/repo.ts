import { and, eq, gte, isNull, lte, or } from 'drizzle-orm';
import { db } from '../../db/client';
import { budgets } from '../../db/schema/budgets';

export interface BudgetRow {
  id: number;
  categoryId: number;
  amount: number;
  startDate: string;
  endDate: string | null;
  notes: string | null;
  createdAt: number;
  updatedAt: number;
}

export interface BudgetWriteFields {
  categoryId: number;
  amount: number;
  startDate: string;
  endDate: string | null;
  notes: string | null;
}

export function listBudgets(): BudgetRow[] {
  return db.select().from(budgets).all();
}

export function getBudgetById(id: number): BudgetRow | undefined {
  return db.select().from(budgets).where(eq(budgets.id, id)).get();
}

export function insertBudget(fields: BudgetWriteFields): BudgetRow {
  const now = Date.now();
  return db
    .insert(budgets)
    .values({ ...fields, createdAt: now, updatedAt: now })
    .returning()
    .get();
}

export function updateBudget(id: number, fields: Partial<BudgetWriteFields>): BudgetRow | undefined {
  return db
    .update(budgets)
    .set({ ...fields, updatedAt: Date.now() })
    .where(eq(budgets.id, id))
    .returning()
    .get();
}

export function deleteBudget(id: number): boolean {
  const result = db.delete(budgets).where(eq(budgets.id, id)).run();
  return result.changes > 0;
}

/** Budget rows whose [startDate, endDate] range overlaps the given period at all (endDate null = open-ended). */
export function listBudgetsActiveDuring(periodStart: string, periodEnd: string): BudgetRow[] {
  return db
    .select()
    .from(budgets)
    .where(and(lte(budgets.startDate, periodEnd), or(isNull(budgets.endDate), gte(budgets.endDate, periodStart))))
    .all();
}
