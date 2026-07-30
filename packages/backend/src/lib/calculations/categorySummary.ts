export interface CategorisedAmount {
  amount: number;
  categoryId: number | null;
  categoryName: string | null;
}

export interface CategorySummaryRow {
  categoryId: number | null;
  categoryName: string;
  total: number;
}

/**
 * Groups spending (money-out) transactions by category, summed as a positive
 * magnitude and sorted descending. Money-in rows are excluded since this
 * answers "which categories does spending fall into," not overall flow.
 * Transfers are included as-is (not excluded, unlike money-flow/balance-trend
 * calculations) — a Transfers category showing as its own slice is more
 * informative here than silently dropping the data.
 */
export function groupCategorySummary(rows: CategorisedAmount[]): CategorySummaryRow[] {
  const totalsByCategory = new Map<number | null, { categoryName: string; total: number }>();

  for (const row of rows) {
    if (row.amount >= 0) continue;
    const existing = totalsByCategory.get(row.categoryId);
    const categoryName = row.categoryName ?? 'Uncategorised';
    if (existing) {
      existing.total += -row.amount;
    } else {
      totalsByCategory.set(row.categoryId, { categoryName, total: -row.amount });
    }
  }

  return [...totalsByCategory.entries()]
    .map(([categoryId, { categoryName, total }]) => ({ categoryId, categoryName, total }))
    .sort((a, b) => b.total - a.total);
}
