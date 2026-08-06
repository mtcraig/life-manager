import { parse } from 'csv-parse/sync';
import type {
  BulkImportRulesInput,
  BulkImportRulesResultDto,
  CategorisationRuleDto,
  CategorisationRuleMutationResultDto,
  CreateCategorisationRuleInput,
  RecategoriseResultDto,
  UpdateCategorisationRuleInput,
} from '@life-manager/shared';
import { HttpError } from '../../lib/httpError';
import * as categoriesRepo from '../categories/repo';
import * as vendorsRepo from '../vendors/repo';
import * as transactionsRepo from '../transactions/repo';
import type { TransactionRow } from '../transactions/repo';
import * as jobsRepo from '../jobs/repo';
import * as repo from './repo';
import type { CategorisationRuleRow } from './repo';
import { matchDescription } from './fuzzyMatcher';
import type { RuleForMatching } from './fuzzyMatcher';

/** Progress is reported (and the event loop yielded) every this many candidate rows. */
const YIELD_EVERY = 25;

function toDto(row: CategorisationRuleRow): CategorisationRuleDto {
  return {
    id: row.id,
    pattern: row.pattern,
    categoryId: row.categoryId,
    vendorId: row.vendorId,
    matchType: row.matchType as CategorisationRuleDto['matchType'],
    priority: row.priority,
    source: row.source as CategorisationRuleDto['source'],
    createdAt: new Date(row.createdAt).toISOString(),
    updatedAt: new Date(row.updatedAt).toISOString(),
  };
}

function toRuleForMatching(row: CategorisationRuleRow): RuleForMatching {
  return {
    id: row.id,
    pattern: row.pattern,
    categoryId: row.categoryId,
    vendorId: row.vendorId,
    matchType: row.matchType as RuleForMatching['matchType'],
  };
}

export function listRules(): CategorisationRuleDto[] {
  return repo.listRules().map(toDto);
}

/** Used by the ingest pipeline to fetch the current rule set once per ingest run. */
export function getRulesForMatching(): RuleForMatching[] {
  return repo.listRules().map(toRuleForMatching);
}

/**
 * Only re-matches currently-Uncategorised transactions (not every rule-sourced
 * one) — fast, since that candidate set is typically small, so day-to-day rule
 * tweaking doesn't pay the cost of re-scanning the whole rule-sourced history
 * every time. Editing a pattern so it stops matching something it used to
 * catch won't retroactively un-categorise that transaction via this path;
 * use `reapplyAllRules` for that broader, slower re-evaluation.
 */
export function createRule(input: CreateCategorisationRuleInput): CategorisationRuleMutationResultDto {
  if (!categoriesRepo.getCategoryById(input.categoryId)) {
    throw new HttpError(404, `Category ${input.categoryId} not found`);
  }
  if (!vendorsRepo.getVendorById(input.vendorId)) {
    throw new HttpError(404, `Vendor ${input.vendorId} not found`);
  }
  const row = repo.insertRule({
    pattern: input.pattern,
    categoryId: input.categoryId,
    vendorId: input.vendorId,
    matchType: input.matchType,
    priority: input.priority,
    source: 'manual',
  });
  const { jobId } = startRecategoriseJob(transactionsRepo.listUncategorised());
  return { rule: toDto(row), jobId };
}

function mergeUniqueById(...lists: TransactionRow[][]): TransactionRow[] {
  const byId = new Map<number, TransactionRow>();
  for (const list of lists) {
    for (const txn of list) byId.set(txn.id, txn);
  }
  return [...byId.values()];
}

/**
 * Re-matches two candidate sets on every edit: transactions previously
 * matched by *this* rule (its new pattern/category/vendor might no longer
 * match them, might now match a different rule, or might still match this
 * one), plus the usual fast uncategorised-transactions pass so an edit can
 * also pick up new matches. Deliberately not the broader
 * listUncategorisedOrRuleSourced() sweep every other rule uses — see
 * reapplyAllRules for that slower, explicitly user-triggered option.
 */
