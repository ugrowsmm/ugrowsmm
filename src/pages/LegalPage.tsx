import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowLeft,
  ArrowUp,
  Check,
  Cookie,
  FileText,
  Info,
  Mail,
  Scale,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'
import {
  LEGAL_DOCS,
  LEGAL_ORDER,
  type LegalSlug,
} from '../lib/legal'
import { useStore } from '../lib/store'
import { LogoGlyph, Wordmark } from '../components/Logo'
import { Switch } from '../components/ui'
import { scrollToSection, scrollToTop } from '../lib/smoothScroll'

const COOKIE_KEY = 'ugrowsmm.cookiePrefs.v1'
const LEGACY_COOKIE_KEY = 'ugrowssm.cookiePrefs.v1'

interface CookiePrefs {
  analytics: boolean
  marketing: boolean
}

const defaultPrefs: CookiePrefs = { analytics: false, marketing: false }

function readPrefs(): CookiePrefs {
  try {
    let raw = localStorage.getItem(COOKIE_KEY)
    if (!raw) {
      // migrate choices saved before the UGrowSMM rename
      raw = localStorage.getItem(LEGACY_COOKIE_KEY)
      if (raw) {
        localStorage.setItem(COOKIE_KEY, raw)
        localStorage.removeItem(LEGACY_COOKIE_KEY)
      }
    }
    if (!raw) return defaultPrefs
    const parsed = JSON.parse(raw) as Partial<CookiePrefs>
    return {
      analytics: Boolean(parsed.analytics),
      marketing: Boolean(parsed.marketing),
    }
  } catch {
    return defaultPrefs
  }
}

function CookiePreferences() {
  const { toast } = useStore()
  const [prefs, setPrefs] = useState<CookiePrefs>(readPrefs)
  const [saved, setSaved] = useState(false)

  const save = () => {
    try {
      localStorage.setItem(COOKIE_KEY, JSON.stringify(prefs))
    } catch {
      /* preferences remain in memory if storage is unavailable */
    }
    setSaved(true)
    toast(
      'Cookie preferences saved',
      prefs.analytics || prefs.marketing
        ? 'Optional storage choices were updated for this browser.'
        : 'Only strictly necessary storage will be used.',
      'success',
    )
  }

  return (
    <section id="preferences" className="legal-section cookie-prefs">
      <div className="legal-kicker">
        <Cookie size={12} /> Preferences
      </div>
      <h2>Set your cookie preferences</h2>
      <p>
        Choose whether optional analytics and marketing storage may be used. Essential storage is
        always active because the panel cannot sign you in or remember your wallet without it.
      </p>

      <div className="cookie-card">
        <div className="switch-row">
          <div>
            <div className="t">
              Strictly necessary <span className="badge badge-green">Always active</span>
            </div>
            <div className="d">Authentication, security, wallet state and your saved preferences.</div>
          </div>
          <span className="badge">
            <ShieldCheck /> Required
          </span>
        </div>

        <div className="switch-row">
          <div>
            <div className="t">Analytics</div>
            <div className="d">Helps us understand which services and features are used most.</div>
          </div>
          <Switch
            on={prefs.analytics}
            onChange={(v) => {
              setPrefs((p) => ({ ...p, analytics: v }))
              setSaved(false)
            }}
            label="Allow analytics storage"
          />
        </div>

        <div className="switch-row">
          <div>
            <div className="t">Marketing</div>
            <div className="d">Measures campaigns and personalises offers. Off by default.</div>
          </div>
          <Switch
            on={prefs.marketing}
            onChange={(v) => {
              setPrefs((p) => ({ ...p, marketing: v }))
              setSaved(false)
            }}
            label="Allow marketing storage"
          />
        </div>
      </div>

      <div className="cookie-actions">
        <button type="button" className="btn btn-primary btn-sm" onClick={save}>
          <Check /> Save preferences
        </button>
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          onClick={() => {
            setPrefs(defaultPrefs)
            setSaved(false)
            toast('Optional cookies turned off', 'No optional storage will be used until you save otherwise.', 'info')
          }}
        >
          Reject optional
        </button>
        {saved ? <span className="tiny faint">Saved for this browser</span> : null}
      </div>

      <div className="info-box" style={{ marginTop: 14 }}>
        <Info />
        <div>
          This demo loads no third-party analytics or ad scripts. The toggles record your choice
          locally so the policy works end to end.
        </div>
      </div>
    </section>
  )
}

