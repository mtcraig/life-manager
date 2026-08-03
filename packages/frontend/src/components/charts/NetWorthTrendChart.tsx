import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { NetWorthTrendPointDto } from '@life-manager/shared';
import { formatMoney } from '../../lib/formatMoney.js';
import { useChartColors } from '../../theme/useChartColors.js';

interface NetWorthTrendChartProps {
  points: NetWorthTrendPointDto[];
}

export function NetWorthTrendChart({ points }: NetWorthTrendChartProps) {
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
          contentStyle={{ backgroundColor: colors.tooltipBg, border: `1px solid ${colors.tooltipBorder}`, fontSize: 11 }}
          itemStyle={{ color: colors.tooltipText, fontSize: 11 }}
          labelStyle={{ color: colors.tooltipText, fontSize: 11 }}
        />
        <Line type="monotone" dataKey="netWorth" name="Net worth" stroke={colors.line} dot={false} strokeWidth={2} />
      </LineChart>
    </ResponsiveContainer>
  );
}
