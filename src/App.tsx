import { useEffect } from 'react'
import { CountdownTab } from './components/CountdownTab'
import { SleepTab } from './components/SleepTab'
import { TimeMathTab } from './components/TimeMathTab'
import { ZonesTab } from './components/ZonesTab'
import { useNow } from './hooks/useNow'
import { usePersistentState } from './hooks/usePersistentState'
import { formatDate, formatTime, localTimeZone } from './lib/time'
import { resolveZone, zoneAbbreviation } from './lib/zones'

const TABS = [
  { id: 'sleep', label: 'Sleep', key: '1' },
  { id: 'countdown', label: 'Countdown', key: '2' },
  { id: 'math', label: 'Add / subtract', key: '3' },
  { id: 'zones', label: 'Time zones', key: '4' },
] as const

type TabId = (typeof TABS)[number]['id']
type Theme = 'dark' | 'light'

export default function App() {
  const now = useNow(1000)
  const zone = localTimeZone()

  const [tab, setTab] = usePersistentState<TabId>('tab', 'sleep')
  const [hour12, setHour12] = usePersistentState('hour12', true)
  const [theme, setTheme] = usePersistentState<Theme>('theme', 'dark')

  useEffect(() => {
    document.documentElement.dataset.theme = theme
  }, [theme])

  // Number keys jump between tabs, since this is a thing you reach for at 1am.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return
      const target = event.target as HTMLElement | null
      if (target && /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)) return
      const match = TABS.find((candidate) => candidate.key === event.key)
      if (match) setTab(match.id)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [setTab])

  return (
    <div className="app">
      <header className="topbar">
        <h1 className="wordmark">Time Calculator</h1>
        <div className="clock">
          <b>{formatTime(now, { hour12 })}</b>
          <span>
            {formatDate(now)} · {resolveZone(zone).city} {zoneAbbreviation(now, zone)}
          </span>
        </div>
      </header>

      <nav className="tabs" role="tablist" aria-label="Calculators">
        {TABS.map((candidate) => (
          <button
            key={candidate.id}
            type="button"
            role="tab"
            className="tab"
            aria-selected={tab === candidate.id}
            onClick={() => setTab(candidate.id)}
          >
            {candidate.label}
            <kbd>{candidate.key}</kbd>
          </button>
        ))}
      </nav>

      <main>
        {tab === 'sleep' && <SleepTab now={now} timeZone={zone} hour12={hour12} />}
        {tab === 'countdown' && <CountdownTab now={now} timeZone={zone} hour12={hour12} />}
        {tab === 'math' && <TimeMathTab now={now} timeZone={zone} hour12={hour12} />}
        {tab === 'zones' && <ZonesTab now={now} localZone={zone} hour12={hour12} />}
      </main>

      <footer className="footer">
        <div className="row">
          <button type="button" className="icon-button" onClick={() => setHour12((v) => !v)}>
            {hour12 ? 'Switch to 24-hour' : 'Switch to 12-hour'}
          </button>
          <button
            type="button"
            className="icon-button"
            onClick={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
          >
            {theme === 'dark' ? 'Light theme' : 'Dark theme'}
          </button>
        </div>
        <p>
          Everything runs in the browser against your own clock. Nothing is sent anywhere.
        </p>
      </footer>
    </div>
  )
}
