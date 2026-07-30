import type { usePagedList } from '../hooks/usePagedList.js';

export function PagedListFooter({ state }: { state: ReturnType<typeof usePagedList> }) {
  if (state.showShowMore) {
    return (
      <div className="pt-2 text-center">
        <button
          onClick={state.expand}
          className="text-xs font-medium text-slate-600 hover:underline dark:text-slate-400"
        >
          Show more
        </button>
      </div>
    );
  }

  if (!state.expanded) return null;

  return (
    <div className="flex items-center justify-between pt-2 text-xs text-slate-600 dark:text-slate-400">
      <button onClick={state.collapse} className="font-medium hover:underline">
        Show less
      </button>
      {state.showPagination && (
        <div className="flex items-center gap-2">
          <span>page {state.page}</span>
          <button
            onClick={() => state.setPage((p) => Math.max(1, p - 1))}
            disabled={state.page === 1}
            className="rounded-md border border-slate-300 px-2 py-1 disabled:opacity-50 dark:border-slate-700"
          >
            Previous
          </button>
          <button
            onClick={() => state.setPage((p) => p + 1)}
            disabled={state.page * state.pageSize >= state.total}
            className="rounded-md border border-slate-300 px-2 py-1 disabled:opacity-50 dark:border-slate-700"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
