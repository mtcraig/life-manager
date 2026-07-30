/** Converts a snake_case or lowercase enum value into a Proper Case display label, e.g. "credit_card" -> "Credit Card". */
export function humanizeEnumValue(value: string): string {
  return value
    .split('_')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
