export const JOB_KINDS = ['ingest', 'recategorise'] as const;
export type JobKind = (typeof JOB_KINDS)[number];

export const JOB_STATUSES = ['running', 'completed', 'failed'] as const;
export type JobStatus = (typeof JOB_STATUSES)[number];

/**
 * Tracks a long-running server-side operation (CSV ingestion, rule
 * re-categorisation) that the frontend polls for progress instead of
 * blocking on a single request/response. `resultJson` carries the kind-specific
 * payload (an `IngestResultDto[]` for `ingest`, `{ updated: number }` for
 * `recategorise`) once `status` is `completed` — parsed by the frontend based
 * on `kind`, not typed further here since it varies per kind.
 */
export interface JobDto {
  id: number;
  kind: JobKind;
  status: JobStatus;
  total: number;
  processed: number;
  resultJson: string | null;
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
}
