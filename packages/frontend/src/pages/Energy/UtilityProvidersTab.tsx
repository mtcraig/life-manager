import { useState } from 'react';
import type { CreateUtilityTariffInput, MeterType, UtilityTariffDto } from '@life-manager/shared';
import { METER_TYPES } from '@life-manager/shared';
import {
  useCreateUtilityTariff,
  useDeleteUtilityTariff,
  useUpdateUtilityTariff,
  useUtilityTariffs,
} from '../../hooks/useUtilityTariffs.js';
import { SkeletonRows } from '../../components/Skeleton.js';
import { humanizeEnumValue } from '../../lib/humanize.js';
import { BTN_PRIMARY, BTN_ROW_ACTION, BTN_ROW_ACTION_DANGER } from '../../theme/tokens.js';

const INPUT_CLASS =
  'mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100';

interface TariffFormValues {
  meterType: MeterType;
  providerName: string;
  startDate: string;
  endDate: string;
  standingChargePerDay: string;
  unitRate: string;
  wastewaterStandingChargePerDay: string;
  wastewaterUnitRate: string;
  rainwaterRemovalStandingChargePerDay: string;
  notes: string;
}

function emptyFormValues(): TariffFormValues {
  return {
    meterType: 'electricity',
    providerName: '',
    startDate: '',
    endDate: '',
    standingChargePerDay: '',
    unitRate: '',
    wastewaterStandingChargePerDay: '',
    wastewaterUnitRate: '',
    rainwaterRemovalStandingChargePerDay: '',
    notes: '',
  };
}

function formValuesFromTariff(tariff: UtilityTariffDto): TariffFormValues {
  return {
    meterType: tariff.meterType,
    providerName: tariff.providerName,
    startDate: tariff.startDate,
    endDate: tariff.endDate ?? '',
    standingChargePerDay: String(tariff.standingChargePerDay),
    unitRate: String(tariff.unitRate),
    wastewaterStandingChargePerDay:
      tariff.wastewaterStandingChargePerDay !== null ? String(tariff.wastewaterStandingChargePerDay) : '',
    wastewaterUnitRate: tariff.wastewaterUnitRate !== null ? String(tariff.wastewaterUnitRate) : '',
    rainwaterRemovalStandingChargePerDay:
      tariff.rainwaterRemovalStandingChargePerDay !== null
        ? String(tariff.rainwaterRemovalStandingChargePerDay)
        : '',
    notes: tariff.notes ?? '',
  };
}

function buildTariffInput(values: TariffFormValues): { input: CreateUtilityTariffInput } | { error: string } {
  const isWater = values.meterType === 'water';
  const hasWastewaterCharge = values.wastewaterStandingChargePerDay.trim() !== '';
  const hasWastewaterRate = values.wastewaterUnitRate.trim() !== '';
  if (isWater && hasWastewaterCharge !== hasWastewaterRate) {
    return { error: 'Wastewater standing charge and unit rate must both be set or both left blank.' };
  }

  return {
    input: {
      meterType: values.meterType,
      providerName: values.providerName,
      startDate: values.startDate,
      endDate: values.endDate.trim() || undefined,
      standingChargePerDay: Number(values.standingChargePerDay),
      unitRate: Number(values.unitRate),
      ...(isWater && hasWastewaterCharge && hasWastewaterRate
        ? {
            wastewaterStandingChargePerDay: Number(values.wastewaterStandingChargePerDay),
            wastewaterUnitRate: Number(values.wastewaterUnitRate),
          }
        : {}),
      ...(isWater && values.rainwaterRemovalStandingChargePerDay.trim() !== ''
        ? { rainwaterRemovalStandingChargePerDay: Number(values.rainwaterRemovalStandingChargePerDay) }
        : {}),
      notes: values.notes.trim() || undefined,
    },
  };
}

