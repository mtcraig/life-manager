import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { HoldingsMonthRowDto } from '@life-manager/shared';
import { formatMoney } from '../../lib/formatMoney.js';
import { useChartColors } from '../../theme/useChartColors.js';
import { useTheme } from '../../theme/ThemeProvider.js';
import {
  CATEGORY_PALETTE_DARK,
  CATEGORY_PALETTE_LIGHT,
  MAX_CATEGORICAL_SERIES,
  OTHER_COLOR_DARK,
  OTHER_COLOR_LIGHT,
} from '../../theme/categoricalPalette.js';

interface HoldingsByMonthChartProps {
  rows: HoldingsMonthRowDto[];
}

const OTHER_KEY = 'Other';

interface PivotedMonth {
  month: string;
  [investmentKey: string]: number | string;
}

function pivotByMonth(rows: HoldingsMonthRowDto[]): { data: PivotedMonth[]; investmentKeys: string[] } {
  const latestByInvestment = new Map<string, number>();
  for (const row of rows) {
    latestByInvestment.set(row.investmentName, row.value);
  }
  const topInvestments = [...latestByInvestment.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, MAX_CATEGORICAL_SERIES)
    .map(([name]) => name);
  const topInvestmentSet = new Set(topInvestments);
  const hasOther = latestByInvestment.size > topInvestments.length;

  const byMonth = new Map<string, PivotedMonth>();
  for (const row of rows) {
    const point = byMonth.get(row.month) ?? { month: row.month };
    const key = topInvestmentSet.has(row.investmentName) ? row.investmentName : OTHER_KEY;
    point[key] = ((point[key] as number | undefined) ?? 0) + row.value;
    byMonth.set(row.month, point);
  }

  const data = [...byMonth.values()].sort((a, b) => a.month.localeCompare(b.month));
  const investmentKeys = hasOther ? [...topInvestments, OTHER_KEY] : topInvestments;
  return { data, investmentKeys };
}

/**
 * Stacked bar, one segment per investment, one bar per month — mirrors
 * CategorySpendingChart's pivot-by-month + validated-palette approach, but
 * ranked by each investment's most recent value (not summed spend) since
 * holdings are forward-filled snapshots, not additive flows.
 */
export function HoldingsByMonthChart({ rows }: HoldingsByMonthChartProps) {
  const colors = useChartColors();
  const { theme } = useTheme();
  const palette = theme === 'dark' ? CATEGORY_PALETTE_DARK : CATEGORY_PALETTE_LIGHT;
  const otherColor = theme === 'dark' ? OTHER_COLOR_DARK : OTHER_COLOR_LIGHT;
  const surface = theme === 'dark' ? '#0f172a' : '#ffffff';

  const { data, investmentKeys } = pivotByMonth(rows);

  return (
    <ResponsiveContainer width="100%" height={320}>
      <BarChart data={data} margin={{ top: 8, right: 16, bottom: 8, left: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} vertical={false} />
        <XAxis dataKey="month" tick={{ fontSize: 12, fill: colors.tick }} />
        <YAxis
          tickFormatter={(value: number) => formatMoney(value)}
          tick={{ fontSize: 12, fill: colors.tick }}
          width={90}
        />
        <Tooltip
          formatter={(value: number) => formatMoney(value)}
          contentStyle={{ backgroundColor: colors.tooltipBg, border: `1px solid ${colors.tooltipBorder}` }}
          itemStyle={{ color: colors.tooltipText }}
          labelStyle={{ color: colors.tooltipText }}
        />
        <Legend wrapperStyle={{ fontSize: 12, color: colors.tick }} />
        {investmentKeys.map((key, i) => {
          const isLast = i === investmentKeys.length - 1;
          const fill = key === OTHER_KEY ? otherColor : palette[i % palette.length];
          return (
            <Bar
              key={key}
              dataKey={key}
              name={key}
              stackId="holdings"
              fill={fill}
              stroke={surface}
              strokeWidth={2}
              maxBarSize={40}
              radius={isLast ? [4, 4, 0, 0] : 0}
            />
          );
        })}
      </BarChart>
    </ResponsiveContainer>
  );
}
