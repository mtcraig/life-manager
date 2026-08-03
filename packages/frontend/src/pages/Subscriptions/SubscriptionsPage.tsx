import { useState } from 'react';
import type { CreateSubscriptionInput, SubscriptionDto, SubscriptionFrequency } from '@life-manager/shared';
import { SUBSCRIPTION_FREQUENCIES } from '@life-manager/shared';
import { useCategories } from '../../hooks/useCategories.js';
import {
  useCancelSubscription,
  useCreateSubscription,
  useDeleteSubscription,
  useSubscriptions,
} from '../../hooks/useSubscriptions.js';
import { SkeletonRows, SkeletonStatGrid } from '../../components/Skeleton.js';
import { formatMoney } from '../../lib/formatMoney.js';
import { humanizeEnumValue } from '../../lib/humanize.js';
import { BTN_PRIMARY, BTN_ROW_ACTION } from '../../theme/tokens.js';

type SubscriptionStatus = 'cancelled' | 'upcoming' | 'active';

function deriveSubscriptionStatus(subscription: SubscriptionDto): SubscriptionStatus {
  if (subscription.cancelledAt) return 'cancelled';
  const today = new Date().toISOString().slice(0, 10);
  if (subscription.startDate > today) return 'upcoming';
  return 'active';
}

const STATUS_LABELS: Record<SubscriptionStatus, string> = {
  cancelled: 'Cancelled',
  upcoming: 'Upcoming',
  active: 'Active',
};

const STATUS_TONE_CLASSES: Record<SubscriptionStatus, string> = {
  cancelled: 'text-red-600 dark:text-red-400',
  upcoming: 'text-slate-500 dark:text-slate-400',
  active: 'text-green-700 dark:text-green-400',
};

/** Annual subscriptions are divided by 12, display-only — nothing is stored at this cadence. */
function monthlyEquivalent(subscription: SubscriptionDto): number {
  return subscription.frequency === 'annually' ? subscription.amount / 12 : subscription.amount;
}

function MonthlySpendSummary() {
  const { data: subscriptions, isPending } = useSubscriptions();

  if (isPending) return <SkeletonStatGrid count={1} />;
  if (!subscriptions) return null;

  const totalMonthly = subscriptions
    .filter((s) => deriveSubscriptionStatus(s) !== 'cancelled')
    .reduce((sum, s) => sum + monthlyEquivalent(s), 0);

  return (
    <div className="card-surface p-4">
      <div className="text-xs uppercase tracking-wide text-slate-500">Total monthly-equivalent spend</div>
      <div className="mt-1 text-2xl font-semibold text-slate-900 dark:text-slate-100">
        {formatMoney(Math.round(totalMonthly))}
      </div>
    </div>
  );
}

function AddSubscriptionForm() {
  const { data: categories } = useCategories();
  const createSubscription = useCreateSubscription();
  const [name, setName] = useState('');
  const [provider, setProvider] = useState('');
  const [amount, setAmount] = useState('');
  const [frequency, setFrequency] = useState<SubscriptionFrequency>('monthly');
  const [categoryId, setCategoryId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [nextRenewalDate, setNextRenewalDate] = useState('');
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    const input: CreateSubscriptionInput = {
      name,
      provider: provider.trim() || undefined,
      amount: Math.round(Number(amount) * 100),
      frequency,
      categoryId: categoryId ? Number(categoryId) : undefined,
      startDate,
      nextRenewalDate,
    };
    createSubscription.mutate(input, {
      onSuccess: () => {
        setName('');
        setProvider('');
        setAmount('');
        setFrequency('monthly');
        setCategoryId('');
        setStartDate('');
        setNextRenewalDate('');
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
        Provider (optional)
        <input
          value={provider}
          onChange={(e) => setProvider(e.target.value)}
          className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
        />
      </label>
      <label className="text-sm text-slate-700 dark:text-slate-300">
        Category (optional)
        <select
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
        >
          <option value="">None</option>
          {categories?.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </label>
      <label className="text-sm text-slate-700 dark:text-slate-300">
        Amount (£)
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
        Frequency
        <select
          value={frequency}
          onChange={(e) => setFrequency(e.target.value as SubscriptionFrequency)}
          className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
        >
          {SUBSCRIPTION_FREQUENCIES.map((f) => (
            <option key={f} value={f}>
              {humanizeEnumValue(f)}
            </option>
          ))}
        </select>
      </label>
      <label className="text-sm text-slate-700 dark:text-slate-300">
        Start date
        <input
          required
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
        />
      </label>
      <label className="text-sm text-slate-700 dark:text-slate-300">
        Next renewal date
        <input
          required
          type="date"
          value={nextRenewalDate}
          onChange={(e) => setNextRenewalDate(e.target.value)}
          className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
        />
      </label>
      <div className="flex items-end">
        <button type="submit" disabled={createSubscription.isPending} className={BTN_PRIMARY}>
          {createSubscription.isPending ? 'Adding…' : 'Add subscription'}
        </button>
      </div>
      {error && <p className="col-span-full text-sm text-red-600 dark:text-red-400">{error}</p>}
    </form>
  );
}

function SubscriptionsList() {
  const { data: subscriptions, isPending, isError } = useSubscriptions();
  const { data: categories } = useCategories();
  const deleteSubscription = useDeleteSubscription();
  const cancelSubscription = useCancelSubscription();
  const categoryNameById = new Map(categories?.map((c) => [c.id, c.name]));

  if (isPending) return <SkeletonRows rows={3} />;
  if (isError) return <p className="text-sm text-red-600 dark:text-red-400">Failed to load subscriptions.</p>;
  if (!subscriptions || subscriptions.length === 0) {
    return <p className="text-sm text-slate-500">No subscriptions yet — add one above.</p>;
  }

  return (
    <ul className="divide-y divide-slate-100 dark:divide-slate-800">
      {subscriptions.map((subscription) => {
        const status = deriveSubscriptionStatus(subscription);
        return (
          <li key={subscription.id} className="flex items-center justify-between py-3">
            <div>
              <div className="font-medium text-slate-900 dark:text-slate-100">
                {subscription.name}{' '}
                <span className={`text-xs font-medium ${STATUS_TONE_CLASSES[status]}`}>
                  {STATUS_LABELS[status]}
                </span>
              </div>
              <div className="text-xs text-slate-500">
                {formatMoney(subscription.amount)}/{subscription.frequency === 'monthly' ? 'mo' : 'yr'} · Started{' '}
                {subscription.startDate} · Renews {subscription.nextRenewalDate}
                {subscription.provider ? ` · ${subscription.provider}` : ''}
                {subscription.categoryId ? ` · ${categoryNameById.get(subscription.categoryId) ?? ''}` : ''}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {!subscription.cancelledAt && (
                <button onClick={() => cancelSubscription.mutate(subscription.id)} className={BTN_ROW_ACTION}>
                  Cancel
                </button>
              )}
              <button onClick={() => deleteSubscription.mutate(subscription.id)} className={BTN_ROW_ACTION}>
                Delete
              </button>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

export function SubscriptionsPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Subscriptions</h1>

      <MonthlySpendSummary />

      <section className="card-surface p-4">
        <h2 className="mb-3 text-lg font-semibold text-slate-900 dark:text-slate-100">Add subscription</h2>
        <AddSubscriptionForm />
      </section>

      <section className="card-surface p-4">
        <h2 className="mb-3 text-lg font-semibold text-slate-900 dark:text-slate-100">Subscriptions</h2>
        <SubscriptionsList />
      </section>
    </div>
  );
}
