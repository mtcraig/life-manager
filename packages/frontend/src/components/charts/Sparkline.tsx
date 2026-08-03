import { useId } from 'react';
import type { BalanceTrendPointDto } from '@life-manager/shared';

const WINDOW_MONTHS = 12;

/** A visual indicator, not a history — trims to the trailing 12 months of the series. */
function lastMonthsOf(points: BalanceTrendPointDto[], months: number): BalanceTrendPointDto[] {
  if (points.length === 0) return points;
  const cutoff = new Date(points[points.length - 1]!.date);
  cutoff.setMonth(cutoff.getMonth() - months);
  const cutoffIso = cutoff.toISOString().slice(0, 10);
  return points.filter((p) => p.date >= cutoffIso);
}

/** Small inline trend preview — sits inside a balance card, not a full analytical chart. */
export function Sparkline({
  points: allPoints,
  width = 96,
  height = 32,
}: {
  points: BalanceTrendPointDto[];
  width?: number;
  height?: number;
}) {
  const gradientId = useId();
  const points = lastMonthsOf(allPoints, WINDOW_MONTHS);

  if (points.length < 2) return null;

  const values = points.map((p) => p.balance);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const stepX = width / (points.length - 1);

  const coords = values.map((v, i) => [i * stepX, height - ((v - min) / range) * height] as const);
  const linePath = coords.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
  const areaPath = `${linePath} L${width},${height} L0,${height} Z`;
  const [lastX, lastY] = coords[coords.length - 1]!;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className="shrink-0 overflow-visible"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--flair-1)" stopOpacity="0.35" />
          <stop offset="100%" stopColor="var(--flair-1)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#${gradientId})`} />
      <path d={linePath} fill="none" stroke="var(--flair-1)" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={lastX} cy={lastY} r={2.5} fill="var(--flair-1)" />
    </svg>
  );
}
