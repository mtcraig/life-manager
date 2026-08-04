import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { UtilityCostPointDto } from '@life-manager/shared';
import { formatMoney } from '../../lib/formatMoney.js';
import { useChartColors } from '../../theme/useChartColors.js';
import { useTheme } from '../../theme/ThemeProvider.js';
import { CATEGORY_PALETTE_DARK, CATEGORY_PALETTE_LIGHT } from '../../theme/categoricalPalette.js';

interface UtilityCostChartProps {
  points: UtilityCostPointDto[];
}

const METER_COLOR_SLOT = {
  electricity: 0,
  gas: 1,
  water: 2,
} as const;

export function UtilityCostChart({ points }: UtilityCostChartProps) {
  const colors = useChartColors();
  const { theme } = useTheme();
  const palette = theme === 'dark' ? CATEGORY_PALETTE_DARK : CATEGORY_PALETTE_LIGHT;

  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={points} margin={{ top: 8, right: 16, bottom: 8, left: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} />
        <XAxis dataKey="period" tick={{ fontSize: 12, fill: colors.tick }} />
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
        <Line
          type="monotone"
          dataKey="electricity"
          name="Electricity"
          stroke={palette[METER_COLOR_SLOT.electricity]}
          dot={false}
          strokeWidth={2}
        />
        <Line
          type="monotone"
          dataKey="gas"
          name="Gas"
          stroke={palette[METER_COLOR_SLOT.gas]}
          dot={false}
          strokeWidth={2}
        />
        <Line
          type="monotone"
          dataKey="water"
          name="Water"
          stroke={palette[METER_COLOR_SLOT.water]}
          dot={false}
          strokeWidth={2}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
