import { useState } from 'react';
import type { CreateInsurancePlanInput, PremiumFrequency } from '@life-manager/shared';
import { PREMIUM_FREQUENCIES } from '@life-manager/shared';
import {
  useCreateInsurancePlan,
  useDeleteInsurancePlan,
  useInsurancePlans,
} from '../../hooks/useInsurance.js';
import { formatMoney } from '../../lib/formatMoney.js';

function AddInsurancePlanForm() {
  const createPlan = useCreateInsurancePlan();
  const [name, setName] = useState('');
  const [type, setType] = useState('');
  const [coverageAmount, setCoverageAmount] = useState('');
  const [premiumAmount, setPremiumAmount] = useState('');
  const [premiumFrequency, setPremiumFrequency] = useState<PremiumFrequency>('monthly');
  const [renewalDate, setRenewalDate] = useState('');
  const [provider, setProvider] = useState('');
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    const input: CreateInsurancePlanInput = {
      name,
      type,
      coverageAmount: Math.round(Number(coverageAmount) * 100),
      premiumAmount: Math.round(Number(premiumAmount) * 100),
      premiumFrequency,
      renewalDate,
      provider: provider.trim() || undefined,
    };
    createPlan.mutate(input, {
      onSuccess: () => {
        setName('');
        setType('');
        setCoverageAmount('');
        setPremiumAmount('');
        setPremiumFrequency('monthly');
        setRenewalDate('');
        setProvider('');
      },
      onError: (err) => setError(err instanceof Error ? err.message : String(err)),
    });
  }

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      <label className="text-sm text-slate-700">
        Name
        <input
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-sm"
        />
      </label>
      <label className="text-sm text-slate-700">
        Type
        <input
          required
          value={type}
          onChange={(e) => setType(e.target.value)}
          placeholder="e.g. home, car, life"
          className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-sm"
        />
      </label>
      <label className="text-sm text-slate-700">
        Provider (optional)
        <input
          value={provider}
          onChange={(e) => setProvider(e.target.value)}
          className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-sm"
        />
      </label>
      <label className="text-sm text-slate-700">
        Coverage amount (£)
        <input
          required
          type="number"
          step="0.01"
          value={coverageAmount}
          onChange={(e) => setCoverageAmount(e.target.value)}
          className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-sm"
        />
      </label>
      <label className="text-sm text-slate-700">
        Premium amount (£)
        <input
          required
          type="number"
          step="0.01"
          value={premiumAmount}
          onChange={(e) => setPremiumAmount(e.target.value)}
          className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-sm"
        />
      </label>
      <label className="text-sm text-slate-700">
        Premium frequency
        <select
          value={premiumFrequency}
          onChange={(e) => setPremiumFrequency(e.target.value as PremiumFrequency)}
          className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-sm"
        >
          {PREMIUM_FREQUENCIES.map((frequency) => (
            <option key={frequency} value={frequency}>
              {frequency}
            </option>
          ))}
        </select>
      </label>
      <label className="text-sm text-slate-700">
        Renewal date
        <input
          required
          type="date"
          value={renewalDate}
          onChange={(e) => setRenewalDate(e.target.value)}
          className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-sm"
        />
      </label>
      <div className="flex items-end">
        <button
          type="submit"
          disabled={createPlan.isPending}
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50"
        >
          {createPlan.isPending ? 'Adding…' : 'Add plan'}
        </button>
      </div>
      {error && <p className="col-span-full text-sm text-red-600">{error}</p>}
    </form>
  );
}

function InsurancePlansList() {
  const { data: plans, isPending, isError } = useInsurancePlans();
  const deletePlan = useDeleteInsurancePlan();

  if (isPending) return <p className="text-sm text-slate-500">Loading…</p>;
  if (isError) return <p className="text-sm text-red-600">Failed to load insurance plans.</p>;
  if (!plans || plans.length === 0) {
    return <p className="text-sm text-slate-500">No insurance plans yet — add one above.</p>;
  }

  return (
    <ul className="divide-y divide-slate-100">
      {plans.map((plan) => (
        <li key={plan.id} className="flex items-center justify-between py-3">
          <div>
            <div className="font-medium text-slate-900">
              {plan.name} <span className="text-xs text-slate-500">({plan.type})</span>
            </div>
            <div className="text-xs text-slate-500">
              Coverage {formatMoney(plan.coverageAmount)} · Premium {formatMoney(plan.premiumAmount)}/
              {plan.premiumFrequency === 'monthly' ? 'mo' : 'yr'} · Renews {plan.renewalDate}
              {plan.provider ? ` · ${plan.provider}` : ''}
            </div>
          </div>
          <button
            onClick={() => deletePlan.mutate(plan.id)}
            className="rounded-md border border-slate-300 px-3 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
          >
            Delete
          </button>
        </li>
      ))}
    </ul>
  );
}

export function InsurancePage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-slate-900">Insurance</h1>
      <p className="text-sm text-slate-500">
        Informational only — insurance plans don't feed into the Wealth totals.
      </p>

      <section className="rounded-lg border border-slate-200 bg-white p-4">
        <h2 className="mb-3 text-lg font-semibold text-slate-900">Add plan</h2>
        <AddInsurancePlanForm />
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-4">
        <h2 className="mb-3 text-lg font-semibold text-slate-900">Plans</h2>
        <InsurancePlansList />
      </section>
    </div>
  );
}
