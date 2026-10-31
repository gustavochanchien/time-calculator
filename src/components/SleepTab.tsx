import { useMemo } from 'react'
import { usePersistentState } from '../hooks/usePersistentState'
import { formatDuration } from '../lib/duration'
import {
  bedtimesFromWakeTime,
  defaultSleepSettings,
  wakeTimesFromBedtime,
  type CycleOption,
  type SleepSettings,
} from '../lib/sleep'
import {
  MINUTE,
  formatDayLabel,
  formatMinutesOfDay,
  formatTime,
  minutesOfDay,
  nextOccurrence,
  parseTimeInput,
  toTimeInputValue,
} from '../lib/time'
import { Card, CopyButton, Segmented, Slider } from './ui'

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

  const update = (patch: Partial<SleepSettings>) =>
    setSettings((previous) => ({ ...previous, ...patch }))

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

  const asleepAt = new Date(bedtime.getTime() + settings.latencyMinutes * MINUTE)

  const options =
    direction === 'sleepNow'
      ? wakeTimesFromBedtime(bedtime, settings)
      : wakeTime
        ? bedtimesFromWakeTime(wakeTime, settings)
        : []

  const fmt = (at: Date) => formatTime(at, { timeZone, hour12 })
  const presetLabel = (preset: string) =>
    formatMinutesOfDay(Number(preset.slice(0, 2)) * 60 + Number(preset.slice(3)), hour12)

  return (
    <>
      <Card>
        <div className="card-head">
          <Segmented
            label="Direction"
            value={direction}
            onChange={setDirection}
            options={[
              { value: 'sleepNow', label: 'I go to bed at…' },
              { value: 'wakeAt', label: 'I need to be up at…' },
            ]}
          />
        </div>

        {direction === 'sleepNow' ? (
          <>
            <div className="field-row">
              <div className="field">
                <label htmlFor="bedtime">Bedtime</label>
                <input
                  id="bedtime"
                  type="time"
                  value={bedtimeInput || toTimeInputValue(minutesOfDay(now, timeZone))}
                  onChange={(event) => setBedtimeInput(event.target.value)}
                />
              </div>
              <div className="chip-row">
                <button
                  type="button"
                  className="chip"
                  aria-pressed={bedtimeInput === ''}
                  onClick={() => setBedtimeInput('')}
                >
                  Right now
                </button>
                {['22:00', '23:00', '00:00', '01:00'].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    className="chip"
                    aria-pressed={bedtimeInput === preset}
                    onClick={() => setBedtimeInput(preset)}
                  >
                    {presetLabel(preset)}
                  </button>
                ))}
              </div>
            </div>
            <p className="hint">
              Lights out at {fmt(bedtime)} means you are likely asleep around{' '}
              <strong>{fmt(asleepAt)}</strong>. Set the alarm for one of these and you wake at the
              end of a cycle rather than the middle of one.
            </p>
          </>
        ) : (
          <>
            <div className="field-row">
              <div className="field">
                <label htmlFor="waketime">Alarm time</label>
                <input
                  id="waketime"
                  type="time"
                  value={wakeInput}
                  onChange={(event) => setWakeInput(event.target.value)}
                />
              </div>
              <div className="chip-row">
                {['05:30', '06:00', '06:30', '07:00', '08:00'].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    className="chip"
                    aria-pressed={wakeInput === preset}
                    onClick={() => setWakeInput(preset)}
                  >
                    {presetLabel(preset)}
                  </button>
                ))}
              </div>
            </div>
            {wakeTime ? (
              <p className="hint">
                The next {fmt(wakeTime)} is {formatDayLabel(wakeTime, now, timeZone)}. Go to bed at
                one of these to wake up at the end of a cycle.
              </p>
            ) : (
              <p className="error">That alarm time doesn't read as a time.</p>
            )}
          </>
        )}
      </Card>

      {options.length > 0 && (
        <Card
          title={direction === 'sleepNow' ? 'Set your alarm for' : 'Go to bed at'}
          note={`${settings.cycleMinutes}-minute cycles · ${settings.latencyMinutes} min to fall asleep`}
        >
          <ul className="cycle-list">
            {options.map((option) => (
              <CycleRow
                key={option.cycles}
                option={option}
                now={now}
                timeZone={timeZone}
                hour12={hour12}
                flagPast={direction === 'wakeAt'}
              />
            ))}
          </ul>
          <p className="hint">
            Highlighted rows are the 7½ to 9 hours of actual sleep most adults do best on. Cycles
            run longer towards morning in real sleep, so treat these as the nearest good minute,
            not a deadline.
          </p>
        </Card>
      )}

      <Card title="Adjust the model">
        <div className="field-row">
          <div className="field">
            <Slider
              label="Time to fall asleep"
              value={settings.latencyMinutes}
              min={0}
              max={60}
              step={1}
              onChange={(latencyMinutes) => update({ latencyMinutes })}
              format={(value) => `${value} min`}
            />
          </div>
          <div className="field">
            <Slider
              label="Sleep cycle length"
              value={settings.cycleMinutes}
              min={70}
              max={120}
              step={5}
              onChange={(cycleMinutes) => update({ cycleMinutes })}
              format={(value) => `${value} min`}
            />
          </div>
        </div>
        <p className="hint">
          Defaults are 15 minutes to drop off and 90-minute cycles. If you habitually lie awake
          longer, or a sleep tracker has told you your own cycle length, put those numbers in —
          every answer above rebuilds from them.
        </p>
      </Card>
    </>
  )
}

function CycleRow({
  option,
  now,
  timeZone,
  hour12,
  flagPast,
}: {
  option: CycleOption
  now: Date
  timeZone: string
  hour12: boolean
  flagPast: boolean
}) {
  const past = flagPast && option.at.getTime() < now.getTime()
  const time = formatTime(option.at, { timeZone, hour12 })
  const day = formatDayLabel(option.at, now, timeZone)

  return (
    <li className={`cycle${option.ideal && !past ? ' is-ideal' : ''}`}>
      <div>
        <div className="cycle-time">{time}</div>
        <div className="cycle-day">{day}</div>
      </div>
      <div className="cycle-meta">
        <strong>{option.cycles} cycles</strong> · {formatDuration(option.asleepMs)} asleep
        <br />
        {formatDuration(option.inBedMs)} in bed
      </div>
      {past ? (
        <span className="cycle-badge is-quiet">already passed</span>
      ) : option.ideal ? (
        <span className="cycle-badge">ideal</span>
      ) : (
        <CopyButton text={time} />
      )}
    </li>
  )
}
