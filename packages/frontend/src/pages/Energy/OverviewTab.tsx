import type { EnergyReadingDto, MeterType } from '@life-manager/shared';
import { METER_TYPES, normalizeWaterUsageToM3 } from '@life-manager/shared';
import type { YearFilterValue } from '../../lib/yearFilter.js';
import { dateRangeForYear } from '../../lib/yearFilter.js';
import { useEnergyReadings, useUtilityCostSeries } from '../../hooks/useEnergy.js';
import { EnergyUsageChart } from '../../components/charts/EnergyUsageChart.js';
import { UtilityCostChart } from '../../components/charts/UtilityCostChart.js';
import { SkeletonChart } from '../../components/Skeleton.js';

function filterReadingsByYear(readings: EnergyReadingDto[] | undefined, selectedYear: YearFilterValue) {
  if (!readings) return readings;
  const { dateFrom, dateTo } = dateRangeForYear(selectedYear);
  return readings.filter(
    (r) => (dateFrom === undefined || r.readingDate >= dateFrom) && (dateTo === undefined || r.readingDate <= dateTo),
  );
}

function UsageCharts({ selectedYear }: { selectedYear: YearFilterValue }) {
  const { data: readings } = useEnergyReadings();
  const filtered = filterReadingsByYear(readings, selectedYear);

  if (!filtered || filtered.length === 0) return null;

  return (
    <section className="grid gap-4 sm:grid-cols-3">
      {METER_TYPES.map((meterType: MeterType) => {
        const readingsForMeter = filtered.filter((r) => r.meterType === meterType);
        const firstReading = readingsForMeter[0];
        if (!firstReading) return null;

        const isWater = meterType === 'water';
        const chartReadings = isWater
          ? readingsForMeter.map((r) => ({ ...r, value: normalizeWaterUsageToM3(r.value, r.unit) }))
          : readingsForMeter;
        const unit = isWater ? 'm3' : firstReading.unit;

        return (
          <div key={meterType} className="card-surface p-4">
            <h3 className="mb-2 text-sm font-semibold capitalize text-slate-900 dark:text-slate-100">
              {meterType}
            </h3>
            <EnergyUsageChart readings={chartReadings} unit={unit} />
          </div>
        );
      })}
    </section>
  );
}

function UtilityCostSection({ selectedYear }: { selectedYear: YearFilterValue }) {
  const { data, isPending, isError } = useUtilityCostSeries(selectedYear === 'all' ? undefined : selectedYear);

  return (
    <section className="card-surface p-4">
      <h2 className="mb-3 text-lg font-semibold text-slate-900 dark:text-slate-100">Cost</h2>
      {isPending && <SkeletonChart className="h-56 w-full" />}
      {isError && <p className="text-sm text-red-600 dark:text-red-400">Failed to load utility costs.</p>}
      {data && data.points.length === 0 && (
        <p className="text-sm text-slate-500">
          No cost data yet — add readings and set up utility providers to see cost over time.
        </p>
      )}
      {data && data.points.length > 0 && <UtilityCostChart points={data.points} />}
    </section>
  );
}

export function OverviewTab({ selectedYear }: { selectedYear: YearFilterValue }) {
  return (
    <div className="space-y-4">
      <UsageCharts selectedYear={selectedYear} />
      <UtilityCostSection selectedYear={selectedYear} />
    </div>
  );
}
