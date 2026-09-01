import { useState } from 'react';
import type {
  CreateInvestmentInput,
  CreateProjectionScenarioInput,
  ProjectionScenarioDto,
  ValuationDto,
} from '@life-manager/shared';
import {
  useArchiveInvestment,
  useAddInvestmentValuation,
  useBulkImportInvestmentValuations,
  useCreateInvestment,
  useDeleteInvestment,
  useDeleteInvestmentValuation,
  useHoldingsByMonth,
  useInvestmentValuations,
  useInvestments,
  useUpdateInvestment,
  useUpdateInvestmentValuation,
} from '../../hooks/useInvestments.js';
import {
  useCreateProjectionScenario,
  useDeleteProjectionScenario,
  useProjectionResult,
  useProjectionScenarios,
} from '../../hooks/useProjectionScenarios.js';
import { ValuationHistoryPanel } from '../../components/ValuationHistoryPanel.js';
import { BulkImportCsvForm } from '../../components/BulkImportCsvForm.js';
import { HoldingsByMonthChart } from '../../components/charts/HoldingsByMonthChart.js';
import { YearFilter as YearFilterControl } from '../../components/YearFilter.js';
import { SkeletonChart, SkeletonRows } from '../../components/Skeleton.js';
import { formatMoney } from '../../lib/formatMoney.js';
import { renderValuationImportResult } from '../../lib/bulkImportMessages.js';
import type { YearFilterValue } from '../../lib/yearFilter.js';
import { dateRangeForYear } from '../../lib/yearFilter.js';
import { BTN_PRIMARY, BTN_ROW_ACTION, BTN_ROW_ACTION_DANGER } from '../../theme/tokens.js';

