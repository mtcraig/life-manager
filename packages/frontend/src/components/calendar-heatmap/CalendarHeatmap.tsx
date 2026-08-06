import { formatMoney } from '../../lib/formatMoney.js';
import { colorForValue } from './colorScale.js';

export interface CalendarHeatmapDay {
  date: string; // ISO YYYY-MM-DD
  value: number; // pence; sign determines colour, magnitude determines intensity
}

interface CalendarHeatmapProps {
  days: CalendarHeatmapDay[];
  /** Number of trailing days to render, ending today. Ignored when `year` is provided. */
  daysToShow?: number;
  /** Render a specific calendar year (Jan 1 -> Dec 31, or today if it's the current year) instead of a trailing window. */
  year?: number;
}

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/**
 * Parses/formats dates using local Y/M/D components rather than `new Date(iso)`
 * (which treats a bare YYYY-MM-DD as UTC midnight) or `.toISOString()` (which
 * converts back to UTC) — both would silently shift the displayed day by one
 * near timezone boundaries.
 */
function parseIsoDate(iso: string): Date {
  const [year, month, day] = iso.split('-').map(Number);
  return new Date(year as number, (month as number) - 1, day as number);
}

function toIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/** GitHub-contribution-graph-style grid: one column per week, one row per weekday. */
export function CalendarHeatmap({ days, daysToShow = 365, year }: CalendarHeatmapProps) {
  const valueByDate = new Map(days.map((day) => [day.date, day.value]));

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let rangeStart: Date;
  let rangeEnd: Date;
  if (year !== undefined) {
    rangeStart = new Date(year, 0, 1);
    rangeEnd = new Date(year, 11, 31);
  } else {
    rangeEnd = today;
    rangeStart = new Date(today);
    rangeStart.setDate(rangeStart.getDate() - (daysToShow - 1));
  }

  // Pad out to whole weeks (Sun-Sat) so the grid stays rectangular; padding
  // cells outside [rangeStart, rangeEnd] render invisible, same as future days did before.
  const gridStart = new Date(rangeStart);
  gridStart.setDate(gridStart.getDate() - gridStart.getDay());
  const gridEnd = new Date(rangeEnd);
  gridEnd.setDate(gridEnd.getDate() + (6 - gridEnd.getDay()));

  const allDates: string[] = [];
  const cursor = new Date(gridStart);
  while (cursor <= gridEnd) {
    allDates.push(toIsoDate(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }

  const maxAbs = Math.max(1, ...days.map((day) => Math.abs(day.value)));

  const weeks: string[][] = [];
  for (let i = 0; i < allDates.length; i += 7) {
    weeks.push(allDates.slice(i, i + 7));
  }

  const monthLabels = weeks.map((week, i) => {
    const firstDate = parseIsoDate(week[0] as string);
    if (firstDate < rangeStart || firstDate > rangeEnd) return null;
    const previousWeek = weeks[i - 1];
    if (!previousWeek) return MONTH_LABELS[firstDate.getMonth()];
    const previousMonth = parseIsoDate(previousWeek[0] as string).getMonth();
    return firstDate.getMonth() !== previousMonth ? MONTH_LABELS[firstDate.getMonth()] : null;
  });

  const columnTemplate = { gridTemplateColumns: `repeat(${weeks.length}, minmax(0, 1fr))` };

  return (
    <div className="w-full">
      <div className="grid gap-0.5" style={columnTemplate}>
        {monthLabels.map((label, i) => (
          <div key={weeks[i]?.[0]} className="text-[10px] leading-none text-slate-400">
            {label}
          </div>
        ))}
      </div>
      <div className="mt-1 grid gap-0.5" style={columnTemplate}>
        {weeks.map((week) => (
          <div key={week[0]} className="grid grid-rows-7 gap-0.5">
            {week.map((date) => {
              const value = valueByDate.get(date);
              const parsedDate = parseIsoDate(date);
              const isOutOfRange = parsedDate < rangeStart || parsedDate > rangeEnd;
              return (
                <div
                  key={date}
                  title={isOutOfRange ? undefined : `${date}: ${formatMoney(value ?? 0)}`}
                  className={`aspect-square w-full rounded-sm ${isOutOfRange ? 'invisible' : colorForValue(value ?? 0, maxAbs)}`}
                />
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
