import type { AccountDto, AccountMutationResultDto, CreateAccountInput, UpdateAccountInput } from '@life-manager/shared';
import { HttpError } from '../../lib/httpError';
import { syncWatchers } from '../ingestion/watcher';
import { prepareIngestPlan, runIngestJob } from '../ingestion/ingestService';
import * as jobsRepo from '../jobs/repo';
import * as repo from './repo';
import type { AccountRow } from './repo';

function toDto(row: AccountRow): AccountDto {
  return {
    id: row.id,
    name: row.name,
    type: row.type as AccountDto['type'],
    institution: row.institution,
    ingestionMode: row.ingestionMode as AccountDto['ingestionMode'],
    folderPath: row.folderPath,
    columnMapping: row.columnMapping as AccountDto['columnMapping'],
    createdAt: new Date(row.createdAt).toISOString(),
    updatedAt: new Date(row.updatedAt).toISOString(),
  };
}

export function listAccounts(): AccountDto[] {
  return repo.listAccounts().map(toDto);
}

export function getAccount(id: number): AccountDto {
  const row = repo.getAccountById(id);
  if (!row) {
    throw new HttpError(404, `Account ${id} not found`);
  }
  return toDto(row);
}

/**
 * Kicks off an initial ingest for a freshly-configured folder+mapping, using the same
 * job pattern as the manual "Ingest now" button. Without this, a watched folder's
 * pre-existing files are never picked up — chokidar's `ignoreInitial: true` (see
 * ingestion/watcher.ts) only fires on files that land *after* the watcher starts.
 */
function triggerInitialIngest(accountId: number): number | null {
  const account = repo.getAccountById(accountId);
  if (!account?.folderPath || !account.columnMapping) return null;

  const plan = prepareIngestPlan(accountId, 'watch');
  const job = jobsRepo.createJob('ingest', plan.totalNewRows);
  runIngestJob(job.id, plan).catch((error) => {
    jobsRepo.failJob(job.id, error instanceof Error ? error.message : String(error));
  });
  return job.id;
}

/**
 * Startup catch-up: ingests every currently-present file in each watched-folder
 * account's folder once at boot, since chokidar's ignoreInitial:true (see
 * ingestion/watcher.ts) never picks up files that were already there before the
 * watcher started. Dedupe-hash checking in prepareIngestPlan makes redundant
 * re-scans harmless, so this runs unconditionally on every boot.
 */
export function triggerCatchUpIngestForWatchedAccounts(): void {
  for (const account of repo.listAccounts()) {
    if (account.ingestionMode === 'watched' && account.folderPath) {
      triggerInitialIngest(account.id);
    }
  }
}

export function createAccount(input: CreateAccountInput): AccountMutationResultDto {
  try {
    const row = repo.insertAccount({
      name: input.name,
      type: input.type,
      institution: input.institution ?? null,
      ingestionMode: input.ingestionMode,
      folderPath: input.folderPath ?? null,
      columnMapping: input.columnMapping ?? null,
    });
    syncWatchers();
    const ingestJobId = triggerInitialIngest(row.id);
    return { ...toDto(row), ingestJobId };
  } catch (error) {
    if (error instanceof Error && error.message.includes('UNIQUE constraint failed')) {
      throw new HttpError(409, `An account named "${input.name}" already exists`);
    }
    throw error;
  }
}

export function updateAccount(id: number, input: UpdateAccountInput): AccountMutationResultDto {
  if (!repo.getAccountById(id)) {
    throw new HttpError(404, `Account ${id} not found`);
  }

  const row = repo.updateAccount(id, {
    ...(input.name !== undefined && { name: input.name }),
    ...(input.type !== undefined && { type: input.type }),
    ...(input.institution !== undefined && { institution: input.institution ?? null }),
    ...(input.ingestionMode !== undefined && { ingestionMode: input.ingestionMode }),
    ...(input.folderPath !== undefined && { folderPath: input.folderPath ?? null }),
    ...(input.columnMapping !== undefined && { columnMapping: input.columnMapping ?? null }),
  });
  syncWatchers();
  // Only re-ingest when the folder itself was just set/changed — not on every unrelated edit
  // (e.g. renaming), since that would re-scan the whole folder for no reason (dedupe makes it
  // harmless, just wasteful).
  const ingestJobId = input.folderPath !== undefined ? triggerInitialIngest(id) : null;
  return { ...toDto(row as NonNullable<typeof row>), ingestJobId };
}

export function deleteAccount(id: number): void {
  if (!repo.getAccountById(id)) {
    throw new HttpError(404, `Account ${id} not found`);
  }
  repo.deleteAccount(id);
  syncWatchers();
}
