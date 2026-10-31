import { useMemo } from 'react'
import { offsetMinutes } from '../lib/time'
import { offsetHue, zoneAbbreviation, type Place } from '../lib/zones'
import { WORLD_HEIGHT, WORLD_LAND_PATH, WORLD_WIDTH } from '../lib/worldPath'

/**
 * An equirectangular world map, banded and tinted by UTC offset.
 *
 * Equirectangular is the right projection here precisely because it is the
 * naive one: longitude maps linearly to x, so an hour of time zone is always
 * the same 15 degrees of width and the bands come out as clean vertical
 * stripes. Every band is tinted by its offset — hue tracks longitude, so the
 * colour wheel wraps once around the globe and no two neighbouring zones
 * share a colour. Across the continental United States that reads as four
 * distinct stripes for Pacific, Mountain, Central and Eastern.
 *
 * The caveat, which the UI says out loud: these are 15° bands, not political
 * boundaries. Real zone borders detour around state and national lines.
 */

const BAND_DEGREES = 15

export function WorldMap({
  places,
  homeId,
  at,
}: {
  places: Place[]
  homeId: string
  at: Date
}) {
  const x = (lon: number) => ((lon + 180) / 360) * WORLD_WIDTH
  const y = (lat: number) => ((90 - lat) / 180) * WORLD_HEIGHT

  /** Which offsets are in the list, so their bands can be brought forward. */
  const activeOffsets = useMemo(() => {
    const map = new Map<number, string>()
    for (const place of places) {
      const hours = Math.round(offsetMinutes(at, place.zone.id) / 60)
      if (!map.has(hours)) map.set(hours, zoneAbbreviation(at, place.zone.id))
    }
    return map
  }, [places, at])

  const bands = useMemo(() => {
    const result = []
    for (let hours = -12; hours <= 12; hours += 1) {
      const centre = hours * BAND_DEGREES
      const left = x(centre - BAND_DEGREES / 2)
      const width = (BAND_DEGREES / 360) * WORLD_WIDTH
      const active = activeOffsets.has(hours)
      result.push({
        hours,
        left: Math.max(0, left),
        width: Math.min(width, WORLD_WIDTH - Math.max(0, left)),
        active,
        label: activeOffsets.get(hours) ?? '',
        hue: offsetHue(hours * 60),
      })
    }
    return result
  }, [activeOffsets])

  const nightPath = useMemo(() => solarNightPath(at, x, y), [at])

  const pins = useMemo(() => {
    interface Pin {
      key: string
      name: string
      cx: number
      cy: number
      labelY: number
      halfWidth: number
      home: boolean
    }

    // Labels are centred on their pin, so two nearby cities collide by
    // default. Try a few vertical slots and take the first one that is clear,
    // measuring overlap against each label's own width rather than a fixed
    // radius — "Los Angeles" needs far more room than "Rome".
    const SLOTS = [-8, 17, -20, 29, -32]
    const placed: Pin[] = []

    for (const place of places) {
      const { lat, lon } = place.city
      if (lat === 0 && lon === 0) continue // UTC and synthesised zones have no spot
      const cx = x(lon)
      const cy = y(lat)
      const halfWidth = place.city.name.length * 2.6 + 4

      const collides = (labelY: number) =>
        placed.some(
          (other) =>
            Math.abs(other.labelY - labelY) < 9 &&
            Math.abs(other.cx - cx) < other.halfWidth + halfWidth,
        )

      const slot = SLOTS.find((offset) => !collides(cy + offset)) ?? SLOTS[SLOTS.length - 1]

      placed.push({
        key: `${place.zone.id}:${place.city.name}`,
        name: place.city.name,
        cx,
        cy,
        labelY: cy + slot,
        halfWidth,
        home: place.zone.id === homeId,
      })
    }
    return placed
  }, [places, homeId])

  return (
    <svg
      className="map"
      viewBox={`0 0 ${WORLD_WIDTH} ${WORLD_HEIGHT}`}
      role="img"
      aria-label={`World map, ${places.length} places pinned, shaded by time zone`}
    >
      {bands.map((band) => (
        <rect
          key={band.hours}
          /* Hue carries the meaning, so the fill is computed, not themed. */
          x={band.left}
          y={0}
          width={band.width}
          height={WORLD_HEIGHT}
          fill={`hsl(${band.hue} 72% 62% / ${band.active ? 0.34 : 0.07})`}
        />
      ))}

      {bands.map((band) => (
        <line
          key={`grid-${band.hours}`}
          className="grid"
          x1={band.left}
          y1={0}
          x2={band.left}
          y2={WORLD_HEIGHT}
        />
      ))}

      <path className="land" d={WORLD_LAND_PATH} />
      <path className="night" d={nightPath} />

      {/* Abbreviations along the top edge, for the bands actually in use. */}
      {bands
        .filter((band) => band.active && band.label)
        .map((band) => (
          <text
            key={`label-${band.hours}`}
            className="band-label"
            x={band.left + band.width / 2}
            y={13}
            textAnchor="middle"
          >
            {band.label}
          </text>
        ))}

      {pins.map((pin) => (
        <g key={pin.key}>
          <circle className="halo" cx={pin.cx} cy={pin.cy} r={6} />
          <circle className={`pin${pin.home ? ' is-home' : ''}`} cx={pin.cx} cy={pin.cy} r={3} />
          <text
            className="pin-label"
            x={pin.cx}
            y={pin.labelY}
            textAnchor={pin.cx > WORLD_WIDTH - 60 ? 'end' : pin.cx < 60 ? 'start' : 'middle'}
          >
            {pin.name}
          </text>
        </g>
      ))}
    </svg>
  )
}

/**
 * A closed polygon covering the hemisphere where the sun is down.
 *
 * Low-precision astronomy on purpose: the sun's declination from the day of
 * year and its subsolar longitude from UTC time. Good to a degree or so, which
 * is well inside the width of the line it draws.
 */
function solarNightPath(at: Date, x: (lon: number) => number, y: (lat: number) => number): string {
  const dayOfYear =
    (Date.UTC(at.getUTCFullYear(), at.getUTCMonth(), at.getUTCDate()) -
      Date.UTC(at.getUTCFullYear(), 0, 1)) /
      86_400_000 +
    1
  const declination =
    -23.44 * Math.cos(((2 * Math.PI) / 365.24) * (dayOfYear + 9.5)) * (Math.PI / 180)

  const utcHours = at.getUTCHours() + at.getUTCMinutes() / 60 + at.getUTCSeconds() / 3600
  const subsolarLon = -15 * (utcHours - 12)

  // The terminator: the latitude where the sun sits exactly on the horizon for
  // each longitude. tan(lat) = -cos(lon - subsolar) / tan(declination).
  const points: string[] = []
  const edgeLat = declination > 0 ? -90 : 90 // the pole currently in darkness
  for (let lon = -180; lon <= 180; lon += 2) {
    const hourAngle = ((lon - subsolarLon) * Math.PI) / 180
    const lat = (Math.atan(-Math.cos(hourAngle) / Math.tan(declination)) * 180) / Math.PI
    points.push(`${x(lon).toFixed(1)},${y(lat).toFixed(1)}`)
  }

  return (
    `M${x(-180).toFixed(1)},${y(edgeLat).toFixed(1)}` +
    `L${points.join('L')}` +
    `L${x(180).toFixed(1)},${y(edgeLat).toFixed(1)}Z`
  )
}