export function updateRule(
  id: number,
  input: UpdateCategorisationRuleInput,
): CategorisationRuleMutationResultDto {
  if (!repo.getRuleById(id)) {
    throw new HttpError(404, `Rule ${id} not found`);
  }
  if (input.categoryId !== undefined && !categoriesRepo.getCategoryById(input.categoryId)) {
    throw new HttpError(404, `Category ${input.categoryId} not found`);
  }
  if (input.vendorId !== undefined && !vendorsRepo.getVendorById(input.vendorId)) {
    throw new HttpError(404, `Vendor ${input.vendorId} not found`);
  }

  const row = repo.updateRule(id, {
    ...(input.pattern !== undefined && { pattern: input.pattern }),
    ...(input.categoryId !== undefined && { categoryId: input.categoryId }),
    ...(input.vendorId !== undefined && { vendorId: input.vendorId }),
    ...(input.matchType !== undefined && { matchType: input.matchType }),
    ...(input.priority !== undefined && { priority: input.priority }),
  });
  const candidates = mergeUniqueById(
    transactionsRepo.listByMatchedRuleId(id),
    transactionsRepo.listUncategorised(),
  );
  const { jobId } = startRecategoriseJob(candidates);
  return { rule: toDto(row as NonNullable<typeof row>), jobId };
}

/**
 * Deleting a rule must not leave transactions pointing at a matchedRuleId
 * that no longer exists (the FK has no ON DELETE behaviour) — clear that
 * bookkeeping reference first. The transaction's own categoryId/vendorId are
 * left untouched; only the "which rule did this" pointer is cleared.
 */
export function deleteRule(id: number): void {
  if (!repo.getRuleById(id)) {
    throw new HttpError(404, `Rule ${id} not found`);
  }
  transactionsRepo.clearMatchedRuleId(id);
  repo.deleteRule(id);
}

/**
 * Bulk version of deleteRule: clears the matchedRuleId bookkeeping pointer on
 * every transaction that has one before deleting every rule row, for the same
 * FK-ordering reason as the single-rule delete. category/vendor fields are
 * never touched — only the "which rule matched this" pointer is cleared.
 */
export function deleteAllRules(): void {
  transactionsRepo.clearAllMatchedRuleIds();
  repo.deleteAllRules();
}

/**
 * Imports rules from a CSV export of the user's existing spreadsheet lookup.
 * Categories and vendors referenced by name are created on the fly if they
 * don't already exist, since the spreadsheet's lookup is the source of truth
 * being migrated in. Vendor is mandatory on every rule, matching the manual
 * add/edit forms, so rows missing a vendor are skipped like rows missing a
 * pattern or category. Once rules are inserted, they're applied to existing
 * transactions the same way a single manual rule create/edit is — as a
 * background job, since a bulk import can add many rules at once.
 */
export function bulkImportRules(input: BulkImportRulesInput): BulkImportRulesResultDto {
  const records: Record<string, string>[] = parse(input.csvContent, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });

  const { pattern: patternCol, category: categoryCol, vendor: vendorCol, matchType: matchTypeCol } =
    input.columnMapping;
  let categoriesCreated = 0;
  let vendorsCreated = 0;
  let rulesCreated = 0;

  for (const row of records) {
    const pattern = row[patternCol];
    const categoryName = row[categoryCol];
    const vendorName = row[vendorCol];
    if (!pattern || !categoryName || !vendorName) continue;

    let category = categoriesRepo.getCategoryByName(categoryName);
    if (!category) {
      category = categoriesRepo.insertCategory({
        name: categoryName,
        isTransfer: false,
        kind: null,
        color: null,
      });
      categoriesCreated += 1;
    }

    let vendor = vendorsRepo.getVendorByName(vendorName);
    if (!vendor) {
      vendor = vendorsRepo.insertVendor({ name: vendorName });
      vendorsCreated += 1;
    }

    const rawMatchType = matchTypeCol ? row[matchTypeCol] : undefined;
    const matchType = rawMatchType === 'exact' ? 'exact' : 'fuzzy';

    repo.insertRule({
      pattern,
      categoryId: category.id,
      vendorId: vendor.id,
      matchType,
      priority: 0,
      source: 'bulk_import',
    });
    rulesCreated += 1;
  }

  const jobId =
    rulesCreated > 0 ? startRecategoriseJob(transactionsRepo.listUncategorisedOrRuleSourced()).jobId : null;

  return { rulesCreated, categoriesCreated, vendorsCreated, jobId };
}

