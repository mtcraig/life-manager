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
 * listTransactionAmountsWithTransferFlag's ORDER BY). When multiple rows
 * share a date and more than one carries a balanceAfter, picking "whichever
 * comes last in input order" isn't safe — some banks export a day's
 * transactions newest-first, so the last row in (date, id) order can
 * actually be the *first* transaction of that day, and its balance is a
 * stale, too-high mid-day figure rather than the true end-of-day one. Once
 * there's already a confirmed running balance to compare against, the
 * correct end-of-day snap is order-independent: it's whichever candidate is
 * closest to `runningBalance-before-this-day + this-day's-net-amount`, since
 * that sum equals the true end-of-day balance regardless of intra-day order.
 * Before any confirmation exists there's no trustworthy anchor to compare
 * against, so the last-in-input-order candidate is used as the best
 * available fallback (matching the account's very first tracked days, where
 * the running total is only ever a relative approximation anyway).
 */
export function computeBalanceTrend(rows: DatedAmount[]): BalanceTrendPoint[] {
  interface DayAgg {
    amount: number;
    balanceCandidates: number[]; // in input order
  }
  const byDate = new Map<string, DayAgg>();

  for (const row of rows) {
    const day = byDate.get(row.date) ?? { amount: 0, balanceCandidates: [] };
    day.amount += row.amount;
    if (row.balanceAfter !== undefined && row.balanceAfter !== null) {
      day.balanceCandidates.push(row.balanceAfter);
    }
    byDate.set(row.date, day);
  }

  let runningBalance = 0;
  let confirmed = false;
  return [...byDate.keys()].sort().map((date) => {
    const day = byDate.get(date) as DayAgg;
    runningBalance += day.amount;
    if (day.balanceCandidates.length > 0) {
      runningBalance = confirmed
        ? closestCandidate(day.balanceCandidates, runningBalance)
        : day.balanceCandidates[day.balanceCandidates.length - 1]!;
      confirmed = true;
    }
    return { date, balance: runningBalance, confirmed };
  });
}

function closestCandidate(candidates: number[], target: number): number {
  return candidates.reduce((closest, candidate) =>
    Math.abs(candidate - target) < Math.abs(closest - target) ? candidate : closest,
  );
}
