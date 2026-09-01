import { BudgetProgressSection } from './BudgetsPage.js';
import { useAnnualBudgetProgress } from '../../hooks/useBudgets.js';
import type { YearFilterValue } from '../../lib/yearFilter.js';

export function BudgetsContent({ selectedYear }: { selectedYear: YearFilterValue }) {
  const year = selectedYear === 'all' ? new Date().getFullYear() : selectedYear;
  const { data: progress, isPending, isError } = useAnnualBudgetProgress(year);

  return (
    <BudgetProgressSection
      progress={progress}
      isPending={isPending}
      isError={isError}
      emptyMessage="No budgets active this year — set one in the Manage tab."
    />
  );
}
