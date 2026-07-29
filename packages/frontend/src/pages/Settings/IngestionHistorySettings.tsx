import { useAccounts } from '../../hooks/useAccounts.js';
import { useIngestionEvents } from '../../hooks/useIngestionEvents.js';

export function IngestionHistorySettings() {
  const { data: accounts } = useAccounts(true);
  const { data: events, isPending, isError } = useIngestionEvents();

  const accountNameById = new Map(accounts?.map((a) => [a.id, a.name]));

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4">
      <h2 className="mb-3 text-lg font-semibold text-slate-900">Ingestion history</h2>
      {isPending && <p className="text-sm text-slate-500">Loading…</p>}
      {isError && <p className="text-sm text-red-600">Failed to load ingestion history.</p>}
      <ul className="divide-y divide-slate-100">
        {events?.map((event) => (
          <li key={event.id} className="flex items-center justify-between py-2 text-sm">
            <div>
              <span className="font-medium text-slate-900">
                {event.accountId !== null ? (accountNameById.get(event.accountId) ?? event.accountId) : '—'}
              </span>
              <span className="ml-2 text-xs text-slate-500">
                {event.fileName} · {event.source} · {new Date(event.ranAt).toLocaleString()}
              </span>
              {event.status === 'error' && (
                <div className="text-xs text-red-600">{event.errorMessage}</div>
              )}
            </div>
            <div className="flex items-center gap-2">
              {event.status === 'success' ? (
                <span className="text-xs text-green-700">{event.rowsIngested} ingested</span>
              ) : (
                <span className="text-xs font-medium text-red-600">Failed</span>
              )}
            </div>
          </li>
        ))}
        {events?.length === 0 && <li className="py-2 text-sm text-slate-500">No ingestion runs yet.</li>}
      </ul>
    </section>
  );
}
