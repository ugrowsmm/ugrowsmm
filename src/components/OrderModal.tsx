import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ArrowRight,
  Check,
  CheckCircle2,
  Clock,
  Crown,
  Droplets,
  Gift,
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
import { PRO_DISCOUNT_PERCENT, isProState, proRate, referralAvailable, useStore } from '../lib/store'
import { PLATFORM_LABEL, TIERS, formatINR, priceOf, type Order, type Service } from '../lib/data'
import { goodToKnow, linkGuide, refillOf } from '../lib/serviceInfo'
import { PlatformIcon } from './PlatformIcon'
import TierBadge from './TierBadge'
import { Modal, StatusBadge, Switch } from './ui'

const CLS = { Standard: 'std', Premium: 'pre', Pro: 'pro' } as const
const n = (v: number) => v.toLocaleString('en-IN')
const DELAYS = [0, 5, 10, 15, 30, 60, 90]

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

  const mode = service.mode
  const isPack = mode === 'package'
  const isAuto = mode === 'auto'
  const isPoll = mode === 'poll'
  const isNote = mode === 'note'
  // services where the buyer types their own lines (comments, lists, custom-comment packages)
  const isLines = mode === 'comments' || mode === 'list' || (isPack && service.lines !== undefined)
  const showQty = !isPack && !isLines && !isAuto

  const [link, setLink] = useState('')
  const [quantity, setQuantity] = useState(() => Math.min(Math.max(1000, service.min), service.max))
  const [drip, setDrip] = useState(false)
  const [comments, setComments] = useState('')
  const [answer, setAnswer] = useState('1')
  const [note, setNote] = useState('')
  const [autoMin, setAutoMin] = useState(service.min)
  const [autoMax, setAutoMax] = useState(() => Math.min(service.max, Math.max(service.min, 1000)))
  const [posts, setPosts] = useState(5)
  const [delay, setDelay] = useState(0)
  const [error, setError] = useState('')
  const [placing, setPlacing] = useState(false)
  const [payPref, setPayPref] = useState<'wallet' | 'referral'>('wallet')
  const [result, setResult] = useState<Order | null>(null)

  // one entry per line: the number of lines is the quantity
  const lineList = useMemo(() => comments.split('\n').map((l) => l.trim()).filter(Boolean), [comments])
  const qty = isPack ? 1 : isLines ? lineList.length : isAuto ? autoMax * posts : quantity
  const word = mode === 'list' ? 'entr' : 'comment'

  const refill = useMemo(() => refillOf(service), [service])
  const guide = useMemo(() => linkGuide(service), [service])
  const tips = useMemo(() => goodToKnow(service), [service])
  const tier = TIERS[service.quality]

  const pro = isProState(state)
  const rate = proRate(service.rate, pro) // Pro members pay the Pro rate
  const charge = priceOf({ mode: service.mode, rate }, qty)
  const refAvail = referralAvailable(state.referral)
  const payWith: 'wallet' | 'referral' = payPref === 'referral' && refAvail > 0 ? 'referral' : 'wallet'
  const source = payWith === 'referral' ? refAvail : state.balance
  const insufficient = charge > source
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
  useEffect(() => setError(''), [link, quantity, comments, answer, autoMin, autoMax, posts])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (placing) return
    setError('')
    setPlacing(true)
    const outcome = await placeOrder({
      serviceId: service.id,
      link,
      quantity: qty,
      dripfeed: showQty && drip,
      comments,
      note,
      answer: Number(answer),
      auto: isAuto ? { min: autoMin, max: autoMax, posts, delay } : undefined,
      payWith,
    })
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
      setComments('')
      setNote('')
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
          <div className="detail-row"><span className="k">{isPack ? 'Type' : 'Quantity'}</span><span className="v">{isPack ? 'Package' : n(result.quantity)}</span></div>
          <div className="detail-row"><span className="k">Charged</span><span className="v">{formatINR(result.charge)}</span></div>
          <div className="detail-row"><span className="k">Paid from</span><span className="v">{payWith === 'referral' ? 'Referral funds' : 'Wallet'}</span></div>
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

  const minLabel = isAuto ? 'Minimum per post' : isLines ? `Minimum ${word}${word === 'entr' ? 'ies' : 's'}` : 'Minimum order'
  const maxLabel = isAuto ? 'Maximum per post' : isLines ? `Maximum ${word}${word === 'entr' ? 'ies' : 's'}` : 'Maximum order'

  /* ---------------- product sheet ---------------- */
  return (
    <form className={`om-grid ${CLS[service.quality]}`} onSubmit={submit} noValidate>
      <button type="button" className="om-x" onClick={onClose} aria-label="Close"><X size={16} /></button>

      {/* left: the product */}
      <section className="om-info om-top">
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
            {pro ? <s className="om-price-old">{formatINR(service.rate)}</s> : null}
            <span className="om-price-v">{formatINR(rate)}</span>
            <span className="om-price-u"> {isPack ? 'per package' : 'per 1,000'}</span>
          </div>
          {pro ? <span className="pro-price-chip"><Crown size={12} fill="currentColor" /> Pro price · {PRO_DISCOUNT_PERCENT}% off</span> : <span className="om-price-note">{tier.grade}</span>}
        </div>
        {!pro ? (
          <Link to="/pro" className="pro-teaser" onClick={onClose}>
            <Crown size={14} fill="currentColor" />
            <span>Pro members pay only <b>{formatINR(proRate(service.rate, true))}</b>. Save {PRO_DISCOUNT_PERCENT}% on every order.</span>
          </Link>
        ) : null}

        <p className="om-desc">{service.description}</p>

        <div className="om-specs">
          <div className="om-spec"><Clock size={16} /><div><span>Start time</span><b>{service.avgTime}</b></div></div>
          <div className={`om-spec refill-${refill.tone}`}><RefreshCw size={16} /><div><span>Refill cover</span><b>{refill.label}</b></div></div>
          {isPack ? (
            <>
              <div className="om-spec"><Users size={16} /><div><span>Price type</span><b>One flat price</b></div></div>
              <div className="om-spec"><Users size={16} /><div><span>Quantity</span><b>Fixed package</b></div></div>
            </>
          ) : (
            <>
              <div className="om-spec"><Users size={16} /><div><span>{minLabel}</span><b>{n(service.min)}</b></div></div>
              <div className="om-spec"><Users size={16} /><div><span>{maxLabel}</span><b>{n(service.max)}</b></div></div>
            </>
          )}
          <div className="om-spec"><Link2 size={16} /><div><span>Link needed</span><b>{isAuto ? 'Username or profile link' : guide.need}</b></div></div>
          <div className="om-spec"><Droplets size={16} /><div><span>Drip-feed</span><b>{showQty ? 'Available' : 'Not available'}</b></div></div>
        </div>
      </section>

      {/* right: the order */}
      <section className="om-order">
        <div className="om-order-h">Place your order</div>

        <div className="field">
          <label className="label" htmlFor="om-link">
            {isAuto ? 'Username or profile link' : guide.need}
            <span className="hint"><Link2 size={10} style={{ display: 'inline', marginRight: 3 }} />Must be public</span>
          </label>
          <div className="input-wrap">
            <span className="lead"><Link2 /></span>
            <input
              id="om-link"
              className="input"
              value={link}
              onChange={(e) => setLink(e.target.value)}
              placeholder={isAuto ? '@username or profile link' : guide.placeholder}
              autoComplete="off"
              autoCapitalize="none"
              spellCheck={false}
              inputMode="url"
            />
          </div>
        </div>

        {/* comments / lists / custom-comment packages: one entry per line */}
        {isLines ? (
          <div className="field" style={{ marginTop: 16 }}>
            <label className="label" htmlFor="om-comments">
              {mode === 'list' ? 'Your list' : 'Your comments'}
              <span className="hint">
                One per line · {isPack ? `exactly ${n(service.lines ?? 1)}` : `${n(service.min)} – ${n(service.max)}`}
              </span>
            </label>
            <textarea
              id="om-comments"
              className="textarea"
              rows={7}
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder={mode === 'list' ? '@username1\n@username2\n@username3' : 'Love this!\nAmazing work, keep going\nThis is so helpful'}
              spellCheck={mode !== 'list'}
              style={{ minHeight: 150, resize: 'vertical' }}
            />
            <div className="hint-line" style={{ marginTop: 6 }}>
              <b>{n(lineList.length)}</b> {mode === 'list' ? (lineList.length === 1 ? 'entry' : 'entries') : (lineList.length === 1 ? 'comment' : 'comments')}
              {isPack ? ' · one flat package price' : mode === 'list' ? ' · you pay per entry' : ' · you pay per comment'}
            </div>
          </div>
        ) : null}

        {/* auto: boosts every new post */}
        {isAuto ? (
          <div className="field" style={{ marginTop: 16 }}>
            <label className="label" htmlFor="om-auto-min">
              Quantity per new post
              <span className="hint">{n(service.min)} – {n(service.max)}</span>
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <input
                id="om-auto-min"
                className="input mono"
                type="number"
                inputMode="numeric"
                min={service.min}
                max={service.max}
                value={Number.isFinite(autoMin) ? autoMin : ''}
                onChange={(e) => setAutoMin(Number(e.target.value))}
                aria-label="Minimum per post"
                placeholder="Min"
                style={{ fontWeight: 700 }}
              />
              <input
                className="input mono"
                type="number"
                inputMode="numeric"
                min={service.min}
                max={service.max}
                value={Number.isFinite(autoMax) ? autoMax : ''}
                onChange={(e) => setAutoMax(Number(e.target.value))}
                aria-label="Maximum per post"
                placeholder="Max"
                style={{ fontWeight: 700 }}
              />
            </div>
            <label className="label" htmlFor="om-posts" style={{ marginTop: 14 }}>
              New posts to boost
              <span className="hint">1 – 500</span>
            </label>
            <input
              id="om-posts"
              className="input mono"
              type="number"
              inputMode="numeric"
              min={1}
              max={500}
              value={Number.isFinite(posts) ? posts : ''}
              onChange={(e) => setPosts(Math.min(500, Math.max(0, Math.round(Number(e.target.value)))))}
              style={{ fontWeight: 700 }}
            />
            <label className="label" htmlFor="om-delay" style={{ marginTop: 14 }}>
              Delay before each boost
            </label>
            <select id="om-delay" className="select" value={delay} onChange={(e) => setDelay(Number(e.target.value))}>
              {DELAYS.map((d) => (<option key={d} value={d}>{d === 0 ? 'No delay' : `${d} minutes`}</option>))}
            </select>
            <div className="hint-line" style={{ marginTop: 6 }}>
              The most this can use is <b>{n(autoMax * posts)}</b>. That amount is reserved up front.
            </div>
          </div>
        ) : null}

        {/* poll: which answer */}
        {isPoll ? (
          <div className="field" style={{ marginTop: 16 }}>
            <label className="label" htmlFor="om-answer">
              Poll answer number
              <span className="hint">1 = first option</span>
            </label>
            <input
              id="om-answer"
              className="input mono"
              type="number"
              inputMode="numeric"
              min={1}
              max={10}
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              style={{ fontWeight: 700 }}
            />
          </div>
        ) : null}

        {/* note: message or instructions */}
        {isNote ? (
          <div className="field" style={{ marginTop: 16 }}>
            <label className="label" htmlFor="om-note">
              Message or instructions
              <span className="hint">Optional</span>
            </label>
            <textarea
              id="om-note"
              className="textarea"
              rows={4}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Anything we should know for this order"
              style={{ minHeight: 100, resize: 'vertical' }}
            />
          </div>
        ) : null}

        {/* normal quantity */}
        {showQty ? (
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
        ) : null}

        {showQty ? (
          <div className="switch-row" style={{ marginTop: 14, paddingBottom: 0 }}>
            <div>
              <div className="t">Drip-feed delivery</div>
              <div className="d">Spread delivery over time to look natural. Good for large orders.</div>
            </div>
            <Switch on={drip} onChange={setDrip} label="Enable drip-feed delivery" />
          </div>
        ) : null}

        <div className="om-sum">
          <div className="summary-line"><span>{isPack ? 'Package price' : 'Rate per 1,000'}{pro ? ' (Pro)' : ''}</span><b>{formatINR(rate)}</b></div>
          {isPack ? null : (
            <div className="summary-line">
              <span>{isAuto ? 'Reserved total' : isLines ? (mode === 'list' ? 'Entries' : 'Comments') : 'Quantity'}</span>
              <b>{Number.isFinite(qty) ? n(qty) : '—'}</b>
            </div>
          )}
          <div className="summary-line"><span>Start time</span><b>{service.avgTime}</b></div>
          <div className="summary-line"><span>Service fee</span><b style={{ color: '#047857' }}>Free</b></div>
          <div className="summary-line"><span>{payWith === 'referral' ? 'Referral funds after' : 'Balance after'}</span><b style={{ color: insufficient ? '#be123c' : undefined }}>{formatINR(Math.max(0, source - charge))}</b></div>
        </div>

        {insufficient ? (
          <div className="info-box warn" style={{ marginTop: 12 }}>
            <Info />
            <div>
              {payWith === 'referral' ? (
                <>You need {formatINR(charge - source)} more referral funds. Pay from your wallet instead, or{' '}</>
              ) : (
                <>You need {formatINR(charge - source)} more.{' '}</>
              )}
              <Link to="/add-funds" onClick={onClose} style={{ color: '#92400e', textDecoration: 'underline' }}>{payWith === 'referral' ? 'add funds' : 'Add funds'}</Link>{' '}
              to place this order.
            </div>
          </div>
        ) : null}

        {error ? <div className="error-line" role="alert" style={{ marginTop: 12, fontSize: 12.5 }}>{error}</div> : null}

        <div className="om-pay" role="radiogroup" aria-label="Payment source">
          <button type="button" role="radio" aria-checked={payWith === 'wallet'} className={`om-pay-opt ${payWith === 'wallet' ? 'on' : ''}`} onClick={() => setPayPref('wallet')}>
            <Wallet /> <span>Pay from wallet</span> <b>{formatINR(state.balance, 0)}</b>
          </button>
          {refAvail > 0 ? (
            <>
              <div className="om-pay-or"><span>or pay with referral funds</span></div>
              <button type="button" role="radio" aria-checked={payWith === 'referral'} className={`om-pay-opt ref ${payWith === 'referral' ? 'on' : ''}`} onClick={() => setPayPref('referral')}>
                <Gift /> <span>Referral funds</span> <b>{formatINR(refAvail, 0)}</b>
              </button>
            </>
          ) : null}
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

      {/* more details: after the form on phones, under the product on desktop */}
      <section className="om-info om-more">
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
    </form>
  )
}
