/**
 * A curated set of time zones — the ones people actually schedule against,
 * rather than the full IANA database of ~600.
 *
 * Zones are keyed by IANA id, but people think in cities, and a zone usually
 * has several that matter. Denver and Albuquerque are both US Mountain; a list
 * showing "Denver" to someone who asked for Albuquerque is quietly wrong. So
 * each zone carries its notable cities with their own coordinates, and a row
 * in the UI is a *place*: a zone plus which of its cities you picked.
 */

import { clockParts, offsetMinutes } from './time'

export interface City {
  name: string
  lat: number
  lon: number
}

export interface Zone {
  /** IANA identifier. */
  id: string
  region: string
  /** Notable cities, headline first. The headline names the zone in menus. */
  cities: City[]
  /**
   * Standard-time abbreviation, and the daylight-time one where the zone
   * shifts. Carried here because browsers hand back bare offsets ("GMT+9")
   * for most zones outside the US, and "JST" is the name people use.
   */
  abbr: [standard: string, daylight?: string]
  /** Non-city search terms: countries, abbreviations, nicknames. */
  aliases: string[]
}

export const ZONES: Zone[] = [
  // ------------------------------------------------------------ Americas
  {
    id: 'America/Los_Angeles',
    region: 'US Pacific',
    abbr: ['PST', 'PDT'],
    aliases: ['Pacific', 'west coast', 'California'],
    cities: [
      { name: 'Los Angeles', lat: 34.05, lon: -118.24 },
      { name: 'San Francisco', lat: 37.77, lon: -122.42 },
      { name: 'Seattle', lat: 47.61, lon: -122.33 },
      { name: 'San Diego', lat: 32.72, lon: -117.16 },
      { name: 'Las Vegas', lat: 36.17, lon: -115.14 },
      { name: 'Portland', lat: 45.52, lon: -122.68 },
      { name: 'Vancouver', lat: 49.28, lon: -123.12 },
    ],
  },
  {
    id: 'America/Denver',
    region: 'US Mountain',
    abbr: ['MST', 'MDT'],
    aliases: ['Mountain', 'New Mexico', 'Colorado', 'Utah'],
    cities: [
      { name: 'Denver', lat: 39.74, lon: -104.99 },
      { name: 'Albuquerque', lat: 35.08, lon: -106.65 },
      { name: 'Santa Fe', lat: 35.69, lon: -105.94 },
      { name: 'Salt Lake City', lat: 40.76, lon: -111.89 },
      { name: 'Boise', lat: 43.62, lon: -116.2 },
      { name: 'El Paso', lat: 31.76, lon: -106.49 },
    ],
  },
  {
    id: 'America/Phoenix',
    region: 'Arizona',
    abbr: ['MST'],
    aliases: ['Arizona', 'no DST'],
    cities: [
      { name: 'Phoenix', lat: 33.45, lon: -112.07 },
      { name: 'Tucson', lat: 32.22, lon: -110.97 },
    ],
  },
  {
    id: 'America/Chicago',
    region: 'US Central',
    abbr: ['CST', 'CDT'],
    aliases: ['Central', 'Texas', 'midwest'],
    cities: [
      { name: 'Chicago', lat: 41.88, lon: -87.63 },
      { name: 'Austin', lat: 30.27, lon: -97.74 },
      { name: 'Dallas', lat: 32.78, lon: -96.8 },
      { name: 'Houston', lat: 29.76, lon: -95.37 },
      { name: 'San Antonio', lat: 29.42, lon: -98.49 },
      { name: 'Minneapolis', lat: 44.98, lon: -93.27 },
      { name: 'Nashville', lat: 36.16, lon: -86.78 },
      { name: 'New Orleans', lat: 29.95, lon: -90.07 },
    ],
  },
  {
    id: 'America/New_York',
    region: 'US Eastern',
    abbr: ['EST', 'EDT'],
    aliases: ['Eastern', 'NYC', 'east coast'],
    cities: [
      { name: 'New York', lat: 40.71, lon: -74.01 },
      { name: 'Washington DC', lat: 38.91, lon: -77.04 },
      { name: 'Boston', lat: 42.36, lon: -71.06 },
      { name: 'Philadelphia', lat: 39.95, lon: -75.17 },
      { name: 'Atlanta', lat: 33.75, lon: -84.39 },
      { name: 'Miami', lat: 25.76, lon: -80.19 },
      { name: 'Detroit', lat: 42.33, lon: -83.05 },
      { name: 'Toronto', lat: 43.65, lon: -79.38 },
    ],
  },
  {
    id: 'America/Anchorage',
    region: 'Alaska',
    abbr: ['AKST', 'AKDT'],
    aliases: ['Alaska'],
    cities: [{ name: 'Anchorage', lat: 61.22, lon: -149.9 }],
  },
  {
    id: 'Pacific/Honolulu',
    region: 'Hawaii',
    abbr: ['HST'],
    aliases: ['Hawaii', 'no DST'],
    cities: [{ name: 'Honolulu', lat: 21.31, lon: -157.86 }],
  },
  {
    id: 'America/Halifax',
    region: 'Atlantic Canada',
    abbr: ['AST', 'ADT'],
    aliases: ['Atlantic', 'Nova Scotia'],
    cities: [{ name: 'Halifax', lat: 44.65, lon: -63.58 }],
  },
  {
    id: 'America/Mexico_City',
    region: 'Mexico',
    abbr: ['CST'],
    aliases: ['Mexico', 'CDMX', 'no DST'],
    cities: [
      { name: 'Mexico City', lat: 19.43, lon: -99.13 },
      { name: 'Guadalajara', lat: 20.67, lon: -103.35 },
    ],
  },
  {
    id: 'America/Bogota',
    region: 'Colombia & Peru',
    abbr: ['COT'],
    aliases: ['Colombia', 'Peru', 'Ecuador'],
    cities: [
      { name: 'Bogotá', lat: 4.71, lon: -74.07 },
      { name: 'Lima', lat: -12.05, lon: -77.04 },
      { name: 'Quito', lat: -0.18, lon: -78.47 },
    ],
  },
  {
    id: 'America/Sao_Paulo',
    region: 'Brazil',
    abbr: ['BRT'],
    aliases: ['Brazil', 'no DST'],
    cities: [
      { name: 'São Paulo', lat: -23.55, lon: -46.63 },
      { name: 'Rio de Janeiro', lat: -22.91, lon: -43.17 },
      { name: 'Brasília', lat: -15.79, lon: -47.88 },
    ],
  },
  {
    id: 'America/Argentina/Buenos_Aires',
    region: 'Argentina',
    abbr: ['ART'],
    aliases: ['Argentina'],
    cities: [{ name: 'Buenos Aires', lat: -34.6, lon: -58.38 }],
  },
  {
    id: 'America/Santiago',
    region: 'Chile',
    abbr: ['CLT', 'CLST'],
    aliases: ['Chile'],
    cities: [{ name: 'Santiago', lat: -33.45, lon: -70.67 }],
  },

  // ------------------------------------------------- Europe & Africa
  {
    id: 'UTC',
    region: 'Coordinated Universal Time',
    abbr: ['UTC'],
    aliases: ['GMT', 'Zulu', 'Z', 'universal'],
    cities: [{ name: 'UTC', lat: 0, lon: 0 }],
  },
  {
    id: 'Europe/London',
    region: 'UK & Ireland',
    abbr: ['GMT', 'BST'],
    aliases: ['UK', 'Britain', 'England', 'Ireland'],
    cities: [
      { name: 'London', lat: 51.51, lon: -0.13 },
      { name: 'Dublin', lat: 53.35, lon: -6.26 },
      { name: 'Edinburgh', lat: 55.95, lon: -3.19 },
      { name: 'Manchester', lat: 53.48, lon: -2.24 },
    ],
  },
  {
    id: 'Europe/Lisbon',
    region: 'Portugal',
    abbr: ['WET', 'WEST'],
    aliases: ['Portugal'],
    cities: [{ name: 'Lisbon', lat: 38.72, lon: -9.14 }],
  },
  {
    id: 'Europe/Paris',
    region: 'Central Europe',
    abbr: ['CET', 'CEST'],
    aliases: ['France', 'Germany', 'Spain', 'Italy', 'Netherlands', 'Poland', 'Sweden'],
    cities: [
      { name: 'Paris', lat: 48.86, lon: 2.35 },
      { name: 'Berlin', lat: 52.52, lon: 13.4 },
      { name: 'Madrid', lat: 40.42, lon: -3.7 },
      { name: 'Rome', lat: 41.9, lon: 12.5 },
      { name: 'Amsterdam', lat: 52.37, lon: 4.9 },
      { name: 'Brussels', lat: 50.85, lon: 4.35 },
      { name: 'Zurich', lat: 47.38, lon: 8.54 },
      { name: 'Vienna', lat: 48.21, lon: 16.37 },
      { name: 'Stockholm', lat: 59.33, lon: 18.07 },
      { name: 'Oslo', lat: 59.91, lon: 10.75 },
      { name: 'Copenhagen', lat: 55.68, lon: 12.57 },
      { name: 'Prague', lat: 50.08, lon: 14.44 },
      { name: 'Warsaw', lat: 52.23, lon: 21.01 },
    ],
  },
  {
    id: 'Europe/Athens',
    region: 'Eastern Europe',
    abbr: ['EET', 'EEST'],
    aliases: ['Greece', 'Finland', 'Romania', 'Ukraine'],
    cities: [
      { name: 'Athens', lat: 37.98, lon: 23.73 },
      { name: 'Helsinki', lat: 60.17, lon: 24.94 },
      { name: 'Bucharest', lat: 44.43, lon: 26.1 },
      { name: 'Kyiv', lat: 50.45, lon: 30.52 },
    ],
  },
  {
    id: 'Europe/Istanbul',
    region: 'Türkiye',
    abbr: ['TRT'],
    aliases: ['Turkey', 'no DST'],
    cities: [
      { name: 'Istanbul', lat: 41.01, lon: 28.98 },
      { name: 'Ankara', lat: 39.93, lon: 32.86 },
    ],
  },
  {
    id: 'Europe/Moscow',
    region: 'Western Russia',
    abbr: ['MSK'],
    aliases: ['Russia', 'no DST'],
    cities: [
      { name: 'Moscow', lat: 55.76, lon: 37.62 },
      { name: 'Saint Petersburg', lat: 59.93, lon: 30.34 },
    ],
  },
  {
    id: 'Africa/Lagos',
    region: 'West Africa',
    abbr: ['WAT'],
    aliases: ['Nigeria', 'Ghana', 'Algeria'],
    cities: [
      { name: 'Lagos', lat: 6.52, lon: 3.38 },
      { name: 'Accra', lat: 5.6, lon: -0.19 },
      { name: 'Algiers', lat: 36.75, lon: 3.06 },
    ],
  },
  {
    id: 'Africa/Cairo',
    region: 'Egypt',
    abbr: ['EET', 'EEST'],
    aliases: ['Egypt'],
    cities: [{ name: 'Cairo', lat: 30.04, lon: 31.24 }],
  },
  {
    id: 'Africa/Nairobi',
    region: 'East Africa',
    abbr: ['EAT'],
    aliases: ['Kenya', 'Ethiopia', 'Uganda', 'Tanzania'],
    cities: [
      { name: 'Nairobi', lat: -1.29, lon: 36.82 },
      { name: 'Addis Ababa', lat: 9.03, lon: 38.74 },
      { name: 'Kampala', lat: 0.35, lon: 32.58 },
    ],
  },
  {
    id: 'Africa/Johannesburg',
    region: 'South Africa',
    abbr: ['SAST'],
    aliases: ['South Africa'],
    cities: [
      { name: 'Johannesburg', lat: -26.2, lon: 28.05 },
      { name: 'Cape Town', lat: -33.92, lon: 18.42 },
    ],
  },

  // ------------------------------------------- Middle East & South Asia
  {
    id: 'Asia/Jerusalem',
    region: 'Israel',
    abbr: ['IST', 'IDT'],
    aliases: ['Israel'],
    cities: [
      { name: 'Jerusalem', lat: 31.77, lon: 35.21 },
      { name: 'Tel Aviv', lat: 32.08, lon: 34.78 },
    ],
  },
  {
    id: 'Asia/Dubai',
    region: 'Gulf',
    abbr: ['GST'],
    aliases: ['UAE', 'Emirates', 'Oman'],
    cities: [
      { name: 'Dubai', lat: 25.2, lon: 55.27 },
      { name: 'Abu Dhabi', lat: 24.45, lon: 54.38 },
      { name: 'Muscat', lat: 23.59, lon: 58.41 },
    ],
  },
  {
    id: 'Asia/Tehran',
    region: 'Iran',
    abbr: ['IRST'],
    aliases: ['Iran', 'no DST'],
    cities: [{ name: 'Tehran', lat: 35.69, lon: 51.39 }],
  },
  {
    id: 'Asia/Karachi',
    region: 'Pakistan',
    abbr: ['PKT'],
    aliases: ['Pakistan'],
    cities: [
      { name: 'Karachi', lat: 24.86, lon: 67.01 },
      { name: 'Lahore', lat: 31.55, lon: 74.34 },
      { name: 'Islamabad', lat: 33.68, lon: 73.05 },
    ],
  },
  {
    id: 'Asia/Kolkata',
    region: 'India',
    abbr: ['IST'],
    aliases: ['India', 'Calcutta'],
    cities: [
      { name: 'Mumbai', lat: 19.08, lon: 72.88 },
      { name: 'Delhi', lat: 28.61, lon: 77.21 },
      { name: 'Bengaluru', lat: 12.97, lon: 77.59 },
      { name: 'Chennai', lat: 13.08, lon: 80.27 },
      { name: 'Hyderabad', lat: 17.39, lon: 78.49 },
      { name: 'Kolkata', lat: 22.57, lon: 88.36 },
    ],
  },
  {
    id: 'Asia/Kathmandu',
    region: 'Nepal',
    abbr: ['NPT'],
    aliases: ['Nepal'],
    cities: [{ name: 'Kathmandu', lat: 27.72, lon: 85.32 }],
  },
  {
    id: 'Asia/Dhaka',
    region: 'Bangladesh',
    abbr: ['BST'],
    aliases: ['Bangladesh'],
    cities: [{ name: 'Dhaka', lat: 23.81, lon: 90.41 }],
  },

  // --------------------------------------------- East & Southeast Asia
  {
    id: 'Asia/Bangkok',
    region: 'Indochina',
    abbr: ['ICT'],
    aliases: ['Thailand', 'Vietnam', 'Indonesia'],
    cities: [
      { name: 'Bangkok', lat: 13.76, lon: 100.5 },
      { name: 'Jakarta', lat: -6.21, lon: 106.85 },
      { name: 'Hanoi', lat: 21.03, lon: 105.85 },
      { name: 'Ho Chi Minh City', lat: 10.82, lon: 106.63 },
    ],
  },
  {
    id: 'Asia/Singapore',
    region: 'Singapore & Malaysia',
    abbr: ['SGT'],
    aliases: ['Malaysia', 'Philippines'],
    cities: [
      { name: 'Singapore', lat: 1.35, lon: 103.82 },
      { name: 'Kuala Lumpur', lat: 3.14, lon: 101.69 },
      { name: 'Manila', lat: 14.6, lon: 120.98 },
    ],
  },
  {
    id: 'Asia/Shanghai',
    region: 'China',
    abbr: ['CST'],
    aliases: ['China', 'no DST'],
    cities: [
      { name: 'Shanghai', lat: 31.23, lon: 121.47 },
      { name: 'Beijing', lat: 39.9, lon: 116.41 },
      { name: 'Hong Kong', lat: 22.32, lon: 114.17 },
      { name: 'Shenzhen', lat: 22.54, lon: 114.06 },
    ],
  },
  {
    id: 'Asia/Taipei',
    region: 'Taiwan',
    abbr: ['CST'],
    aliases: ['Taiwan', 'no DST'],
    cities: [
      { name: 'Taipei', lat: 25.03, lon: 121.57 },
      { name: 'Taichung', lat: 24.15, lon: 120.67 },
      { name: 'Kaohsiung', lat: 22.63, lon: 120.3 },
    ],
  },
  {
    id: 'Asia/Seoul',
    region: 'Korea',
    abbr: ['KST'],
    aliases: ['Korea', 'no DST'],
    cities: [
      { name: 'Seoul', lat: 37.57, lon: 126.98 },
      { name: 'Busan', lat: 35.18, lon: 129.08 },
    ],
  },
  {
    id: 'Asia/Tokyo',
    region: 'Japan',
    abbr: ['JST'],
    aliases: ['Japan', 'no DST'],
    cities: [
      { name: 'Tokyo', lat: 35.68, lon: 139.69 },
      { name: 'Osaka', lat: 34.69, lon: 135.5 },
      { name: 'Kyoto', lat: 35.01, lon: 135.77 },
    ],
  },

  // -------------------------------------------------------- Oceania
  {
    id: 'Australia/Perth',
    region: 'Western Australia',
    abbr: ['AWST'],
    aliases: ['Western Australia', 'no DST'],
    cities: [{ name: 'Perth', lat: -31.95, lon: 115.86 }],
  },
  {
    id: 'Australia/Adelaide',
    region: 'Central Australia',
    abbr: ['ACST', 'ACDT'],
    aliases: ['South Australia'],
    cities: [{ name: 'Adelaide', lat: -34.93, lon: 138.6 }],
  },
  {
    id: 'Australia/Brisbane',
    region: 'Queensland',
    abbr: ['AEST'],
    aliases: ['Queensland', 'no DST'],
    cities: [{ name: 'Brisbane', lat: -27.47, lon: 153.03 }],
  },
  {
    id: 'Australia/Sydney',
    region: 'Eastern Australia',
    abbr: ['AEST', 'AEDT'],
    aliases: ['New South Wales', 'Victoria'],
    cities: [
      { name: 'Sydney', lat: -33.87, lon: 151.21 },
      { name: 'Melbourne', lat: -37.81, lon: 144.96 },
      { name: 'Canberra', lat: -35.28, lon: 149.13 },
      { name: 'Hobart', lat: -42.88, lon: 147.33 },
    ],
  },
  {
    id: 'Pacific/Auckland',
    region: 'New Zealand',
    abbr: ['NZST', 'NZDT'],
    aliases: ['New Zealand'],
    cities: [
      { name: 'Auckland', lat: -36.85, lon: 174.76 },
      { name: 'Wellington', lat: -41.29, lon: 174.78 },
    ],
  },
  {
    id: 'Pacific/Fiji',
    region: 'Fiji',
    abbr: ['FJT'],
    aliases: ['Fiji'],
    cities: [{ name: 'Suva', lat: -18.14, lon: 178.44 }],
  },
]

