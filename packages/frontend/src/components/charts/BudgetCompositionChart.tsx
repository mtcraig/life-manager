import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import type { BudgetProgressItemDto } from '@life-manager/shared';
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

const OTHER_KEY = 'Other';

/** Sorted by actual spend descending; categories beyond the palette's size fold into "Other" — same idiom CategorySpendingChart uses. */
function foldIntoTopCategories(items: BudgetProgressItemDto[]): { name: string; value: number }[] {
  const sorted = [...items].filter((item) => item.actual > 0).sort((a, b) => b.actual - a.actual);
  const top = sorted.slice(0, MAX_CATEGORICAL_SERIES);
  const rest = sorted.slice(MAX_CATEGORICAL_SERIES);

  const result = top.map((item) => ({ name: item.categoryName, value: item.actual }));
  if (rest.length > 0) {
    result.push({ name: OTHER_KEY, value: rest.reduce((sum, item) => sum + item.actual, 0) });
  }
  return result;
}

/** Composition of the selected month's actual spend by budgeted category. */
export function BudgetCompositionChart({ items }: { items: BudgetProgressItemDto[] }) {
  const colors = useChartColors();
  const { theme } = useTheme();
  const palette = theme === 'dark' ? CATEGORY_PALETTE_DARK : CATEGORY_PALETTE_LIGHT;
  const otherColor = theme === 'dark' ? OTHER_COLOR_DARK : OTHER_COLOR_LIGHT;
  const surface = theme === 'dark' ? '#0f172a' : '#ffffff';

  const data = foldIntoTopCategories(items);

  if (data.length === 0) {
    return <p className="text-sm text-slate-500">No spend recorded yet this month.</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" innerRadius={60} outerRadius={100} paddingAngle={2}>
          {data.map((entry, i) => (
            <Cell
              key={entry.name}
              fill={entry.name === OTHER_KEY ? otherColor : palette[i % palette.length]}
              stroke={surface}
              strokeWidth={2}
            />
          ))}
        </Pie>
        <Tooltip
          formatter={(value: number) => formatMoney(value)}
          contentStyle={{ backgroundColor: colors.tooltipBg, border: `1px solid ${colors.tooltipBorder}`, fontSize: 11 }}
          itemStyle={{ color: colors.tooltipText, fontSize: 11, padding: 0 }}
          labelStyle={{ color: colors.tooltipText, fontSize: 11 }}
        />
        <Legend wrapperStyle={{ fontSize: 12, color: colors.tick }} />
      </PieChart>
    </ResponsiveContainer>
  );
}
