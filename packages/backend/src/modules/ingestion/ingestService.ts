import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { readCsvFileWithEncodingFallback } from './encoding';
import type {
  AccountType,
  ColumnMapping,
  IngestResultDto,
  IngestionEventSource,
  IngestionEventStatus,
} from '@life-manager/shared';
import { db } from '../../db/client';
import { ingestionEvents } from '../../db/schema/ingestion-events';
import { HttpError } from '../../lib/httpError';
import * as accountsRepo from '../accounts/repo';
import * as transactionsRepo from '../transactions/repo';
import * as jobsRepo from '../jobs/repo';
import { getRulesForMatching } from '../categorisation-rules/service';
import { matchDescription } from '../categorisation-rules/fuzzyMatcher';
import type { MatchResult, RuleForMatching } from '../categorisation-rules/fuzzyMatcher';
import { parseAccountCsv } from './csvParser';
import type { ParsedTransactionRow } from './csvParser';
import { computeDedupeHashes } from './dedupe';

/** Progress is reported (and the event loop yielded) every this many matched rows. */
const YIELD_EVERY = 25;

/**
 * `warning` covers both "some new rows plus some duplicates skipped" and "the
 * whole file was already-ingested duplicates" — the latter isn't a failure,
 * but shouldn't look identical to a genuinely empty/clean file, so any
 * skipped row at all is surfaced as a warning rather than silently as success.
 */
export function computeIngestStatus(rowsSkipped: number): IngestionEventStatus {
  return rowsSkipped > 0 ? 'warning' : 'success';
}

function buildTransactionInsertFields(
  accountId: number,
  row: ParsedTransactionRow,
  hash: string,
  match: MatchResult | null,
) {
  return {
    accountId,
    date: row.date,
    amount: row.amount,
    description: row.description,
    normalizedDescription: row.normalizedDescription,
    dedupeHash: hash,
    rawCsvRow: row.rawCsvRow,
    categoryId: match?.categoryId ?? null,
    categorySource: match ? ('rule' as const) : null,
    matchedRuleId: match?.matchedRuleId ?? null,
    vendorId: match?.vendorId ?? null,
    vendorSource: match?.vendorId != null ? ('rule' as const) : null,
    balanceAfter: row.balanceAfter,
  };
}

/**
 * Scans an account's configured folder for CSV files and ingests each one,
 * fully synchronously. Used by the folder watcher, which fires in the
 * background with no request awaiting a progress update — the job-based,
 * progress-reporting path below (`prepareIngestPlan` + `runIngestJob`) is for
 * the user-initiated "Ingest now" button instead.
 */
export function ingestAccountFolder(
  accountId: number,
  source: IngestionEventSource = 'manual',
): IngestResultDto[] {
  const account = accountsRepo.getAccountById(accountId);
  if (!account) {
    throw new HttpError(404, `Account ${accountId} not found`);
  }
  if (!account.folderPath) {
    throw new HttpError(400, `Account "${account.name}" has no folder configured`);
  }
  if (!account.columnMapping) {
    throw new HttpError(400, `Account "${account.name}" has no column mapping configured`);
  }

  const mapping = account.columnMapping as ColumnMapping;
  const folderPath = account.folderPath;
  const csvFiles = readdirSync(folderPath).filter((name) => name.toLowerCase().endsWith('.csv'));
  const rules = getRulesForMatching();

  const accountType = account.type as AccountType;
  return csvFiles.map((fileName) =>
    ingestFile(accountId, accountType, folderPath, fileName, mapping, source, rules),
  );
}

function ingestFile(
  accountId: number,
  accountType: AccountType,
  folderPath: string,
  fileName: string,
  mapping: ColumnMapping,
  source: IngestionEventSource,
  rules: RuleForMatching[],
): IngestResultDto {
  const ranAt = Date.now();

  try {
    const content = readCsvFileWithEncodingFallback(join(folderPath, fileName));
    const parsedRows = parseAccountCsv(content, mapping, accountType);
    const hashes = computeDedupeHashes(parsedRows);
    const existingHashes = transactionsRepo.findExistingDedupeHashes(accountId, hashes);

    const newRows = parsedRows
      .map((row, index) => ({ row, hash: hashes[index] as string }))
      .filter(({ hash }) => !existingHashes.has(hash));

    const rowsIngested = transactionsRepo.insertTransactions(
      newRows.map(({ row, hash }) =>
        buildTransactionInsertFields(accountId, row, hash, matchDescription(row.normalizedDescription, rules)),
      ),
    );

    const rowsSkipped = parsedRows.length - rowsIngested;
    const result: IngestResultDto = {
      status: computeIngestStatus(rowsSkipped),
      fileName,
      rowsIngested,
      rowsSkipped,
      errorMessage: null,
    };
    logIngestionEvent(accountId, source, result, ranAt);
    return result;
  } catch (error) {
    const result: IngestResultDto = {
      status: 'error',
      fileName,
      rowsIngested: 0,
      rowsSkipped: 0,
      errorMessage: error instanceof Error ? error.message : String(error),
    };
    logIngestionEvent(accountId, source, result, ranAt);
    return result;
  }
}

function logIngestionEvent(
  accountId: number,
  source: IngestionEventSource,
  result: IngestResultDto,
  ranAt: number,
) {
  db.insert(ingestionEvents)
    .values({
      accountId,
      source,
      fileName: result.fileName,
      status: result.status,
      rowsIngested: result.rowsIngested,
      rowsSkipped: result.rowsSkipped,
      errorMessage: result.errorMessage,
      ranAt,
    })
    .run();
}

