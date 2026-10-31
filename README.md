# Time Calculator

A small, fast web app for the handful of time questions that are annoying to
work out in your head. Mobile-first — it is built to be opened one-handed on a
phone at 1am — and it runs entirely in the browser against your own clock.

## What it does

**Sleep** — the alarm question, in both directions.

- *I go to bed at…* → the times to set an alarm for, each landing at the end of
  a sleep cycle rather than in the middle of one.
- *I need to be up at…* → the times to go to bed to get the same effect.

The model is the usual one: you take a while to fall asleep (15 minutes by
default), and then run through repeating ~90-minute cycles. Both numbers are
sliders, because neither is the same for everyone, and every answer rebuilds
from them. Five and six cycles — 7½ to 9 hours asleep — are marked as the range
most adults do best in.

**Countdown** — pick a date and time, get the value to punch into a timer
(`4:12:30`), plus the same gap as total hours, total minutes, and sleeps.

**Add / subtract** — "five hours from now", or the span between two times.
Handles crossing midnight and crossing a daylight-saving boundary.

**Time zones** — compare your zone against any others, now or at a time you
set, with the abbreviation people actually use (JST, AEDT, GMT) rather than the
bare offset browsers hand back. Search by city, country, or abbreviation:
"Berlin", "PST", "zulu". An equirectangular world map pins each zone, lights up
its 15° band, and shades the half of the planet where the sun is currently
down.

## Running it

```bash
npm install
npm run dev
```

| Script            | Does                                            |
| ----------------- | ----------------------------------------------- |
| `npm run dev`     | Dev server                                      |
| `npm run build`   | Typecheck and build to `dist/`                  |
| `npm test`        | Run the test suite once                         |
| `npm run lint`    | oxlint                                          |
| `npm run gen:map` | Regenerate the world map path (see below)       |

## How it is put together

React + TypeScript on Vite, no UI framework, no date library. The parts worth
knowing about:

- **`src/lib/time.ts`** — the timezone-aware clock arithmetic everything else
  is built on. Offsets, wall-clock ↔ instant conversion, and the awkward
  cases: a 2:30am that never happened because the clocks went forward, a
  "tomorrow" that is 23 or 25 hours away rather than 24.
- **`src/lib/sleep.ts`** — cycle math, in both directions.
- **`src/lib/duration.ts`** — parsing and formatting spans (`5h`, `1h30`,
  `1:30`, `2d 4h`).
- **`src/lib/zones.ts`** — a curated 43 zones with coordinates, search
  aliases, and hand-written abbreviations. The abbreviations are curated
  because browsers only carry real ones for a few US zones and return "GMT+9"
  for the rest.
- **`src/lib/worldPath.ts`** — *generated*. `npm run gen:map` turns the
  Natural Earth 110m land outline into a single static SVG path, so the app
  ships a map without shipping a mapping library or topology data at runtime.
  The map dependencies are devDependencies for exactly this reason.

The core libraries are pure functions and carry the test suite (97 tests),
including DST transitions in both hemispheres. The components hold no logic
worth testing separately.

Settings — theme, 12/24-hour, sleep model, your zone list — persist to
`localStorage`, wrapped in try/catch so a private window or blocked site data
degrades to the defaults instead of a blank page.
