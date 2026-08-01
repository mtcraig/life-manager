import type { BulkImportValuationsResultDto } from '@life-manager/shared';

/** Shared result phrasing for the three valuation-history bulk imports (Investments/Properties/Liabilities). */
export function renderValuationImportResult(result: BulkImportValuationsResultDto): string {
  const entitiesClause =
    result.entitiesCreated > 0
      ? `, creating ${result.entitiesCreated} new ${result.entitiesCreated === 1 ? 'entry' : 'entries'}`
      : '';
  return `Imported ${result.valuationsCreated} valuation${result.valuationsCreated === 1 ? '' : 's'}${entitiesClause}.`;
}
