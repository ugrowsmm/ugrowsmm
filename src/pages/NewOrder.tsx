import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  Info,
  Link2,
  Plus,
  Search,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Wallet,
  Zap,
} from 'lucide-react'
import { useStore } from '../lib/store'
import {
  PLATFORM_LABEL,
  SERVICES,
  formatINR,
  type Order,
  type Platform,
} from '../lib/data'
import { PlatformIcon } from '../components/PlatformIcon'
import { InfoBox, Modal, StatusBadge, Switch } from '../components/ui'

const PLATFORMS: Array<Platform | 'all'> = ['all', ...(Array.from(new Set(SERVICES.map((x) => x.platform))) as Platform[])]

export default function NewOrder() {
  const { state, placeOrder, toast } = useStore()
  const navigate = useNavigate()
  const [params] = useSearchParams()

  const initial = params.get('service')
  const [platform, setPlatform] = useState<Platform | 'all'>('all')
  const [serviceId, setServiceId] = useState(
    initial && SERVICES.some((s) => s.id === initial) ? initial : 'ig-followers',
  )
  const [search, setSearch] = useState('')
  const [tier, setTier] = useState<'all' | 'Standard' | 'Premium' | 'Pro'>('all')
  const [link, setLink] = useState('')
  const [quantity, setQuantity] = useState(1000)
  const [drip, setDrip] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<Order | null>(null)

  const service = SERVICES.find((s) => s.id === serviceId) ?? SERVICES[0]
  const paramService = params.get('service')

  useEffect(() => {
    if (paramService && SERVICES.some((s) => s.id === paramService)) {
      setServiceId(paramService)
    }
  }, [paramService])

  useEffect(() => {
    setQuantity((q) => Math.min(Math.max(q, service.min), service.max))
    setError('')
  }, [service])

  const filtered = useMemo(
    () =>
      SERVICES.filter(
        (s) =>
          (platform === 'all' || s.platform === platform) &&
          (tier === 'all' || s.quality === tier) &&
          (search.trim() === '' ||
            s.name.toLowerCase().includes(search.toLowerCase()) ||
            s.category.toLowerCase().includes(search.toLowerCase())),
      ),
    [platform, search, tier],
  )

  // Keep the order summary in sync with the visible list: filtering by platform or
  // searching must never leave a hidden service selected behind the summary.
  useEffect(() => {
    if (filtered.length === 0) return
    if (!filtered.some((s) => s.id === serviceId)) setServiceId(filtered[0].id)
  }, [filtered, serviceId])

  const charge = Math.round(((service.rate * quantity) / 1000) * 100) / 100
  const insufficient = charge > state.balance
  const fillPct = ((quantity - service.min) / Math.max(1, service.max - service.min)) * 100

  const quickAmounts = useMemo(() => {
    const values = [service.min, 1000, 5000, 10000]
      .filter((v) => v >= service.min && v <= service.max)
      .filter((v, i, arr) => arr.indexOf(v) === i)
      .sort((a, b) => a - b)
    return [...values, service.max].filter((v, i, arr) => arr.indexOf(v) === i)
  }, [service])

  const [placing, setPlacing] = useState(false)
  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (placing) return
    setError('')
    setPlacing(true)
    const outcome = await placeOrder({ serviceId, link, quantity, dripfeed: drip })
    setPlacing(false)
    if (!outcome.ok) {
      setError(outcome.error ?? 'Something went wrong.')
      toast('Order not placed', outcome.error, 'error')
      return
    }
    if (outcome.order) {
      setResult(outcome.order)
      toast('Order placed successfully', `#${outcome.order.id} is now in the delivery queue.`)
      setLink('')
    }
  }

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <span className="eyebrow">
            <Sparkles size={12} /> Order studio
          </span>
          <h1>Launch a new order</h1>
          <p>
            Pick a service, drop the link, and watch delivery start. Transparent pricing — no
            hidden fees, ever.
          </p>
        </div>
        <div className="row wrap" style={{ gap: 10 }}>
          <Link to="/services" className="btn btn-ghost">
            <ShoppingBag /> Browse catalog
          </Link>
          <Link to="/add-funds" className="btn btn-soft">
            <Wallet /> Balance {formatINR(state.balance, 0)}
          </Link>
        </div>
      </div>

      <form className="order-layout" onSubmit={submit}>
        <div>
          <div className="form-section">
            <div className="form-section-head">
              <span className="step-dot">1</span>
              <h2>Choose your service</h2>
              <span className="pill" style={{ marginLeft: 'auto' }}>
                {filtered.length} of {SERVICES.length}
              </span>
            </div>

            <div className="input-wrap" style={{ marginBottom: 14 }}>
              <span className="lead">
                <Search />
              </span>
              <input
                className="input"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search followers, views, likes…"
                aria-label="Search services"
              />
            </div>

            <div className="row wrap" style={{ gap: 7 }}>
              {PLATFORMS.map((p) => (
                <button
                  key={p}
                  type="button"
                  className={`chip ${platform === p ? 'active' : ''}`}
                  style={{ height: 32, padding: '0 11px', fontSize: 11.5 }}
                  onClick={() => setPlatform(p)}
                >
                  {p === 'all' ? (
                    <>
                      <Sparkles /> All
                    </>
                  ) : (
                    <>
                      <PlatformIcon platform={p} size={13} /> {PLATFORM_LABEL[p]}
                    </>
                  )}
                </button>
              ))}
            </div>

            <div className="segmented" style={{ marginTop: 12 }} role="tablist" aria-label="Service tier">
              {(['all', 'Standard', 'Premium', 'Pro'] as const).map((t) => (
                <button key={t} type="button" role="tab" aria-selected={tier === t} className={tier === t ? 'active' : ''} onClick={() => setTier(t)}>
                  {t === 'all' ? 'All' : t === 'Standard' ? '★ Standard' : t === 'Premium' ? '★ Premium' : '♛ Pro'}
                </button>
              ))}
            </div>

            <div className="service-select-list">
              {filtered.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  className={`service-option ${s.id === serviceId ? 'active' : ''}`}
                  onClick={() => setServiceId(s.id)}
                  aria-pressed={s.id === serviceId}
                >
                  <span className={`platform-tile ${s.platform}`} style={{ width: 34, height: 34 }}>
                    <PlatformIcon platform={s.platform} size={15} />
                  </span>
                  <span className="grow" style={{ minWidth: 0 }}>
                    <span className="s-name" style={{ display: 'block' }}>
                      {s.name}
                    </span>
                    <span className="s-meta">
                      Min {s.min.toLocaleString('en-IN')} · {s.avgTime} · {s.quality}
                    </span>
                  </span>
                  <span className="s-rate">
                    <b>{formatINR(s.rate, 0)}</b>
                    <span>per 1k</span>
                  </span>
                  {s.id === serviceId ? (
                    <CheckCircle2 size={16} style={{ color: '#9a3412', flexShrink: 0 }} />
                  ) : null}
                </button>
              ))}
              {filtered.length === 0 ? (
                <div className="empty" style={{ padding: '28px 10px' }}>
                  No services match “{search}”. Try another keyword.
                </div>
              ) : null}
            </div>
          </div>

          <div className="form-section">
            <div className="form-section-head">
              <span className="step-dot">2</span>
              <h2>Target &amp; quantity</h2>
            </div>

            <div className="field">
              <label className="label" htmlFor="link">
                Target link
                <span className="hint">
                  <Link2 size={10} style={{ display: 'inline', marginRight: 3 }} />
                  Profile, post or video URL
                </span>
              </label>
              <div className="input-wrap">
                <span className="lead">
                  <Link2 />
                </span>
                <input
                  id="link"
                  className="input"
                  value={link}
                  onChange={(e) => {
                    setLink(e.target.value)
                    setError('')
                  }}
                  placeholder="https://instagram.com/your.profile"
                  autoComplete="off"
                  spellCheck={false}
                />
              </div>
              <div className="hint-line">
                <Info /> Public profiles only. Private accounts can’t receive engagement.
              </div>
            </div>

            <div className="field" style={{ marginTop: 18 }}>
              <label className="label" htmlFor="quantity">
                Quantity
                <span className="hint">
                  {service.min.toLocaleString('en-IN')} – {service.max.toLocaleString('en-IN')}
                </span>
              </label>
              <div className="input-wrap">
                <input
                  id="quantity"
                  className="input has-suffix mono"
                  type="number"
                  min={service.min}
                  max={service.max}
                  value={quantity}
                  onChange={(e) => {
                    const v = Number(e.target.value)
                    setQuantity(Number.isFinite(v) ? v : service.min)
                  }}
                  onBlur={() =>
                    setQuantity((q) => Math.min(Math.max(Math.round(q), service.min), service.max))
                  }
                  style={{ fontWeight: 700 }}
                />
                <span className="input-suffix">units</span>
              </div>

              <input
                className="range"
                type="range"
                min={service.min}
                max={service.max}
                step={Math.max(1, Math.round((service.max - service.min) / 200))}
                value={Math.min(Math.max(quantity, service.min), service.max)}
                onChange={(e) => setQuantity(Number(e.target.value))}
                style={{ '--fill': `${Math.min(100, Math.max(0, fillPct))}%` } as React.CSSProperties}
                aria-label="Order quantity"
              />
              <div className="range-marks">
                <span>{service.min.toLocaleString('en-IN')}</span>
                <span>{Math.round(service.max / 2).toLocaleString('en-IN')}</span>
                <span>{service.max.toLocaleString('en-IN')}</span>
              </div>

              <div className="row wrap" style={{ gap: 7, marginTop: 10 }}>
                {quickAmounts.map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    className={`chip ${quantity === amt ? 'active' : ''}`}
                    style={{ height: 30, padding: '0 10px', fontSize: 11 }}
                    onClick={() => setQuantity(amt)}
                  >
                    {amt === service.max ? 'MAX' : amt.toLocaleString('en-IN')}
                  </button>
                ))}
              </div>
            </div>

            <div className="switch-row" style={{ marginTop: 16, paddingBottom: 0 }}>
              <div>
                <div className="t">Drip-feed delivery</div>
                <div className="d">
                  Spread delivery over time to look natural. Recommended for large orders.
                </div>
              </div>
              <Switch on={drip} onChange={setDrip} label="Enable drip-feed delivery" />
            </div>
          </div>

          <div className="form-section">
            <div className="form-section-head">
              <span className="step-dot">3</span>
              <h2>Review &amp; confirm</h2>
            </div>
            <InfoBox>
              Orders start automatically after payment. If anything goes wrong, our refill
              protection covers you for 30 days.
            </InfoBox>
            {error ? (
              <div
                className="error-line"
                role="alert"
                style={{ marginTop: 12, fontSize: 12.5 }}
              >
                {error}
              </div>
            ) : null}
          </div>
        </div>

        <div className="summary-sticky">
          <div className="card card-pad">
            <div className="card-head" style={{ marginBottom: 14 }}>
              <div className="card-title">Order summary</div>
              <span className="badge badge-violet">
                <Zap /> Instant
              </span>
            </div>

            <div className="row" style={{ gap: 11, alignItems: 'flex-start' }}>
              <span className={`platform-tile ${service.platform}`}>
                <PlatformIcon platform={service.platform} />
              </span>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 700, lineHeight: 1.35 }}>
                  {service.name}
                </div>
                <div className="tiny faint">
                  {PLATFORM_LABEL[service.platform]} · {service.category}
                </div>
              </div>
            </div>

            <div className="dashed-divider" />

            <div className="summary-line">
              <span>Rate per 1,000</span>
              <b>{formatINR(service.rate)}</b>
            </div>
            <div className="summary-line">
              <span>Quantity</span>
              <b>{Number.isFinite(quantity) ? quantity.toLocaleString('en-IN') : '—'}</b>
            </div>
            <div className="summary-line">
              <span>Start time</span>
              <b>{service.avgTime}</b>
            </div>
            <div className="summary-line">
              <span>Service fee</span>
              <b style={{ color: '#047857' }}>Free</b>
            </div>
            <div className="summary-line">
              <span>Drip-feed</span>
              <b>{drip ? 'Enabled' : 'Off'}</b>
            </div>

            <div className="summary-total">
              <span className="lbl">Total charge</span>
              <span className="val">{formatINR(charge)}</span>
            </div>

            <div
              className="row"
              style={{
                justifyContent: 'space-between',
                marginTop: 10,
                fontSize: 11,
                color: insufficient ? '#be123c' : '#5b6472',
              }}
            >
              <span className="row" style={{ gap: 5 }}>
                <Wallet size={11} /> Balance after
              </span>
              <b style={{ fontVariantNumeric: 'tabular-nums' }}>
                {formatINR(Math.max(0, state.balance - charge))}
              </b>
            </div>

            {insufficient ? (
              <div className="info-box warn" style={{ marginTop: 14 }}>
                <Info />
                <div>
                  You need {formatINR(charge - state.balance)} more.{' '}
                  <Link to="/add-funds" style={{ color: '#92400e', textDecoration: 'underline' }}>
                    Add funds
                  </Link>{' '}
                  to place this order.
                </div>
              </div>
            ) : null}

            <button
              type="submit"
              className="btn btn-primary btn-block"
              style={{ marginTop: 16 }}
              disabled={insufficient || placing}
            >
              <ShoppingBag /> {placing ? 'Placing order…' : `Place order · ${formatINR(charge, 0)}`}
            </button>

            <div className="secure-note">
              <ShieldCheck /> Secure checkout · paid from your wallet
            </div>
          </div>

          <div className="card card-pad" style={{ marginTop: 14 }}>
            <div className="row" style={{ gap: 9, marginBottom: 10 }}>
              <Clock size={14} style={{ color: '#9a3412' }} />
              <b style={{ fontSize: 12 }}>Delivery promise</b>
            </div>
            <p className="tiny faint" style={{ lineHeight: 1.6 }}>
              Average start time for this service is <b style={{ color: '#344054' }}>{service.avgTime}</b>.
              If delivery stalls for 24 hours, our team refills or refunds automatically.
            </p>
            <button
              type="button"
              className="text-btn"
              style={{ marginTop: 10 }}
              onClick={() =>
                toast('Delivery policy', 'Demo UI — real policies live on the production panel.', 'info')
              }
            >
              Read delivery policy <ArrowRight />
            </button>
          </div>
        </div>
      </form>

      <Modal open={result !== null} onClose={() => setResult(null)} labelledBy="order-success">
        <div className="modal-icon success">
          <CheckCircle2 />
        </div>
        <h2 id="order-success">Order launched</h2>
        <p className="sub">
          Your order is in the queue and delivery starts within {service.avgTime.toLowerCase()}.
        </p>

        {result ? (
          <div
            style={{
              marginTop: 18,
              padding: '4px 16px',
              borderRadius: 14,
              border: '1px solid var(--line)',
              background: 'rgba(16, 24, 40, 0.025)',
            }}
          >
            <div className="detail-row">
              <span className="k">Order ID</span>
              <span className="v mono">#{result.id}</span>
            </div>
            <div className="detail-row">
              <span className="k">Service</span>
              <span className="v">{result.serviceName}</span>
            </div>
            <div className="detail-row">
              <span className="k">Quantity</span>
              <span className="v">{result.quantity.toLocaleString('en-IN')}</span>
            </div>
            <div className="detail-row">
              <span className="k">Charged</span>
              <span className="v">{formatINR(result.charge)}</span>
            </div>
            <div className="detail-row">
              <span className="k">Status</span>
              <span className="v">
                <StatusBadge status={result.status} />
              </span>
            </div>
          </div>
        ) : null}

        <div className="modal-actions">
          <button type="button" className="btn btn-ghost" onClick={() => setResult(null)}>
            <Plus /> New order
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => {
              setResult(null)
              navigate('/orders')
            }}
          >
            Track order <ArrowRight />
          </button>
        </div>
      </Modal>
    </div>
  )
}