const byId = new Map(ZONES.map((zone) => [zone.id, zone]))

/** A row in the user's list: a zone plus which of its cities they picked. */
export interface Place {
  zone: Zone
  city: City
}

export function findZone(id: string): Zone | undefined {
  return byId.get(id)
}

/** The headline city, which is how a zone is named wherever one name will do. */
export function headlineCity(zone: Zone): City {
  return zone.cities[0]
}

/**
 * A zone as a `Zone`, synthesising an entry when the browser reports one that
 * isn't curated.
 */
export function resolveZone(id: string): Zone {
  const known = byId.get(id)
  if (known) return known
  const name = id.split('/').pop()?.replace(/_/g, ' ') ?? id
  return {
    id,
    region: id,
    abbr: [''],
    aliases: [],
    cities: [{ name, lat: 0, lon: 0 }],
  }
}

/** Resolves a saved `{ id, city }` pair back into a zone and its coordinates. */
export function resolvePlace(id: string, cityName?: string): Place {
  const zone = resolveZone(id)
  const city =
    (cityName && zone.cities.find((candidate) => candidate.name === cityName)) ||
    headlineCity(zone)
  return { zone, city }
}

export interface ZoneMatch {
  zone: Zone
  /** The city this result is offering — not always the zone's headline city. */
  city: City
  /** The term that matched, so an alias hit can explain itself. */
  matched: string
}

