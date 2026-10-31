import { useEffect } from 'react'
import { CountdownTab } from './components/CountdownTab'
import { SleepTab } from './components/SleepTab'
import { TimeMathTab } from './components/TimeMathTab'
import { ZonesTab } from './components/ZonesTab'
import { GlobeIcon, MathIcon, MoonIcon, SlidersIcon, TimerIcon } from './components/icons'
import { Menu, Toggle } from './components/ui'
import { useNow } from './hooks/useNow'
import { usePersistentState } from './hooks/usePersistentState'
import { formatDate, formatTime, localTimeZone } from './lib/time'
import { headlineCity, resolveZone, zoneAbbreviation } from './lib/zones'

const TABS = [
  { id: 'sleep', label: 'Sleep', key: '1', Icon: MoonIcon },
  { id: 'countdown', label: 'Timer', key: '2', Icon: TimerIcon },
  { id: 'math', label: 'Math', key: '3', Icon: MathIcon },
  { id: 'zones', label: 'Zones', key: '4', Icon: GlobeIcon },
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

  // Number keys jump between tabs, for the desktop case.
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
        <h1 className="brand">Time Calculator</h1>
        <div className="now">
          <b className="tnum">{formatTime(now, { hour12 })}</b>
          <span>
            {formatDate(now)} · {zoneAbbreviation(now, zone) || headlineCity(resolveZone(zone)).name}
          </span>
        </div>
        <Menu label="Settings" icon={<SlidersIcon />}>
          <span className="label">Clock</span>
          <Toggle
            label="Clock format"
            value={hour12 ? '12' : '24'}
            onChange={(value) => setHour12(value === '12')}
            options={[
              { value: '12', label: '12-hour' },
              { value: '24', label: '24-hour' },
            ]}
          />
          <span className="label">Theme</span>
          <Toggle
            label="Theme"
            value={theme}
            onChange={setTheme}
            options={[
              { value: 'dark', label: 'Dark' },
              { value: 'light', label: 'Light' },
            ]}
          />
        </Menu>
      </header>

      <nav className="tabs" role="tablist" aria-label="Calculators">
        {TABS.map(({ id, label, Icon }) => (
          <button
            key={id}
            type="button"
            role="tab"
            className="tab"
            aria-selected={tab === id}
            onClick={() => setTab(id)}
          >
            <Icon />
            {label}
          </button>
        ))}
      </nav>

      <main>
        {tab === 'sleep' && <SleepTab now={now} timeZone={zone} hour12={hour12} />}
        {tab === 'countdown' && <CountdownTab now={now} timeZone={zone} hour12={hour12} />}
        {tab === 'math' && <TimeMathTab now={now} timeZone={zone} hour12={hour12} />}
        {tab === 'zones' && <ZonesTab now={now} localZone={zone} hour12={hour12} />}
      </main>

      <footer className="footer">Runs entirely in your browser. Nothing is sent anywhere.</footer>
    </div>
  )
}
