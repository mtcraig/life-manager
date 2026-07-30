import { describe, expect, it } from 'vitest';
import { matchDescription } from './fuzzyMatcher';
import type { RuleForMatching } from './fuzzyMatcher';

describe('matchDescription', () => {
  it('matches an exact rule via case-insensitive substring', () => {
    const rules: RuleForMatching[] = [
      { id: 1, pattern: 'tesco', categoryId: 2, vendorId: 1, matchType: 'exact' },
    ];
    expect(matchDescription('tesco stores 1234', rules)).toEqual({
      categoryId: 2,
      vendorId: 1,
      matchedRuleId: 1,
    });
  });

  it('matches a fuzzy rule against a description with extra surrounding tokens', () => {
    const rules: RuleForMatching[] = [
      { id: 2, pattern: 'cofee shop', categoryId: 4, vendorId: 1, matchType: 'fuzzy' },
    ];
    expect(matchDescription('cofee shop central london 42', rules)).toEqual({
      categoryId: 4,
      vendorId: 1,
      matchedRuleId: 2,
    });
  });

  it('tolerates a typo within the fuzzy pattern', () => {
    const rules: RuleForMatching[] = [
      { id: 2, pattern: 'cofee shop', categoryId: 4, vendorId: 1, matchType: 'fuzzy' },
    ];
    expect(matchDescription('coffee shop paris branch', rules)).toEqual({
      categoryId: 4,
      vendorId: 1,
      matchedRuleId: 2,
    });
  });

  it('returns null (Uncategorised) when no rule is close enough', () => {
    const rules: RuleForMatching[] = [
      { id: 2, pattern: 'cofee shop', categoryId: 4, vendorId: 1, matchType: 'fuzzy' },
    ];
    expect(matchDescription('random unknown merchant xyz', rules)).toBeNull();
  });

  it('returns null when there are no rules at all', () => {
    expect(matchDescription('anything', [])).toBeNull();
  });

  it('prefers an exact match over a fuzzy match even if the fuzzy rule scores well', () => {
    const rules: RuleForMatching[] = [
      { id: 1, pattern: 'tesco', categoryId: 2, vendorId: 1, matchType: 'exact' },
      { id: 3, pattern: 'tesco', categoryId: 99, vendorId: 1, matchType: 'fuzzy' },
    ];
    expect(matchDescription('tesco stores 1234', rules)).toEqual({
      categoryId: 2,
      vendorId: 1,
      matchedRuleId: 1,
    });
  });

  it('breaks ties between equally-good fuzzy matches using rule order (priority pre-sorted)', () => {
    const rules: RuleForMatching[] = [
      { id: 5, pattern: 'shop', categoryId: 10, vendorId: 1, matchType: 'fuzzy' },
      { id: 6, pattern: 'shop', categoryId: 20, vendorId: 1, matchType: 'fuzzy' },
    ];
    expect(matchDescription('coffee shop', rules)).toEqual({
      categoryId: 10,
      vendorId: 1,
      matchedRuleId: 5,
    });
  });

  it('carries a rule-level vendorId through to the match result', () => {
    const rules: RuleForMatching[] = [
      { id: 1, pattern: 'tesco', categoryId: 2, vendorId: 7, matchType: 'exact' },
    ];
    expect(matchDescription('tesco stores 1234', rules)).toEqual({
      categoryId: 2,
      vendorId: 7,
      matchedRuleId: 1,
    });
  });
});
