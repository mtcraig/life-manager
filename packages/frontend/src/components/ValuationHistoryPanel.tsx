import { useState } from 'react';
import type { CreateValuationInput, ValuationDto } from '@life-manager/shared';
import { ValuationTrendChart } from './charts/ValuationTrendChart.js';
import { formatMoney } from '../lib/formatMoney.js';

interface ValuationHistoryPanelProps {
  valuations: ValuationDto[] | undefined;
  isPending: boolean;
  onAddValuation: (input: CreateValuationInput) => void;
  isAdding: boolean;
}

/**
 * Shared valuation-history UI (chart + list + add form) reused across
 * Investments, Properties, and Liabilities — the three domains that share
 * the same header + dated-valuation-history schema pattern.
 */
export function ValuationHistoryPanel({
  valuations,
  isPending,
  onAddValuation,
  isAdding,
}: ValuationHistoryPanelProps) {
  const [asOfDate, setAsOfDate] = useState('');
  const [value, setValue] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    if (!asOfDate) {
      setError('Choose a date.');
      return;
    }
    const pounds = Number(value);
    if (Number.isNaN(pounds)) {
      setError('Enter a valid amount.');
      return;
    }
    onAddValuation({
      asOfDate,
      value: Math.round(pounds * 100),
      notes: notes.trim() || undefined,
    });
    setAsOfDate('');
    setValue('');
    setNotes('');
  }

  return (
    <div className="mt-3 space-y-3 border-t border-slate-100 pt-3 dark:border-slate-800">
      {isPending && <p className="text-sm text-slate-500">Loading…</p>}
      {valuations && valuations.length === 0 && (
        <p className="text-sm text-slate-500">No valuations recorded yet.</p>
      )}
      {valuations && valuations.length > 0 && <ValuationTrendChart valuations={valuations} />}

      <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-2">
        <label className="text-xs text-slate-700 dark:text-slate-300">
          As of date
          <input
            type="date"
            required
            value={asOfDate}
            onChange={(e) => setAsOfDate(e.target.value)}
            className="mt-1 block rounded-md border border-slate-300 px-2 py-1 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          />
        </label>
        <label className="text-xs text-slate-700 dark:text-slate-300">
          Value (£)
          <input
            type="number"
            step="0.01"
            required
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="mt-1 block w-32 rounded-md border border-slate-300 px-2 py-1 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          />
        </label>
        <label className="text-xs text-slate-700 dark:text-slate-300">
          Notes
          <input
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="mt-1 block rounded-md border border-slate-300 px-2 py-1 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          />
        </label>
        <button
          type="submit"
          disabled={isAdding}
          className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          {isAdding ? 'Adding…' : 'Add valuation'}
        </button>
      </form>
      {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}

      {valuations && valuations.length > 0 && (
        <ul className="divide-y divide-slate-100 text-sm dark:divide-slate-800">
          {[...valuations].reverse().map((v) => (
            <li key={v.id} className="flex justify-between py-1">
              <span className="text-slate-600 dark:text-slate-400">{v.asOfDate}</span>
              <span className="font-medium text-slate-900 dark:text-slate-100">{formatMoney(v.value)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
