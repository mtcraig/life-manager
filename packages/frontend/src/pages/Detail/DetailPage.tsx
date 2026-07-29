import { useState } from 'react';
import { useAccounts } from '../../hooks/useAccounts.js';
import { useCategories } from '../../hooks/useCategories.js';
import { useTransactions, useUpdateTransactionCategory } from '../../hooks/useTransactions.js';
import { formatMoney } from '../../lib/formatMoney.js';

export function DetailPage() {
  const { data: accounts } = useAccounts();
  const { data: categories } = useCategories();
  const updateCategory = useUpdateTransactionCategory();
  const [accountId, setAccountId] = useState<string>('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [uncategorisedOnly, setUncategorisedOnly] = useState(false);
  const [page, setPage] = useState(1);

  const { data, isPending, isError } = useTransactions({
    accountId: accountId ? Number(accountId) : undefined,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
    uncategorisedOnly: uncategorisedOnly || undefined,
    page,
    pageSize: 50,
  });

  const accountNameById = new Map(accounts?.map((a) => [a.id, a.name]));

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-slate-900">Detail</h1>

      <div className="flex flex-wrap items-end gap-3 rounded-lg border border-slate-200 bg-white p-4">
        <label className="text-sm text-slate-700">
          Account
          <select
            value={accountId}
            onChange={(e) => {
              setAccountId(e.target.value);
              setPage(1);
            }}
            className="mt-1 block rounded-md border border-slate-300 px-2 py-1 text-sm"
          >
            <option value="">All accounts</option>
            {accounts?.map((account) => (
              <option key={account.id} value={account.id}>
                {account.name}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm text-slate-700">
          From
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => {
              setDateFrom(e.target.value);
              setPage(1);
            }}
            className="mt-1 block rounded-md border border-slate-300 px-2 py-1 text-sm"
          />
        </label>
        <label className="text-sm text-slate-700">
          To
          <input
            type="date"
            value={dateTo}
            onChange={(e) => {
              setDateTo(e.target.value);
              setPage(1);
            }}
            className="mt-1 block rounded-md border border-slate-300 px-2 py-1 text-sm"
          />
        </label>
        <label className="flex items-center gap-1.5 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={uncategorisedOnly}
            onChange={(e) => {
              setUncategorisedOnly(e.target.checked);
              setPage(1);
            }}
          />
          Uncategorised only
        </label>
      </div>

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        {isPending && <p className="p-4 text-sm text-slate-500">Loading…</p>}
        {isError && <p className="p-4 text-sm text-red-600">Failed to load transactions.</p>}
        {data && (
          <>
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-2">Date</th>
                  <th className="px-4 py-2">Account</th>
                  <th className="px-4 py-2">Description</th>
                  <th className="px-4 py-2">Category</th>
                  <th className="px-4 py-2 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.items.map((tx) => (
                  <tr key={tx.id}>
                    <td className="px-4 py-2">{tx.date}</td>
                    <td className="px-4 py-2">{accountNameById.get(tx.accountId) ?? tx.accountId}</td>
                    <td className="px-4 py-2">{tx.description}</td>
                    <td className="px-4 py-2">
                      <select
                        value={tx.categoryId ?? ''}
                        onChange={(e) =>
                          updateCategory.mutate({
                            id: tx.id,
                            input: { categoryId: e.target.value ? Number(e.target.value) : null },
                          })
                        }
                        className={`rounded-md border border-slate-300 px-1.5 py-0.5 text-xs ${
                          tx.categoryId === null ? 'text-amber-600' : 'text-slate-700'
                        }`}
                      >
                        <option value="">Uncategorised</option>
                        {categories?.map((category) => (
                          <option key={category.id} value={category.id}>
                            {category.name}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td
                      className={`px-4 py-2 text-right ${tx.amount < 0 ? 'text-red-600' : 'text-green-700'}`}
                    >
                      {formatMoney(tx.amount)}
                    </td>
                  </tr>
                ))}
                {data.items.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-6 text-center text-slate-500">
                      No transactions match these filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            <div className="flex items-center justify-between border-t border-slate-100 px-4 py-2 text-sm text-slate-600">
              <span>
                {data.total} total · page {data.page}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="rounded-md border border-slate-300 px-2 py-1 text-xs disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage((p) => p + 1)}
                  disabled={data.items.length < data.pageSize}
                  className="rounded-md border border-slate-300 px-2 py-1 text-xs disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
