import { describe, expect, it } from 'vitest'
import {
  bedtimesFromWakeTime,
  cycleAlignment,
  defaultSleepSettings,
  nearestCycleBoundary,
  wakeTimesFromBedtime,
} from '../sleep'

const m = 60_000

describe('wakeTimesFromBedtime', () => {
  const bedtime = new Date('2026-07-01T23:00:00Z')

  it('adds the fall-asleep latency before the first cycle', () => {
    const [threeCycles] = wakeTimesFromBedtime(bedtime)
    // 23:00 + 15m latency + 4h30m of sleep.
    expect(threeCycles.at.toISOString()).toBe('2026-07-02T03:45:00.000Z')
    expect(threeCycles.asleepMs).toBe(270 * m)
    expect(threeCycles.inBedMs).toBe(285 * m)
  })

  it('spaces options exactly one cycle apart', () => {
    const options = wakeTimesFromBedtime(bedtime)
    for (let i = 1; i < options.length; i += 1) {
      expect(options[i].at.getTime() - options[i - 1].at.getTime()).toBe(90 * m)
    }
  })

  it('honours a custom latency and cycle length', () => {
    const [first] = wakeTimesFromBedtime(bedtime, { latencyMinutes: 0, cycleMinutes: 100 })
    expect(first.at.toISOString()).toBe('2026-07-02T04:00:00.000Z')
  })

  it('marks 5 and 6 cycles as the ideal range', () => {
    const ideal = wakeTimesFromBedtime(bedtime)
      .filter((o) => o.ideal)
      .map((o) => o.cycles)
    expect(ideal).toEqual([5, 6])
  })
})

describe('bedtimesFromWakeTime', () => {
  const wake = new Date('2026-07-02T07:00:00Z')

  it('works backwards through latency and whole cycles', () => {
    const options = bedtimesFromWakeTime(wake)
    const five = options.find((o) => o.cycles === 5)!
    // 07:00 - 7h30m - 15m latency.
    expect(five.at.toISOString()).toBe('2026-07-01T23:15:00.000Z')
  })

  it('inverts wakeTimesFromBedtime', () => {
    for (const option of bedtimesFromWakeTime(wake)) {
      const back = wakeTimesFromBedtime(option.at).find((o) => o.cycles === option.cycles)!
      expect(back.at.toISOString()).toBe(wake.toISOString())
    }
  })
})

describe('cycleAlignment', () => {
  it('scores a whole number of cycles as perfect', () => {
    expect(cycleAlignment(5 * 90 * m)).toBe(1)
  })

  it('scores a half cycle as the worst case', () => {
    expect(cycleAlignment(4.5 * 90 * m)).toBe(0)
  })

  it('degrades smoothly in between', () => {
    expect(cycleAlignment(5 * 90 * m + 22.5 * m)).toBeCloseTo(0.5)
  })
})

describe('nearestCycleBoundary', () => {
  it('finds the closest boundary and how far off the alarm is', () => {
    const bedtime = new Date('2026-07-01T23:00:00Z')
    const wake = new Date('2026-07-02T07:00:00Z') // 7h45m asleep
    const result = nearestCycleBoundary(bedtime, wake, defaultSleepSettings)
    expect(result.cycles).toBe(5)
    // Five cycles ends at 06:45, fifteen minutes before the alarm.
    expect(result.at.toISOString()).toBe('2026-07-02T06:45:00.000Z')
    expect(result.offsetMs).toBe(-15 * m)
  })
})
