import { useMemo, useState } from 'react'
import { useAppData } from '../../context/AppDataContext'
import Modal from '../shared/Modal'
import Button from '../shared/Button'
import { todayISO } from '../../utils/dates'
import { formatCurrency, toNumber } from '../../utils/currency'
import { downloadInvoicePdf } from './invoicePdf'
import './InvoicesSection.scss'

function InvoiceBuilderModal({ onClose }) {
  const { data, createInvoice } = useAppData()
  const [clientId, setClientId] = useState(data.jobs[0]?.id ?? '')
  const [issueDate, setIssueDate] = useState(todayISO())
  const [dueDate, setDueDate] = useState(todayISO())
  const [notes, setNotes] = useState('')
  const [selectedTimeEntryIds, setSelectedTimeEntryIds] = useState([])
  const [manualItems, setManualItems] = useState([])

  const unbilledEntries = useMemo(
    () => data.timeEntries.filter((entry) => entry.clientId === clientId && !entry.invoiced),
    [data.timeEntries, clientId],
  )

  function toggleEntry(id) {
    setSelectedTimeEntryIds((prev) => (prev.includes(id) ? prev.filter((existing) => existing !== id) : [...prev, id]))
  }

  function addManualItem() {
    setManualItems((prev) => [...prev, { id: crypto.randomUUID(), description: '', quantity: 1, rate: 0 }])
  }

  function updateManualItem(id, fields) {
    setManualItems((prev) => prev.map((item) => (item.id === id ? { ...item, ...fields } : item)))
  }

  function removeManualItem(id) {
    setManualItems((prev) => prev.filter((item) => item.id !== id))
  }

  const lineItems = useMemo(() => {
    const fromTime = data.timeEntries
      .filter((entry) => selectedTimeEntryIds.includes(entry.id))
      .map((entry) => ({
        description: `${entry.description} (${entry.date})`,
        quantity: toNumber(entry.hours),
        rate: toNumber(entry.rate),
      }))
    const fromManual = manualItems
      .filter((item) => item.description.trim())
      .map((item) => ({
        description: item.description,
        quantity: toNumber(item.quantity),
        rate: toNumber(item.rate),
      }))
    return [...fromTime, ...fromManual]
  }, [data.timeEntries, selectedTimeEntryIds, manualItems])

  const total = lineItems.reduce((sum, item) => sum + item.quantity * item.rate, 0)
  const client = data.jobs.find((job) => job.id === clientId)
  const currency = client?.currency || 'JPY'

  function handleSubmit(event) {
    event.preventDefault()
    if (!clientId || lineItems.length === 0) return
    const invoiceFields = {
      clientId,
      issueDate,
      dueDate,
      lineItems,
      notes,
      currency,
      timeEntryIds: selectedTimeEntryIds,
    }
    const invoiceNumber = `INV-${String(data.settings.nextInvoiceNumber).padStart(4, '0')}`
    createInvoice(invoiceFields)
    downloadInvoicePdf({ ...invoiceFields, invoiceNumber }, client, data.settings.businessInfo)
    onClose()
  }

  return (
    <Modal title="Create invoice" onClose={onClose} wide>
      <form onSubmit={handleSubmit} className="invoice-builder">
        <div className="form-grid">
          <div className="field">
            <label htmlFor="inv-client">Client</label>
            <select
              id="inv-client"
              value={clientId}
              onChange={(event) => {
                setClientId(event.target.value)
                setSelectedTimeEntryIds([])
              }}
              required
            >
              <option value="">— Select —</option>
              {data.jobs.map((job) => (
                <option key={job.id} value={job.id}>
                  {job.name} ({job.currency || 'JPY'})
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="inv-issue">Issue date</label>
            <input id="inv-issue" type="date" value={issueDate} onChange={(event) => setIssueDate(event.target.value)} required />
          </div>
          <div className="field">
            <label htmlFor="inv-due">Due date</label>
            <input id="inv-due" type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} required />
          </div>
        </div>

        {unbilledEntries.length > 0 && (
          <fieldset>
            <legend>Unbilled time entries for this client</legend>
            {unbilledEntries.map((entry) => (
              <label key={entry.id} className="invoice-builder__entry-check">
                <input type="checkbox" checked={selectedTimeEntryIds.includes(entry.id)} onChange={() => toggleEntry(entry.id)} />
                {entry.date} · {entry.description} · {entry.hours}h @ {formatCurrency(entry.rate, currency)}
              </label>
            ))}
          </fieldset>
        )}

        <fieldset>
          <legend>Manual line items</legend>
          {manualItems.map((item) => (
            <div className="invoice-builder__manual-row" key={item.id}>
              <input
                aria-label="Line item description"
                placeholder="Description"
                value={item.description}
                onChange={(event) => updateManualItem(item.id, { description: event.target.value })}
              />
              <input
                aria-label="Quantity"
                type="number"
                min="0"
                step="0.25"
                placeholder="Qty"
                value={item.quantity}
                onChange={(event) => updateManualItem(item.id, { quantity: event.target.value })}
              />
              <input
                aria-label={`Rate (${currency})`}
                type="number"
                min="0"
                step="1"
                placeholder={`Rate (${currency})`}
                value={item.rate}
                onChange={(event) => updateManualItem(item.id, { rate: event.target.value })}
              />
              <button type="button" className="icon-btn" onClick={() => removeManualItem(item.id)} aria-label="Remove line item">
                🗑
              </button>
            </div>
          ))}
          <Button type="button" variant="ghost" size="sm" onClick={addManualItem}>
            + Add line item
          </Button>
        </fieldset>

        <div className="field field--full">
          <label htmlFor="inv-notes">Notes / payment details (optional)</label>
          <textarea id="inv-notes" rows={2} value={notes} onChange={(event) => setNotes(event.target.value)} />
        </div>

        <div className="invoice-builder__total">
          <span>Total ({currency})</span>
          <strong>{formatCurrency(total, currency)}</strong>
        </div>

        <div className="form-actions">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={!clientId || lineItems.length === 0}>
            Generate PDF &amp; save
          </Button>
        </div>
      </form>
    </Modal>
  )
}

export default InvoiceBuilderModal
