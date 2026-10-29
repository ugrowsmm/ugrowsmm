import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  BadgeCheck,
  Banknote,
  Check,
  Crown,
  Headset,
  Loader2,
  Percent,
  Plus,
  ShieldCheck,
  Tag,
  Wallet,
  X,
} from 'lucide-react'
import {
  PRO_DISCOUNT_PERCENT,
  PRO_PLANS,
  PRO_REFERRAL_PERCENT,
  REFERRAL_PERCENT_DEFAULT,
  isProState,
  useStore,
  type ProPlan,
} from '../lib/store'
import { PRO_SUPPORT_EMAIL } from '../lib/config'
import { formatINR } from '../lib/data'
import { LogoGlyph, Wordmark } from '../components/Logo'
import { ProButton } from '../components/ProBits'

const BENEFITS = [
  { icon: Percent, title: `${PRO_REFERRAL_PERCENT}% on every referral`, text: `We keep a ${PRO_REFERRAL_PERCENT}% profit margin after services and tech costs. Pro members get that full ${PRO_REFERRAL_PERCENT}% on every top-up from people they refer.` },
  { icon: Tag, title: `Services ${PRO_DISCOUNT_PERCENT}% cheaper`, text: `Every order you place yourself costs ${PRO_DISCOUNT_PERCENT}% less than the normal price. The Pro price shows automatically.` },
  { icon: Wallet, title: 'Spend your earnings', text: 'Pay for orders with your referral funds, or withdraw them to UPI or bank.' },
  { icon: Banknote, title: 'Easy withdrawals', text: 'Request a payout in a few taps. Minimum ₹100.' },
  { icon: ShieldCheck, title: 'Secure payments', text: 'Top-ups run through trusted UPI apps: PhonePe, GPay, Paytm and BHIM.' },
  { icon: Headset, title: '24/7 Pro support', text: `Priority email support any time at ${PRO_SUPPORT_EMAIL}.` },
]

const COMPARE: { row: string; normal: string; pro: string }[] = [
  { row: 'Referral commission', normal: `${REFERRAL_PERCENT_DEFAULT}%`, pro: `${PRO_REFERRAL_PERCENT}%` },
  { row: 'Price of your own orders', normal: 'Normal price', pro: `${PRO_DISCOUNT_PERCENT}% less` },
  { row: 'Pay with referral funds', normal: 'Yes', pro: 'Yes' },
  { row: 'Crown badge on every page', normal: '', pro: 'Yes' },
  { row: 'Priority 24/7 support', normal: '', pro: 'Yes' },
]

const STEPS = [
  { t: 'Go Pro', d: 'Pick a plan and activate it from your wallet.' },
  { t: 'Share your link', d: 'Send your referral link or promo code to your audience.' },
  { t: `Earn ${PRO_REFERRAL_PERCENT}%`, d: 'Every time they top up their wallet, the commission lands in your referral funds.' },
]

const fmtDate = (iso: string) => new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })

