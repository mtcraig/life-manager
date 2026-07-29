import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { ValuationDto } from '@life-manager/shared';
import { formatMoney } from '../../lib/formatMoney.js';
import { useChartColors } from '../../theme/useChartColors.js';

interface ValuationTrendChartProps {
  valuations: ValuationDto[];
}

export function ValuationTrendChart({ valuations }: ValuationTrendChartProps) {
  const colors = useChartColors();

  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={valuations} margin={{ top: 8, right: 16, bottom: 8, left: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} />
        <XAxis dataKey="asOfDate" tick={{ fontSize: 12, fill: colors.tick }} minTickGap={40} />
        <YAxis
          tickFormatter={(value: number) => formatMoney(value)}
          tick={{ fontSize: 12, fill: colors.tick }}
          width={90}
        />
        <Tooltip
          formatter={(value: number) => formatMoney(value)}
          labelFormatter={(label: string) => label}
          contentStyle={{ backgroundColor: colors.tooltipBg, border: `1px solid ${colors.tooltipBorder}` }}
          itemStyle={{ color: colors.tooltipText }}
          labelStyle={{ color: colors.tooltipText }}
        />
        <Line type="monotone" dataKey="value" stroke={colors.line} dot={{ r: 3 }} strokeWidth={2} />
      </LineChart>
    </ResponsiveContainer>
  );
}
