import { useServerStatus } from '../../hooks/useSystem.js';

export function ServerStatus() {
  const { status } = useServerStatus();

  const dotColor =
    status === 'success' ? 'bg-green-500' : status === 'error' ? 'bg-red-500' : 'bg-slate-400';
  const label =
    status === 'success' ? 'Servers online' : status === 'error' ? 'Servers offline' : 'Checking…';

  return (
    <div className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-400">
      <span className={`h-2 w-2 shrink-0 rounded-full ${dotColor}`} />
      {label}
    </div>
  );
}
