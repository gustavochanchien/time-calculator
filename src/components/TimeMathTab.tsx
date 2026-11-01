import { useMemo } from 'react'
import { usePersistentState } from '../hooks/usePersistentState'
import { formatDuration, formatDurationLong, parseDurationInput } from '../lib/duration'
import {
  MINUTE,
  calendarDayDelta,
  formatDayLabel,
  formatTime,
  minutesOfDay,
  nextOccurrence,
  parseTimeInput,
  toTimeInputValue,
} from '../lib/time'
import { CopyButton, Hero, Panel, Toggle } from './ui'

type Mode = 'shift' | 'between'

export function TimeMathTab(props: { now: Date; timeZone: string; hour12: boolean }) {
  const [mode, setMode] = usePersistentState<Mode>('math.mode', 'shift')

  return (
    <>
      <Panel>
        <Toggle
          label="Mode"
          value={mode}
          onChange={setMode}
          options={[
            { value: 'shift', label: 'Shift a time' },
            { value: 'between', label: 'Time between' },
          ]}
        />
      </Panel>
      {mode === 'shift' ? <ShiftMode {...props} /> : <BetweenMode {...props} />}
    </>
  )
}

const STEP = 15 * MINUTE

/** Renders a duration back into the compact text the input accepts. */
function durationToInput(ms: number): string {
  const minutes = Math.round(ms / MINUTE)
  if (minutes === 0) return '0m'
  if (minutes % 60 === 0) return `${minutes / 60}h`
  if (minutes > 60) return `${Math.floor(minutes / 60)}h ${minutes % 60}m`
  return `${minutes}m`
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

  const nudge = (delta: number) =>
    setAmountInput(durationToInput(Math.max(0, (amountMs ?? 0) + delta)))

  return (
    <>
      <Panel>
        <label className="label" htmlFor="math-amount">
          How much
        </label>
        <div className="stepper">
          <button
            type="button"
            className="step"
            aria-label="15 minutes less"
            onClick={() => nudge(-STEP)}
          >
            −
          </button>
          <input
            id="math-amount"
            type="text"
            inputMode="text"
            placeholder="5h · 90m · 1:30 · 2d 4h"
            value={amountInput}
            onChange={(event) => setAmountInput(event.target.value)}
          />
          <button
            type="button"
            className="step"
            aria-label="15 minutes more"
            onClick={() => nudge(STEP)}
          >
            +
          </button>
        </div>

        <Toggle
          label="Direction"
          value={sign}
          onChange={setSign}
          options={[
            { value: 'plus', label: 'After' },
            { value: 'minus', label: 'Before' },
          ]}
        />

        <div className="row">
          <div className="field">
            <label className="label" htmlFor="math-base">
              Starting from
            </label>
            <input
              id="math-base"
              type="time"
              value={baseInput || toTimeInputValue(minutesOfDay(now, timeZone))}
              onChange={(event) => setBaseInput(event.target.value)}
            />
          </div>
          <button
            type="button"
            className="btn btn-set"
            aria-pressed={baseInput === ''}
            onClick={() => setBaseInput('')}
          >
            Right now
          </button>
        </div>
      </Panel>

      {result && signedMs !== null ? (
        <Hero
          label={`${formatDuration(Math.abs(signedMs))} ${sign === 'plus' ? 'after' : 'before'} ${
            baseInput === '' ? 'now' : formatTime(base, { timeZone, hour12 })
          }`}
          value={formatTime(result, { timeZone, hour12 })}
          meta={
            <>
              {formatDayLabel(result, now, timeZone)}
              {dayShiftNote(base, result, timeZone)}
            </>
          }
          actions={<CopyButton text={formatTime(result, { timeZone, hour12 })} />}
        />
      ) : (
        <p className="alert">
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
  return ` · ${magnitude} ${magnitude === 1 ? 'day' : 'days'} ${delta > 0 ? 'later' : 'earlier'}`
}

function BetweenMode({ now, timeZone }: { now: Date; timeZone: string; hour12: boolean }) {
  const [fromInput, setFromInput] = usePersistentState('math.from', '09:00')
  const [toInput, setToInput] = usePersistentState('math.to', '17:30')

  const fromMinutes = parseTimeInput(fromInput)
  const toMinutes = parseTimeInput(toInput)

  if (fromMinutes === null || toMinutes === null) {
    return <p className="alert">Both ends need to read as a time.</p>
  }

  // Two points in the same day, rolling past midnight when the end reads
  // earlier than the start — the overnight-shift case.
  const rolled = toMinutes < fromMinutes
  const spanMinutes = rolled ? toMinutes + 1440 - fromMinutes : toMinutes - fromMinutes
  const spanMs = spanMinutes * MINUTE

  return (
    <>
      <Panel>
        <div className="row">
          <div className="field">
            <label className="label" htmlFor="math-from">
              From
            </label>
            <input
              id="math-from"
              type="time"
              value={fromInput}
              onChange={(event) => setFromInput(event.target.value)}
            />
          </div>
          <div className="field">
            <label className="label" htmlFor="math-to">
              To
            </label>
            <input
              id="math-to"
              type="time"
              value={toInput}
              onChange={(event) => setToInput(event.target.value)}
            />
          </div>
        </div>
        <div className="btn-row">
          <button
            type="button"
            className="btn btn-set"
            onClick={() => setFromInput(toTimeInputValue(minutesOfDay(now, timeZone)))}
          >
            Start now
          </button>
          <button
            type="button"
            className="btn"
            onClick={() => {
              setFromInput(toInput)
              setToInput(fromInput)
            }}
          >
            Swap
          </button>
        </div>
      </Panel>

      <Hero
        label="Time between"
        value={formatDuration(spanMs)}
        meta={
          <>
            <b>{formatDurationLong(spanMs)}</b> · {(spanMinutes / 60).toFixed(2)} hours ·{' '}
            {spanMinutes.toLocaleString()} minutes
            {rolled ? ' · crosses midnight' : ''}
          </>
        }
        actions={<CopyButton text={formatDuration(spanMs)} />}
      />

      <p className="note">
        An end time earlier than the start is read as the next morning, which is what you want for
        an overnight shift and never what a negative number would tell you.
      </p>
    </>
  )
}
