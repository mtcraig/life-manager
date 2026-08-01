/**
 * Validated 15-slot categorical palette (see the dataviz skill's palette.md) — fixed
 * order, never cycled. Extends the skill's documented 8-hue default with 7 additional
 * hues (cyan, lime, rose, indigo, brown, teal, plum), re-validated as a full 15-slot
 * set via `validate_palette.js` for both light and dark against this app's actual
 * chart surfaces — adjacent-pair CVD/contrast/lightness/chroma all pass (one
 * light-mode contrast WARN and one dark-mode CVD WARN, both in the same
 * legend/tooltip-mitigated band the original 8-color palette already shipped with).
 * Shared by every stacked chart that needs more than 8 series (spending-by-category,
 * investment holdings-by-month) so they stay visually consistent.
 */
export const CATEGORY_PALETTE_LIGHT = [
  '#2a78d6',
  '#eb6834',
  '#1baf7a',
  '#eda100',
  '#e87ba4',
  '#008300',
  '#4a3aa7',
  '#e34948',
  '#0e9bb0',
  '#7cb342',
  '#d1477a',
  '#5b5bd6',
  '#a15c2e',
  '#0d9488',
  '#8e44ad',
];

export const CATEGORY_PALETTE_DARK = [
  '#3987e5',
  '#d95926',
  '#199e70',
  '#c98500',
  '#d55181',
  '#008300',
  '#9085e9',
  '#e66767',
  '#1596ad',
  '#6ba33c',
  '#c2467d',
  '#7c7cf0',
  '#c17a4a',
  '#17a394',
  '#a855c9',
];

export const MAX_CATEGORICAL_SERIES = CATEGORY_PALETTE_LIGHT.length;

export const OTHER_COLOR_LIGHT = '#94a3b8'; // slate-400
export const OTHER_COLOR_DARK = '#64748b'; // slate-500
