import { z } from 'zod';

export interface ContentsItemDto {
  id: number;
  name: string;
  areaId: number;
  /** Null only for items created before the Property field existed, until edited. */
  propertyId: number | null;
  value: number;
  purchaseDate: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export const createContentsItemSchema = z.object({
  name: z.string().min(1),
  areaId: z.number().int().positive(),
  propertyId: z.number().int().positive(),
  value: z.number().int(),
  purchaseDate: z.string().optional(),
  notes: z.string().min(1).optional(),
});
export type CreateContentsItemInput = z.infer<typeof createContentsItemSchema>;

export const updateContentsItemSchema = createContentsItemSchema.partial();
export type UpdateContentsItemInput = z.infer<typeof updateContentsItemSchema>;

/**
 * Fixed-format CSV import for bringing in an existing contents inventory
 * spreadsheet — the app's own domain data, so (like Energy's bulk import)
 * this isn't the configurable column-mapping approach accounts use. Expected
 * headers: name,area,property,value,purchaseDate,notes. `area` is looked up
 * by name, created on the fly if it doesn't already exist. `property` is
 * optional and looked up by name only (never created, since properties carry
 * address/geocode data a bare CSV name can't supply) — a blank/omitted value
 * falls back to the top active property.
 */
export const bulkImportContentsItemsSchema = z.object({
  csvContent: z.string().min(1),
});
export type BulkImportContentsItemsInput = z.infer<typeof bulkImportContentsItemsSchema>;

export interface BulkImportContentsItemsResultDto {
  itemsCreated: number;
  areasCreated: number;
}
