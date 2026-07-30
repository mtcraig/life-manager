import { useState } from 'react';
import type { CreateEnergyReadingInput, EnergyUnit, MeterType } from '@life-manager/shared';
import { ENERGY_UNITS, METER_TYPES } from '@life-manager/shared';
import {
  useBulkImportEnergyReadings,
  useCreateEnergyReading,
  useDeleteEnergyReading,
  useEnergyReadings,
} from '../../hooks/useEnergy.js';
import { EnergyUsageChart } from '../../components/charts/EnergyUsageChart.js';
import { humanizeEnumValue } from '../../lib/humanize.js';
import { BTN_PRIMARY } from '../../theme/tokens.js';

const DEFAULT_UNIT_BY_METER: Record<MeterType, EnergyUnit> = {
  electricity: 'kWh',
  gas: 'm3',
  water: 'litres',
};

function AddReadingForm() {
  const createReading = useCreateEnergyReading();
  const [meterType, setMeterType] = useState<MeterType>('electricity');
  const [readingDate, setReadingDate] = useState('');
  const [value, setValue] = useState('');
  const [unit, setUnit] = useState<EnergyUnit>('kWh');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

  function handleMeterTypeChange(next: MeterType) {
    setMeterType(next);
    setUnit(DEFAULT_UNIT_BY_METER[next]);
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    const input: CreateEnergyReadingInput = {
      meterType,
      readingDate,
      value: Number(value),
      unit,
      notes: notes.trim() || undefined,
    };
    createReading.mutate(input, {
      onSuccess: () => {
        setReadingDate('');
        setValue('');
        setNotes('');
      },
      onError: (err) => setError(err instanceof Error ? err.message : String(err)),
    });
  }

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      <label className="text-sm text-slate-700 dark:text-slate-300">
        Meter
        <select
          value={meterType}
          onChange={(e) => handleMeterTypeChange(e.target.value as MeterType)}
          className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
        >
          {METER_TYPES.map((type) => (
            <option key={type} value={type}>
              {humanizeEnumValue(type)}
            </option>
          ))}
        </select>
      </label>
      <label className="text-sm text-slate-700 dark:text-slate-300">
        Reading date
        <input
          required
          type="date"
          value={readingDate}
          onChange={(e) => setReadingDate(e.target.value)}
          className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
        />
      </label>
      <label className="text-sm text-slate-700 dark:text-slate-300">
        Value
        <input
          required
          type="number"
          step="0.01"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
        />
      </label>
      <label className="text-sm text-slate-700 dark:text-slate-300">
        Unit
        <select
          value={unit}
          onChange={(e) => setUnit(e.target.value as EnergyUnit)}
          className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
        >
          {ENERGY_UNITS.map((u) => (
            <option key={u} value={u}>
              {u}
            </option>
          ))}
        </select>
      </label>
      <label className="text-sm text-slate-700 dark:text-slate-300 sm:col-span-2">
        Notes (optional)
        <input
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
        />
      </label>
      <div className="flex items-end">
        <button type="submit" disabled={createReading.isPending} className={BTN_PRIMARY}>
          {createReading.isPending ? 'Adding…' : 'Add reading'}
        </button>
      </div>
      {error && <p className="col-span-full text-sm text-red-600 dark:text-red-400">{error}</p>}
    </form>
  );
}

function BulkImportForm() {
  const bulkImport = useBulkImportEnergyReadings();
  const [csvContent, setCsvContent] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ readingsCreated: number; readingsSkipped: number } | null>(
    null,
  );

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setResult(null);
    bulkImport.mutate(csvContent, {
      onSuccess: (res) => {
        setResult(res);
        setCsvContent('');
      },
      onError: (err) => setError(err instanceof Error ? err.message : String(err)),
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <p className="text-xs text-slate-500">
        Paste CSV with headers: <code>meterType,readingDate,value,unit,notes</code>. Rows matching an
        existing reading (same meter + date) are skipped, so it's safe to re-paste.
      </p>
      <textarea
        value={csvContent}
        onChange={(e) => setCsvContent(e.target.value)}
        rows={6}
        placeholder="meterType,readingDate,value,unit,notes"
        className="w-full rounded-md border border-slate-300 px-2 py-1 font-mono text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
      />
      <button
        type="submit"
        disabled={bulkImport.isPending || csvContent.trim().length === 0}
        className={BTN_PRIMARY}
      >
        {bulkImport.isPending ? 'Importing…' : 'Import CSV'}
      </button>
      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
      {result && (
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Imported {result.readingsCreated} reading{result.readingsCreated === 1 ? '' : 's'}, skipped{' '}
          {result.readingsSkipped} duplicate{result.readingsSkipped === 1 ? '' : 's'}.
        </p>
      )}
    </form>
  );
}

function ReadingsList() {
  const { data: readings, isPending, isError } = useEnergyReadings();
  const deleteReading = useDeleteEnergyReading();

  if (isPending) return <p className="text-sm text-slate-500">Loading…</p>;
  if (isError) return <p className="text-sm text-red-600 dark:text-red-400">Failed to load energy readings.</p>;
  if (!readings || readings.length === 0) {
    return <p className="text-sm text-slate-500">No readings yet — add one above.</p>;
  }

  const sorted = [...readings].sort((a, b) => b.readingDate.localeCompare(a.readingDate));

  return (
    <ul className="divide-y divide-slate-100 dark:divide-slate-800">
      {sorted.map((reading) => (
        <li key={reading.id} className="flex items-center justify-between py-2">
          <div>
            <span className="font-medium text-slate-900 dark:text-slate-100">{reading.meterType}</span>{' '}
            <span className="text-sm text-slate-600 dark:text-slate-400">
              {reading.value} {reading.unit}
            </span>{' '}
            <span className="text-xs text-slate-500">on {reading.readingDate}</span>
            {reading.notes && <span className="ml-2 text-xs text-slate-500">· {reading.notes}</span>}
          </div>
          <button
            onClick={() => deleteReading.mutate(reading.id)}
            className="rounded-md border border-slate-300 px-3 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            Delete
          </button>
        </li>
      ))}
    </ul>
  );
}

function UsageCharts() {
  const { data: readings } = useEnergyReadings();

  if (!readings || readings.length === 0) return null;

  return (
    <section className="grid gap-4 sm:grid-cols-3">
      {METER_TYPES.map((meterType) => {
        const readingsForMeter = readings.filter((r) => r.meterType === meterType);
        const firstReading = readingsForMeter[0];
        if (!firstReading) return null;
        return (
          <div
            key={meterType}
            className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
          >
            <h3 className="mb-2 text-sm font-semibold capitalize text-slate-900 dark:text-slate-100">
              {meterType}
            </h3>
            <EnergyUsageChart readings={readingsForMeter} unit={firstReading.unit} />
          </div>
        );
      })}
    </section>
  );
}

export function EnergyPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Energy</h1>

      <UsageCharts />

      <section className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
        <h2 className="mb-3 text-lg font-semibold text-slate-900 dark:text-slate-100">Add reading</h2>
        <AddReadingForm />
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
        <h2 className="mb-3 text-lg font-semibold text-slate-900 dark:text-slate-100">Bulk import (CSV)</h2>
        <BulkImportForm />
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
        <h2 className="mb-3 text-lg font-semibold text-slate-900 dark:text-slate-100">Readings</h2>
        <ReadingsList />
      </section>
    </div>
  );
}
