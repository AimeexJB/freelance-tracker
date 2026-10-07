import { useMemo, useState } from 'react'
import { useAppData } from '../../context/AppDataContext'
import { currentMonthKey, currentYear, monthKeyOf, monthKeysOfYear, shortMonthLabel } from '../../utils/dates'
import { formatYen, incomeAmountJpy, toNumber } from '../../utils/currency'
import { deductibleExpenseTotal, estimateTaxSetAside } from '../../utils/taxEstimate'

function TaxYearTable() {
  const { data } = useAppData()
  const [year, setYear] = useState(currentYear())
  const thisMonthKey = currentMonthKey()

  const rows = useMemo(() => {
    return monthKeysOfYear(year).map((key) => {
      const monthExpenses = data.expenses.filter((entry) => monthKeyOf(entry.date) === key)
      const income = data.income.filter((entry) => monthKeyOf(entry.date) === key).reduce((sum, entry) => sum + incomeAmountJpy(entry), 0)
      const expenses = monthExpenses.reduce((sum, entry) => sum + toNumber(entry.amount), 0)
      const net = income - expenses
      const taxableProfit = income - deductibleExpenseTotal(monthExpenses, data.settings.nonDeductibleCategories ?? [])
      const tax = estimateTaxSetAside(taxableProfit, data.settings.taxSetAsideRate)
      return { key, income, expenses, net, tax }
    })
  }, [data.income, data.expenses, data.settings.taxSetAsideRate, data.settings.nonDeductibleCategories, year])

  const totals = rows.reduce(
    (acc, row) => ({
      income: acc.income + row.income,
      expenses: acc.expenses + row.expenses,
      net: acc.net + row.net,
      tax: acc.tax + row.tax,
    }),
    { income: 0, expenses: 0, net: 0, tax: 0 },
  )

  return (
    <div className="card tax-year-table">
      <div className="tax-year-table__header">
        <h2>Tax year totals</h2>
        <div className="month-picker" role="group" aria-label="Select year">
          <button type="button" onClick={() => setYear((y) => y - 1)} aria-label="Previous year">
            &lsaquo;
          </button>
          <span className="month-picker__label">{year}</span>
          <button type="button" onClick={() => setYear((y) => y + 1)} aria-label="Next year">
            &rsaquo;
          </button>
        </div>
      </div>
      <p className="tax-year-table__hint">
        Japan's individual tax year runs January–December. Use this to see your running total for the year so far, and
        roughly how much tax you should have set aside in total.
      </p>
      <div className="data-table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th>Month</th>
              <th className="numeric">Income</th>
              <th className="numeric">Expenses</th>
              <th className="numeric">Net profit</th>
              <th className="numeric">Est. tax</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.key} className={row.key === thisMonthKey ? 'is-current-month' : ''}>
                <td>{shortMonthLabel(row.key)}</td>
                <td className="numeric">{formatYen(row.income)}</td>
                <td className="numeric">{formatYen(row.expenses)}</td>
                <td className="numeric">{formatYen(row.net)}</td>
                <td className="numeric">{formatYen(row.tax)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td>Total</td>
              <td className="numeric">{formatYen(totals.income)}</td>
              <td className="numeric">{formatYen(totals.expenses)}</td>
              <td className="numeric">{formatYen(totals.net)}</td>
              <td className="numeric">{formatYen(totals.tax)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  )
}

export default TaxYearTable
