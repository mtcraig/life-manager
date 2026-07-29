export interface ProjectionInput {
  currentValue: number;
  monthlyContribution: number;
  growthRatePct: number;
  months: number;
}

/**
 * Standard monthly-compounding future-value formula:
 * FV = PV*(1+r)^n + PMT*((1+r)^n - 1)/r
 * where r is the monthly growth rate and n is the number of months.
 * Falls back to simple linear accumulation when the rate is zero, since the
 * compounding formula divides by r.
 */
export function projectFutureValue(input: ProjectionInput): number {
  const { currentValue, monthlyContribution, growthRatePct, months } = input;
  const monthlyRate = growthRatePct / 100 / 12;

  if (monthlyRate === 0) {
    return currentValue + monthlyContribution * months;
  }

  const growthFactor = Math.pow(1 + monthlyRate, months);
  const futureValueOfPrincipal = currentValue * growthFactor;
  const futureValueOfContributions =
    monthlyContribution * ((growthFactor - 1) / monthlyRate);
  return futureValueOfPrincipal + futureValueOfContributions;
}

/** Whole months between two ISO YYYY-MM-DD dates, floored, minimum 0. */
export function monthsBetween(fromIsoDate: string, toIsoDate: string): number {
  const from = new Date(fromIsoDate);
  const to = new Date(toIsoDate);
  let months = (to.getFullYear() - from.getFullYear()) * 12 + (to.getMonth() - from.getMonth());
  if (to.getDate() < from.getDate()) {
    months -= 1;
  }
  return Math.max(0, months);
}
