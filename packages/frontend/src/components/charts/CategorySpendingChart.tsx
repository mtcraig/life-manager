import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { CategoryMonthSummaryRowDto } from '@life-manager/shared';
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

interface CategorySpendingChartProps {
  rows: CategoryMonthSummaryRowDto[];
}

const MAX_SERIES = MAX_CATEGORICAL_SERIES;
const OTHER_KEY = 'Other';

interface PivotedMonth {
  month: string;
  [categoryKey: string]: number | string;
}

function pivotByMonth(rows: CategoryMonthSummaryRowDto[]): { data: PivotedMonth[]; categoryKeys: string[] } {
  const totalByCategory = new Map<string, number>();
  for (const row of rows) {
    totalByCategory.set(row.categoryName, (totalByCategory.get(row.categoryName) ?? 0) + row.total);
  }
  const topCategories = [...totalByCategory.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, MAX_SERIES)
    .map(([name]) => name);
  const topCategorySet = new Set(topCategories);
  const hasOther = totalByCategory.size > topCategories.length;

  const byMonth = new Map<string, PivotedMonth>();
  for (const row of rows) {
    const point = byMonth.get(row.month) ?? { month: row.month };
    const key = topCategorySet.has(row.categoryName) ? row.categoryName : OTHER_KEY;
    point[key] = ((point[key] as number | undefined) ?? 0) + row.total;
    byMonth.set(row.month, point);
  }

  const data = [...byMonth.values()].sort((a, b) => a.month.localeCompare(b.month));
  const categoryKeys = hasOther ? [...topCategories, OTHER_KEY] : topCategories;
  return { data, categoryKeys };
}

/** Stacked bar, one segment per category, one bar per month. Categories beyond the top 15 (by total) fold into "Other". */
export function CategorySpendingChart({ rows }: CategorySpendingChartProps) {
  const colors = useChartColors();
  const { theme } = useTheme();
  const palette = theme === 'dark' ? CATEGORY_PALETTE_DARK : CATEGORY_PALETTE_LIGHT;
  const otherColor = theme === 'dark' ? OTHER_COLOR_DARK : OTHER_COLOR_LIGHT;
  const surface = theme === 'dark' ? '#0f172a' : '#ffffff'; // matches the card background each chart sits on

  const { data, categoryKeys } = pivotByMonth(rows);

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
          contentStyle={{ backgroundColor: colors.tooltipBg, border: `1px solid ${colors.tooltipBorder}`, fontSize: 11 }}
          itemStyle={{ color: colors.tooltipText, fontSize: 11, padding: 0 }}
          labelStyle={{ color: colors.tooltipText, fontSize: 11, marginBottom: 2 }}
        />
        <Legend wrapperStyle={{ fontSize: 12, color: colors.tick }} />
        {categoryKeys.map((key, i) => {
          const isLast = i === categoryKeys.length - 1;
          const fill = key === OTHER_KEY ? otherColor : palette[i % palette.length];
          return (
            <Bar
              key={key}
              dataKey={key}
              name={key}
              stackId="spend"
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
