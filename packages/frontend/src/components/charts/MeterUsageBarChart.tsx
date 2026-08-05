import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { MeterType } from '@life-manager/shared';
import { useChartColors } from '../../theme/useChartColors.js';
import { useTheme } from '../../theme/ThemeProvider.js';
import { CATEGORY_PALETTE_DARK, CATEGORY_PALETTE_LIGHT } from '../../theme/categoricalPalette.js';

export interface MeterUsageBarPoint {
  period: string;
  usage: number;
}

interface MeterUsageBarChartProps {
  points: MeterUsageBarPoint[];
  unit: string;
  meterType: MeterType;
}

const METER_COLOR_SLOT: Record<MeterType, number> = {
  electricity: 0,
  gas: 1,
  water: 2,
};

export function MeterUsageBarChart({ points, unit, meterType }: MeterUsageBarChartProps) {
  const colors = useChartColors();
  const { theme } = useTheme();
  const palette = theme === 'dark' ? CATEGORY_PALETTE_DARK : CATEGORY_PALETTE_LIGHT;
  const barColor = palette[METER_COLOR_SLOT[meterType]];

  return (
    <ResponsiveContainer width="100%" height={140}>
      <BarChart data={points} margin={{ top: 8, right: 16, bottom: 8, left: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} />
        <XAxis dataKey="period" tick={{ fontSize: 12, fill: colors.tick }} />
        <YAxis
          tickFormatter={(value: number) => `${value} ${unit}`}
          tick={{ fontSize: 12, fill: colors.tick }}
          width={80}
        />
        <Tooltip
          formatter={(value: number) => `${value} ${unit}`}
          contentStyle={{ backgroundColor: colors.tooltipBg, border: `1px solid ${colors.tooltipBorder}` }}
          itemStyle={{ color: colors.tooltipText }}
          labelStyle={{ color: colors.tooltipText }}
        />
        <Bar dataKey="usage" name="Usage" fill={barColor} />
      </BarChart>
    </ResponsiveContainer>
  );
}
