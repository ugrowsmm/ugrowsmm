import Turnstile from '../components/Turnstile'
import Honeypot from '../components/Honeypot'
import { shield } from '../lib/shield'
import { TURNSTILE_KEY, USERS_LABEL } from '../lib/config'
import { apiReady, callApi } from '../lib/api'
import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Eye,
  EyeOff,
  Gift,
  KeyRound,
  Loader2,
  Lock,
  Mail,
  ShieldCheck,
  Sparkles,
  User,
} from 'lucide-react'
import { useStore, type AccountProfile } from '../lib/store'
import { PLATFORM_LABEL, SERVICES, formatINR } from '../lib/data'
import { PlatformIcon } from '../components/PlatformIcon'
import { LogoGlyph, Wordmark } from '../components/Logo'
import InstallButton from '../components/InstallButton'

const FEATURES = [
  'Instant start on 20+ services — likes, views, followers',
  'HQ delivery with drip-feed and refill protection',
  'One wallet, one API, every platform you grow',
]

type View = 'signin' | 'signup' | 'verify' | 'forgot' | 'reset'

const ERRORS: Record<string, string> = {
  invalid_email: 'Enter a valid email address.',
  name_required: 'Enter your name.',
  weak_password: 'Password must be 8 to 100 characters.',
  email_exists: 'An account with this email already exists. Sign in instead.',
  invalid_credentials: 'Wrong email or password.',
  locked: 'Too many wrong attempts. Try again in 15 minutes or reset your password.',
  code_invalid: 'That code is not correct.',
  code_expired: 'That code has expired. Request a new one.',
  too_many_attempts: 'Too many wrong codes. Request a new one.',
  too_many_codes: 'Too many codes requested. Try again in an hour.',
  rate_limited: 'Too many tries. Wait a minute and try again.',
  captcha_required: 'Please complete the security check first.',
  captcha_failed: 'Security check failed. Please try again.',
  network: 'Network problem. Check your connection and try again.',
  'unknown action': 'The server needs its latest update before accounts work. Please try again shortly.',
}
const errText = (e?: string) => (e && ERRORS[e]) || 'Something went wrong. Please try again.'
const maskEmail = (e: string) => e.replace(/^(.).*(@.*)$/, (_m, a, b) => a + '•••' + b)

