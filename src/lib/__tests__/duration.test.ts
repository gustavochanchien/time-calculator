import { describe, expect, it } from 'vitest'
import {
  breakDown,
  formatDuration,
  formatDurationLong,
  formatTimerValue,
  parseDurationInput,
} from '../duration'

const m = 60_000
const h = 60 * m

describe('breakDown', () => {
  it('splits into units', () => {
    expect(breakDown(2 * 24 * h + 4 * h + 10 * m + 30_000)).toMatchObject({
      negative: false,
      days: 2,
      hours: 4,
      minutes: 10,
      seconds: 30,
    })
  })

  it('flags and absolutises negatives', () => {
    expect(breakDown(-90 * m)).toMatchObject({ negative: true, hours: 1, minutes: 30 })
  })
})

describe('formatDuration', () => {
  it.each([
    [7.5 * h, '7h 30m'],
    [45 * m, '45m'],
    [2 * 24 * h + 4 * h + 10 * m, '2d 4h 10m'],
    [3 * h, '3h'],
    [0, '0m'],
    [-90 * m, '-1h 30m'],
  ])('formats %i as %s', (ms, expected) => {
    expect(formatDuration(ms)).toBe(expected)
  })

  it('adds seconds on request', () => {
    expect(formatDuration(90_500, { seconds: true })).toBe('1m 30s')
  })
})

describe('formatDurationLong', () => {
  it('singularises', () => {
    expect(formatDurationLong(h + m)).toBe('1 hour 1 minute')
    expect(formatDurationLong(2 * h + 2 * m)).toBe('2 hours 2 minutes')
  })
})

describe('formatTimerValue', () => {
  it('uses h:mm:ss past an hour and m:ss below it', () => {
    expect(formatTimerValue(4 * h + 12 * m + 30_000)).toBe('4:12:30')
    expect(formatTimerValue(12 * m + 5_000)).toBe('12:05')
  })

  it('rolls days up into hours, since timers have no days field', () => {
    expect(formatTimerValue(2 * 24 * h + 3 * h)).toBe('51:00:00')
  })
})

describe('parseDurationInput', () => {
  it.each([
    ['5h', 5 * h],
    ['90m', 90 * m],
    ['1h30', h + 30 * m],
    ['1h 30m', h + 30 * m],
    ['1:30', h + 30 * m],
    ['45', 45 * m],
    ['2d', 2 * 24 * h],
    ['1d 2h 30m', 24 * h + 2 * h + 30 * m],
    ['1.5h', 1.5 * h],
  ])('parses %s', (input, expected) => {
    expect(parseDurationInput(input)).toBe(expected)
  })

  it.each(['', 'soon', '1:90'])('rejects %s', (input) => {
    expect(parseDurationInput(input)).toBeNull()
  })
})
