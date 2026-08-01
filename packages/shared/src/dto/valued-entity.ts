import { z } from 'zod';

/**
 * Investments, properties, and liabilities all follow the same header +
 * dated-valuation-history pattern (to support trend charts, not just a single
 * current value) — this valuation shape is shared verbatim across all three,
 * with `entityId` normalised to a single field name regardless of the
 * underlying FK column (investment_id / property_id / liability_id) so the
 * frontend can use one valuation-history component for all three domains.
 */
export interface ValuationDto {
  id: number;
  entityId: number;
  asOfDate: string; // ISO YYYY-MM-DD
  value: number; // integer pence
  notes: string | null;
  createdAt: string;
}

export const createValuationSchema = z.object({
  asOfDate: z.string(),
  value: z.number().int(),
  notes: z.string().min(1).optional(),
});
export type CreateValuationInput = z.infer<typeof createValuationSchema>;

export const updateValuationSchema = createValuationSchema.partial();
export type UpdateValuationInput = z.infer<typeof updateValuationSchema>;

/**
 * Fixed-format CSV import for bringing in a spreadsheet's existing valuation history —
 * the app's own domain data, not an external bank export, so (like Energy's bulk import)
 * this isn't the configurable column-mapping approach accounts use. Expected headers:
 * entityName,asOfDate,value,notes. `entityName` is looked up by name within the domain
 * (investment/property/liability) the import is posted to, creating it if it doesn't
 * already exist — the same lookup-or-create-by-name idiom bulkImportRules uses for
 * categories/vendors.
 */
export const bulkImportValuationsSchema = z.object({
  csvContent: z.string().min(1),
});
export type BulkImportValuationsInput = z.infer<typeof bulkImportValuationsSchema>;

export interface BulkImportValuationsResultDto {
  valuationsCreated: number;
  entitiesCreated: number;
}
