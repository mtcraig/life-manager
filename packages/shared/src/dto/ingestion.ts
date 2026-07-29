import { INGESTION_EVENT_SOURCES, INGESTION_EVENT_STATUSES } from '../enums.js';

export interface IngestResultDto {
  status: (typeof INGESTION_EVENT_STATUSES)[number];
  fileName: string;
  rowsIngested: number;
  rowsSkipped: number;
  errorMessage: string | null;
}

export interface IngestionEventDto {
  id: number;
  accountId: number | null;
  source: (typeof INGESTION_EVENT_SOURCES)[number];
  fileName: string;
  status: (typeof INGESTION_EVENT_STATUSES)[number];
  rowsIngested: number;
  errorMessage: string | null;
  ranAt: string;
}
