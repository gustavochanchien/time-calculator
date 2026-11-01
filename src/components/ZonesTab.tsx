import { useEffect, useMemo, useRef, useState } from 'react'
import { usePersistentState } from '../hooks/usePersistentState'
import {
  clockParts,
  formatDayLabel,
  formatTime,
  nextOccurrence,
  offsetMinutes,
  parseTimeInput,
} from '../lib/time'
import {
  ZONES,
  describeRelativeOffset,
  dstStatus,
  formatOffset,
  headlineCity,
  matchZones,
  resolvePlace,
  zoneAbbreviation,
  zoneLongName,
  type Place,
} from '../lib/zones'
import { WorldMap } from './WorldMap'
import { Panel, Toggle } from './ui'

/** A row as persisted: the zone, plus which of its cities the user picked. */
interface SavedZone {
  id: string
  city: string
}

const DEFAULT_ZONES: SavedZone[] = [
  { id: 'America/New_York', city: 'New York' },
  { id: 'America/Chicago', city: 'Austin' },
  { id: 'America/Denver', city: 'Albuquerque' },
  { id: 'America/Los_Angeles', city: 'Los Angeles' },
  { id: 'Europe/London', city: 'London' },
  { id: 'Asia/Taipei', city: 'Taipei' },
]

/** Room the fixed phone tab bar needs below the dropdown, plus a little air. */
const TAB_BAR_CLEARANCE = 76
/** Below this the list is too short to be worth opening; let it overhang instead. */
const MIN_RESULTS_HEIGHT = 132

export function ZonesTab({
  now,
  localZone,
  hour12,
}: {
  now: Date
  localZone: string
  hour12: boolean
}) {
  const [saved, setSaved] = usePersistentState<SavedZone[]>('zones.places', DEFAULT_ZONES)
  const [homeId, setHomeId] = usePersistentState('zones.home', localZone)
  const [mode, setMode] = usePersistentState<'now' | 'at'>('zones.mode', 'now')
  const [timeInput, setTimeInput] = usePersistentState('zones.time', '09:00')

  const home = resolvePlace(
    homeId,
    saved.find((entry) => entry.id === homeId)?.city,
  )

  const reference = useMemo(() => {
    if (mode === 'now') return now
    const minutes = parseTimeInput(timeInput)
    if (minutes === null) return now
    return nextOccurrence(now, homeId, Math.floor(minutes / 60), minutes % 60)
  }, [mode, timeInput, now, homeId])

  /** The home zone always leads, whether or not it is in the saved list. */
  const places = useMemo(() => {
    const rest = saved.filter((entry) => entry.id !== homeId)
    const entries: Place[] = [home, ...rest.map((entry) => resolvePlace(entry.id, entry.city))]
    return entries
  }, [saved, homeId, home])

  const rows = useMemo(() => {
    const homeOffset = offsetMinutes(reference, homeId)
    return places.map((place) => {
      const offset = offsetMinutes(reference, place.zone.id)
      const hour = clockParts(reference, place.zone.id).hour
      return {
        place,
        isHome: place.zone.id === homeId,
        offset,
        delta: offset - homeOffset,
        abbreviation: zoneAbbreviation(reference, place.zone.id),
        longName: zoneLongName(reference, place.zone.id),
        dst: dstStatus(reference, place.zone.id),
        night: hour < 7 || hour >= 22,
      }
    })
  }, [places, homeId, reference])

  return (
    <>
      <Panel>
        <Toggle
          label="Reference time"
          value={mode}
          onChange={setMode}
          options={[
            { value: 'now', label: 'Right now' },
            { value: 'at', label: 'At a set time' },
          ]}
        />

        {mode === 'at' && (
          <div className="row">
            <div className="field">
              <label className="label" htmlFor="zone-time">
                Time in {home.city.name}
              </label>
              <input
                id="zone-time"
                type="time"
                value={timeInput}
                onChange={(event) => setTimeInput(event.target.value)}
              />
            </div>
          </div>
        )}

        <ul className="zones">
          {rows.map((row) => (
            <li key={`${row.place.zone.id}:${row.place.city.name}`}>
              <button
                type="button"
                className={`zone${row.isHome ? ' is-home' : ''}${row.night ? ' is-night' : ''}`}
                aria-pressed={row.isHome}
                title={row.isHome ? 'This is your home zone' : `Compare against ${row.place.city.name}`}
                onClick={() => setHomeId(row.place.zone.id)}
              >
                <span className="zone-main">
                  {/* The city gets the whole first line; everything else is
                      metadata and shares the second one. */}
                  <span className="zone-city">{row.place.city.name}</span>
                  <span className="zone-sub">
                    {row.abbreviation && <span className="tag">{row.abbreviation}</span>}
                    {row.dst.active && <span className="tag">DST</span>}
                    <span className="zone-sub-text">
                      {/* The offset and the spelled-out name are reference
                          detail: useful on a wide screen, the first things to
                          go when the row has to fit a phone. */}
                      <span className="wide-only">UTC{formatOffset(row.offset)} · </span>
                      {row.isHome ? (
                        <>
                          your zone<span className="wide-only"> · {row.longName}</span>
                        </>
                      ) : (
                        describeRelativeOffset(row.delta)
                      )}
                    </span>
                  </span>
                </span>
                <span className="zone-clock">
                  <b className="tnum">{formatTime(reference, { timeZone: row.place.zone.id, hour12 })}</b>
                  <span>
                    {formatDayLabel(reference, now, row.place.zone.id)}
                    {row.night ? ' · night' : ''}
                  </span>
                </span>
              </button>
              {!row.isHome && (
                <button
                  type="button"
                  className="zone-x"
                  aria-label={`Remove ${row.place.city.name}`}
                  title={`Remove ${row.place.city.name}`}
                  onClick={() =>
                    setSaved((entries) =>
                      entries.filter(
                        (entry) =>
                          !(entry.id === row.place.zone.id && entry.city === row.place.city.name),
                      ),
                    )
                  }
                >
                  ×
                </button>
              )}
            </li>
          ))}
        </ul>

        <ZoneSearch
          at={reference}
          taken={places.map((place) => `${place.zone.id}:${place.city.name}`)}
          onPick={(entry) => setSaved((entries) => [...entries, entry])}
        />

      </Panel>

      <Panel title="Where that is">
        <WorldMap places={places} homeId={homeId} at={reference} />
        <p className="note">
          Each 15° band is tinted by its UTC offset, so the four stripes across the United States
          are Pacific, Mountain, Central and Eastern. Bands are longitude, not politics — real
          borders detour around state and national lines, and the shaded half is where the sun is
          down at the reference time.
        </p>
      </Panel>
    </>
  )
}

