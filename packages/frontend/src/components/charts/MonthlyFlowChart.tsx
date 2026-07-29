import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { formatMoney } from '../../lib/formatMoney.js';
import { useChartColors } from '../../theme/useChartColors.js';

export interface MonthlyFlowPoint {
  month: string; // YYYY-MM
  moneyIn: number;
  moneyOut: number;
  net: number;
}

interface MonthlyFlowChartProps {
  points: MonthlyFlowPoint[];
}

export function MonthlyFlowChart({ points }: MonthlyFlowChartProps) {
  const colors = useChartColors();

  return (
    <ResponsiveContainer width="100%" height={280}>
      <ComposedChart data={points} margin={{ top: 8, right: 16, bottom: 8, left: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} />
        <XAxis dataKey="month" tick={{ fontSize: 12, fill: colors.tick }} />
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
        <Bar dataKey="moneyIn" name="Money in" fill="#16a34a" />
        <Bar dataKey="moneyOut" name="Money out" fill="#dc2626" />
        <Line type="monotone" dataKey="net" name="Net" stroke={colors.line} dot={false} strokeWidth={2} />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
