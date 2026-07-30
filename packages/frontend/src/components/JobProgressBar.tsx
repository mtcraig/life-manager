import { useJob } from '../hooks/useJobs.js';

const KIND_LABELS: Record<string, string> = {
  ingest: 'Ingesting',
  recategorise: 'Applying rules to existing transactions',
};

export function JobProgressBar({ jobId }: { jobId: number | null }) {
  const { data: job } = useJob(jobId);

  if (!job || job.status !== 'running') return null;

  const pct = job.total > 0 ? Math.min(100, Math.round((job.processed / job.total) * 100)) : 100;

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
        <span>{KIND_LABELS[job.kind] ?? 'Working'}…</span>
        <span>
          {job.processed} / {job.total}
        </span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
        <div
          className="h-full rounded-full bg-slate-900 transition-[width] dark:bg-slate-100"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
