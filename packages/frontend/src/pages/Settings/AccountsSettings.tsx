import { useState } from 'react';
import { ACCOUNT_TYPES, DATE_FORMATS, INGESTION_MODES } from '@life-manager/shared';
import type { AccountDto, CreateAccountInput } from '@life-manager/shared';
import {
  useAccounts,
  useArchiveAccount,
  useCreateAccount,
  useIngestAccount,
} from '../../hooks/useAccounts.js';

const EMPTY_FORM: CreateAccountInput = {
  name: '',
  type: 'current',
  ingestionMode: 'manual',
  institution: undefined,
  folderPath: undefined,
  columnMapping: undefined,
};

export function AccountsSettings() {
  const { data: accounts, isPending, isError } = useAccounts(true);
  const createAccount = useCreateAccount();
  const archiveAccount = useArchiveAccount();
  const ingestAccount = useIngestAccount();

  const [form, setForm] = useState<CreateAccountInput>(EMPTY_FORM);
  const [amountMode, setAmountMode] = useState<'signed' | 'debit-credit'>('signed');
  const [dateColumn, setDateColumn] = useState('Date');
  const [descriptionColumn, setDescriptionColumn] = useState('Description');
  const [amountColumn, setAmountColumn] = useState('Amount');
  const [debitColumn, setDebitColumn] = useState('Debit');
  const [creditColumn, setCreditColumn] = useState('Credit');
  const [dateFormat, setDateFormat] = useState<(typeof DATE_FORMATS)[number]>('YYYY-MM-DD');
  const [formError, setFormError] = useState<string | null>(null);
  const [ingestMessage, setIngestMessage] = useState<string | null>(null);

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setFormError(null);

    const columnMapping =
      form.folderPath && form.folderPath.length > 0
        ? {
            date: dateColumn,
            description: descriptionColumn,
            dateFormat,
            ...(amountMode === 'signed'
              ? { amount: amountColumn }
              : { debit: debitColumn, credit: creditColumn }),
          }
        : undefined;

    createAccount.mutate(
      { ...form, columnMapping },
      {
        onSuccess: () => setForm(EMPTY_FORM),
        onError: (error) => setFormError(error instanceof Error ? error.message : String(error)),
      },
    );
  }

  function handleIngest(accountId: number) {
    setIngestMessage(null);
    ingestAccount.mutate(accountId, {
      onSuccess: (results) => {
        const summary = results
          .map((r) => `${r.fileName}: ${r.status === 'success' ? `${r.rowsIngested} ingested, ${r.rowsSkipped} skipped` : r.errorMessage}`)
          .join('; ');
        setIngestMessage(summary || 'No CSV files found in the configured folder.');
      },
      onError: (error) => setIngestMessage(error instanceof Error ? error.message : String(error)),
    });
  }

  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-slate-200 bg-white p-4">
        <h2 className="mb-3 text-lg font-semibold text-slate-900">Add account</h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <label className="text-sm text-slate-700">
              Name
              <input
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-sm"
              />
            </label>
            <label className="text-sm text-slate-700">
              Type
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value as CreateAccountInput['type'] })}
                className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-sm"
              >
                {ACCOUNT_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm text-slate-700">
              Institution (optional)
              <input
                value={form.institution ?? ''}
                onChange={(e) => setForm({ ...form, institution: e.target.value || undefined })}
                className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-sm"
              />
            </label>
            <label className="text-sm text-slate-700">
              Ingestion mode
              <select
                value={form.ingestionMode}
                onChange={(e) =>
                  setForm({ ...form, ingestionMode: e.target.value as CreateAccountInput['ingestionMode'] })
                }
                className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-sm"
              >
                {INGESTION_MODES.map((mode) => (
                  <option key={mode} value={mode}>
                    {mode}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="block text-sm text-slate-700">
            CSV folder path (leave blank if this account has no CSV ingestion yet)
            <input
              value={form.folderPath ?? ''}
              onChange={(e) => setForm({ ...form, folderPath: e.target.value || undefined })}
              placeholder="C:/Users/you/Documents/Life Manager/accounts/current-account"
              className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-sm"
            />
          </label>

          {form.folderPath && (
            <div className="rounded-md border border-slate-100 bg-slate-50 p-3">
              <h3 className="mb-2 text-sm font-medium text-slate-800">CSV column mapping</h3>
              <div className="mb-2 flex gap-4 text-sm text-slate-700">
                <label className="flex items-center gap-1">
                  <input
                    type="radio"
                    checked={amountMode === 'signed'}
                    onChange={() => setAmountMode('signed')}
                  />
                  Single signed amount column
                </label>
                <label className="flex items-center gap-1">
                  <input
                    type="radio"
                    checked={amountMode === 'debit-credit'}
                    onChange={() => setAmountMode('debit-credit')}
                  />
                  Separate debit/credit columns
                </label>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <label className="text-sm text-slate-700">
                  Date column header
                  <input
                    value={dateColumn}
                    onChange={(e) => setDateColumn(e.target.value)}
                    className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-sm"
                  />
                </label>
                <label className="text-sm text-slate-700">
                  Date format
                  <select
                    value={dateFormat}
                    onChange={(e) => setDateFormat(e.target.value as (typeof DATE_FORMATS)[number])}
                    className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-sm"
                  >
                    {DATE_FORMATS.map((f) => (
                      <option key={f} value={f}>
                        {f}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="text-sm text-slate-700">
                  Description column header
                  <input
                    value={descriptionColumn}
                    onChange={(e) => setDescriptionColumn(e.target.value)}
                    className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-sm"
                  />
                </label>
                {amountMode === 'signed' ? (
                  <label className="text-sm text-slate-700">
                    Amount column header
                    <input
                      value={amountColumn}
                      onChange={(e) => setAmountColumn(e.target.value)}
                      className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-sm"
                    />
                  </label>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    <label className="text-sm text-slate-700">
                      Debit column header
                      <input
                        value={debitColumn}
                        onChange={(e) => setDebitColumn(e.target.value)}
                        className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-sm"
                      />
                    </label>
                    <label className="text-sm text-slate-700">
                      Credit column header
                      <input
                        value={creditColumn}
                        onChange={(e) => setCreditColumn(e.target.value)}
                        className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-sm"
                      />
                    </label>
                  </div>
                )}
              </div>
            </div>
          )}

          {formError && <p className="text-sm text-red-600">{formError}</p>}

          <button
            type="submit"
            disabled={createAccount.isPending}
            className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50"
          >
            {createAccount.isPending ? 'Adding…' : 'Add account'}
          </button>
        </form>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-4">
        <h2 className="mb-3 text-lg font-semibold text-slate-900">Accounts</h2>
        {ingestMessage && <p className="mb-2 text-sm text-slate-600">{ingestMessage}</p>}
        {isPending && <p className="text-sm text-slate-500">Loading…</p>}
        {isError && <p className="text-sm text-red-600">Failed to load accounts.</p>}
        <ul className="divide-y divide-slate-100">
          {accounts?.map((account: AccountDto) => (
            <li key={account.id} className="flex items-center justify-between py-2">
              <div>
                <span className="font-medium text-slate-900">{account.name}</span>
                <span className="ml-2 text-xs text-slate-500">
                  {account.type} · {account.ingestionMode}
                  {account.archivedAt ? ' · archived' : ''}
                </span>
                {account.folderPath && (
                  <div className="text-xs text-slate-400">{account.folderPath}</div>
                )}
              </div>
              <div className="flex gap-2">
                {account.folderPath && !account.archivedAt && (
                  <button
                    onClick={() => handleIngest(account.id)}
                    disabled={ingestAccount.isPending}
                    className="rounded-md border border-slate-300 px-3 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                  >
                    Ingest now
                  </button>
                )}
                {!account.archivedAt && (
                  <button
                    onClick={() => archiveAccount.mutate(account.id)}
                    className="rounded-md border border-slate-300 px-3 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
                  >
                    Archive
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
