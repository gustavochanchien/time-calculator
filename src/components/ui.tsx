import { useEffect, useRef, useState, type ReactNode } from 'react'

export function Panel({
  title,
  action,
  children,
}: {
  title?: string
  action?: ReactNode
  children: ReactNode
}) {
  return (
    <section className="panel">
      {(title || action) && (
        <div className="panel-head">
          {title && <h2 className="panel-title">{title}</h2>}
          {action && <div className="end">{action}</div>}
        </div>
      )}
      {children}
    </section>
  )
}

/** The one either/or control in the app. Full width, because these choices matter. */
export function Toggle<T extends string>({
  value,
  options,
  onChange,
  label,
}: {
  value: T
  options: { value: T; label: string }[]
  onChange: (value: T) => void
  label: string
}) {
  return (
    <div className="toggle" role="group" aria-label={label}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-pressed={value === option.value}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}

/** The answer. One per screen, and nothing else is allowed to be this big. */
export function Hero({
  label,
  value,
  meta,
  actions,
}: {
  label: string
  value: string
  meta?: ReactNode
  actions?: ReactNode
}) {
  return (
    <div className="hero">
      <p className="hero-label">{label}</p>
      <p className="hero-value tnum">{value}</p>
      {meta && <p className="hero-meta">{meta}</p>}
      {actions && <div className="hero-actions">{actions}</div>}
    </div>
  )
}

export function Slider({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
  format,
}: {
  label: string
  value: number
  min: number
  max: number
  step?: number
  onChange: (value: number) => void
  format: (value: number) => string
}) {
  return (
    <label className="slider">
      <span className="label">{label}</span>
      <output>{format(value)}</output>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </label>
  )
}

/** Copies text and confirms in place, since there is no toast anywhere else. */
export function CopyButton({ text, label = 'Copy' }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!copied) return
    const timeout = window.setTimeout(() => setCopied(false), 1400)
    return () => window.clearTimeout(timeout)
  }, [copied])

  return (
    <button
      type="button"
      className={`btn btn-util btn-copy${copied ? ' is-done' : ''}`}
      onClick={() => {
        void navigator.clipboard?.writeText(text).then(
          () => setCopied(true),
          () => setCopied(false),
        )
      }}
    >
      {copied ? 'Copied' : label}
    </button>
  )
}

/** A disclosure for settings — open it once, forget it exists. */
export function Detail({ summary, children }: { summary: ReactNode; children: ReactNode }) {
  return (
    <details className="detail">
      <summary>{summary}</summary>
      {children}
    </details>
  )
}

/** A details-based menu that closes when you click away or press Escape. */
export function Menu({ label, icon, children }: { label: string; icon: ReactNode; children: ReactNode }) {
  const ref = useRef<HTMLDetailsElement>(null)

  useEffect(() => {
    const close = (event: Event) => {
      const element = ref.current
      if (!element?.open) return
      if (event instanceof KeyboardEvent) {
        if (event.key === 'Escape') element.open = false
        return
      }
      if (!element.contains(event.target as Node)) element.open = false
    }
    document.addEventListener('pointerdown', close)
    document.addEventListener('keydown', close)
    return () => {
      document.removeEventListener('pointerdown', close)
      document.removeEventListener('keydown', close)
    }
  }, [])

  return (
    <details className="menu" ref={ref}>
      <summary aria-label={label} title={label}>
        {icon}
      </summary>
      <div className="menu-body">{children}</div>
    </details>
  )
}