function TariffForm({
  values,
  onChange,
  onSubmit,
  onCancel,
  error,
  isSubmitting,
  submitLabel,
}: {
  values: TariffFormValues;
  onChange: (values: TariffFormValues) => void;
  onSubmit: () => void;
  onCancel?: () => void;
  error: string | null;
  isSubmitting: boolean;
  submitLabel: string;
}) {
  function set<K extends keyof TariffFormValues>(key: K, value: TariffFormValues[K]) {
    onChange({ ...values, [key]: value });
  }

  const isWater = values.meterType === 'water';
  const primaryUnitLabel = values.meterType === 'electricity' ? 'kWh' : 'm3';

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
      className="grid grid-cols-2 gap-3 sm:grid-cols-3"
    >
      <label className="text-sm text-slate-700 dark:text-slate-300">
        Meter
        <select
          value={values.meterType}
          onChange={(e) => set('meterType', e.target.value as MeterType)}
          className={INPUT_CLASS}
        >
          {METER_TYPES.map((type) => (
            <option key={type} value={type}>
              {humanizeEnumValue(type)}
            </option>
          ))}
        </select>
      </label>
      <label className="text-sm text-slate-700 dark:text-slate-300">
        Provider
        <input
          required
          value={values.providerName}
          onChange={(e) => set('providerName', e.target.value)}
          className={INPUT_CLASS}
        />
      </label>
      <label className="text-sm text-slate-700 dark:text-slate-300">
        Start date
        <input
          required
          type="date"
          value={values.startDate}
          onChange={(e) => set('startDate', e.target.value)}
          className={INPUT_CLASS}
        />
      </label>
      <label className="text-sm text-slate-700 dark:text-slate-300">
        End date (optional — leave blank for ongoing)
        <input type="date" value={values.endDate} onChange={(e) => set('endDate', e.target.value)} className={INPUT_CLASS} />
      </label>

      {!isWater && (
        <>
          <label className="text-sm text-slate-700 dark:text-slate-300">
            Standing charge (£/day)
            <input
              required
              type="number"
              step="0.0001"
              value={values.standingChargePerDay}
              onChange={(e) => set('standingChargePerDay', e.target.value)}
              className={INPUT_CLASS}
            />
          </label>
          <label className="text-sm text-slate-700 dark:text-slate-300">
            Unit rate (£/{primaryUnitLabel})
            <input
              required
              type="number"
              step="0.0001"
              value={values.unitRate}
              onChange={(e) => set('unitRate', e.target.value)}
              className={INPUT_CLASS}
            />
          </label>
        </>
      )}

      {isWater && (
        <>
          <p className="col-span-full text-xs font-medium uppercase tracking-wide text-slate-500">Freshwater</p>
          <label className="text-sm text-slate-700 dark:text-slate-300">
            Standing charge (£/day)
            <input
              required
              type="number"
              step="0.0001"
              value={values.standingChargePerDay}
              onChange={(e) => set('standingChargePerDay', e.target.value)}
              className={INPUT_CLASS}
            />
          </label>
          <label className="text-sm text-slate-700 dark:text-slate-300">
            Unit rate (£/m3)
            <input
              required
              type="number"
              step="0.0001"
              value={values.unitRate}
              onChange={(e) => set('unitRate', e.target.value)}
              className={INPUT_CLASS}
            />
          </label>

          <p className="col-span-full text-xs font-medium uppercase tracking-wide text-slate-500">
            Wastewater (optional)
          </p>
          <label className="text-sm text-slate-700 dark:text-slate-300">
            Standing charge (£/day)
            <input
              type="number"
              step="0.0001"
              value={values.wastewaterStandingChargePerDay}
              onChange={(e) => set('wastewaterStandingChargePerDay', e.target.value)}
              className={INPUT_CLASS}
            />
          </label>
          <label className="text-sm text-slate-700 dark:text-slate-300">
            Unit rate (£/m3)
            <input
              type="number"
              step="0.0001"
              value={values.wastewaterUnitRate}
              onChange={(e) => set('wastewaterUnitRate', e.target.value)}
              className={INPUT_CLASS}
            />
          </label>

          <p className="col-span-full text-xs font-medium uppercase tracking-wide text-slate-500">
            Rainwater removal (optional)
          </p>
          <label className="text-sm text-slate-700 dark:text-slate-300">
            Standing charge (£/day)
            <input
              type="number"
              step="0.0001"
              value={values.rainwaterRemovalStandingChargePerDay}
              onChange={(e) => set('rainwaterRemovalStandingChargePerDay', e.target.value)}
              className={INPUT_CLASS}
            />
          </label>
        </>
      )}

      <label className="text-sm text-slate-700 dark:text-slate-300 sm:col-span-2">
        Notes (optional)
        <input value={values.notes} onChange={(e) => set('notes', e.target.value)} className={INPUT_CLASS} />
      </label>

      <div className="flex items-end gap-2">
        <button type="submit" disabled={isSubmitting} className={BTN_PRIMARY}>
          {isSubmitting ? 'Saving…' : submitLabel}
        </button>
        {onCancel && (
          <button type="button" onClick={onCancel} className={BTN_ROW_ACTION}>
            Cancel
          </button>
        )}
      </div>
      {error && <p className="col-span-full text-sm text-red-600 dark:text-red-400">{error}</p>}
    </form>
  );
}

function AddTariffForm() {
  const createTariff = useCreateUtilityTariff();
  const [values, setValues] = useState<TariffFormValues>(emptyFormValues());
  const [error, setError] = useState<string | null>(null);

  function handleSubmit() {
    setError(null);
    const result = buildTariffInput(values);
    if ('error' in result) {
      setError(result.error);
      return;
    }
    createTariff.mutate(result.input, {
      onSuccess: () => setValues(emptyFormValues()),
      onError: (err) => setError(err instanceof Error ? err.message : String(err)),
    });
  }

  return (
    <TariffForm
      values={values}
      onChange={setValues}
      onSubmit={handleSubmit}
      error={error}
      isSubmitting={createTariff.isPending}
      submitLabel="Add tariff"
    />
  );
}