export default function Login() {
  const { signIn, signInAccount, toast, justDeleted, clearJustDeleted } = useStore()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const linkRef = (params.get('ref') ?? '').trim().toUpperCase().slice(0, 24)
  const savedRef = (() => { try { return (localStorage.getItem('ug_ref') ?? '').toUpperCase() } catch { return '' } })()
  const inviteCode = linkRef || savedRef
  const live = apiReady()

  const [view, setView] = useState<View>(inviteCode ? 'signup' : 'signin')
  const [name, setName] = useState('')
  const [email, setEmail] = useState(live ? '' : 'aarav@ugrowsmm.com')
  const [password, setPassword] = useState(live ? '' : 'demo1234')
  const [ref, setRef] = useState(inviteCode)
  const [otp, setOtp] = useState('')
  const [show, setShow] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [wait, setWait] = useState(0)

  useEffect(() => {
    document.title = (view === 'signup' ? 'Create account' : 'Sign in') + ' — UGrowSMM'
  }, [view])

  useEffect(() => {
    if (wait <= 0) return
    const t = window.setTimeout(() => setWait((w) => w - 1), 1000)
    return () => window.clearTimeout(t)
  }, [wait])

  const loadedAt = useRef(Date.now())
  const botCheck = () => {
    if (shield.hp) return 'Something went wrong. Please try again.'
    if (Date.now() - loadedAt.current < 1200) return 'Please wait a moment and try again.'
    if (TURNSTILE_KEY && !shield.captcha) return 'Please complete the security check first.'
    return ''
  }
  const go = (v: View) => { setView(v); setError(''); setOtp('') }
  const finish = (r: { token: string; profile: AccountProfile }, msg: string) => {
    clearJustDeleted()
    try { localStorage.removeItem('ug_ref') } catch { /* ignore */ }
    signInAccount(r.profile, r.token)
    toast(msg, 'Your panel is ready.', 'success')
    navigate('/', { replace: true })
  }
  const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    const blocked = botCheck()
    if (blocked) return setError(blocked)

    // Preview mode (no backend configured): the old demo sign-in
    if (!live) {
      clearJustDeleted()
      signIn(email)
      navigate('/', { replace: true })
      return
    }

    if (view === 'signin' || view === 'signup' || view === 'forgot') {
      if (!validEmail) return setError(ERRORS.invalid_email)
    }
    if (view === 'signup' && !name.trim()) return setError(ERRORS.name_required)
    if ((view === 'signup' || view === 'reset') && (password.length < 8)) return setError('Password must be at least 8 characters.')
    if (view === 'signin' && !password) return setError('Enter your password.')
    if ((view === 'verify' || view === 'reset') && !/^\d{6}$/.test(otp.trim())) return setError('Enter the 6-digit code from your email.')

    setLoading(true)
    const em = email.trim()
    try {
      if (view === 'signup') {
        const r: any = await callApi('signup', { name: name.trim(), email: em, password, ref: ref.trim() })
        if (r.error === 'wait') { setWait(r.wait || 60); go('verify'); return }
        if (r.error) return setError(errText(r.error))
        setWait(60)
        go('verify')
      } else if (view === 'verify') {
        const r: any = await callApi('verifyEmail', { email: em, otp: otp.trim() })
        if (r.error) return setError(errText(r.error))
        finish(r, 'Email verified. Welcome, ' + (r.profile.name || 'there'))
      } else if (view === 'signin') {
        const r: any = await callApi('login', { email: em, password })
        if (r.error === 'not_verified') {
          setWait(r.wait || 60)
          toast('Verify your email', 'We sent a 6-digit code to ' + maskEmail(em), 'info')
          go('verify')
          return
        }
        if (r.error) return setError(errText(r.error))
        finish(r, 'Welcome back, ' + (r.profile.name || ''))
      } else if (view === 'forgot') {
        const r: any = await callApi('forgotPassword', { email: em })
        if (r.error && r.error !== 'wait') return setError(errText(r.error))
        setWait(60)
        setPassword('')
        go('reset')
        toast('Check your email', 'If an account exists, a 6-digit code is on its way.', 'info')
      } else if (view === 'reset') {
        const r: any = await callApi('resetPassword', { email: em, otp: otp.trim(), password })
        if (r.error) return setError(errText(r.error))
        setPassword('')
        go('signin')
        toast('Password updated', 'Sign in with your new password.', 'success')
      }
    } finally {
      setLoading(false)
    }
  }

  const resend = async () => {
    if (wait > 0 || loading) return
    setError('')
    const r: any = await callApi('resendOtp', { email: email.trim() })
    if (r.error === 'wait') return setWait(r.wait || 60)
    if (r.error) return setError(errText(r.error))
    setWait(60)
    toast('Code sent', 'Check your inbox and spam folder.', 'success')
  }

  const title = { signin: 'Welcome back', signup: 'Create your account', verify: 'Verify your email', forgot: 'Reset your password', reset: 'Set a new password' }[view]
  const sub = {
    signin: 'Pick up where you left off — your orders kept growing.',
    signup: 'Takes a minute. Verify your email with a 6-digit code and you are in.',
    verify: 'We sent a 6-digit code to ' + maskEmail(email.trim() || 'your email') + '. Enter it below.',
    forgot: 'Enter your account email and we will send you a 6-digit code.',
    reset: 'Enter the code we emailed you and choose a new password.',
  }[view]
  const cta = { signin: 'Sign in to dashboard', signup: 'Create account', verify: 'Verify & continue', forgot: 'Send code', reset: 'Update password' }[view]
  const loadingText = { signin: 'Signing in…', signup: 'Creating account…', verify: 'Verifying…', forgot: 'Sending code…', reset: 'Updating…' }[view]

  return (
    <div className="auth">
      <section className="auth-visual" aria-label="UGrowSMM overview">
        <Link to="/" className="brand">
          <span className="brand-mark">
            <LogoGlyph size={23} />
          </span>
          <span>
            <Wordmark />
            <span className="brand-sub">SMM Panel</span>
          </span>
        </Link>

        <div className="auth-hero">
          <span className="eyebrow">The growth operating system</span>
          <h1 style={{ marginTop: 16 }}>
            Grow louder.
            <br />
            <span className="grad-text">Ship results</span> <span className="grad-cool">faster.</span>
          </h1>
          <p>
            Every like, view and follower in one beautifully fast panel. Premium delivery,
            transparent pricing, and a dashboard that finally feels like it was built this decade.
          </p>

          <div className="auth-feats">
            {FEATURES.map((f) => (
              <div className="auth-feat" key={f}>
                <span className="ic">
                  <Check />
                </span>
                {f}
              </div>
            ))}
          </div>

          <div className="auth-preview" aria-hidden="true">
            <div className="ap-head">
              <span className="live">Popular services</span>
              <span className="badge badge-green">Instant start</span>
            </div>
            {(['instagram', 'youtube', 'facebook'] as const).map((p) => {
              const from = Math.min(...SERVICES.filter((x) => x.platform === p).map((x) => x.rate))
              return (
                <div className="ap-row" key={p}>
                  <span className={`platform-tile ${p}`} style={{ width: 30, height: 30, borderRadius: 9 }}>
                    <PlatformIcon platform={p} size={14} />
                  </span>
                  <div className="grow">
                    <div className="ap-name">{PLATFORM_LABEL[p]}</div>
                    <div className="tiny faint">Starts within minutes</div>
                  </div>
                  <span className="ap-price">{Number.isFinite(from) ? `From ${formatINR(from, 0)}/1K` : ''}</span>
                </div>
              )
            })}
          </div>
        </div>

        <div className="auth-proof">
          <div className="faces" aria-hidden="true">
            <span>{USERS_LABEL}</span>
          </div>
          <div>
            <small>Trusted by {USERS_LABEL} creators &amp; agencies</small>
          </div>
        </div>
      </section>

      <main className="auth-form-side">
        <div className="auth-card">
          <Link to="/" className="auth-mobile-brand">
            <span className="brand-mark">
              <LogoGlyph size={23} />
            </span>
            <span>
              <Wordmark />
              <span className="brand-sub">SMM Panel</span>
            </span>
          </Link>

          <span className="eyebrow">{view === 'signup' ? 'New here' : 'Secure sign in'}</span>
          <h2>{title}</h2>
          <p className="sub">{sub}</p>

          {justDeleted ? (
            <div className="info-box warn" style={{ marginBottom: 16 }}>
              <ShieldCheck />
              <div>Your account data was deleted and reset. You can sign back in.</div>
            </div>
          ) : null}

          <form onSubmit={submit} noValidate>
            <Honeypot />
            <Turnstile />

            {view === 'signup' ? (
              <div className="field" style={{ marginBottom: 14 }}>
                <label className="label" htmlFor="name">Full name</label>
                <div className="input-wrap">
                  <span className="lead"><User /></span>
                  <input id="name" className="input" type="text" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" maxLength={60} />
                </div>
              </div>
            ) : null}

            {view !== 'verify' ? (
              <div className="field">
                <label className="label" htmlFor="email">Email address</label>
                <div className="input-wrap">
                  <span className="lead"><Mail /></span>
                  <input id="email" className="input" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@studio.com" readOnly={view === 'reset'} />
                </div>
              </div>
            ) : null}

            {view === 'signin' || view === 'signup' || view === 'reset' ? (
              <div className="field" style={{ marginTop: 14 }}>
                <label className="label" htmlFor="password">
                  {view === 'reset' ? 'New password' : 'Password'}
                  {view === 'signin' ? (
                    <button type="button" className="hint" style={{ border: 0, background: 'none', cursor: 'pointer', color: '#9a3412' }} onClick={() => go('forgot')}>
                      Forgot password?
                    </button>
                  ) : null}
                </label>
                <div className="input-wrap">
                  <span className="lead"><Lock /></span>
                  <input id="password" className="input" type={show ? 'text' : 'password'} autoComplete={view === 'signin' ? 'current-password' : 'new-password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder={view === 'signin' ? '••••••••' : 'At least 8 characters'} style={{ paddingRight: 46 }} />
                  <span className="trail">
                    <button type="button" className="pw-toggle" onClick={() => setShow((v) => !v)} aria-label={show ? 'Hide password' : 'Show password'}>
                      {show ? <EyeOff /> : <Eye />}
                    </button>
                  </span>
                </div>
              </div>
            ) : null}

            {view === 'signup' ? (
              <div className="field" style={{ marginTop: 14 }}>
                <label className="label" htmlFor="ref">Referral code <span className="hint">{linkRef ? 'Applied from your invite link' : 'Optional'}</span></label>
                <div className="input-wrap">
                  <span className="lead"><Gift /></span>
                  <input id="ref" className="input" type="text" value={ref} onChange={(e) => setRef(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))} placeholder="e.g. UGAB12CD" readOnly={!!linkRef} maxLength={24} />
                </div>
              </div>
            ) : null}

            {view === 'verify' || view === 'reset' ? (
              <div className="field" style={{ marginTop: view === 'reset' ? 14 : 0 }}>
                <label className="label" htmlFor="otp">6-digit code</label>
                <div className="input-wrap">
                  <span className="lead"><KeyRound /></span>
                  <input id="otp" className="input" type="text" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]*" maxLength={6} value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))} placeholder="123456" style={{ letterSpacing: '0.35em', fontWeight: 700 }} />
                </div>
                <div className="between" style={{ marginTop: 8 }}>
                  <button type="button" className="hint" style={{ border: 0, background: 'none', cursor: wait > 0 ? 'default' : 'pointer', color: wait > 0 ? '#98a2b3' : '#9a3412', padding: 0 }} onClick={resend} disabled={wait > 0}>
                    {wait > 0 ? `Resend code in ${wait}s` : 'Resend code'}
                  </button>
                  <span className="tiny faint">Check spam too</span>
                </div>
              </div>
            ) : null}

            {error ? (
              <div className="error-line" style={{ marginTop: 12 }} role="alert">{error}</div>
            ) : null}

            <button type="submit" className="btn btn-primary btn-lg btn-block" style={{ marginTop: 20 }} disabled={loading}>
              {loading ? (<><Loader2 className="spin" /> {loadingText}</>) : (<>{cta} <ArrowRight /></>)}
            </button>
          </form>

          {view === 'signin' || view === 'signup' ? (
            <p className="small muted" style={{ textAlign: 'center', marginTop: 16 }}>
              {view === 'signin' ? 'New to UGrowSMM? ' : 'Already have an account? '}
              <button type="button" onClick={() => go(view === 'signin' ? 'signup' : 'signin')} style={{ border: 0, background: 'none', cursor: 'pointer', color: '#9a3412', fontWeight: 700, padding: 0, font: 'inherit' }}>
                {view === 'signin' ? 'Create an account' : 'Sign in'}
              </button>
            </p>
          ) : (
            <p className="small muted" style={{ textAlign: 'center', marginTop: 16 }}>
              <button type="button" onClick={() => go('signin')} style={{ border: 0, background: 'none', cursor: 'pointer', color: '#9a3412', fontWeight: 700, padding: 0, font: 'inherit' }}>
                Back to sign in
              </button>
            </p>
          )}

          {!live ? (
            <>
              <div className="auth-divider">or</div>
              <button type="button" className="btn btn-ghost btn-block" onClick={() => { clearJustDeleted(); signIn('aarav@ugrowsmm.com'); navigate('/', { replace: true }) }}>
                <Sparkles /> Explore demo instantly
              </button>
            </>
          ) : null}

          <p className="auth-legal">
            By continuing you agree to our <Link to="/terms">Terms of Service</Link> and{' '}
            <Link to="/privacy">Privacy Policy</Link>.
          </p>
          <div className="auth-legal-links">
            <Link to="/refund-policy">Refund Policy</Link>
            <span>·</span>
            <Link to="/cookies">Cookie Policy</Link>
          </div>

          <div className="auth-public-actions">
            <Link to="/" className="btn btn-ghost btn-sm">
              <ArrowLeft /> Homepage
            </Link>
            <InstallButton label="Install app" />
          </div>
        </div>
      </main>
    </div>
  )
}
