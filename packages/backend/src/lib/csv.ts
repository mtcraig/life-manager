/**
 * csv-parse's `columns: true` matches header names verbatim, so a pasted CSV
 * with slightly different casing (e.g. "asofDate" instead of "asOfDate")
 * silently produces columns the service code doesn't recognise as missing.
 * Pass this as the `columns` option to case-insensitively snap each header to
 * its canonical form; anything unrecognised passes through unchanged, so
 * missing-column validation still fires correctly for genuinely absent columns.
 */
export function normalizeCsvHeaders(canonicalColumns: readonly string[]) {
  const byLowercase = new Map(canonicalColumns.map((column) => [column.toLowerCase(), column]));
  return (record: string[]): string[] =>
    record.map((header) => byLowercase.get(header.trim().toLowerCase()) ?? header);
}
