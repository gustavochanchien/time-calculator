import { useCallback, useEffect, useState } from 'react'

const PREFIX = 'timecalc:'

function read<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(PREFIX + key)
    return raw === null ? fallback : (JSON.parse(raw) as T)
  } catch {
    // Private windows and blocked site data both throw here; the defaults are fine.
    return fallback
  }
}

/** useState that survives a reload. Settings only — never anything that must persist. */
export function usePersistentState<T>(key: string, fallback: T) {
  const [value, setValue] = useState<T>(() => read(key, fallback))

  useEffect(() => {
    try {
      window.localStorage.setItem(PREFIX + key, JSON.stringify(value))
    } catch {
      // Nothing here is worth failing a render over.
    }
  }, [key, value])

  const reset = useCallback(() => setValue(fallback), [fallback])

  return [value, setValue, reset] as const
}
