import { useRef, useState } from 'react'
import { useAppData } from '../../context/AppDataContext'
import Button from '../shared/Button'
import { todayISO } from '../../utils/dates'
import './SettingsSection.scss'

function SettingsSection() {
  const { data, updateSettings, addExpenseCategory, removeExpenseCategory, toggleCategoryDeductible, importData, resetData } = useAppData()
  const nonDeductibleCategories = data.settings.nonDeductibleCategories ?? []
  const [newCategory, setNewCategory] = useState('')
  const [importMessage, setImportMessage] = useState('')
  const fileInputRef = useRef(null)

  function handleBusinessInfoChange(field, value) {
    updateSettings({ businessInfo: { ...data.settings.businessInfo, [field]: value } })
  }

  function handleTaxRateChange(value) {
    const rate = Number(value)
    updateSettings({ taxSetAsideRate: Number.isFinite(rate) ? rate : 0 })
  }

  function handleAddCategory(event) {
    event.preventDefault()
    if (!newCategory.trim()) return
    addExpenseCategory(newCategory)
    setNewCategory('')
  }

  function handleExport() {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `freelance-tracker-backup-${todayISO()}.json`
    link.click()
    URL.revokeObjectURL(url)
  }

  function handleImportFile(event) {
    const file = event.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result)
        importData(parsed)
        setImportMessage('Backup imported successfully.')
      } catch {
        setImportMessage('That file could not be read as a valid backup.')
      }
    }
    reader.readAsText(file)
    event.target.value = ''
  }

  function handleReset() {
    if (window.confirm('This clears all data in this browser and reloads the starter setup. Export a backup first if you want to keep anything. Continue?')) {
      resetData()
    }
  }

  return (
    <section aria-labelledby="settings-heading">
      <div className="section-header">
        <div>
          <h1 id="settings-heading">Settings</h1>
          <p>Business info for invoices, your tax set-aside rate, and expense categories.</p>
        </div>
      </div>

      <div className="settings-grid">
        <div className="card">
          <h2>Business info</h2>
          <p className="card-hint">Shown on the "From" side of every invoice PDF you generate.</p>
          <div className="form-grid">
            <div className="field field--full">
              <label htmlFor="biz-name">Your name / business name</label>
              <input
                id="biz-name"
                value={data.settings.businessInfo.name}
                onChange={(event) => handleBusinessInfoChange('name', event.target.value)}
              />
            </div>
            <div className="field field--full">
              <label htmlFor="biz-address">Address</label>
              <input
                id="biz-address"
                value={data.settings.businessInfo.address}
                onChange={(event) => handleBusinessInfoChange('address', event.target.value)}
              />
            </div>
            <div className="field">
              <label htmlFor="biz-email">Email</label>
              <input
                id="biz-email"
                type="email"
                value={data.settings.businessInfo.email}
                onChange={(event) => handleBusinessInfoChange('email', event.target.value)}
              />
            </div>
            <div className="field field--full">
              <label htmlFor="biz-bank">Bank transfer details</label>
              <textarea
                id="biz-bank"
                rows={2}
                value={data.settings.businessInfo.bankDetails}
                onChange={(event) => handleBusinessInfoChange('bankDetails', event.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="card">
          <h2>Tax set-aside</h2>
          <p className="card-hint">
            Since your pay isn't taxed at source, set the percentage of net income (income minus expenses) you want to
            put aside for tax. This is an estimate to help you budget — not a filing figure. If you're unsure what rate
            to use in your first year, a tax office (税務署) or accountant (税理士) can advise.
          </p>
          <div className="field">
            <label htmlFor="tax-rate">Set-aside rate (%)</label>
            <input
              id="tax-rate"
              type="number"
              min="0"
              max="100"
              step="1"
              value={data.settings.taxSetAsideRate}
              onChange={(event) => handleTaxRateChange(event.target.value)}
            />
          </div>
        </div>

        <div className="card">
          <h2>Expense categories</h2>
          <p className="card-hint">
            Add your own, or remove ones you don't need. Uncheck "Deductible" for categories that aren't real tax
            deductions — like ordinary personal meals — so they still count toward your spending total but not toward
            the tax estimate.
          </p>
          <ul className="category-list">
            {data.settings.expenseCategories.map((category) => {
              const isDeductible = !nonDeductibleCategories.includes(category)
              return (
                <li key={category}>
                  <span>{category}</span>
                  <label className="category-list__deductible">
                    <input type="checkbox" checked={isDeductible} onChange={() => toggleCategoryDeductible(category)} />
                    Deductible
                  </label>
                  <button className="icon-btn" onClick={() => removeExpenseCategory(category)} aria-label={`Remove category ${category}`}>
                    🗑
                  </button>
                </li>
              )
            })}
          </ul>
          <form className="category-add" onSubmit={handleAddCategory}>
            <label htmlFor="new-category" className="visually-hidden">
              New category name
            </label>
            <input
              id="new-category"
              placeholder="New category name"
              value={newCategory}
              onChange={(event) => setNewCategory(event.target.value)}
            />
            <Button type="submit" size="sm">
              Add
            </Button>
          </form>
        </div>

        <div className="card">
          <h2>Backup &amp; restore</h2>
          <p className="card-hint">
            Everything is stored privately in this browser only — nothing is sent anywhere. Export a backup regularly, or
            before switching devices/browsers, then import it there to pick up where you left off.
          </p>
          <div className="backup-actions">
            <Button variant="secondary" onClick={handleExport}>
              Export backup (JSON)
            </Button>
            <Button variant="secondary" onClick={() => fileInputRef.current?.click()}>
              Import backup
            </Button>
            <input ref={fileInputRef} type="file" accept="application/json" className="visually-hidden" onChange={handleImportFile} />
          </div>
          {importMessage && (
            <p role="status" className="import-message">
              {importMessage}
            </p>
          )}
          <Button variant="danger" size="sm" onClick={handleReset}>
            Reset to starter data
          </Button>
        </div>
      </div>
    </section>
  )
}

export default SettingsSection