function AddInvestmentForm() {
  const createInvestment = useCreateInvestment();
  const [name, setName] = useState('');
  const [kind, setKind] = useState('');
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    const input: CreateInvestmentInput = { name, kind: kind.trim() || undefined };
    createInvestment.mutate(input, {
      onSuccess: () => {
        setName('');
        setKind('');
      },
      onError: (err) => setError(err instanceof Error ? err.message : String(err)),
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3">
      <label className="text-sm text-slate-700 dark:text-slate-300">
        Name
        <input
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mt-1 block rounded-md border border-slate-300 px-2 py-1 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
        />
      </label>
      <label className="text-sm text-slate-700 dark:text-slate-300">
        Kind
        <input
          value={kind}
          onChange={(e) => setKind(e.target.value)}
          placeholder="e.g. pension, stocks"
          className="mt-1 block rounded-md border border-slate-300 px-2 py-1 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
        />
      </label>
      <button type="submit" disabled={createInvestment.isPending} className={BTN_PRIMARY}>
        {createInvestment.isPending ? 'Adding…' : 'Add investment'}
      </button>
      {error && <p className="w-full text-sm text-red-600 dark:text-red-400">{error}</p>}
    </form>
  );
}

/** Filters a valuation list to the selected year, matching AccountsPage's chartTrend slicing. */
export function filterValuationsByYear(valuations: ValuationDto[] | undefined, selectedYear: YearFilterValue) {
  if (!valuations) return valuations;
  const { dateFrom, dateTo } = dateRangeForYear(selectedYear);
  return valuations.filter(
    (v) => (dateFrom === undefined || v.asOfDate >= dateFrom) && (dateTo === undefined || v.asOfDate <= dateTo),
  );
}

function InvestmentsList({ selectedYear }: { selectedYear: YearFilterValue }) {
  const { data: investments, isPending, isError } = useInvestments();
  const archiveInvestment = useArchiveInvestment();
  const deleteInvestment = useDeleteInvestment();
  const updateInvestment = useUpdateInvestment();
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  const [editKind, setEditKind] = useState('');
  const [rowError, setRowError] = useState<string | null>(null);

  const { data: valuations, isPending: isValuationsPending } = useInvestmentValuations(expandedId);
  const filteredValuations = filterValuationsByYear(valuations, selectedYear);
  const addValuation = useAddInvestmentValuation(expandedId ?? -1);
  const updateValuation = useUpdateInvestmentValuation(expandedId ?? -1);
  const deleteValuation = useDeleteInvestmentValuation(expandedId ?? -1);

  function startEditing(investment: { id: number; name: string; kind: string | null }) {
    setEditingId(investment.id);
    setEditName(investment.name);
    setEditKind(investment.kind ?? '');
  }

  function handleEditSubmit(event: React.FormEvent, investmentId: number) {
    event.preventDefault();
    updateInvestment.mutate(
      { id: investmentId, input: { name: editName, kind: editKind.trim() || undefined } },
      { onSuccess: () => setEditingId(null) },
    );
  }

  function handleArchive(investmentId: number) {
    setRowError(null);
    archiveInvestment.mutate(investmentId, {
      onError: (error) => setRowError(error instanceof Error ? error.message : String(error)),
    });
  }

  function handleDelete(investment: { id: number; name: string }) {
    const confirmed = window.confirm(
      `Permanently delete "${investment.name}" and all its valuations? This cannot be undone.`,
    );
    if (!confirmed) return;
    setRowError(null);
    deleteInvestment.mutate(investment.id, {
      onError: (error) => setRowError(error instanceof Error ? error.message : String(error)),
    });
  }

  if (isPending) return <SkeletonRows rows={3} />;
  if (isError) return <p className="text-sm text-red-600 dark:text-red-400">Failed to load investments.</p>;
  if (!investments || investments.length === 0) {
    return <p className="text-sm text-slate-500">No investments yet — add one above.</p>;
  }

  return (
    <>
      {rowError && <p className="mb-2 text-sm text-red-600 dark:text-red-400">{rowError}</p>}
      <ul className="divide-y divide-slate-100 dark:divide-slate-800">
        {investments.map((investment) =>
          editingId === investment.id ? (
            <li key={investment.id} className="py-3">
              <form
                onSubmit={(e) => handleEditSubmit(e, investment.id)}
                className="flex flex-wrap items-end gap-3"
              >
                <label className="text-sm text-slate-700 dark:text-slate-300">
                  Name
                  <input
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="mt-1 block rounded-md border border-slate-300 px-2 py-1 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  />
                </label>
                <label className="text-sm text-slate-700 dark:text-slate-300">
                  Kind
                  <input
                    value={editKind}
                    onChange={(e) => setEditKind(e.target.value)}
                    placeholder="e.g. pension, stocks"
                    className="mt-1 block rounded-md border border-slate-300 px-2 py-1 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  />
                </label>
                <button type="submit" disabled={updateInvestment.isPending} className={BTN_PRIMARY}>
                  {updateInvestment.isPending ? 'Saving…' : 'Save'}
                </button>
                <button type="button" onClick={() => setEditingId(null)} className={BTN_ROW_ACTION}>
                  Cancel
                </button>
              </form>
            </li>
          ) : (
            <li key={investment.id} className="py-3">
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setExpandedId(expandedId === investment.id ? null : investment.id)}
                  className="text-left"
                >
                  <span className="font-medium text-slate-900 dark:text-slate-100">{investment.name}</span>
                  {investment.kind && <span className="ml-2 text-xs text-slate-500">{investment.kind}</span>}
                </button>
                <div className="flex items-center gap-3">
                  <span className="font-medium text-slate-900 dark:text-slate-100">
                    {investment.currentValue !== null ? formatMoney(investment.currentValue) : '—'}
                  </span>
                  <button onClick={() => startEditing(investment)} className={BTN_ROW_ACTION}>
                    Edit
                  </button>
                  <button onClick={() => handleArchive(investment.id)} className={BTN_ROW_ACTION}>
                    Archive
                  </button>
                  <button onClick={() => handleDelete(investment)} className={BTN_ROW_ACTION_DANGER}>
                    Delete
                  </button>
                </div>
              </div>
              {expandedId === investment.id && (
                <ValuationHistoryPanel
                  valuations={filteredValuations}
                  isPending={isValuationsPending}
                  onAddValuation={(input) => addValuation.mutate(input)}
                  isAdding={addValuation.isPending}
                  onUpdateValuation={(valuationId, input) => updateValuation.mutate({ valuationId, input })}
                  onDeleteValuation={(valuationId) => deleteValuation.mutate(valuationId)}
                />
              )}
            </li>
          ),
        )}
      </ul>
    </>
  );
}

