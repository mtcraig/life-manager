import { useState } from 'react';
import { useAccounts } from '../../hooks/useAccounts.js';
import { useCategories } from '../../hooks/useCategories.js';
import { useVendors } from '../../hooks/useVendors.js';
import {
  useTransactions,
  useUpdateTransactionCategory,
  useUpdateTransactionVendor,
} from '../../hooks/useTransactions.js';
import { transactionExportUrl } from '../../api/transactions.js';
import { SkeletonRows } from '../../components/Skeleton.js';
import { formatDisplayDate, useDateFormat } from '../../lib/formatDate.js';
import { formatMoney } from '../../lib/formatMoney.js';
import { BTN_PRIMARY } from '../../theme/tokens.js';

export function DetailPage() {
  const dateFormat = useDateFormat();
  const { data: accounts } = useAccounts();
  const { data: categories } = useCategories();
  const { data: vendors } = useVendors();
  const updateCategory = useUpdateTransactionCategory();
  const updateVendor = useUpdateTransactionVendor();
  const [description, setDescription] = useState('');
  const [accountId, setAccountId] = useState<string>('');
  const [categoryId, setCategoryId] = useState<string>('');
  const [vendorId, setVendorId] = useState<string>('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [uncategorisedOnly, setUncategorisedOnly] = useState(false);
  const [page, setPage] = useState(1);

  const { data, isPending, isError } = useTransactions({
    description: description || undefined,
    accountId: accountId ? Number(accountId) : undefined,
    categoryId: categoryId ? Number(categoryId) : undefined,
    vendorId: vendorId ? Number(vendorId) : undefined,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
    uncategorisedOnly: uncategorisedOnly || undefined,
    page,
    pageSize: 50,
  });

  const accountNameById = new Map(accounts?.map((a) => [a.id, a.name]));

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Detail</h1>

      <div className="card-surface flex flex-wrap items-end gap-3 p-4">
        <label className="text-sm text-slate-700 dark:text-slate-300">
          Search
          <input
            type="text"
            value={description}
            onChange={(e) => {
              setDescription(e.target.value);
              setPage(1);
            }}
            placeholder="Description"
            className="mt-1 block rounded-md border border-slate-300 px-2 py-1 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          />
        </label>
        <label className="text-sm text-slate-700 dark:text-slate-300">
          Account
          <select
            value={accountId}
            onChange={(e) => {
              setAccountId(e.target.value);
              setPage(1);
            }}
            className="mt-1 block rounded-md border border-slate-300 px-2 py-1 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          >
            <option value="">All accounts</option>
            {accounts?.map((account) => (
              <option key={account.id} value={account.id}>
                {account.name}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm text-slate-700 dark:text-slate-300">
          Category
          <select
            value={categoryId}
            onChange={(e) => {
              setCategoryId(e.target.value);
              setPage(1);
            }}
            className="mt-1 block rounded-md border border-slate-300 px-2 py-1 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          >
            <option value="">All categories</option>
            {categories?.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm text-slate-700 dark:text-slate-300">
          Vendor
          <select
            value={vendorId}
            onChange={(e) => {
              setVendorId(e.target.value);
              setPage(1);
            }}
            className="mt-1 block rounded-md border border-slate-300 px-2 py-1 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          >
            <option value="">All vendors</option>
            {vendors?.map((vendor) => (
              <option key={vendor.id} value={vendor.id}>
                {vendor.name}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm text-slate-700 dark:text-slate-300">
          From
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => {
              setDateFrom(e.target.value);
              setPage(1);
            }}
            className="mt-1 block rounded-md border border-slate-300 px-2 py-1 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          />
        </label>
        <label className="text-sm text-slate-700 dark:text-slate-300">
          To
          <input
            type="date"
            value={dateTo}
            onChange={(e) => {
              setDateTo(e.target.value);
              setPage(1);
            }}
            className="mt-1 block rounded-md border border-slate-300 px-2 py-1 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          />
        </label>
        <label className="flex items-center gap-1.5 text-sm text-slate-700 dark:text-slate-300">
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
        <a
          href={transactionExportUrl({
            description: description || undefined,
            accountId: accountId ? Number(accountId) : undefined,
            categoryId: categoryId ? Number(categoryId) : undefined,
            vendorId: vendorId ? Number(vendorId) : undefined,
            dateFrom: dateFrom || undefined,
            dateTo: dateTo || undefined,
            uncategorisedOnly: uncategorisedOnly || undefined,
          })}
          className={`${BTN_PRIMARY} ml-auto`}
        >
          Export CSV
        </a>
      </div>

      <div className="card-surface overflow-hidden">
        {isPending && (
          <div className="p-4">
            <SkeletonRows rows={6} />
          </div>
        )}
        {isError && <p className="p-4 text-sm text-red-600 dark:text-red-400">Failed to load transactions.</p>}
        {data && (
          <>
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500 dark:bg-slate-800">
                <tr>
                  <th className="px-4 py-2">Date</th>
                  <th className="px-4 py-2">Account</th>
                  <th className="px-4 py-2">Description</th>
                  <th className="px-4 py-2">Category</th>
                  <th className="px-4 py-2">Vendor</th>
                  <th className="px-4 py-2 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {data.items.map((tx) => (
                  <tr key={tx.id}>
                    <td className="px-4 py-2 text-slate-900 dark:text-slate-100">
                      {formatDisplayDate(tx.date, dateFormat)}
                    </td>
                    <td className="px-4 py-2 text-slate-900 dark:text-slate-100">
                      {accountNameById.get(tx.accountId) ?? tx.accountId}
                    </td>
                    <td className="px-4 py-2 text-slate-900 dark:text-slate-100">{tx.description}</td>
                    <td className="px-4 py-2">
                      <select
                        value={tx.categoryId ?? ''}
                        onChange={(e) =>
                          updateCategory.mutate({
                            id: tx.id,
                            input: { categoryId: e.target.value ? Number(e.target.value) : null },
                          })
                        }
                        className={`rounded-md border border-slate-300 px-1.5 py-0.5 text-xs dark:border-slate-700 dark:bg-slate-800 ${
                          tx.categoryId === null
                            ? 'text-amber-600 dark:text-amber-400'
                            : 'text-slate-700 dark:text-slate-300'
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
                    <td className="px-4 py-2">
                      <select
                        value={tx.vendorId ?? ''}
                        onChange={(e) =>
                          updateVendor.mutate({
                            id: tx.id,
                            input: { vendorId: e.target.value ? Number(e.target.value) : null },
                          })
                        }
                        className="rounded-md border border-slate-300 px-1.5 py-0.5 text-xs text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                      >
                        <option value="">Unassigned</option>
                        {vendors?.map((vendor) => (
                          <option key={vendor.id} value={vendor.id}>
                            {vendor.name}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td
                      className={`px-4 py-2 text-right ${
                        tx.amount < 0 ? 'text-red-600 dark:text-red-400' : 'text-green-700 dark:text-green-400'
                      }`}
                    >
                      {formatMoney(tx.amount)}
                    </td>
                  </tr>
                ))}
                {data.items.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-6 text-center text-slate-500">
                      No transactions match these filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            <div className="flex items-center justify-between border-t border-slate-100 px-4 py-2 text-sm text-slate-600 dark:border-slate-800 dark:text-slate-400">
              <span>
                {data.total} total · page {data.page}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="rounded-md border border-slate-300 px-2 py-1 text-xs disabled:opacity-50 dark:border-slate-700"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage((p) => p + 1)}
                  disabled={data.items.length < data.pageSize}
                  className="rounded-md border border-slate-300 px-2 py-1 text-xs disabled:opacity-50 dark:border-slate-700"
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
