import { useState } from 'react';
import type { AccountDto } from '@life-manager/shared';
import { AccountsContent, accountBalanceClass, CategorySpendingSection, INSTITUTION_CLASS } from './AccountsContent.js';
import { BalanceTrendChart } from '../../components/charts/BalanceTrendChart.js';
import { Sparkline } from '../../components/charts/Sparkline.js';
import { SkeletonChart, SkeletonRows } from '../../components/Skeleton.js';
import { YearFilter as YearFilterControl } from '../../components/YearFilter.js';
import { useAccounts } from '../../hooks/useAccounts.js';
import { useAccountBalanceTrend, useTransactionDateBounds } from '../../hooks/useAnalytics.js';
import { formatMoney } from '../../lib/formatMoney.js';
import type { YearFilterValue } from '../../lib/yearFilter.js';
import { dateRangeForYear } from '../../lib/yearFilter.js';

type YearFilter = YearFilterValue;

function AccountDetail({
  account,
  selectedYear,
}: {
  account: AccountDto;
  selectedYear: YearFilter;
}) {
  const accountId = account.id;
  const {
    data: trend,
    isPending: isTrendPending,
    isError: isTrendError,
  } = useAccountBalanceTrend({ accountId });

  const latestPoint = trend && trend.length > 0 ? trend[trend.length - 1] : undefined;
  const currentBalance = latestPoint?.balance ?? 0;
  const balanceLabel = latestPoint?.confirmed ? 'Current balance' : 'Balance (since first transaction)';

  // The chart is scoped to the selected year, but each point's balance is still the true
  // cumulative running total (computed from full history) — slicing the already-computed
  // series keeps every value correct without needing a separate "opening balance" anchor.
  const { dateFrom, dateTo } = dateRangeForYear(selectedYear);
  const chartTrend = trend?.filter(
    (point) => (dateFrom === undefined || point.date >= dateFrom) && (dateTo === undefined || point.date <= dateTo),
  );

  return (
    <>
      <div className="card-surface p-4">
        <h2 className="text-sm font-medium text-slate-700 dark:text-slate-300">
          {account.name}
          {account.institution && (
            <span className={`ml-2 text-xs ${INSTITUTION_CLASS}`}>{account.institution}</span>
          )}
        </h2>
      </div>

      <div className="card-surface flex items-center justify-between gap-4 p-4">
        <div>
          <div className="text-xs uppercase tracking-wide text-slate-500">{balanceLabel}</div>
          <div className={`mt-1 text-2xl font-semibold ${accountBalanceClass(account.type, currentBalance)}`}>
            {formatMoney(currentBalance)}
          </div>
        </div>
        {trend && trend.length > 1 && <Sparkline points={trend} width={120} height={40} />}
      </div>

      <div className="card-surface p-4">
        {isTrendPending && <SkeletonChart className="h-56 w-full" />}
        {isTrendError && <p className="text-sm text-red-600 dark:text-red-400">Failed to load balance trend.</p>}
        {trend && trend.length === 0 && (
          <p className="text-sm text-slate-500">No transactions ingested for this account yet.</p>
        )}
        {trend && trend.length > 0 && chartTrend && chartTrend.length === 0 && (
          <p className="text-sm text-slate-500">
            {selectedYear === 'all' ? 'No transactions.' : `No transactions in ${selectedYear}.`}
          </p>
        )}
        {chartTrend && chartTrend.length > 0 && <BalanceTrendChart points={chartTrend} />}
      </div>

      <CategorySpendingSection accountId={accountId} selectedYear={selectedYear} />
    </>
  );
}

export function AccountsPage() {
  const { data: accounts, isPending, isError } = useAccounts();
  const { data: dateBounds } = useTransactionDateBounds();
  const [viewMode, setViewMode] = useState<'all' | 'account'>('all');
  const [selectedAccountId, setSelectedAccountId] = useState<number | undefined>(undefined);
  const [selectedYear, setSelectedYear] = useState<YearFilter>(new Date().getFullYear());
  const selectedAccount = accounts?.find((a) => a.id === selectedAccountId);
  const earliestYear = dateBounds?.earliestDate ? Number(dateBounds.earliestDate.slice(0, 4)) : undefined;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Accounts</h1>
        <YearFilterControl selectedYear={selectedYear} onChange={setSelectedYear} earliestYear={earliestYear} />
      </div>

      {isPending && <SkeletonRows rows={4} />}
      {isError && <p className="text-sm text-red-600 dark:text-red-400">Failed to load accounts.</p>}
      {accounts && accounts.length === 0 && (
        <p className="text-sm text-slate-500">
          No accounts yet — add one under Settings to see balance trends here.
        </p>
      )}

      {accounts && accounts.length > 0 && (
        <>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setViewMode('all')}
              className={`rounded-md border px-3 py-1.5 text-sm font-medium ${
                viewMode === 'all'
                  ? 'border-slate-900 bg-slate-900 text-white dark:border-slate-100 dark:bg-slate-100 dark:text-slate-900'
                  : 'border-slate-300 text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800'
              }`}
            >
              All accounts
            </button>
            {accounts.map((account) => (
              <button
                key={account.id}
                onClick={() => {
                  setViewMode('account');
                  setSelectedAccountId(account.id);
                }}
                className={`rounded-md border px-3 py-1.5 text-sm font-medium ${
                  viewMode === 'account' && selectedAccountId === account.id
                    ? 'border-slate-900 bg-slate-900 text-white dark:border-slate-100 dark:bg-slate-100 dark:text-slate-900'
                    : 'border-slate-300 text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800'
                }`}
              >
                {account.name}
              </button>
            ))}
          </div>

          {viewMode === 'all' && <AccountsContent selectedYear={selectedYear} />}
          {viewMode === 'account' && selectedAccount && (
            <AccountDetail account={selectedAccount} selectedYear={selectedYear} />
          )}
        </>
      )}
    </div>
  );
}
