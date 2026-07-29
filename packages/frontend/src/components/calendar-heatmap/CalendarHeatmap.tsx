import { formatMoney } from '../../lib/formatMoney.js';

export interface CalendarHeatmapDay {
  date: string; // ISO YYYY-MM-DD
  value: number; // pence; sign determines colour, magnitude determines intensity
}

interface CalendarHeatmapProps {
  days: CalendarHeatmapDay[];
  /** Number of trailing days to render, ending today. */
  daysToShow?: number;
}

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

function colorForValue(value: number, maxAbs: number): string {
  if (value === 0 || maxAbs === 0) return 'bg-slate-100';
  const intensity = Math.min(1, Math.abs(value) / maxAbs);
  if (value > 0) {
    if (intensity > 0.66) return 'bg-green-600';
    if (intensity > 0.33) return 'bg-green-400';
    return 'bg-green-200';
  }
  if (intensity > 0.66) return 'bg-red-600';
  if (intensity > 0.33) return 'bg-red-400';
  return 'bg-red-200';
}

/** GitHub-contribution-graph-style grid: one column per week, one row per weekday. */
export function CalendarHeatmap({ days, daysToShow = 365 }: CalendarHeatmapProps) {
  const valueByDate = new Map(days.map((day) => [day.date, day.value]));

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const start = new Date(today);
  start.setDate(start.getDate() - (daysToShow - 1));
  start.setDate(start.getDate() - start.getDay()); // back up to the preceding Sunday

  const allDates: string[] = [];
  const cursor = new Date(start);
  while (cursor <= today) {
    allDates.push(toIsoDate(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }

  const maxAbs = Math.max(1, ...days.map((day) => Math.abs(day.value)));

  const weeks: string[][] = [];
  for (let i = 0; i < allDates.length; i += 7) {
    weeks.push(allDates.slice(i, i + 7));
  }

  return (
    <div className="overflow-x-auto">
      <div className="inline-flex gap-1">
        {weeks.map((week) => (
          <div key={week[0]} className="flex flex-col gap-1">
            {week.map((date) => {
              const value = valueByDate.get(date);
              const isFuture = parseIsoDate(date) > today;
              return (
                <div
                  key={date}
                  title={isFuture ? undefined : `${date}: ${formatMoney(value ?? 0)}`}
                  className={`h-3 w-3 rounded-sm ${isFuture ? 'invisible' : colorForValue(value ?? 0, maxAbs)}`}
                />
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
