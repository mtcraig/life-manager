import { useState } from 'react';
import { Tabs } from '../../components/Tabs.js';
import { YearFilter } from '../../components/YearFilter.js';
import type { YearFilterValue } from '../../lib/yearFilter.js';
import { useEnergyReadings } from '../../hooks/useEnergy.js';
import { OverviewTab } from './OverviewTab.js';
import { ReadingsTab } from './ReadingsTab.js';
import { UtilityProvidersTab } from './UtilityProvidersTab.js';

type EnergyTab = 'overview' | 'readings' | 'utility-providers';

export function EnergyPage() {
  const [tab, setTab] = useState<EnergyTab>('overview');
  const [selectedYear, setSelectedYear] = useState<YearFilterValue>(new Date().getFullYear());
  const { data: readings } = useEnergyReadings();

  const earliestYear =
    readings && readings.length > 0
      ? Math.min(...readings.map((r) => Number(r.readingDate.slice(0, 4))))
      : undefined;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Energy</h1>
        {tab !== 'utility-providers' && (
          <YearFilter selectedYear={selectedYear} onChange={setSelectedYear} earliestYear={earliestYear} />
        )}
      </div>

      <Tabs
        tabs={[
          { value: 'overview', label: 'Overview' },
          { value: 'readings', label: 'Readings' },
          { value: 'utility-providers', label: 'Utility Providers' },
        ]}
        active={tab}
        onChange={setTab}
      />

      {tab === 'overview' && <OverviewTab selectedYear={selectedYear} />}
      {tab === 'readings' && <ReadingsTab selectedYear={selectedYear} />}
      {tab === 'utility-providers' && <UtilityProvidersTab />}
    </div>
  );
}
