import { useEffect, useState } from 'react';
import { useAppSettings, useUpdateAppSettings } from '../../hooks/useAppSettings.js';
import { BTN_PRIMARY } from '../../theme/tokens.js';

export function GeneralSettings() {
  const { data: appSettings } = useAppSettings();
  const updateAppSettings = useUpdateAppSettings();
  const [userName, setUserName] = useState('');

  useEffect(() => {
    setUserName(appSettings?.userName ?? '');
  }, [appSettings?.userName]);

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    updateAppSettings.mutate({ userName: userName.trim() || null });
  }

  return (
    <section className="card-surface p-4">
      <h2 className="mb-3 text-lg font-semibold text-slate-900 dark:text-slate-100">General</h2>
      <form onSubmit={handleSubmit} className="flex items-end gap-3">
        <label className="text-sm text-slate-700 dark:text-slate-300">
          Your name
          <input
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            placeholder="e.g. Alex"
            className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          />
        </label>
        <button type="submit" disabled={updateAppSettings.isPending} className={BTN_PRIMARY}>
          {updateAppSettings.isPending ? 'Saving…' : 'Save'}
        </button>
      </form>
      <p className="mt-2 text-xs text-slate-500">Shown as a welcome greeting on the Home page.</p>
    </section>
  );
}
