import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ArrowRight, Check, ChevronDown, Clock, Crown, RefreshCw, Search, Star, Wallet, Zap } from 'lucide-react'
import { useStore } from '../lib/store'
import {
  PLATFORM_LABEL,
  SERVICES,
  TIERS,
  TIER_ORDER,
  formatINR,
  type Platform,
  type Quality,
  type Service,
} from '../lib/data'
import { refillOf } from '../lib/serviceInfo'
import { PlatformIcon } from './PlatformIcon'
import TierBadge from './TierBadge'
import OrderModal from './OrderModal'

type Sort = 'recommended' | 'price-asc' | 'price-desc'
const CLS: Record<Quality, string> = { Standard: 'std', Premium: 'pre', Pro: 'pro' }
const PAGE = 12
const n = (v: number) => v.toLocaleString('en-IN')

const PLATFORMS: Platform[] = Array.from(new Set(SERVICES.map((s) => s.platform)))

/**
 * One catalog for the whole panel. /services and /new-order both render this, so every
 * service (curated or synced from the provider) looks and behaves the same everywhere:
 * pick a grade, open a platform, tap a service, order from the product sheet.
 */
export default function ServiceCatalog({ variant }: { variant: 'services' | 'order' }) {
  const { state } = useStore()
  const [params, setParams] = useSearchParams()

  const [tier, setTier] = useState<Quality>('Premium')
  const [openPlatform, setOpenPlatform] = useState<Platform | null>(null)
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState<Sort>('recommended')
  const [activeId, setActiveId] = useState<string | null>(null)

  // deep links such as /new-order?service=ig-followers jump straight to that service's sheet
  const paramService = params.get('service')
  useEffect(() => {
    if (!paramService) return
    const s = SERVICES.find((x) => x.id === paramService)
    if (s) {
      setTier(s.quality)
      setOpenPlatform(s.platform)
      setActiveId(s.id)
    }
    const next = new URLSearchParams(params)
    next.delete('service')
    setParams(next, { replace: true })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paramService])

  const q = query.trim().toLowerCase()
  const matches = (s: Service) => q === '' || `${s.name} ${s.category} ${PLATFORM_LABEL[s.platform]} ${s.description}`.toLowerCase().includes(q)

  const tierStats = useMemo(
    () =>
      TIER_ORDER.map((t) => {
        const all = SERVICES.filter((s) => s.quality === t)
        const shown = all.filter(matches)
        return { t, total: all.length, shown: shown.length, from: all.length ? Math.min(...all.map((s) => s.rate)) : 0 }
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [q],
  )

  const inTier = useMemo(() => SERVICES.filter((s) => s.quality === tier && matches(s)), [tier, q]) // eslint-disable-line react-hooks/exhaustive-deps

  const groups = useMemo(
    () =>
      PLATFORMS.map((p) => {
        const list = inTier.filter((s) => s.platform === p)
        const sorted = sort === 'recommended' ? list : [...list].sort((a, b) => (sort === 'price-asc' ? a.rate - b.rate : b.rate - a.rate))
        return { p, list: sorted, from: list.length ? Math.min(...list.map((s) => s.rate)) : 0 }
      }).filter((g) => g.list.length > 0),
    [inTier, sort],
  )

  const active = activeId ? SERVICES.find((s) => s.id === activeId) ?? null : null
  const info = TIERS[tier]
  const searching = q !== ''

  const pickTier = (t: Quality) => {
    setTier(t)
    setOpenPlatform(null)
  }

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <span className="eyebrow">{variant === 'order' ? 'Order studio' : 'Services'}</span>
          <h1>{variant === 'order' ? 'Launch a new order' : 'Pick your growth grade'}</h1>
          <p>
            {variant === 'order'
              ? 'Choose a grade, open a platform and tap the service you want. Everything about it is on one sheet, and you order right there.'
              : 'Three grades, one simple rule: the higher the grade, the stronger and steadier the result. Tap a service to see exactly what you get.'}
          </p>
        </div>
        {variant === 'order' ? (
          <Link to="/add-funds" className="btn btn-soft">
            <Wallet /> Balance {formatINR(state.balance, 0)}
          </Link>
        ) : null}
      </div>

      {/* 1 · grade tabs: always one line, always big */}
      <div className="cg-tabs" role="tablist" aria-label="Service grade">
        {tierStats.map(({ t, shown, total, from }) => {
          const Icon = t === 'Pro' ? Crown : Star
          const on = tier === t
          return (
            <button
              key={t}
              type="button"
              role="tab"
              aria-selected={on}
              className={`cg-tab ${CLS[t]} ${on ? 'on' : ''}`}
              onClick={() => pickTier(t)}
            >
              <span className="cg-tab-ic"><Icon fill={t === 'Standard' ? 'none' : 'currentColor'} aria-hidden="true" /></span>
              <span className="cg-tab-name">{t}</span>
              <span className="cg-tab-grade">{TIERS[t].grade}</span>
              <span className="cg-tab-from">from {formatINR(from, 0)}<small>/1k</small></span>
              <span className="cg-tab-count">{searching ? `${shown} match${shown === 1 ? '' : 'es'}` : `${total} services`}</span>
              <span className="cg-tab-check" aria-hidden="true"><Check size={13} /></span>
            </button>
          )
        })}
      </div>

      {/* selected grade story */}
      <div key={tier} className={`cg-story ${CLS[tier]}`}>
        <div className="cg-story-main">
          <b>{info.headline}</b>
          <p>{info.blurb}</p>
        </div>
        <ul className="cg-story-perks">
          {info.perks.map((p) => (<li key={p}><Check size={13} /> {p}</li>))}
        </ul>
      </div>

      {/* 2 · search + sort */}
      <div className="cg-tools">
        <label className="searchbox">
          <Search size={15} />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search followers, views, likes…" aria-label="Search services" />
        </label>
        <select className="select" value={sort} onChange={(e) => setSort(e.target.value as Sort)} aria-label="Sort services">
          <option value="recommended">Recommended</option>
          <option value="price-asc">Price: low to high</option>
          <option value="price-desc">Price: high to low</option>
        </select>
      </div>

      {/* 3 · platform dropdowns */}
      <div className="cg-accs">
        {groups.map((g) => (
          <PlatformAccordion
            key={g.p}
            platform={g.p}
            list={g.list}
            from={g.from}
            tier={tier}
            open={searching || openPlatform === g.p}
            forced={searching}
            onToggle={() => setOpenPlatform(openPlatform === g.p ? null : g.p)}
            onPick={(s) => setActiveId(s.id)}
          />
        ))}
      </div>

      {groups.length === 0 ? (
        <div className="empty">
          <span className="ic"><Search /></span>
          <b>{searching ? 'No services match' : `No ${tier} services yet`}</b>
          <span>{searching ? 'Try another word, or check the other grades above.' : 'Pick another grade above.'}</span>
        </div>
      ) : null}

      <OrderModal service={active} onClose={() => setActiveId(null)} />
    </div>
  )
}

/* ------------------------------------------------------------------ */

function PlatformAccordion({
  platform,
  list,
  from,
  tier,
  open,
  forced,
  onToggle,
  onPick,
}: {
  platform: Platform
  list: Service[]
  from: number
  tier: Quality
  open: boolean
  forced: boolean
  onToggle: () => void
  onPick: (s: Service) => void
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [cat, setCat] = useState('All')
  const [limit, setLimit] = useState(PAGE)

  // a different grade or search means a different list: start the inner filters fresh
  useEffect(() => {
    setCat('All')
    setLimit(PAGE)
  }, [tier, list.length])

  // when a dropdown opens, bring its header to a comfortable spot
  const first = useRef(true)
  useEffect(() => {
    if (first.current) { first.current = false; return }
    if (!open || forced) return
    const t = window.setTimeout(() => {
      const el = ref.current
      if (!el) return
      const top = el.getBoundingClientRect().top
      if (top < 70 || top > window.innerHeight * 0.55) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 60)
    return () => window.clearTimeout(t)
  }, [open, forced])

  const cats = useMemo(() => {
    const m = new Map<string, number>()
    list.forEach((s) => m.set(s.category, (m.get(s.category) ?? 0) + 1))
    return Array.from(m.entries())
  }, [list])

  const filtered = cat === 'All' ? list : list.filter((s) => s.category === cat)
  const visible = filtered.slice(0, limit)

  return (
    <div ref={ref} className={`cg-acc ${CLS[tier]} ${open ? 'open' : ''}`}>
      <button
        type="button"
        className="cg-acc-head"
        onClick={onToggle}
        aria-expanded={open}
        disabled={forced}
      >
        <span className={`platform-tile ${platform} cg-acc-tile`}><PlatformIcon platform={platform} size={22} /></span>
        <span className="cg-acc-txt">
          <span className="cg-acc-name">{PLATFORM_LABEL[platform]}</span>
          <span className="cg-acc-sub">{list.length} {list.length === 1 ? 'service' : 'services'} · from {formatINR(from)} / 1k</span>
        </span>
        <span className="cg-acc-chev" aria-hidden="true"><ChevronDown size={20} /></span>
      </button>

      {open ? (
        <div className="cg-acc-body">
          {cats.length > 1 ? (
            <div className="cg-cats">
              {[['All', list.length] as const, ...cats].map(([c, count]) => (
                <button key={c} type="button" className={`chip ${cat === c ? 'active' : ''}`} onClick={() => { setCat(c); setLimit(PAGE) }}>
                  {c} <span className="cg-cat-n">{count}</span>
                </button>
              ))}
            </div>
          ) : null}

          <div className="cg-grid">
            {visible.map((s) => (<ServiceCard key={s.id} s={s} onPick={onPick} />))}
          </div>

          {filtered.length > visible.length ? (
            <button type="button" className="btn btn-ghost cg-more" onClick={() => setLimit((l) => l + PAGE)}>
              Show {Math.min(PAGE, filtered.length - visible.length)} more <ChevronDown />
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}

function ServiceCard({ s, onPick }: { s: Service; onPick: (s: Service) => void }) {
  const refill = refillOf(s)
  return (
    <button type="button" className={`cg-card ${CLS[s.quality]}`} onClick={() => onPick(s)}>
      <span className="cg-card-top">
        <span className="svc-kicker">{s.category}</span>
        <span className="cg-card-badges">
          {s.badge ? <span className="badge badge-lime">{s.badge}</span> : null}
          <TierBadge quality={s.quality} />
        </span>
      </span>
      <span className="cg-card-name">{s.name}</span>
      <span className="cg-card-desc">{s.description}</span>
      <span className="svc-meta">
        <span><Clock size={13} /> {s.avgTime}</span>
        <span><Zap size={13} /> {n(s.min)} – {n(s.max)}</span>
        <span className={`cg-refill ${refill.tone}`}><RefreshCw size={13} /> {refill.tone === 'none' ? 'No refill' : `Refill · ${refill.label}`}</span>
      </span>
      <span className="cg-card-foot">
        <span className="rate">{formatINR(s.rate)} <small>/ 1,000</small></span>
        <span className="btn btn-primary btn-sm">Order <ArrowRight /></span>
      </span>
    </button>
  )
}
