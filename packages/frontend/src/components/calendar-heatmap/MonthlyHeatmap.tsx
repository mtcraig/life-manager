import { formatMoney } from '../../lib/formatMoney.js';
import { colorForValue } from './colorScale.js';

export interface MonthlyHeatmapMonth {
  year: number;
  monthIndex: number; // 0-11
  net: number;
}

interface MonthlyHeatmapProps {
  months: MonthlyHeatmapMonth[];
}

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/**
 * GitHub-contribution-graph-style grid, one row per year and one column per
 * calendar month — the "All time" counterpart to CalendarHeatmap's single-year
 * daily grid, which can't represent more than one year at a time.
 */
export function MonthlyHeatmap({ months }: MonthlyHeatmapProps) {
  if (months.length === 0) return null;

  const netByKey = new Map(months.map((m) => [`${m.year}-${m.monthIndex}`, m.net]));
  const years = [...new Set(months.map((m) => m.year))].sort((a, b) => a - b);
  const firstYear = years[0] as number;
  const lastYear = years[years.length - 1] as number;
  const firstMonth = Math.min(...months.filter((m) => m.year === firstYear).map((m) => m.monthIndex));
  const lastMonth = Math.max(...months.filter((m) => m.year === lastYear).map((m) => m.monthIndex));

  const maxAbs = Math.max(1, ...months.map((m) => Math.abs(m.net)));

  const columnTemplate = { gridTemplateColumns: `3rem repeat(12, minmax(0, 1fr))` };

  return (
    <div className="w-full">
      <div className="grid gap-0.5" style={columnTemplate}>
        <div />
        {MONTH_LABELS.map((label) => (
          <div key={label} className="text-center text-[10px] leading-none text-slate-400">
            {label}
          </div>
        ))}
      </div>
      <div className="mt-1 space-y-0.5">
        {years.map((year) => (
          <div key={year} className="grid gap-0.5" style={columnTemplate}>
            <div className="flex items-center text-[10px] leading-none text-slate-400">{year}</div>
            {MONTH_LABELS.map((_, monthIndex) => {
              const isOutOfRange =
                (year === firstYear && monthIndex < firstMonth) || (year === lastYear && monthIndex > lastMonth);
              const net = netByKey.get(`${year}-${monthIndex}`) ?? 0;
              return (
                <div
                  key={monthIndex}
                  title={isOutOfRange ? undefined : `${MONTH_LABELS[monthIndex]} ${year}: ${formatMoney(net)}`}
                  className={`aspect-square w-full rounded-sm ${isOutOfRange ? 'invisible' : colorForValue(net, maxAbs)}`}
                />
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
