import { useState } from 'react'
import { AppDataProvider } from './context/AppDataContext'
import NavBar from './components/layout/NavBar'
import Dashboard from './components/dashboard/Dashboard'
import IncomeSection from './components/income/IncomeSection'
import ExpensesSection from './components/expenses/ExpensesSection'
import JobsSection from './components/jobs/JobsSection'
import InvoicesSection from './components/invoices/InvoicesSection'
import SettingsSection from './components/settings/SettingsSection'
import InvoiceBuilderModal from './components/invoices/InvoiceBuilderModal'

const TABS = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'income', label: 'Income' },
  { id: 'expenses', label: 'Expenses' },
  { id: 'jobs', label: 'Jobs & Clients' },
  { id: 'invoices', label: 'Time & Invoices' },
  { id: 'settings', label: 'Settings' },
]

function App() {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [invoiceModalOpen, setInvoiceModalOpen] = useState(false)

  return (
    <AppDataProvider>
      <div className="app-shell">
        <NavBar tabs={TABS} activeTab={activeTab} onTabChange={setActiveTab} onCreateInvoice={() => setInvoiceModalOpen(true)} />
        <main className="app-main" id="main-content">
          <div role="tabpanel" id={`panel-${activeTab}`} aria-labelledby={`tab-${activeTab}`} tabIndex={-1}>
            {activeTab === 'dashboard' && <Dashboard />}
            {activeTab === 'income' && <IncomeSection />}
            {activeTab === 'expenses' && <ExpensesSection />}
            {activeTab === 'jobs' && <JobsSection />}
            {activeTab === 'invoices' && <InvoicesSection onCreateInvoice={() => setInvoiceModalOpen(true)} />}
            {activeTab === 'settings' && <SettingsSection />}
          </div>
        </main>
        {invoiceModalOpen && <InvoiceBuilderModal onClose={() => setInvoiceModalOpen(false)} />}
      </div>
    </AppDataProvider>
  )
}

export default App
