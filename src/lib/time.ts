/** Core clock arithmetic. Everything here is pure and timezone-aware. */

export const MINUTE = 60_000
export const HOUR = 60 * MINUTE
export const DAY = 24 * HOUR

export interface ClockParts {
  year: number
  month: number // 1-12
  day: number
  hour: number // 0-23
  minute: number
  second: number
}

const partsCache = new Map<string, Intl.DateTimeFormat>()

function partsFormatter(timeZone: string): Intl.DateTimeFormat {
  let fmt = partsCache.get(timeZone)
  if (!fmt) {
    fmt = new Intl.DateTimeFormat('en-US', {
      timeZone,
      hourCycle: 'h23',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
    partsCache.set(timeZone, fmt)
  }
  return fmt
}

/** The wall-clock reading an observer in `timeZone` sees at instant `at`. */
export function clockParts(at: Date, timeZone: string): ClockParts {
  const parts = partsFormatter(timeZone).formatToParts(at)
  const read = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((p) => p.type === type)?.value ?? 0)
  return {
    year: read('year'),
    month: read('month'),
    day: read('day'),
    hour: read('hour'),
    minute: read('minute'),
    second: read('second'),
  }
}

/**
 * Minutes that `timeZone` is ahead of UTC at instant `at`.
 * Positive east of Greenwich, so Tokyo is +540 and Los Angeles is -480/-420.
 */
export function offsetMinutes(at: Date, timeZone: string): number {
  const p = clockParts(at, timeZone)
  const asIfUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second)
  // Drop sub-second noise so the result lands on a whole minute.
  const instant = Math.floor(at.getTime() / 1000) * 1000
  return Math.round((asIfUtc - instant) / MINUTE)
}

function readsAs(instant: number, parts: ClockParts, timeZone: string): boolean {
  const actual = clockParts(new Date(instant), timeZone)
  return (
    actual.year === parts.year &&
    actual.month === parts.month &&
    actual.day === parts.day &&
    actual.hour === parts.hour &&
    actual.minute === parts.minute
  )
}

/**
 * The instant at which `timeZone` reads the given wall-clock time.
 *
 * The offset we need depends on the answer, so this guesses, checks, and
 * re-guesses. Two cases don't have a clean answer:
 *
 *  - Ambiguous times, where the clocks went back and 1:30am happened twice.
 *    Takes the first one.
 *  - Nonexistent times, where the clocks went forward and 2:30am never
 *    happened. Shifts forward out of the gap, so 2:30am becomes 3:30am — the
 *    same convention alarms and calendar apps use.
 */
export function fromClockParts(parts: ClockParts, timeZone: string): Date {
  const naive = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
    parts.second ?? 0,
  )

  const offsetA = offsetMinutes(new Date(naive), timeZone)
  const guessA = naive - offsetA * MINUTE
  if (readsAs(guessA, parts, timeZone)) return new Date(guessA)

  const offsetB = offsetMinutes(new Date(guessA), timeZone)
  const guessB = naive - offsetB * MINUTE
  if (readsAs(guessB, parts, timeZone)) return new Date(guessB)

  // Neither offset produces the requested reading, so the time falls in a
  // spring-forward gap. Applying the smaller (pre-transition) offset lands just
  // past the jump.
  return new Date(naive - Math.min(offsetA, offsetB) * MINUTE)
}

/** Replaces the time-of-day on an instant, keeping its calendar date in `timeZone`. */
export function withTimeOfDay(
  at: Date,
  timeZone: string,
  hour: number,
  minute: number,
): Date {
  const p = clockParts(at, timeZone)
  return fromClockParts({ ...p, hour, minute, second: 0 }, timeZone)
}

/**
 * The next instant at which `timeZone` reads `hour:minute`, searching forward
 * from `after`. Used for "my alarm goes off at 7am" — which usually means
 * tomorrow morning, not one that already rang.
 */
export function nextOccurrence(
  after: Date,
  timeZone: string,
  hour: number,
  minute: number,
): Date {
  const today = withTimeOfDay(after, timeZone, hour, minute)
  if (today.getTime() > after.getTime()) return today
  // Tomorrow is the next calendar date, not 24 hours later: a DST shift makes
  // those two different answers.
  const p = clockParts(after, timeZone)
  return fromClockParts({ ...p, day: p.day + 1, hour, minute, second: 0 }, timeZone)
}