export default function LegalPage({ slug }: { slug: LegalSlug }) {
  const doc = LEGAL_DOCS[slug]
  const { state } = useStore()
  const [active, setActive] = useState(doc.sections[0]?.id ?? '')

  const readingTime = useMemo(() => {
    const words = doc.sections
      .flatMap((s) => [s.title, ...(s.paragraphs ?? []), ...(s.list ?? []), s.note ?? ''])
      .join(' ')
      .split(/\s+/).length
    return Math.max(3, Math.ceil(words / 190))
  }, [doc])

  useEffect(() => {
    setActive(doc.sections[0]?.id ?? '')
    const previous = document.title
    document.title = `${doc.title} — UGrowSMM`
    return () => {
      document.title = previous
    }
  }, [doc])

  useEffect(() => {
    const headings = doc.sections
      .map((s) => document.getElementById(s.id))
      .filter((el): el is HTMLElement => Boolean(el))

    const onScroll = () => {
      let current = headings[0]?.id ?? ''
      for (const heading of headings) {
        if (heading.getBoundingClientRect().top <= 170) current = heading.id
      }
      setActive(current)
    }

    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [doc])

  const backLabel = state.signedIn ? 'Back to panel' : 'Back to sign in'
  const backHref = state.signedIn ? '/' : '/login'

  return (
    <div className="legal-shell">
      <header className="legal-topbar">
        <Link to="/" className="brand">
          <span className="brand-mark">
            <LogoGlyph size={22} />
          </span>
          <span>
            <Wordmark />
            <span className="brand-sub">SMM Panel</span>
          </span>
        </Link>
        <div className="legal-top-actions">
          <span className="pill hide-mobile">
            <Scale size={11} /> Legal centre
          </span>
          <Link to={backHref} className="btn btn-soft btn-sm">
            <ArrowLeft /> {backLabel}
          </Link>
        </div>
      </header>

      <main className="legal-page">
        <div className="legal-hero">
          <span className="eyebrow">
            <Scale size={12} /> Legal · {doc.navLabel}
          </span>
          <h1>{doc.title}</h1>
          <p>{doc.subtitle}</p>
          <div className="legal-meta">
            <span>
              <FileText /> Last updated {doc.updated}
            </span>
            <span>·</span>
            <span>{readingTime} min read</span>
            <span>·</span>
            <span>Applies to ugrowsmm.com and the UGrowSMM app</span>
          </div>
        </div>

        <div className="legal-layout">
          <aside className="legal-side">
            <nav className="legal-docs" aria-label="Legal documents">
              {LEGAL_ORDER.map((key) => (
                <Link
                  key={key}
                  to={LEGAL_DOCS[key].path}
                  className={`legal-doc-link ${key === slug ? 'active' : ''}`}
                  aria-current={key === slug ? 'page' : undefined}
                >
                  <span>{LEGAL_DOCS[key].navLabel}</span>
                  {key === slug ? <span className="legal-dot" /> : null}
                </Link>
              ))}
            </nav>

            <div className="legal-toc">
              <div className="legal-toc-label">On this page</div>
              {doc.sections.map((section, index) => (
                <button
                  key={section.id}
                  type="button"
                  className={active === section.id ? 'active' : ''}
                  onClick={() => scrollToSection(`#${section.id}`)}
                >
                  <span>{String(index + 1).padStart(2, '0')}</span>
                  {section.title}
                </button>
              ))}
            </div>

            <div className="legal-side-help">
              <Sparkles size={14} />
              <div>
                <b>Need a hand?</b>
                <a href="mailto:support@ugrowsmm.com">support@ugrowsmm.com</a>
              </div>
            </div>
          </aside>

          <article className="legal-body">
            <div className="legal-demo-note">
              <Info />
              <div>
                <b>Demo template.</b> These policies describe the UGrowSMM product model and are
                provided for design evaluation only. No real orders, payments or personal data are
                processed here. Have them reviewed by qualified legal counsel before a commercial
                launch.
              </div>
            </div>

            <p className="legal-intro">{doc.intro}</p>

            {doc.sections.map((section, index) => (
              <section className="legal-section" id={section.id} key={section.id}>
                <div className="legal-section-num">{String(index + 1).padStart(2, '0')}</div>
                <h2>{section.title}</h2>
                {section.paragraphs?.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
                {section.list ? (
                  <ul className="legal-list">
                    {section.list.map((item) => (
                      <li key={item}>
                        <span className="legal-tick">
                          <Check />
                        </span>
                        {item}
                      </li>
                    ))}
                  </ul>
                ) : null}
                {section.note ? (
                  <div className="info-box warn">
                    <Info />
                    <div>{section.note}</div>
                  </div>
                ) : null}
              </section>
            ))}

            {slug === 'cookies' ? <CookiePreferences /> : null}

            {slug === 'refund' ? (
              <div className="legal-cta card">
                <div>
                  <span className="eyebrow">Order issue?</span>
                  <h3>Start a refund request</h3>
                  <p className="tiny faint">
                    Include your order ID and a screenshot of the current count. We reply within 48
                    hours.
                  </p>
                </div>
                <a
                  className="btn btn-primary"
                  href="mailto:refunds@ugrowsmm.com?subject=Refund%20request"
                >
                  <Mail /> Email refunds
                </a>
              </div>
            ) : null}

            <div className="legal-contact-card">
              <div className="legal-contact-icon">
                <Mail />
              </div>
              <div className="grow">
                <h3>Still have questions?</h3>
                <p className="tiny faint">
                  Our team answers legal and account queries within one business day.
                </p>
              </div>
              <a className="btn btn-ghost btn-sm" href="mailto:support@ugrowsmm.com">
                Contact support
              </a>
            </div>

            <div className="legal-end">
              <button type="button" className="text-btn" onClick={() => scrollToTop(false)}>
                <ArrowUp /> Back to top
              </button>
              <span className="tiny faint">UGrowSMM · {doc.updated}</span>
            </div>
          </article>
        </div>
      </main>

      <footer className="legal-footer">
        <div className="legal-footer-inner">
          <Link to="/" className="legal-footer-brand">
            <span className="footer-mark">
              <LogoGlyph size={18} />
            </span>
            <span>
              <b>UGrowSMM</b>
              <small>Premium SMM panel</small>
            </span>
          </Link>
          <nav className="legal-footer-links" aria-label="Legal links">
            {LEGAL_ORDER.map((key) => (
              <Link key={key} to={LEGAL_DOCS[key].path}>
                {LEGAL_DOCS[key].navLabel}
              </Link>
            ))}
          </nav>
          <div className="legal-footer-right">
            <Cookie size={13} />
            <Link to="/cookies">Cookie settings</Link>
          </div>
        </div>
        <div className="legal-footer-copy">
          © 2026 UGrowSMM · Independent SMM panel · Not affiliated with any social platform
        </div>
      </footer>
    </div>
  )
}
