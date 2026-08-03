export interface BudgetRow {
  id: number;
  categoryId: number;
  amount: number;
  startDate: string;
  endDate: string | null;
}

export interface CategorisedAmountWithTransferFlag {
  categoryId: number | null;
  amount: number;
  isTransfer: boolean;
}

export interface BudgetProgressItem {
  categoryId: number;
  categoryName: string;
  budgeted: number;
  actual: number;
  delta: number;
}

/**
 * Sums spend (money-out) per category for a period, excluding transfers —
 * same semantics as getMoneyFlow, since a transfer between the user's own
 * accounts isn't real spending against a budget. Uncategorised rows
 * (categoryId null) can never match a budget, so they're dropped too.
 */
export function sumActualSpendByCategory(rows: CategorisedAmountWithTransferFlag[]): Map<number, number> {
  const totals = new Map<number, number>();
  for (const row of rows) {
    if (row.isTransfer || row.categoryId === null || row.amount >= 0) continue;
    totals.set(row.categoryId, (totals.get(row.categoryId) ?? 0) + -row.amount);
  }
  return totals;
}

/**
 * When more than one budget row overlaps the same category for a period
 * (the user edited an overlapping date range), the row with the latest
 * startDate wins — the most recently-started range is treated as the
 * user's most specific/most recent intent, mirroring how
 * categorisationRules.priority resolves rule conflicts elsewhere.
 */
function pickActiveBudget(rows: BudgetRow[]): BudgetRow {
  return rows.reduce((latest, row) => (row.startDate > latest.startDate ? row : latest));
}

/**
 * Joins each budgeted category's active target against its actual spend for
 * the period. Categories with no budget row active for this period are
 * simply absent from the result — this only ever reports on what's budgeted.
 */
export function computeBudgetProgress(
  activeBudgets: BudgetRow[],
  actualsByCategory: Map<number, number>,
  categoryNames: Map<number, string>,
): { items: BudgetProgressItem[]; totalBudgeted: number; totalActual: number } {
  const rowsByCategory = new Map<number, BudgetRow[]>();
  for (const row of activeBudgets) {
    const list = rowsByCategory.get(row.categoryId) ?? [];
    list.push(row);
    rowsByCategory.set(row.categoryId, list);
  }

  const items: BudgetProgressItem[] = [];
  let totalBudgeted = 0;
  let totalActual = 0;
  for (const [categoryId, rows] of rowsByCategory) {
    const budget = pickActiveBudget(rows);
    const actual = actualsByCategory.get(categoryId) ?? 0;
    totalBudgeted += budget.amount;
    totalActual += actual;
    items.push({
      categoryId,
      categoryName: categoryNames.get(categoryId) ?? 'Unknown',
      budgeted: budget.amount,
      actual,
      delta: budget.amount - actual,
    });
  }
  items.sort((a, b) => a.categoryName.localeCompare(b.categoryName));

  return { items, totalBudgeted, totalActual };
}

/** The calendar month containing the given ISO date, as [first day, last day]. */
export function getMonthRange(dateIso: string): { periodStart: string; periodEnd: string } {
  const [yearStr, monthStr] = dateIso.split('-') as [string, string];
  const year = Number(yearStr);
  const month = Number(monthStr); // 1-indexed
  const lastDay = new Date(year, month, 0).getDate();
  return {
    periodStart: `${yearStr}-${monthStr}-01`,
    periodEnd: `${yearStr}-${monthStr}-${String(lastDay).padStart(2, '0')}`,
  };
}