export function matchZones(query: string, limit = 12): ZoneMatch[] {
  const q = query.trim().toLowerCase()
  if (!q) {
    return ZONES.map((zone) => {
      const city = headlineCity(zone)
      return { zone, city, matched: city.name }
    })
  }

  const results: { zone: Zone; city: City; matched: string; score: number }[] = []
  for (const zone of ZONES) {
    let best = 0
    let city = headlineCity(zone)
    let matched = city.name

    const consider = (text: string, forCity?: City) => {
      const h = text.toLowerCase()
      const score = h === q ? 100 : h.startsWith(q) ? 70 : h.includes(q) ? 40 : 0
      if (!score) return
      // A city match outranks a region or alias match of the same strength,
      // so searching "Austin" offers Austin rather than Chicago.
      const weighted = forCity ? score + 1 : score
      if (weighted > best) {
        best = weighted
        matched = text
        if (forCity) city = forCity
      }
    }

    for (const candidate of zone.cities) consider(candidate.name, candidate)
    consider(zone.region)
    consider(zone.id.replace(/[_/]/g, ' '))
    for (const abbreviation of zone.abbr) if (abbreviation) consider(abbreviation)
    for (const alias of zone.aliases) consider(alias)

    if (best) results.push({ zone, city, matched, score: best })
  }

  // Ties keep the curated order, which runs roughly west to east.
  results.sort((a, b) => b.score - a.score)
  return results.slice(0, limit)
}

