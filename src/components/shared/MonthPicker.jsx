import { addMonths, parseISO } from 'date-fns'
import { monthKeyOf, monthLabel } from '../../utils/dates'
import './MonthPicker.scss'

function MonthPicker({ monthKey, onChange }) {
  function shift(delta) {
    const base = parseISO(`${monthKey}-01`)
    const next = addMonths(base, delta)
    // monthKeyOf formats in local time — next.toISOString() would convert to
    // UTC first, which rolls the date into the wrong month for timezones
    // ahead of UTC (e.g. JST) once the local time is past UTC's month-end.
    onChange(monthKeyOf(next))
  }

  return (
    <div className="month-picker" role="group" aria-label="Select month">
      <button type="button" onClick={() => shift(-1)} aria-label="Previous month">
        &lsaquo;
      </button>
      <span className="month-picker__label">{monthLabel(monthKey)}</span>
      <button type="button" onClick={() => shift(1)} aria-label="Next month">
        &rsaquo;
      </button>
    </div>
  )
}

export default MonthPicker
