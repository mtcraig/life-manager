export function formatMoney(minorUnits: number): string {
  return (minorUnits / 100).toLocaleString(undefined, {
    style: 'currency',
    currency: 'GBP',
  });
}
