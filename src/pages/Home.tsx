import TierShowcase from '../components/TierShowcase'
import ReviewsMarquee from '../components/ReviewsMarquee'
import BonusBanner from '../components/BonusBanner'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  BadgeCheck,
  Check,
  ChevronDown,
  Clock,
  Code2,
  ShieldCheck,
  ShoppingCart,
  Sparkles,
  TrendingUp,
  Users,
  Wallet,
  Zap,
} from 'lucide-react'
import {
  PLATFORM_LABEL,
  SERVICES,
  formatFrom,
  startingRate,
  type Platform,
} from '../lib/data'
import { PlatformIcon } from '../components/PlatformIcon'
import { LogoGlyph, Wordmark } from '../components/Logo'
import InstallButton from '../components/InstallButton'
import { scrollToSection } from '../lib/smoothScroll'
import { useStore } from '../lib/store'
import {
  ORDERS_LABEL,
  ORDER_EVERY_LABEL,
  PRICE_FROM_LABEL,
  REFERRAL_PERCENT_DEFAULT,
  SINCE_YEAR,
  USERS_LABEL,
} from '../lib/config'

const PLATFORMS: Platform[] = [
  'instagram',
  'youtube',
  'x',
  'facebook',
  'telegram',
  'spotify',
]

const MOCK_ORDERS = [
  { platform: 'instagram' as const, name: 'Instagram Followers', qty: '5,000', pct: 64 },
  { platform: 'youtube' as const, name: 'YouTube Views', qty: '25,000', pct: 100 },
  { platform: 'facebook' as const, name: 'Facebook Page Likes', qty: '10,000', pct: 82 },
]

const FAQS = [
  {
    q: 'Is UGrowSMM safe for my accounts?',
    a: 'We never ask for passwords or two-factor codes — only public profile, post or channel links. Orders use gradual delivery and quality tiers, with 30-day refill protection on eligible services to keep growth looking natural.',
  },
  {
    q: 'How quickly do orders start?',
    a: 'Most services start within minutes. The catalogue shows an estimated start window for every service, and your dashboard tracks live progress from 0 to 100%. Our current average start time is around 42 minutes.',
  },
  {
    q: 'What happens if an order under-delivers?',
    a: 'Open the order in your history and raise a ticket from the Support page with the order ID. We will restart, refill or refund the undelivered portion depending on the service and verification. Full details are in our Refund Policy.',
  },
  {
    q: 'Can agencies and resellers automate orders?',
    a: 'Yes. Every account includes an API key with endpoints to create orders, check status, list services and read your balance. You can rotate the key instantly and pause API access without deleting it.',
  },
  {
    q: 'Do I need a subscription or minimum spend?',
    a: 'No subscription. UGrowSMM runs on a prepaid INR wallet, so you only pay for the orders you place. Top-ups are available from ₹100 and are paid instantly through UPI apps like PhonePe, Google Pay, Paytm and BHIM.',
  },
]

