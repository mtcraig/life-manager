import type { InvestmentDto } from '@life-manager/shared';
import { HoldingsSection, filterValuationsByYear } from './InvestmentsPage.js';
import { useInvestments, useInvestmentValuations } from '../../hooks/useInvestments.js';
import { ValuationHistoryReadOnly } from '../../components/ValuationHistoryReadOnly.js';
import { SkeletonRows } from '../../components/Skeleton.js';
import type { YearFilterValue } from '../../lib/yearFilter.js';

function InvestmentValuationEntry({
  investment,
  selectedYear,
}: {
  investment: InvestmentDto;
  selectedYear: YearFilterValue;
}) {
  const { data: valuations, isPending } = useInvestmentValuations(investment.id);
  const filtered = filterValuationsByYear(valuations, selectedYear);
  return (
    <div className="mb-4 last:mb-0">
      <h3 className="text-sm font-medium text-slate-900 dark:text-slate-100">{investment.name}</h3>
      <ValuationHistoryReadOnly valuations={filtered} isPending={isPending} />
    </div>
  );
}

export function InvestmentsContent({ selectedYear }: { selectedYear: YearFilterValue }) {
  const { data: investments, isPending, isError } = useInvestments();

  return (
    <div className="space-y-4">
      <div className="card-surface p-4">
        <h2 className="mb-3 text-sm font-medium text-slate-700 dark:text-slate-300">Holdings over time</h2>
        <HoldingsSection selectedYear={selectedYear} />
      </div>
      <div className="card-surface p-4">
        <h2 className="mb-3 text-sm font-medium text-slate-700 dark:text-slate-300">Valuation history</h2>
        {isPending && <SkeletonRows rows={3} />}
        {isError && <p className="text-sm text-red-600 dark:text-red-400">Failed to load investments.</p>}
        {investments && investments.length === 0 && <p className="text-sm text-slate-500">No investments yet.</p>}
        {investments?.map((inv) => (
          <InvestmentValuationEntry key={inv.id} investment={inv} selectedYear={selectedYear} />
        ))}
      </div>
    </div>
  );
}
