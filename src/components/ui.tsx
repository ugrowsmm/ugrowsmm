import {
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { createPortal } from 'react-dom'
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  Info,
  Loader2,
  ShieldCheck,
  Sparkles,
  X,
  XCircle,
} from 'lucide-react'
import type { OrderStatus } from '../lib/data'

/* ---------------- count up ---------------- */

export function useCountUp(target: number, duration = 900) {
  const [value, setValue] = useState(target)
  const from = useRef(target)

  useEffect(() => {
    const start = performance.now()
    const origin = from.current
    let raf = 0
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / duration)
      const eased = 1 - Math.pow(1 - p, 3)
      setValue(origin + (target - origin) * eased)
      if (p < 1) raf = requestAnimationFrame(tick)
      else from.current = target
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [target, duration])

  return value
}

/* ---------------- modal ---------------- */

export function Modal({
  open,
  onClose,
  children,
  labelledBy,
  width = 460,
}: {
  open: boolean
  onClose: () => void
  children: ReactNode
  labelledBy?: string
  width?: number
}) {
  const dialogRef = useRef<HTMLDivElement>(null)
  const closeRef = useRef(onClose)
  closeRef.current = onClose

  useEffect(() => {
    if (!open) return
    const previouslyFocused = document.activeElement as HTMLElement | null

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeRef.current()
        return
      }
      if (e.key !== 'Tab') return

      const node = dialogRef.current
      if (!node) return
      const focusables = Array.from(
        node.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      ).filter((el) => el.offsetParent !== null)

      if (focusables.length === 0) {
        e.preventDefault()
        node.focus({ preventScroll: true })
        return
      }

      const first = focusables[0]
      const last = focusables[focusables.length - 1]
      const activeEl = document.activeElement
      if (e.shiftKey && (activeEl === first || activeEl === node)) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && (activeEl === last || activeEl === node)) {
        e.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const raf = requestAnimationFrame(() => {
      const node = dialogRef.current
      if (!node) return
      // focus the dialog itself, never an input: on phones that would pop the keyboard open before the person taps anything
      node.focus({ preventScroll: true })
    })

    return () => {
      cancelAnimationFrame(raf)
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
      if (previouslyFocused?.isConnected) previouslyFocused.focus({ preventScroll: true })
    }
  }, [open])

  if (!open) return null

  return createPortal(
    <div
      className="overlay"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        ref={dialogRef}
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        tabIndex={-1}
        style={{ maxWidth: width }}
      >
        {children}
      </div>
    </div>,
    document.body,
  )
}

export function ModalHead({
  title,
  subtitle,
  onClose,
  id,
}: {
  title: string
  subtitle?: string
  onClose: () => void
  id?: string
}) {
  return (
    <div className="modal-head">
      <div>
        <h2 id={id}>{title}</h2>
        {subtitle ? <p className="sub">{subtitle}</p> : null}
      </div>
      <button className="modal-close" onClick={onClose} aria-label="Close dialog" type="button">
        <X />
      </button>
    </div>
  )
}

/* ---------------- switch ---------------- */

export function Switch({
  on,
  onChange,
  label,
}: {
  on: boolean
  onChange: (next: boolean) => void
  label: string
}) {
  return (
    <button
      type="button"
      className={`switch ${on ? 'on' : ''}`}
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={() => onChange(!on)}
    />
  )
}

/* ---------------- copy ---------------- */

export async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    try {
      const el = document.createElement('textarea')
      el.value = text
      document.body.appendChild(el)
      el.select()
      document.execCommand('copy')
      document.body.removeChild(el)
      return true
    } catch {
      return false
    }
  }
}

export function CopyButton({
  text,
  onCopied,
  label = 'Copy',
}: {
  text: string
  onCopied?: () => void
  label?: string
}) {
  const [done, setDone] = useState(false)
  return (
    <button
      type="button"
      className={`copy-btn ${done ? 'done' : ''}`}
      aria-label={done ? 'Copied' : label}
      onClick={async () => {
        const ok = await copyText(text)
        if (ok) {
          setDone(true)
          onCopied?.()
          window.setTimeout(() => setDone(false), 1800)
        }
      }}
    >
      {done ? <Check /> : <Copy />}
    </button>
  )
}

