import { useMemo, useState } from 'react'
import { useAppData } from '../../context/AppDataContext'
import MonthPicker from '../shared/MonthPicker'
import ExpenseDonutChart from './ExpenseDonutChart'
import TrendChart from './TrendChart'
import TaxYearTable from './TaxYearTable'
import { currentMonthKey, monthKeyOf, lastNMonthKeys, shortMonthLabel } from '../../utils/dates'
import { formatYen, incomeAmountJpy, toNumber } from '../../utils/currency'
import { deductibleExpenseTotal, estimateTaxSetAside } from '../../utils/taxEstimate'
import './Dashboard.scss'

function Dashboard() {
  const { data } = useAppData()
  const [monthKey, setMonthKey] = useState(currentMonthKey())

  const monthIncome = useMemo(() => data.income.filter((entry) => monthKeyOf(entry.date) === monthKey), [data.income, monthKey])
  const monthExpenses = useMemo(() => data.expenses.filter((entry) => monthKeyOf(entry.date) === monthKey), [data.expenses, monthKey])

  const incomeTotal = monthIncome.reduce((sum, entry) => sum + incomeAmountJpy(entry), 0)
  const expenseTotal = monthExpenses.reduce((sum, entry) => sum + toNumber(entry.amount), 0)
  const netProfit = incomeTotal - expenseTotal
  // The tax estimate is based on taxable profit (income minus only the
  // deductible expenses), which can differ from cash net profit above when
  // non-deductible costs (e.g. personal meals) have been logged.
  const taxableProfit = incomeTotal - deductibleExpenseTotal(monthExpenses, data.settings.nonDeductibleCategories ?? [])
  const taxEstimate = estimateTaxSetAside(taxableProfit, data.settings.taxSetAsideRate)

  const categoryTotals = useMemo(() => {
    const totals = {}
    monthExpenses.forEach((entry) => {
      totals[entry.category] = (totals[entry.category] || 0) + toNumber(entry.amount)
    })
    return Object.entries(totals)
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount)
  }, [monthExpenses])

  const trendKeys = useMemo(() => lastNMonthKeys(6, monthKey), [monthKey])
  const trendData = useMemo(
    () =>
      trendKeys.map((key) => {
        const income = data.income.filter((entry) => monthKeyOf(entry.date) === key).reduce((sum, entry) => sum + incomeAmountJpy(entry), 0)
        const expense = data.expenses
          .filter((entry) => monthKeyOf(entry.date) === key)
          .reduce((sum, entry) => sum + toNumber(entry.amount), 0)
        return { month: shortMonthLabel(key), income, expense }
      }),
    [data.income, data.expenses, trendKeys],
  )

  return (
    <section aria-labelledby="dashboard-heading">
      <div className="section-header">
        <div>
          <h1 id="dashboard-heading">Dashboard</h1>
          <p>Your freelance finances at a glance.</p>
        </div>
        <MonthPicker monthKey={monthKey} onChange={setMonthKey} />
      </div>

      <div className="summary-grid">
        <div className="summary-card summary-card--income">
          <span>Income</span>
          <strong>{formatYen(incomeTotal)}</strong>
        </div>
        <div className="summary-card summary-card--expense">
          <span>Expenses</span>
          <strong>{formatYen(expenseTotal)}</strong>
        </div>
        <div className={`summary-card ${netProfit >= 0 ? 'summary-card--income' : 'summary-card--expense'}`}>
          <span>Net profit</span>
          <strong>{formatYen(netProfit)}</strong>
        </div>
        <div className="summary-card summary-card--tax">
          <span>Est. tax to set aside ({data.settings.taxSetAsideRate}%)</span>
          <strong>{formatYen(taxEstimate)}</strong>
          {taxableProfit !== netProfit && (
            <small className="summary-card__note">Based on {formatYen(taxableProfit)} deductible profit</small>
          )}
        </div>
      </div>

      <div className="dashboard-charts">
        <div className="card chart-card">
          <h2>Expense breakdown</h2>
          {categoryTotals.length === 0 ? (
            <p className="chart-empty">No expenses logged this month yet.</p>
          ) : (
            <ExpenseDonutChart data={categoryTotals} />
          )}
        </div>
        <div className="card chart-card">
          <h2>Income vs expenses (last 6 months)</h2>
          <TrendChart data={trendData} />
        </div>
      </div>

      <TaxYearTable />
    </section>
  )
}

export default Dashboard
