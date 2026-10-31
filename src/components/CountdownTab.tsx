import { useMemo } from 'react'
import { usePersistentState } from '../hooks/usePersistentState'
import { formatDuration, formatDurationLong, formatTimerValue } from '../lib/duration'
import {
  DAY,
  calendarDayDelta,
  clockParts,
  formatDate,
  formatDayLabel,
  formatTime,
  fromClockParts,
  minutesOfDay,
  parseTimeInput,
  toTimeInputValue,
} from '../lib/time'
import { Card, CopyButton } from './ui'

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

  const todayValue = toDateInputValue(now, timeZone)
  const activeDate = dateInput || todayValue

  const target = useMemo(() => {
    const minutes = parseTimeInput(timeInput)
    const [year, month, day] = activeDate.split('-').map(Number)
    if (minutes === null || !year || !month || !day) return null
    return fromClockParts(
      {
        year,
        month,
        day,
        hour: Math.floor(minutes / 60),
        minute: minutes % 60,
        second: 0,
      },
      timeZone,
    )
  }, [activeDate, timeInput, timeZone])

  const remaining = target ? target.getTime() - now.getTime() : 0
  const past = remaining < 0

  const shiftDay = (days: number) => {
    const [year, month, day] = activeDate.split('-').map(Number)
    const shifted = new Date(Date.UTC(year, month - 1, day + days))
    setDateInput(toDateInputValue(shifted, 'UTC'))
  }

  const setRelativeDay = (days: number) =>
    setDateInput(toDateInputValue(new Date(now.getTime() + days * DAY), timeZone))

  return (
    <>
      <Card title="Count down to">
        <div className="field-row">
          <div className="field">
            <label htmlFor="cd-date">Date</label>
            <input
              id="cd-date"
              type="date"
              value={activeDate}
              onChange={(event) => setDateInput(event.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="cd-time">Time</label>
            <input
              id="cd-time"
              type="time"
              value={timeInput}
              onChange={(event) => setTimeInput(event.target.value)}
            />
          </div>
        </div>
        <div className="chip-row">
          <button type="button" className="chip" onClick={() => setRelativeDay(0)}>
            Today
          </button>
          <button type="button" className="chip" onClick={() => setRelativeDay(1)}>
            Tomorrow
          </button>
          <button type="button" className="chip" onClick={() => shiftDay(-1)}>
            −1 day
          </button>
          <button type="button" className="chip" onClick={() => shiftDay(1)}>
            +1 day
          </button>
          <button
            type="button"
            className="chip"
            onClick={() => setTimeInput(toTimeInputValue(minutesOfDay(now, timeZone)))}
          >
            This time of day
          </button>
        </div>
      </Card>

      {target ? (
        <>
          <div className="answer">
            <p className="answer-label">{past ? 'That was' : 'Set a timer for'}</p>
            <p className="answer-value">{formatTimerValue(remaining)}</p>
            <p className="answer-sub">
              {past ? `${formatDurationLong(remaining)} ago` : formatDurationLong(remaining)} ·{' '}
              {formatTime(target, { timeZone, hour12 })} {formatDayLabel(target, now, timeZone)}
            </p>
            <div className="answer-actions">
              <CopyButton text={formatTimerValue(remaining)} label="Copy timer value" />
            </div>
          </div>

          <Card title="The same gap, other ways">
            <dl className="stat-grid">
              <div className="stat">
                <dt>Total hours</dt>
                <dd>{(Math.abs(remaining) / 3_600_000).toFixed(1)}</dd>
              </div>
              <div className="stat">
                <dt>Total minutes</dt>
                <dd>{Math.round(Math.abs(remaining) / 60_000).toLocaleString()}</dd>
              </div>
              <div className="stat">
                <dt>Days &amp; hours</dt>
                <dd>{formatDuration(remaining)}</dd>
              </div>
              <div className="stat">
                <dt>Sleeps until</dt>
                <dd>{Math.max(0, calendarDayDelta(now, target, timeZone))}</dd>
              </div>
            </dl>
            <p className="hint">
              Target lands on {formatDate(target, timeZone)} at{' '}
              {formatTime(target, { timeZone, hour12 })}. "Sleeps" counts midnights between now and
              then — the number children ask about.
            </p>
          </Card>
        </>
      ) : (
        <p className="error">Pick a date and a time to count down to.</p>
      )}
    </>
  )
}
