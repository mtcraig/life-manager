import { describe, expect, it } from 'vitest';
import { computeIngestStatus } from './ingestService';

describe('computeIngestStatus', () => {
  it('is success when rows were ingested and none were skipped', () => {
    expect(computeIngestStatus(0)).toBe('success');
  });

  it('is warning when some rows were ingested and some were skipped as duplicates', () => {
    expect(computeIngestStatus(3)).toBe('warning');
  });

  it('is warning when every row in the file was already a duplicate (no new rows)', () => {
    expect(computeIngestStatus(5)).toBe('warning');
  });

  it('is success for a genuinely empty file (nothing ingested, nothing skipped)', () => {
    expect(computeIngestStatus(0)).toBe('success');
  });
});
