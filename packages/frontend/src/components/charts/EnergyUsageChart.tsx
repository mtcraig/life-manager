import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { EnergyReadingDto } from '@life-manager/shared';

interface EnergyUsageChartProps {
  readings: EnergyReadingDto[];
  unit: string;
}

export function EnergyUsageChart({ readings, unit }: EnergyUsageChartProps) {
  const sorted = [...readings].sort((a, b) => a.readingDate.localeCompare(b.readingDate));

  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={sorted} margin={{ top: 8, right: 16, bottom: 8, left: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis dataKey="readingDate" tick={{ fontSize: 12 }} minTickGap={40} />
        <YAxis tickFormatter={(value: number) => `${value} ${unit}`} tick={{ fontSize: 12 }} width={80} />
        <Tooltip formatter={(value: number) => `${value} ${unit}`} labelFormatter={(label: string) => label} />
        <Line type="monotone" dataKey="value" stroke="#0f172a" dot={{ r: 3 }} strokeWidth={2} />
      </LineChart>
    </ResponsiveContainer>
  );
}
