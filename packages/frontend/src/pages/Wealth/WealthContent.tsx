import { useNetWorthTrend, useWealthSummary } from '../../hooks/useWealth.js';
import { useProperties } from '../../hooks/useProperties.js';
import { useLiabilities } from '../../hooks/useLiabilities.js';
import { NetWorthTrendChart } from '../../components/charts/NetWorthTrendChart.js';
import { SkeletonChart, SkeletonRows, SkeletonStatGrid } from '../../components/Skeleton.js';
import { formatMoney } from '../../lib/formatMoney.js';
import type { YearFilterValue } from '../../lib/yearFilter.js';
import { dateRangeForYear } from '../../lib/yearFilter.js';

export function SummaryTile({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone?: 'positive' | 'negative' | 'asset';
}) {
  const color =
    tone === 'negative'
      ? 'text-red-600 dark:text-red-400'
      : tone === 'positive'
        ? 'text-green-700 dark:text-green-400'
        : tone === 'asset'
          ? 'text-yellow-600 dark:text-yellow-400'
          : 'text-slate-900 dark:text-slate-100';
  return (
    <div className="card-surface p-4">
      <div className="text-xs uppercase tracking-wide text-slate-500">{label}</div>
      <div className={`mt-1 text-2xl font-semibold ${color}`}>{formatMoney(value)}</div>
    </div>
  );
}

export function WealthContent({ selectedYear }: { selectedYear: YearFilterValue }) {
  const { data: summary, isPending, isError } = useWealthSummary();
  const { data: trend, isPending: isTrendPending, isError: isTrendError } = useNetWorthTrend();

  // The chart is scoped to the selected year, but each point's balance is still the true
  // cumulative running total (computed from full history) — slicing the already-computed
  // series keeps every value correct without needing a separate "opening balance" anchor.
  const { dateFrom, dateTo } = dateRangeForYear(selectedYear);
  const filteredTrend = trend?.filter(
    (p) => (dateFrom === undefined || p.date >= dateFrom) && (dateTo === undefined || p.date <= dateTo),
  );

  return (
    <div className="space-y-4">
      <div className="card-surface p-4">
        <h2 className="mb-3 text-sm font-medium text-slate-700 dark:text-slate-300">Net worth over time</h2>
        {isTrendPending && <SkeletonChart className="h-56 w-full" />}
        {isTrendError && <p className="text-sm text-red-600 dark:text-red-400">Failed to load the net worth trend.</p>}
        {filteredTrend && filteredTrend.length > 1 && <NetWorthTrendChart points={filteredTrend} />}
        {filteredTrend && filteredTrend.length <= 1 && (
          <p className="text-sm text-slate-500">Not enough history yet to chart a trend.</p>
        )}
      </div>

      {isPending && <SkeletonStatGrid count={4} />}
      {isError && <p className="text-sm text-red-600 dark:text-red-400">Failed to load the wealth summary.</p>}
      {summary && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <SummaryTile label="Net wealth" value={summary.netWealth} tone={summary.netWealth >= 0 ? 'positive' : 'negative'} />
            <SummaryTile label="Liquid assets" value={summary.liquidAssets.total} tone="asset" />
            <SummaryTile label="Non-liquid assets" value={summary.nonLiquidAssets.total} tone="asset" />
            <SummaryTile label="Liabilities" value={summary.liabilitiesTotal} tone="negative" />
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <SummaryTile label="Accounts" value={summary.liquidAssets.accountsTotal} />
            <SummaryTile label="Investments" value={summary.liquidAssets.investmentsTotal} />
            <SummaryTile label="Properties" value={summary.nonLiquidAssets.propertiesTotal} />
            <SummaryTile label="Contents" value={summary.nonLiquidAssets.contentsTotal} />
          </div>
        </div>
      )}
    </div>
  );
}

export function WealthEntitiesReadOnly() {
  const { data: properties, isPending: isPropPending, isError: isPropError } = useProperties();
  const { data: liabilities, isPending: isLiabPending, isError: isLiabError } = useLiabilities(false);

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="card-surface p-4">
        <h2 className="mb-3 text-sm font-medium text-slate-700 dark:text-slate-300">Properties</h2>
        {isPropPending && <SkeletonRows rows={2} />}
        {isPropError && <p className="text-sm text-red-600 dark:text-red-400">Failed to load properties.</p>}
        {properties && properties.length === 0 && <p className="text-sm text-slate-500">No properties yet.</p>}
        {properties && properties.length > 0 && (
          <ul className="divide-y divide-slate-100 dark:divide-slate-800">
            {properties.map((property) => (
              <li key={property.id} className="flex items-center justify-between py-1.5 text-sm">
                <span className="text-slate-700 dark:text-slate-300">{property.name}</span>
                <span className="font-medium text-slate-900 dark:text-slate-100">
                  {property.currentValue !== null ? formatMoney(property.currentValue) : '—'}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="card-surface p-4">
        <h2 className="mb-3 text-sm font-medium text-slate-700 dark:text-slate-300">Liabilities</h2>
        {isLiabPending && <SkeletonRows rows={2} />}
        {isLiabError && <p className="text-sm text-red-600 dark:text-red-400">Failed to load liabilities.</p>}
        {liabilities && liabilities.length === 0 && <p className="text-sm text-slate-500">No liabilities yet.</p>}
        {liabilities && liabilities.length > 0 && (
          <ul className="divide-y divide-slate-100 dark:divide-slate-800">
            {liabilities.map((liability) => (
              <li key={liability.id} className="flex items-center justify-between py-1.5 text-sm">
                <span className="text-slate-700 dark:text-slate-300">{liability.name}</span>
                <span className="font-medium text-slate-900 dark:text-slate-100">
                  {liability.currentValue !== null ? formatMoney(liability.currentValue) : '—'}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
