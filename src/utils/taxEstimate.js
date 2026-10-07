export function estimateTaxSetAside(netIncome, ratePercent) {
  const rate = Number(ratePercent)
  const net = Math.max(0, Number(netIncome) || 0)
  const safeRate = Number.isFinite(rate) ? rate : 0
  return Math.round(net * (safeRate / 100))
}

// Some logged expenses (e.g. ordinary personal meals) aren't legitimate tax
// deductions even though they're real out-of-pocket costs worth tracking.
// This sums only the expenses that should reduce taxable profit.
export function deductibleExpenseTotal(expenses, nonDeductibleCategories = []) {
  return expenses.reduce((sum, entry) => {
    if (nonDeductibleCategories.includes(entry.category)) return sum
    return sum + (Number(entry.amount) || 0)
  }, 0)
}
