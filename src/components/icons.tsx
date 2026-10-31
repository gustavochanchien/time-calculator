/** Tab and menu glyphs. Stroked, 24-grid, so they sit evenly beside text. */

const base = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
}

export function MoonIcon() {
  return (
    <svg {...base}>
      <path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5Z" />
    </svg>
  )
}

export function TimerIcon() {
  return (
    <svg {...base}>
      <circle cx="12" cy="13" r="8" />
      <path d="M12 9.5V13l2.5 1.8M9.5 2h5" />
    </svg>
  )
}

/** A plus above a minus: the two things this tab does, legible at 17px. */
export function MathIcon() {
  return (
    <svg {...base}>
      <path d="M4 7.5h8M8 3.5v8M12 16.5h8" />
    </svg>
  )
}

export function GlobeIcon() {
  return (
    <svg {...base}>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3a15 15 0 0 1 0 18 15 15 0 0 1 0-18Z" />
    </svg>
  )
}

export function SlidersIcon() {
  return (
    <svg {...base}>
      <path d="M5 6h14M5 12h14M5 18h14" />
      <circle cx="9" cy="6" r="2" />
      <circle cx="15" cy="12" r="2" />
      <circle cx="8" cy="18" r="2" />
    </svg>
  )
}
