import { useQueries } from '@tanstack/react-query';
import type { AccountDto } from '@life-manager/shared';
import { CategorySpendingChart } from '../../components/charts/CategorySpendingChart.js';
import { Sparkline } from '../../components/charts/Sparkline.js';
import { Skeleton, SkeletonChart, SkeletonRows } from '../../components/Skeleton.js';
import { useAccounts } from '../../hooks/useAccounts.js';
import { useCategorySummaryByMonth } from '../../hooks/useAnalytics.js';
import { fetchAccountBalanceTrend } from '../../api/analytics.js';
import { formatMoney } from '../../lib/formatMoney.js';
import type { YearFilterValue } from '../../lib/yearFilter.js';
import { dateRangeForYear } from '../../lib/yearFilter.js';

export const INSTITUTION_CLASS = 'text-indigo-600 dark:text-indigo-400 font-medium';

/** savings -> amber, everything else (including credit_card, now correctly signed negative when owed) by sign. */
export function accountBalanceClass(type: AccountDto['type'], balance: number): string {
  if (type === 'savings') return 'text-amber-600 dark:text-amber-400';
  return balance >= 0 ? 'text-green-700 dark:text-green-400' : 'text-red-600 dark:text-red-400';
}

export function CategorySpendingSection({
  accountId,
  selectedYear,
}: {
  accountId: number | undefined;
  selectedYear: YearFilterValue;
}) {
  const { data: rows, isPending, isError } = useCategorySummaryByMonth({
    accountId,
    ...dateRangeForYear(selectedYear),
  });

  return (
    <div className="card-surface p-4">
      <h2 className="mb-3 text-sm font-medium text-slate-700 dark:text-slate-300">
        Spending by category ({selectedYear === 'all' ? 'all time' : selectedYear})
      </h2>
      {isPending && <SkeletonChart className="h-56 w-full" />}
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

export function AllAccountsSummary({ accounts, selectedYear }: { accounts: AccountDto[]; selectedYear: YearFilterValue }) {
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
    return { account, balance: latest?.balance ?? 0, trend };
  });
  const combinedBalance = balances.reduce((sum, b) => sum + b.balance, 0);

  return (
    <>
      <div className="card-surface p-4">
        <div className="text-xs uppercase tracking-wide text-slate-500">Combined balance</div>
        {isPending ? (
          <Skeleton className="mt-1 h-8 w-40" />
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

      <div className="card-surface p-4">
        <h2 className="mb-3 text-sm font-medium text-slate-700 dark:text-slate-300">Per-account balances</h2>
        <ul className="divide-y divide-slate-100 dark:divide-slate-800">
          {balances.map(({ account, balance, trend }) => (
            <li key={account.id} className="flex items-center justify-between gap-4 py-2 text-sm">
              <span className="text-slate-700 dark:text-slate-300">
                {account.name}
                {account.institution && (
                  <span className={`ml-2 text-xs ${INSTITUTION_CLASS}`}>{account.institution}</span>
                )}
              </span>
              <span className="flex items-center gap-3">
                <span className="flex w-24 shrink-0 justify-end">{trend && <Sparkline points={trend} />}</span>
                <span className={`w-32 shrink-0 text-right font-medium ${accountBalanceClass(account.type, balance)}`}>
                  {formatMoney(balance)}
                </span>
              </span>
            </li>
          ))}
        </ul>
      </div>

      <CategorySpendingSection accountId={undefined} selectedYear={selectedYear} />
    </>
  );
}

export function AccountsContent({ selectedYear }: { selectedYear: YearFilterValue }) {
  const { data: accounts, isPending, isError } = useAccounts();

  if (isPending) return <SkeletonRows rows={4} />;
  if (isError) return <p className="text-sm text-red-600 dark:text-red-400">Failed to load accounts.</p>;
  if (!accounts || accounts.length === 0) {
    return (
      <p className="text-sm text-slate-500">No accounts yet — add one under Settings to see balance trends here.</p>
    );
  }

  return <AllAccountsSummary accounts={accounts} selectedYear={selectedYear} />;
}
