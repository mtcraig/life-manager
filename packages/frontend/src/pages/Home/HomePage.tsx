import { CalendarHeatmap } from '../../components/calendar-heatmap/CalendarHeatmap.js';
import { useMoneyFlow } from '../../hooks/useAnalytics.js';
import { formatMoney } from '../../lib/formatMoney.js';

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

export function HomePage() {
  const today = new Date();
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const startOfHeatmapRange = new Date(today);
  startOfHeatmapRange.setDate(startOfHeatmapRange.getDate() - 364);

  const {
    data: monthFlow,
    isPending: isMonthPending,
    isError: isMonthError,
  } = useMoneyFlow({
    dateFrom: toIsoDate(startOfMonth),
    dateTo: toIsoDate(today),
  });

  const {
    data: yearFlow,
    isPending: isYearPending,
    isError: isYearError,
  } = useMoneyFlow({
    dateFrom: toIsoDate(startOfHeatmapRange),
    dateTo: toIsoDate(today),
  });

  const heatmapDays = (yearFlow?.days ?? []).map((day) => ({ date: day.date, value: day.net }));

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
        <h2 className="mb-3 text-sm font-medium text-slate-700 dark:text-slate-300">
          Daily money in/out — last 12 months (transfers excluded)
        </h2>
        {isYearPending && <p className="text-sm text-slate-500">Loading…</p>}
        {isYearError && <p className="text-sm text-red-600 dark:text-red-400">Failed to load the yearly heatmap.</p>}
        {yearFlow && <CalendarHeatmap days={heatmapDays} />}
      </div>
    </div>
  );
}
