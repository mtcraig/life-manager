import { desc, eq, isNull } from 'drizzle-orm';
import { db } from '../../db/client';
import { investments, investmentValuations } from '../../db/schema/investments';

export interface InvestmentRow {
  id: number;
  name: string;
  kind: string | null;
  notes: string | null;
  archivedAt: number | null;
  createdAt: number;
  updatedAt: number;
}

export interface InvestmentWriteFields {
  name: string;
  kind: string | null;
  notes: string | null;
}

export interface ValuationRow {
  id: number;
  investmentId: number;
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

export function listInvestments(includeArchived: boolean): InvestmentRow[] {
  if (includeArchived) {
    return db.select().from(investments).all();
  }
  return db.select().from(investments).where(isNull(investments.archivedAt)).all();
}

export function getInvestmentById(id: number): InvestmentRow | undefined {
  return db.select().from(investments).where(eq(investments.id, id)).get();
}

export function insertInvestment(fields: InvestmentWriteFields): InvestmentRow {
  const now = Date.now();
  return db
    .insert(investments)
    .values({ ...fields, createdAt: now, updatedAt: now })
    .returning()
    .get();
}

export function updateInvestment(
  id: number,
  fields: Partial<InvestmentWriteFields>,
): InvestmentRow | undefined {
  return db
    .update(investments)
    .set({ ...fields, updatedAt: Date.now() })
    .where(eq(investments.id, id))
    .returning()
    .get();
}

export function archiveInvestment(id: number): InvestmentRow | undefined {
  return db
    .update(investments)
    .set({ archivedAt: Date.now(), updatedAt: Date.now() })
    .where(eq(investments.id, id))
    .returning()
    .get();
}

export function listValuations(investmentId: number): ValuationRow[] {
  return db
    .select()
    .from(investmentValuations)
    .where(eq(investmentValuations.investmentId, investmentId))
    .orderBy(investmentValuations.asOfDate)
    .all();
}

export function insertValuation(
  investmentId: number,
  fields: ValuationWriteFields,
): ValuationRow {
  return db
    .insert(investmentValuations)
    .values({ ...fields, investmentId, createdAt: Date.now() })
    .returning()
    .get();
}

/**
 * Latest recorded value per investment (by as_of_date), across every investment —
 * used for both the per-investment "currentValue" list field and the Wealth
 * aggregation total, so it's fetched once rather than N+1.
 */
export function listLatestValuationsForAll(): Map<number, number> {
  const rows = db
    .select()
    .from(investmentValuations)
    .orderBy(desc(investmentValuations.asOfDate))
    .all();
  const latest = new Map<number, number>();
  for (const row of rows) {
    if (!latest.has(row.investmentId)) {
      latest.set(row.investmentId, row.value);
    }
  }
  return latest;
}
