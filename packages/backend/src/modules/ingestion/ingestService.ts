import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { ColumnMapping, IngestResultDto, IngestionEventSource } from '@life-manager/shared';
import { db } from '../../db/client';
import { ingestionEvents } from '../../db/schema/ingestion-events';
import { HttpError } from '../../lib/httpError';
import * as accountsRepo from '../accounts/repo';
import * as transactionsRepo from '../transactions/repo';
import { getRulesForMatching } from '../categorisation-rules/service';
import { matchDescription } from '../categorisation-rules/fuzzyMatcher';
import type { RuleForMatching } from '../categorisation-rules/fuzzyMatcher';
import { parseAccountCsv } from './csvParser';
import { computeDedupeHashes } from './dedupe';

/**
 * Scans an account's configured folder for CSV files and ingests each one.
 * Used by both the manual "Ingest now" trigger and the folder watcher (M4) —
 * `source` only affects the ingestion_events audit log, not the behaviour.
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

  return csvFiles.map((fileName) => ingestFile(accountId, folderPath, fileName, mapping, source, rules));
}

function ingestFile(
  accountId: number,
  folderPath: string,
  fileName: string,
  mapping: ColumnMapping,
  source: IngestionEventSource,
  rules: RuleForMatching[],
): IngestResultDto {
  const ranAt = Date.now();

  try {
    const content = readFileSync(join(folderPath, fileName), 'utf-8');
    const parsedRows = parseAccountCsv(content, mapping);
    const hashes = computeDedupeHashes(parsedRows);
    const existingHashes = transactionsRepo.findExistingDedupeHashes(accountId, hashes);

    const newRows = parsedRows
      .map((row, index) => ({ row, hash: hashes[index] as string }))
      .filter(({ hash }) => !existingHashes.has(hash));

    const rowsIngested = transactionsRepo.insertTransactions(
      newRows.map(({ row, hash }) => {
        const match = matchDescription(row.normalizedDescription, rules);
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
          balanceAfter: row.balanceAfter,
        };
      }),
    );

    const result: IngestResultDto = {
      status: 'success',
      fileName,
      rowsIngested,
      rowsSkipped: parsedRows.length - rowsIngested,
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
      errorMessage: result.errorMessage,
      ranAt,
    })
    .run();
}
