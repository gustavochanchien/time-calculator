import { useMemo } from 'react'
import { usePersistentState } from '../hooks/usePersistentState'
import { formatDuration, formatDurationLong, parseDurationInput } from '../lib/duration'
import {
  HOUR,
  MINUTE,
  calendarDayDelta,
  formatDayLabel,
  formatTime,
  minutesOfDay,
  nextOccurrence,
  parseTimeInput,
  toTimeInputValue,
} from '../lib/time'
import { Card, CopyButton, Segmented } from './ui'

type Mode = 'shift' | 'between'

export function TimeMathTab({
  now,
  timeZone,
  hour12,
}: {
  now: Date
  timeZone: string
  hour12: boolean
}) {
  const [mode, setMode] = usePersistentState<Mode>('math.mode', 'shift')

  return (
    <>
      <Card>
        <div className="card-head">
          <Segmented
            label="Mode"
            value={mode}
            onChange={setMode}
            options={[
              { value: 'shift', label: 'Add or subtract' },
              { value: 'between', label: 'Between two times' },
            ]}
          />
        </div>
        {mode === 'shift' ? (
          <ShiftMode now={now} timeZone={timeZone} hour12={hour12} />
        ) : (
          <BetweenMode now={now} timeZone={timeZone} />
        )}
      </Card>
    </>
  )
}

function ShiftMode({
  now,
  timeZone,
  hour12,
}: {
  now: Date
  timeZone: string
  hour12: boolean
}) {
  const [baseInput, setBaseInput] = usePersistentState('math.base', '')
  const [amountInput, setAmountInput] = usePersistentState('math.amount', '5h')
  const [sign, setSign] = usePersistentState<'plus' | 'minus'>('math.sign', 'plus')

  const base = useMemo(() => {
    const minutes = parseTimeInput(baseInput)
    if (minutes === null) return now
    return nextOccurrence(now, timeZone, Math.floor(minutes / 60), minutes % 60)
  }, [baseInput, now, timeZone])

  const amountMs = parseDurationInput(amountInput)
  const signedMs = amountMs === null ? null : (sign === 'plus' ? 1 : -1) * amountMs
  const result = signedMs === null ? null : new Date(base.getTime() + signedMs)

  const bump = (ms: number) => {
    const current = amountMs ?? 0
    const next = Math.max(0, current + ms)
    setAmountInput(next >= HOUR && next % HOUR === 0 ? `${next / HOUR}h` : `${next / MINUTE}m`)
  }

  return (
    <>
      <div className="field-row">
        <div className="field">
          <label htmlFor="math-base">Starting from</label>
          <input
            id="math-base"
            type="time"
            value={baseInput || toTimeInputValue(minutesOfDay(now, timeZone))}
            onChange={(event) => setBaseInput(event.target.value)}
          />
        </div>
        <div className="field is-auto">
          <span className="field-label">Direction</span>
          <Segmented
            label="Direction"
            value={sign}
            onChange={setSign}
            options={[
              { value: 'plus', label: '+ after' },
              { value: 'minus', label: '− before' },
            ]}
          />
        </div>
        <div className="field">
          <label htmlFor="math-amount">Amount</label>
          <input
            id="math-amount"
            type="text"
            inputMode="text"
            placeholder="5h, 90m, 1:30, 2d 4h"
            value={amountInput}
            onChange={(event) => setAmountInput(event.target.value)}
          />
        </div>
      </div>

      <div className="chip-row">
        <button
          type="button"
          className="chip"
          aria-pressed={baseInput === ''}
          onClick={() => setBaseInput('')}
        >
          From now
        </button>
        {['15m', '30m', '1h', '90m', '3h', '5h', '8h', '12h', '1d'].map((preset) => (
          <button
            key={preset}
            type="button"
            className="chip"
            aria-pressed={amountInput === preset}
            onClick={() => setAmountInput(preset)}
          >
            {preset}
          </button>
        ))}
        <button type="button" className="chip" onClick={() => bump(-15 * MINUTE)}>
          −15m
        </button>
        <button type="button" className="chip" onClick={() => bump(15 * MINUTE)}>
          +15m
        </button>
      </div>

      {result && signedMs !== null ? (
        <div className="answer">
          <p className="answer-label">
            {formatDuration(Math.abs(signedMs))} {sign === 'plus' ? 'after' : 'before'}{' '}
            {baseInput === '' ? 'now' : formatTime(base, { timeZone, hour12 })}
          </p>
          <p className="answer-value">{formatTime(result, { timeZone, hour12 })}</p>
          <p className="answer-sub">
            {formatDayLabel(result, now, timeZone)}
            {dayShiftNote(base, result, timeZone)}
          </p>
          <div className="answer-actions">
            <CopyButton text={formatTime(result, { timeZone, hour12 })} />
          </div>
        </div>
      ) : (
        <p className="error">
          Couldn't read "{amountInput}" as a length of time. Try 5h, 90m, 1:30 or 2d 4h.
        </p>
      )}
    </>
  )
}

