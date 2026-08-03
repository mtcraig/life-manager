export interface RecurringAnalysisRow {
  date: string; // ISO YYYY-MM-DD
  amount: number; // integer pence, signed
  normalizedDescription: string;
  categoryId: number | null;
  isTransfer: boolean;
}

export type RecurringCadence = 'weekly' | 'monthly';
export type RecurringConfidence = 'high' | 'variable';

export interface RecurringItem {
  normalizedDescription: string;
  categoryId: number | null;
  averageAmount: number; // integer pence, signed
  cadence: RecurringCadence;
  /** 'high' = amount consistent within tolerance; 'variable' = cadence is solid but the amount itself fluctuates (e.g. "pay off whatever the statement balance is"). averageAmount is still the best projection either way. */
  confidence: RecurringConfidence;
  lastDate: string;
  nextExpectedDate: string;
  sampleCount: number;
}

const MIN_OCCURRENCES = 3;
const HISTORY_WINDOW_DAYS = 365;
const AMOUNT_TOLERANCE_FRACTION = 0.05;

const WEEKLY_CADENCE_DAYS = 7;
const WEEKLY_MIN_GAP_DAYS = 5;
const WEEKLY_MAX_GAP_DAYS = 9;

const MONTHLY_CADENCE_DAYS = 30;
const MONTHLY_MIN_GAP_DAYS = 26;
const MONTHLY_MAX_GAP_DAYS = 35;

function addDays(dateIso: string, days: number): string {
  const d = new Date(dateIso);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function daysBetween(fromIso: string, toIso: string): number {
  return Math.round((new Date(toIso).getTime() - new Date(fromIso).getTime()) / 86_400_000);
}

/**
 * Detects recurring income/bills from transaction history by grouping same-
 * description rows and checking whether they repeat at a consistent weekly
 * or monthly cadence. Deliberately conservative on cadence — at least 3
 * occurrences and a tight gap tolerance — because a missed recurring item
 * just falls back to being counted as ordinary variable spend, while a false
 * positive would corrupt a forecast. A single stray transaction sharing a
 * description with a real recurring series (breaking the gap pattern)
 * invalidates the whole group rather than being silently dropped, for the
 * same reason.
 *
 * Transfers are deliberately *not* excluded here (unlike money-flow-style
 * spend analysis) — for a cash-flow forecast, a transfer is still a real
 * movement of this account's money and must be modeled, the same way
 * `getAccountBalanceTrend` includes transfers while `getMoneyFlow` excludes
 * them. Excluding transfers would make a credit card's own monthly payoff
 * invisible whenever a user categorises it as a transfer.
 *
 * Amount consistency is a confidence signal, not a gate: a series with a
 * rock-solid cadence but a fluctuating amount (e.g. "pay off whatever was
 * spent this month") is real and worth projecting using its average amount —
 * rejecting it entirely left forecasts for accounts like this one-directional
 * (only ever able to subtract, never credit back), since cadence is the
 * actual false-positive guard here, not amount stability.
 */
export function detectRecurringItems(rows: RecurringAnalysisRow[], asOfDate: string): RecurringItem[] {
  const windowStart = addDays(asOfDate, -HISTORY_WINDOW_DAYS);
  const byDescription = new Map<string, RecurringAnalysisRow[]>();

  for (const row of rows) {
    if (row.date < windowStart || row.date > asOfDate) continue;
    const list = byDescription.get(row.normalizedDescription) ?? [];
    list.push(row);
    byDescription.set(row.normalizedDescription, list);
  }

  const items: RecurringItem[] = [];

  for (const [normalizedDescription, group] of byDescription) {
    if (group.length < MIN_OCCURRENCES) continue;

    const sorted = [...group].sort((a, b) => a.date.localeCompare(b.date));

    const sign = Math.sign(sorted[0]!.amount);
    if (sign === 0 || !sorted.every((r) => Math.sign(r.amount) === sign)) continue;

    const gaps: number[] = [];
    for (let i = 1; i < sorted.length; i++) {
      gaps.push(daysBetween(sorted[i - 1]!.date, sorted[i]!.date));
    }

    let cadence: RecurringCadence | null = null;
    if (gaps.every((g) => g >= WEEKLY_MIN_GAP_DAYS && g <= WEEKLY_MAX_GAP_DAYS)) {
      cadence = 'weekly';
    } else if (gaps.every((g) => g >= MONTHLY_MIN_GAP_DAYS && g <= MONTHLY_MAX_GAP_DAYS)) {
      cadence = 'monthly';
    }
    if (!cadence) continue;

    const amounts = sorted.map((r) => r.amount);
    const absAmounts = amounts.map(Math.abs);
    const avgAbs = absAmounts.reduce((sum, a) => sum + a, 0) / absAmounts.length;
    const maxAbs = Math.max(...absAmounts);
    const minAbs = Math.min(...absAmounts);
    if (avgAbs === 0) continue;
    const confidence: RecurringConfidence =
      (maxAbs - minAbs) / avgAbs <= AMOUNT_TOLERANCE_FRACTION ? 'high' : 'variable';

    const lastDate = sorted[sorted.length - 1]!.date;
    const maxGapAllowed = cadence === 'weekly' ? WEEKLY_MAX_GAP_DAYS : MONTHLY_MAX_GAP_DAYS;
    // A pattern that hasn't recurred recently enough (e.g. a cancelled
    // subscription) is stale — exclude it rather than keep projecting a
    // discontinued series forward.
    if (daysBetween(lastDate, asOfDate) > maxGapAllowed) continue;

    const categoryCounts = new Map<number | null, number>();
    for (const r of sorted) categoryCounts.set(r.categoryId, (categoryCounts.get(r.categoryId) ?? 0) + 1);
    const categoryId = [...categoryCounts.entries()].sort((a, b) => b[1] - a[1])[0]![0];

    const cadenceDays = cadence === 'weekly' ? WEEKLY_CADENCE_DAYS : MONTHLY_CADENCE_DAYS;

    items.push({
      normalizedDescription,
      categoryId,
      averageAmount: Math.round(amounts.reduce((sum, a) => sum + a, 0) / amounts.length),
      cadence,
      confidence,
      lastDate,
      nextExpectedDate: addDays(lastDate, cadenceDays),
      sampleCount: sorted.length,
    });
  }

  return items.sort((a, b) => a.normalizedDescription.localeCompare(b.normalizedDescription));
}
