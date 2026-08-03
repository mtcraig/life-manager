import { PagedListFooter } from '../../components/PagedListFooter.js';
import { SkeletonRows } from '../../components/Skeleton.js';
import { useAccounts } from '../../hooks/useAccounts.js';
import { useIngestionEvents } from '../../hooks/useIngestionEvents.js';
import { usePagedList } from '../../hooks/usePagedList.js';

export function IngestionHistorySettings() {
  const { data: accounts } = useAccounts();
  const { data: events, isPending, isError } = useIngestionEvents();

  const accountNameById = new Map(accounts?.map((a) => [a.id, a.name]));
  const pagedEvents = usePagedList(events);

  return (
    <section className="card-surface p-4">
      <h2 className="mb-3 text-lg font-semibold text-slate-900 dark:text-slate-100">Ingestion history</h2>
      {isPending && <SkeletonRows rows={3} />}
      {isError && <p className="text-sm text-red-600 dark:text-red-400">Failed to load ingestion history.</p>}
      <ul className="divide-y divide-slate-100 dark:divide-slate-800">
        {pagedEvents.visible.map((event) => (
          <li key={event.id} className="flex items-center justify-between py-2 text-sm">
            <div>
              <span className="font-medium text-slate-900 dark:text-slate-100">
                {event.accountId !== null ? (accountNameById.get(event.accountId) ?? event.accountId) : '—'}
              </span>
              <span className="ml-2 text-xs text-slate-500">
                {event.fileName} · {event.source} · {new Date(event.ranAt).toLocaleString()}
              </span>
              {event.status === 'error' && (
                <div className="text-xs text-red-600 dark:text-red-400">{event.errorMessage}</div>
              )}
            </div>
            <div className="flex items-center gap-2">
              {event.status === 'success' && (
                <span className="text-xs text-green-700 dark:text-green-400">{event.rowsIngested} ingested</span>
              )}
              {event.status === 'warning' && (
                <span className="text-xs font-medium text-amber-600 dark:text-amber-400">
                  {event.rowsIngested} ingested, {event.rowsSkipped} skipped
                </span>
              )}
              {event.status === 'error' && (
                <span className="text-xs font-medium text-red-600 dark:text-red-400">Failed</span>
              )}
            </div>
          </li>
        ))}
        {events?.length === 0 && <li className="py-2 text-sm text-slate-500">No ingestion runs yet.</li>}
      </ul>
      <PagedListFooter state={pagedEvents} />
    </section>
  );
}
