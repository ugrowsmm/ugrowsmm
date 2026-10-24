import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Check, Clock, Search, Sparkles, Zap } from 'lucide-react'
import {
  PLATFORM_LABEL,
  SERVICES,
  TIERS,
  TIER_ORDER,
  formatINR,
  type Platform,
  type Quality,
} from '../lib/data'
import { PlatformIcon } from '../components/PlatformIcon'
import TierBadge from '../components/TierBadge'

type Sort = 'recommended' | 'price-asc' | 'price-desc'

const PLATFORMS: Array<Platform | 'all'> = [
  'all',
  ...(Array.from(new Set(SERVICES.map((s) => s.platform))) as Platform[]),
]
const CLS: Record<Quality, string> = { Standard: 'std', Premium: 'pre', Pro: 'pro' }

export default function Services() {
  const [query, setQuery] = useState('')
  const [platform, setPlatform] = useState<Platform | 'all'>('all')
  const [tier, setTier] = useState<Quality | 'all'>('all')
  const [sort, setSort] = useState<Sort>('recommended')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return SERVICES.filter(
      (s) =>
        (platform === 'all' || s.platform === platform) &&
        (tier === 'all' || s.quality === tier) &&
        (q === '' || `${s.name} ${s.category} ${s.description}`.toLowerCase().includes(q)),
    )
  }, [query, platform, tier])

  const sorted = (list: typeof filtered) =>
    sort === 'recommended' ? list : [...list].sort((a, b) => (sort === 'price-asc' ? a.rate - b.rate : b.rate - a.rate))

  const stats = TIER_ORDER.map((t) => {
    const list = SERVICES.filter((s) => s.quality === t)
    return { t, count: list.length, from: Math.min(...list.map((s) => s.rate)) }
  })

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <span className="eyebrow">Services</span>
          <h1>Pick your growth grade</h1>
          <p>Three grades, one simple rule: the higher the grade, the stronger and steadier the result. You always see exactly what you are paying for.</p>
        </div>
      </div>

      <div className="tier-grid">
        {stats.map(({ t, count, from }) => (
          <button
            key={t}
            type="button"
            className={`tier-card ${CLS[t]} ${tier === t ? 'selected' : ''}`}
            onClick={() => setTier(tier === t ? 'all' : t)}
            aria-pressed={tier === t}
          >
            <div className="between">
              <TierBadge quality={t} large />
              <span className="tier-from">from {formatINR(from)}<small> /1k</small></span>
            </div>
            <div className="tier-grade">{TIERS[t].grade}</div>
            <div className="tier-headline">{TIERS[t].headline}</div>
            <p className="tier-blurb">{TIERS[t].blurb}</p>
            <ul className="tier-perks">
              {TIERS[t].perks.map((p) => (
                <li key={p}><Check size={14} /> {p}</li>
              ))}
            </ul>
            <div className="tier-foot">{count} services · {tier === t ? 'Showing only this grade' : 'Tap to filter'}</div>
          </button>
        ))}
      </div>

      <div className="filter-bar" style={{ marginTop: 22 }}>
        <label className="searchbox" style={{ minWidth: 0 }}>
          <Search size={15} />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search followers, views, likes…" aria-label="Search services" />
        </label>
        <select className="select" style={{ width: 'auto' }} value={sort} onChange={(e) => setSort(e.target.value as Sort)} aria-label="Sort services">
          <option value="recommended">Recommended</option>
          <option value="price-asc">Price: low to high</option>
          <option value="price-desc">Price: high to low</option>
        </select>
      </div>
      <div className="row wrap" style={{ gap: 7, marginBottom: 22 }}>
        {PLATFORMS.map((p) => (
          <button key={p} type="button" className={`chip ${platform === p ? 'active' : ''}`} onClick={() => setPlatform(p)}>
            {p === 'all' ? (<><Sparkles /> All platforms</>) : (<><PlatformIcon platform={p} /> {PLATFORM_LABEL[p]}</>)}
          </button>
        ))}
      </div>

      {TIER_ORDER.map((t) => {
        const list = sorted(filtered.filter((s) => s.quality === t))
        if (list.length === 0) return null
        return (
          <section key={t} className="tier-section">
            <div className="tier-section-head">
              <TierBadge quality={t} large />
              <div>
                <h2>{t} services</h2>
                <p>{TIERS[t].grade} · {TIERS[t].headline}</p>
              </div>
              <span className="pill">{list.length}</span>
            </div>
            <div className="service-grid">
              {list.map((s) => (
                <Link key={s.id} to={`/new-order?service=${s.id}`} className={`service-card ${CLS[s.quality]}`}>
                  <div className="top">
                    <span className={`platform-tile ${s.platform}`}><PlatformIcon platform={s.platform} /></span>
                    <div className="row" style={{ gap: 6 }}>
                      {s.badge ? <span className="badge badge-lime">{s.badge}</span> : null}
                      <TierBadge quality={s.quality} />
                    </div>
                  </div>
                  <div>
                    <div className="svc-kicker">{PLATFORM_LABEL[s.platform]} · {s.category}</div>
                    <div className="name" style={{ marginTop: 6 }}>{s.name}</div>
                    <div className="cat" style={{ marginTop: 6, lineHeight: 1.55 }}>{s.description}</div>
                  </div>
                  <div className="svc-meta">
                    <span><Clock size={13} /> {s.avgTime}</span>
                    <span><Zap size={13} /> {s.min.toLocaleString('en-IN')} – {s.max.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="bottom">
                    <div className="rate">{formatINR(s.rate)} <span>/ 1,000</span></div>
                    <span className="btn btn-primary btn-sm">Order <ArrowRight /></span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )
      })}

      {filtered.length === 0 ? (
        <div className="empty"><span className="ic"><Search /></span><b>No services match</b><span>Try another word, platform or grade.</span></div>
      ) : null}
    </div>
  )
}
