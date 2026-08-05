import type { MeterType } from '@life-manager/shared';

export interface MeterReadingPoint {
  readingDate: string;
  value: number;
}

export interface TariffPeriod {
  startDate: string;
  endDate: string | null;
  standingChargePerDay: number;
  unitRate: number;
  wastewaterStandingChargePerDay: number | null;
  wastewaterUnitRate: number | null;
  rainwaterRemovalStandingChargePerDay: number | null;
  /** MJ/m3, gas only - see costForSubInterval for why gas usage needs this. */
  calorificValue: number | null;
}

/**
 * Gas meters read volume (m3) but gas is billed by energy content (£/kWh),
 * so m3 usage must be converted to kWh before the unit rate is applied:
 * kWh = m3 x volume correction factor x calorific value / 3.6. The volume
 * correction factor is an industry-standard constant; the calorific value
 * varies over time and comes from the tariff (copied off the supplier's
 * bill), which is why it isn't folded into this constant.
 */
const GAS_VOLUME_CORRECTION_FACTOR = 1.02264;
const MJ_TO_KWH = 3.6;

export interface MonthlyCostPoint {
  month: string;
  cost: number;
}

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function parseDateMs(iso: string): number {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!match) {
    throw new Error(`Invalid ISO date "${iso}"`);
  }
  const [, y, m, d] = match as unknown as [string, string, string, string];
  return Date.UTC(Number(y), Number(m) - 1, Number(d));
}

