import type { RecurringCadence, RecurringConfidence } from './recurringItems';

export interface ForecastRecurringItem {
  normalizedDescription: string;
  categoryId: number | null;
  averageAmount: number; // integer pence, signed
  cadence: RecurringCadence;
  confidence: RecurringConfidence;
  lastDate: string;
}

export interface ForecastEvent {
  date: string;
  description: string;
  amount: number;
  categoryId: number | null;
  confidence: RecurringConfidence;
  runningBalance: number;
}

export interface ForecastPoint {
  date: string;
  projectedBalance: number;
}

export type DayHealth = 'comfortable' | 'tight' | 'belowZero';

export interface ForecastResult {
  points: ForecastPoint[];
  events: ForecastEvent[];
  projectedLow: { balance: number; date: string };
  health: { date: string; status: DayHealth }[];
}

const CADENCE_DAYS: Record<RecurringCadence, number> = { weekly: 7, monthly: 30 };

function addDays(dateIso: string, days: number): string {
  const d = new Date(dateIso);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function daysInMonth(dateIso: string): number {
  const [year, month] = dateIso.split('-').map(Number) as [number, number];
  return new Date(year, month, 0).getDate();
}

/** Every projected occurrence of a recurring item within [fromDate, toDateExclusive), rolling forward from its last known occurrence. */
function projectOccurrences(item: ForecastRecurringItem, fromDate: string, toDateExclusive: string): string[] {
  const cadenceDays = CADENCE_DAYS[item.cadence];
  const occurrences: string[] = [];
  let next = addDays(item.lastDate, cadenceDays);
  while (next < fromDate) next = addDays(next, cadenceDays);
  while (next < toDateExclusive) {
    occurrences.push(next);
    next = addDays(next, cadenceDays);
  }
  return occurrences;
}

/**
 * Projects a balance forward day by day: detected recurring items post as
 * discrete dated events (feeding the itemised ledger), while variable
 * category spend (groceries, etc. — anything not covered by a recurring
 * item) is folded in as a smoothed daily decrement from its trailing
 * average, since it has no fixed date or exact amount of its own.
 */
export function computeForecast(params: {
  currentBalance: number;
  recurringItems: ForecastRecurringItem[];
  variableCategoryMonthlyAverages: Map<number, number>;
  horizonDays: number;
  fromDate: string;
  comfortableThreshold: number;
}): ForecastResult {
  const {
    currentBalance,
    recurringItems,
    variableCategoryMonthlyAverages,
    horizonDays,
    fromDate,
    comfortableThreshold,
  } = params;
  const toDateExclusive = addDays(fromDate, horizonDays);

  const eventsByDate = new Map<
    string,
    { description: string; amount: number; categoryId: number | null; confidence: RecurringConfidence }[]
  >();
  for (const item of recurringItems) {
    for (const date of projectOccurrences(item, fromDate, toDateExclusive)) {
      const list = eventsByDate.get(date) ?? [];
      list.push({
        description: item.normalizedDescription,
        amount: item.averageAmount,
        categoryId: item.categoryId,
        confidence: item.confidence,
      });
      eventsByDate.set(date, list);
    }
  }

  // Variable spend for a category already represented by a recurring item
  // would double-count that category's cost, so it's excluded here.
  const recurringCategoryIds = new Set(
    recurringItems.map((i) => i.categoryId).filter((id): id is number => id !== null),
  );

  let runningBalance = currentBalance;
  const points: ForecastPoint[] = [];
  const events: ForecastEvent[] = [];
  const health: { date: string; status: DayHealth }[] = [];
  let projectedLow: { balance: number; date: string } | null = null;

  for (let i = 0; i < horizonDays; i++) {
    const date = addDays(fromDate, i);
    const dim = daysInMonth(date);

    let variableDaily = 0;
    for (const [categoryId, monthlyAverage] of variableCategoryMonthlyAverages) {
      if (recurringCategoryIds.has(categoryId)) continue;
      variableDaily += monthlyAverage / dim;
    }
    runningBalance -= variableDaily;

    for (const event of eventsByDate.get(date) ?? []) {
      runningBalance += event.amount;
      events.push({ ...event, date, runningBalance: Math.round(runningBalance) });
    }

    const projectedBalance = Math.round(runningBalance);
    points.push({ date, projectedBalance });

    const status: DayHealth =
      projectedBalance < 0 ? 'belowZero' : projectedBalance < comfortableThreshold ? 'tight' : 'comfortable';
    health.push({ date, status });

    if (projectedLow === null || projectedBalance < projectedLow.balance) {
      projectedLow = { balance: projectedBalance, date };
    }
  }

  return { points, events, projectedLow: projectedLow ?? { balance: currentBalance, date: fromDate }, health };
}
