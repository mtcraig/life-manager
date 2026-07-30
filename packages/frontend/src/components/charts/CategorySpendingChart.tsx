import { Bar, BarChart, CartesianGrid, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { CategorySummaryRowDto } from '@life-manager/shared';
import { formatMoney } from '../../lib/formatMoney.js';
import { useChartColors } from '../../theme/useChartColors.js';

interface CategorySpendingChartProps {
  rows: CategorySummaryRowDto[];
}

const SPENDING_HUE = '#dc2626'; // red-600 — matches the app's existing money-out convention

/** Horizontal bar, sorted descending — a single series needs no legend; category names on the axis already carry identity. */
export function CategorySpendingChart({ rows }: CategorySpendingChartProps) {
  const colors = useChartColors();
  const height = Math.max(120, rows.length * 36 + 32);

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={rows} layout="vertical" margin={{ top: 8, right: 48, bottom: 8, left: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} horizontal={false} />
        <XAxis
          type="number"
          tickFormatter={(value: number) => formatMoney(value)}
          tick={{ fontSize: 12, fill: colors.tick }}
        />
        <YAxis
          type="category"
          dataKey="categoryName"
          tick={{ fontSize: 12, fill: colors.tick }}
          width={110}
        />
        <Tooltip
          formatter={(value: number) => formatMoney(value)}
          contentStyle={{ backgroundColor: colors.tooltipBg, border: `1px solid ${colors.tooltipBorder}` }}
          itemStyle={{ color: colors.tooltipText }}
          labelStyle={{ color: colors.tooltipText }}
        />
        <Bar dataKey="total" fill={SPENDING_HUE} radius={[0, 4, 4, 0]} maxBarSize={24}>
          <LabelList
            dataKey="total"
            position="right"
            formatter={(value: number) => formatMoney(value)}
            fill={colors.tick}
            fontSize={12}
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
