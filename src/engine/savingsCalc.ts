export type SavingsTotals = {
  monthly: number
  annual: number
}

export function calcMonthlySavings(currentSpend: number, recommendedSpend: number): number {
  if (!Number.isFinite(currentSpend) || !Number.isFinite(recommendedSpend)) {
    return 0
  }

  return Math.max(0, currentSpend - recommendedSpend)
}

export function calcAnnualSavings(monthlySavings: number): number {
  if (!Number.isFinite(monthlySavings)) {
    return 0
  }

  return monthlySavings * 12
}

export function calcTotalSavings(toolResults: Array<{ savingsMonthly?: number; monthlySavings?: number }>): SavingsTotals {
  const monthly = toolResults.reduce((total, toolResult) => {
    const savings = toolResult.savingsMonthly ?? toolResult.monthlySavings ?? 0
    return total + (Number.isFinite(savings) ? savings : 0)
  }, 0)

  return {
    monthly,
    annual: calcAnnualSavings(monthly),
  }
}