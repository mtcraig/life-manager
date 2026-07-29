import Fuse from 'fuse.js';
import type { MatchType } from '@life-manager/shared';

export interface RuleForMatching {
  id: number;
  pattern: string;
  categoryId: number;
  matchType: MatchType;
}

export interface MatchResult {
  categoryId: number;
  matchedRuleId: number;
}

/** fuse.js score: 0 = perfect match, 1 = no match at all. Below this is accepted. */
const FUZZY_SCORE_THRESHOLD = 0.3;

/**
 * All contiguous word-windows of a description, e.g. "cofee shop central" ->
 * ["cofee", "shop", "central", "cofee shop", "shop central", "cofee shop central"].
 * Rule patterns are typically 1-3 words, but real bank descriptions carry extra
 * tokens (store numbers, locations, transaction IDs) around the merchant name.
 * Fuse.js scores whole-string similarity, so comparing a short pattern directly
 * against a much longer description penalises exactly the "extra tokens" case
 * fuzzy matching needs to handle — matching against same-length windows instead
 * keeps the comparison symmetric and lets typo-tolerance work as intended.
 */
function descriptionWindows(normalizedDescription: string): string[] {
  const words = normalizedDescription.split(' ').filter(Boolean);
  const windows = new Set<string>();
  for (let size = 1; size <= words.length; size++) {
    for (let start = 0; start + size <= words.length; start++) {
      windows.add(words.slice(start, start + size).join(' '));
    }
  }
  return [...windows];
}

/**
 * Two-tier matcher against a transaction's normalized description:
 * 1. Exact rules (case-insensitive substring match) always win when present.
 * 2. Otherwise falls back to fuse.js fuzzy scoring: each fuzzy rule's pattern
 *    is searched against the description's word-windows, keeping whichever
 *    rule achieves the best (lowest) score.
 * `rules` must already be ordered by priority (desc) then insertion order, so
 * the first-encountered rule wins ties in both tiers.
 * Returns null (Uncategorised) when nothing clears the threshold.
 */
export function matchDescription(
  normalizedDescription: string,
  rules: RuleForMatching[],
): MatchResult | null {
  const exactRules = rules.filter((rule) => rule.matchType === 'exact');
  const exactMatch = exactRules.find((rule) =>
    normalizedDescription.includes(rule.pattern.toLowerCase()),
  );
  if (exactMatch) {
    return { categoryId: exactMatch.categoryId, matchedRuleId: exactMatch.id };
  }

  const fuzzyRules = rules.filter((rule) => rule.matchType === 'fuzzy');
  if (fuzzyRules.length === 0) return null;

  const windows = descriptionWindows(normalizedDescription).map((text, id) => ({ id, text }));
  if (windows.length === 0) return null;

  const fuse = new Fuse(windows, {
    keys: ['text'],
    includeScore: true,
    threshold: FUZZY_SCORE_THRESHOLD,
    ignoreLocation: true,
  });

  let best: { rule: RuleForMatching; score: number } | null = null;
  for (const rule of fuzzyRules) {
    const topResult = fuse.search(rule.pattern.toLowerCase())[0];
    const score = topResult?.score;
    if (score !== undefined && (!best || score < best.score)) {
      best = { rule, score };
    }
  }

  return best ? { categoryId: best.rule.categoryId, matchedRuleId: best.rule.id } : null;
}