/** Re-runs matching over every currently-Uncategorised transaction using the latest rule set. */
export function recategoriseUncategorised(): RecategoriseResultDto {
  return { jobId: startRecategoriseJob(transactionsRepo.listUncategorised()).jobId };
}

/**
 * The broad, slow re-evaluation: every Uncategorised transaction *and* every
 * still rule-sourced (category or vendor) one, so an edited pattern that no
 * longer matches something it used to correctly clears that stale match, and
 * a pattern that now matches something previously caught by a different rule
 * takes over. This is what createRule/updateRule used to do automatically on
 * every tweak — now a separate, explicitly user-triggered action, since
 * paying its full cost (O(candidates × rules) against the whole rule-sourced
 * history) on every single-rule edit was the actual source of the slowness.
 */
export function reapplyAllRules(): RecategoriseResultDto {
  return { jobId: startRecategoriseJob(transactionsRepo.listUncategorisedOrRuleSourced()).jobId };
}

function startRecategoriseJob(candidates: TransactionRow[]): { jobId: number } {
  const job = jobsRepo.createJob('recategorise', candidates.length);
  runRecategoriseJob(job.id, candidates).catch((error) => {
    jobsRepo.failJob(job.id, error instanceof Error ? error.message : String(error));
  });
  return { jobId: job.id };
}

/**
 * Re-runs matching for the given candidate transactions against the current
 * rule set. Category and vendor are each only overwritten when that specific
 * field is still eligible (never-set, or last-set by a rule) — a manually-set
 * category or vendor must never be silently overwritten, and the two fields
 * are tracked independently since a transaction can have e.g. a manual
 * category alongside a still-rule-sourced (or unset) vendor.
 * A transaction previously matched by a rule that no longer matches falls
 * back to whatever (if anything) currently matches, which may mean an
 * eligible field becomes unset again.
 *
 * Runs as a chunked background job (rather than a plain loop) because this is
 * O(candidates × rules) — potentially slow — and yielding the event loop
 * every YIELD_EVERY rows lets a concurrent `GET /jobs/:id` poll observe
 * progress instead of the whole matching pass blocking Node's single thread.
 *
 * Yields once *before* doing any work, not just every YIELD_EVERY rows: an
 * async function runs synchronously up to its first `await`, so without this
 * the first chunk would run inline within the caller's own call stack —
 * blocking the createRule/updateRule HTTP response on however long the first
 * YIELD_EVERY candidates take, defeating the "respond immediately with a
 * jobId, report progress after" point of this whole background-job design.
 */
async function runRecategoriseJob(jobId: number, candidates: TransactionRow[]): Promise<void> {
  await new Promise((resolve) => setImmediate(resolve));

  const rules = getRulesForMatching();
  let updated = 0;
  let processed = 0;

  for (const txn of candidates) {
    const match = matchDescription(txn.normalizedDescription, rules);

    const categoryEligible = txn.categoryId === null || txn.categorySource === 'rule';
    const vendorEligible = txn.vendorId === null || txn.vendorSource === 'rule';

    const categoryId = categoryEligible ? (match?.categoryId ?? null) : txn.categoryId;
    const categorySource = categoryEligible ? (match ? 'rule' : null) : txn.categorySource;
    const matchedRuleId = categoryEligible ? (match?.matchedRuleId ?? null) : txn.matchedRuleId;
    const vendorId = vendorEligible ? (match?.vendorId ?? null) : txn.vendorId;
    const vendorSource = vendorEligible ? (match?.vendorId != null ? 'rule' : null) : txn.vendorSource;

    if (
      txn.categoryId !== categoryId ||
      txn.categorySource !== categorySource ||
      txn.matchedRuleId !== matchedRuleId ||
      txn.vendorId !== vendorId ||
      txn.vendorSource !== vendorSource
    ) {
      transactionsRepo.setTransactionCategoryAndVendor(txn.id, {
        categoryId,
        categorySource,
        matchedRuleId,
        vendorId,
        vendorSource,
      });
      updated += 1;
    }

    processed += 1;
    if (processed % YIELD_EVERY === 0) {
      jobsRepo.updateProgress(jobId, processed);
      await new Promise((resolve) => setImmediate(resolve));
    }
  }

  jobsRepo.updateProgress(jobId, candidates.length);
  jobsRepo.completeJob(jobId, JSON.stringify({ updated }));
}
