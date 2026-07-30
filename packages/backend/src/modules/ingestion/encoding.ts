import { readFileSync } from 'node:fs';

const UTF8_BOM = Buffer.from([0xef, 0xbb, 0xbf]);

/**
 * Reads a CSV export as text, tolerant of the encodings UK bank exports
 * actually show up in. Strips a UTF-8 BOM if present, then decodes as UTF-8;
 * if that produced replacement characters (U+FFFD), the file wasn't valid
 * UTF-8 (e.g. Windows-1252, common for exports containing "£"), so it's
 * re-decoded as latin1 instead — byte-identical to Windows-1252 across the
 * printable range, and built into Node with no extra dependency.
 */
export function readCsvFileWithEncodingFallback(path: string): string {
  const raw = readFileSync(path);
  const buffer = raw.subarray(0, 3).equals(UTF8_BOM) ? raw.subarray(3) : raw;

  const utf8Text = buffer.toString('utf-8');
  if (!utf8Text.includes('�')) {
    return utf8Text;
  }
  return buffer.toString('latin1');
}
