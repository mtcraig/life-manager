/**
 * Normalizes a raw transaction description for use in dedupe-hashing and
 * (later) fuzzy categorisation matching: lowercased, trimmed, whitespace collapsed.
 */
export function normalizeDescription(description: string): string {
  return description.trim().toLowerCase().replace(/\s+/g, ' ');
}