function ProjectionScenarioRow({ scenario }: { scenario: ProjectionScenarioDto }) {
  const { data: result, isPending } = useProjectionResult(scenario.id);
  const deleteScenario = useDeleteProjectionScenario();

  return (
    <li className="rounded-lg border border-slate-200 p-3 dark:border-slate-800">
      <div className="flex items-center justify-between">
        <span className="font-medium text-slate-900 dark:text-slate-100">{scenario.name}</span>
        <button onClick={() => deleteScenario.mutate(scenario.id)} className={BTN_ROW_ACTION_DANGER}>
          Delete
        </button>
      </div>
      {scenario.comments && <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{scenario.comments}</p>}
      <div className="mt-1 text-xs text-slate-500">
        {scenario.growthRatePct}%/yr · {formatMoney(scenario.monthlyContribution)}/mo
        {scenario.retirementAge !== null && ` · retiring at ${scenario.retirementAge}`}
        {scenario.retirementDate && ` · ${scenario.retirementDate}`}
      </div>
      {!isPending && result && (
        result.projectedValue !== null ? (
          <div className="mt-2 rounded-md bg-slate-50 px-3 py-2 dark:bg-slate-800">
            <div className="text-2xl font-semibold text-green-700 dark:text-green-400">
              {formatMoney(result.projectedValue)}
            </div>
            <div className="text-xs text-slate-500">projected in {result.months} months</div>
          </div>
        ) : (
          <p className="mt-2 text-xs text-slate-500">Set a retirement date to see a projection.</p>
        )
      )}
    </li>
  );
}

function ProjectionScenarios() {
  const { data: scenarios, isPending, isError } = useProjectionScenarios();
  const createScenario = useCreateProjectionScenario();

  const [name, setName] = useState('');
  const [growthRatePct, setGrowthRatePct] = useState('5');
  const [monthlyContribution, setMonthlyContribution] = useState('0');
  const [retirementAge, setRetirementAge] = useState('');
  const [retirementDate, setRetirementDate] = useState('');
  const [comments, setComments] = useState('');
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    const input: CreateProjectionScenarioInput = {
      name,
      growthRatePct: Number(growthRatePct),
      monthlyContribution: Math.round(Number(monthlyContribution) * 100),
      retirementAge: retirementAge ? Number(retirementAge) : undefined,
      retirementDate: retirementDate || undefined,
      comments: comments.trim() || undefined,
    };
    createScenario.mutate(input, {
      onSuccess: () => {
        setName('');
        setGrowthRatePct('5');
        setMonthlyContribution('0');
        setRetirementAge('');
        setRetirementDate('');
        setComments('');
      },
      onError: (err) => setError(err instanceof Error ? err.message : String(err)),
    });
  }

  return (
    <section className="card-surface p-4">
      <h2 className="mb-3 text-lg font-semibold text-slate-900 dark:text-slate-100">
        Retirement projection scenarios
      </h2>
      <p className="mb-3 text-xs text-slate-500">
        Applies to the current total investment value, not individual holdings. Retirement age is
        informational only — the projection uses the retirement date. Keep the name short and use
        Comments to explain the scenario.
      </p>
      <form onSubmit={handleSubmit} className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <label className="text-sm text-slate-700 dark:text-slate-300">
          Name
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          />
        </label>
        <label className="text-sm text-slate-700 dark:text-slate-300">
          Growth rate (%/yr)
          <input
            type="number"
            step="0.1"
            value={growthRatePct}
            onChange={(e) => setGrowthRatePct(e.target.value)}
            className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          />
        </label>
        <label className="text-sm text-slate-700 dark:text-slate-300">
          Monthly contribution (£)
          <input
            type="number"
            step="0.01"
            value={monthlyContribution}
            onChange={(e) => setMonthlyContribution(e.target.value)}
            className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          />
        </label>
        <label className="text-sm text-slate-700 dark:text-slate-300">
          Retirement age (optional)
          <input
            type="number"
            value={retirementAge}
            onChange={(e) => setRetirementAge(e.target.value)}
            className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          />
        </label>
        <label className="text-sm text-slate-700 dark:text-slate-300">
          Retirement date
          <input
            type="date"
            value={retirementDate}
            onChange={(e) => setRetirementDate(e.target.value)}
            className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          />
        </label>
        <label className="text-sm text-slate-700 dark:text-slate-300 sm:col-span-3">
          Comments (optional)
          <textarea
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            rows={2}
            placeholder="Explain the scenario being modeled, e.g. retiring early with reduced contributions"
            className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          />
        </label>
        <div className="flex items-end">
          <button type="submit" disabled={createScenario.isPending} className={BTN_PRIMARY}>
            {createScenario.isPending ? 'Adding…' : 'Add scenario'}
          </button>
        </div>
      </form>
      {error && <p className="mb-2 text-sm text-red-600 dark:text-red-400">{error}</p>}

      {isPending && <SkeletonRows rows={2} />}
      {isError && <p className="text-sm text-red-600 dark:text-red-400">Failed to load projection scenarios.</p>}
      <ul className="space-y-2">
        {scenarios?.map((scenario) => (
          <ProjectionScenarioRow key={scenario.id} scenario={scenario} />
        ))}
        {scenarios?.length === 0 && <li className="py-2 text-sm text-slate-500">No scenarios yet.</li>}
      </ul>
    </section>
  );
}

