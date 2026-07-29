import { computeMoneyInOut } from './moneyInOut';
import type { MoneyFlowInput } from './moneyInOut';

export interface DatedMoneyFlowInput extends MoneyFlowInput {
  date: string; // ISO YYYY-MM-DD
}

export interface MoneyFlowDay {
  date: string;
  moneyIn: number;
  moneyOut: number;
  net: number;
}

export interface MoneyFlowResult {
  days: MoneyFlowDay[];
  totals: { moneyIn: number; moneyOut: number; net: number };
}

/** Groups dated transactions by day and runs computeMoneyInOut per day, sorted ascending. */
export function groupMoneyFlowByDate(rows: DatedMoneyFlowInput[]): MoneyFlowResult {
  const rowsByDate = new Map<string, DatedMoneyFlowInput[]>();
  for (const row of rows) {
    const existing = rowsByDate.get(row.date);
    if (existing) {
      existing.push(row);
    } else {
      rowsByDate.set(row.date, [row]);
    }
  }

  const days: MoneyFlowDay[] = [...rowsByDate.entries()]
    .map(([date, dayRows]) => ({ date, ...computeMoneyInOut(dayRows) }))
    .sort((a, b) => a.date.localeCompare(b.date));

  return { days, totals: computeMoneyInOut(rows) };
}
