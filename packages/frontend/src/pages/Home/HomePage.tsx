import { useState } from 'react';
import { CalendarHeatmap } from '../../components/calendar-heatmap/CalendarHeatmap.js';
import { MonthlyFlowChart } from '../../components/charts/MonthlyFlowChart.js';
import type { MonthlyFlowPoint } from '../../components/charts/MonthlyFlowChart.js';
import { useMoneyFlow } from '../../hooks/useAnalytics.js';
import { formatMoney } from '../../lib/formatMoney.js';

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const YEAR_FILTER_WINDOW = 4;

function toIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function MetricTile({ label, value, tone }: { label: string; value: number; tone: 'in' | 'out' | 'net' }) {
  const colorClass =
    tone === 'in' ? 'text-green-700 dark:text-green-400'
      : tone === 'out'
        ? 'text-red-600 dark:text-red-400'
        : value >= 0
          ? 'text-green-700 dark:text-green-400'
          : 'text-red-600 dark:text-red-400';
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
      <div className="text-xs uppercase tracking-wide text-slate-500">{label}</div>
      <div className={`mt-1 text-2xl font-semibold ${colorClass}`}>{formatMoney(value)}</div>
    </div>
  );
}

/** Buckets a year's daily rows into calendar-month totals, skipping months with no data yet (i.e. future months of the current year). */
function groupFlowByMonth(
  days: { date: string; moneyIn: number; moneyOut: number; net: number }[],
  year: number,
): MonthlyFlowPoint[] {
  const byMonth = new Map<string, MonthlyFlowPoint>();
  for (const day of days) {
    const monthIndex = Number(day.date.slice(5, 7)) - 1;
    const key = day.date.slice(0, 7);
    const existing = byMonth.get(key) ?? {
      month: `${MONTH_LABELS[monthIndex]} ${year}`,
      moneyIn: 0,
      moneyOut: 0,
      net: 0,
    };
    existing.moneyIn += day.moneyIn;
    existing.moneyOut += day.moneyOut;
    existing.net += day.net;
    byMonth.set(key, existing);
  }
  return [...byMonth.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([, point]) => point);
}

export function HomePage() {
  const today = new Date();
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const currentYear = today.getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);

  const {
    data: monthFlow,
    isPending: isMonthPending,
    isError: isMonthError,
  } = useMoneyFlow({
    dateFrom: toIsoDate(startOfMonth),
    dateTo: toIsoDate(today),
  });

  const yearRangeEnd = selectedYear === currentYear ? today : new Date(selectedYear, 11, 31);
  const {
    data: yearFlow,
    isPending: isYearPending,
    isError: isYearError,
  } = useMoneyFlow({
    dateFrom: `${selectedYear}-01-01`,
    dateTo: toIsoDate(yearRangeEnd),
  });

  const heatmapDays = (yearFlow?.days ?? []).map((day) => ({ date: day.date, value: day.net }));
  const monthlyPoints = groupFlowByMonth(yearFlow?.days ?? [], selectedYear);
  const yearOptions = Array.from({ length: YEAR_FILTER_WINDOW }, (_, i) => currentYear - i);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Home</h1>

      {isMonthPending && <p className="text-sm text-slate-500">Loading…</p>}
      {isMonthError && <p className="text-sm text-red-600 dark:text-red-400">Failed to load this month's totals.</p>}
      {monthFlow && (
        <div className="grid grid-cols-3 gap-4">
          <MetricTile label="Money in (this month)" value={monthFlow.totals.moneyIn} tone="in" />
          <MetricTile label="Money out (this month)" value={monthFlow.totals.moneyOut} tone="out" />
          <MetricTile label="Net (this month)" value={monthFlow.totals.net} tone="net" />
        </div>
      )}

      <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-medium text-slate-700 dark:text-slate-300">
            Money in/out/net by month ({selectedYear})
          </h2>
          <label className="text-sm text-slate-700 dark:text-slate-300">
            Year{' '}
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="ml-1 rounded-md border border-slate-300 px-2 py-1 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            >
              {yearOptions.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </label>
        </div>
        {isYearPending && <p className="text-sm text-slate-500">Loading…</p>}
        {isYearError && <p className="text-sm text-red-600 dark:text-red-400">Failed to load the yearly chart.</p>}
        {yearFlow && <MonthlyFlowChart points={monthlyPoints} />}
      </div>

      {yearFlow && (
        <div className="grid grid-cols-3 gap-4">
          <MetricTile label={`Money in (${selectedYear})`} value={yearFlow.totals.moneyIn} tone="in" />
          <MetricTile label={`Money out (${selectedYear})`} value={yearFlow.totals.moneyOut} tone="out" />
          <MetricTile label={`Net (${selectedYear})`} value={yearFlow.totals.net} tone="net" />
        </div>
      )}

      <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
        <h2 className="mb-3 text-sm font-medium text-slate-700 dark:text-slate-300">
          Daily money in/out — {selectedYear} (transfers excluded)
        </h2>
        {isYearPending && <p className="text-sm text-slate-500">Loading…</p>}
        {isYearError && <p className="text-sm text-red-600 dark:text-red-400">Failed to load the yearly heatmap.</p>}
        {yearFlow && <CalendarHeatmap days={heatmapDays} year={selectedYear} />}
      </div>
    </div>
  );
}
