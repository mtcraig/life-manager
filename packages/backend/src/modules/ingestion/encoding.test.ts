import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { readCsvFileWithEncodingFallback } from './encoding';

describe('readCsvFileWithEncodingFallback', () => {
  const dir = mkdtempSync(join(tmpdir(), 'encoding-test-'));
  const filePath = join(dir, 'test.csv');

  it('reads a plain UTF-8 file unchanged', () => {
    writeFileSync(filePath, 'Date,Description,Amount\n2026-01-01,Coffee,-3.50\n', 'utf-8');
    expect(readCsvFileWithEncodingFallback(filePath)).toContain('Coffee');
  });

  it('strips a UTF-8 BOM', () => {
    const bom = Buffer.from([0xef, 0xbb, 0xbf]);
    const content = Buffer.concat([bom, Buffer.from('Date,Description,Amount\n', 'utf-8')]);
    writeFileSync(filePath, content);
    const result = readCsvFileWithEncodingFallback(filePath);
    expect(result.charCodeAt(0)).not.toBe(0xfeff);
    expect(result.startsWith('Date,Description,Amount')).toBe(true);
  });

  it('falls back to latin1 for a Windows-1252-encoded £ symbol', () => {
    // '£19.99,Debit' encoded as latin1/cp1252: £ is the single byte 0xA3
    const content = Buffer.concat([
      Buffer.from('Date,Description,Amount\n2026-01-01,Shop,', 'utf-8'),
      Buffer.from([0xa3]),
      Buffer.from('19.99\n', 'utf-8'),
    ]);
    writeFileSync(filePath, content);
    const result = readCsvFileWithEncodingFallback(filePath);
    expect(result).toContain('£19.99');
    expect(result).not.toContain('�');
  });
});
