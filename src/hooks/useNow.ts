import { useEffect, useState } from 'react'

/**
 * The current instant, re-rendering on an interval.
 *
 * Ticks are aligned to the wall clock rather than to mount time, so a
 * second-resolution clock flips on the second and a minute-resolution one flips
 * on the minute.
 */
export function useNow(intervalMs = 1000): Date {
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    let timeout: number
    let cancelled = false

    const schedule = () => {
      const delay = intervalMs - (Date.now() % intervalMs)
      timeout = window.setTimeout(() => {
        if (cancelled) return
        setNow(new Date())
        schedule()
      }, delay)
    }

    schedule()
    return () => {
      cancelled = true
      window.clearTimeout(timeout)
    }
  }, [intervalMs])

  return now
}
