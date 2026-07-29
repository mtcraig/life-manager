export interface DatedAmount {
  date: string; // ISO YYYY-MM-DD
  amount: number; // integer pence
  balanceAfter?: number | null; // bank-reported balance after this transaction, when known
}

export interface BalanceTrendPoint {
  date: string;
  balance: number;
  confirmed: boolean; // true once a bank-reported balance has been seen on or before this date
}

/**
 * Cumulative running balance per day, sorted ascending, "snapped" to the
 * bank's own reported balance whenever a row carries one. Before the first
 * known balance for an account, points are purely relative (net movement
 * from an assumed zero) — that's unavoidable without a real anchor. From the
 * first snap onward (including the most recent point, whenever the latest
 * import included a balance column), the running total is corrected to the
 * bank's own figure each time one appears, so drift from missed/misparsed
 * rows self-heals at every snap instead of compounding forever.
 *
 * `rows` must already be in a stable chronological order (see
 * listTransactionAmountsWithTransferFlag's ORDER BY) — when multiple rows
 * share a date, the *last* row in input order that carries a balanceAfter
 * wins for that date's snap.
 */
export function computeBalanceTrend(rows: DatedAmount[]): BalanceTrendPoint[] {
  interface DayAgg {
    amount: number;
    lastKnownBalance: number | null;
  }
  const byDate = new Map<string, DayAgg>();

  for (const row of rows) {
    const day = byDate.get(row.date) ?? { amount: 0, lastKnownBalance: null };
    day.amount += row.amount;
    if (row.balanceAfter !== undefined && row.balanceAfter !== null) {
      day.lastKnownBalance = row.balanceAfter;
    }
    byDate.set(row.date, day);
  }

  let runningBalance = 0;
  let confirmed = false;
  return [...byDate.keys()].sort().map((date) => {
    const day = byDate.get(date) as DayAgg;
    runningBalance += day.amount;
    if (day.lastKnownBalance !== null) {
      runningBalance = day.lastKnownBalance;
      confirmed = true;
    }
    return { date, balance: runningBalance, confirmed };
  });
}
