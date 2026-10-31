import { describe, expect, it } from 'vitest'
import {
  calendarDayDelta,
  clockParts,
  fromClockParts,
  nextOccurrence,
  offsetMinutes,
  parseTimeInput,
  toTimeInputValue,
  withTimeOfDay,
} from '../time'

describe('offsetMinutes', () => {
  it('reads whole-hour zones', () => {
    const summer = new Date('2026-07-01T12:00:00Z')
    expect(offsetMinutes(summer, 'UTC')).toBe(0)
    expect(offsetMinutes(summer, 'Asia/Tokyo')).toBe(540)
    expect(offsetMinutes(summer, 'America/Los_Angeles')).toBe(-420)
  })

  it('reads half-hour and quarter-hour zones', () => {
    const at = new Date('2026-07-01T12:00:00Z')
    expect(offsetMinutes(at, 'Asia/Kolkata')).toBe(330)
    expect(offsetMinutes(at, 'Asia/Kathmandu')).toBe(345)
  })

  it('tracks daylight saving', () => {
    expect(offsetMinutes(new Date('2026-01-15T12:00:00Z'), 'America/New_York')).toBe(-300)
    expect(offsetMinutes(new Date('2026-07-15T12:00:00Z'), 'America/New_York')).toBe(-240)
    // Arizona sits out DST.
    expect(offsetMinutes(new Date('2026-01-15T12:00:00Z'), 'America/Phoenix')).toBe(-420)
    expect(offsetMinutes(new Date('2026-07-15T12:00:00Z'), 'America/Phoenix')).toBe(-420)
  })
})

describe('clockParts / fromClockParts', () => {
  it('round-trips through a zone', () => {
    const at = new Date('2026-03-15T23:45:00Z')
    for (const zone of ['UTC', 'Asia/Tokyo', 'America/New_York', 'Asia/Kolkata', 'Pacific/Auckland']) {
      const parts = clockParts(at, zone)
      expect(fromClockParts(parts, zone).toISOString()).toBe(at.toISOString())
    }
  })

  it('reads the right wall clock across the date line', () => {
    const at = new Date('2026-07-01T20:00:00Z')
    expect(clockParts(at, 'Asia/Tokyo')).toMatchObject({ day: 2, hour: 5 })
    expect(clockParts(at, 'America/Los_Angeles')).toMatchObject({ day: 1, hour: 13 })
  })

  it('resolves a time skipped by the spring-forward gap', () => {
    // 2:30am never happens in New York on 2026-03-08; it resolves forward.
    const resolved = fromClockParts(
      { year: 2026, month: 3, day: 8, hour: 2, minute: 30, second: 0 },
      'America/New_York',
    )
    expect(resolved.toISOString()).toBe('2026-03-08T07:30:00.000Z')
  })
})

describe('withTimeOfDay', () => {
  it('keeps the local date and replaces the clock time', () => {
    const at = new Date('2026-07-01T20:00:00Z') // 1pm in LA
    const result = withTimeOfDay(at, 'America/Los_Angeles', 7, 30)
    expect(clockParts(result, 'America/Los_Angeles')).toMatchObject({ day: 1, hour: 7, minute: 30 })
  })

  it('survives a spring-forward day', () => {
    const at = new Date('2026-03-08T18:00:00Z')
    const result = withTimeOfDay(at, 'America/New_York', 6, 0)
    expect(clockParts(result, 'America/New_York')).toMatchObject({ day: 8, hour: 6, minute: 0 })
  })
})

describe('nextOccurrence', () => {
  it('rolls to tomorrow when the time has passed', () => {
    const now = new Date('2026-07-01T20:00:00Z') // 1pm LA
    const sevenAm = nextOccurrence(now, 'America/Los_Angeles', 7, 0)
    expect(clockParts(sevenAm, 'America/Los_Angeles')).toMatchObject({ day: 2, hour: 7 })
  })

  it('stays today when the time is still ahead', () => {
    const now = new Date('2026-07-01T20:00:00Z') // 1pm LA
    const sixPm = nextOccurrence(now, 'America/Los_Angeles', 18, 0)
    expect(clockParts(sixPm, 'America/Los_Angeles')).toMatchObject({ day: 1, hour: 18 })
  })

  it('crosses a DST boundary without drifting off the requested clock time', () => {
    // 11pm on 2026-03-07 in New York; the clocks jump forward overnight.
    const now = new Date('2026-03-08T04:00:00Z')
    const sevenAm = nextOccurrence(now, 'America/New_York', 7, 0)
    expect(clockParts(sevenAm, 'America/New_York')).toMatchObject({ day: 8, hour: 7, minute: 0 })
    // Only 7 real hours away, not 8, because an hour of the night vanished.
    expect(sevenAm.getTime() - now.getTime()).toBe(7 * 3600_000)
  })
})

describe('calendarDayDelta', () => {
  it('counts date boundaries, not elapsed hours', () => {
    const late = new Date('2026-07-01T23:30:00Z')
    const early = new Date('2026-07-02T00:30:00Z')
    expect(calendarDayDelta(late, early, 'UTC')).toBe(1)
    // An hour apart, but both land on the 2nd once Tokyo's +9 is applied.
    expect(calendarDayDelta(late, early, 'Asia/Tokyo')).toBe(0)
  })

  it('goes negative backwards', () => {
    expect(
      calendarDayDelta(new Date('2026-07-05T12:00:00Z'), new Date('2026-07-01T12:00:00Z'), 'UTC'),
    ).toBe(-4)
  })
})

describe('parseTimeInput', () => {
  it.each([
    ['7:30', 7 * 60 + 30],
    ['07:30', 7 * 60 + 30],
    ['0730', 7 * 60 + 30],
    ['730', 7 * 60 + 30],
    ['7', 7 * 60],
    ['19:30', 19 * 60 + 30],
    ['7:30pm', 19 * 60 + 30],
    ['7:30 PM', 19 * 60 + 30],
    ['7pm', 19 * 60],
    ['7 p.m.', 19 * 60],
    ['12am', 0],
    ['12pm', 12 * 60],
    ['12:15am', 15],
  ])('parses %s', (input, expected) => {
    expect(parseTimeInput(input)).toBe(expected)
  })

  it.each(['', 'nope', '25:00', '7:75', '13pm', '0pm'])('rejects %s', (input) => {
    expect(parseTimeInput(input)).toBeNull()
  })
})

describe('toTimeInputValue', () => {
  it('pads and wraps', () => {
    expect(toTimeInputValue(7 * 60 + 5)).toBe('07:05')
    expect(toTimeInputValue(0)).toBe('00:00')
    expect(toTimeInputValue(-30)).toBe('23:30')
    expect(toTimeInputValue(1440 + 90)).toBe('01:30')
  })
})