/** Calendar days between two instants as `timeZone` counts them, ignoring clock time. */
export function calendarDayDelta(from: Date, to: Date, timeZone: string): number {
  const a = clockParts(from, timeZone)
  const b = clockParts(to, timeZone)
  const dayA = Date.UTC(a.year, a.month - 1, a.day)
  const dayB = Date.UTC(b.year, b.month - 1, b.day)
  return Math.round((dayB - dayA) / DAY)
}

export interface FormatOptions {
  timeZone?: string
  hour12?: boolean
}

/** "7:30 AM" or "07:30". */
export function formatTime(at: Date, { timeZone, hour12 = true }: FormatOptions = {}): string {
  return new Intl.DateTimeFormat('en-US', {
    timeZone,
    hour: 'numeric',
    minute: '2-digit',
    ...(hour12 ? { hour12: true } : { hourCycle: 'h23' }),
  }).format(at)
}

/** "Sat, Nov 1". */
export function formatDate(at: Date, timeZone?: string): string {
  return new Intl.DateTimeFormat('en-US', {
    timeZone,
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  }).format(at)
}

/** "today" / "tomorrow" / "Sat, Nov 1", relative to `reference`. */
export function formatDayLabel(
  at: Date,
  reference: Date,
  timeZone?: string,
): string {
  const zone = timeZone ?? Intl.DateTimeFormat().resolvedOptions().timeZone
  const delta = calendarDayDelta(reference, at, zone)
  if (delta === 0) return 'today'
  if (delta === 1) return 'tomorrow'
  if (delta === -1) return 'yesterday'
  return formatDate(at, zone)
}

export function localTimeZone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone
}

/** Parses "7:30", "0730", "7:30 pm", "19:30", "7pm" into minutes past midnight. */
export function parseTimeInput(raw: string): number | null {
  const text = raw.trim().toLowerCase()
  if (!text) return null

  const meridiem = /(a|p)\.?m?\.?$/.exec(text)
  const body = meridiem ? text.slice(0, meridiem.index).trim() : text
  const digits = body.replace(/[^0-9]/g, '')
  if (!digits) return null

  let hour: number
  let minute: number
  if (body.includes(':')) {
    const [h, m = '0'] = body.split(':')
    hour = Number(h)
    minute = Number(m.padEnd(2, '0').slice(0, 2))
  } else if (digits.length <= 2) {
    hour = Number(digits)
    minute = 0
  } else {
    hour = Number(digits.slice(0, digits.length - 2))
    minute = Number(digits.slice(-2))
  }

  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return null
  if (minute > 59) return null

  if (meridiem) {
    if (hour < 1 || hour > 12) return null
    if (meridiem[1] === 'p') hour = hour === 12 ? 12 : hour + 12
    else hour = hour === 12 ? 0 : hour
  }

  if (hour > 23) return null
  return hour * 60 + minute
}

/** Minutes past midnight as a `<input type="time">` value. */
export function toTimeInputValue(minutesPastMidnight: number): string {
  const total = ((minutesPastMidnight % 1440) + 1440) % 1440
  const h = Math.floor(total / 60)
  const m = total % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

/**
 * Formats minutes past midnight as a clock label with no timezone involved.
 * For labelling fixed preset times, where converting a real instant would
 * shift the number the user picked.
 */
export function formatMinutesOfDay(minutes: number, hour12 = true): string {
  const total = ((minutes % 1440) + 1440) % 1440
  const h = Math.floor(total / 60)
  const m = total % 60
  const mm = String(m).padStart(2, '0')
  if (!hour12) return `${String(h).padStart(2, '0')}:${mm}`
  const suffix = h < 12 ? 'AM' : 'PM'
  const h12 = h % 12 === 0 ? 12 : h % 12
  return `${h12}:${mm} ${suffix}`
}

/** Minutes past midnight that `timeZone` currently reads. */
export function minutesOfDay(at: Date, timeZone: string): number {
  const p = clockParts(at, timeZone)
  return p.hour * 60 + p.minute
}
