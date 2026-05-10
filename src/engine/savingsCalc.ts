export type SavingsTotals = {
  monthly: number
  annual: number
}

export function round2(value: number): number {
  if (!Number.isFinite(value)) {
    return 0
  }

  return Math.round(value * 100) / 100
}

export function calcMonthlySavings(currentSpend: number, recommendedSpend: number): number {
  if (!Number.isFinite(currentSpend) || !Number.isFinite(recommendedSpend)) {
    return 0
  }

  return round2(Math.max(0, currentSpend - recommendedSpend))
}

export function calcAnnualSavings(monthlySavings: number): number {
  if (!Number.isFinite(monthlySavings)) {
    return 0
  }

  return round2(monthlySavings * 12)
}

/**
 * Calculates savings from reducing seats to match actual team size.
 * This is the most defensible savings calc — pure arithmetic.
 */
export function calcSeatOverprovisionSavings(
  seats: number,
  teamSize: number,
  pricePerSeat: number,
): number {
  const excessSeats = Math.max(0, seats - teamSize)
  return round2(excessSeats * pricePerSeat)
}

/**
 * Returns the authoritative current spend.
 * Rule: always use max(reportedSpend, plan.monthlyPrice × effectiveSeats).
 */
export function resolveCurrentSpend(
  reportedSpend: number,
  planMonthlyPrice: number,
  seats: number,
  minSeats: number = 1,
  monthlyMinimum: number = 0,
): number {
  const effectiveSeats = Math.max(seats, minSeats)
  const computedSpend = planMonthlyPrice * effectiveSeats
  const floor = Math.max(computedSpend, monthlyMinimum)
  return round2(Math.max(reportedSpend, floor))
}

export function calcTotalSavings(toolResults: Array<{ savingsMonthly?: number; monthlySavings?: number }>): SavingsTotals {
  const monthly = toolResults.reduce((total, toolResult) => {
    const savings = toolResult.savingsMonthly ?? toolResult.monthlySavings ?? 0
    return total + (Number.isFinite(savings) ? savings : 0)
  }, 0)

  return {
    monthly: round2(monthly),
    annual: calcAnnualSavings(monthly),
  }
}