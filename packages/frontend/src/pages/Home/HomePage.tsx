import { useState } from 'react';
import { HomeContent } from './HomeContent.js';
import { YearFilter as YearFilterControl } from '../../components/YearFilter.js';
import { useAppSettings } from '../../hooks/useAppSettings.js';
import { useTransactionDateBounds } from '../../hooks/useAnalytics.js';
import type { YearFilterValue } from '../../lib/yearFilter.js';

export function HomePage() {
  const { data: appSettings } = useAppSettings();
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState<YearFilterValue>(currentYear);
  const { data: dateBounds } = useTransactionDateBounds();
  const earliestYear = dateBounds?.earliestDate ? Number(dateBounds.earliestDate.slice(0, 4)) : undefined;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
          {appSettings?.userName ? `Welcome, ${appSettings.userName}` : 'Home'}
        </h1>
        <YearFilterControl selectedYear={selectedYear} onChange={setSelectedYear} earliestYear={earliestYear} />
      </div>

      <HomeContent selectedYear={selectedYear} />
    </div>
  );
}
