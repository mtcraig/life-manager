import { useState } from 'react';
import type { BalanceTrendPointDto, ForecastPointDto } from '@life-manager/shared';
import { useAccounts } from '../../hooks/useAccounts.js';
import { useAccountBalanceTrend } from '../../hooks/useAnalytics.js';
import { useForecast } from '../../hooks/useForecast.js';
import { ForecastChart } from '../../components/charts/ForecastChart.js';
import type { ForecastChartPoint } from '../../components/charts/ForecastChart.js';
import { ForecastCalendarStrip } from '../../components/charts/ForecastCalendarStrip.js';
import { UpcomingItemsLedger } from '../../components/charts/UpcomingItemsLedger.js';
import { SkeletonChart } from '../../components/Skeleton.js';
import { formatMoney } from '../../lib/formatMoney.js';

const HORIZON_DAYS = 45;
const HISTORY_DAYS_SHOWN = 30;

function toIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/** Joins recent actual history with the forward projection on a shared date axis — where the two overlap (today), the point carries both fields, visually bridging the solid/dashed line segments. */
function mergeForecastSeries(
  history: BalanceTrendPointDto[] | undefined,
  forecastPoints: ForecastPointDto[],
): ForecastChartPoint[] {
  const byDate = new Map<string, ForecastChartPoint>();
  for (const h of history ?? []) {
    byDate.set(h.date, { date: h.date, actual: h.balance });
  }
  for (const p of forecastPoints) {
    const existing = byDate.get(p.date);
    if (existing) {
      existing.projected = p.projectedBalance;
    } else {
      byDate.set(p.date, { date: p.date, projected: p.projectedBalance });
    }
  }
  return [...byDate.values()].sort((a, b) => a.date.localeCompare(b.date));
}

export function ForecastPage() {
  const { data: accounts } = useAccounts();
  const [accountId, setAccountId] = useState<string>('');
  const selectedAccountId = accountId ? Number(accountId) : undefined;

  const {
    data: forecast,
    isPending,
    isError,
  } = useForecast({ accountId: selectedAccountId, horizonDays: HORIZON_DAYS });

  const today = new Date();
  const historyStart = new Date(today);
  historyStart.setDate(historyStart.getDate() - HISTORY_DAYS_SHOWN);
  const { data: history } = useAccountBalanceTrend({
    accountId: selectedAccountId,
    dateFrom: toIsoDate(historyStart),
    dateTo: toIsoDate(today),
  });

  const chartPoints = forecast ? mergeForecastSeries(history, forecast.points) : [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Forecast</h1>
        <label className="text-sm text-slate-700 dark:text-slate-300">
          Account
          <select
            value={accountId}
            onChange={(e) => setAccountId(e.target.value)}
            className="ml-2 rounded-md border border-slate-300 px-2 py-1 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          >
            <option value="">All accounts</option>
            {accounts?.map((account) => (
              <option key={account.id} value={account.id}>
                {account.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      {isPending && <SkeletonChart className="h-72 w-full" />}
      {isError && <p className="text-sm text-red-600 dark:text-red-400">Failed to load the forecast.</p>}

      {forecast && (
        <>
          <div className="card-surface p-4">
            <h2 className="mb-3 text-sm font-medium text-slate-700 dark:text-slate-300">
              Projected balance — next {forecast.horizonDays} days
            </h2>
            <ForecastChart points={chartPoints} projectedLowDate={forecast.projectedLow.date} />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="card-surface p-4">
              <div className="text-xs uppercase tracking-wide text-slate-500">Projected low</div>
              <div
                className={`mt-1 text-2xl font-semibold ${
                  forecast.projectedLow.balance < 0
                    ? 'text-red-600 dark:text-red-400'
                    : 'text-slate-900 dark:text-slate-100'
                }`}
              >
                {formatMoney(forecast.projectedLow.balance)}
              </div>
              <div className="mt-1 text-xs text-slate-500">on {forecast.projectedLow.date}</div>
            </div>
            <div className="card-surface p-4">
              <div className="text-xs uppercase tracking-wide text-slate-500">Current balance</div>
              <div className="mt-1 text-2xl font-semibold text-slate-900 dark:text-slate-100">
                {formatMoney(forecast.asOfBalance)}
              </div>
            </div>
            <div className="card-surface p-4">
              <div className="text-xs uppercase tracking-wide text-slate-500">Recurring items detected</div>
              <div className="mt-1 text-2xl font-semibold text-slate-900 dark:text-slate-100">
                {forecast.recurringItems.length}
              </div>
            </div>
          </div>

          <div className="card-surface p-4">
            <h2 className="mb-3 text-sm font-medium text-slate-700 dark:text-slate-300">Day-by-day outlook</h2>
            <ForecastCalendarStrip health={forecast.health} />
          </div>

          <div className="card-surface p-4">
            <h2 className="mb-3 text-sm font-medium text-slate-700 dark:text-slate-300">Upcoming recurring items</h2>
            <UpcomingItemsLedger events={forecast.events} />
          </div>
        </>
      )}
    </div>
  );
}
