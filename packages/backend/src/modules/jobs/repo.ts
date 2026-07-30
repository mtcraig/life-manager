import { eq } from 'drizzle-orm';
import type { JobKind, JobStatus } from '@life-manager/shared';
import { db } from '../../db/client';
import { backgroundJobs } from '../../db/schema/jobs';

export interface JobRow {
  id: number;
  kind: string;
  status: string;
  total: number;
  processed: number;
  resultJson: string | null;
  errorMessage: string | null;
  createdAt: number;
  updatedAt: number;
}

export function createJob(kind: JobKind, total: number): JobRow {
  const now = Date.now();
  return db
    .insert(backgroundJobs)
    .values({ kind, status: 'running' satisfies JobStatus, total, processed: 0, createdAt: now, updatedAt: now })
    .returning()
    .get();
}

export function updateProgress(id: number, processed: number): void {
  db.update(backgroundJobs).set({ processed, updatedAt: Date.now() }).where(eq(backgroundJobs.id, id)).run();
}

export function completeJob(id: number, resultJson: string): void {
  db.update(backgroundJobs)
    .set({ status: 'completed' satisfies JobStatus, resultJson, updatedAt: Date.now() })
    .where(eq(backgroundJobs.id, id))
    .run();
}

export function failJob(id: number, errorMessage: string): void {
  db.update(backgroundJobs)
    .set({ status: 'failed' satisfies JobStatus, errorMessage, updatedAt: Date.now() })
    .where(eq(backgroundJobs.id, id))
    .run();
}

export function getJobById(id: number): JobRow | undefined {
  return db.select().from(backgroundJobs).where(eq(backgroundJobs.id, id)).get();
}
