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
import * as transactionsRepo from '../transactions/repo';
import * as repo from './repo';
import type { CategorisationRuleRow } from './repo';
import { matchDescription } from './fuzzyMatcher';
import type { RuleForMatching } from './fuzzyMatcher';

function toDto(row: CategorisationRuleRow): CategorisationRuleDto {
  return {
    id: row.id,
    pattern: row.pattern,
    categoryId: row.categoryId,
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
  const row = repo.insertRule({
    pattern: input.pattern,
    categoryId: input.categoryId,
    matchType: input.matchType,
    priority: input.priority,
    source: 'manual',
  });
  return toDto(row);
}

export function updateRule(id: number, input: UpdateCategorisationRuleInput): CategorisationRuleDto {
  if (!repo.getRuleById(id)) {
    throw new HttpError(404, `Rule ${id} not found`);
  }
  if (input.categoryId !== undefined && !categoriesRepo.getCategoryById(input.categoryId)) {
    throw new HttpError(404, `Category ${input.categoryId} not found`);
  }

  const row = repo.updateRule(id, {
    ...(input.pattern !== undefined && { pattern: input.pattern }),
    ...(input.categoryId !== undefined && { categoryId: input.categoryId }),
    ...(input.matchType !== undefined && { matchType: input.matchType }),
    ...(input.priority !== undefined && { priority: input.priority }),
  });
  return toDto(row as NonNullable<typeof row>);
}

export function deleteRule(id: number): void {
  if (!repo.getRuleById(id)) {
    throw new HttpError(404, `Rule ${id} not found`);
  }
  repo.deleteRule(id);
}

/**
 * Imports rules from a CSV export of the user's existing spreadsheet lookup.
 * Categories referenced by name are created on the fly if they don't already
 * exist, since the spreadsheet's category list is the source of truth being migrated in.
 */
export function bulkImportRules(input: BulkImportRulesInput): BulkImportRulesResultDto {
  const records: Record<string, string>[] = parse(input.csvContent, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });

  const { pattern: patternCol, category: categoryCol, matchType: matchTypeCol } = input.columnMapping;
  let categoriesCreated = 0;
  let rulesCreated = 0;

  for (const row of records) {
    const pattern = row[patternCol];
    const categoryName = row[categoryCol];
    if (!pattern || !categoryName) continue;

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

    const rawMatchType = matchTypeCol ? row[matchTypeCol] : undefined;
    const matchType = rawMatchType === 'exact' ? 'exact' : 'fuzzy';

    repo.insertRule({
      pattern,
      categoryId: category.id,
      matchType,
      priority: 0,
      source: 'bulk_import',
    });
    rulesCreated += 1;
  }

  return { rulesCreated, categoriesCreated };
}

/** Re-runs matching over every currently-Uncategorised transaction using the latest rule set. */
export function recategoriseUncategorised(): { updated: number } {
  const rules = getRulesForMatching();
  const uncategorised = transactionsRepo.listUncategorised();

  let updated = 0;
  for (const txn of uncategorised) {
    const match = matchDescription(txn.normalizedDescription, rules);
    if (match) {
      transactionsRepo.setTransactionCategory(txn.id, match.categoryId, 'rule', match.matchedRuleId);
      updated += 1;
    }
  }
  return { updated };
}
