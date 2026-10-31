/** Formatting for spans of time, as opposed to points in time. */

import { HOUR, MINUTE } from './time'

export interface DurationBreakdown {
  negative: boolean
  days: number
  hours: number
  minutes: number
  seconds: number
  totalMinutes: number
}

export function breakDown(ms: number): DurationBreakdown {
  const negative = ms < 0
  const total = Math.abs(ms)
  const seconds = Math.floor(total / 1000) % 60
  const minutes = Math.floor(total / MINUTE) % 60
  const hours = Math.floor(total / HOUR) % 24
  const days = Math.floor(total / (24 * HOUR))
  return {
    negative,
    days,
    hours,
    minutes,
    seconds,
    totalMinutes: Math.floor(total / MINUTE),
  }
}

/** "7h 30m", "2d 4h 10m", "45m". Drops zero units but keeps at least one. */
export function formatDuration(ms: number, { seconds = false } = {}): string {
  const d = breakDown(ms)
  const parts: string[] = []
  if (d.days) parts.push(`${d.days}d`)
  if (d.hours) parts.push(`${d.hours}h`)
  if (d.minutes) parts.push(`${d.minutes}m`)
  if (seconds && d.seconds) parts.push(`${d.seconds}s`)
  if (!parts.length) parts.push(seconds ? '0s' : '0m')
  return (d.negative ? '-' : '') + parts.join(' ')
}

/** "7 hours 30 minutes" — for the one spot where the long form reads better. */
export function formatDurationLong(ms: number): string {
  const d = breakDown(ms)
  const parts: string[] = []
  const unit = (n: number, name: string) => `${n} ${name}${n === 1 ? '' : 's'}`
  if (d.days) parts.push(unit(d.days, 'day'))
  if (d.hours) parts.push(unit(d.hours, 'hour'))
  if (d.minutes) parts.push(unit(d.minutes, 'minute'))
  if (!parts.length) parts.push('0 minutes')
  return (d.negative ? 'minus ' : '') + parts.join(' ')
}

/**
 * The value to punch into a countdown timer: "4:12:30" for hours, "12:30" for
 * minutes. Timer apps don't take days, so days roll up into hours.
 */
export function formatTimerValue(ms: number): string {
  const d = breakDown(ms)
  const hours = d.days * 24 + d.hours
  const pad = (n: number) => String(n).padStart(2, '0')
  const body = hours
    ? `${hours}:${pad(d.minutes)}:${pad(d.seconds)}`
    : `${d.minutes}:${pad(d.seconds)}`
  return (d.negative ? '-' : '') + body
}

/** Parses "5h", "90m", "1h30", "1:30", "2h 15m", "45" (minutes) into ms. */
export function parseDurationInput(raw: string): number | null {
  const text = raw.trim().toLowerCase()
  if (!text) return null

  if (/^\d{1,3}:\d{1,2}$/.test(text)) {
    const [h, m] = text.split(':').map(Number)
    if (m > 59) return null
    return h * HOUR + m * MINUTE
  }

  const unitMatches = [...text.matchAll(/(\d+(?:\.\d+)?)\s*(d|h|m)?/g)].filter(
    (m) => m[1] !== undefined && m[0].trim() !== '',
  )
  if (!unitMatches.length) return null

  let ms = 0
  for (const match of unitMatches) {
    const value = Number(match[1])
    // A bare number means minutes, whether it stands alone ("45") or trails an
    // hours figure ("1h30").
    const unit = match[2] ?? 'm'
    if (unit === 'd') ms += value * 24 * HOUR
    else if (unit === 'h') ms += value * HOUR
    else ms += value * MINUTE
  }
  return ms
}