export function searchZones(query: string, limit = 12): Zone[] {
  return matchZones(query, limit).map((match) => match.zone)
}

function intlName(at: Date, timeZone: string, style: 'short' | 'long'): string {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    timeZoneName: style,
  }).formatToParts(at)
  return parts.find((part) => part.type === 'timeZoneName')?.value ?? ''
}

/** True for the "GMT+9" / "UTC-03:00" strings browsers fall back to. */
function isBareOffset(name: string): boolean {
  return /^(GMT|UTC)([+-]|$)/.test(name)
}

/**
 * "PST", "JST", "AEDT" — the name people say out loud.
 *
 * Curated data wins, because browsers only carry real abbreviations for a
 * handful of zones and hand back "GMT+9" for the rest. Falls back to the
 * platform name, then to nothing rather than to a duplicate of the offset the
 * UI already shows.
 */
export function zoneAbbreviation(at: Date, timeZone: string): string {
  const zone = byId.get(timeZone)
  if (zone) {
    const [standard, daylight] = zone.abbr
    return dstStatus(at, timeZone).active && daylight ? daylight : standard
  }
  const platform = intlName(at, timeZone, 'short')
  return isBareOffset(platform) ? '' : platform
}

/** "Pacific Standard Time", or the zone's region where there is no such name. */
export function zoneLongName(at: Date, timeZone: string): string {
  if (timeZone === 'UTC') return 'Coordinated Universal Time'
  const platform = intlName(at, timeZone, 'long')
  if (platform && !isBareOffset(platform)) return platform
  return byId.get(timeZone)?.region ?? ''
}

