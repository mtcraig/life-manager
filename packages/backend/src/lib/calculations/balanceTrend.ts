export interface DatedAmount {
  date: string; // ISO YYYY-MM-DD
  amount: number; // integer pence
}

export interface BalanceTrendPoint {
  date: string;
  balance: number;
}

/**
 * Cumulative running total per day, sorted ascending. Multiple transactions on
 * the same day are summed into a single point for that day.
 */
export function computeBalanceTrend(rows: DatedAmount[]): BalanceTrendPoint[] {
  const amountByDate = new Map<string, number>();
  for (const row of rows) {
    amountByDate.set(row.date, (amountByDate.get(row.date) ?? 0) + row.amount);
  }

  let runningBalance = 0;
  return [...amountByDate.keys()].sort().map((date) => {
    runningBalance += amountByDate.get(date) as number;
    return { date, balance: runningBalance };
  });
}