export default function ProPage() {
  const { state, buyPro, toast } = useStore()
  const navigate = useNavigate()
  const pro = isProState(state)
  const [plan, setPlan] = useState<ProPlan>('yearly')
  const [busy, setBusy] = useState(false)
  const [topups, setTopups] = useState(1700000)

  useEffect(() => { document.title = 'Pro membership — UGrowSMM' }, [])

  const picked = PRO_PLANS[plan]
  const short = Math.max(0, picked.price - state.balance)
  const yearSaving = PRO_PLANS.monthly.price * 12 - PRO_PLANS.yearly.price
  const perMonthYear = Math.round(PRO_PLANS.yearly.price / 12)
  const proEarn = useMemo(() => Math.round((topups * PRO_REFERRAL_PERCENT) / 100), [topups])
  const normalEarn = useMemo(() => Math.round((topups * REFERRAL_PERCENT_DEFAULT) / 100), [topups])
  const fill = ((topups - 10000) / (3500000 - 10000)) * 100

  const activate = async () => {
    if (busy) return
    setBusy(true)
    const r = await buyPro(plan)
    setBusy(false)
    if (!r.ok) return toast('Could not activate Pro', r.error, 'error')
    toast('Welcome to Pro', `Your ${picked.label.toLowerCase()} Pro membership is active.`)
  }

  const cta = !state.signedIn ? (
    <ProButton to={`/login?pro=${plan}`} size="lg" label={`Sign up & go Pro · ${formatINR(picked.price, 0)}`} block />
  ) : short > 0 ? (
    <>
      <ProButton onClick={() => navigate('/add-funds')} size="lg" label={`Add ${formatINR(short, 0)} to go Pro`} block />
      <p className="pro-fine">Pro is paid from your wallet. You have {formatINR(state.balance, 0)}, the {picked.label.toLowerCase()} plan is {formatINR(picked.price, 0)}.</p>
    </>
  ) : (
    <ProButton onClick={activate} size="lg" label={busy ? 'Activating…' : `${pro ? 'Extend' : 'Activate'} Pro · ${formatINR(picked.price, 0)}`} block />
  )

  return (
    <div className={`pro-page ${state.signedIn ? '' : 'public'}`}>
      {!state.signedIn ? (
        <header className="pro-public-bar">
          <Link to="/login" className="brand" aria-label="UGrowSMM">
            <span className="brand-mark"><LogoGlyph size={20} /></span>
            <Wordmark />
          </Link>
          <Link to="/login" className="pro-public-back"><ArrowLeft size={14} /> Sign in</Link>
        </header>
      ) : null}

      {/* hero */}
      <section className="pro-hero">
        <div className="pro-hero-crown" aria-hidden="true"><Crown fill="currentColor" /></div>
        <h1 className="pro-h1">Earn like the owner.</h1>
        <p className="pro-lead">
          Our profit margin is {PRO_REFERRAL_PERCENT}% after services and tech costs. As a Pro member you keep all of it on every referral top-up, and you buy your own services {PRO_DISCOUNT_PERCENT}% cheaper.
        </p>
        <div className="pro-hero-stats">
          <div><b>{PRO_REFERRAL_PERCENT}%</b><span>commission, the full margin</span></div>
          <div><b>−{PRO_DISCOUNT_PERCENT}%</b><span>on your own orders</span></div>
          <div><b>24/7</b><span>Pro email support</span></div>
        </div>
        {pro ? (
          <div className="pro-active-note"><BadgeCheck size={18} /> You are a Pro member until {fmtDate(state.pro.until)}</div>
        ) : (
          <a href="#plans" className="pro-hero-jump" onClick={(e) => { e.preventDefault(); document.getElementById('plans')?.scrollIntoView({ behavior: 'smooth' }) }}>See plans</a>
        )}
      </section>

      {/* calculator */}
      <section className="pro-calc" aria-labelledby="pro-calc-h">
        <div className="pro-calc-head">
          <h2 id="pro-calc-h" className="pro-h2">What could you earn?</h2>
          <p>Drag to set how much your referrals top up in a month.</p>
        </div>
        <label className="pro-calc-label" htmlFor="pro-topups">Monthly top-ups by your referrals <b>{formatINR(topups, 0)}</b></label>
        <input
          id="pro-topups"
          className="pro-range"
          type="range"
          min={10000}
          max={3500000}
          step={10000}
          value={topups}
          onChange={(e) => setTopups(Number(e.target.value))}
          style={{ '--fill': `${fill}%` } as React.CSSProperties}
        />
        <div className="pro-calc-out">
          <div className="pro-calc-pro">
            <span>Pro member earns</span>
            <b>{formatINR(proEarn, 0)}</b>
            <small>per month at {PRO_REFERRAL_PERCENT}%</small>
          </div>
          <div className="pro-calc-normal">
            <span>Normal member earns</span>
            <b>{formatINR(normalEarn, 0)}</b>
            <small>per month at {REFERRAL_PERCENT_DEFAULT}%</small>
          </div>
        </div>
        <p className="pro-fine">Illustration of the maths, not a promise. Pro members who build a large audience can reach ₹5–10 lakh a month. What you earn depends on how many people you bring and how much they top up; no income is guaranteed.</p>
      </section>

      {/* benefits */}
      <section aria-labelledby="pro-ben-h">
        <h2 id="pro-ben-h" className="pro-h2 center">Everything a Pro member gets</h2>
        <div className="pro-grid">
          {BENEFITS.map(({ icon: Icon, title, text }) => (
            <article className="pro-benefit" key={title}>
              <span className="pro-benefit-ic"><Icon /></span>
              <h3>{title}</h3>
              <p>{text}</p>
            </article>
          ))}
        </div>
      </section>

      {/* compare */}
      <section className="pro-compare" aria-labelledby="pro-cmp-h">
        <h2 id="pro-cmp-h" className="pro-h2 center">Normal vs Pro</h2>
        <div className="pro-table" role="table">
          <div className="pro-tr head" role="row"><span role="columnheader" /><span role="columnheader">Normal</span><span role="columnheader" className="gold"><Crown size={13} fill="currentColor" /> Pro</span></div>
          {COMPARE.map((c) => (
            <div className="pro-tr" role="row" key={c.row}>
              <span role="cell">{c.row}</span>
              <span role="cell" className="muted">{c.normal || <X size={14} aria-label="No" />}</span>
              <span role="cell" className="gold">{c.pro === 'Yes' ? <Check size={16} aria-label="Yes" /> : c.pro}</span>
            </div>
          ))}
        </div>
      </section>

      {/* plans */}
      <section id="plans" className="pro-plans" aria-labelledby="pro-plan-h">
        <h2 id="pro-plan-h" className="pro-h2 center">Choose your plan</h2>
        <div className="pro-plan-grid" role="radiogroup" aria-label="Pro plan">
          <button type="button" role="radio" aria-checked={plan === 'monthly'} className={`pro-plan ${plan === 'monthly' ? 'on' : ''}`} onClick={() => setPlan('monthly')}>
            <span className="pro-plan-name">Monthly</span>
            <span className="pro-plan-price">{formatINR(PRO_PLANS.monthly.price, 0)}<small>/month</small></span>
            <span className="pro-plan-note">Cancel any time by not renewing</span>
          </button>
          <button type="button" role="radio" aria-checked={plan === 'yearly'} className={`pro-plan best ${plan === 'yearly' ? 'on' : ''}`} onClick={() => setPlan('yearly')}>
            <span className="pro-plan-flag">Best value · save {formatINR(yearSaving, 0)}</span>
            <span className="pro-plan-name">Yearly</span>
            <span className="pro-plan-price">{formatINR(PRO_PLANS.yearly.price, 0)}<small>/year</small></span>
            <span className="pro-plan-note">Just {formatINR(perMonthYear, 0)} a month</span>
          </button>
        </div>
        <div className="pro-cta">{cta}</div>
        {state.signedIn && short === 0 && !pro ? (
          <p className="pro-fine center"><Plus size={11} style={{ display: 'inline', verticalAlign: '-1px' }} /> {formatINR(picked.price, 0)} will be taken from your wallet balance.</p>
        ) : null}
        {busy ? <p className="pro-fine center"><Loader2 size={12} className="spin" style={{ display: 'inline', verticalAlign: '-2px' }} /> Please wait…</p> : null}
      </section>

      {/* steps */}
      <section aria-labelledby="pro-how-h">
        <h2 id="pro-how-h" className="pro-h2 center">How it works</h2>
        <ol className="pro-steps">
          {STEPS.map((s, i) => (
            <li key={s.t}><span className="pro-step-n">{i + 1}</span><div><b>{s.t}</b><p>{s.d}</p></div></li>
          ))}
        </ol>
      </section>

      <section className="pro-help">
        <Headset size={20} />
        <div>
          <b>Questions before you join?</b>
          <p>Write to <a href={`mailto:${PRO_SUPPORT_EMAIL}`}>{PRO_SUPPORT_EMAIL}</a>. Pro members get priority replies, 24/7.</p>
        </div>
      </section>
    </div>
  )
}