export function HoldingsSection({ selectedYear }: { selectedYear: YearFilterValue }) {
  const { data: rows, isPending, isError } = useHoldingsByMonth();
  if (isPending) return <SkeletonChart className="h-56 w-full" />;
  if (isError) return <p className="text-sm text-red-600 dark:text-red-400">Failed to load holdings history.</p>;
  if (!rows || rows.length === 0) {
    return <p className="text-sm text-slate-500">Add a valuation to an investment to see holdings over time.</p>;
  }

  const { dateFrom, dateTo } = dateRangeForYear(selectedYear);
  const filteredRows = rows.filter(
    (r) => (dateFrom === undefined || r.month >= dateFrom.slice(0, 7)) && (dateTo === undefined || r.month <= dateTo.slice(0, 7)),
  );

  if (filteredRows.length === 0) {
    return (
      <p className="text-sm text-slate-500">
        {selectedYear === 'all' ? 'No holdings history yet.' : `No holdings history in ${selectedYear}.`}
      </p>
    );
  }
  return <HoldingsByMonthChart rows={filteredRows} />;
}

export function InvestmentsPage() {
  const [showImport, setShowImport] = useState(false);
  const bulkImportValuations = useBulkImportInvestmentValuations();
  const { data: holdingsRows } = useHoldingsByMonth();
  const [selectedYear, setSelectedYear] = useState<YearFilterValue>(new Date().getFullYear());

  const earliestYear = holdingsRows && holdingsRows.length > 0
    ? Math.min(...holdingsRows.map((r) => Number(r.month.slice(0, 4))))
    : undefined;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Investments</h1>
        <YearFilterControl selectedYear={selectedYear} onChange={setSelectedYear} earliestYear={earliestYear} />
      </div>

      <section className="card-surface p-4">
        <h2 className="mb-3 text-lg font-semibold text-slate-900 dark:text-slate-100">
          Holdings over time ({selectedYear === 'all' ? 'all time' : selectedYear})
        </h2>
        <HoldingsSection selectedYear={selectedYear} />
      </section>

      <section className="card-surface p-4">
        <h2 className="mb-3 text-lg font-semibold text-slate-900 dark:text-slate-100">Add investment</h2>
        <AddInvestmentForm />
      </section>

      <section className="card-surface p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Holdings</h2>
          <button onClick={() => setShowImport((v) => !v)} className={BTN_ROW_ACTION}>
            {showImport ? 'Hide import' : 'Import'}
          </button>
        </div>
        {showImport && (
          <div className="mb-4">
            <BulkImportCsvForm
              mutation={bulkImportValuations}
              headerHint="entityName,asOfDate,value,notes"
              helpText="A name that doesn't already exist is created automatically. Rows matching an existing valuation (same name + date) are skipped, so it's safe to re-paste."
              renderResult={renderValuationImportResult}
            />
          </div>
        )}
        <InvestmentsList selectedYear={selectedYear} />
      </section>

      <ProjectionScenarios />
    </div>
  );
}
