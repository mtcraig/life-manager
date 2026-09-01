import type { ValuationDto } from '@life-manager/shared';
import { ValuationTrendChart } from './charts/ValuationTrendChart.js';
import { SkeletonRows } from './Skeleton.js';
import { formatMoney } from '../lib/formatMoney.js';

interface ValuationHistoryReadOnlyProps {
  valuations: ValuationDto[] | undefined;
  isPending: boolean;
}

/** Read-only sibling of ValuationHistoryPanel — chart + plain list, no add/edit/delete forms. For static/report views only. */
export function ValuationHistoryReadOnly({ valuations, isPending }: ValuationHistoryReadOnlyProps) {
  return (
    <div className="mt-3 space-y-3 border-t border-slate-100 pt-3 dark:border-slate-800">
      {isPending && <SkeletonRows rows={2} />}
      {valuations && valuations.length === 0 && (
        <p className="text-sm text-slate-500">No valuations recorded yet.</p>
      )}
      {valuations && valuations.length > 0 && (
        <>
          <ValuationTrendChart valuations={valuations} />
          <ul className="divide-y divide-slate-100 text-sm dark:divide-slate-800">
            {[...valuations].reverse().map((v) => (
              <li key={v.id} className="flex items-center justify-between gap-2 py-1">
                <span className="text-slate-600 dark:text-slate-400">{v.asOfDate}</span>
                <span className="font-medium text-slate-900 dark:text-slate-100">{formatMoney(v.value)}</span>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
