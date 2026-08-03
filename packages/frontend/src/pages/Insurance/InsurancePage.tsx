import { useState } from 'react';
import type { CreateInsurancePlanInput, InsurancePlanDto, InsuranceType, PremiumFrequency } from '@life-manager/shared';
import { INSURANCE_TYPES, PREMIUM_FREQUENCIES } from '@life-manager/shared';
import {
  useCancelInsurancePlan,
  useCreateInsurancePlan,
  useDeleteInsurancePlan,
  useInsurancePlans,
} from '../../hooks/useInsurance.js';
import { SkeletonRows } from '../../components/Skeleton.js';
import { formatMoney } from '../../lib/formatMoney.js';
import { humanizeEnumValue } from '../../lib/humanize.js';
import { BTN_PRIMARY, BTN_ROW_ACTION } from '../../theme/tokens.js';

type InsuranceStatus = 'cancelled' | 'upcoming' | 'active' | 'expired';

function deriveInsuranceStatus(plan: InsurancePlanDto): InsuranceStatus {
  if (plan.cancelledAt) return 'cancelled';
  const today = new Date().toISOString().slice(0, 10);
  if (plan.effectiveDate > today) return 'upcoming';
  if (plan.renewalDate < today) return 'expired';
  return 'active';
}

const STATUS_LABELS: Record<InsuranceStatus, string> = {
  cancelled: 'Cancelled',
  upcoming: 'Upcoming',
  active: 'Active',
  expired: 'Expired',
};

const STATUS_TONE_CLASSES: Record<InsuranceStatus, string> = {
  cancelled: 'text-red-600 dark:text-red-400',
  upcoming: 'text-slate-500 dark:text-slate-400',
  active: 'text-green-700 dark:text-green-400',
  expired: 'text-amber-600 dark:text-amber-400',
};

function AddInsurancePlanForm() {
  const createPlan = useCreateInsurancePlan();
  const [name, setName] = useState('');
  const [type, setType] = useState<InsuranceType | ''>('');
  const [coverageAmount, setCoverageAmount] = useState('');
  const [premiumAmount, setPremiumAmount] = useState('');
  const [premiumFrequency, setPremiumFrequency] = useState<PremiumFrequency>('monthly');
  const [effectiveDate, setEffectiveDate] = useState('');
  const [renewalDate, setRenewalDate] = useState('');
  const [provider, setProvider] = useState('');
  const [policyNumber, setPolicyNumber] = useState('');
  const [vehicleRegistration, setVehicleRegistration] = useState('');
  const [postcode, setPostcode] = useState('');
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    const input: CreateInsurancePlanInput = {
      name,
      type: type as InsuranceType,
      coverageAmount: Math.round(Number(coverageAmount) * 100),
      premiumAmount: Math.round(Number(premiumAmount) * 100),
      premiumFrequency,
      effectiveDate,
      renewalDate,
      provider: provider.trim() || undefined,
      policyNumber: policyNumber.trim() || undefined,
      vehicleRegistration: type === 'car' ? vehicleRegistration.trim() || undefined : undefined,
      postcode: type === 'home' ? postcode.trim() || undefined : undefined,
    };
    createPlan.mutate(input, {
      onSuccess: () => {
        setName('');
        setType('');
        setCoverageAmount('');
        setPremiumAmount('');
        setPremiumFrequency('monthly');
        setEffectiveDate('');
        setRenewalDate('');
        setProvider('');
        setPolicyNumber('');
        setVehicleRegistration('');
        setPostcode('');
      },
      onError: (err) => setError(err instanceof Error ? err.message : String(err)),
    });
  }

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-3 sm:grid-cols-3">
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
        Type
        <select
          required
          value={type}
          onChange={(e) => setType(e.target.value as InsuranceType)}
          className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
        >
          <option value="" disabled>
            Select a type
          </option>
          {INSURANCE_TYPES.map((t) => (
            <option key={t} value={t}>
              {humanizeEnumValue(t)}
            </option>
          ))}
        </select>
      </label>
      <label className="text-sm text-slate-700 dark:text-slate-300">
        Provider (optional)
        <input
          value={provider}
          onChange={(e) => setProvider(e.target.value)}
          className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
        />
      </label>
      <label className="text-sm text-slate-700 dark:text-slate-300">
        Policy number (optional)
        <input
          value={policyNumber}
          onChange={(e) => setPolicyNumber(e.target.value)}
          className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
        />
      </label>
      {type === 'car' && (
        <label className="text-sm text-slate-700 dark:text-slate-300">
          Vehicle registration
          <input
            value={vehicleRegistration}
            onChange={(e) => setVehicleRegistration(e.target.value)}
            className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          />
        </label>
      )}
      {type === 'home' && (
        <label className="text-sm text-slate-700 dark:text-slate-300">
          Postcode
          <input
            value={postcode}
            onChange={(e) => setPostcode(e.target.value)}
            className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          />
        </label>
      )}
      <label className="text-sm text-slate-700 dark:text-slate-300">
        Coverage amount (£)
        <input
          required
          type="number"
          step="0.01"
          value={coverageAmount}
          onChange={(e) => setCoverageAmount(e.target.value)}
          className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
        />
      </label>
      <label className="text-sm text-slate-700 dark:text-slate-300">
        Premium amount (£)
        <input
          required
          type="number"
          step="0.01"
          value={premiumAmount}
          onChange={(e) => setPremiumAmount(e.target.value)}
          className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
        />
      </label>
      <label className="text-sm text-slate-700 dark:text-slate-300">
        Premium frequency
        <select
          value={premiumFrequency}
          onChange={(e) => setPremiumFrequency(e.target.value as PremiumFrequency)}
          className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
        >
          {PREMIUM_FREQUENCIES.map((frequency) => (
            <option key={frequency} value={frequency}>
              {humanizeEnumValue(frequency)}
            </option>
          ))}
        </select>
      </label>
      <label className="text-sm text-slate-700 dark:text-slate-300">
        Effective date
        <input
          required
          type="date"
          value={effectiveDate}
          onChange={(e) => setEffectiveDate(e.target.value)}
          className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
        />
      </label>
      <label className="text-sm text-slate-700 dark:text-slate-300">
        Renewal date
        <input
          required
          type="date"
          value={renewalDate}
          onChange={(e) => setRenewalDate(e.target.value)}
          className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
        />
      </label>
      <div className="flex items-end">
        <button type="submit" disabled={createPlan.isPending} className={BTN_PRIMARY}>
          {createPlan.isPending ? 'Adding…' : 'Add plan'}
        </button>
      </div>
      {error && <p className="col-span-full text-sm text-red-600 dark:text-red-400">{error}</p>}
    </form>
  );
}

