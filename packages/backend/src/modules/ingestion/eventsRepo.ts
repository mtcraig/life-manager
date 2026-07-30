import { desc } from 'drizzle-orm';
import { db } from '../../db/client';
import { ingestionEvents } from '../../db/schema/ingestion-events';

export interface IngestionEventRow {
  id: number;
  accountId: number | null;
  source: string;
  fileName: string;
  status: string;
  rowsIngested: number;
  rowsSkipped: number;
  errorMessage: string | null;
  ranAt: number;
}

export function listRecentIngestionEvents(limit = 50): IngestionEventRow[] {
  return db.select().from(ingestionEvents).orderBy(desc(ingestionEvents.ranAt)).limit(limit).all();
}
