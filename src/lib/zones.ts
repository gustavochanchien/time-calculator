/**
 * A curated set of time zones — the ones people actually schedule against,
 * rather than the full IANA database of ~600. Each carries coordinates for the
 * map and the informal names people search by ("EST", "Pacific", "Zulu").
 */

import { clockParts, offsetMinutes } from './time'

export interface Zone {
  /** IANA identifier. */
  id: string
  city: string
  region: string
  lat: number
  lon: number
  /**
   * Standard-time abbreviation, and the daylight-time one where the zone
   * shifts. Carried here because browsers hand back bare offsets ("GMT+9")
   * for most zones outside the US, and "JST" is the name people use.
   */
  abbr: [standard: string, daylight?: string]
  /** Informal names and abbreviations, for search. */
  aliases: string[]
}

export const ZONES: Zone[] = [
  // North America
  { id: 'America/Los_Angeles', city: 'Los Angeles', region: 'US West', lat: 34.05, lon: -118.24, abbr: ['PST', 'PDT'], aliases: ['PST', 'PDT', 'Pacific', 'LA', 'San Francisco', 'Seattle', 'Vancouver', 'Portland', 'Vegas'] },
  { id: 'America/Denver', city: 'Denver', region: 'US Mountain', lat: 39.74, lon: -104.99, abbr: ['MST', 'MDT'], aliases: ['MST', 'MDT', 'Mountain', 'Salt Lake City', 'Albuquerque', 'Santa Fe'] },
  { id: 'America/Phoenix', city: 'Phoenix', region: 'Arizona', lat: 33.45, lon: -112.07, abbr: ['MST'], aliases: ['MST', 'Arizona', 'no DST', 'Tucson'] },
  { id: 'America/Chicago', city: 'Chicago', region: 'US Central', lat: 41.88, lon: -87.63, abbr: ['CST', 'CDT'], aliases: ['CST', 'CDT', 'Central', 'Dallas', 'Houston', 'Austin', 'Minneapolis', 'Mexico City'] },
  { id: 'America/New_York', city: 'New York', region: 'US East', lat: 40.71, lon: -74.01, abbr: ['EST', 'EDT'], aliases: ['EST', 'EDT', 'Eastern', 'NYC', 'Boston', 'Atlanta', 'Miami', 'Toronto', 'DC', 'Washington'] },
  { id: 'America/Anchorage', city: 'Anchorage', region: 'Alaska', lat: 61.22, lon: -149.9, abbr: ['AKST', 'AKDT'], aliases: ['AKST', 'AKDT', 'Alaska'] },
  { id: 'Pacific/Honolulu', city: 'Honolulu', region: 'Hawaii', lat: 21.31, lon: -157.86, abbr: ['HST'], aliases: ['HST', 'Hawaii', 'no DST'] },
  { id: 'America/Halifax', city: 'Halifax', region: 'Atlantic Canada', lat: 44.65, lon: -63.58, abbr: ['AST', 'ADT'], aliases: ['AST', 'ADT', 'Atlantic'] },
  { id: 'America/Mexico_City', city: 'Mexico City', region: 'Mexico', lat: 19.43, lon: -99.13, abbr: ['CST'], aliases: ['CST', 'Mexico', 'CDMX'] },

  // South America
  { id: 'America/Bogota', city: 'Bogotá', region: 'Colombia', lat: 4.71, lon: -74.07, abbr: ['COT'], aliases: ['COT', 'Colombia', 'Lima', 'Peru', 'Quito'] },
  { id: 'America/Sao_Paulo', city: 'São Paulo', region: 'Brazil', lat: -23.55, lon: -46.63, abbr: ['BRT'], aliases: ['BRT', 'Brazil', 'Rio', 'Rio de Janeiro'] },
  { id: 'America/Argentina/Buenos_Aires', city: 'Buenos Aires', region: 'Argentina', lat: -34.6, lon: -58.38, abbr: ['ART'], aliases: ['ART', 'Argentina'] },
  { id: 'America/Santiago', city: 'Santiago', region: 'Chile', lat: -33.45, lon: -70.67, abbr: ['CLT', 'CLST'], aliases: ['CLT', 'Chile'] },

  // Europe & Africa
  { id: 'UTC', city: 'UTC', region: 'Coordinated Universal Time', lat: 0, lon: 0, abbr: ['UTC'], aliases: ['GMT', 'Zulu', 'Z', 'universal', 'coordinated'] },
  { id: 'Europe/London', city: 'London', region: 'UK & Ireland', lat: 51.51, lon: -0.13, abbr: ['GMT', 'BST'], aliases: ['GMT', 'BST', 'UK', 'Britain', 'Dublin', 'Edinburgh'] },
  { id: 'Europe/Lisbon', city: 'Lisbon', region: 'Portugal', lat: 38.72, lon: -9.14, abbr: ['WET', 'WEST'], aliases: ['WET', 'WEST', 'Portugal'] },
  { id: 'Europe/Paris', city: 'Paris', region: 'Central Europe', lat: 48.86, lon: 2.35, abbr: ['CET', 'CEST'], aliases: ['CET', 'CEST', 'France', 'Berlin', 'Madrid', 'Rome', 'Amsterdam', 'Brussels', 'Vienna', 'Zurich', 'Stockholm', 'Oslo', 'Copenhagen', 'Prague', 'Warsaw'] },
  { id: 'Europe/Athens', city: 'Athens', region: 'Eastern Europe', lat: 37.98, lon: 23.73, abbr: ['EET', 'EEST'], aliases: ['EET', 'EEST', 'Greece', 'Helsinki', 'Bucharest', 'Kyiv', 'Kiev'] },
  { id: 'Europe/Istanbul', city: 'Istanbul', region: 'Türkiye', lat: 41.01, lon: 28.98, abbr: ['TRT'], aliases: ['TRT', 'Turkey', 'Ankara'] },
  { id: 'Europe/Moscow', city: 'Moscow', region: 'Russia West', lat: 55.76, lon: 37.62, abbr: ['MSK'], aliases: ['MSK', 'Russia'] },
  { id: 'Africa/Lagos', city: 'Lagos', region: 'West Africa', lat: 6.52, lon: 3.38, abbr: ['WAT'], aliases: ['WAT', 'Nigeria', 'Accra', 'Algiers'] },
  { id: 'Africa/Cairo', city: 'Cairo', region: 'Egypt', lat: 30.04, lon: 31.24, abbr: ['EET', 'EEST'], aliases: ['EET', 'Egypt'] },
  { id: 'Africa/Nairobi', city: 'Nairobi', region: 'East Africa', lat: -1.29, lon: 36.82, abbr: ['EAT'], aliases: ['EAT', 'Kenya', 'Addis Ababa', 'Kampala'] },
  { id: 'Africa/Johannesburg', city: 'Johannesburg', region: 'South Africa', lat: -26.2, lon: 28.05, abbr: ['SAST'], aliases: ['SAST', 'South Africa', 'Cape Town'] },

  // Middle East & South Asia
  { id: 'Asia/Jerusalem', city: 'Jerusalem', region: 'Israel', lat: 31.77, lon: 35.21, abbr: ['IST', 'IDT'], aliases: ['IST', 'Israel', 'Tel Aviv'] },
  { id: 'Asia/Dubai', city: 'Dubai', region: 'Gulf', lat: 25.2, lon: 55.27, abbr: ['GST'], aliases: ['GST', 'UAE', 'Abu Dhabi', 'Muscat'] },
  { id: 'Asia/Tehran', city: 'Tehran', region: 'Iran', lat: 35.69, lon: 51.39, abbr: ['IRST'], aliases: ['IRST', 'Iran'] },
  { id: 'Asia/Karachi', city: 'Karachi', region: 'Pakistan', lat: 24.86, lon: 67.01, abbr: ['PKT'], aliases: ['PKT', 'Pakistan', 'Lahore', 'Islamabad'] },
  { id: 'Asia/Kolkata', city: 'Mumbai', region: 'India', lat: 19.08, lon: 72.88, abbr: ['IST'], aliases: ['IST', 'India', 'Delhi', 'Bangalore', 'Bengaluru', 'Calcutta', 'Chennai', 'Hyderabad'] },
  { id: 'Asia/Kathmandu', city: 'Kathmandu', region: 'Nepal', lat: 27.72, lon: 85.32, abbr: ['NPT'], aliases: ['NPT', 'Nepal'] },
  { id: 'Asia/Dhaka', city: 'Dhaka', region: 'Bangladesh', lat: 23.81, lon: 90.41, abbr: ['BST'], aliases: ['BST', 'Bangladesh'] },

  // East & Southeast Asia
  { id: 'Asia/Bangkok', city: 'Bangkok', region: 'Indochina', lat: 13.76, lon: 100.5, abbr: ['ICT'], aliases: ['ICT', 'Thailand', 'Hanoi', 'Vietnam', 'Jakarta', 'Saigon', 'Ho Chi Minh'] },
  { id: 'Asia/Singapore', city: 'Singapore', region: 'Singapore & Malaysia', lat: 1.35, lon: 103.82, abbr: ['SGT'], aliases: ['SGT', 'Kuala Lumpur', 'Malaysia', 'Manila', 'Philippines'] },
  { id: 'Asia/Shanghai', city: 'Shanghai', region: 'China', lat: 31.23, lon: 121.47, abbr: ['CST'], aliases: ['CST', 'China', 'Beijing', 'Hong Kong', 'Shenzhen', 'Macau'] },
  { id: 'Asia/Taipei', city: 'Taipei', region: 'Taiwan', lat: 25.03, lon: 121.57, abbr: ['CST'], aliases: ['CST', 'Taiwan', 'Kaohsiung', 'Taichung'] },
  { id: 'Asia/Seoul', city: 'Seoul', region: 'Korea', lat: 37.57, lon: 126.98, abbr: ['KST'], aliases: ['KST', 'Korea', 'Busan'] },
  { id: 'Asia/Tokyo', city: 'Tokyo', region: 'Japan', lat: 35.68, lon: 139.69, abbr: ['JST'], aliases: ['JST', 'Japan', 'Osaka', 'Kyoto'] },

  // Oceania
  { id: 'Australia/Perth', city: 'Perth', region: 'Western Australia', lat: -31.95, lon: 115.86, abbr: ['AWST'], aliases: ['AWST', 'Western Australia'] },
  { id: 'Australia/Adelaide', city: 'Adelaide', region: 'Central Australia', lat: -34.93, lon: 138.6, abbr: ['ACST', 'ACDT'], aliases: ['ACST', 'ACDT', 'South Australia'] },
  { id: 'Australia/Brisbane', city: 'Brisbane', region: 'Queensland', lat: -27.47, lon: 153.03, abbr: ['AEST'], aliases: ['AEST', 'Queensland', 'no DST'] },
  { id: 'Australia/Sydney', city: 'Sydney', region: 'Eastern Australia', lat: -33.87, lon: 151.21, abbr: ['AEST', 'AEDT'], aliases: ['AEST', 'AEDT', 'Melbourne', 'Canberra', 'Hobart'] },
  { id: 'Pacific/Auckland', city: 'Auckland', region: 'New Zealand', lat: -36.85, lon: 174.76, abbr: ['NZST', 'NZDT'], aliases: ['NZST', 'NZDT', 'New Zealand', 'Wellington'] },
  { id: 'Pacific/Fiji', city: 'Suva', region: 'Fiji', lat: -18.14, lon: 178.44, abbr: ['FJT'], aliases: ['FJT', 'Fiji'] },
]

