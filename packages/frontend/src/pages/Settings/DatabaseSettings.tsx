import { useState } from 'react';
import { DATABASE_BACKUP_URL } from '../../api/database.js';
import { useResetDatabase } from '../../hooks/useDatabase.js';
import { BTN_PRIMARY } from '../../theme/tokens.js';

export function DatabaseSettings() {
  const resetDatabase = useResetDatabase();
  const [resetError, setResetError] = useState<string | null>(null);

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

  return (
    <div className="space-y-4">
      <section className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
        <h3 className="mb-2 text-sm font-semibold text-slate-900 dark:text-slate-100">Backup</h3>
        <p className="mb-3 text-sm text-slate-600 dark:text-slate-400">
          Download a copy of the current database file. See the README for how to restore it.
        </p>
        <a href={DATABASE_BACKUP_URL} className={BTN_PRIMARY}>
          Download backup
        </a>
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
