# Time Calculator

**Live: <https://gustavochanchien.github.io/time-calculator/>**

A small, fast web app for the handful of time questions that are annoying to
work out in your head. Mobile-first — built to be opened one-handed on a phone
at 1am — and it runs entirely in the browser against your own clock.

Every screen is built the same way: **one answer, as large as it can be**, with
the alternatives and the dials underneath it. Nothing competes with the thing
you came for.

## What it does

**Sleep** — the alarm question, in both directions.

- *I sleep at…* → the time to set an alarm for.
- *I wake at…* → the time to go to bed.

Either way the answer lands at the end of a sleep cycle rather than in the
middle of one, which is what makes a wake-up feel clean. It leads with five
cycles (7½ hours asleep) when that is reachable, and with the most sleep still
on the table when it isn't — at 1am, working back from a 7am alarm, the ideal
bedtime has already gone. Tap any alternative to promote it to the answer.

The model is the usual one: a while to fall asleep (15 minutes by default),
then repeating ~90-minute cycles. Both are sliders behind the summary line,
because neither number is the same for everyone.

**Timer** — pick a date and time, get the value to punch into a countdown
timer (`7:43:36`), ticking live.

**Math** — shift a time by a duration, with a ± 15-minute stepper and free
text (`5h`, `90m`, `1:30`, `2d 4h`); or measure the span between two times.
Handles crossing midnight and crossing a daylight-saving boundary.

**Zones** — compare your zone against others, now or at a time you set, with
the abbreviation people actually use (JST, AEDT, MDT) rather than the bare
offset browsers hand back. Rows are *places*, not zones: Albuquerque and
Austin are their own rows even though they share a zone with Denver and
Chicago. Search by city, country or abbreviation — "Albuquerque", "PST",
"zulu".

The map tints each 15° band by its UTC offset, which makes the four stripes
across the United States read as Pacific, Mountain, Central and Eastern at a
glance. Bands are longitude, not politics: real borders detour around state
and national lines. The shaded half is where the sun is down.

## Running it

```bash
npm install
npm run dev
```

| Script            | Does                                      |
| ----------------- | ----------------------------------------- |
| `npm run dev`     | Dev server                                |
| `npm run build`   | Typecheck and build to `dist/`            |
| `npm test`        | Run the test suite once                   |
| `npm run lint`    | oxlint                                    |
| `npm run gen:map` | Regenerate the world map path (see below) |

## Deploying

Pushing to `main` builds and publishes to GitHub Pages via
`.github/workflows/deploy.yml`, which runs the tests first and will not deploy
a red build.

Vite is configured with `base: './'`, so the bundle uses relative asset URLs
and the same `dist/` works at a domain root, at a Pages project subpath, or
opened straight off disk. Nothing hardcodes the repository name.

## How it is put together

React + TypeScript on Vite, no UI framework and no date library. The parts
worth knowing about:

- **`src/lib/time.ts`** — the timezone-aware clock arithmetic everything else
  is built on. Offsets, wall-clock ↔ instant conversion, and the awkward
  cases: a 2:30am that never happened because the clocks went forward, a
  "tomorrow" that is 23 or 25 hours away rather than 24.
- **`src/lib/sleep.ts`** — cycle math in both directions, plus which option to
  lead with.
- **`src/lib/duration.ts`** — parsing and formatting spans.
- **`src/lib/zones.ts`** — 43 zones and the ~126 cities that belong to them,
  with coordinates, search aliases, hand-written abbreviations, and the hue
  each offset is drawn in. Abbreviations are curated because browsers only
  carry real ones for a few US zones and return "GMT+9" for the rest. The hue
  step is 105° rather than something that tracks longitude, so that
  neighbouring zones are never two shades of the same colour — see the comment
  on `offsetHue`, which explains the version that didn't work.
- **`src/lib/worldPath.ts`** — *generated*. `npm run gen:map` turns the
  Natural Earth 110m land outline into a single static SVG path, so the app
  ships a map without shipping a mapping library or topology data at runtime.
  The map dependencies are devDependencies for exactly this reason.

The core libraries are pure functions and carry the test suite (106 tests),
including DST transitions in both hemispheres. The components hold no logic
worth testing separately.

### Interface

`src/index.css` is the whole design system; components carry no inline layout.
There is deliberately one of each control — one `.toggle` for every either/or,
one `.btn`, one `.option` row, one `.hero` — because the first version of this
app had five button styles and no hierarchy, and it was hard to use at the
hour you most need it. Settings live behind a disclosure or the header menu
rather than on the screen.

Below 640px the tab bar moves to the bottom inside the safe area, inputs are
16px so iOS doesn't zoom on focus, tap targets are 36px or more, and reference
detail like UTC offsets drops out of rows that can't fit it.

On a phone the layout is a fixed shell: `.app` is exactly `100svh` tall, the
tab bar is the last item in it and `main` takes the slack and scrolls itself.
Nothing is `position: fixed`. That matters because iOS positions a fixed bar
against the *layout* viewport — the viewport with the toolbar hidden — and
only hides the difference while a page is scrolling, so a fixed bottom bar
drifts off the bottom of the screen on any page that fits. Taking the page
out of the scroll path also means Safari's toolbar never collapses, which is
what used to resize the whole screen on a tab switch.

Buttons are coloured by what they do, so an action reads before its label:

| | |
|---|---|
| purple | this is the current choice — tabs, toggles, option and zone rows |
| green | give me this value — Right now, Today, Tomorrow, Start now |
| blue | work with the value I have — the steppers, Swap, Copy |
| red | delete this — the x on a zone row |

Amber stays out of it: it means a message you need to read (`.alert`), not a
thing you can press, and overloading it would cost that. Plain neutral is
left for controls that aren't actions on your data — the settings menu and
the disclosures. Copy turns green on success whatever its resting colour,
since that is the value landing where you asked. Every one of these clears
WCAG AA against its own background in both themes; the remove x is the
tightest at 5.25 (dark) and 5.06 (light), which is why it is mixed from
`--bad-ink` rather than `--bad`.

Sleep, Timer and Math are built to fit one phone screen without scrolling.
Safari with its toolbar showing leaves about 613pt on an iPhone 13 mini and
645pt on a 13, and `.app` takes `min-height: 100svh` — the viewport at its
smallest — so those three never scroll and Safari never resizes them. Paying
for that: on a phone the footer and the explanatory notes are hidden, the two
panel headings go (each restates the thing directly beneath it), cycle rows
are one line instead of two and drop the in-bed figure, and the list shows
four alternatives rather than five — the one dropped is the longest night, at
over ten hours. A wide screen still gets all of it. Zones is longer than any
phone and scrolls, which is the one place the toolbar can still reopen.

Settings — theme, 12/24-hour, sleep model, your zone list — persist to
`localStorage`, wrapped in try/catch so a private window or blocked site data
degrades to the defaults instead of a blank page.