function EditTariffRow({ tariff, onDone }: { tariff: UtilityTariffDto; onDone: () => void }) {
  const updateTariff = useUpdateUtilityTariff();
  const [values, setValues] = useState<TariffFormValues>(formValuesFromTariff(tariff));
  const [error, setError] = useState<string | null>(null);

  function handleSubmit() {
    setError(null);
    const result = buildTariffInput(values);
    if ('error' in result) {
      setError(result.error);
      return;
    }
    updateTariff.mutate(
      { id: tariff.id, input: result.input },
      {
        onSuccess: onDone,
        onError: (err) => setError(err instanceof Error ? err.message : String(err)),
      },
    );
  }

  return (
    <TariffForm
      values={values}
      onChange={setValues}
      onSubmit={handleSubmit}
      onCancel={onDone}
      error={error}
      isSubmitting={updateTariff.isPending}
      submitLabel="Save"
    />
  );
}

function formatDateRange(tariff: UtilityTariffDto): string {
  return tariff.endDate ? `${tariff.startDate} – ${tariff.endDate}` : `${tariff.startDate} – ongoing`;
}

function formatTariffRateSummary(tariff: UtilityTariffDto): string {
  const parts = [`£${tariff.standingChargePerDay.toFixed(4)}/day + £${tariff.unitRate.toFixed(4)}/unit`];
  if (tariff.wastewaterStandingChargePerDay !== null && tariff.wastewaterUnitRate !== null) {
    parts.push(
      `wastewater £${tariff.wastewaterStandingChargePerDay.toFixed(4)}/day + £${tariff.wastewaterUnitRate.toFixed(4)}/unit`,
    );
  }
  if (tariff.rainwaterRemovalStandingChargePerDay !== null) {
    parts.push(`rainwater removal £${tariff.rainwaterRemovalStandingChargePerDay.toFixed(4)}/day`);
  }
  return parts.join(' · ');
}

function UtilityTariffsList() {
  const { data: tariffs, isPending, isError } = useUtilityTariffs();
  const deleteTariff = useDeleteUtilityTariff();
  const [editingId, setEditingId] = useState<number | null>(null);

  if (isPending) return <SkeletonRows rows={3} />;
  if (isError) return <p className="text-sm text-red-600 dark:text-red-400">Failed to load utility tariffs.</p>;
  if (!tariffs || tariffs.length === 0) {
    return <p className="text-sm text-slate-500">No utility tariffs yet — add one above.</p>;
  }

  return (
    <div className="space-y-6">
      {METER_TYPES.map((meterType) => {
        const group = tariffs
          .filter((t) => t.meterType === meterType)
          .sort((a, b) => b.startDate.localeCompare(a.startDate));
        if (group.length === 0) return null;

        return (
          <div key={meterType}>
            <h3 className="mb-2 text-sm font-semibold capitalize text-slate-900 dark:text-slate-100">
              {humanizeEnumValue(meterType)}
            </h3>
            <ul className="divide-y divide-slate-100 dark:divide-slate-800">
              {group.map((tariff) =>
                editingId === tariff.id ? (
                  <li key={tariff.id} className="py-3">
                    <EditTariffRow tariff={tariff} onDone={() => setEditingId(null)} />
                  </li>
                ) : (
                  <li key={tariff.id} className="flex items-center justify-between py-2">
                    <div>
                      <div className="font-medium text-slate-900 dark:text-slate-100">
                        {tariff.providerName}{' '}
                        <span className="text-xs text-slate-500">({formatDateRange(tariff)})</span>
                      </div>
                      <div className="text-xs text-slate-500">{formatTariffRateSummary(tariff)}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => setEditingId(tariff.id)} className={BTN_ROW_ACTION}>
                        Edit
                      </button>
                      <button onClick={() => deleteTariff.mutate(tariff.id)} className={BTN_ROW_ACTION_DANGER}>
                        Delete
                      </button>
                    </div>
                  </li>
                ),
              )}
            </ul>
          </div>
        );
      })}
    </div>
  );
}

export function UtilityProvidersTab() {
  return (
    <div className="space-y-4">
      <section className="card-surface p-4">
        <h2 className="mb-3 text-lg font-semibold text-slate-900 dark:text-slate-100">Add utility provider</h2>
        <AddTariffForm />
      </section>
      <section className="card-surface p-4">
        <h2 className="mb-3 text-lg font-semibold text-slate-900 dark:text-slate-100">Utility providers</h2>
        <UtilityTariffsList />
      </section>
    </div>
  );
}
