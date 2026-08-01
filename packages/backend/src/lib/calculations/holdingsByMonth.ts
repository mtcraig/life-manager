export interface ValuationForHoldings {
  investmentId: number;
  investmentName: string;
  asOfDate: string; // ISO YYYY-MM-DD
  value: number; // integer pence
}

export interface HoldingsMonthRow {
  month: string; // YYYY-MM
  investmentId: number;
  investmentName: string;
  value: number; // integer pence, forward-filled from the most recent valuation at or before this month
}

/**
 * Turns sporadic per-investment valuations into one row per (investment, month) for
 * every month from the earliest valuation across all investments up to `currentMonth`,
 * carrying each investment's most recent value forward until a newer valuation
 * supersedes it — unlike category-spending's month grouping, which only needs months
 * that already have transactions, a stacked "holdings over time" chart wants every
 * month in range to know each holding's value, not just the months it changed.
 *
 * An investment with no valuation yet at-or-before a given month is omitted from that
 * month's rows entirely (not zeroed) — it hasn't started contributing to the total yet.
 */
export function groupHoldingsByMonth(rows: ValuationForHoldings[], currentMonth: string): HoldingsMonthRow[] {
  if (rows.length === 0) return [];

  const byInvestment = new Map<number, { name: string; valuations: { month: string; value: number }[] }>();
  let earliestMonth = currentMonth;
  for (const row of rows) {
    const month = row.asOfDate.slice(0, 7);
    if (month < earliestMonth) earliestMonth = month;
    const entry = byInvestment.get(row.investmentId);
    if (entry) {
      entry.valuations.push({ month, value: row.value });
    } else {
      byInvestment.set(row.investmentId, { name: row.investmentName, valuations: [{ month, value: row.value }] });
    }
  }
  for (const entry of byInvestment.values()) {
    entry.valuations.sort((a, b) => a.month.localeCompare(b.month));
  }

  const months = monthsBetween(earliestMonth, currentMonth);
  const result: HoldingsMonthRow[] = [];

  for (const [investmentId, { name, valuations }] of byInvestment) {
    let cursor = 0;
    let currentValue: number | null = null;
    for (const month of months) {
      while (cursor < valuations.length && valuations[cursor]!.month <= month) {
        currentValue = valuations[cursor]!.value;
        cursor += 1;
      }
      if (currentValue !== null) {
        result.push({ month, investmentId, investmentName: name, value: currentValue });
      }
    }
  }

  return result.sort((a, b) => a.month.localeCompare(b.month) || a.investmentName.localeCompare(b.investmentName));
}

function monthsBetween(startMonth: string, endMonth: string): string[] {
  const months: string[] = [];
  let [year, month] = startMonth.split('-').map(Number) as [number, number];
  const [endYear, endMonthNum] = endMonth.split('-').map(Number) as [number, number];
  while (year < endYear || (year === endYear && month <= endMonthNum)) {
    months.push(`${year}-${String(month).padStart(2, '0')}`);
    month += 1;
    if (month > 12) {
      month = 1;
      year += 1;
    }
  }
  return months;
}
