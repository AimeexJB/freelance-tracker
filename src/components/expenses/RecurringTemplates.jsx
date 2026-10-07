import { useMemo, useState } from 'react'
import { useAppData } from '../../context/AppDataContext'
import Button from '../shared/Button'
import Modal from '../shared/Modal'
import ConfirmDialog from '../shared/ConfirmDialog'
import { formatYen, toNumber } from '../../utils/currency'
import { todayISO } from '../../utils/dates'

function emptyTemplate(categories, jobs) {
  return {
    name: '',
    category: categories[0] ?? '',
    amount: '',
    frequency: 'monthly',
    jobId: jobs[0]?.id ?? '',
  }
}

function RecurringTemplates({ monthKey }) {
  const { data, recurringExpenses, logRecurringExpense } = useAppData()
  const [formOpen, setFormOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(() => emptyTemplate(data.settings.expenseCategories, data.jobs))
  const [confirmDeleteId, setConfirmDeleteId] = useState(null)
  const [logTarget, setLogTarget] = useState(null)
  const [logForm, setLogForm] = useState({ amount: '', date: todayISO() })

  const jobsById = useMemo(() => Object.fromEntries(data.jobs.map((job) => [job.id, job])), [data.jobs])
  const activeTemplates = useMemo(() => data.recurringExpenses.filter((template) => template.active !== false), [data.recurringExpenses])
  const inactiveTemplates = useMemo(() => data.recurringExpenses.filter((template) => template.active === false), [data.recurringExpenses])

  function openAdd() {
    setEditingId(null)
    setForm(emptyTemplate(data.settings.expenseCategories, data.jobs))
    setFormOpen(true)
  }

  function openEdit(template) {
    setEditingId(template.id)
    setForm({
      name: template.name,
      category: template.category,
      amount: template.amount,
      frequency: template.frequency,
      jobId: template.jobId || '',
    })
    setFormOpen(true)
  }

  function handleSubmit(event) {
    event.preventDefault()
    const payload = { ...form, amount: toNumber(form.amount) }
    if (!payload.name.trim() || !payload.amount) return
    if (editingId) {
      recurringExpenses.update(editingId, payload)
    } else {
      recurringExpenses.add({ ...payload, active: true, lastLoggedPeriod: null })
    }
    setFormOpen(false)
  }

  function openLog(template) {
    setLogTarget(template)
    setLogForm({ amount: template.amount, date: todayISO() })
  }

  function toggleActive(template) {
    recurringExpenses.update(template.id, { active: !template.active })
  }

  function handleLogSubmit(event) {
    event.preventDefault()
    logRecurringExpense(logTarget.id, {
      amount: toNumber(logForm.amount),
      date: logForm.date,
      period: monthKey,
    })
    setLogTarget(null)
  }

  return (
    <div className="recurring-panel">
      <p className="recurring-panel__intro">
        Set up anything you pay regularly — rent, National Health Insurance, a management fee — as <strong>monthly</strong>,
        or a one-click shortcut for costs that come up often but aren't on a fixed date — like a per-shift car fee — as{' '}
        <strong>as needed</strong>.
      </p>
      <div className="recurring-panel__header">
        <Button onClick={openAdd}>+ Add recurring / quick-add item</Button>
      </div>

      {data.recurringExpenses.length === 0 ? (
        <div className="empty-state">
          <strong>Nothing set up yet</strong>
          Try adding your rent or NHI payment as "monthly", or a per-shift cost as "as needed".
        </div>
      ) : (
        <>
          <div className="recurring-list">
            {activeTemplates.map((template) => {
              const isDueThisMonth = template.frequency === 'monthly' && template.lastLoggedPeriod !== monthKey
              return (
                <div className="recurring-item" key={template.id}>
                  <div className="recurring-item__info">
                    <div className="recurring-item__title">
                      <strong>{template.name}</strong>
                      {template.frequency === 'monthly' ? (
                        <span className={`pill ${isDueThisMonth ? 'pill--warning' : 'pill--success'}`}>
                          {isDueThisMonth ? 'Due this month' : 'Logged this month'}
                        </span>
                      ) : (
                        <span className="pill pill--muted">As needed</span>
                      )}
                    </div>
                    <div className="recurring-item__meta">
                      {template.category} · {formatYen(template.amount)}
                      {jobsById[template.jobId] ? ` · ${jobsById[template.jobId].name}` : ''}
                    </div>
                  </div>
                  <div className="recurring-item__actions">
                    <Button size="sm" onClick={() => openLog(template)}>
                      {template.frequency === 'monthly' ? 'Log it' : `+ Log ${formatYen(template.amount)}`}
                    </Button>
                    <button className="icon-btn" onClick={() => openEdit(template)} aria-label={`Edit ${template.name}`}>
                      ✎
                    </button>
                    <button className="icon-btn" onClick={() => toggleActive(template)} aria-label={`Deactivate ${template.name}`} title="Deactivate">
                      ⏸
                    </button>
                    <button className="icon-btn" onClick={() => setConfirmDeleteId(template.id)} aria-label={`Delete ${template.name}`}>
                      🗑
                    </button>
                  </div>
                </div>
              )
            })}
          </div>

          {inactiveTemplates.length > 0 && (
            <>
              <h3 className="recurring-list__inactive-heading">Inactive (not counted in your expenses)</h3>
              <div className="recurring-list recurring-list--inactive">
                {inactiveTemplates.map((template) => (
                  <div className="recurring-item recurring-item--inactive" key={template.id}>
                    <div className="recurring-item__info">
                      <div className="recurring-item__title">
                        <strong>{template.name}</strong>
                        <span className="pill pill--muted">Inactive</span>
                      </div>
                      <div className="recurring-item__meta">
                        {template.category} · {formatYen(template.amount)}
                        {jobsById[template.jobId] ? ` · ${jobsById[template.jobId].name}` : ''}
                      </div>
                    </div>
                    <div className="recurring-item__actions">
                      <Button size="sm" variant="secondary" onClick={() => toggleActive(template)}>
                        Reactivate
                      </Button>
                      <button className="icon-btn" onClick={() => openEdit(template)} aria-label={`Edit ${template.name}`}>
                        ✎
                      </button>
                      <button className="icon-btn" onClick={() => setConfirmDeleteId(template.id)} aria-label={`Delete ${template.name}`}>
                        🗑
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      )}

      {formOpen && (
        <Modal title={editingId ? 'Edit recurring item' : 'Add recurring / quick-add item'} onClose={() => setFormOpen(false)}>
          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className="field field--full">
                <label htmlFor="tmpl-name">Name</label>
                <input id="tmpl-name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required />
              </div>
              <div className="field">
                <label htmlFor="tmpl-category">Category</label>
                <select id="tmpl-category" value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })}>
                  {data.settings.expenseCategories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label htmlFor="tmpl-amount">Usual amount (JPY)</label>
                <input
                  id="tmpl-amount"
                  type="number"
                  min="0"
                  step="1"
                  value={form.amount}
                  onChange={(event) => setForm({ ...form, amount: event.target.value })}
                  required
                />
              </div>
              <div className="field">
                <label htmlFor="tmpl-frequency">Frequency</label>
                <select id="tmpl-frequency" value={form.frequency} onChange={(event) => setForm({ ...form, frequency: event.target.value })}>
                  <option value="monthly">Monthly (shows a "due" reminder)</option>
                  <option value="asNeeded">As needed (one-click shortcut)</option>
                </select>
              </div>
              <div className="field">
                <label htmlFor="tmpl-job">Job / client (optional)</label>
                <select id="tmpl-job" value={form.jobId} onChange={(event) => setForm({ ...form, jobId: event.target.value })}>
                  <option value="">— None —</option>
                  {data.jobs.map((job) => (
                    <option key={job.id} value={job.id}>
                      {job.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="form-actions">
              <Button type="button" variant="secondary" onClick={() => setFormOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">{editingId ? 'Save changes' : 'Add item'}</Button>
            </div>
          </form>
        </Modal>
      )}

      {logTarget && (
        <Modal title={`Log "${logTarget.name}"`} onClose={() => setLogTarget(null)}>
          <form onSubmit={handleLogSubmit}>
            <div className="form-grid">
              <div className="field">
                <label htmlFor="log-date">Date</label>
                <input
                  id="log-date"
                  type="date"
                  value={logForm.date}
                  onChange={(event) => setLogForm({ ...logForm, date: event.target.value })}
                  required
                />
              </div>
              <div className="field">
                <label htmlFor="log-amount">Amount (JPY)</label>
                <input
                  id="log-amount"
                  type="number"
                  min="0"
                  step="1"
                  value={logForm.amount}
                  onChange={(event) => setLogForm({ ...logForm, amount: event.target.value })}
                  required
                />
              </div>
            </div>
            <div className="form-actions">
              <Button type="button" variant="secondary" onClick={() => setLogTarget(null)}>
                Cancel
              </Button>
              <Button type="submit">Add to expenses</Button>
            </div>
          </form>
        </Modal>
      )}

      {confirmDeleteId && (
        <ConfirmDialog
          title="Delete this recurring item?"
          message="This only removes the template — any expenses already logged from it stay in your ledger."
          onCancel={() => setConfirmDeleteId(null)}
          onConfirm={() => {
            recurringExpenses.remove(confirmDeleteId)
            setConfirmDeleteId(null)
          }}
        />
      )}
    </div>
  )
}

export default RecurringTemplates
