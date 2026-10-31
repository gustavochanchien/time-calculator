import { useMemo, useRef, useState } from 'react'
import { usePersistentState } from '../hooks/usePersistentState'
import {
  clockParts,
  formatDayLabel,
  formatTime,
  minutesOfDay,
  nextOccurrence,
  offsetMinutes,
  parseTimeInput,
  toTimeInputValue,
} from '../lib/time'
import {
  ZONES,
  describeRelativeOffset,
  dstStatus,
  formatOffset,
  matchZones,
  resolveZone,
  zoneAbbreviation,
  zoneLongName,
} from '../lib/zones'
import { WorldMap } from './WorldMap'
import { Card, Segmented } from './ui'

const DEFAULT_COMPARISONS = ['America/New_York', 'Europe/London', 'Asia/Tokyo']

export function ZonesTab({
  now,
  localZone,
  hour12,
}: {
  now: Date
  localZone: string
  hour12: boolean
}) {
  const [homeId, setHomeId] = usePersistentState('zones.home', localZone)
  const [zoneIds, setZoneIds] = usePersistentState<string[]>(
    'zones.list',
    DEFAULT_COMPARISONS.filter((id) => id !== localZone),
  )
  const [mode, setMode] = usePersistentState<'now' | 'at'>('zones.mode', 'now')
  const [timeInput, setTimeInput] = usePersistentState('zones.time', '09:00')

  const home = resolveZone(homeId)

  const reference = useMemo(() => {
    if (mode === 'now') return now
    const minutes = parseTimeInput(timeInput)
    if (minutes === null) return now
    return nextOccurrence(now, homeId, Math.floor(minutes / 60), minutes % 60)
  }, [mode, timeInput, now, homeId])

  const rows = useMemo(() => {
    const ids = [homeId, ...zoneIds.filter((id) => id !== homeId)]
    const homeOffset = offsetMinutes(reference, homeId)
    return ids.map((id) => {
      const zone = resolveZone(id)
      const offset = offsetMinutes(reference, id)
      const hour = clockParts(reference, id).hour
      return {
        zone,
        isHome: id === homeId,
        offset,
        delta: offset - homeOffset,
        abbreviation: zoneAbbreviation(reference, id),
        longName: zoneLongName(reference, id),
        dst: dstStatus(reference, id),
        night: hour < 7 || hour >= 22,
      }
    })
  }, [homeId, zoneIds, reference])

  const mapZones = useMemo(() => rows.map((row) => row.zone), [rows])

  return (
    <>
      <Card>
        <div className="card-head">
          <Segmented
            label="Reference time"
            value={mode}
            onChange={setMode}
            options={[
              { value: 'now', label: 'Right now' },
              { value: 'at', label: 'At a set time' },
            ]}
          />
          {mode === 'at' && (
            <>
              <input
                type="time"
                className="inline-time"
                aria-label={`Time in ${home.city}`}
                value={timeInput}
                onChange={(event) => setTimeInput(event.target.value)}
              />
              <button
                type="button"
                className="chip"
                onClick={() => setTimeInput(toTimeInputValue(minutesOfDay(now, homeId)))}
              >
                Now
              </button>
            </>
          )}
        </div>

        <p className="card-note zone-reference">
          {mode === 'now' ? 'Comparing against' : 'When it is'}{' '}
          <strong>{formatTime(reference, { timeZone: homeId, hour12 })}</strong> in {home.city} (
          {formatDayLabel(reference, now, homeId)})
        </p>

        <ul className="zone-list">
          {rows.map((row) => (
            <li
              key={row.zone.id}
              className={`zone${row.isHome ? ' is-home' : ''}${row.night ? ' night' : ''}`}
            >
              <div className="zone-main">
                <span className="zone-name">
                  {row.zone.city}
                  {row.abbreviation && <span className="zone-abbr">{row.abbreviation}</span>}
                  {row.dst.active && <span className="zone-abbr">DST</span>}
                </span>
                <span className="zone-sub">
                  {row.longName || row.zone.region} · UTC{formatOffset(row.offset)}
                  {row.isHome ? ' · your zone' : ` · ${describeRelativeOffset(row.delta)}`}
                </span>
              </div>
              <div className="zone-time">
                {formatTime(reference, { timeZone: row.zone.id, hour12 })}
                <small>
                  {formatDayLabel(reference, now, row.zone.id)}
                  {row.night ? ' · night' : ''}
                </small>
              </div>
              {!row.isHome && (
                <div className="zone-actions">
                  <button
                    type="button"
                    className="zone-action"
                    title={`Make ${row.zone.city} your home zone`}
                    aria-label={`Make ${row.zone.city} your home zone`}
                    onClick={() => {
                      setZoneIds((ids) => [...ids.filter((id) => id !== row.zone.id), homeId])
                      setHomeId(row.zone.id)
                    }}
                  >
                    Set home
                  </button>
                  <button
                    type="button"
                    className="zone-action"
                    title={`Remove ${row.zone.city}`}
                    aria-label={`Remove ${row.zone.city}`}
                    onClick={() => setZoneIds((ids) => ids.filter((id) => id !== row.zone.id))}
                  >
                    Remove
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>

        <div className="zone-search-wrap">
          <ZoneSearch
            at={reference}
            exclude={[homeId, ...zoneIds]}
            onPick={(id) => setZoneIds((ids) => [...ids, id])}
          />
        </div>
      </Card>

      <Card title="Where that is">
        <WorldMap zones={mapZones} homeId={homeId} at={reference} />
        <p className="hint">
          Bands are 15° wide and centred on each zone&rsquo;s actual UTC offset, so a country that
          runs on a neighbour&rsquo;s clock sits off its own longitude — which is most of why time
          zones feel arbitrary. The shaded half is where the sun is down at the reference time.
        </p>
      </Card>
    </>
  )
}

function ZoneSearch({
  at,
  exclude,
  onPick,
}: {
  at: Date
  exclude: string[]
  onPick: (id: string) => void
}) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)
  const blurTimeout = useRef<number>(0)

  const results = useMemo(
    () => matchZones(query).filter((match) => !exclude.includes(match.zone.id)),
    [query, exclude],
  )

  const pick = (id: string) => {
    onPick(id)
    setQuery('')
    setOpen(false)
    setActive(0)
  }

  return (
    <div className="zone-search field">
      <label htmlFor="zone-search">Add a zone</label>
      <div className="zone-search-box">
        <input
          id="zone-search"
          type="text"
          autoComplete="off"
          placeholder="City, country, or an abbreviation like PST or JST"
          value={query}
          onFocus={() => setOpen(true)}
          onBlur={() => {
            // Let a click on a result land before the list unmounts.
            blurTimeout.current = window.setTimeout(() => setOpen(false), 120)
          }}
          onChange={(event) => {
            setQuery(event.target.value)
            setOpen(true)
            setActive(0)
          }}
          onKeyDown={(event) => {
            if (event.key === 'ArrowDown') {
              event.preventDefault()
              setActive((i) => Math.min(i + 1, results.length - 1))
            } else if (event.key === 'ArrowUp') {
              event.preventDefault()
              setActive((i) => Math.max(i - 1, 0))
            } else if (event.key === 'Enter' && results[active]) {
              event.preventDefault()
              window.clearTimeout(blurTimeout.current)
              pick(results[active].zone.id)
            } else if (event.key === 'Escape') {
              setOpen(false)
            }
          }}
        />
        {open && results.length > 0 && (
          <ul className="zone-results">
            {results.slice(0, 12).map(({ zone, matched }, index) => (
              <li key={zone.id} data-active={index === active}>
                <button
                  type="button"
                  onMouseEnter={() => setActive(index)}
                  onClick={() => {
                    window.clearTimeout(blurTimeout.current)
                    pick(zone.id)
                  }}
                >
                  <span className="result-city">{zone.city}</span>
                  <span className="result-region">
                    {matched.toLowerCase() === zone.city.toLowerCase()
                      ? zone.region
                      : `${zone.region} · ${matched}`}
                  </span>
                  <span className="result-meta">
                    {zoneAbbreviation(at, zone.id)} · UTC{formatOffset(offsetMinutes(at, zone.id))}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      <p className="hint">
        {ZONES.length} zones, searchable by city, region or the names people actually use.
      </p>
    </div>
  )
}
