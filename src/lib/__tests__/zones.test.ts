import { describe, expect, it } from 'vitest'
import {
  ZONES,
  describeRelativeOffset,
  dstStatus,
  findZone,
  formatOffset,
  headlineCity,
  matchZones,
  offsetHue,
  resolvePlace,
  resolveZone,
  searchZones,
  zoneAbbreviation,
  zoneLongName,
} from '../zones'

describe('ZONES', () => {
  it('holds only identifiers the platform recognises', () => {
    for (const zone of ZONES) {
      expect(
        () => new Intl.DateTimeFormat('en-US', { timeZone: zone.id }),
        `${zone.id} should be a valid IANA zone`,
      ).not.toThrow()
    }
  })

  it('has no duplicate identifiers', () => {
    expect(new Set(ZONES.map((z) => z.id)).size).toBe(ZONES.length)
  })

  it('gives every zone at least one city with plausible coordinates', () => {
    for (const zone of ZONES) {
      expect(zone.cities.length, `${zone.id} needs a city`).toBeGreaterThan(0)
      for (const city of zone.cities) {
        expect(Math.abs(city.lat), `${city.name} latitude`).toBeLessThanOrEqual(90)
        expect(Math.abs(city.lon), `${city.name} longitude`).toBeLessThanOrEqual(180)
      }
    }
  })

  it('never lists the same city twice', () => {
    const names = ZONES.flatMap((zone) => zone.cities.map((city) => city.name))
    expect(new Set(names).size).toBe(names.length)
  })
})

describe('matchZones', () => {
  it('offers the city that was asked for, not the zone headline', () => {
    const [albuquerque] = matchZones('albuquerque')
    expect(albuquerque.zone.id).toBe('America/Denver')
    expect(albuquerque.city.name).toBe('Albuquerque')
    expect(albuquerque.city.lon).toBeCloseTo(-106.65)

    const [austin] = matchZones('austin')
    expect(austin.zone.id).toBe('America/Chicago')
    expect(austin.city.name).toBe('Austin')
  })

  it('finds zones by informal abbreviation', () => {
    expect(matchZones('PST')[0].zone.id).toBe('America/Los_Angeles')
    expect(matchZones('JST')[0].zone.id).toBe('Asia/Tokyo')
  })

  it('finds UTC by its nicknames', () => {
    expect(matchZones('zulu')[0].zone.id).toBe('UTC')
  })

  it('reports which term matched', () => {
    expect(matchZones('berlin')[0]).toMatchObject({ matched: 'Berlin' })
    expect(matchZones('PST')[0]).toMatchObject({ matched: 'PST' })
  })

  it('prefers a city hit over a region hit of the same strength', () => {
    // "Mexico" is both a region and part of "New Mexico" in Denver's aliases.
    expect(matchZones('mexico city')[0].zone.id).toBe('America/Mexico_City')
  })

  it('returns everything for an empty query, and nothing for nonsense', () => {
    expect(matchZones('')).toHaveLength(ZONES.length)
    expect(matchZones('qqqzzz')).toHaveLength(0)
  })
})

describe('searchZones', () => {
  it('still answers in zones for callers that only want those', () => {
    expect(searchZones('taipei')[0].id).toBe('Asia/Taipei')
  })
})

describe('findZone / resolveZone / resolvePlace', () => {
  it('looks up curated zones', () => {
    expect(headlineCity(findZone('Asia/Tokyo')!).name).toBe('Tokyo')
    expect(findZone('Mars/Olympus')).toBeUndefined()
  })

  it('synthesises an entry for an uncurated zone', () => {
    const zone = resolveZone('America/Winnipeg')
    expect(zone.id).toBe('America/Winnipeg')
    expect(headlineCity(zone).name).toBe('Winnipeg')
  })

  it('restores a saved city, and falls back to the headline when it is gone', () => {
    expect(resolvePlace('America/Denver', 'Albuquerque').city.name).toBe('Albuquerque')
    expect(resolvePlace('America/Denver', 'Atlantis').city.name).toBe('Denver')
    expect(resolvePlace('America/Denver').city.name).toBe('Denver')
  })
})

describe('formatOffset', () => {
  it.each([
    [0, '+0'],
    [540, '+9'],
    [-480, '-8'],
    [330, '+5:30'],
    [-210, '-3:30'],
    [345, '+5:45'],
  ])('formats %i as %s', (minutes, expected) => {
    expect(formatOffset(minutes)).toBe(expected)
  })
})

