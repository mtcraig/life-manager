import type { ForecastEventDto } from '@life-manager/shared';
import { formatMoney } from '../../lib/formatMoney.js';

export function UpcomingItemsLedger({ events }: { events: ForecastEventDto[] }) {
  if (events.length === 0) {
    return (
      <p className="text-sm text-slate-500">No recurring items detected are due within this forecast horizon.</p>
    );
  }

  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="text-left text-xs uppercase tracking-wide text-slate-500">
          <th className="pb-2 font-medium">Date</th>
          <th className="pb-2 font-medium">Item</th>
          <th className="pb-2 text-right font-medium">Amount</th>
          <th className="pb-2 text-right font-medium">Balance after</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
        {events.map((event, i) => (
          <tr key={`${event.date}-${event.description}-${i}`}>
            <td className="py-2 text-slate-700 dark:text-slate-300">{event.date}</td>
            <td className="py-2 capitalize text-slate-700 dark:text-slate-300">{event.description}</td>
            <td
              className={`py-2 text-right font-medium ${
                event.amount < 0 ? 'text-red-600 dark:text-red-400' : 'text-green-700 dark:text-green-400'
              }`}
            >
              {formatMoney(event.amount)}
            </td>
            <td className="py-2 text-right text-slate-700 dark:text-slate-300">
              {formatMoney(event.runningBalance)}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
