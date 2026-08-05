import type { ForecastDayHealth } from '@life-manager/shared';
import { formatDisplayDate, useDateFormat } from '../../lib/formatDate.js';

const HEALTH_CLASSES: Record<ForecastDayHealth, string> = {
  comfortable: 'bg-teal-500 dark:bg-teal-400',
  tight: 'bg-amber-500 dark:bg-amber-400',
  belowZero: 'bg-red-500 dark:bg-red-400',
};

const HEALTH_LABELS: Record<ForecastDayHealth, string> = {
  comfortable: 'Comfortable',
  tight: 'Tight',
  belowZero: 'Below zero',
};

export function ForecastCalendarStrip({ health }: { health: { date: string; status: ForecastDayHealth }[] }) {
  const dateFormat = useDateFormat();

  return (
    <div>
      <div className="grid gap-1" style={{ gridTemplateColumns: 'repeat(15, minmax(0, 1fr))' }}>
        {health.map((day) => (
          <div
            key={day.date}
            title={`${day.date}: ${HEALTH_LABELS[day.status]}`}
            className={`flex aspect-square items-center justify-center rounded ${HEALTH_CLASSES[day.status]}`}
          >
            <span className="text-[9px] font-medium leading-none text-white/80">
              {formatDisplayDate(day.date, dateFormat, { short: true })}
            </span>
          </div>
        ))}
      </div>
      <div className="mt-3 flex gap-4 text-xs text-slate-500">
        {(Object.keys(HEALTH_LABELS) as ForecastDayHealth[]).map((status) => (
          <span key={status} className="flex items-center gap-1.5">
            <span className={`inline-block h-2.5 w-2.5 rounded-sm ${HEALTH_CLASSES[status]}`} />
            {HEALTH_LABELS[status]}
          </span>
        ))}
      </div>
    </div>
  );
}
