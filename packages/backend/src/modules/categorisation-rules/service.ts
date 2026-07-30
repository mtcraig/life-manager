import { parse } from 'csv-parse/sync';
import type {
  BulkImportRulesInput,
  BulkImportRulesResultDto,
  CategorisationRuleDto,
  CreateCategorisationRuleInput,
  UpdateCategorisationRuleInput,
} from '@life-manager/shared';
import { HttpError } from '../../lib/httpError';
import * as categoriesRepo from '../categories/repo';
import * as vendorsRepo from '../vendors/repo';
import * as transactionsRepo from '../transactions/repo';
import type { TransactionRow } from '../transactions/repo';
import * as repo from './repo';
import type { CategorisationRuleRow } from './repo';
import { matchDescription } from './fuzzyMatcher';
import type { RuleForMatching } from './fuzzyMatcher';

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

export function createRule(input: CreateCategorisationRuleInput): CategorisationRuleDto {
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
  reapplyRulesTo(transactionsRepo.listUncategorisedOrRuleSourced());
  return toDto(row);
}

export function updateRule(id: number, input: UpdateCategorisationRuleInput): CategorisationRuleDto {
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
  reapplyRulesTo(transactionsRepo.listUncategorisedOrRuleSourced());
  return toDto(row as NonNullable<typeof row>);
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
 * Imports rules from a CSV export of the user's existing spreadsheet lookup.
 * Categories and vendors referenced by name are created on the fly if they
 * don't already exist, since the spreadsheet's lookup is the source of truth
 * being migrated in. Vendor is mandatory on every rule, matching the manual
 * add/edit forms, so rows missing a vendor are skipped like rows missing a
 * pattern or category.
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

  return { rulesCreated, categoriesCreated, vendorsCreated };
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
 */
function reapplyRulesTo(candidates: TransactionRow[]): number {
  const rules = getRulesForMatching();
  let updated = 0;
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
  }
  return updated;
}

/** Re-runs matching over every currently-Uncategorised transaction using the latest rule set. */
export function recategoriseUncategorised(): { updated: number } {
  return { updated: reapplyRulesTo(transactionsRepo.listUncategorised()) };
}
