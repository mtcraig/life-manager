import { useShutdown } from '../../hooks/useSystem.js';

function PowerIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4">
      <path strokeLinecap="round" d="M12 3v8" />
      <path strokeLinecap="round" d="M7 5.5a8 8 0 1 0 10 0" />
    </svg>
  );
}

export function ExitButton() {
  const shutdown = useShutdown();

  // The packaged desktop app's sole quit path is closing its window; this
  // button (and start.bat's server-restart model) only applies to the
  // source-checkout dev workflow.
  if (window.electron?.isElectron) return null;

  function handleExit() {
    const confirmed = window.confirm(
      'Stop the backend and frontend servers? ' +
        "You'll need to re-run start.bat to use the app again.",
    );
    if (!confirmed) return;
    shutdown.mutate();
  }

  return (
    <button
      onClick={handleExit}
      disabled={shutdown.isPending}
      aria-label="Exit"
      title="Stop the servers"
      className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50 dark:text-red-400 dark:hover:bg-red-950"
    >
      <PowerIcon />
      {shutdown.isPending ? 'Shutting down…' : 'Exit'}
    </button>
  );
}
