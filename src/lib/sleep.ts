/**
 * Sleep cycle math.
 *
 * The model: you lie down, spend a while falling asleep (sleep latency), and
 * then run through repeating ~90 minute cycles of light sleep, deep sleep and
 * REM. Waking at the end of a cycle — rather than being hauled out of deep
 * sleep partway through one — is what makes a wake-up feel clean, so every
 * answer here lands on a cycle boundary.
 *
 * 90 minutes is the textbook average; real cycles run roughly 80-110 minutes
 * and drift longer over the night, which is why the cycle length is a dial and
 * not a constant.
 */

import { MINUTE } from './time'

export const DEFAULT_LATENCY_MINUTES = 15
export const DEFAULT_CYCLE_MINUTES = 90

/** Cycle counts worth showing. Fewer than 3 isn't a night's sleep; more than 6 is a lie-in. */
export const CYCLE_RANGE = [3, 4, 5, 6, 7] as const

/** 5 and 6 cycles — 7.5 to 9 hours asleep — is the range most adults do best in. */
export const IDEAL_CYCLES = [5, 6] as const

export interface SleepSettings {
  latencyMinutes: number
  cycleMinutes: number
}

export const defaultSleepSettings: SleepSettings = {
  latencyMinutes: DEFAULT_LATENCY_MINUTES,
  cycleMinutes: DEFAULT_CYCLE_MINUTES,
}

export interface CycleOption {
  cycles: number
  /** The instant to go to bed / to wake up, depending on which direction was asked. */
  at: Date
  /** Time actually spent asleep, excluding the latency. */
  asleepMs: number
  /** Time in bed, latency included. */
  inBedMs: number
  ideal: boolean
}

function option(cycles: number, at: Date, settings: SleepSettings): CycleOption {
  const asleepMs = cycles * settings.cycleMinutes * MINUTE
  return {
    cycles,
    at,
    asleepMs,
    inBedMs: asleepMs + settings.latencyMinutes * MINUTE,
    ideal: (IDEAL_CYCLES as readonly number[]).includes(cycles),
  }
}

/**
 * "If I go to bed now, when should the alarm go off?"
 * Each option is a cycle boundary after falling asleep.
 */
export function wakeTimesFromBedtime(
  bedtime: Date,
  settings: SleepSettings = defaultSleepSettings,
): CycleOption[] {
  const asleepAt = bedtime.getTime() + settings.latencyMinutes * MINUTE
  return CYCLE_RANGE.map((cycles) =>
    option(cycles, new Date(asleepAt + cycles * settings.cycleMinutes * MINUTE), settings),
  )
}

/**
 * "I need to be up at 7 — when should I go to bed?"
 * Works backwards from the alarm, subtracting whole cycles and the latency.
 */
export function bedtimesFromWakeTime(
  wakeTime: Date,
  settings: SleepSettings = defaultSleepSettings,
): CycleOption[] {
  return CYCLE_RANGE.map((cycles) => {
    const at = new Date(
      wakeTime.getTime() -
        cycles * settings.cycleMinutes * MINUTE -
        settings.latencyMinutes * MINUTE,
    )
    return option(cycles, at, settings)
  })
}

/**
 * How well a stretch of sleep lines up with cycle boundaries, 0-1.
 * 1 means the alarm lands exactly at the end of a cycle; 0 means it lands
 * halfway through one, which is the groggy case.
 */
export function cycleAlignment(
  asleepMs: number,
  settings: SleepSettings = defaultSleepSettings,
): number {
  const cycleMs = settings.cycleMinutes * MINUTE
  const intoCycle = ((asleepMs % cycleMs) + cycleMs) % cycleMs
  const distance = Math.min(intoCycle, cycleMs - intoCycle)
  return 1 - distance / (cycleMs / 2)
}

/** The nearest cycle boundary to an arbitrary wake time, and how far off it is. */
export function nearestCycleBoundary(
  bedtime: Date,
  wakeTime: Date,
  settings: SleepSettings = defaultSleepSettings,
): { cycles: number; at: Date; offsetMs: number } {
  const cycleMs = settings.cycleMinutes * MINUTE
  const asleepAt = bedtime.getTime() + settings.latencyMinutes * MINUTE
  const asleepMs = wakeTime.getTime() - asleepAt
  const cycles = Math.max(1, Math.round(asleepMs / cycleMs))
  const at = new Date(asleepAt + cycles * cycleMs)
  return { cycles, at, offsetMs: at.getTime() - wakeTime.getTime() }
}
