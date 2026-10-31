import { useMemo } from 'react'
import { usePersistentState } from '../hooks/usePersistentState'
import { formatDurationLong, formatTimerValue } from '../lib/duration'
import {
  DAY,
  calendarDayDelta,
  clockParts,
  formatDate,
  formatDayLabel,
  formatTime,
  fromClockParts,
  parseTimeInput,
} from '../lib/time'
import { CopyButton, Hero, Panel } from './ui'

function toDateInputValue(at: Date, timeZone: string): string {
  const p = clockParts(at, timeZone)
  return `${p.year}-${String(p.month).padStart(2, '0')}-${String(p.day).padStart(2, '0')}`
}

export function CountdownTab({
  now,
  timeZone,
  hour12,
}: {
  now: Date
  timeZone: string
  hour12: boolean
}) {
  const [dateInput, setDateInput] = usePersistentState('countdown.date', '')
  const [timeInput, setTimeInput] = usePersistentState('countdown.time', '09:00')

  const activeDate = dateInput || toDateInputValue(now, timeZone)

  const target = useMemo(() => {
    const minutes = parseTimeInput(timeInput)
    const [year, month, day] = activeDate.split('-').map(Number)
    if (minutes === null || !year || !month || !day) return null
    return fromClockParts(
      { year, month, day, hour: Math.floor(minutes / 60), minute: minutes % 60, second: 0 },
      timeZone,
    )
  }, [activeDate, timeInput, timeZone])

  const remaining = target ? target.getTime() - now.getTime() : 0
  const past = remaining < 0
  const setRelativeDay = (days: number) =>
    setDateInput(toDateInputValue(new Date(now.getTime() + days * DAY), timeZone))

  if (!target) {
    return <p className="alert">Pick a date and a time to count down to.</p>
  }

  const days = calendarDayDelta(now, target, timeZone)

  return (
    <>
      <Panel>
        <div className="row">
          <div className="field">
            <label className="label" htmlFor="cd-date">
              Date
            </label>
            <input
              id="cd-date"
              type="date"
              value={activeDate}
              onChange={(event) => setDateInput(event.target.value)}
            />
          </div>
          <div className="field">
            <label className="label" htmlFor="cd-time">
              Time
            </label>
            <input
              id="cd-time"
              type="time"
              value={timeInput}
              onChange={(event) => setTimeInput(event.target.value)}
            />
          </div>
        </div>
        <div className="btn-row">
          <button
            type="button"
            className="btn"
            aria-pressed={days === 0}
            onClick={() => setRelativeDay(0)}
          >
            Today
          </button>
          <button
            type="button"
            className="btn"
            aria-pressed={days === 1}
            onClick={() => setRelativeDay(1)}
          >
            Tomorrow
          </button>
        </div>
      </Panel>

      <Hero
        label={past ? 'That was' : 'Set a timer for'}
        value={formatTimerValue(remaining)}
        meta={
          <>
            <b>{formatDurationLong(remaining)}</b>
            {past ? ' ago' : ''} · {formatDate(target, timeZone)} at{' '}
            {formatTime(target, { timeZone, hour12 })} ({formatDayLabel(target, now, timeZone)})
          </>
        }
        actions={<CopyButton text={formatTimerValue(remaining)} label="Copy timer value" />}
      />

      <p className="note">
        Hours, minutes and seconds, in the shape a timer app wants. Days roll up into hours,
        because no timer has a days field.
      </p>
    </>
  )
}
