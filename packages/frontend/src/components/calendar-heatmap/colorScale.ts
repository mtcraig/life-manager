/** Shared green/red intensity scale for calendar-heatmap-style grids, based on magnitude relative to maxAbs. */
export function colorForValue(value: number, maxAbs: number): string {
  if (value === 0 || maxAbs === 0) return 'bg-slate-100 dark:bg-slate-800';
  const intensity = Math.min(1, Math.abs(value) / maxAbs);
  if (value > 0) {
    if (intensity > 0.66) return 'bg-green-600 dark:bg-green-500';
    if (intensity > 0.33) return 'bg-green-400 dark:bg-green-700';
    return 'bg-green-200 dark:bg-green-900';
  }
  if (intensity > 0.66) return 'bg-red-600 dark:bg-red-500';
  if (intensity > 0.33) return 'bg-red-400 dark:bg-red-700';
  return 'bg-red-200 dark:bg-red-900';
}
