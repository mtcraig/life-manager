export interface AccountBalanceSeries {
  accountId: number;
  isCreditCard: boolean;
  /** Ascending by date — the same shape computeBalanceTrend produces. */
  points: { date: string; balance: number }[];
}

export interface ValuationRow {
  entityId: number;
  asOfDate: string;
  value: number;
}

export interface NetWorthTrendPoint {
  date: string;
  accountsTotal: number;
  investmentsTotal: number;
  propertiesTotal: number;
  liabilitiesTotal: number;
  contentsTotal: number;
  netWorth: number;
}

/** The account's balance on the given date, forward-filled from its last known point on or before it (0 before the account has any history). */
function balanceAsOf(points: { date: string; balance: number }[], cutoff: string): number {
  let result = 0;
  for (const point of points) {
    if (point.date > cutoff) break;
    result = point.balance;
  }
  return result;
}

/** Sums each active entity's latest valuation on or before the cutoff — a sparsely-valued entity (e.g. a property revalued once a year) still contributes its last known value to every date in between. */
function latestValueAsOf(rows: ValuationRow[], activeEntityIds: Set<number>, cutoff: string): number {
  const latestByEntity = new Map<number, { asOfDate: string; value: number }>();
  for (const row of rows) {
    if (!activeEntityIds.has(row.entityId) || row.asOfDate > cutoff) continue;
    const existing = latestByEntity.get(row.entityId);
    if (!existing || row.asOfDate > existing.asOfDate) {
      latestByEntity.set(row.entityId, { asOfDate: row.asOfDate, value: row.value });
    }
  }
  let total = 0;
  for (const entry of latestByEntity.values()) total += entry.value;
  return total;
}

/**
 * Month-end dates from the month containing `earliestDate` through the month
 * containing `today`, inclusive — except the final point, which is clamped
 * to `today` itself rather than that month's actual last day (which may not
 * have happened yet).
 *
 * Deliberately does all arithmetic in UTC (Date.UTC / getUTCFullYear /
 * getUTCMonth) rather than local-timezone Date methods: `earliestDate` and
 * `today` are date-only ISO strings, which `new Date(...)` parses as UTC
 * midnight, but the local 3-arg `Date` constructor builds a *local* midnight
 * — in a timezone with a positive UTC offset (e.g. British Summer Time),
 * converting that local midnight back via `toISOString()` rolls back to the
 * previous day. Working entirely in UTC sidesteps this rather than relying
 * on the two representations happening to line up.
 */
export function buildMonthlyDateAxis(earliestDate: string, today: string): string[] {
  const dates: string[] = [];
  const start = new Date(earliestDate);
  const year = start.getUTCFullYear();
  let month = start.getUTCMonth(); // 0-indexed
  const todayTime = new Date(today).getTime();

  while (Date.UTC(year, month, 1) <= todayTime) {
    const monthEndTime = Date.UTC(year, month + 1, 0); // day 0 of next month = last day of this one, UTC midnight
    const clampedTime = monthEndTime > todayTime ? todayTime : monthEndTime;
    dates.push(new Date(clampedTime).toISOString().slice(0, 10));
    month += 1;
  }
  return dates;
}

/**
 * Reindexes every asset/liability source onto one shared monthly date axis.
 * Accounts are sampled from their own daily running-balance series
 * (forward-filled to each month-end); investments/properties/liabilities are
 * sampled the same way from their sparse dated valuations. Contents has no
 * historical dimension at all, so its current total is held constant across
 * the whole series — the same approximation the current-only Wealth summary
 * already makes implicitly by never reporting anything but "now".
 *
 * Archived entities are excluded using *today's* archived state uniformly
 * across the whole series (there's no per-valuation archival timestamp to
 * do better than that with) — a known simplification, not a bug.
 */
export function computeNetWorthTrend(input: {
  dateAxis: string[];
  accountSeries: AccountBalanceSeries[];
  investmentValuations: ValuationRow[];
  activeInvestmentIds: number[];
  propertyValuations: ValuationRow[];
  activePropertyIds: number[];
  liabilityValuations: ValuationRow[];
  activeLiabilityIds: number[];
  contentsTotal: number;
}): NetWorthTrendPoint[] {
  const activeInvestmentIds = new Set(input.activeInvestmentIds);
  const activePropertyIds = new Set(input.activePropertyIds);
  const activeLiabilityIds = new Set(input.activeLiabilityIds);

  return input.dateAxis.map((date) => {
    let accountsTotal = 0;
    let creditCardLiabilityTotal = 0;
    for (const series of input.accountSeries) {
      const balance = balanceAsOf(series.points, date);
      if (series.isCreditCard) {
        creditCardLiabilityTotal += Math.max(0, -balance);
      } else {
        accountsTotal += balance;
      }
    }

    const investmentsTotal = latestValueAsOf(input.investmentValuations, activeInvestmentIds, date);
    const propertiesTotal = latestValueAsOf(input.propertyValuations, activePropertyIds, date);
    const liabilitiesTotal =
      latestValueAsOf(input.liabilityValuations, activeLiabilityIds, date) + creditCardLiabilityTotal;
    const { contentsTotal } = input;

    const netWorth = accountsTotal + investmentsTotal + propertiesTotal + contentsTotal - liabilitiesTotal;

    return { date, accountsTotal, investmentsTotal, propertiesTotal, liabilitiesTotal, contentsTotal, netWorth };
  });
}
