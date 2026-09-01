import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { METER_TYPES } from '@life-manager/shared';
import type { MeterType } from '@life-manager/shared';
import { AccountsContent, CategorySpendingSection } from '../Accounts/AccountsContent.js';
import { HomeContent, MetricTile, groupByMonth, MONTH_LABELS } from '../Home/HomeContent.js';
import { InvestmentsContent } from '../Investments/InvestmentsContent.js';
import { HoldingsSection } from '../Investments/InvestmentsPage.js';
import { WealthContent, WealthEntitiesReadOnly, SummaryTile } from '../Wealth/WealthContent.js';
import { BudgetsContent } from '../Budgets/BudgetsContent.js';
import { OverviewTab as EnergyContent } from '../Energy/OverviewTab.js';
import { YearFilter as YearFilterControl } from '../../components/YearFilter.js';
import { MonthlyFlowChart } from '../../components/charts/MonthlyFlowChart.js';
import type { MonthlyFlowPoint } from '../../components/charts/MonthlyFlowChart.js';
import { NetWorthTrendChart } from '../../components/charts/NetWorthTrendChart.js';
import { BudgetCompositionChart } from '../../components/charts/BudgetCompositionChart.js';
import { UtilityCostChart } from '../../components/charts/UtilityCostChart.js';
import { MeterUsageBarChart } from '../../components/charts/MeterUsageBarChart.js';
import { ForecastChart } from '../../components/charts/ForecastChart.js';
import type { ForecastChartPoint } from '../../components/charts/ForecastChart.js';
import { UpcomingItemsLedger } from '../../components/charts/UpcomingItemsLedger.js';
import { SkeletonChart } from '../../components/Skeleton.js';
import { useMoneyFlow, useTransactionDateBounds } from '../../hooks/useAnalytics.js';
import { useNetWorthTrend, useWealthSummary } from '../../hooks/useWealth.js';
import { useAnnualBudgetProgress } from '../../hooks/useBudgets.js';
import { useEnergyReadings, useMeterUsageSeries, useUtilityCostSeries } from '../../hooks/useEnergy.js';
import { useForecast } from '../../hooks/useForecast.js';
import { useTheme } from '../../theme/ThemeProvider.js';
import type { Theme } from '../../theme/ThemeProvider.js';
import type { YearFilterValue } from '../../lib/yearFilter.js';
import { dateRangeForYear } from '../../lib/yearFilter.js';
import { BTN_PRIMARY } from '../../theme/tokens.js';

type ReportSectionKey = 'home' | 'accounts' | 'investments' | 'wealth' | 'budgets' | 'energy' | 'forecast';
type DetailMode = 'curated' | 'full';
type SectionVisibility = Record<ReportSectionKey, boolean>;

const REPORT_SECTIONS: { key: ReportSectionKey; label: string }[] = [
  { key: 'home', label: 'Home' },
  { key: 'accounts', label: 'Accounts' },
  { key: 'investments', label: 'Investments' },
  { key: 'wealth', label: 'Wealth' },
  { key: 'budgets', label: 'Budgets' },
  { key: 'energy', label: 'Energy' },
  { key: 'forecast', label: 'Forecast' },
];

function formatGeneratedDate(): string {
  return new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
}

function ReportHeader({ selectedYear }: { selectedYear: YearFilterValue }) {
  return (
    <div className="card-surface p-4">
      <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
        Life Manager Report — {selectedYear === 'all' ? 'All time' : selectedYear} — Generated {formatGeneratedDate()}
      </h1>
    </div>
  );
}