export default function Home() {
  const { state } = useStore()
  const [openFaq, setOpenFaq] = useState<number | null>(0)
  const panelHref = state.signedIn ? '/' : '/login'

  useEffect(() => {
    document.title = 'UGrowSMM — Premium SMM Panel'
  }, [])

  return (
    <div className="mkt-shell">
      <header className="mkt-header">
        <Link to="/" className="brand">
          <span className="brand-mark">
            <LogoGlyph size={23} />
          </span>
          <span>
            <Wordmark />
            <span className="brand-sub">SMM Panel</span>
          </span>
        </Link>

        <nav className="mkt-nav" aria-label="Homepage">
          <button type="button" onClick={() => scrollToSection('#features')}>
            Features
          </button>
          <button type="button" onClick={() => scrollToSection('#services')}>
            Services
          </button>
          <button type="button" onClick={() => scrollToSection('#how')}>
            How it works
          </button>
          <button type="button" onClick={() => scrollToSection('#faq')}>
            FAQ
          </button>
        </nav>

        <div className="mkt-header-actions">
          <Link to={panelHref} className="btn btn-primary btn-sm">
            Get Started <ArrowRight />
          </Link>
        </div>
      </header>

      <main>
        <div className="mkt-hero-wrap">
        <div className="mkt-trustbar">
          <span className="mkt-trust-pill">
            <span className="trust-dot" aria-hidden="true" />
            Most trusted since {SINCE_YEAR}
          </span>
        </div>
        <section className="mkt-hero">
          <div className="mkt-hero-copy">
            <h1>
              Grow your social media
              <br />
              <span className="mkt-h1-grad">faster, cheaper &amp; safer.</span>
            </h1>
            <p>
              Followers, likes, views and plays for Instagram, YouTube, Telegram and more. Pay in
              INR with UPI, with prices starting at just <b>{PRICE_FROM_LABEL}</b>.
            </p>

            <ul className="mkt-perks">
              <li>
                <span className="mkt-perk-ico"><Zap /></span>
                <span><b>Super fast delivery</b><small>Orders start within minutes</small></span>
              </li>
              <li>
                <span className="mkt-perk-ico"><ShieldCheck /></span>
                <span><b>Secure payment</b><small>Instant UPI top-up</small></span>
              </li>
              <li>
                <span className="mkt-perk-ico"><BadgeCheck /></span>
                <span><b>Guaranteed services</b><small>30-day refill protection</small></span>
              </li>
              <li>
                <span className="mkt-perk-ico"><Code2 /></span>
                <span><b>API for resellers</b><small>Automate every order</small></span>
              </li>
            </ul>

            <div className="mkt-cta-row">
              <Link to={panelHref} className="btn btn-primary btn-lg">
                Start growing now <ArrowRight />
              </Link>
              <button
                type="button"
                className="btn btn-ghost btn-lg"
                onClick={() => scrollToSection('#services')}
              >
                Explore services
              </button>
            </div>

            <div className="mkt-proof">
              <div className="mkt-proof-icons" aria-hidden="true">
                <span className="instagram"><PlatformIcon platform="instagram" size={15} /></span>
                <span className="youtube"><PlatformIcon platform="youtube" size={15} /></span>
                <span className="telegram"><PlatformIcon platform="telegram" size={15} /></span>
                <span className="facebook"><PlatformIcon platform="facebook" size={15} /></span>
              </div>
              <small>
                Trusted by <b>{USERS_LABEL}</b> creators, agencies &amp; resellers
              </small>
            </div>
          </div>

          <div className="mkt-hero-art">
            <div className="mkt-glow" aria-hidden="true" />
            <div className="mkt-mock">
              <div className="mkt-mock-head">
                <span className="row" style={{ gap: 8 }}>
                  <span className="brand-mark" style={{ width: 26, height: 26, borderRadius: 8 }}>
                    <LogoGlyph size={15} />
                  </span>
                  <b>UGrowSMM panel</b>
                </span>
                <span className="badge badge-green">Popular services</span>
              </div>

              <div className="mkt-mock-balance">
                <div className="tiny faint">Wallet</div>
                <div className="val">Top up in seconds</div>
                <div className="row" style={{ gap: 8, marginTop: 8 }}>
                  <span className="badge badge-lime">From ₹100</span>
                  <span className="tiny faint">UPI · instant</span>
                </div>
              </div>

              <div className="mkt-mock-orders">
                {MOCK_ORDERS.map((order) => {
                  const from = startingRate(SERVICES.filter((x) => x.platform === order.platform))
                  return (
                    <div className="mkt-mock-row" key={order.name}>
                      <span className={`platform-tile ${order.platform}`} style={{ width: 30, height: 30 }}>
                        <PlatformIcon platform={order.platform} size={14} />
                      </span>
                      <div className="grow">
                        <div className="n">{order.name}</div>
                        <div className="tiny faint">Starts within minutes</div>
                      </div>
                      <span className="pct">{from > 0 ? `From ${formatFrom(from)}/1K` : ''}</span>
                    </div>
                  )
                })}
              </div>

              <div className="mkt-mock-foot">
                <span>
                  <Zap size={12} /> Fast start
                </span>
                <span>
                  <ShieldCheck size={12} /> Refill protected
                </span>
              </div>
            </div>

            <div className="mkt-float">
              <span className="mkt-float-icon">
                <BadgeCheck />
              </span>
              <div>
                <b>Secure UPI top-up</b>
                <span>PhonePe, GPay, Paytm, BHIM</span>
              </div>
            </div>
          </div>
        </section>

        <div className="mkt-numbers">
          <div className="mkt-numbers-grid">
            <div className="mkt-num">
              <span className="mkt-num-ico"><ShoppingCart size={22} /></span>
              <b>{ORDERS_LABEL}</b>
              <span>Total Orders</span>
            </div>
            <div className="mkt-num">
              <span className="mkt-num-ico"><Zap size={22} /></span>
              <b>{ORDER_EVERY_LABEL}</b>
              <span>Order Placed Every</span>
            </div>
            <div className="mkt-num">
              <span className="mkt-num-ico"><TrendingUp size={22} /></span>
              <b>{PRICE_FROM_LABEL}</b>
              <span>Price Starting</span>
            </div>
            <div className="mkt-num">
              <span className="mkt-num-ico"><Users size={22} /></span>
              <b>{USERS_LABEL}</b>
              <span>Active Users</span>
            </div>
          </div>
        </div>
        </div>

        <div className="mkt-platforms" aria-label="Supported platforms">
          <span className="mkt-platforms-label">Built for every platform you grow</span>
          <div className="mkt-platforms-list">
            {PLATFORMS.map((platform) => (
              <span className="mkt-platform" key={platform}>
                <PlatformIcon platform={platform} size={15} />
                {PLATFORM_LABEL[platform]}
              </span>
            ))}
          </div>
        </div>

        <section className="mkt-section" aria-label="Referral bonus">
          <BonusBanner
            cta
            footnote={`Creators and resellers earn ${REFERRAL_PERCENT_DEFAULT}% of every top-up made by people who join with their code.`}
          />
        </section>

        <section className="mkt-section" id="features">
          <div className="mkt-head">
            <div>
              <span className="eyebrow">Why UGrowSMM</span>
              <h2>
                Every growth tool.
                <br />
                One polished panel.
              </h2>
            </div>
            <p>
              Built for creators who care about quality and agencies who care about speed. No
              spreadsheets, no guesswork, no missed orders.
            </p>
          </div>

          <div className="mkt-features">
            <article className="mkt-feature mkt-feature-lg">
              <span className="mkt-feature-icon">
                <Zap />
              </span>
              <h3>Lightning delivery, without the risk</h3>
              <p>
                Most services start in minutes and drip-feed naturally. Premium profiles and 30-day
                refill protection keep every campaign credible.
              </p>
              <div className="mkt-feature-bars" aria-hidden="true">
                <span style={{ width: '44%' }} />
                <span style={{ width: '68%' }} />
                <span style={{ width: '86%' }} />
                <span style={{ width: '100%' }} />
              </div>
            </article>

            <article className="mkt-feature">
              <span className="mkt-feature-icon cyan">
                <Code2 />
              </span>
              <h3>API-first automation</h3>
              <p>Create orders and poll delivery from your own stack with a single v2 key.</p>
            </article>

            <article className="mkt-feature">
              <span className="mkt-feature-icon lime">
                <Wallet />
              </span>
              <h3>INR wallet, zero subscriptions</h3>
              <p>Top up instantly with PhonePe, GPay, Paytm or BHIM. Pay only for the orders you actually place.</p>
            </article>

            <article className="mkt-feature">
              <span className="mkt-feature-icon pink">
                <ShieldCheck />
              </span>
              <h3>Protection built in</h3>
              <p>Transparent pricing, live order tracking and a real support team when it matters.</p>
            </article>
          </div>
        </section>

        <section className="mkt-section" id="services">
          <div className="mkt-head">
            <div>
              <span className="eyebrow">The catalogue</span>
              <h2>Pick your growth grade.</h2>
            </div>
            <p className="mkt-head-note">
              {SERVICES.length} services across {new Set(SERVICES.map((s) => s.platform)).size} platforms,
              in three simple grades.
            </p>
          </div>

          <TierShowcase />

          <div style={{ marginTop: 18, textAlign: 'center' }}>
            <Link to={state.signedIn ? '/services' : '/login'} className="btn btn-ghost btn-sm">
              View full catalogue <ArrowRight />
            </Link>
          </div>
        </section>

        <section className="mkt-section" id="how">
          <div className="mkt-head">
            <div>
              <span className="eyebrow">How it works</span>
              <h2>From idea to impact in three steps.</h2>
            </div>
            <p>No onboarding calls, no waiting for approval. Open the panel and launch your first order in under two minutes.</p>
          </div>

          <div className="mkt-steps">
            <div className="mkt-step">
              <span className="mkt-step-num">01</span>
              <h3>Create your free account</h3>
              <p>Sign up with your email, confirm it with a 6-digit code and your panel is ready in a minute.</p>
              <span className="mkt-step-icon">
                <Sparkles />
              </span>
            </div>
            <div className="mkt-step">
              <span className="mkt-step-num">02</span>
              <h3>Top up your INR wallet</h3>
              <p>Add funds with PhonePe, GPay, Paytm or BHIM and see your wallet ready for orders.</p>
              <span className="mkt-step-icon">
                <Wallet />
              </span>
            </div>
            <div className="mkt-step">
              <span className="mkt-step-num">03</span>
              <h3>Drop a link. Watch it grow.</h3>
              <p>Pick a service, paste your link and track delivery live from your dashboard.</p>
              <span className="mkt-step-icon">
                <Zap />
              </span>
            </div>
          </div>
        </section>

        <section className="mkt-final">
          <div className="mkt-final-inner">
            <span className="eyebrow">
              <Sparkles size={12} /> Ready when you are
            </span>
            <h2>
              Make your next campaign
              <br />
              <span className="grad-text">impossible</span> <span className="grad-cool">to ignore.</span>
            </h2>
            <p>
              Create your free account, top up your wallet with UPI and place your first order in
              minutes. We never ask for your social media passwords.
            </p>
            <div className="mkt-final-actions">
              <Link to={panelHref} className="btn btn-lime btn-lg">
                <Sparkles /> Open the UGrowSMM panel
              </Link>
              <InstallButton />
            </div>
            <div className="mkt-final-meta">
              <span>
                <Check /> Secure UPI payments
              </span>
              <span>
                <Check /> 30-day refill protection
              </span>
              <span>
                <Check /> Instant UPI top-up
              </span>
            </div>
          </div>
        </section>

        <section className="mkt-section" id="faq">
          <div className="mkt-head">
            <div>
              <span className="eyebrow">Good to know</span>
              <h2>Questions, answered.</h2>
            </div>
            <p className="mkt-head-note">
              Everything you need before your first order. Still unsure? Raise a ticket from the Support page and
              we answer within one business day.
            </p>
          </div>

          <div className="mkt-faq">
            {FAQS.map((faq, index) => {
              const open = openFaq === index
              return (
                <div className={`mkt-faq-item ${open ? 'open' : ''}`} key={faq.q}>
                  <button
                    type="button"
                    id={`faq-button-${index}`}
                    onClick={() => setOpenFaq(open ? null : index)}
                    aria-expanded={open}
                    aria-controls={`faq-panel-${index}`}
                  >
                    <span>{faq.q}</span>
                    <ChevronDown />
                  </button>
                  <div
                    className="mkt-faq-answer"
                    id={`faq-panel-${index}`}
                    role="region"
                    aria-labelledby={`faq-button-${index}`}
                  >
                    <p>{faq.a}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        <section className="mkt-section">
          <div className="mkt-head">
            <div>
              <span className="eyebrow">Loved by creators</span>
              <h2>Don’t take our word for it.</h2>
            </div>
          </div>

          <ReviewsMarquee />
        </section>
      </main>

      <footer className="mkt-footer">
        <div className="mkt-footer-grid">
          <div className="mkt-footer-brand">
            <Link to="/" className="brand">
              <span className="brand-mark">
                <LogoGlyph size={23} />
              </span>
              <span>
                <Wordmark />
                <span className="brand-sub">SMM Panel</span>
              </span>
            </Link>
            <p>
              The growth operating system for creators, agencies and resellers. One panel, every
              platform, zero guesswork.
            </p>
            <div className="row wrap" style={{ gap: 8 }}>
              <span className="pill">
                <ShieldCheck size={11} /> Secure checkout
              </span>
              <span className="pill">
                <Clock size={11} /> 42m avg start
              </span>
            </div>
          </div>

          <div className="mkt-footer-col">
            <h3>Product</h3>
            <Link to={panelHref}>Panel</Link>
            <button type="button" onClick={() => scrollToSection('#services')}>
              Services
            </button>
            <button type="button" onClick={() => scrollToSection('#features')}>
              Features
            </button>
            <Link to={state.signedIn ? '/api' : '/login'}>{state.signedIn ? 'API & keys' : 'API access'}</Link>
          </div>

          <div className="mkt-footer-col">
            <h3>Legal</h3>
            <Link to="/terms">Terms of Service</Link>
            <Link to="/privacy">Privacy Policy</Link>
            <Link to="/refund-policy">Refund Policy</Link>
            <Link to="/cookies">Cookie Policy</Link>
          </div>

          <div className="mkt-footer-col">
            <h3>Get the app</h3>
            <p className="tiny faint">Install UGrowSMM on Android for a full-screen panel.</p>
            <InstallButton />
            <span className="tiny faint">Android · Chrome · Edge</span>
          </div>
        </div>

        <div className="mkt-footer-bottom">
          <span>© 2026 UGrowSMM · Independent SMM panel · Demo UI, no real transactions</span>
          <span className="row" style={{ gap: 14 }}>
            <Link to={panelHref}>{state.signedIn ? 'Dashboard' : 'Sign in'}</Link>
            <Link to="/terms">Terms</Link>
            <Link to="/privacy">Privacy</Link>
          </span>
        </div>
      </footer>
    </div>
  )
}
