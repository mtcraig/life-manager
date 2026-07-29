import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { ValuationDto } from '@life-manager/shared';
import { formatMoney } from '../../lib/formatMoney.js';

interface ValuationTrendChartProps {
  valuations: ValuationDto[];
}

export function ValuationTrendChart({ valuations }: ValuationTrendChartProps) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={valuations} margin={{ top: 8, right: 16, bottom: 8, left: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis dataKey="asOfDate" tick={{ fontSize: 12 }} minTickGap={40} />
        <YAxis tickFormatter={(value: number) => formatMoney(value)} tick={{ fontSize: 12 }} width={90} />
        <Tooltip
          formatter={(value: number) => formatMoney(value)}
          labelFormatter={(label: string) => label}
        />
        <Line type="monotone" dataKey="value" stroke="#0f172a" dot={{ r: 3 }} strokeWidth={2} />
      </LineChart>
    </ResponsiveContainer>
  );
}