interface PlannedFile {
  fileName: string;
  parsedRowsLength: number;
  newRows: { row: ParsedTransactionRow; hash: string }[];
  parseError: string | null;
}

export interface IngestPlan {
  accountId: number;
  source: IngestionEventSource;
  rules: RuleForMatching[];
  files: PlannedFile[];
  totalNewRows: number;
}

/**
 * Validates the account and reads/parses/dedupe-filters every CSV file up
 * front (fast — matching against rules is the slow part, not parsing), so an
 * accurate row count is known before creating the progress-tracked job. Any
 * per-file read/parse failure is captured here rather than thrown, so one bad
 * file doesn't prevent the others from still being planned and ingested —
 * matching `ingestFile`'s existing per-file error isolation.
 */
export function prepareIngestPlan(accountId: number, source: IngestionEventSource): IngestPlan {
  const account = accountsRepo.getAccountById(accountId);
  if (!account) {
    throw new HttpError(404, `Account ${accountId} not found`);
  }
  if (!account.folderPath) {
    throw new HttpError(400, `Account "${account.name}" has no folder configured`);
  }
  if (!account.columnMapping) {
    throw new HttpError(400, `Account "${account.name}" has no column mapping configured`);
  }

  const mapping = account.columnMapping as ColumnMapping;
  const accountType = account.type as AccountType;
  const folderPath = account.folderPath;
  const csvFileNames = readdirSync(folderPath).filter((name) => name.toLowerCase().endsWith('.csv'));
  const rules = getRulesForMatching();

  const files: PlannedFile[] = csvFileNames.map((fileName) => {
    try {
      const content = readCsvFileWithEncodingFallback(join(folderPath, fileName));
      const parsedRows = parseAccountCsv(content, mapping, accountType);
      const hashes = computeDedupeHashes(parsedRows);
      const existingHashes = transactionsRepo.findExistingDedupeHashes(accountId, hashes);
      const newRows = parsedRows
        .map((row, index) => ({ row, hash: hashes[index] as string }))
        .filter(({ hash }) => !existingHashes.has(hash));
      return { fileName, parsedRowsLength: parsedRows.length, newRows, parseError: null };
    } catch (error) {
      return {
        fileName,
        parsedRowsLength: 0,
        newRows: [],
        parseError: error instanceof Error ? error.message : String(error),
      };
    }
  });

  const totalNewRows = files.reduce((sum, file) => sum + file.newRows.length, 0);
  return { accountId, source, rules, files, totalNewRows };
}

/**
 * Runs a previously-planned ingest, matching each new row against the rule
 * set and yielding the event loop every `YIELD_EVERY` rows so a concurrent
 * `GET /jobs/:id` poll can be served — otherwise Node's single thread would
 * stay blocked for the whole run (matching is O(rows × rules), the actual
 * slow part) and progress would never be observable mid-flight.
 *
 * Yields once *before* doing any work — see the matching comment on
 * runRecategoriseJob (categorisation-rules/service.ts) for why: without it,
 * the first chunk runs inline within the caller's call stack, delaying the
 * POST /accounts/:id/ingest response itself by however long that chunk takes.
 */
export async function runIngestJob(jobId: number, plan: IngestPlan): Promise<void> {
  await new Promise((resolve) => setImmediate(resolve));

  let processedSoFar = 0;
  const results: IngestResultDto[] = [];

  for (const file of plan.files) {
    const ranAt = Date.now();

    if (file.parseError) {
      const result: IngestResultDto = {
        status: 'error',
        fileName: file.fileName,
        rowsIngested: 0,
        rowsSkipped: 0,
        errorMessage: file.parseError,
      };
      logIngestionEvent(plan.accountId, plan.source, result, ranAt);
      results.push(result);
      continue;
    }

    try {
      const insertRows: ReturnType<typeof buildTransactionInsertFields>[] = [];
      for (const { row, hash } of file.newRows) {
        const match = matchDescription(row.normalizedDescription, plan.rules);
        insertRows.push(buildTransactionInsertFields(plan.accountId, row, hash, match));
        processedSoFar += 1;
        if (processedSoFar % YIELD_EVERY === 0) {
          jobsRepo.updateProgress(jobId, processedSoFar);
          await new Promise((resolve) => setImmediate(resolve));
        }
      }

      const rowsIngested = transactionsRepo.insertTransactions(insertRows);
      const rowsSkipped = file.parsedRowsLength - rowsIngested;
      const result: IngestResultDto = {
        status: computeIngestStatus(rowsSkipped),
        fileName: file.fileName,
        rowsIngested,
        rowsSkipped,
        errorMessage: null,
      };
      logIngestionEvent(plan.accountId, plan.source, result, ranAt);
      results.push(result);
    } catch (error) {
      const result: IngestResultDto = {
        status: 'error',
        fileName: file.fileName,
        rowsIngested: 0,
        rowsSkipped: 0,
        errorMessage: error instanceof Error ? error.message : String(error),
      };
      logIngestionEvent(plan.accountId, plan.source, result, ranAt);
      results.push(result);
    }
  }

  jobsRepo.updateProgress(jobId, plan.totalNewRows);
  jobsRepo.completeJob(jobId, JSON.stringify(results));
}
