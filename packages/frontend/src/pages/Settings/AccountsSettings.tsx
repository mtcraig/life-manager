import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { ACCOUNT_TYPES, DATE_FORMATS, INGESTION_MODES } from '@life-manager/shared';
import type {
  AccountDto,
  ColumnMapping,
  CreateAccountInput,
  DateFormat,
  IngestResultDto,
} from '@life-manager/shared';
import {
  useAccounts,
  useCreateAccount,
  useDeleteAccount,
  useIngestAccount,
  useUpdateAccount,
} from '../../hooks/useAccounts.js';
import { useJob } from '../../hooks/useJobs.js';
import { JobProgressBar } from '../../components/JobProgressBar.js';
import { humanizeEnumValue } from '../../lib/humanize.js';
import { BTN_PRIMARY, BTN_ROW_ACTION } from '../../theme/tokens.js';

interface AccountFormDraft {
  name: string;
  type: CreateAccountInput['type'];
  institution: string;
  ingestionMode: CreateAccountInput['ingestionMode'];
  folderPath: string;
  amountMode: 'signed' | 'debit-credit';
  dateColumn: string;
  descriptionColumn: string;
  amountColumn: string;
  debitColumn: string;
  creditColumn: string;
  balanceColumn: string;
  dateFormat: DateFormat;
}

const EMPTY_DRAFT: AccountFormDraft = {
  name: '',
  type: 'current',
  institution: '',
  ingestionMode: 'manual',
  folderPath: '',
  amountMode: 'signed',
  dateColumn: 'Date',
  descriptionColumn: 'Description',
  amountColumn: 'Amount',
  debitColumn: 'Debit',
  creditColumn: 'Credit',
  balanceColumn: '',
  dateFormat: 'YYYY-MM-DD',
};

function draftFromAccount(account: AccountDto): AccountFormDraft {
  const mapping = account.columnMapping;
  return {
    name: account.name,
    type: account.type,
    institution: account.institution ?? '',
    ingestionMode: account.ingestionMode,
    folderPath: account.folderPath ?? '',
    amountMode: mapping?.debit && mapping?.credit ? 'debit-credit' : 'signed',
    dateColumn: mapping?.date ?? 'Date',
    descriptionColumn: mapping?.description ?? 'Description',
    amountColumn: mapping?.amount ?? 'Amount',
    debitColumn: mapping?.debit ?? 'Debit',
    creditColumn: mapping?.credit ?? 'Credit',
    balanceColumn: mapping?.balance ?? '',
    dateFormat: mapping?.dateFormat ?? 'YYYY-MM-DD',
  };
}

function buildAccountInput(draft: AccountFormDraft): CreateAccountInput {
  const columnMapping: ColumnMapping | undefined = draft.folderPath
    ? {
        date: draft.dateColumn,
        description: draft.descriptionColumn,
        dateFormat: draft.dateFormat,
        ...(draft.amountMode === 'signed'
          ? { amount: draft.amountColumn }
          : { debit: draft.debitColumn, credit: draft.creditColumn }),
        ...(draft.balanceColumn ? { balance: draft.balanceColumn } : {}),
      }
    : undefined;

  return {
    name: draft.name,
    type: draft.type,
    institution: draft.institution || undefined,
    ingestionMode: draft.ingestionMode,
    folderPath: draft.folderPath || undefined,
    columnMapping,
  };
}