/** "+5:30", "-8", "+0". */
export function formatOffset(minutes: number): string {
  const sign = minutes < 0 ? '-' : '+'
  const abs = Math.abs(minutes)
  const h = Math.floor(abs / 60)
  const m = abs % 60
  return m ? `${sign}${h}:${String(m).padStart(2, '0')}` : `${sign}${h}`
}

/** "3h ahead" / "5h 30m behind" / "same time", relative to a base zone. */
export function describeRelativeOffset(deltaMinutes: number): string {
  if (deltaMinutes === 0) return 'same time'
  const abs = Math.abs(deltaMinutes)
  const h = Math.floor(abs / 60)
  const m = abs % 60
  const span = m ? `${h}h ${m}m` : `${h}h`
  return `${span} ${deltaMinutes > 0 ? 'ahead' : 'behind'}`
}

/** Whether this zone observes DST at all, and whether it is in it right now. */
export function dstStatus(at: Date, timeZone: string): { observes: boolean; active: boolean } {
  const year = clockParts(at, timeZone).year
  const january = offsetMinutes(new Date(Date.UTC(year, 0, 15)), timeZone)
  const july = offsetMinutes(new Date(Date.UTC(year, 6, 15)), timeZone)
  const observes = january !== july
  const current = offsetMinutes(at, timeZone)
  return { observes, active: observes && current === Math.max(january, july) }
}

/**
 * A stable hue for a UTC offset, used to colour the map.
 *
 * The obvious choice — hue tracking longitude, one lap of the colour wheel per
 * lap of the globe — puts neighbours 15° apart in hue, and 15° of hue is four
 * shades of the same colour. Reading Pacific against Mountain then depends on
 * telling two greens apart through a night shadow, which does not work.
 *
 * So the step is 105° instead. It divides into 360 often enough to give all 24
 * hourly zones a distinct hue, while putting adjacent zones most of the way
 * across the wheel from each other. Across the United States that lands on
 * blue, pink, green and cyan for Pacific, Mountain, Central and Eastern.
 */
const HUE_STEP = 105

export function offsetHue(offsetMinutesFromUtc: number): number {
  const hours = Math.round(offsetMinutesFromUtc / 60)
  return (((hours * HUE_STEP) % 360) + 360) % 360
}