const byId = new Map(ZONES.map((z) => [z.id, z]))

export function findZone(id: string): Zone | undefined {
  return byId.get(id)
}

/**
 * The local zone as a `Zone`, falling back to a synthesised entry when the
 * browser's zone isn't one of the curated ones.
 */
export function resolveZone(id: string): Zone {
  const known = byId.get(id)
  if (known) return known
  const city = id.split('/').pop()?.replace(/_/g, ' ') ?? id
  return { id, city, region: id, lat: 0, lon: 0, abbr: [''], aliases: [] }
}

export interface ZoneMatch {
  zone: Zone
  /**
   * The name that actually matched. Searching "Berlin" returns the Paris
   * zone, and without this the result list looks like it ignored the query.
   */
  matched: string
}

export function matchZones(query: string, limit = 12): ZoneMatch[] {
  const q = query.trim().toLowerCase()
  if (!q) return ZONES.map((zone) => ({ zone, matched: zone.city }))

  const scored: { zone: Zone; matched: string; score: number }[] = []
  for (const zone of ZONES) {
    const haystacks = [zone.city, zone.region, zone.id.replace(/[_/]/g, ' '), ...zone.aliases]
    let best = 0
    let matched = zone.city
    for (const hay of haystacks) {
      const h = hay.toLowerCase()
      const score = h === q ? 100 : h.startsWith(q) ? 70 : h.includes(q) ? 40 : 0
      if (score > best) {
        best = score
        matched = hay
      }
    }
    if (best) scored.push({ zone, matched, score: best })
  }

  // Ties keep the curated order, which runs roughly west to east.
  scored.sort((a, b) => b.score - a.score)
  return scored.slice(0, limit)
}

export function searchZones(query: string, limit = 12): Zone[] {
  return matchZones(query, limit).map((match) => match.zone)
}

function intlName(at: Date, timeZone: string, style: 'short' | 'long'): string {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    timeZoneName: style,
  }).formatToParts(at)
  return parts.find((p) => p.type === 'timeZoneName')?.value ?? ''
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

/** "+3h ahead" / "5h 30m behind" / "same time", relative to a base zone. */
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