function InsurancePlansList() {
  const { data: plans, isPending, isError } = useInsurancePlans();
  const deletePlan = useDeleteInsurancePlan();
  const cancelPlan = useCancelInsurancePlan();

  if (isPending) return <SkeletonRows rows={3} />;
  if (isError) return <p className="text-sm text-red-600 dark:text-red-400">Failed to load insurance plans.</p>;
  if (!plans || plans.length === 0) {
    return <p className="text-sm text-slate-500">No insurance plans yet — add one above.</p>;
  }

  return (
    <ul className="divide-y divide-slate-100 dark:divide-slate-800">
      {plans.map((plan) => {
        const status = deriveInsuranceStatus(plan);
        return (
          <li key={plan.id} className="flex items-center justify-between py-3">
            <div>
              <div className="font-medium text-slate-900 dark:text-slate-100">
                {plan.name} <span className="text-xs text-slate-500">({plan.type})</span>{' '}
                <span className={`text-xs font-medium ${STATUS_TONE_CLASSES[status]}`}>
                  {STATUS_LABELS[status]}
                </span>
              </div>
              <div className="text-xs text-slate-500">
                Coverage {formatMoney(plan.coverageAmount)} · Premium {formatMoney(plan.premiumAmount)}/
                {plan.premiumFrequency === 'monthly' ? 'mo' : 'yr'} · Effective {plan.effectiveDate} · Renews{' '}
                {plan.renewalDate}
                {plan.provider ? ` · ${plan.provider}` : ''}
                {plan.policyNumber ? ` · Policy ${plan.policyNumber}` : ''}
                {plan.vehicleRegistration ? ` · ${plan.vehicleRegistration}` : ''}
                {plan.postcode ? ` · ${plan.postcode}` : ''}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {!plan.cancelledAt && (
                <button onClick={() => cancelPlan.mutate(plan.id)} className={BTN_ROW_ACTION}>
                  Cancel
                </button>
              )}
              <button onClick={() => deletePlan.mutate(plan.id)} className={BTN_ROW_ACTION}>
                Delete
              </button>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

export function InsurancePage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Insurance</h1>
      <p className="text-sm text-slate-500">
        Informational only — insurance plans don't feed into the Wealth totals.
      </p>

      <section className="card-surface p-4">
        <h2 className="mb-3 text-lg font-semibold text-slate-900 dark:text-slate-100">Add plan</h2>
        <AddInsurancePlanForm />
      </section>

      <section className="card-surface p-4">
        <h2 className="mb-3 text-lg font-semibold text-slate-900 dark:text-slate-100">Plans</h2>
        <InsurancePlansList />
      </section>
    </div>
  );
}