function ZoneSearch({
  at,
  taken,
  onPick,
}: {
  at: Date
  taken: string[]
  onPick: (entry: SavedZone) => void
}) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)
  const blurTimeout = useRef<number>(0)
  const boxRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLUListElement>(null)

  const results = useMemo(
    () => matchZones(query).filter((m) => !taken.includes(`${m.zone.id}:${m.city.name}`)),
    [query, taken],
  )

  const pick = (index: number) => {
    const match = results[index]
    if (!match) return
    window.clearTimeout(blurTimeout.current)
    onPick({ id: match.zone.id, city: match.city.name })
    setQuery('')
    setOpen(false)
    setActive(0)
  }

  const showing = open && results.length > 0

  /*
   * How tall the dropdown may be. On a phone the bottom of the window is not
   * the bottom of the usable area: the tab bar is fixed over it, and focusing
   * the input opens a keyboard that covers most of what is left. Only
   * visualViewport reports the keyboard, so measure against that and
   * re-measure whenever it moves.
   */
  useEffect(() => {
    if (!showing) return
    const fit = () => {
      const box = boxRef.current
      const list = listRef.current
      if (!box || !list) return
      const viewport = window.visualViewport
      const floor = (viewport?.height ?? window.innerHeight) + (viewport?.offsetTop ?? 0)
      const room = floor - box.getBoundingClientRect().bottom - TAB_BAR_CLEARANCE
      list.style.setProperty('--fit', `${Math.max(MIN_RESULTS_HEIGHT, Math.round(room))}px`)
    }
    fit()
    const viewport = window.visualViewport
    viewport?.addEventListener('resize', fit)
    viewport?.addEventListener('scroll', fit)
    window.addEventListener('scroll', fit, true)
    window.addEventListener('resize', fit)
    return () => {
      viewport?.removeEventListener('resize', fit)
      viewport?.removeEventListener('scroll', fit)
      window.removeEventListener('scroll', fit, true)
      window.removeEventListener('resize', fit)
    }
  }, [showing, results.length])

  return (
    <div className="search">
      {/* The dropdown anchors to this box alone — the hint below it is part of
          .search, and anchoring to that dropped the list a line and a half. */}
      <div className="search-box" ref={boxRef}>
        <input
          type="text"
          autoComplete="off"
          aria-label="Add a place"
          placeholder="Add a city, country or abbreviation…"
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
            } else if (event.key === 'Enter') {
              event.preventDefault()
              pick(active)
            } else if (event.key === 'Escape') {
              setOpen(false)
            }
          }}
        />
        {showing && (
          <ul className="results" ref={listRef}>
            {results.map(({ zone, city, matched }, index) => (
              <li key={`${zone.id}:${city.name}`} data-active={index === active}>
                <button
                  type="button"
                  onMouseEnter={() => setActive(index)}
                  onClick={() => pick(index)}
                >
                  <span className="r-city">{city.name}</span>
                  <span className="r-sub">
                    {zone.region}
                    {matched !== city.name && matched !== headlineCity(zone).name
                      ? ` · ${matched}`
                      : ''}
                  </span>
                  <span className="r-off">
                    {zoneAbbreviation(at, zone.id)} · UTC{formatOffset(offsetMinutes(at, zone.id))}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      <p className="note">
        Tap a row to compare everything against it.{' '}
        {ZONES.reduce((total, zone) => total + zone.cities.length, 0)} cities across {ZONES.length}{' '}
        zones — try “Albuquerque”, “PST” or “zulu”.
      </p>
    </div>
  )
}