function dayShiftNote(base: Date, result: Date, timeZone: string): string {
  const delta = calendarDayDelta(base, result, timeZone)
  if (delta === 0) return ''
  const magnitude = Math.abs(delta)
  const unit = magnitude === 1 ? 'day' : 'days'
  return ` · ${magnitude} ${unit} ${delta > 0 ? 'later' : 'earlier'}`
}

function BetweenMode({ now, timeZone }: { now: Date; timeZone: string }) {
  const [fromInput, setFromInput] = usePersistentState('math.from', '09:00')
  const [toInput, setToInput] = usePersistentState('math.to', '17:30')

  const fromMinutes = parseTimeInput(fromInput)
  const toMinutes = parseTimeInput(toInput)

  if (fromMinutes === null || toMinutes === null) {
    return <p className="error">Both ends need to read as a time.</p>
  }

  // Treated as two points in the same day, rolling past midnight when the end
  // reads earlier than the start — the overnight-shift case.
  const rolled = toMinutes < fromMinutes
  const spanMinutes = rolled ? toMinutes + 1440 - fromMinutes : toMinutes - fromMinutes
  const spanMs = spanMinutes * MINUTE

  return (
    <>
      <div className="field-row">
        <div className="field">
          <label htmlFor="math-from">From</label>
          <input
            id="math-from"
            type="time"
            value={fromInput}
            onChange={(event) => setFromInput(event.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor="math-to">To</label>
          <input
            id="math-to"
            type="time"
            value={toInput}
            onChange={(event) => setToInput(event.target.value)}
          />
        </div>
      </div>
      <div className="chip-row">
        <button
          type="button"
          className="chip"
          onClick={() => setFromInput(toTimeInputValue(minutesOfDay(now, timeZone)))}
        >
          Start = now
        </button>
        <button
          type="button"
          className="chip"
          onClick={() => setToInput(toTimeInputValue(minutesOfDay(now, timeZone)))}
        >
          End = now
        </button>
        <button
          type="button"
          className="chip"
          onClick={() => {
            setFromInput(toInput)
            setToInput(fromInput)
          }}
        >
          Swap
        </button>
      </div>

      <div className="answer">
        <p className="answer-label">Time between</p>
        <p className="answer-value">{formatDuration(spanMs)}</p>
        <p className="answer-sub">
          {formatDurationLong(spanMs)}
          {rolled ? ' · crosses midnight' : ''} · {(spanMinutes / 60).toFixed(2)} hours ·{' '}
          {spanMinutes.toLocaleString()} minutes
        </p>
        <div className="answer-actions">
          <CopyButton text={formatDuration(spanMs)} />
        </div>
      </div>
      <p className="hint">
        Useful for timesheets and shifts: an end time earlier than the start is read as the next
        morning rather than a negative number.
      </p>
    </>
  )
}
