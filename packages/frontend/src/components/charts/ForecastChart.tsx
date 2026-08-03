import { CartesianGrid, ComposedChart, Line, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { formatMoney } from '../../lib/formatMoney.js';
import { useChartColors } from '../../theme/useChartColors.js';

export interface ForecastChartPoint {
  date: string;
  actual?: number;
  projected?: number;
}

interface ForecastChartProps {
  points: ForecastChartPoint[];
  projectedLowDate: string;
}

/** Solid = actual history, dashed = projected forward from today. */
export function ForecastChart({ points, projectedLowDate }: ForecastChartProps) {
  const colors = useChartColors();

  return (
    <ResponsiveContainer width="100%" height={280}>
      <ComposedChart data={points} margin={{ top: 8, right: 16, bottom: 8, left: 8 }}>
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
        <ReferenceLine x={projectedLowDate} stroke={colors.tick} strokeDasharray="2 2" />
        <Line
          type="monotone"
          dataKey="actual"
          name="Actual"
          stroke={colors.line}
          dot={false}
          strokeWidth={2}
          connectNulls={false}
        />
        <Line
          type="monotone"
          dataKey="projected"
          name="Projected"
          stroke={colors.line}
          strokeDasharray="5 4"
          dot={false}
          strokeWidth={2}
          connectNulls={false}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
