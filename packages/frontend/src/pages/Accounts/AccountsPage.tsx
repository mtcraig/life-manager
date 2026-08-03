import { useState } from 'react';
import { useQueries } from '@tanstack/react-query';
import type { AccountDto } from '@life-manager/shared';
import { BalanceTrendChart } from '../../components/charts/BalanceTrendChart.js';
import { CategorySpendingChart } from '../../components/charts/CategorySpendingChart.js';
import { YearFilter as YearFilterControl } from '../../components/YearFilter.js';
import { useAccounts } from '../../hooks/useAccounts.js';
import {
  useAccountBalanceTrend,
  useCategorySummaryByMonth,
  useTransactionDateBounds,
} from '../../hooks/useAnalytics.js';
import { fetchAccountBalanceTrend } from '../../api/analytics.js';
import { formatMoney } from '../../lib/formatMoney.js';
import type { YearFilterValue } from '../../lib/yearFilter.js';
import { dateRangeForYear } from '../../lib/yearFilter.js';

const INSTITUTION_CLASS = 'text-indigo-600 dark:text-indigo-400 font-medium';

/** savings -> amber, everything else (including credit_card, now correctly signed negative when owed) by sign. */
function accountBalanceClass(type: AccountDto['type'], balance: number): string {
  if (type === 'savings') return 'text-amber-600 dark:text-amber-400';
  return balance >= 0 ? 'text-green-700 dark:text-green-400' : 'text-red-600 dark:text-red-400';
}

type YearFilter = YearFilterValue;

function CategorySpendingSection({
  accountId,
  selectedYear,
}: {
  accountId: number | undefined;
  selectedYear: YearFilter;
}) {
  const { data: rows, isPending, isError } = useCategorySummaryByMonth({
    accountId,
    ...dateRangeForYear(selectedYear),
  });

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
      <h2 className="mb-3 text-sm font-medium text-slate-700 dark:text-slate-300">
        Spending by category ({selectedYear === 'all' ? 'all time' : selectedYear})
      </h2>
      {isPending && <p className="text-sm text-slate-500">Loading…</p>}
      {isError && <p className="text-sm text-red-600 dark:text-red-400">Failed to load category spending.</p>}
      {rows && rows.length === 0 && (
        <p className="text-sm text-slate-500">
          No spending {selectedYear === 'all' ? 'yet' : `in ${selectedYear}`}.
        </p>
      )}
      {rows && rows.length > 0 && <CategorySpendingChart rows={rows} />}
    </div>
  );
}

function AllAccountsSummary({ accounts, selectedYear }: { accounts: AccountDto[]; selectedYear: YearFilter }) {
  const balanceQueries = useQueries({
    queries: accounts.map((account) => ({
      queryKey: ['analytics', 'account-balance-trend', { accountId: account.id }],
      queryFn: () => fetchAccountBalanceTrend({ accountId: account.id }),
    })),
  });

  const isPending = balanceQueries.some((q) => q.isPending);
  const balances = accounts.map((account, i) => {
    const trend = balanceQueries[i]?.data;
    const latest = trend && trend.length > 0 ? trend[trend.length - 1] : undefined;
    return { account, balance: latest?.balance ?? 0 };
  });
  const combinedBalance = balances.reduce((sum, b) => sum + b.balance, 0);

  return (
    <>
      <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
        <div className="text-xs uppercase tracking-wide text-slate-500">Combined balance</div>
        {isPending ? (
          <p className="mt-1 text-sm text-slate-500">Loading…</p>
        ) : (
          <div
            className={`mt-1 text-2xl font-semibold ${
              combinedBalance >= 0 ? 'text-green-700 dark:text-green-400' : 'text-red-600 dark:text-red-400'
            }`}
          >
            {formatMoney(combinedBalance)}
          </div>
        )}
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
        <h2 className="mb-3 text-sm font-medium text-slate-700 dark:text-slate-300">Per-account balances</h2>
        <ul className="divide-y divide-slate-100 dark:divide-slate-800">
          {balances.map(({ account, balance }) => (
            <li key={account.id} className="flex items-center justify-between py-2 text-sm">
              <span className="text-slate-700 dark:text-slate-300">
                {account.name}
                {account.institution && (
                  <span className={`ml-2 text-xs ${INSTITUTION_CLASS}`}>{account.institution}</span>
                )}
              </span>
              <span className={`font-medium ${accountBalanceClass(account.type, balance)}`}>
                {formatMoney(balance)}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <CategorySpendingSection accountId={undefined} selectedYear={selectedYear} />
    </>
  );
}

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
      <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
        <h2 className="text-sm font-medium text-slate-700 dark:text-slate-300">
          {account.name}
          {account.institution && (
            <span className={`ml-2 text-xs ${INSTITUTION_CLASS}`}>{account.institution}</span>
          )}
        </h2>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
        <div className="text-xs uppercase tracking-wide text-slate-500">{balanceLabel}</div>
        <div className={`mt-1 text-2xl font-semibold ${accountBalanceClass(account.type, currentBalance)}`}>
          {formatMoney(currentBalance)}
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
        {isTrendPending && <p className="text-sm text-slate-500">Loading…</p>}
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

      {isPending && <p className="text-sm text-slate-500">Loading…</p>}
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

          {viewMode === 'all' && <AllAccountsSummary accounts={accounts} selectedYear={selectedYear} />}
          {viewMode === 'account' && selectedAccount && (
            <AccountDetail account={selectedAccount} selectedYear={selectedYear} />
          )}
        </>
      )}
    </div>
  );
}
