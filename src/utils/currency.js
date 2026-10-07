export const CURRENCIES = {
  JPY: { code: 'JPY', label: 'Japanese Yen (¥)', symbol: '¥', locale: 'ja-JP', decimals: 0 },
  USD: { code: 'USD', label: 'US Dollar ($)', symbol: '$', locale: 'en-US', decimals: 2 },
  EUR: { code: 'EUR', label: 'Euro (€)', symbol: '€', locale: 'en-IE', decimals: 2 },
  GBP: { code: 'GBP', label: 'British Pound (£)', symbol: '£', locale: 'en-GB', decimals: 2 },
}

export const CURRENCY_CODES = Object.keys(CURRENCIES)

const formatterCache = {}

function getFormatter(code) {
  const meta = CURRENCIES[code] ?? CURRENCIES.JPY
  if (!formatterCache[meta.code]) {
    formatterCache[meta.code] = new Intl.NumberFormat(meta.locale, {
      style: 'currency',
      currency: meta.code,
      minimumFractionDigits: meta.decimals,
      maximumFractionDigits: meta.decimals,
    })
  }
  return formatterCache[meta.code]
}

export function formatCurrency(amount, code = 'JPY') {
  const value = Number(amount)
  return getFormatter(code).format(Number.isFinite(value) ? value : 0)
}

// JPY is the base/tracking currency for the dashboard and tax estimate.
export function formatYen(amount) {
  return formatCurrency(amount, 'JPY')
}

export function toNumber(value) {
  const n = Number(value)
  return Number.isFinite(n) ? n : 0
}

// Income can be logged in a foreign currency; amountJpy is the converted figure
// used everywhere totals are aggregated (dashboard, tax estimate, yearly table).
export function incomeAmountJpy(entry) {
  return toNumber(entry.amountJpy ?? entry.amount)
}
