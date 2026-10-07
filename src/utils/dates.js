import { format, parseISO, subMonths } from 'date-fns'

export function monthKeyOf(dateInput) {
  const date = typeof dateInput === 'string' ? parseISO(dateInput) : dateInput
  return format(date, 'yyyy-MM')
}

export function monthLabel(monthKey) {
  return format(parseISO(`${monthKey}-01`), 'MMMM yyyy')
}

export function shortMonthLabel(monthKey) {
  return format(parseISO(`${monthKey}-01`), 'MMM yyyy')
}

export function currentMonthKey() {
  return monthKeyOf(new Date())
}

export function lastNMonthKeys(n, fromMonthKey = currentMonthKey()) {
  const base = parseISO(`${fromMonthKey}-01`)
  const keys = []
  for (let i = n - 1; i >= 0; i -= 1) {
    keys.push(monthKeyOf(subMonths(base, i)))
  }
  return keys
}

export function todayISO() {
  return format(new Date(), 'yyyy-MM-dd')
}

export function yearOf(dateStr) {
  return Number(dateStr.slice(0, 4))
}

export function currentYear() {
  return new Date().getFullYear()
}

// Japan's individual tax year is the calendar year (Jan–Dec).
export function monthKeysOfYear(year) {
  return Array.from({ length: 12 }, (_, i) => `${year}-${String(i + 1).padStart(2, '0')}`)
}

export function formatDateDisplay(dateStr) {
  if (!dateStr) return ''
  return format(parseISO(dateStr), 'd MMM yyyy')
}