function ReportFilterPanel({
  selectedYear,
  onYearChange,
  earliestYear,
  visibility,
  onToggleSection,
  detailMode,
  onDetailModeChange,
  onPrint,
}: {
  selectedYear: YearFilterValue;
  onYearChange: (year: YearFilterValue) => void;
  earliestYear: number | undefined;
  visibility: SectionVisibility;
  onToggleSection: (key: ReportSectionKey) => void;
  detailMode: DetailMode;
  onDetailModeChange: (mode: DetailMode) => void;
  onPrint: () => void;
}) {
  return (
    <div className="card-surface print:hidden space-y-4 p-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <YearFilterControl selectedYear={selectedYear} onChange={onYearChange} earliestYear={earliestYear} />
        <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
          <input
            type="checkbox"
            checked={detailMode === 'full'}
            onChange={(e) => onDetailModeChange(e.target.checked ? 'full' : 'curated')}
          />
          Show full detail
        </label>
        <button type="button" onClick={onPrint} className={BTN_PRIMARY}>
          Print / Save as PDF
        </button>
      </div>
      <div className="flex flex-wrap gap-4">
        {REPORT_SECTIONS.map((section) => (
          <label key={section.key} className="flex items-center gap-1.5 text-sm text-slate-700 dark:text-slate-300">
            <input type="checkbox" checked={visibility[section.key]} onChange={() => onToggleSection(section.key)} />
            {section.label}
          </label>
        ))}
      </div>
    </div>
  );
}

function ReportSection({ title, isLast, children }: { title: string; isLast: boolean; children: ReactNode }) {
  return (
    <section className={`card-surface p-4 print:break-inside-avoid ${isLast ? '' : 'print:break-after-page'}`}>
      <h2 className="mb-3 text-lg font-semibold text-slate-900 dark:text-slate-100">{title}</h2>
      {children}
    </section>
  );
}

function ReportEmptyState() {
  return <p className="text-sm text-slate-500">No data for this period.</p>;
}

function ReportHomeCurated({ selectedYear }: { selectedYear: YearFilterValue }) {
  const { data: yearFlow, isPending, isError } = useMoneyFlow(dateRangeForYear(selectedYear));
  const monthlyBuckets = groupByMonth(yearFlow?.days ?? []);
  const monthlyPoints: MonthlyFlowPoint[] = monthlyBuckets.map((bucket) => ({
    month: `${MONTH_LABELS[bucket.monthIndex]} ${bucket.year}`,
    moneyIn: bucket.moneyIn,
    moneyOut: bucket.moneyOut,
    net: bucket.net,
  }));

  if (isPending) return <SkeletonChart className="h-56 w-full" />;
  if (isError) return <p className="text-sm text-red-600 dark:text-red-400">Failed to load money flow.</p>;
  if (!yearFlow || monthlyPoints.length === 0) return <ReportEmptyState />;

  return (
    <div className="space-y-4">
      <MonthlyFlowChart points={monthlyPoints} />
      <div className="grid grid-cols-3 gap-4">
        <MetricTile label="Money in" value={yearFlow.totals.moneyIn} tone="in" />
        <MetricTile label="Money out" value={yearFlow.totals.moneyOut} tone="out" />
        <MetricTile label="Net" value={yearFlow.totals.net} tone="net" />
      </div>
    </div>
  );
}

function ReportWealthCurated({ selectedYear }: { selectedYear: YearFilterValue }) {
  const { data: trend, isPending: isTrendPending, isError: isTrendError } = useNetWorthTrend();
  const { data: summary, isPending: isSummaryPending, isError: isSummaryError } = useWealthSummary();

  const { dateFrom, dateTo } = dateRangeForYear(selectedYear);
  const filteredTrend = trend?.filter(
    (p) => (dateFrom === undefined || p.date >= dateFrom) && (dateTo === undefined || p.date <= dateTo),
  );

  if (isTrendPending || isSummaryPending) return <SkeletonChart className="h-56 w-full" />;
  if (isTrendError || isSummaryError) {
    return <p className="text-sm text-red-600 dark:text-red-400">Failed to load wealth data.</p>;
  }
  if (!filteredTrend || filteredTrend.length === 0 || !summary) return <ReportEmptyState />;

  return (
    <div className="space-y-4">
      {filteredTrend.length > 1 ? (
        <NetWorthTrendChart points={filteredTrend} />
      ) : (
        <p className="text-sm text-slate-500">Not enough history yet to chart a trend.</p>
      )}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <SummaryTile
          label="Net wealth"
          value={summary.netWealth}
          tone={summary.netWealth >= 0 ? 'positive' : 'negative'}
        />
        <SummaryTile label="Liquid assets" value={summary.liquidAssets.total} tone="asset" />
        <SummaryTile label="Non-liquid assets" value={summary.nonLiquidAssets.total} tone="asset" />
        <SummaryTile label="Liabilities" value={summary.liabilitiesTotal} tone="negative" />
      </div>
    </div>
  );
}

