import { useMemo, useState } from 'react'
import { usePersistentState } from '../hooks/usePersistentState'
import { formatDuration } from '../lib/duration'
import {
  bedtimesFromWakeTime,
  defaultSleepSettings,
  recommendedCycles,
  wakeTimesFromBedtime,
  type CycleOption,
  type SleepSettings,
} from '../lib/sleep'
import {
  MINUTE,
  formatDayLabel,
  formatTime,
  minutesOfDay,
  nextOccurrence,
  parseTimeInput,
  toTimeInputValue,
} from '../lib/time'
import { Detail, Hero, Panel, Slider, Toggle } from './ui'

type Direction = 'sleepNow' | 'wakeAt'

export function SleepTab({
  now,
  timeZone,
  hour12,
}: {
  now: Date
  timeZone: string
  hour12: boolean
}) {
  const [direction, setDirection] = usePersistentState<Direction>('sleep.direction', 'sleepNow')
  const [settings, setSettings] = usePersistentState<SleepSettings>(
    'sleep.settings',
    defaultSleepSettings,
  )
  const [bedtimeInput, setBedtimeInput] = usePersistentState('sleep.bedtime', '')
  const [wakeInput, setWakeInput] = usePersistentState('sleep.wake', '07:00')

  // Which option is showing as the answer. Null means "whatever is recommended",
  // so changing a slider or the alarm time re-picks rather than going stale.
  const [picked, setPicked] = useState<number | null>(null)

  const update = (patch: Partial<SleepSettings>) => {
    setSettings((previous) => ({ ...previous, ...patch }))
    setPicked(null)
  }

  const bedtime = useMemo(() => {
    const minutes = parseTimeInput(bedtimeInput)
    if (minutes === null) return now
    return nextOccurrence(now, timeZone, Math.floor(minutes / 60), minutes % 60)
  }, [bedtimeInput, now, timeZone])

  const wakeTime = useMemo(() => {
    const minutes = parseTimeInput(wakeInput)
    if (minutes === null) return null
    return nextOccurrence(now, timeZone, Math.floor(minutes / 60), minutes % 60)
  }, [wakeInput, now, timeZone])

  const options = useMemo(() => {
    if (direction === 'sleepNow') return wakeTimesFromBedtime(bedtime, settings)
    return wakeTime ? bedtimesFromWakeTime(wakeTime, settings) : []
  }, [direction, bedtime, wakeTime, settings])

  const fallback = options.length ? recommendedCycles(options, now) : 0
  const selected =
    options.find((option) => option.cycles === picked) ??
    options.find((option) => option.cycles === fallback)

  const fmt = (at: Date) => formatTime(at, { timeZone, hour12 })
  const askingForBedtime = direction === 'wakeAt'

  return (
    <>
      <Panel>
        <Toggle
          label="What you already know"
          value={direction}
          onChange={(next) => {
            setDirection(next)
            setPicked(null)
          }}
          options={[
            { value: 'sleepNow', label: 'I sleep at…' },
            { value: 'wakeAt', label: 'I wake at…' },
          ]}
        />

        <div className="row">
          <div className="field">
            <label className="label" htmlFor="sleep-time">
              {askingForBedtime ? 'Alarm goes off' : 'Lights out'}
            </label>
            <input
              id="sleep-time"
              type="time"
              value={
                askingForBedtime
                  ? wakeInput
                  : bedtimeInput || toTimeInputValue(minutesOfDay(now, timeZone))
              }
              onChange={(event) => {
                setPicked(null)
                if (askingForBedtime) setWakeInput(event.target.value)
                else setBedtimeInput(event.target.value)
              }}
            />
          </div>
          {!askingForBedtime && (
            <button
              type="button"
              className="btn btn-set"
              aria-pressed={bedtimeInput === ''}
              onClick={() => {
                setBedtimeInput('')
                setPicked(null)
              }}
            >
              Right now
            </button>
          )}
        </div>
      </Panel>

      {selected ? (
        <>
          <Hero
            label={askingForBedtime ? 'Go to bed at' : 'Set your alarm for'}
            value={fmt(selected.at)}
            meta={
              <>
                {formatDayLabel(selected.at, now, timeZone)} · <b>{selected.cycles} cycles</b> ·{' '}
                {formatDuration(selected.asleepMs)} asleep
              </>
            }
          />

          <Panel title={askingForBedtime ? 'Or go to bed at' : 'Or wake at'}>
            <ul className="options">
              {options.map((option) => (
                <OptionRow
                  key={option.cycles}
                  option={option}
                  selected={option.cycles === selected.cycles}
                  past={askingForBedtime && option.at.getTime() < now.getTime()}
                  onPick={() => setPicked(option.cycles)}
                  now={now}
                  timeZone={timeZone}
                  hour12={hour12}
                />
              ))}
            </ul>

            <Detail
              summary={`${settings.latencyMinutes} min to fall asleep · ${settings.cycleMinutes}-minute cycles`}
            >
              <Slider
                label="Time to fall asleep"
                value={settings.latencyMinutes}
                min={0}
                max={60}
                onChange={(latencyMinutes) => update({ latencyMinutes })}
                format={(value) => `${value} min`}
              />
              <Slider
                label="Sleep cycle length"
                value={settings.cycleMinutes}
                min={70}
                max={120}
                step={5}
                onChange={(cycleMinutes) => update({ cycleMinutes })}
                format={(value) => `${value} min`}
              />
              <p className="note">
                Waking at the end of a cycle, rather than partway through one, is what makes a
                wake-up feel clean. Defaults are the textbook 15 minutes to drop off and 90-minute
                cycles; if a sleep tracker has told you your own numbers, use those.
              </p>
            </Detail>
          </Panel>
        </>
      ) : (
        <p className="alert">That alarm time doesn't read as a time.</p>
      )}
    </>
  )
}

function OptionRow({
  option,
  selected,
  past,
  onPick,
  now,
  timeZone,
  hour12,
}: {
  option: CycleOption
  selected: boolean
  past: boolean
  onPick: () => void
  now: Date
  timeZone: string
  hour12: boolean
}) {
  const inBedHours = option.inBedMs / (60 * MINUTE)
  return (
    <li>
      <button
        type="button"
        className={`option${past ? ' is-past' : ''}`}
        aria-pressed={selected}
        onClick={onPick}
      >
        <span className="option-time tnum">{formatTime(option.at, { timeZone, hour12 })}</span>
        {/* Two lines on a wide screen, one on a phone — see .option-meta. The
            in-bed figure is the first thing to go; asleep time is the point. */}
        <span className="option-meta">
          <span>
            {option.cycles} cycles · {formatDuration(option.asleepMs)}
            <span className="wide-only"> asleep</span>
          </span>
          <span className="option-meta-2">
            {formatDayLabel(option.at, now, timeZone)}
            <span className="wide-only"> · {inBedHours.toFixed(1)}h in bed</span>
          </span>
        </span>
        <span className="option-tag">{past ? 'passed' : option.ideal ? 'ideal' : ''}</span>
      </button>
    </li>
  )
}
