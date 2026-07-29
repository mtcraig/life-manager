import { useState } from 'react';
import type { CreateInvestmentInput, CreateProjectionScenarioInput } from '@life-manager/shared';
import {
  useArchiveInvestment,
  useAddInvestmentValuation,
  useCreateInvestment,
  useInvestmentValuations,
  useInvestments,
} from '../../hooks/useInvestments.js';
import {
  useCreateProjectionScenario,
  useDeleteProjectionScenario,
  useProjectionResult,
  useProjectionScenarios,
} from '../../hooks/useProjectionScenarios.js';
import { ValuationHistoryPanel } from '../../components/ValuationHistoryPanel.js';
import { formatMoney } from '../../lib/formatMoney.js';
import { BTN_PRIMARY } from '../../theme/tokens.js';

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

function InvestmentsList() {
  const { data: investments, isPending, isError } = useInvestments();
  const archiveInvestment = useArchiveInvestment();
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const { data: valuations, isPending: isValuationsPending } = useInvestmentValuations(expandedId);
  const addValuation = useAddInvestmentValuation(expandedId ?? -1);

  if (isPending) return <p className="text-sm text-slate-500">Loading…</p>;
  if (isError) return <p className="text-sm text-red-600 dark:text-red-400">Failed to load investments.</p>;
  if (!investments || investments.length === 0) {
    return <p className="text-sm text-slate-500">No investments yet — add one above.</p>;
  }

  return (
    <ul className="divide-y divide-slate-100 dark:divide-slate-800">
      {investments.map((investment) => (
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
              <button
                onClick={() => archiveInvestment.mutate(investment.id)}
                className="rounded-md border border-slate-300 px-3 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Archive
              </button>
            </div>
          </div>
          {expandedId === investment.id && (
            <ValuationHistoryPanel
              valuations={valuations}
              isPending={isValuationsPending}
              onAddValuation={(input) => addValuation.mutate(input)}
              isAdding={addValuation.isPending}
            />
          )}
        </li>
      ))}
    </ul>
  );
}

function ProjectionScenarioRow({ id, name }: { id: number; name: string }) {
  const { data: result, isPending } = useProjectionResult(id);
  const deleteScenario = useDeleteProjectionScenario();

  return (
    <li className="flex items-center justify-between py-2">
      <div>
        <span className="font-medium text-slate-900 dark:text-slate-100">{name}</span>
        {!isPending && result && (
          <span className="ml-2 text-xs text-slate-500">
            {result.projectedValue !== null
              ? `→ ${formatMoney(result.projectedValue)} in ${result.months} months`
              : 'set a retirement date to see a projection'}
          </span>
        )}
      </div>
      <button
        onClick={() => deleteScenario.mutate(id)}
        className="rounded-md border border-slate-300 px-3 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
      >
        Delete
      </button>
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
    };
    createScenario.mutate(input, {
      onSuccess: () => {
        setName('');
        setGrowthRatePct('5');
        setMonthlyContribution('0');
        setRetirementAge('');
        setRetirementDate('');
      },
      onError: (err) => setError(err instanceof Error ? err.message : String(err)),
    });
  }

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
      <h2 className="mb-3 text-lg font-semibold text-slate-900 dark:text-slate-100">
        Retirement projection scenarios
      </h2>
      <p className="mb-3 text-xs text-slate-500">
        Applies to the current total investment value, not individual holdings. Retirement age is
        informational only — the projection uses the retirement date.
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
        <div className="flex items-end">
          <button type="submit" disabled={createScenario.isPending} className={BTN_PRIMARY}>
            {createScenario.isPending ? 'Adding…' : 'Add scenario'}
          </button>
        </div>
      </form>
      {error && <p className="mb-2 text-sm text-red-600 dark:text-red-400">{error}</p>}

      {isPending && <p className="text-sm text-slate-500">Loading…</p>}
      {isError && <p className="text-sm text-red-600 dark:text-red-400">Failed to load projection scenarios.</p>}
      <ul className="divide-y divide-slate-100 dark:divide-slate-800">
        {scenarios?.map((scenario) => (
          <ProjectionScenarioRow key={scenario.id} id={scenario.id} name={scenario.name} />
        ))}
        {scenarios?.length === 0 && <li className="py-2 text-sm text-slate-500">No scenarios yet.</li>}
      </ul>
    </section>
  );
}

export function InvestmentsPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Investments</h1>

      <section className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
        <h2 className="mb-3 text-lg font-semibold text-slate-900 dark:text-slate-100">Add investment</h2>
        <AddInvestmentForm />
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
        <h2 className="mb-3 text-lg font-semibold text-slate-900 dark:text-slate-100">Holdings</h2>
        <InvestmentsList />
      </section>

      <ProjectionScenarios />
    </div>
  );
}
