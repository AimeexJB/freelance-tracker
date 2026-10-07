import { useMemo, useState } from 'react'
import { useAppData } from '../../context/AppDataContext'
import Button from '../shared/Button'
import Modal from '../shared/Modal'
import ConfirmDialog from '../shared/ConfirmDialog'
import { formatDateDisplay, todayISO } from '../../utils/dates'
import { formatCurrency, toNumber } from '../../utils/currency'
import { downloadInvoicePdf } from './invoicePdf'
import './InvoicesSection.scss'

function emptyTimeEntry(jobs) {
  return {
    clientId: jobs[0]?.id ?? '',
    date: todayISO(),
    description: '',
    hours: '',
    rate: '',
  }
}

function InvoicesSection({ onCreateInvoice }) {
  const { data, timeEntries } = useAppData()
  const [formOpen, setFormOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(() => emptyTimeEntry(data.jobs))
  const [confirmDeleteId, setConfirmDeleteId] = useState(null)

  const jobsById = useMemo(() => Object.fromEntries(data.jobs.map((job) => [job.id, job])), [data.jobs])
  const sortedTimeEntries = useMemo(() => [...data.timeEntries].sort((a, b) => (a.date < b.date ? 1 : -1)), [data.timeEntries])
  const sortedInvoices = useMemo(() => [...data.invoices].sort((a, b) => (a.issueDate < b.issueDate ? 1 : -1)), [data.invoices])

  function openAdd() {
    setEditingId(null)
    setForm(emptyTimeEntry(data.jobs))
    setFormOpen(true)
  }

  function openEdit(entry) {
    setEditingId(entry.id)
    setForm({ clientId: entry.clientId || '', date: entry.date, description: entry.description, hours: entry.hours, rate: entry.rate })
    setFormOpen(true)
  }

  function handleSubmit(event) {
    event.preventDefault()
    const payload = { ...form, hours: toNumber(form.hours), rate: toNumber(form.rate) }
    if (!payload.hours || !payload.clientId) return
    if (editingId) {
      timeEntries.update(editingId, payload)
    } else {
      timeEntries.add({ ...payload, invoiced: false, invoiceId: null })
    }
    setFormOpen(false)
  }

  return (
    <section aria-labelledby="invoices-heading">
      <div className="section-header">
        <div>
          <h1 id="invoices-heading">Time &amp; Invoices</h1>
          <p>Log billable hours per client, then bundle unbilled time into a PDF invoice.</p>
        </div>
        <div className="section-header__controls">
          <Button variant="secondary" onClick={openAdd}>
            + Log time
          </Button>
          <Button onClick={onCreateInvoice}>+ Create invoice</Button>
        </div>
      </div>

      <h2 className="subsection-title">Time entries</h2>
      {sortedTimeEntries.length === 0 ? (
        <div className="empty-state">
          <strong>No time logged yet</strong>
          Log hours against a client here, then create an invoice to bill them.
        </div>
      ) : (
        <div className="data-table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Client</th>
                <th>Description</th>
                <th className="numeric">Hours</th>
                <th className="numeric">Rate</th>
                <th className="numeric">Amount</th>
                <th>Status</th>
                <th className="actions">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedTimeEntries.map((entry) => {
                const currency = jobsById[entry.clientId]?.currency || 'JPY'
                return (
                  <tr key={entry.id}>
                    <td>{formatDateDisplay(entry.date)}</td>
                    <td>{jobsById[entry.clientId]?.name ?? '—'}</td>
                    <td>{entry.description}</td>
                    <td className="numeric">{entry.hours}</td>
                    <td className="numeric">{formatCurrency(entry.rate, currency)}</td>
                    <td className="numeric">{formatCurrency(toNumber(entry.hours) * toNumber(entry.rate), currency)}</td>
                    <td>
                      {entry.invoiced ? (
                        <span className="pill pill--success">Invoiced</span>
                      ) : (
                        <span className="pill pill--muted">Unbilled</span>
                      )}
                    </td>
                    <td className="actions">
                      {!entry.invoiced && (
                        <button className="icon-btn" onClick={() => openEdit(entry)} aria-label={`Edit time entry for ${entry.description}`}>
                          ✎
                        </button>
                      )}
                      <button
                        className="icon-btn"
                        onClick={() => setConfirmDeleteId(entry.id)}
                        aria-label={`Delete time entry for ${entry.description}`}
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

      <h2 className="subsection-title">Invoices</h2>
      {sortedInvoices.length === 0 ? (
        <div className="empty-state">
          <strong>No invoices yet</strong>
          Use "+ Create invoice" to bundle unbilled time (or manual line items) into a PDF.
        </div>
      ) : (
        <div className="data-table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Invoice #</th>
                <th>Client</th>
                <th>Issue date</th>
                <th>Due date</th>
                <th className="numeric">Total</th>
                <th className="actions">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedInvoices.map((invoice) => {
                const total = invoice.lineItems.reduce((sum, item) => sum + toNumber(item.quantity) * toNumber(item.rate), 0)
                return (
                  <tr key={invoice.id}>
                    <td>{invoice.invoiceNumber}</td>
                    <td>{jobsById[invoice.clientId]?.name ?? '—'}</td>
                    <td>{formatDateDisplay(invoice.issueDate)}</td>
                    <td>{formatDateDisplay(invoice.dueDate)}</td>
                    <td className="numeric">{formatCurrency(total, invoice.currency || 'JPY')}</td>
                    <td className="actions">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => downloadInvoicePdf(invoice, jobsById[invoice.clientId], data.settings.businessInfo)}
                      >
                        Download PDF
                      </Button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {formOpen && (
        <Modal title={editingId ? 'Edit time entry' : 'Log time'} onClose={() => setFormOpen(false)}>
          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className="field">
                <label htmlFor="time-client">Client</label>
                <select id="time-client" value={form.clientId} onChange={(event) => setForm({ ...form, clientId: event.target.value })} required>
                  <option value="">— Select —</option>
                  {data.jobs.map((job) => (
                    <option key={job.id} value={job.id}>
                      {job.name} ({job.currency || 'JPY'})
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label htmlFor="time-date">Date</label>
                <input id="time-date" type="date" value={form.date} onChange={(event) => setForm({ ...form, date: event.target.value })} required />
              </div>
              <div className="field">
                <label htmlFor="time-hours">Hours</label>
                <input
                  id="time-hours"
                  type="number"
                  min="0"
                  step="0.25"
                  value={form.hours}
                  onChange={(event) => setForm({ ...form, hours: event.target.value })}
                  required
                />
              </div>
              <div className="field">
                <label htmlFor="time-rate">Rate per hour ({jobsById[form.clientId]?.currency || 'JPY'})</label>
                <input
                  id="time-rate"
                  type="number"
                  min="0"
                  step="1"
                  value={form.rate}
                  onChange={(event) => setForm({ ...form, rate: event.target.value })}
                  required
                />
              </div>
              <div className="field field--full">
                <label htmlFor="time-description">Description</label>
                <input
                  id="time-description"
                  value={form.description}
                  onChange={(event) => setForm({ ...form, description: event.target.value })}
                  required
                />
              </div>
            </div>
            <div className="form-actions">
              <Button type="button" variant="secondary" onClick={() => setFormOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">{editingId ? 'Save changes' : 'Log time'}</Button>
            </div>
          </form>
        </Modal>
      )}

      {confirmDeleteId && (
        <ConfirmDialog
          message="This time entry will be removed permanently."
          onCancel={() => setConfirmDeleteId(null)}
          onConfirm={() => {
            timeEntries.remove(confirmDeleteId)
            setConfirmDeleteId(null)
          }}
        />
      )}
    </section>
  )
}

export default InvoicesSection
