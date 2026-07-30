import { INGESTION_EVENT_SOURCES, INGESTION_EVENT_STATUSES } from '../enums.js';

export interface IngestResultDto {
  status: (typeof INGESTION_EVENT_STATUSES)[number];
  fileName: string;
  rowsIngested: number;
  rowsSkipped: number;
  errorMessage: string | null;
}

/** Ingestion runs as a background job (see JobDto) so the frontend can show
 * progress instead of blocking on one long request; the completed job's
 * `resultJson` is an `IngestResultDto[]`. */
export interface IngestStartedDto {
  jobId: number;
}

export interface IngestionEventDto {
  id: number;
  accountId: number | null;
  source: (typeof INGESTION_EVENT_SOURCES)[number];
  fileName: string;
  status: (typeof INGESTION_EVENT_STATUSES)[number];
  rowsIngested: number;
  rowsSkipped: number;
  errorMessage: string | null;
  ranAt: string;
}
