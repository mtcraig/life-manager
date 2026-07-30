import { z } from 'zod';
import { MATCH_TYPES, RULE_SOURCES } from '../enums.js';

export interface CategorisationRuleDto {
  id: number;
  pattern: string;
  categoryId: number;
  vendorId: number;
  matchType: (typeof MATCH_TYPES)[number];
  priority: number;
  source: (typeof RULE_SOURCES)[number];
  createdAt: string;
  updatedAt: string;
}

export const createCategorisationRuleSchema = z.object({
  pattern: z.string().min(1),
  categoryId: z.number().int().positive(),
  vendorId: z.number().int().positive(),
  matchType: z.enum(MATCH_TYPES).default('fuzzy'),
  priority: z.number().int().default(0),
});
export type CreateCategorisationRuleInput = z.infer<typeof createCategorisationRuleSchema>;

export const updateCategorisationRuleSchema = createCategorisationRuleSchema.partial();
export type UpdateCategorisationRuleInput = z.infer<typeof updateCategorisationRuleSchema>;

/**
 * Bulk-imports categorisation rules from a CSV export of the user's existing
 * spreadsheet lookup. Column headers are configurable, matching the same
 * pattern used for account CSV ingestion (packages/shared/src/dto/account.ts).
 */
export const bulkImportRulesSchema = z.object({
  csvContent: z.string().min(1),
  columnMapping: z.object({
    pattern: z.string().min(1),
    category: z.string().min(1),
    vendor: z.string().min(1),
    matchType: z.string().min(1).optional(),
  }),
});
export type BulkImportRulesInput = z.infer<typeof bulkImportRulesSchema>;

export interface BulkImportRulesResultDto {
  rulesCreated: number;
  categoriesCreated: number;
  vendorsCreated: number;
  /** Job re-applying rules to existing transactions, or null if no rules were created. */
  jobId: number | null;
}

/** Recategorisation of existing transactions runs as a background job (see JobDto)
 * so the frontend can show progress instead of blocking on one long request. */
export interface CategorisationRuleMutationResultDto {
  rule: CategorisationRuleDto;
  jobId: number;
}

export interface RecategoriseResultDto {
  jobId: number;
}
