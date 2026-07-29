import { createHash } from 'node:crypto';
import type { ParsedTransactionRow } from './csvParser';

/**
 * Computes a stable per-account dedupe hash for a parsed row, so re-ingesting
 * the same (or an overlapping) CSV export never creates duplicate transactions.
 *
 * When the account's mapping provides an `externalId`, that's authoritative.
 * Otherwise we hash date+amount+description, plus an occurrence index —
 * genuinely identical transactions on the same day (e.g. two identical coffee
 * purchases) are distinguished by their position among duplicates within the file.
 *
 * `balanceAfter` is deliberately excluded from the hash — it's supplementary
 * data about a transaction, not part of its identity.
 */
export function computeDedupeHashes(rows: ParsedTransactionRow[]): string[] {
  const occurrenceCounts = new Map<string, number>();

  return rows.map((row) => {
    if (row.externalId) {
      return hash(`external:${row.externalId}`);
    }

    const key = `${row.date}|${row.amount}|${row.normalizedDescription}`;
    const occurrence = occurrenceCounts.get(key) ?? 0;
    occurrenceCounts.set(key, occurrence + 1);

    return hash(`row:${key}|${occurrence}`);
  });
}

function hash(input: string): string {
  return createHash('sha256').update(input).digest('hex');
}
