import { useState } from 'react';
import type { CreateValuationInput, UpdateValuationInput, ValuationDto } from '@life-manager/shared';
import { ValuationTrendChart } from './charts/ValuationTrendChart.js';
import { SkeletonRows } from './Skeleton.js';
import { formatMoney } from '../lib/formatMoney.js';
import { BTN_ROW_ACTION } from '../theme/tokens.js';

interface ValuationHistoryPanelProps {
  valuations: ValuationDto[] | undefined;
  isPending: boolean;
  onAddValuation: (input: CreateValuationInput) => void;
  isAdding: boolean;
  onUpdateValuation: (valuationId: number, input: UpdateValuationInput) => void;
  onDeleteValuation: (valuationId: number) => void;
}

function ValuationEditRow({
  valuation,
  onSave,
  onCancel,
}: {
  valuation: ValuationDto;
  onSave: (input: UpdateValuationInput) => void;
  onCancel: () => void;
}) {
  const [asOfDate, setAsOfDate] = useState(valuation.asOfDate);
  const [value, setValue] = useState(String(valuation.value / 100));
  const [notes, setNotes] = useState(valuation.notes ?? '');
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    const pounds = Number(value);
    if (Number.isNaN(pounds)) {
      setError('Enter a valid amount.');
      return;
    }
    onSave({ asOfDate, value: Math.round(pounds * 100), notes: notes.trim() || undefined });
  }

  return (
    <li className="py-1">
      <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-2">
        <input
          type="date"
          required
          value={asOfDate}
          onChange={(e) => setAsOfDate(e.target.value)}
          className="mt-1 block rounded-md border border-slate-300 px-2 py-1 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
        />
        <input
          type="number"
          step="0.01"
          required
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="mt-1 block w-24 rounded-md border border-slate-300 px-2 py-1 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
        />
        <input
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Notes"
          className="mt-1 block rounded-md border border-slate-300 px-2 py-1 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
        />
        <button type="submit" className={BTN_ROW_ACTION}>
          Save
        </button>
        <button type="button" onClick={onCancel} className={BTN_ROW_ACTION}>
          Cancel
        </button>
      </form>
      {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}
    </li>
  );
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
  onUpdateValuation,
  onDeleteValuation,
}: ValuationHistoryPanelProps) {
  const [asOfDate, setAsOfDate] = useState('');
  const [value, setValue] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);

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

  function handleDelete(valuationId: number) {
    if (!window.confirm('Delete this valuation? This cannot be undone.')) return;
    onDeleteValuation(valuationId);
  }

  return (
    <div className="mt-3 space-y-3 border-t border-slate-100 pt-3 dark:border-slate-800">
      {isPending && <SkeletonRows rows={2} />}
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
          {[...valuations].reverse().map((v) =>
            editingId === v.id ? (
              <ValuationEditRow
                key={v.id}
                valuation={v}
                onSave={(input) => {
                  onUpdateValuation(v.id, input);
                  setEditingId(null);
                }}
                onCancel={() => setEditingId(null)}
              />
            ) : (
              <li key={v.id} className="py-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-slate-600 dark:text-slate-400">{v.asOfDate}</span>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-slate-900 dark:text-slate-100">
                      {formatMoney(v.value)}
                    </span>
                    <button onClick={() => setEditingId(v.id)} className={BTN_ROW_ACTION}>
                      Edit
                    </button>
                    <button onClick={() => handleDelete(v.id)} className={BTN_ROW_ACTION}>
                      Delete
                    </button>
                  </div>
                </div>
                {v.notes && <div className="text-xs text-slate-500">{v.notes}</div>}
              </li>
            ),
          )}
        </ul>
      )}
    </div>
  );
}
