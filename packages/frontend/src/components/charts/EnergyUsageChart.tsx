import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { EnergyReadingDto } from '@life-manager/shared';
import { useChartColors } from '../../theme/useChartColors.js';

interface EnergyUsageChartProps {
  readings: EnergyReadingDto[];
  unit: string;
}

export function EnergyUsageChart({ readings, unit }: EnergyUsageChartProps) {
  const colors = useChartColors();
  const sorted = [...readings].sort((a, b) => a.readingDate.localeCompare(b.readingDate));

  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={sorted} margin={{ top: 8, right: 16, bottom: 8, left: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} />
        <XAxis dataKey="readingDate" tick={{ fontSize: 12, fill: colors.tick }} minTickGap={40} />
        <YAxis
          tickFormatter={(value: number) => `${value} ${unit}`}
          tick={{ fontSize: 12, fill: colors.tick }}
          width={80}
        />
        <Tooltip
          formatter={(value: number) => `${value} ${unit}`}
          labelFormatter={(label: string) => label}
          contentStyle={{ backgroundColor: colors.tooltipBg, border: `1px solid ${colors.tooltipBorder}` }}
          itemStyle={{ color: colors.tooltipText }}
          labelStyle={{ color: colors.tooltipText }}
        />
        <Line type="monotone" dataKey="value" stroke={colors.line} dot={false} strokeWidth={2} />
      </LineChart>
    </ResponsiveContainer>
  );
}