/* ---------------- segmented ---------------- */

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  label,
}: {
  options: readonly T[]
  value: T
  onChange: (next: T) => void
  label: string
}) {
  return (
    <div className="segmented" role="tablist" aria-label={label}>
      {options.map((option) => (
        <button
          key={option}
          type="button"
          role="tab"
          aria-selected={value === option}
          className={value === option ? 'active' : ''}
          onClick={() => onChange(option)}
        >
          {option}
        </button>
      ))}
    </div>
  )
}

/* ---------------- status ---------------- */

const statusMap: Record<
  OrderStatus,
  { cls: string; icon: ReactNode; spin?: boolean }
> = {
  'In progress': { cls: 'badge-cyan', icon: <Loader2 />, spin: true },
  Completed: { cls: 'badge-green', icon: <CheckCircle2 /> },
  Partial: { cls: 'badge-amber', icon: <AlertTriangle /> },
  Canceled: { cls: 'badge-red', icon: <XCircle /> },
  Pending: { cls: 'badge-violet', icon: <Clock /> },
}

export function StatusBadge({ status }: { status: OrderStatus }) {
  const cfg = statusMap[status]
  return (
    <span className={`badge ${cfg.cls}`}>
      <span className={cfg.spin ? 'spin' : ''} style={{ display: 'inline-flex' }}>
        {cfg.icon}
      </span>
      {status}
    </span>
  )
}

/* ---------------- charts ---------------- */

function smoothPath(points: { x: number; y: number }[]) {
  if (points.length < 2) return ''
  let d = `M ${points[0].x} ${points[0].y}`
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] ?? points[i]
    const p1 = points[i]
    const p2 = points[i + 1]
    const p3 = points[i + 2] ?? p2
    const t = 0.18
    const c1x = p1.x + (p2.x - p0.x) * t
    const c1y = p1.y + (p2.y - p0.y) * t
    const c2x = p2.x - (p3.x - p1.x) * t
    const c2y = p2.y - (p3.y - p1.y) * t
    d += ` C ${c1x} ${c1y}, ${c2x} ${c2y}, ${p2.x} ${p2.y}`
  }
  return d
}

