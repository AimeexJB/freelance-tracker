import { useMemo, useState } from 'react'
import { useAppData } from '../../context/AppDataContext'
import Button from '../shared/Button'
import Modal from '../shared/Modal'
import ConfirmDialog from '../shared/ConfirmDialog'
import MonthPicker from '../shared/MonthPicker'
import RecurringTemplates from './RecurringTemplates'
import { currentMonthKey, monthKeyOf, formatDateDisplay, todayISO } from '../../utils/dates'
import { formatYen, toNumber } from '../../utils/currency'
import './ExpensesSection.scss'

function emptyExpense(categories, jobs) {
  return {
    date: todayISO(),
    category: categories[0] ?? '',
    amount: '',
    jobId: jobs[0]?.id ?? '',
    notes: '',
  }
}

function ExpensesSection() {
  const { data, expenses } = useAppData()
  const nonDeductibleCategories = data.settings.nonDeductibleCategories ?? []
  const [view, setView] = useState('ledger')
  const [monthKey, setMonthKey] = useState(currentMonthKey())
  const [formOpen, setFormOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(() => emptyExpense(data.settings.expenseCategories, data.jobs))
  const [confirmDeleteId, setConfirmDeleteId] = useState(null)

  const jobsById = useMemo(() => Object.fromEntries(data.jobs.map((job) => [job.id, job])), [data.jobs])

  const monthEntries = useMemo(
    () => data.expenses.filter((entry) => monthKeyOf(entry.date) === monthKey).sort((a, b) => (a.date < b.date ? 1 : -1)),
    [data.expenses, monthKey],
  )

  const monthTotal = monthEntries.reduce((sum, entry) => sum + toNumber(entry.amount), 0)

  function openAdd() {
    setEditingId(null)
    setForm(emptyExpense(data.settings.expenseCategories, data.jobs))
    setFormOpen(true)
  }

  function openEdit(entry) {
    setEditingId(entry.id)
    setForm({ date: entry.date, category: entry.category, amount: entry.amount, jobId: entry.jobId || '', notes: entry.notes || '' })
    setFormOpen(true)
  }

  function handleSubmit(event) {
    event.preventDefault()
    const payload = { ...form, amount: toNumber(form.amount) }
    if (!payload.amount || !payload.category) return
    if (editingId) {
      expenses.update(editingId, payload)
    } else {
      expenses.add(payload)
    }
    setFormOpen(false)
  }

  return (
    <section aria-labelledby="expenses-heading">
      <div className="section-header">
        <div>
          <h1 id="expenses-heading">Expenses</h1>
          <p>Everything you spend to do the work — fuel, fees, food, phone data, and anything recurring.</p>
        </div>
        {view === 'ledger' && (
          <div className="section-header__controls">
            <MonthPicker monthKey={monthKey} onChange={setMonthKey} />
            <Button onClick={openAdd}>+ Log expense</Button>
          </div>
        )}
      </div>

      <div className="view-toggle" role="tablist" aria-label="Expense views">
        <button
          role="tab"
          aria-selected={view === 'ledger'}
          className={view === 'ledger' ? 'is-active' : ''}
          onClick={() => setView('ledger')}
        >
          Ledger
        </button>
        <button
          role="tab"
          aria-selected={view === 'recurring'}
          className={view === 'recurring' ? 'is-active' : ''}
          onClick={() => setView('recurring')}
        >
          Recurring &amp; Quick-Add
        </button>
      </div>

      {view === 'ledger' ? (
        <>
          <div className="month-total-card month-total-card--expense">
            <span>Total this month</span>
            <strong>{formatYen(monthTotal)}</strong>
          </div>

          {monthEntries.length === 0 ? (
            <div className="empty-state">
              <strong>No expenses logged for this month yet</strong>
              Use the Recurring &amp; Quick-Add tab for one-click logging of regular costs like a per-shift car fee.
            </div>
          ) : (
            <div className="data-table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Category</th>
                    <th>Job / Client</th>
                    <th className="numeric">Amount</th>
                    <th>Notes</th>
                    <th className="actions">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {monthEntries.map((entry) => (
                    <tr key={entry.id}>
                      <td>{formatDateDisplay(entry.date)}</td>
                      <td>
                        <span className="pill pill--muted">{entry.category}</span>
                        {nonDeductibleCategories.includes(entry.category) && (
                          <span className="pill pill--warning category-pill-gap">Not deductible</span>
                        )}
                      </td>
                      <td>{jobsById[entry.jobId]?.name ?? '—'}</td>
                      <td className="numeric">{formatYen(entry.amount)}</td>
                      <td>{entry.notes}</td>
                      <td className="actions">
                        <button className="icon-btn" onClick={() => openEdit(entry)} aria-label={`Edit expense from ${formatDateDisplay(entry.date)}`}>
                          ✎
                        </button>
                        <button
                          className="icon-btn"
                          onClick={() => setConfirmDeleteId(entry.id)}
                          aria-label={`Delete expense from ${formatDateDisplay(entry.date)}`}
                        >
                          🗑
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      ) : (
        <RecurringTemplates monthKey={monthKey} />
      )}

      {formOpen && (
        <Modal title={editingId ? 'Edit expense' : 'Log expense'} onClose={() => setFormOpen(false)}>
          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className="field">
                <label htmlFor="expense-category">Category</label>
                <select id="expense-category" value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })}>
                  {data.settings.expenseCategories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label htmlFor="expense-job">Job / client (optional)</label>
                <select id="expense-job" value={form.jobId} onChange={(event) => setForm({ ...form, jobId: event.target.value })}>
                  <option value="">— None —</option>
                  {data.jobs.map((job) => (
                    <option key={job.id} value={job.id}>
                      {job.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label htmlFor="expense-date">Date</label>
                <input
                  id="expense-date"
                  type="date"
                  value={form.date}
                  onChange={(event) => setForm({ ...form, date: event.target.value })}
                  required
                />
              </div>
              <div className="field">
                <label htmlFor="expense-amount">Amount (JPY)</label>
                <input
                  id="expense-amount"
                  type="number"
                  min="0"
                  step="1"
                  value={form.amount}
                  onChange={(event) => setForm({ ...form, amount: event.target.value })}
                  required
                />
              </div>
              <div className="field field--full">
                <label htmlFor="expense-notes">Notes (optional)</label>
                <input id="expense-notes" value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} />
              </div>
            </div>
            <div className="form-actions">
              <Button type="button" variant="secondary" onClick={() => setFormOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">{editingId ? 'Save changes' : 'Log expense'}</Button>
            </div>
          </form>
        </Modal>
      )}

      {confirmDeleteId && (
        <ConfirmDialog
          message="This expense entry will be removed permanently."
          onCancel={() => setConfirmDeleteId(null)}
          onConfirm={() => {
            expenses.remove(confirmDeleteId)
            setConfirmDeleteId(null)
          }}
        />
      )}
    </section>
  )
}

export default ExpensesSection
