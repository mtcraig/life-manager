import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { BalanceTrendPointDto } from '@life-manager/shared';
import { formatMoney } from '../../lib/formatMoney.js';
import { useChartColors } from '../../theme/useChartColors.js';

interface BalanceTrendChartProps {
  points: BalanceTrendPointDto[];
}

export function BalanceTrendChart({ points }: BalanceTrendChartProps) {
  const colors = useChartColors();

  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={points} margin={{ top: 8, right: 16, bottom: 8, left: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} />
        <XAxis dataKey="date" tick={{ fontSize: 12, fill: colors.tick }} minTickGap={40} />
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
        <Line type="monotone" dataKey="balance" stroke={colors.line} dot={false} strokeWidth={2} />
      </LineChart>
    </ResponsiveContainer>
  );
}
