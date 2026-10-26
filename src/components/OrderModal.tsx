import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ArrowRight,
  Check,
  CheckCircle2,
  Clock,
  Droplets,
  Info,
  Link2,
  Plus,
  RefreshCw,
  ShieldCheck,
  ShoppingBag,
  Users,
  Wallet,
  X,
} from 'lucide-react'
import { useStore } from '../lib/store'
import { PLATFORM_LABEL, TIERS, formatINR, type Order, type Service } from '../lib/data'
import { goodToKnow, linkGuide, refillOf } from '../lib/serviceInfo'
import { PlatformIcon } from './PlatformIcon'
import TierBadge from './TierBadge'
import { Modal, StatusBadge, Switch } from './ui'

const CLS = { Standard: 'std', Premium: 'pre', Pro: 'pro' } as const
const n = (v: number) => v.toLocaleString('en-IN')

export default function OrderModal({ service, onClose }: { service: Service | null; onClose: () => void }) {
  return (
    <Modal open={service !== null} onClose={onClose} labelledBy="om-title" width={960} className="om">
      {service ? <Sheet key={service.id} service={service} onClose={onClose} /> : null}
    </Modal>
  )
}

function Sheet({ service, onClose }: { service: Service; onClose: () => void }) {
  const { state, placeOrder, toast } = useStore()
  const navigate = useNavigate()

  const [link, setLink] = useState('')
  const [quantity, setQuantity] = useState(() => Math.min(Math.max(1000, service.min), service.max))
  const [drip, setDrip] = useState(false)
  const [error, setError] = useState('')
  const [placing, setPlacing] = useState(false)
  const [result, setResult] = useState<Order | null>(null)

  const refill = useMemo(() => refillOf(service), [service])
  const guide = useMemo(() => linkGuide(service), [service])
  const tips = useMemo(() => goodToKnow(service), [service])
  const tier = TIERS[service.quality]

  const charge = Math.round(((service.rate * (Number.isFinite(quantity) ? quantity : 0)) / 1000) * 100) / 100
  const insufficient = charge > state.balance
  const fillPct = ((quantity - service.min) / Math.max(1, service.max - service.min)) * 100

  const quickAmounts = useMemo(() => {
    const values = [service.min, 1000, 5000, 10000, 50000]
      .filter((v) => v >= service.min && v <= service.max)
      .filter((v, i, arr) => arr.indexOf(v) === i)
      .sort((a, b) => a - b)
      .slice(0, 4)
    return [...values, service.max].filter((v, i, arr) => arr.indexOf(v) === i)
  }, [service])

  // reset the "stale" error as soon as the person edits something
  useEffect(() => setError(''), [link, quantity])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (placing) return
    setError('')
    setPlacing(true)
    const outcome = await placeOrder({ serviceId: service.id, link, quantity, dripfeed: drip })
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

  /* ---------------- success view ---------------- */
  if (result) {
    return (
      <div className="om-done">
        <div className="modal-icon success"><CheckCircle2 /></div>
        <h2 id="om-title">Order launched</h2>
        <p className="sub">Your order is in the queue and delivery starts within {service.avgTime.toLowerCase()}.</p>
        <div className="om-done-box">
          <div className="detail-row"><span className="k">Order ID</span><span className="v mono">#{result.id}</span></div>
          <div className="detail-row"><span className="k">Service</span><span className="v">{result.serviceName}</span></div>
          <div className="detail-row"><span className="k">Quantity</span><span className="v">{n(result.quantity)}</span></div>
          <div className="detail-row"><span className="k">Charged</span><span className="v">{formatINR(result.charge)}</span></div>
          <div className="detail-row"><span className="k">Status</span><span className="v"><StatusBadge status={result.status} /></span></div>
        </div>
        <div className="modal-actions">
          <button type="button" className="btn btn-ghost" onClick={onClose}><Plus /> New order</button>
          <button type="button" className="btn btn-primary" onClick={() => { onClose(); navigate('/orders') }}>
            Track order <ArrowRight />
          </button>
        </div>
      </div>
    )
  }

  /* ---------------- product sheet ---------------- */
  return (
    <form className={`om-grid ${CLS[service.quality]}`} onSubmit={submit} noValidate>
      <button type="button" className="om-x" onClick={onClose} aria-label="Close"><X size={16} /></button>

      {/* left: the product */}
      <section className="om-info">
        <div className="om-hero">
          <span className={`platform-tile ${service.platform} om-tile`}><PlatformIcon platform={service.platform} size={26} /></span>
          <div className="om-hero-txt">
            <div className="svc-kicker">{PLATFORM_LABEL[service.platform]} · {service.category}</div>
            <h2 id="om-title" className="om-title">{service.name}</h2>
            <div className="om-badges">
              <TierBadge quality={service.quality} />
              {service.badge ? <span className="badge badge-lime">{service.badge}</span> : null}
            </div>
          </div>
        </div>

        <div className="om-price">
          <div>
            <span className="om-price-v">{formatINR(service.rate)}</span>
            <span className="om-price-u"> per 1,000</span>
          </div>
          <span className="om-price-note">{tier.grade}</span>
        </div>

        <p className="om-desc">{service.description}</p>

        <div className="om-specs">
          <div className="om-spec"><Clock size={16} /><div><span>Start time</span><b>{service.avgTime}</b></div></div>
          <div className={`om-spec refill-${refill.tone}`}><RefreshCw size={16} /><div><span>Refill cover</span><b>{refill.label}</b></div></div>
          <div className="om-spec"><Users size={16} /><div><span>Minimum order</span><b>{n(service.min)}</b></div></div>
          <div className="om-spec"><Users size={16} /><div><span>Maximum order</span><b>{n(service.max)}</b></div></div>
          <div className="om-spec"><Link2 size={16} /><div><span>Link needed</span><b>{guide.need}</b></div></div>
          <div className="om-spec"><Droplets size={16} /><div><span>Drip-feed</span><b>Available</b></div></div>
        </div>

        <div className="om-block">
          <div className="om-block-h"><ShieldCheck size={15} /> Refill status</div>
          <p>{refill.detail}</p>
        </div>

        <div className="om-block">
          <div className="om-block-h">Included with {service.quality} grade</div>
          <ul className="om-list">
            {tier.perks.map((p) => (<li key={p}><Check size={14} /> {p}</li>))}
          </ul>
        </div>

        <div className="om-block om-tips">
          <div className="om-block-h"><Info size={15} /> Good to know</div>
          <ul className="om-list dot">
            {tips.map((t) => (<li key={t}>{t}</li>))}
          </ul>
        </div>
      </section>

      {/* right: the order */}
      <section className="om-order">
        <div className="om-order-h">Place your order</div>

        <div className="field">
          <label className="label" htmlFor="om-link">
            {guide.need}
            <span className="hint"><Link2 size={10} style={{ display: 'inline', marginRight: 3 }} />Must be public</span>
          </label>
          <div className="input-wrap">
            <span className="lead"><Link2 /></span>
            <input
              id="om-link"
              className="input"
              value={link}
              onChange={(e) => setLink(e.target.value)}
              placeholder={guide.placeholder}
              autoComplete="off"
              autoCapitalize="none"
              spellCheck={false}
              inputMode="url"
            />
          </div>
        </div>

        <div className="field" style={{ marginTop: 16 }}>
          <label className="label" htmlFor="om-qty">
            Quantity
            <span className="hint">{n(service.min)} – {n(service.max)}</span>
          </label>
          <div className="input-wrap">
            <input
              id="om-qty"
              className="input has-suffix mono"
              type="number"
              inputMode="numeric"
              min={service.min}
              max={service.max}
              value={Number.isFinite(quantity) ? quantity : ''}
              onChange={(e) => {
                const v = Number(e.target.value)
                setQuantity(Number.isFinite(v) ? v : service.min)
              }}
              onBlur={() => setQuantity((q) => Math.min(Math.max(Math.round(q), service.min), service.max))}
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
          <div className="om-chips">
            {quickAmounts.map((amt) => (
              <button key={amt} type="button" className={`chip ${quantity === amt ? 'active' : ''}`} onClick={() => setQuantity(amt)}>
                {amt === service.max ? 'MAX' : n(amt)}
              </button>
            ))}
          </div>
        </div>

        <div className="switch-row" style={{ marginTop: 14, paddingBottom: 0 }}>
          <div>
            <div className="t">Drip-feed delivery</div>
            <div className="d">Spread delivery over time to look natural. Good for large orders.</div>
          </div>
          <Switch on={drip} onChange={setDrip} label="Enable drip-feed delivery" />
        </div>

        <div className="om-sum">
          <div className="summary-line"><span>Rate per 1,000</span><b>{formatINR(service.rate)}</b></div>
          <div className="summary-line"><span>Quantity</span><b>{Number.isFinite(quantity) ? n(quantity) : '—'}</b></div>
          <div className="summary-line"><span>Start time</span><b>{service.avgTime}</b></div>
          <div className="summary-line"><span>Service fee</span><b style={{ color: '#047857' }}>Free</b></div>
          <div className="summary-line"><span>Balance after</span><b style={{ color: insufficient ? '#be123c' : undefined }}>{formatINR(Math.max(0, state.balance - charge))}</b></div>
        </div>

        {insufficient ? (
          <div className="info-box warn" style={{ marginTop: 12 }}>
            <Info />
            <div>
              You need {formatINR(charge - state.balance)} more.{' '}
              <Link to="/add-funds" onClick={onClose} style={{ color: '#92400e', textDecoration: 'underline' }}>Add funds</Link>{' '}
              to place this order.
            </div>
          </div>
        ) : null}

        {error ? <div className="error-line" role="alert" style={{ marginTop: 12, fontSize: 12.5 }}>{error}</div> : null}

        <div className="secure-note">
          <Wallet /> Paid from your wallet · {formatINR(state.balance, 0)} available
        </div>
        <div className="om-bar">
          <div className="om-bar-total">
            <span>Total</span>
            <b>{formatINR(charge)}</b>
          </div>
          <button type="submit" className="btn btn-primary" disabled={insufficient || placing}>
            <ShoppingBag /> {placing ? 'Placing…' : 'Place order'}
          </button>
        </div>
      </section>
    </form>
  )
}
