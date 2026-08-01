import type { YearFilterValue } from '../lib/yearFilter.js';
import { yearOptionsFrom } from '../lib/yearFilter.js';

interface YearFilterProps {
  selectedYear: YearFilterValue;
  onChange: (year: YearFilterValue) => void;
  /** Earliest year with real data — undefined while loading, in which case a short recent window is shown instead. */
  earliestYear?: number;
}

/** Shared year selector ("All time" + one option per year back to the earliest year with data). */
export function YearFilter({ selectedYear, onChange, earliestYear }: YearFilterProps) {
  const yearOptions = yearOptionsFrom(earliestYear);
  return (
    <label className="text-sm text-slate-700 dark:text-slate-300">
      Year{' '}
      <select
        value={selectedYear}
        onChange={(e) => onChange(e.target.value === 'all' ? 'all' : Number(e.target.value))}
        className="ml-1 rounded-md border border-slate-300 px-2 py-1 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
      >
        <option value="all">All time</option>
        {yearOptions.map((y) => (
          <option key={y} value={y}>
            {y}
          </option>
        ))}
      </select>
    </label>
  );
}