function AccountFormFields({
  draft,
  onChange,
}: {
  draft: AccountFormDraft;
  onChange: (patch: Partial<AccountFormDraft>) => void;
}) {
  return (
    <>
      <div className="grid grid-cols-2 gap-3">
        <label className="text-sm text-slate-700 dark:text-slate-300">
          Name
          <input
            required
            value={draft.name}
            onChange={(e) => onChange({ name: e.target.value })}
            className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          />
        </label>
        <label className="text-sm text-slate-700 dark:text-slate-300">
          Type
          <select
            value={draft.type}
            onChange={(e) => onChange({ type: e.target.value as CreateAccountInput['type'] })}
            className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          >
            {ACCOUNT_TYPES.map((type) => (
              <option key={type} value={type}>
                {humanizeEnumValue(type)}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm text-slate-700 dark:text-slate-300">
          Institution (optional)
          <input
            value={draft.institution}
            onChange={(e) => onChange({ institution: e.target.value })}
            className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          />
        </label>
        <label className="text-sm text-slate-700 dark:text-slate-300">
          Ingestion mode
          <select
            value={draft.ingestionMode}
            onChange={(e) =>
              onChange({ ingestionMode: e.target.value as CreateAccountInput['ingestionMode'] })
            }
            className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          >
            {INGESTION_MODES.map((mode) => (
              <option key={mode} value={mode}>
                {humanizeEnumValue(mode)}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="block text-sm text-slate-700 dark:text-slate-300">
        CSV folder path (leave blank if this account has no CSV ingestion yet)
        <input
          value={draft.folderPath}
          onChange={(e) => onChange({ folderPath: e.target.value })}
          placeholder="C:/Users/you/Documents/Life Manager/accounts/current-account"
          className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
        />
      </label>

      {draft.folderPath && (
        <div className="rounded-md border border-slate-100 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950">
          <h3 className="mb-2 text-sm font-medium text-slate-800 dark:text-slate-200">CSV column mapping</h3>
          <div className="mb-2 flex gap-4 text-sm text-slate-700 dark:text-slate-300">
            <label className="flex items-center gap-1">
              <input
                type="radio"
                checked={draft.amountMode === 'signed'}
                onChange={() => onChange({ amountMode: 'signed' })}
              />
              Single signed amount column
            </label>
            <label className="flex items-center gap-1">
              <input
                type="radio"
                checked={draft.amountMode === 'debit-credit'}
                onChange={() => onChange({ amountMode: 'debit-credit' })}
              />
              Separate debit/credit columns
            </label>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <label className="text-sm text-slate-700 dark:text-slate-300">
              Date column header
              <input
                value={draft.dateColumn}
                onChange={(e) => onChange({ dateColumn: e.target.value })}
                className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
            </label>
            <label className="text-sm text-slate-700 dark:text-slate-300">
              Date format
              <select
                value={draft.dateFormat}
                onChange={(e) => onChange({ dateFormat: e.target.value as DateFormat })}
                className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              >
                {DATE_FORMATS.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm text-slate-700 dark:text-slate-300">
              Description column header
              <input
                value={draft.descriptionColumn}
                onChange={(e) => onChange({ descriptionColumn: e.target.value })}
                className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
            </label>
            {draft.amountMode === 'signed' ? (
              <label className="text-sm text-slate-700 dark:text-slate-300">
                Amount column header
                <input
                  value={draft.amountColumn}
                  onChange={(e) => onChange({ amountColumn: e.target.value })}
                  className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                />
              </label>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <label className="text-sm text-slate-700 dark:text-slate-300">
                  Debit column header
                  <input
                    value={draft.debitColumn}
                    onChange={(e) => onChange({ debitColumn: e.target.value })}
                    className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  />
                </label>
                <label className="text-sm text-slate-700 dark:text-slate-300">
                  Credit column header
                  <input
                    value={draft.creditColumn}
                    onChange={(e) => onChange({ creditColumn: e.target.value })}
                    className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  />
                </label>
              </div>
            )}
            <label className="text-sm text-slate-700 dark:text-slate-300">
              Balance column header (optional)
              <input
                value={draft.balanceColumn}
                onChange={(e) => onChange({ balanceColumn: e.target.value })}
                placeholder="e.g. Balance"
                className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
            </label>
          </div>
        </div>
      )}
    </>
  );
}

const INGEST_STATUS_TONE_CLASSES: Record<IngestResultDto['status'], string> = {
  success: 'text-green-700 dark:text-green-400',
  warning: 'text-amber-600 dark:text-amber-400',
  error: 'text-red-600 dark:text-red-400',
};

function ingestResultMessage(result: IngestResultDto): string {
  if (result.status === 'error') return result.errorMessage ?? 'Failed';
  if (result.status === 'warning') return `${result.rowsIngested} ingested, ${result.rowsSkipped} skipped`;
  return `${result.rowsIngested} ingested`;
}

function AccountEditRow({ account, onDone }: { account: AccountDto; onDone: () => void }) {
  const updateAccount = useUpdateAccount();
  const [draft, setDraft] = useState<AccountFormDraft>(() => draftFromAccount(account));
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    updateAccount.mutate(
      { id: account.id, input: buildAccountInput(draft) },
      {
        onSuccess: () => onDone(),
        onError: (err) => setError(err instanceof Error ? err.message : String(err)),
      },
    );
  }

  return (
    <li className="py-2">
      <form onSubmit={handleSubmit} className="space-y-3">
        <AccountFormFields draft={draft} onChange={(patch) => setDraft({ ...draft, ...patch })} />
        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
        <div className="flex gap-2">
          <button type="submit" disabled={updateAccount.isPending} className={BTN_PRIMARY}>
            {updateAccount.isPending ? 'Saving…' : 'Save'}
          </button>
          <button type="button" onClick={onDone} className={BTN_ROW_ACTION}>
            Cancel
          </button>
        </div>
      </form>
    </li>
  );
}

export function AccountsSettings() {
  const { data: accounts, isPending, isError } = useAccounts();
  const createAccount = useCreateAccount();
  const deleteAccount = useDeleteAccount();
  const ingestAccount = useIngestAccount();
  const queryClient = useQueryClient();

  const [draft, setDraft] = useState<AccountFormDraft>(EMPTY_DRAFT);
  const [formError, setFormError] = useState<string | null>(null);
  const [ingestResults, setIngestResults] = useState<IngestResultDto[] | null>(null);
  const [ingestEmptyMessage, setIngestEmptyMessage] = useState<string | null>(null);
  const [ingestJobId, setIngestJobId] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);

  const { data: ingestJob } = useJob(ingestJobId);

  useEffect(() => {
    if (!ingestJob || ingestJob.status === 'running') return;
    if (ingestJob.status === 'completed') {
      const results: IngestResultDto[] = JSON.parse(ingestJob.resultJson ?? '[]');
      if (results.length === 0) {
        setIngestEmptyMessage('No CSV files found in the configured folder.');
      } else {
        setIngestResults(results);
      }
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    } else {
      setIngestEmptyMessage(ingestJob.errorMessage ?? 'Ingestion failed.');
    }
    setIngestJobId(null);
  }, [ingestJob, queryClient]);

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setFormError(null);

    createAccount.mutate(buildAccountInput(draft), {
      onSuccess: () => setDraft(EMPTY_DRAFT),
      onError: (error) => setFormError(error instanceof Error ? error.message : String(error)),
    });
  }

  function handleDelete(account: AccountDto) {
    const confirmed = window.confirm(
      `Permanently delete "${account.name}" and ALL its transactions and ingestion history? This cannot be undone.`,
    );
    if (!confirmed) return;
    deleteAccount.mutate(account.id);
  }

  function handleIngest(accountId: number) {
    setIngestResults(null);
    setIngestEmptyMessage(null);
    ingestAccount.mutate(accountId, {
      onSuccess: (result) => setIngestJobId(result.jobId),
      onError: (error) =>
        setIngestEmptyMessage(error instanceof Error ? error.message : String(error)),
    });
  }

  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
        <h2 className="mb-3 text-lg font-semibold text-slate-900 dark:text-slate-100">Add account</h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <AccountFormFields draft={draft} onChange={(patch) => setDraft({ ...draft, ...patch })} />

          {formError && <p className="text-sm text-red-600 dark:text-red-400">{formError}</p>}

          <button type="submit" disabled={createAccount.isPending} className={BTN_PRIMARY}>
            {createAccount.isPending ? 'Adding…' : 'Add account'}
          </button>
        </form>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
        <h2 className="mb-3 text-lg font-semibold text-slate-900 dark:text-slate-100">Accounts</h2>
        {ingestJobId !== null && (
          <div className="mb-2">
            <JobProgressBar jobId={ingestJobId} />
          </div>
        )}
        {ingestEmptyMessage && (
          <p className="mb-2 text-sm text-slate-600 dark:text-slate-400">{ingestEmptyMessage}</p>
        )}
        {ingestResults && (
          <ul className="mb-2 space-y-0.5">
            {ingestResults.map((result, index) => (
              <li key={`${result.fileName}-${index}`} className="text-sm">
                <span className="text-slate-600 dark:text-slate-400">{result.fileName}: </span>
                <span className={`font-medium ${INGEST_STATUS_TONE_CLASSES[result.status]}`}>
                  {ingestResultMessage(result)}
                </span>
              </li>
            ))}
          </ul>
        )}
        {isPending && <p className="text-sm text-slate-500">Loading…</p>}
        {isError && <p className="text-sm text-red-600 dark:text-red-400">Failed to load accounts.</p>}
        <ul className="divide-y divide-slate-100 dark:divide-slate-800">
          {accounts?.map((account: AccountDto) =>
            editingId === account.id ? (
              <AccountEditRow key={account.id} account={account} onDone={() => setEditingId(null)} />
            ) : (
              <li key={account.id} className="flex items-center justify-between py-2">
                <div>
                  <span className="font-medium text-slate-900 dark:text-slate-100">{account.name}</span>
                  {account.institution && (
                    <span className="ml-2 text-xs font-medium text-indigo-600 dark:text-indigo-400">
                      {account.institution}
                    </span>
                  )}
                  <span className="ml-2 text-xs text-slate-500">
                    {humanizeEnumValue(account.type)} · {humanizeEnumValue(account.ingestionMode)}
                  </span>
                  {account.folderPath && (
                    <div className="text-xs text-slate-400">{account.folderPath}</div>
                  )}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setEditingId(account.id)} className={BTN_ROW_ACTION}>
                    Edit
                  </button>
                  {account.folderPath && (
                    <button
                      onClick={() => handleIngest(account.id)}
                      disabled={ingestAccount.isPending || ingestJobId !== null}
                      className={BTN_ROW_ACTION}
                    >
                      Ingest now
                    </button>
                  )}
                  <button onClick={() => handleDelete(account)} className={BTN_ROW_ACTION}>
                    Delete
                  </button>
                </div>
              </li>
            ),
          )}
        </ul>
      </section>
    </div>
  );
}
