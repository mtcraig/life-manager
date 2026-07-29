import { useEffect, useState } from 'react';
import { BalanceTrendChart } from '../../components/charts/BalanceTrendChart.js';
import { useAccounts } from '../../hooks/useAccounts.js';
import { useAccountBalanceTrend } from '../../hooks/useAnalytics.js';
import { formatMoney } from '../../lib/formatMoney.js';

export function AccountsPage() {
  const { data: accounts, isPending, isError } = useAccounts();
  const [selectedAccountId, setSelectedAccountId] = useState<number | undefined>(undefined);

  useEffect(() => {
    if (selectedAccountId === undefined && accounts && accounts.length > 0) {
      setSelectedAccountId(accounts[0]?.id);
    }
  }, [accounts, selectedAccountId]);

  const {
    data: trend,
    isPending: isTrendPending,
    isError: isTrendError,
  } = useAccountBalanceTrend({
    accountId: selectedAccountId as number,
  });

  const currentBalance = trend && trend.length > 0 ? trend[trend.length - 1]?.balance ?? 0 : 0;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-slate-900">Accounts</h1>

      {isPending && <p className="text-sm text-slate-500">Loading…</p>}
      {isError && <p className="text-sm text-red-600">Failed to load accounts.</p>}
      {accounts && accounts.length === 0 && (
        <p className="text-sm text-slate-500">
          No accounts yet — add one under Settings to see balance trends here.
        </p>
      )}

      {accounts && accounts.length > 0 && (
        <>
          <div className="flex flex-wrap gap-2">
            {accounts.map((account) => (
              <button
                key={account.id}
                onClick={() => setSelectedAccountId(account.id)}
                className={`rounded-md border px-3 py-1.5 text-sm font-medium ${
                  selectedAccountId === account.id
                    ? 'border-slate-900 bg-slate-900 text-white'
                    : 'border-slate-300 text-slate-700 hover:bg-slate-50'
                }`}
              >
                {account.name}
              </button>
            ))}
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <div className="text-xs uppercase tracking-wide text-slate-500">Balance (since first transaction)</div>
            <div className={`mt-1 text-2xl font-semibold ${currentBalance >= 0 ? 'text-green-700' : 'text-red-600'}`}>
              {formatMoney(currentBalance)}
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-4">
            {isTrendPending && <p className="text-sm text-slate-500">Loading…</p>}
            {isTrendError && <p className="text-sm text-red-600">Failed to load balance trend.</p>}
            {trend && trend.length === 0 && (
              <p className="text-sm text-slate-500">No transactions ingested for this account yet.</p>
            )}
            {trend && trend.length > 0 && <BalanceTrendChart points={trend} />}
          </div>
        </>
      )}
    </div>
  );
}