describe('describeRelativeOffset', () => {
  it.each([
    [0, 'same time'],
    [180, '3h ahead'],
    [-330, '5h 30m behind'],
  ])('describes %i as %s', (minutes, expected) => {
    expect(describeRelativeOffset(minutes)).toBe(expected)
  })
})

describe('zoneAbbreviation / zoneLongName', () => {
  it('returns the familiar short name where one exists', () => {
    const winter = new Date('2026-01-15T12:00:00Z')
    expect(zoneAbbreviation(winter, 'America/New_York')).toBe('EST')
    expect(zoneAbbreviation(new Date('2026-07-15T12:00:00Z'), 'America/New_York')).toBe('EDT')
    expect(zoneAbbreviation(winter, 'UTC')).toBe('UTC')
  })

  it('uses the real abbreviation where the browser would give a bare offset', () => {
    const at = new Date('2026-07-15T12:00:00Z')
    expect(zoneAbbreviation(at, 'Asia/Tokyo')).toBe('JST')
    expect(zoneAbbreviation(at, 'Asia/Kolkata')).toBe('IST')
    expect(zoneAbbreviation(at, 'Europe/Paris')).toBe('CEST')
  })

  it('switches to the daylight abbreviation in the southern summer', () => {
    expect(zoneAbbreviation(new Date('2026-01-15T12:00:00Z'), 'Australia/Sydney')).toBe('AEDT')
    expect(zoneAbbreviation(new Date('2026-07-15T12:00:00Z'), 'Australia/Sydney')).toBe('AEST')
  })

  it('never returns a bare offset, which would duplicate the UTC column', () => {
    const at = new Date('2026-07-15T12:00:00Z')
    for (const zone of ZONES) {
      expect(zoneAbbreviation(at, zone.id)).not.toMatch(/^(GMT|UTC)[+-]/)
    }
  })

  it('gives every curated zone a non-offset long name', () => {
    const at = new Date('2026-07-15T12:00:00Z')
    for (const zone of ZONES) {
      const name = zoneLongName(at, zone.id)
      expect(name, `${zone.id} long name`).not.toBe('')
      expect(name, `${zone.id} long name`).not.toMatch(/^(GMT|UTC)[+-]/)
    }
  })
})

describe('dstStatus', () => {
  it('detects zones that observe DST and whether it is on', () => {
    expect(dstStatus(new Date('2026-07-15T12:00:00Z'), 'America/New_York')).toEqual({
      observes: true,
      active: true,
    })
    expect(dstStatus(new Date('2026-01-15T12:00:00Z'), 'America/New_York')).toEqual({
      observes: true,
      active: false,
    })
  })

  it('detects zones that never shift', () => {
    expect(dstStatus(new Date('2026-07-15T12:00:00Z'), 'America/Phoenix').observes).toBe(false)
    expect(dstStatus(new Date('2026-07-15T12:00:00Z'), 'Asia/Tokyo').observes).toBe(false)
  })

  it('handles the southern hemisphere, where DST runs over January', () => {
    expect(dstStatus(new Date('2026-01-15T12:00:00Z'), 'Australia/Sydney')).toEqual({
      observes: true,
      active: true,
    })
  })
})

describe('offsetHue', () => {
  /** Shortest distance between two hues on the wheel. */
  const apart = (a: number, b: number) => {
    const d = Math.abs(a - b) % 360
    return Math.min(d, 360 - d)
  }

  it('puts the four US zones far apart on the colour wheel', () => {
    const hues = [-8, -7, -6, -5].map((h) => offsetHue(h * 60))
    expect(new Set(hues).size).toBe(4)
    for (let i = 1; i < hues.length; i += 1) {
      // Neighbours must be unmistakable, not two shades of the same colour.
      expect(apart(hues[i], hues[i - 1])).toBeGreaterThan(60)
    }
  })

  it('gives all 24 hourly zones a distinct hue', () => {
    const hues = new Set<number>()
    for (let hours = -11; hours <= 12; hours += 1) hues.add(offsetHue(hours * 60))
    expect(hues.size).toBe(24)
  })

  it('stays inside the colour wheel', () => {
    for (let hours = -12; hours <= 14; hours += 1) {
      const hue = offsetHue(hours * 60)
      expect(hue).toBeGreaterThanOrEqual(0)
      expect(hue).toBeLessThan(360)
    }
  })

  it('rounds half-hour zones to their nearest hour band', () => {
    expect(offsetHue(330)).toBe(offsetHue(360))
  })
})
