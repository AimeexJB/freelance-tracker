export const DEFAULT_EXPENSE_CATEGORIES = [
  'Fuel',
  'Vehicle / Car Fee',
  'Management Fee',
  'Food & Drinks',
  'Phone & Data',
  'Health Insurance (NHI)',
  'Rent',
  'Equipment & Supplies',
  'Professional & Admin Fees',
  'Other',
]

export const INCOME_TYPES = [
  { value: 'pay', label: 'Pay' },
  { value: 'reimbursement', label: 'Reimbursement' },
  { value: 'invoice', label: 'Invoice payment' },
  { value: 'other', label: 'Other' },
]

export function createSeedData() {
  const passionMonsterId = crypto.randomUUID()

  return {
    jobs: [
      {
        id: passionMonsterId,
        name: 'PassionMonster',
        currency: 'JPY',
        notes:
          'Amazon delivery driving. The management fee and car fee are already deducted before the pay hits your account, so the pay you log as Income is net of those — that\'s why the two templates below start deactivated (logging them separately would double-count).',
      },
    ],
    income: [],
    expenses: [],
    recurringExpenses: [
      {
        id: crypto.randomUUID(),
        name: 'PassionMonster Management Fee',
        category: 'Management Fee',
        amount: 5000,
        frequency: 'monthly',
        jobId: passionMonsterId,
        active: false,
        lastLoggedPeriod: null,
      },
      {
        id: crypto.randomUUID(),
        name: 'PassionMonster Car Fee',
        category: 'Vehicle / Car Fee',
        amount: 2200,
        frequency: 'asNeeded',
        jobId: passionMonsterId,
        active: false,
        lastLoggedPeriod: null,
      },
    ],
    timeEntries: [],
    invoices: [],
    settings: {
      taxSetAsideRate: 25,
      businessInfo: {
        name: '',
        address: '',
        email: '',
        bankDetails: '',
      },
      expenseCategories: DEFAULT_EXPENSE_CATEGORIES,
      // Ordinary personal meals aren't a deductible business expense in Japan
      // even when bought during a shift, so this starts excluded from the tax
      // estimate (it still counts toward the expense ledger/totals as normal).
      nonDeductibleCategories: ['Food & Drinks'],
      nextInvoiceNumber: 1,
    },
  }
}
