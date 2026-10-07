import { useState } from 'react'
import { useAppData } from '../../context/AppDataContext'
import Button from '../shared/Button'
import Modal from '../shared/Modal'
import ConfirmDialog from '../shared/ConfirmDialog'
import { CURRENCIES, CURRENCY_CODES } from '../../utils/currency'
import './JobsSection.scss'

function emptyJob() {
  return { name: '', notes: '', currency: 'JPY' }
}

function JobsSection() {
  const { data, jobs } = useAppData()
  const [formOpen, setFormOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(emptyJob())
  const [confirmDeleteId, setConfirmDeleteId] = useState(null)

  function openAdd() {
    setEditingId(null)
    setForm(emptyJob())
    setFormOpen(true)
  }

  function openEdit(job) {
    setEditingId(job.id)
    setForm({ name: job.name, notes: job.notes || '', currency: job.currency || 'JPY' })
    setFormOpen(true)
  }

  function handleSubmit(event) {
    event.preventDefault()
    if (!form.name.trim()) return
    if (editingId) {
      jobs.update(editingId, form)
    } else {
      jobs.add(form)
    }
    setFormOpen(false)
  }

  return (
    <section aria-labelledby="jobs-heading">
      <div className="section-header">
        <div>
          <h1 id="jobs-heading">Jobs &amp; Clients</h1>
          <p>Every income source you work for lives here — your delivery job now, and any freelance clients later.</p>
        </div>
        <Button onClick={openAdd}>+ Add job or client</Button>
      </div>

      {data.jobs.length === 0 ? (
        <div className="empty-state">
          <strong>No jobs yet</strong>
          Add PassionMonster, or any other client, to start tracking income and expenses against it.
        </div>
      ) : (
        <div className="jobs-grid">
          {data.jobs.map((job) => (
            <article key={job.id} className="job-card">
              <div className="job-card__title">
                <h2>{job.name}</h2>
                <span className="pill pill--muted">{job.currency || 'JPY'}</span>
              </div>
              {job.notes && <p>{job.notes}</p>}
              <div className="job-card__actions">
                <Button variant="ghost" size="sm" onClick={() => openEdit(job)}>
                  Edit
                </Button>
                <Button variant="danger" size="sm" onClick={() => setConfirmDeleteId(job.id)}>
                  Delete
                </Button>
              </div>
            </article>
          ))}
        </div>
      )}

      {formOpen && (
        <Modal title={editingId ? 'Edit job / client' : 'Add job / client'} onClose={() => setFormOpen(false)}>
          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className="field field--full">
                <label htmlFor="job-name">Name</label>
                <input
                  id="job-name"
                  value={form.name}
                  onChange={(event) => setForm({ ...form, name: event.target.value })}
                  required
                />
              </div>
              <div className="field">
                <label htmlFor="job-currency">Currency they pay you in</label>
                <select id="job-currency" value={form.currency} onChange={(event) => setForm({ ...form, currency: event.target.value })}>
                  {CURRENCY_CODES.map((code) => (
                    <option key={code} value={code}>
                      {CURRENCIES[code].label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field field--full">
                <label htmlFor="job-notes">Notes (optional)</label>
                <textarea
                  id="job-notes"
                  rows={3}
                  value={form.notes}
                  onChange={(event) => setForm({ ...form, notes: event.target.value })}
                />
              </div>
            </div>
            <div className="form-actions">
              <Button type="button" variant="secondary" onClick={() => setFormOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">{editingId ? 'Save changes' : 'Add job'}</Button>
            </div>
          </form>
        </Modal>
      )}

      {confirmDeleteId && (
        <ConfirmDialog
          title="Delete this job/client?"
          message="This won't delete existing income or expense entries linked to it, but they'll show as unlinked."
          onCancel={() => setConfirmDeleteId(null)}
          onConfirm={() => {
            jobs.remove(confirmDeleteId)
            setConfirmDeleteId(null)
          }}
        />
      )}
    </section>
  )
}

export default JobsSection
