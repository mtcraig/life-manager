import { useTheme } from './ThemeProvider.js';

/**
 * Recharts sets colors via inline SVG props (stroke/fill), which Tailwind's
 * `dark:` classes can't reach — chart components need these as plain values.
 */
export function useChartColors() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return {
    grid: isDark ? '#334155' : '#e2e8f0', // slate-700 / slate-200
    line: isDark ? '#e2e8f0' : '#0f172a', // slate-200 / slate-900
    tick: isDark ? '#94a3b8' : '#64748b', // slate-400 / slate-500
    tooltipBg: isDark ? '#1e293b' : '#ffffff', // slate-800 / white
    tooltipBorder: isDark ? '#334155' : '#e2e8f0', // slate-700 / slate-200
    tooltipText: isDark ? '#f1f5f9' : '#0f172a', // slate-100 / slate-900
  };
}
