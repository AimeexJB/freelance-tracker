import { useMemo, useState } from 'react'
import { useAppData } from '../../context/AppDataContext'
import Button from '../shared/Button'
import Modal from '../shared/Modal'
import ConfirmDialog from '../shared/ConfirmDialog'
import MonthPicker from '../shared/MonthPicker'
import { currentMonthKey, monthKeyOf, formatDateDisplay, todayISO } from '../../utils/dates'
import { CURRENCIES, CURRENCY_CODES, formatCurrency, formatYen, toNumber } from '../../utils/currency'
import { INCOME_TYPES } from '../../utils/seedData'

function emptyIncome(jobs) {
  const job = jobs[0]
  return {
    jobId: job?.id ?? '',
    date: todayISO(),
    amount: '',
    currency: job?.currency || 'JPY',
    exchangeRate: 1,
    type: 'pay',
    notes: '',
  }
}

function IncomeSection() {
  const { data, income } = useAppData()
  const [monthKey, setMonthKey] = useState(currentMonthKey())
  const [formOpen, setFormOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(() => emptyIncome(data.jobs))
  const [confirmDeleteId, setConfirmDeleteId] = useState(null)

  const jobsById = useMemo(() => Object.fromEntries(data.jobs.map((job) => [job.id, job])), [data.jobs])

  const monthEntries = useMemo(
    () => data.income.filter((entry) => monthKeyOf(entry.date) === monthKey).sort((a, b) => (a.date < b.date ? 1 : -1)),
    [data.income, monthKey],
  )

  const monthTotal = monthEntries.reduce((sum, entry) => sum + toNumber(entry.amountJpy ?? entry.amount), 0)

  function openAdd() {
    setEditingId(null)
    setForm(emptyIncome(data.jobs))
    setFormOpen(true)
  }

  function openEdit(entry) {
    setEditingId(entry.id)
    setForm({
      jobId: entry.jobId || '',
      date: entry.date,
      amount: entry.amount,
      currency: entry.currency || 'JPY',
      exchangeRate: entry.exchangeRate ?? 1,
      type: entry.type,
      notes: entry.notes || '',
    })
    setFormOpen(true)
  }

  function handleJobChange(jobId) {
    const job = jobsById[jobId]
    setForm((prev) => ({ ...prev, jobId, currency: job?.currency || prev.currency }))
  }

  function handleSubmit(event) {
    event.preventDefault()
    const amount = toNumber(form.amount)
    const rate = form.currency === 'JPY' ? 1 : toNumber(form.exchangeRate)
    if (!amount) return
    const payload = {
      jobId: form.jobId,
      date: form.date,
      type: form.type,
      notes: form.notes,
      amount,
      currency: form.currency,
      exchangeRate: rate,
      amountJpy: form.currency === 'JPY' ? amount : Math.round(amount * rate),
    }
    if (editingId) {
      income.update(editingId, payload)
    } else {
      income.add(payload)
    }
    setFormOpen(false)
  }

  const previewJpy = form.currency === 'JPY' ? toNumber(form.amount) : Math.round(toNumber(form.amount) * toNumber(form.exchangeRate))

  return (
    <section aria-labelledby="income-heading">
      <div className="section-header">
        <div>
          <h1 id="income-heading">Income</h1>
          <p>Log what actually lands in your account — monthly pay, reimbursements, or invoice payments.</p>
        </div>
        <div className="section-header__controls">
          <MonthPicker monthKey={monthKey} onChange={setMonthKey} />
          <Button onClick={openAdd}>+ Log income</Button>
        </div>
      </div>

      <div className="month-total-card month-total-card--income">
        <span>Total this month (JPY equivalent)</span>
        <strong>{formatYen(monthTotal)}</strong>
      </div>

      {monthEntries.length === 0 ? (
        <div className="empty-state">
          <strong>No income logged for this month yet</strong>
          Once your pay lands, log it here and the dashboard/tax estimate will update automatically.
        </div>
      ) : (
        <div className="data-table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Job / Client</th>
                <th>Type</th>
                <th className="numeric">Amount</th>
                <th>Notes</th>
                <th className="actions">Actions</th>
              </tr>
            </thead>
            <tbody>
              {monthEntries.map((entry) => {
                const currency = entry.currency || 'JPY'
                return (
                  <tr key={entry.id}>
                    <td>{formatDateDisplay(entry.date)}</td>
                    <td>{jobsById[entry.jobId]?.name ?? '—'}</td>
                    <td>
                      <span className="pill pill--muted">
                        {INCOME_TYPES.find((type) => type.value === entry.type)?.label ?? entry.type}
                      </span>
                    </td>
                    <td className="numeric">
                      {formatCurrency(entry.amount, currency)}
                      {currency !== 'JPY' && <div className="amount-subtext">≈ {formatYen(entry.amountJpy)}</div>}
                    </td>
                    <td>{entry.notes}</td>
                    <td className="actions">
                      <button className="icon-btn" onClick={() => openEdit(entry)} aria-label={`Edit income from ${formatDateDisplay(entry.date)}`}>
                        ✎
                      </button>
                      <button
                        className="icon-btn"
                        onClick={() => setConfirmDeleteId(entry.id)}
                        aria-label={`Delete income from ${formatDateDisplay(entry.date)}`}
                      >
                        🗑
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {formOpen && (
        <Modal title={editingId ? 'Edit income' : 'Log income'} onClose={() => setFormOpen(false)}>
          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className="field">
                <label htmlFor="income-job">Job / client</label>
                <select id="income-job" value={form.jobId} onChange={(event) => handleJobChange(event.target.value)}>
                  <option value="">— None —</option>
                  {data.jobs.map((job) => (
                    <option key={job.id} value={job.id}>
                      {job.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label htmlFor="income-type">Type</label>
                <select id="income-type" value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value })}>
                  {INCOME_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label htmlFor="income-date">Date</label>
                <input
                  id="income-date"
                  type="date"
                  value={form.date}
                  onChange={(event) => setForm({ ...form, date: event.target.value })}
                  required
                />
              </div>
              <div className="field">
                <label htmlFor="income-currency">Currency received</label>
                <select
                  id="income-currency"
                  value={form.currency}
                  onChange={(event) => setForm({ ...form, currency: event.target.value })}
                >
                  {CURRENCY_CODES.map((code) => (
                    <option key={code} value={code}>
                      {CURRENCIES[code].label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label htmlFor="income-amount">Amount ({form.currency})</label>
                <input
                  id="income-amount"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.amount}
                  onChange={(event) => setForm({ ...form, amount: event.target.value })}
                  required
                />
              </div>
              {form.currency !== 'JPY' && (
                <div className="field">
                  <label htmlFor="income-rate">Exchange rate (JPY per 1 {form.currency})</label>
                  <input
                    id="income-rate"
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.exchangeRate}
                    onChange={(event) => setForm({ ...form, exchangeRate: event.target.value })}
                    required
                  />
                </div>
              )}
              <div className="field field--full">
                <label htmlFor="income-notes">Notes (optional)</label>
                <input id="income-notes" value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} />
              </div>
            </div>
            {form.currency !== 'JPY' && (
              <p className="conversion-preview">
                ≈ <strong>{formatYen(previewJpy)}</strong> at this rate — this is the figure used for your dashboard totals and tax
                estimate.
              </p>
            )}
            <div className="form-actions">
              <Button type="button" variant="secondary" onClick={() => setFormOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">{editingId ? 'Save changes' : 'Log income'}</Button>
            </div>
          </form>
        </Modal>
      )}

      {confirmDeleteId && (
        <ConfirmDialog
          message="This income entry will be removed permanently."
          onCancel={() => setConfirmDeleteId(null)}
          onConfirm={() => {
            income.remove(confirmDeleteId)
            setConfirmDeleteId(null)
          }}
        />
      )}
    </section>
  )
}

export default IncomeSection
