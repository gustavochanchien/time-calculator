import { useMemo } from 'react'
import { WORLD_HEIGHT, WORLD_LAND_PATH, WORLD_WIDTH } from '../lib/worldPath'
import { offsetMinutes } from '../lib/time'
import type { Zone } from '../lib/zones'

/**
 * An equirectangular world map with the selected zones pinned and their
 * longitude bands lit up.
 *
 * Equirectangular is the right projection here precisely because it is the
 * naive one: longitude maps linearly to x, so an hour of time zone is always
 * the same 15 degrees of width and the bands come out as clean vertical
 * stripes. The night shading is a rough solar terminator — enough to tell at a
 * glance who is asleep, not an almanac.
 */
export function WorldMap({
  zones,
  homeId,
  at,
}: {
  zones: Zone[]
  homeId: string
  at: Date
}) {
  const x = (lon: number) => ((lon + 180) / 360) * WORLD_WIDTH
  const y = (lat: number) => ((90 - lat) / 180) * WORLD_HEIGHT

  // One band per zone, 15 degrees wide and centred on the zone's own offset
  // rather than on its city, so Spain sits in its official band.
  const bands = useMemo(() => {
    const seen = new Set<number>()
    const result: { offset: number; left: number; width: number }[] = []
    for (const zone of zones) {
      const offset = offsetMinutes(at, zone.id)
      const hours = offset / 60
      if (seen.has(hours)) continue
      seen.add(hours)
      const centre = hours * 15
      result.push({ offset: hours, left: x(centre - 7.5), width: (15 / 360) * WORLD_WIDTH })
    }
    return result
  }, [zones, at])

  const nightPath = useMemo(() => solarNightPath(at, x, y), [at])

  const pins = useMemo(() => {
    const placed: { zone: Zone; cx: number; cy: number; labelY: number }[] = []
    for (const zone of zones) {
      if (zone.lat === 0 && zone.lon === 0) continue // synthesised / UTC
      const cx = x(zone.lon)
      const cy = y(zone.lat)
      // Nudge labels that would collide with one already placed nearby.
      const crowded = placed.some(
        (other) => Math.abs(other.cx - cx) < 42 && Math.abs(other.labelY - (cy - 7)) < 9,
      )
      placed.push({ zone, cx, cy, labelY: crowded ? cy + 15 : cy - 7 })
    }
    return placed
  }, [zones])

  return (
    <div className="map-wrap">
      <svg
        className="map"
        viewBox={`0 0 ${WORLD_WIDTH} ${WORLD_HEIGHT}`}
        role="img"
        aria-label={`World map with ${zones.length} time zones pinned`}
      >
        {bands.map((band) => (
          <rect
            key={band.offset}
            className="band is-lit"
            x={band.left}
            y={0}
            width={band.width}
            height={WORLD_HEIGHT}
          />
        ))}

        {Array.from({ length: 25 }, (_, i) => {
          const lon = -180 + i * 15
          return (
            <line
              key={lon}
              className="meridian"
              x1={x(lon)}
              y1={0}
              x2={x(lon)}
              y2={WORLD_HEIGHT}
            />
          )
        })}

        <path className="land" d={WORLD_LAND_PATH} />
        <path className="night" d={nightPath} />

        {pins.map(({ zone, cx, cy, labelY }) => {
          const home = zone.id === homeId
          return (
            <g key={zone.id}>
              <circle className="pin-halo" cx={cx} cy={cy} r={6} />
              <circle className={`pin${home ? ' is-home' : ''}`} cx={cx} cy={cy} r={2.8} />
              <text
                className="pin-label"
                x={cx}
                y={labelY}
                textAnchor={cx > WORLD_WIDTH - 60 ? 'end' : cx < 60 ? 'start' : 'middle'}
              >
                {zone.city}
              </text>
            </g>
          )
        })}
      </svg>
      <div className="map-legend">
        <span>
          <i className="swatch-home" /> your zone
        </span>
        <span>
          <i className="swatch-zone" /> compared zone
        </span>
        <span>
          <i className="swatch-band" /> that zone&rsquo;s 15° band
        </span>
        <span>
          <i className="swatch-night" /> night right now
        </span>
      </div>
    </div>
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

  const utcHours =
    at.getUTCHours() + at.getUTCMinutes() / 60 + at.getUTCSeconds() / 3600
  const subsolarLon = -15 * (utcHours - 12)

  // The terminator: the latitude where the sun sits exactly on the horizon for
  // each longitude. tan(lat) = -cos(lon - subsolar) / tan(declination).
  const points: string[] = []
  const edgeLat = declination > 0 ? -90 : 90 // the pole in darkness
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
