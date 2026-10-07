import { createContext, useCallback, useContext, useMemo } from 'react'
import { useLocalStorage } from '../hooks/useLocalStorage'
import { createSeedData } from '../utils/seedData'
import { todayISO } from '../utils/dates'

const STORAGE_KEY = 'freelanceTracker.data.v1'

const AppDataContext = createContext(null)

export function AppDataProvider({ children }) {
  const [data, setData] = useLocalStorage(STORAGE_KEY, createSeedData)

  const patch = useCallback(
    (updater) => {
      setData((prev) => (typeof updater === 'function' ? updater(prev) : { ...prev, ...updater }))
    },
    [setData],
  )

  const makeCrud = useCallback(
    (collectionKey) => ({
      add: (item) => {
        const withId = { id: crypto.randomUUID(), ...item }
        patch((prev) => ({ ...prev, [collectionKey]: [...prev[collectionKey], withId] }))
        return withId.id
      },
      update: (id, fields) => {
        patch((prev) => ({
          ...prev,
          [collectionKey]: prev[collectionKey].map((item) => (item.id === id ? { ...item, ...fields } : item)),
        }))
      },
      remove: (id) => {
        patch((prev) => ({
          ...prev,
          [collectionKey]: prev[collectionKey].filter((item) => item.id !== id),
        }))
      },
    }),
    [patch],
  )

  const jobs = useMemo(() => makeCrud('jobs'), [makeCrud])
  const income = useMemo(() => makeCrud('income'), [makeCrud])
  const expenses = useMemo(() => makeCrud('expenses'), [makeCrud])
  const recurringExpenses = useMemo(() => makeCrud('recurringExpenses'), [makeCrud])
  const timeEntries = useMemo(() => makeCrud('timeEntries'), [makeCrud])
  const invoices = useMemo(() => makeCrud('invoices'), [makeCrud])

  const updateSettings = useCallback(
    (fields) => {
      patch((prev) => ({ ...prev, settings: { ...prev.settings, ...fields } }))
    },
    [patch],
  )

  const addExpenseCategory = useCallback(
    (name) => {
      const trimmed = name.trim()
      if (!trimmed) return
      patch((prev) =>
        prev.settings.expenseCategories.includes(trimmed)
          ? prev
          : {
              ...prev,
              settings: {
                ...prev.settings,
                expenseCategories: [...prev.settings.expenseCategories, trimmed],
              },
            },
      )
    },
    [patch],
  )

  const removeExpenseCategory = useCallback(
    (name) => {
      patch((prev) => ({
        ...prev,
        settings: {
          ...prev.settings,
          expenseCategories: prev.settings.expenseCategories.filter((category) => category !== name),
          nonDeductibleCategories: (prev.settings.nonDeductibleCategories ?? []).filter((category) => category !== name),
        },
      }))
    },
    [patch],
  )

  const toggleCategoryDeductible = useCallback(
    (name) => {
      patch((prev) => {
        const current = prev.settings.nonDeductibleCategories ?? []
        const nonDeductibleCategories = current.includes(name) ? current.filter((category) => category !== name) : [...current, name]
        return { ...prev, settings: { ...prev.settings, nonDeductibleCategories } }
      })
    },
    [patch],
  )

  // Logs a recurring expense template into the real expense ledger, and (for
  // monthly templates) stamps the period so the "due this month" reminder clears.
  const logRecurringExpense = useCallback(
    (templateId, overrides = {}) => {
      patch((prev) => {
        const template = prev.recurringExpenses.find((item) => item.id === templateId)
        if (!template) return prev

        const entry = {
          id: crypto.randomUUID(),
          date: overrides.date ?? todayISO(),
          category: overrides.category ?? template.category,
          amount: overrides.amount ?? template.amount,
          jobId: overrides.jobId ?? template.jobId ?? '',
          notes: overrides.notes ?? template.name,
        }

        return {
          ...prev,
          expenses: [...prev.expenses, entry],
          recurringExpenses:
            template.frequency === 'monthly'
              ? prev.recurringExpenses.map((item) =>
                  item.id === templateId ? { ...item, lastLoggedPeriod: overrides.period } : item,
                )
              : prev.recurringExpenses,
        }
      })
    },
    [patch],
  )

  const createInvoice = useCallback(
    (invoiceFields) => {
      let newId = null
      patch((prev) => {
        const invoiceNumber = `INV-${String(prev.settings.nextInvoiceNumber).padStart(4, '0')}`
        newId = crypto.randomUUID()
        const invoice = { id: newId, invoiceNumber, status: 'draft', ...invoiceFields }
        return {
          ...prev,
          invoices: [...prev.invoices, invoice],
          timeEntries: prev.timeEntries.map((entry) =>
            invoiceFields.timeEntryIds?.includes(entry.id) ? { ...entry, invoiced: true, invoiceId: newId } : entry,
          ),
          settings: { ...prev.settings, nextInvoiceNumber: prev.settings.nextInvoiceNumber + 1 },
        }
      })
      return newId
    },
    [patch],
  )

  const importData = useCallback(
    (newData) => {
      setData(newData)
    },
    [setData],
  )

  const resetData = useCallback(() => {
    setData(createSeedData())
  }, [setData])

  const value = useMemo(
    () => ({
      data,
      jobs,
      income,
      expenses,
      recurringExpenses,
      timeEntries,
      invoices,
      updateSettings,
      addExpenseCategory,
      removeExpenseCategory,
      toggleCategoryDeductible,
      logRecurringExpense,
      createInvoice,
      importData,
      resetData,
    }),
    [
      data,
      jobs,
      income,
      expenses,
      recurringExpenses,
      timeEntries,
      invoices,
      updateSettings,
      addExpenseCategory,
      removeExpenseCategory,
      toggleCategoryDeductible,
      logRecurringExpense,
      createInvoice,
      importData,
      resetData,
    ],
  )

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>
}

export function useAppData() {
  const ctx = useContext(AppDataContext)
  if (!ctx) throw new Error('useAppData must be used within an AppDataProvider')
  return ctx
}