export function AreaChart({
  data,
  labels,
  height = 210,
  prefix = '₹',
}: {
  data: number[]
  labels: string[]
  height?: number
  prefix?: string
}) {
  const uid = useId().replace(/:/g, '')
  const wrapRef = useRef<HTMLDivElement>(null)
  const [hover, setHover] = useState<number | null>(null)

  const W = 640
  const H = 220
  const padX = 6
  const padTop = 18
  const padBottom = 8
  const max = Math.max(...data) * 1.12
  const min = 0

  const pts = data.map((v, i) => ({
    x: padX + (i / (data.length - 1)) * (W - padX * 2),
    y: padTop + (1 - (v - min) / (max - min)) * (H - padTop - padBottom),
    v,
  }))

  const line = smoothPath(pts)
  const area = `${line} L ${pts[pts.length - 1].x} ${H} L ${pts[0].x} ${H} Z`

  const onMove = (clientX: number) => {
    const el = wrapRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width))
    const idx = Math.round(ratio * (data.length - 1))
    setHover(idx)
  }

  const active = hover !== null ? pts[hover] : null

  return (
    <div
      className="chart-wrap"
      ref={wrapRef}
      style={{ position: 'relative', height }}
      onMouseMove={(e) => onMove(e.clientX)}
      onMouseLeave={() => setHover(null)}
      onTouchStart={(e) => onMove(e.touches[0].clientX)}
      onTouchMove={(e) => onMove(e.touches[0].clientX)}
      onTouchEnd={() => setHover(null)}
    >
      <svg
        width="100%"
        height="100%"
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        role="img"
        aria-label={`Spend over the last ${data.length} days`}
      >
        <defs>
          <linearGradient id={`fill-${uid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f97316" stopOpacity="0.4" />
            <stop offset="55%" stopColor="#38bdf8" stopOpacity="0.12" />
            <stop offset="100%" stopColor="#38bdf8" stopOpacity="0" />
          </linearGradient>
          <linearGradient id={`stroke-${uid}`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#ea580c" />
            <stop offset="60%" stopColor="#f97316" />
            <stop offset="100%" stopColor="#38bdf8" />
          </linearGradient>
        </defs>

        {[0.25, 0.5, 0.75, 1].map((f) => (
          <line
            key={f}
            x1={0}
            x2={W}
            y1={padTop + f * (H - padTop - padBottom)}
            y2={padTop + f * (H - padTop - padBottom)}
            stroke="rgba(16, 24, 40, 0.055)"
            strokeDasharray="3 6"
          />
        ))}

        <path d={area} fill={`url(#fill-${uid})`} />
        <path
          d={line}
          fill="none"
          stroke={`url(#stroke-${uid})`}
          strokeWidth="2.4"
          strokeLinecap="round"
        />

        {active ? (
          <g>
            <line
              x1={active.x}
              x2={active.x}
              y1={padTop - 6}
              y2={H}
              stroke="rgba(253, 186, 116, 0.35)"
              strokeDasharray="4 4"
            />
            <circle cx={active.x} cy={active.y} r="9" fill="rgba(249, 115, 22, 0.22)" />
            <circle
              cx={active.x}
              cy={active.y}
              r="4.3"
              fill="#c2410c"
              stroke="#ffffff"
              strokeWidth="2"
            />
          </g>
        ) : null}
      </svg>

      {active && hover !== null ? (
        <div
          style={{
            position: 'absolute',
            left: `${(active.x / W) * 100}%`,
            top: Math.max(0, (active.y / H) * height - 58),
            transform: 'translateX(-50%)',
            padding: '6px 10px',
            borderRadius: 9,
            border: '1px solid rgba(16, 24, 40, 0.14)',
            background: 'rgba(255, 255, 255, 0.98)',
            boxShadow: '0 10px 26px -12px rgba(16, 24, 40, 0.4)',
            pointerEvents: 'none',
            whiteSpace: 'nowrap',
            zIndex: 2,
          }}
        >
          <div style={{ fontSize: 9.5, color: '#5b6472', fontWeight: 700, letterSpacing: '0.06em' }}>
            {labels[hover]?.toUpperCase()}
          </div>
          <div style={{ fontSize: 12.5, fontWeight: 800, marginTop: 1 }}>
            {prefix}
            {active.v.toLocaleString('en-IN')}
          </div>
        </div>
      ) : null}

      <div
        style={{
          position: 'absolute',
          insetInline: 0,
          bottom: -18,
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: 9.5,
          color: 'var(--faint)',
          fontWeight: 600,
        }}
      >
        <span>{labels[0]}</span>
        <span className="hide-mobile">{labels[Math.floor(labels.length / 2)]}</span>
        <span>{labels[labels.length - 1]}</span>
      </div>
    </div>
  )
}

export function ProgressRing({
  percent,
  size = 38,
  stroke = 3.5,
}: {
  percent: number
  size?: number
  stroke?: number
}) {
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  return (
    <div className="progress-ring" style={{ width: size, height: size }}>
      <svg width={size} height={size}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="rgba(16, 24, 40, 0.09)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="#ea580c"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c - (Math.min(100, Math.max(0, percent)) / 100) * c}
          style={{ transition: 'stroke-dashoffset .8s cubic-bezier(.22,1,.36,1)' }}
        />
      </svg>
      <span className="pct">{Math.round(percent)}%</span>
    </div>
  )
}

/* ---------------- misc ---------------- */

export function InfoBox({
  children,
  warn = false,
  icon,
}: {
  children: ReactNode
  warn?: boolean
  icon?: ReactNode
}) {
  return (
    <div className={`info-box ${warn ? 'warn' : ''}`}>
      {icon ?? (warn ? <AlertTriangle /> : <Info />)}
      <div>{children}</div>
    </div>
  )
}

export function EmptyState({
  icon,
  title,
  body,
  action,
}: {
  icon: ReactNode
  title: string
  body: string
  action?: ReactNode
}) {
  return (
    <div className="empty">
      <div className="ic">{icon}</div>
      <b>{title}</b>
      <div style={{ maxWidth: 320 }}>{body}</div>
      {action}
    </div>
  )
}

export const IconChip = ({ children }: { children: ReactNode }) => (
  <span className="pill">
    <Sparkles style={{ width: 10, height: 10 }} />
    {children}
  </span>
)

export const SecureNote = () => (
  <div className="secure-note">
    <ShieldCheck /> Secured by UGrowSMM · demo environment
  </div>
)
