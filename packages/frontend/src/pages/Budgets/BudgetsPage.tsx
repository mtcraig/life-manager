import { useState } from 'react';
import type { BudgetProgressDto, BudgetProgressItemDto } from '@life-manager/shared';
import { useCategories } from '../../hooks/useCategories.js';
import {
  useAnnualBudgetProgress,
  useBudgetProgress,
  useBudgets,
  useCreateBudget,
  useDeleteBudget,
} from '../../hooks/useBudgets.js';
import { BudgetCompositionChart } from '../../components/charts/BudgetCompositionChart.js';
import { SkeletonRows, SkeletonStatGrid } from '../../components/Skeleton.js';
import { Tabs } from '../../components/Tabs.js';
import { formatMoney } from '../../lib/formatMoney.js';
import { BTN_PRIMARY, BTN_ROW_ACTION, BTN_ROW_ACTION_DANGER } from '../../theme/tokens.js';

type BudgetsTab = 'overview' | 'manage';
type PeriodMode = 'monthly' | 'annual';

function shiftMonth(date: Date, delta: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + delta, 1);
}

function toMonthIso(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-01`;
}

function formatMonthLabel(date: Date): string {
  return date.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
}

function BudgetProgressRow({ item }: { item: BudgetProgressItemDto }) {
  const pct = item.budgeted > 0 ? Math.min(100, (item.actual / item.budgeted) * 100) : 0;
  const over = item.actual > item.budgeted;
  const near = !over && item.budgeted > 0 && item.actual / item.budgeted >= 0.9;
  const barColor = over ? 'bg-red-500' : near ? 'bg-amber-500' : 'bg-teal-500';
  const deltaClass = over
    ? 'text-red-600 dark:text-red-400'
    : near
      ? 'text-amber-600 dark:text-amber-400'
      : 'text-green-700 dark:text-green-400';
  const deltaLabel = over ? `${formatMoney(-item.delta)} over` : `${formatMoney(item.delta)} left`;

  return (
    <div className="card-surface p-3">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-slate-900 dark:text-slate-100">{item.categoryName}</span>
        <span className={`text-xs font-medium ${deltaClass}`}>{deltaLabel}</span>
      </div>
      <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
        <div className={`h-full rounded-full ${barColor}`} style={{ width: `${pct}%` }} />
      </div>
      <div className="mt-1 text-xs text-slate-500">
        {formatMoney(item.actual)} of {formatMoney(item.budgeted)}
      </div>
    </div>
  );
}

/** Stat tiles + composition chart + category grid — identical shape for both the monthly and annual views, just fed different data. */
function BudgetProgressSection({
  progress,
  isPending,
  isError,
  emptyMessage,
}: {
  progress: BudgetProgressDto | undefined;
  isPending: boolean;
  isError: boolean;
  emptyMessage: string;
}) {
  const remaining = progress ? progress.totalBudgeted - progress.totalActual : 0;

  return (
    <>
      {isPending && <SkeletonStatGrid count={3} />}
      {isError && <p className="text-sm text-red-600 dark:text-red-400">Failed to load budget progress.</p>}

      {progress && (
        <>
          <div className="grid grid-cols-3 gap-4">
            <div className="card-surface p-4">
              <div className="text-xs uppercase tracking-wide text-slate-500">Budgeted</div>
              <div className="mt-1 text-2xl font-semibold text-slate-900 dark:text-slate-100">
                {formatMoney(progress.totalBudgeted)}
              </div>
            </div>
            <div className="card-surface p-4">
              <div className="text-xs uppercase tracking-wide text-slate-500">Actual</div>
              <div className="mt-1 text-2xl font-semibold text-slate-900 dark:text-slate-100">
                {formatMoney(progress.totalActual)}
              </div>
            </div>
            <div className="card-surface p-4">
              <div className="text-xs uppercase tracking-wide text-slate-500">Remaining</div>
              <div
                className={`mt-1 text-2xl font-semibold ${
                  remaining >= 0 ? 'text-green-700 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                }`}
              >
                {formatMoney(remaining)}
              </div>
            </div>
          </div>

          <div className="card-surface p-4">
            <h2 className="mb-3 text-sm font-medium text-slate-700 dark:text-slate-300">Spend composition</h2>
            <BudgetCompositionChart items={progress.items} />
          </div>

          <div>
            {progress.items.length === 0 ? (
              <p className="text-sm text-slate-500">{emptyMessage}</p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {progress.items.map((item) => (
                  <BudgetProgressRow key={item.categoryId} item={item} />
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </>
  );
}

function MonthlyBudgetView() {
  const [viewDate, setViewDate] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const { data: progress, isPending, isError } = useBudgetProgress(toMonthIso(viewDate));

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <button type="button" onClick={() => setViewDate((d) => shiftMonth(d, -1))} className={BTN_ROW_ACTION}>
          ← Prev
        </button>
        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{formatMonthLabel(viewDate)}</span>
        <button type="button" onClick={() => setViewDate((d) => shiftMonth(d, 1))} className={BTN_ROW_ACTION}>
          Next →
        </button>
      </div>
      <BudgetProgressSection
        progress={progress}
        isPending={isPending}
        isError={isError}
        emptyMessage="No budgets active for this period — set one in the Manage tab."
      />
    </div>
  );
}

/** Cumulative view across a whole year — useful for less-frequent, larger budgets (e.g. saving up for something) where a single month never tells the full story. */
function AnnualBudgetView() {
  const [year, setYear] = useState(() => new Date().getFullYear());
  const { data: progress, isPending, isError } = useAnnualBudgetProgress(year);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <button type="button" onClick={() => setYear((y) => y - 1)} className={BTN_ROW_ACTION}>
          ← Prev
        </button>
        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{year}</span>
        <button type="button" onClick={() => setYear((y) => y + 1)} className={BTN_ROW_ACTION}>
          Next →
        </button>
      </div>
      <BudgetProgressSection
        progress={progress}
        isPending={isPending}
        isError={isError}
        emptyMessage="No budgets active this year — set one in the Manage tab."
      />
    </div>
  );
}

function BudgetOverviewTab({ periodMode }: { periodMode: PeriodMode }) {
  return periodMode === 'monthly' ? <MonthlyBudgetView /> : <AnnualBudgetView />;
}

function AddBudgetForm() {
  const { data: categories } = useCategories();
  const createBudget = useCreateBudget();
  const [categoryId, setCategoryId] = useState('');
  const [amount, setAmount] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    createBudget.mutate(
      {
        categoryId: Number(categoryId),
        amount: Math.round(Number(amount) * 100),
        startDate,
        endDate: endDate || undefined,
      },
      {
        onSuccess: () => {
          setCategoryId('');
          setAmount('');
          setStartDate('');
          setEndDate('');
        },
        onError: (err) => setError(err instanceof Error ? err.message : String(err)),
      },
    );
  }

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <label className="text-sm text-slate-700 dark:text-slate-300">
        Category
        <select
          required
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
        >
          <option value="" disabled>
            Select a category
          </option>
          {categories?.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </label>
      <label className="text-sm text-slate-700 dark:text-slate-300">
        Monthly amount (£)
        <input
          required
          type="number"
          step="0.01"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
        />
      </label>
      <label className="text-sm text-slate-700 dark:text-slate-300">
        From
        <input
          required
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
        />
      </label>
      <label className="text-sm text-slate-700 dark:text-slate-300">
        Until (optional)
        <input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
        />
      </label>
      <div className="col-span-full flex items-end">
        <button type="submit" disabled={createBudget.isPending} className={BTN_PRIMARY}>
          {createBudget.isPending ? 'Adding…' : 'Add budget'}
        </button>
      </div>
      {error && <p className="col-span-full text-sm text-red-600 dark:text-red-400">{error}</p>}
    </form>
  );
}

function BudgetsList() {
  const { data: budgets, isPending, isError } = useBudgets();
  const { data: categories } = useCategories();
  const deleteBudget = useDeleteBudget();
  const categoryNameById = new Map(categories?.map((c) => [c.id, c.name]));

  if (isPending) return <SkeletonRows rows={3} />;
  if (isError) return <p className="text-sm text-red-600 dark:text-red-400">Failed to load budgets.</p>;
  if (!budgets || budgets.length === 0) {
    return <p className="text-sm text-slate-500">No budgets yet — add one above.</p>;
  }

  return (
    <ul className="divide-y divide-slate-100 dark:divide-slate-800">
      {budgets.map((budget) => (
        <li key={budget.id} className="flex items-center justify-between py-3">
          <div>
            <div className="font-medium text-slate-900 dark:text-slate-100">
              {categoryNameById.get(budget.categoryId) ?? 'Unknown category'}
            </div>
            <div className="text-xs text-slate-500">
              {formatMoney(budget.amount)}/mo · From {budget.startDate}
              {budget.endDate ? ` until ${budget.endDate}` : ' (ongoing)'}
            </div>
          </div>
          <button onClick={() => deleteBudget.mutate(budget.id)} className={BTN_ROW_ACTION_DANGER}>
            Delete
          </button>
        </li>
      ))}
    </ul>
  );
}

export function BudgetsPage() {
  const [tab, setTab] = useState<BudgetsTab>('overview');
  const [periodMode, setPeriodMode] = useState<PeriodMode>('monthly');

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Budgets</h1>
        {tab === 'overview' && (
          <Tabs
            tabs={[
              { value: 'monthly', label: 'Monthly' },
              { value: 'annual', label: 'Annual' },
            ]}
            active={periodMode}
            onChange={setPeriodMode}
          />
        )}
      </div>

      <Tabs
        tabs={[
          { value: 'overview', label: 'Overview' },
          { value: 'manage', label: 'Manage' },
        ]}
        active={tab}
        onChange={setTab}
      />

      {tab === 'overview' && <BudgetOverviewTab periodMode={periodMode} />}
      {tab === 'manage' && (
        <div className="space-y-4">
          <section className="card-surface p-4">
            <h2 className="mb-3 text-lg font-semibold text-slate-900 dark:text-slate-100">Add budget</h2>
            <AddBudgetForm />
          </section>
          <section className="card-surface p-4">
            <h2 className="mb-3 text-lg font-semibold text-slate-900 dark:text-slate-100">Budgets</h2>
            <BudgetsList />
          </section>
        </div>
      )}
    </div>
  );
}
