import type { CategorisedAmount } from './categorySummary';

export interface DatedCategorisedAmount extends CategorisedAmount {
  date: string; // ISO YYYY-MM-DD
}

export interface CategoryMonthSummaryRow {
  month: string; // YYYY-MM
  categoryId: number | null;
  categoryName: string;
  total: number;
}

/**
 * Groups spending (money-out) transactions by calendar month and category,
 * summed as a positive magnitude. Mirrors groupCategorySummary's
 * money-in exclusion and "Uncategorised"/transfers-included-as-is rules, with
 * an added month dimension. Only months present in the input rows appear in
 * the output — filling in empty months for a chart's x-axis is a display
 * concern handled by the chart's own pivot step, not this pure grouping
 * function.
 */
export function groupCategorySummaryByMonth(rows: DatedCategorisedAmount[]): CategoryMonthSummaryRow[] {
  const totalsByKey = new Map<
    string,
    { month: string; categoryId: number | null; categoryName: string; total: number }
  >();

  for (const row of rows) {
    if (row.amount >= 0) continue;
    const month = row.date.slice(0, 7);
    const categoryName = row.categoryName ?? 'Uncategorised';
    const key = `${month}:${row.categoryId ?? 'null'}`;
    const existing = totalsByKey.get(key);
    if (existing) {
      existing.total += -row.amount;
    } else {
      totalsByKey.set(key, { month, categoryId: row.categoryId, categoryName, total: -row.amount });
    }
  }

  return [...totalsByKey.values()].sort(
    (a, b) => a.month.localeCompare(b.month) || b.total - a.total,
  );
}