function formatDate(ms: number): string {
  const d = new Date(ms);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function daysBetween(fromIso: string, toIso: string): number {
  return Math.round((parseDateMs(toIso) - parseDateMs(fromIso)) / MS_PER_DAY);
}

function addDays(iso: string, days: number): string {
  return formatDate(parseDateMs(iso) + days * MS_PER_DAY);
}

function firstOfNextMonth(iso: string): string {
  const match = /^(\d{4})-(\d{2})-\d{2}$/.exec(iso);
  if (!match) {
    throw new Error(`Invalid ISO date "${iso}"`);
  }
  const [, yStr, mStr] = match as unknown as [string, string, string];
  const y = Number(yStr);
  const m = Number(mStr);
  const nextMonth = m === 12 ? 1 : m + 1;
  const nextYear = m === 12 ? y + 1 : y;
  return `${nextYear}-${String(nextMonth).padStart(2, '0')}-01`;
}

export function monthOf(iso: string): string {
  return iso.slice(0, 7);
}

/**
 * Boundaries for a reading-to-reading interval: the two reading dates, plus
 * every tariff start/end that falls strictly inside (a reading pair can span
 * a rate change), plus every first-of-month date strictly inside (needed to
 * bucket cost into calendar months). Tariff coverage is half-open
 * (`[startDate, endDate + 1 day)`) so back-to-back tariffs tile with no gap
 * and no double-count - `endDate + 1 day` is the boundary, not `endDate`.
 */
export function buildBoundaries(intervalStart: string, intervalEnd: string, tariffs: TariffPeriod[]): string[] {
  const boundaries = new Set<string>([intervalStart, intervalEnd]);

  for (const tariff of tariffs) {
    if (tariff.startDate > intervalStart && tariff.startDate < intervalEnd) {
      boundaries.add(tariff.startDate);
    }
    if (tariff.endDate !== null) {
      const dayAfterEnd = addDays(tariff.endDate, 1);
      if (dayAfterEnd > intervalStart && dayAfterEnd < intervalEnd) {
        boundaries.add(dayAfterEnd);
      }
    }
  }

  let cursor = firstOfNextMonth(intervalStart);
  while (cursor < intervalEnd) {
    boundaries.add(cursor);
    cursor = firstOfNextMonth(cursor);
  }

  return [...boundaries].sort((a, b) => a.localeCompare(b));
}

function findTariffForDate(dateIso: string, tariffs: TariffPeriod[]): TariffPeriod | undefined {
  return tariffs.find((t) => t.startDate <= dateIso && (t.endDate === null || dateIso <= t.endDate));
}

function costForSubInterval(meterType: MeterType, tariff: TariffPeriod, days: number, usage: number): number {
  if (meterType === 'gas') {
    const usageKwh = (usage * GAS_VOLUME_CORRECTION_FACTOR * (tariff.calorificValue ?? 0)) / MJ_TO_KWH;
    return tariff.standingChargePerDay * days + tariff.unitRate * usageKwh;
  }

  const primary = tariff.standingChargePerDay * days + tariff.unitRate * usage;
  if (meterType !== 'water') return primary;
  const wastewater =
    (tariff.wastewaterStandingChargePerDay ?? 0) * days + (tariff.wastewaterUnitRate ?? 0) * usage;
  const rainwaterRemoval = (tariff.rainwaterRemovalStandingChargePerDay ?? 0) * days;
  return primary + wastewater + rainwaterRemoval;
}

/**
 * `readings`/`tariffs` must already be filtered to a single meter type, and
 * `readings[].value` must already be normalized to the tariff's billing unit
 * (m3 for water - see `normalizeWaterUsageToM3` in the shared package) since
 * this module has no concept of units at all.
 */
export function calculateMonthlyCosts(
  readings: MeterReadingPoint[],
  tariffs: TariffPeriod[],
  meterType: MeterType,
): MonthlyCostPoint[] {
  const sorted = [...readings].sort((a, b) => a.readingDate.localeCompare(b.readingDate));
  const costByMonth = new Map<string, number>();

  for (let i = 0; i < sorted.length - 1; i++) {
    const from = sorted[i]!;
    const to = sorted[i + 1]!;
    const totalDays = daysBetween(from.readingDate, to.readingDate);
    if (totalDays <= 0) continue;
    const dailyUsageRate = (to.value - from.value) / totalDays;

    const boundaries = buildBoundaries(from.readingDate, to.readingDate, tariffs);
    for (let j = 0; j < boundaries.length - 1; j++) {
      const subStart = boundaries[j]!;
      const subEnd = boundaries[j + 1]!;
      const days = daysBetween(subStart, subEnd);
      if (days <= 0) continue;
      const usage = dailyUsageRate * days;
      const tariff = findTariffForDate(subStart, tariffs);
      const cost = tariff ? costForSubInterval(meterType, tariff, days, usage) : 0;
      const month = monthOf(subStart);
      costByMonth.set(month, (costByMonth.get(month) ?? 0) + cost);
    }
  }

  return [...costByMonth.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([month, cost]) => ({ month, cost }));
}

export function aggregateToYears(monthlyPoints: MonthlyCostPoint[]): { year: string; cost: number }[] {
  const costByYear = new Map<string, number>();
  for (const point of monthlyPoints) {
    const year = point.month.slice(0, 4);
    costByYear.set(year, (costByYear.get(year) ?? 0) + point.cost);
  }
  return [...costByYear.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([year, cost]) => ({ year, cost }));
}

export interface MonthlyUsagePoint {
  month: string;
  usage: number;
}

/**
 * Prorated usage per calendar month, independent of any tariff - splitting
 * only on month boundaries (`buildBoundaries` with an empty tariff list)
 * rather than also on tariff start/end dates like `calculateMonthlyCosts`
 * does, since usage alone has no notion of a rate change.
 */
export function calculateMonthlyUsage(readings: MeterReadingPoint[]): MonthlyUsagePoint[] {
  const sorted = [...readings].sort((a, b) => a.readingDate.localeCompare(b.readingDate));
  const usageByMonth = new Map<string, number>();

  for (let i = 0; i < sorted.length - 1; i++) {
    const from = sorted[i]!;
    const to = sorted[i + 1]!;
    const totalDays = daysBetween(from.readingDate, to.readingDate);
    if (totalDays <= 0) continue;
    const dailyUsageRate = (to.value - from.value) / totalDays;

    const boundaries = buildBoundaries(from.readingDate, to.readingDate, []);
    for (let j = 0; j < boundaries.length - 1; j++) {
      const subStart = boundaries[j]!;
      const subEnd = boundaries[j + 1]!;
      const days = daysBetween(subStart, subEnd);
      if (days <= 0) continue;
      const usage = dailyUsageRate * days;
      const month = monthOf(subStart);
      usageByMonth.set(month, (usageByMonth.get(month) ?? 0) + usage);
    }
  }

  return [...usageByMonth.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([month, usage]) => ({ month, usage }));
}

export function aggregateUsageToYears(monthlyPoints: MonthlyUsagePoint[]): { year: string; usage: number }[] {
  const usageByYear = new Map<string, number>();
  for (const point of monthlyPoints) {
    const year = point.month.slice(0, 4);
    usageByYear.set(year, (usageByYear.get(year) ?? 0) + point.usage);
  }
  return [...usageByYear.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([year, usage]) => ({ year, usage }));
}