function ReportBudgetsCurated({ selectedYear }: { selectedYear: YearFilterValue }) {
  const year = selectedYear === 'all' ? new Date().getFullYear() : selectedYear;
  const { data: progress, isPending, isError } = useAnnualBudgetProgress(year);

  if (isPending) return <SkeletonChart className="h-56 w-full" />;
  if (isError) return <p className="text-sm text-red-600 dark:text-red-400">Failed to load budget progress.</p>;
  if (!progress || progress.items.length === 0) return <ReportEmptyState />;

  return <BudgetCompositionChart items={progress.items} />;
}

function ReportEnergyCurated({ selectedYear }: { selectedYear: YearFilterValue }) {
  const year = selectedYear === 'all' ? undefined : selectedYear;
  const { data: readings } = useEnergyReadings();
  const { data: usageSeries, isPending: isUsagePending } = useMeterUsageSeries(year);
  const { data: costData, isPending: isCostPending, isError: isCostError } = useUtilityCostSeries(year);

  const meterUnits = new Map<MeterType, string>();
  for (const meterType of METER_TYPES) {
    const firstReading = readings?.find((r) => r.meterType === meterType);
    if (firstReading) meterUnits.set(meterType, meterType === 'water' ? 'm3' : firstReading.unit);
  }
  const metersWithData = METER_TYPES.filter((meterType) => meterUnits.has(meterType));
  const hasCost = (costData?.points.length ?? 0) > 0;
  const hasUsage = (usageSeries?.points.length ?? 0) > 0 && metersWithData.length > 0;

  if (isUsagePending || isCostPending) return <SkeletonChart className="h-56 w-full" />;
  if (isCostError) return <p className="text-sm text-red-600 dark:text-red-400">Failed to load energy data.</p>;
  if (!hasCost && !hasUsage) return <ReportEmptyState />;

  return (
    <div className="space-y-4">
      {costData && costData.points.length > 0 && <UtilityCostChart points={costData.points} />}
      {usageSeries && hasUsage && (
        <div className="grid gap-4 sm:grid-cols-3">
          {metersWithData.map((meterType) => (
            <div key={meterType}>
              <h3 className="mb-1 text-xs font-medium uppercase tracking-wide text-slate-500 capitalize">
                {meterType}
              </h3>
              <MeterUsageBarChart
                points={usageSeries.points.map((p) => ({ period: p.period, usage: p[meterType] }))}
                unit={meterUnits.get(meterType) as string}
                meterType={meterType}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ReportForecastSection() {
  const { data: forecast, isPending, isError } = useForecast({});

  if (isPending) return <SkeletonChart className="h-56 w-full" />;
  if (isError) return <p className="text-sm text-red-600 dark:text-red-400">Failed to load the forecast.</p>;
  if (!forecast) return <ReportEmptyState />;

  const chartPoints: ForecastChartPoint[] = forecast.points.map((p) => ({
    date: p.date,
    projected: p.projectedBalance,
  }));

  return (
    <div className="space-y-4">
      <ForecastChart points={chartPoints} projectedLowDate={forecast.projectedLow.date} />
      <UpcomingItemsLedger events={forecast.events} />
    </div>
  );
}

function ReportSectionBody({
  sectionKey,
  detailMode,
  selectedYear,
}: {
  sectionKey: ReportSectionKey;
  detailMode: DetailMode;
  selectedYear: YearFilterValue;
}) {
  if (sectionKey === 'forecast') return <ReportForecastSection />;

  if (detailMode === 'curated') {
    switch (sectionKey) {
      case 'home':
        return <ReportHomeCurated selectedYear={selectedYear} />;
      case 'accounts':
        return <CategorySpendingSection accountId={undefined} selectedYear={selectedYear} />;
      case 'investments':
        return <HoldingsSection selectedYear={selectedYear} />;
      case 'wealth':
        return <ReportWealthCurated selectedYear={selectedYear} />;
      case 'budgets':
        return <ReportBudgetsCurated selectedYear={selectedYear} />;
      case 'energy':
        return <ReportEnergyCurated selectedYear={selectedYear} />;
    }
  }

  switch (sectionKey) {
    case 'home':
      return <HomeContent selectedYear={selectedYear} />;
    case 'accounts':
      return <AccountsContent selectedYear={selectedYear} />;
    case 'investments':
      return <InvestmentsContent selectedYear={selectedYear} />;
    case 'wealth':
      return (
        <div className="space-y-4">
          <WealthContent selectedYear={selectedYear} />
          <WealthEntitiesReadOnly />
        </div>
      );
    case 'budgets':
      return <BudgetsContent selectedYear={selectedYear} />;
    case 'energy':
      return <EnergyContent selectedYear={selectedYear} />;
  }
  return null;
}

export function ReportPage() {
  const [selectedYear, setSelectedYear] = useState<YearFilterValue>(new Date().getFullYear());
  const [visibility, setVisibility] = useState<SectionVisibility>(
    () => Object.fromEntries(REPORT_SECTIONS.map((s) => [s.key, true])) as SectionVisibility,
  );
  const [detailMode, setDetailMode] = useState<DetailMode>('curated');
  const { data: dateBounds } = useTransactionDateBounds();
  const earliestYear = dateBounds?.earliestDate ? Number(dateBounds.earliestDate.slice(0, 4)) : undefined;
  const { theme, setTheme } = useTheme();
  const preprintThemeRef = useRef<Theme | null>(null);

  useEffect(() => {
    function handleAfterPrint() {
      if (preprintThemeRef.current !== null) {
        setTheme(preprintThemeRef.current);
        preprintThemeRef.current = null;
      }
    }
    window.addEventListener('afterprint', handleAfterPrint);
    return () => window.removeEventListener('afterprint', handleAfterPrint);
  }, [setTheme]);

  function handlePrintClick() {
    preprintThemeRef.current = theme;
    if (theme === 'dark') {
      setTheme('light');
      // One rAF is enough: React's passive effects (incl. ThemeProvider's <html> classList
      // mutation) flush before the browser's next paint/rAF callback, so by the time this
      // fires the `dark` class has already been removed from the DOM that window.print() reads.
      requestAnimationFrame(() => window.print());
    } else {
      window.print();
    }
  }

  const visibleSections = REPORT_SECTIONS.filter((s) => visibility[s.key]);

  return (
    <div className="space-y-4">
      <ReportHeader selectedYear={selectedYear} />
      <ReportFilterPanel
        selectedYear={selectedYear}
        onYearChange={setSelectedYear}
        earliestYear={earliestYear}
        visibility={visibility}
        onToggleSection={(key) => setVisibility((v) => ({ ...v, [key]: !v[key] }))}
        detailMode={detailMode}
        onDetailModeChange={setDetailMode}
        onPrint={handlePrintClick}
      />
      {visibleSections.map((section, idx) => (
        <ReportSection key={section.key} title={section.label} isLast={idx === visibleSections.length - 1}>
          <ReportSectionBody sectionKey={section.key} detailMode={detailMode} selectedYear={selectedYear} />
        </ReportSection>
      ))}
    </div>
  );
}
