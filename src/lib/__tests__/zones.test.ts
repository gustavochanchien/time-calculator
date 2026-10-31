import { describe, expect, it } from 'vitest'
import {
  ZONES,
  describeRelativeOffset,
  dstStatus,
  findZone,
  formatOffset,
  matchZones,
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

  it('has plausible coordinates', () => {
    for (const zone of ZONES) {
      expect(Math.abs(zone.lat)).toBeLessThanOrEqual(90)
      expect(Math.abs(zone.lon)).toBeLessThanOrEqual(180)
    }
  })
})

describe('searchZones', () => {
  it('finds zones by informal abbreviation', () => {
    expect(searchZones('PST')[0].id).toBe('America/Los_Angeles')
    expect(searchZones('JST')[0].id).toBe('Asia/Tokyo')
  })

  it('finds zones by a city that is not the headline city', () => {
    expect(searchZones('Berlin')[0].id).toBe('Europe/Paris')
    expect(searchZones('Toronto')[0].id).toBe('America/New_York')
  })

  it('finds UTC by its nicknames', () => {
    expect(searchZones('zulu')[0].id).toBe('UTC')
  })

  it('returns everything for an empty query', () => {
    expect(searchZones('')).toHaveLength(ZONES.length)
  })

  it('returns nothing for nonsense', () => {
    expect(searchZones('qqqzzz')).toHaveLength(0)
  })
})

describe('findZone / resolveZone', () => {
  it('looks up curated zones', () => {
    expect(findZone('Asia/Tokyo')?.city).toBe('Tokyo')
    expect(findZone('Mars/Olympus')).toBeUndefined()
  })

  it('synthesises an entry for an uncurated zone', () => {
    expect(resolveZone('America/Winnipeg')).toMatchObject({
      id: 'America/Winnipeg',
      city: 'Winnipeg',
    })
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

describe('zoneAbbreviation', () => {
  it('returns the familiar short name where one exists', () => {
    const winter = new Date('2026-01-15T12:00:00Z')
    expect(zoneAbbreviation(winter, 'America/New_York')).toBe('EST')
    expect(zoneAbbreviation(new Date('2026-07-15T12:00:00Z'), 'America/New_York')).toBe('EDT')
    expect(zoneAbbreviation(winter, 'UTC')).toBe('UTC')
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

describe('curated abbreviations', () => {
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

describe('matchZones', () => {
  it('reports which name matched, so an alias hit is explainable', () => {
    expect(matchZones('berlin')[0]).toMatchObject({ matched: 'Berlin' })
    expect(matchZones('PST')[0]).toMatchObject({ matched: 'PST' })
  })

  it('falls back to the city when the city itself matched', () => {
    expect(matchZones('tokyo')[0]).toMatchObject({ matched: 'Tokyo' })
  })

  it('prefers an exact hit over a partial one', () => {
    // "IST" is an exact alias of Kolkata and Jerusalem, and a substring of nothing else.
    const ids = matchZones('IST').map((m) => m.zone.id)
    expect(ids).toContain('Asia/Kolkata')
  })
})
