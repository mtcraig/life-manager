import { describe, expect, it } from 'vitest';
import { parseDateToIso } from './date';

describe('parseDateToIso', () => {
  it('parses YYYY-MM-DD', () => {
    expect(parseDateToIso('2026-01-05', 'YYYY-MM-DD')).toBe('2026-01-05');
  });

  it('parses DD/MM/YYYY', () => {
    expect(parseDateToIso('05/01/2026', 'DD/MM/YYYY')).toBe('2026-01-05');
  });

  it('parses MM/DD/YYYY', () => {
    expect(parseDateToIso('01/05/2026', 'MM/DD/YYYY')).toBe('2026-01-05');
  });

  it('parses DD MON YYYY', () => {
    expect(parseDateToIso('01 Jan 2026', 'DD MON YYYY')).toBe('2026-01-01');
  });

  it('parses DD MON YYYY case-insensitively', () => {
    expect(parseDateToIso('01 JAN 2026', 'DD MON YYYY')).toBe('2026-01-01');
    expect(parseDateToIso('01 jan 2026', 'DD MON YYYY')).toBe('2026-01-01');
  });

  it('parses a single-digit day for DD MON YYYY', () => {
    expect(parseDateToIso('9 Feb 2026', 'DD MON YYYY')).toBe('2026-02-09');
  });

  it('throws for an unrecognised month abbreviation', () => {
    expect(() => parseDateToIso('01 Xyz 2026', 'DD MON YYYY')).toThrow(/unrecognised month/);
  });

  it('throws for a malformed DD MON YYYY string', () => {
    expect(() => parseDateToIso('2026 Jan 01', 'DD MON YYYY')).toThrow(/does not match format/);
  });
});
