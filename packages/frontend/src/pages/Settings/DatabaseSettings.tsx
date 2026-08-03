import { useRef, useState } from 'react';
import { DATABASE_BACKUP_URL } from '../../api/database.js';
import { useImportDatabase, useResetDatabase } from '../../hooks/useDatabase.js';
import { BTN_PRIMARY } from '../../theme/tokens.js';

const BTN_IMPORT =
  'rounded-md border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-50 dark:border-red-900 dark:bg-slate-900 dark:text-red-400 dark:hover:bg-red-950';

export function DatabaseSettings() {
  const resetDatabase = useResetDatabase();
  const importDatabase = useImportDatabase();
  const [resetError, setResetError] = useState<string | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleReset() {
    setResetError(null);
    const typed = window.prompt(
      'This permanently deletes every account, transaction, investment, and everything else in the app, ' +
        'and cannot be undone. Download a backup first if you want to keep your data.\n\n' +
        'Type RESET to confirm:',
    );
    if (typed !== 'RESET') return;
    resetDatabase.mutate(undefined, {
      onError: (error) => setResetError(error instanceof Error ? error.message : String(error)),
    });
  }

  function handleImportClick() {
    setImportError(null);
    fileInputRef.current?.click();
  }

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = ''; // allow re-selecting the same file later
    if (!file) return;

    const typed = window.prompt(
      'This replaces every account, transaction, investment, and everything else currently in the app ' +
        "with the contents of the selected backup file, and cannot be undone. Download a backup of your " +
        'current data first if you want to keep it.\n\n' +
        'Type IMPORT to confirm:',
    );
    if (typed !== 'IMPORT') return;

    importDatabase.mutate(file, {
      onError: (error) => setImportError(error instanceof Error ? error.message : String(error)),
    });
  }

  return (
    <div className="space-y-4">
      <section className="card-surface p-4">
        <h3 className="mb-2 text-sm font-semibold text-slate-900 dark:text-slate-100">Backup</h3>
        <p className="mb-3 text-sm text-slate-600 dark:text-slate-400">
          Download a copy of the current database file, or import a previously downloaded backup to restore
          it — for example when moving to a new machine. Importing completely replaces all current data.
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <a href={DATABASE_BACKUP_URL} className={BTN_PRIMARY}>
            Download backup
          </a>
          <button onClick={handleImportClick} disabled={importDatabase.isPending} className={BTN_IMPORT}>
            {importDatabase.isPending ? 'Importing…' : 'Import backup'}
          </button>
          <input ref={fileInputRef} type="file" accept=".db" className="hidden" onChange={handleFileChange} />
        </div>
        {importError && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{importError}</p>}
      </section>

      <section className="rounded-lg border border-red-200 bg-white p-4 dark:border-red-900 dark:bg-slate-900">
        <h3 className="mb-2 text-sm font-semibold text-red-600 dark:text-red-400">Danger zone</h3>
        <p className="mb-3 text-sm text-slate-600 dark:text-slate-400">
          Permanently deletes every account, transaction, investment, and everything else, resetting the
          app to its default empty state. This cannot be undone — download a backup first if unsure.
        </p>
        <button
          onClick={handleReset}
          disabled={resetDatabase.isPending}
          className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
        >
          {resetDatabase.isPending ? 'Resetting…' : 'Reset to default state'}
        </button>
        {resetError && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{resetError}</p>}
      </section>
    </div>
  );
}
