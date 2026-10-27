import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  AlertTriangle,
  ArrowRight,
  BadgeCheck,
  Bell,
  Check,
  Download,
  KeyRound,
  Laptop,
  Lock,
  LogOut,
  Mail,
  MapPin,
  Save,
  ShieldCheck,
  Smartphone,
  Trash2,
  User,
} from 'lucide-react'
import { useStore } from '../lib/store'
import { apiReady, rpc } from '../lib/api'
import { supabase } from '../lib/supabase'
import { formatDate, formatINR } from '../lib/data'
import { InfoBox, Modal, ModalHead, Switch } from '../components/ui'

type Tab = 'Profile' | 'Security' | 'Notifications' | 'Danger zone'

const TABS: Array<{ id: Tab; icon: typeof User }> = [
  { id: 'Profile', icon: User },
  { id: 'Security', icon: ShieldCheck },
  { id: 'Notifications', icon: Bell },
  { id: 'Danger zone', icon: AlertTriangle },
]

const COUNTRIES = ['India', 'United States', 'United Kingdom', 'UAE', 'Canada', 'Australia', 'Germany']

const initials = (name: string) =>
  name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

export default function SettingsPage() {
  const {
    state,
    updateProfile,
    updateNotifications,
    signOut,
    deleteAccount,
    toast,
  } = useStore()
  const [deleting, setDeleting] = useState(false)

  const [tab, setTab] = useState<Tab>('Profile')
  const [name, setName] = useState(state.profile.name)
  const [username, setUsername] = useState(state.profile.username)
  const [email, setEmail] = useState(state.profile.email)
  const [phone, setPhone] = useState(state.profile.phone)
  const [country, setCountry] = useState(state.profile.country)
  const [profileError, setProfileError] = useState('')

  const [currentPw, setCurrentPw] = useState('')
  const [newPw, setNewPw] = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [pwError, setPwError] = useState('')
  const [twoFa, setTwoFa] = useState(true)

  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleteText, setDeleteText] = useState('')

  const live = state.real && apiReady()

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setProfileError('')
    if (name.trim().length < 2) return setProfileError('Please enter your full name.')
    if (!live && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return setProfileError('Enter a valid email address.')
    if (live) {
      // the name is stored in the database (it is what the panel reloads every 30 seconds); the email is fixed
      const { error } = await rpc('update_profile', { p_name: name.trim() })
      if (error) return setProfileError('Could not save your name right now. Please try again.')
      updateProfile({ name: name.trim(), username, phone, country })
    } else {
      updateProfile({ name: name.trim(), username, email: email.trim(), phone, country })
    }
    toast('Profile updated', 'Your account details were saved.', 'success')
  }

  const [pwBusy, setPwBusy] = useState(false)

  const savePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setPwError('')
    if (currentPw.length < 4) return setPwError('Enter your current password.')
    if (newPw.length < 8) return setPwError('New password must be at least 8 characters.')
    if (newPw !== confirmPw) return setPwError('New passwords do not match.')
    if (live) {
      setPwBusy(true)
      try {
        // confirm the current password first, using the address the login system itself has on file
        const { data: u } = await supabase.auth.getUser()
        const authEmail = u.user?.email
        if (!authEmail) return setPwError('Your session has ended. Please sign in again.')
        const check = await supabase.auth.signInWithPassword({ email: authEmail, password: currentPw })
        if (check.error) return setPwError('Your current password is wrong.')
        const { error } = await supabase.auth.updateUser({ password: newPw })
        if (error) return setPwError(error.message || 'Could not change the password. Please try again.')
      } catch {
        return setPwError('Network problem. Check your connection and try again.')
      } finally {
        setPwBusy(false)
      }
      toast('Password changed', 'Use your new password the next time you sign in.', 'success')
    } else {
      toast('Password changed', 'All other sessions have been signed out (demo).', 'success')
    }
    setCurrentPw('')
    setNewPw('')
    setConfirmPw('')
  }

  const signOutEverywhere = async () => {
    try {
      await supabase.auth.signOut({ scope: 'global' })
    } catch {
      /* the local sign-out below still happens */
    }
    signOut()
    toast('Signed out everywhere', 'Every device must sign in again.', 'info')
  }

  const exportData = () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'ugrowsmm-account.json'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    toast('Data exported', 'A JSON copy of your account was downloaded.', 'info')
  }

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <span className="eyebrow">
            <User size={12} /> Account
          </span>
          <h1>Settings & security</h1>
          <p>{live ? 'Control your profile, password, alerts and account.' : 'Control your identity, login security, alerts and the lifecycle of this demo account.'}</p>
        </div>
        <button
          type="button"
          className="btn btn-ghost"
          onClick={() => {
            signOut()
            toast('Signed out', live ? 'You have been signed out on this device.' : 'Your demo session was closed securely.', 'info')
          }}
        >
          <LogOut /> Log out
        </button>
      </div>

      <div className="settings-layout">
        <div className="settings-nav" role="tablist" aria-label="Settings sections">
          {TABS.map(({ id, icon: Icon }) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={tab === id}
              className={tab === id ? 'active' : ''}
              onClick={() => setTab(id)}
              style={id === 'Danger zone' ? { color: tab === id ? '#be123c' : '#5b6472' } : undefined}
            >
              <Icon /> {id}
            </button>
          ))}
        </div>

        <div>
          {tab === 'Profile' ? (
            <>
              <div className="card card-pad">
                <div className="row wrap" style={{ gap: 16 }}>
                  <span className="avatar-lg">{initials(name)}</span>
                  <div className="grow">
                    <div className="row" style={{ gap: 8 }}>
                      <h2 style={{ fontSize: 19 }}>{name || 'Your name'}</h2>
                      <span className="badge badge-green">
                        <BadgeCheck /> Verified
                      </span>
                    </div>
                    <div className="tiny faint" style={{ marginTop: 4 }}>
                      @{username} · Member since {formatDate(state.profile.joined)}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div className="tiny faint">Wallet balance</div>
                    <div style={{ fontSize: 17, fontWeight: 800 }}>{formatINR(state.balance)}</div>
                  </div>
                </div>

                <div className="dashed-divider" />

                <form onSubmit={saveProfile}>
                  <div className="grid-2-eq" style={{ gap: 14 }}>
                    <div className="field">
                      <label className="label" htmlFor="name">
                        Full name
                      </label>
                      <div className="input-wrap">
                        <span className="lead">
                          <User />
                        </span>
                        <input
                          id="name"
                          className="input"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="field">
                      <label className="label" htmlFor="username">
                        Username
                      </label>
                      <div className="input-wrap">
                        <span className="lead" style={{ fontSize: 12 }}>@</span>
                        <input
                          id="username"
                          className="input"
                          value={username}
                          onChange={(e) => setUsername(e.target.value.replace(/\s/g, '').toLowerCase())}
                        />
                      </div>
                    </div>
                    <div className="field">
                      <label className="label" htmlFor="email">
                        Email address
                        <span className="hint">
                          <Check size={10} style={{ display: 'inline' }} /> verified
                        </span>
                      </label>
                      <div className="input-wrap">
                        <span className="lead">
                          <Mail />
                        </span>
                        <input
                          id="email"
                          className="input"
                          type="email"
                          value={email}
                          readOnly={live}
                          onChange={(e) => setEmail(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="field">
                      <label className="label" htmlFor="phone">
                        Phone
                      </label>
                      <div className="input-wrap">
                        <span className="lead">
                          <Smartphone />
                        </span>
                        <input
                          id="phone"
                          className="input"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="field" style={{ marginTop: 14 }}>
                    <label className="label" htmlFor="country">
                      Country
                    </label>
                    <div className="input-wrap">
                      <span className="lead">
                        <MapPin />
                      </span>
                      <select
                        id="country"
                        className="select"
                        value={country}
                        onChange={(e) => setCountry(e.target.value)}
                        style={{ paddingLeft: 40 }}
                      >
                        {COUNTRIES.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {profileError ? (
                    <div className="error-line" style={{ marginTop: 12 }} role="alert">
                      {profileError}
                    </div>
                  ) : null}

                  <div className="row wrap" style={{ gap: 10, marginTop: 18 }}>
                    <button type="submit" className="btn btn-primary">
                      <Save /> Save changes
                    </button>
                    <button
                      type="button"
                      className="btn btn-ghost"
                      onClick={() => {
                        setName(state.profile.name)
                        setUsername(state.profile.username)
                        setEmail(state.profile.email)
                        setPhone(state.profile.phone)
                        setCountry(state.profile.country)
                        setProfileError('')
                        toast('Changes discarded', 'Your profile was restored.', 'info')
                      }}
                    >
                      Reset
                    </button>
                  </div>
                </form>
              </div>

              <div className="card card-pad" style={{ marginTop: 14 }}>
                <div className="card-title" style={{ marginBottom: 4 }}>
                  Connected apps
                </div>
                <div className="tiny faint" style={{ marginBottom: 12 }}>
                  Tools using your UGrowSMM account
                </div>
                <div className="row" style={{ gap: 12 }}>
                  <span className="qa-icon cyan">
                    <KeyRound size={15} />
                  </span>
                  <div className="grow">
                    <div style={{ fontSize: 12.5, fontWeight: 700 }}>API v2 · production key</div>
                    <div className="tiny faint">Last used 4 minutes ago · 12,480 requests</div>
                  </div>
                  <Link to="/api" className="text-btn">
                    Manage <ArrowRight />
                  </Link>
                </div>
              </div>
            </>
          ) : null}

          {tab === 'Security' ? (
            <>
              <div className="card card-pad">
                <div className="card-title">Change password</div>
                <div className="tiny faint" style={{ marginTop: 3, marginBottom: 16 }}>
                  Use at least 8 characters with a mix of letters and numbers.
                </div>
                <form onSubmit={savePassword}>
                  <div className="field">
                    <label className="label" htmlFor="current-pw">
                      Current password
                    </label>
                    <div className="input-wrap">
                      <span className="lead">
                        <Lock />
                      </span>
                      <input
                        id="current-pw"
                        className="input"
                        type="password"
                        value={currentPw}
                        onChange={(e) => setCurrentPw(e.target.value)}
                        placeholder="••••••••"
                        autoComplete="current-password"
                      />
                    </div>
                  </div>
                  <div className="grid-2-eq" style={{ gap: 14, marginTop: 14 }}>
                    <div className="field">
                      <label className="label" htmlFor="new-pw">
                        New password
                      </label>
                      <input
                        id="new-pw"
                        className="input"
                        type="password"
                        value={newPw}
                        onChange={(e) => setNewPw(e.target.value)}
                        placeholder="Minimum 8 characters"
                        autoComplete="new-password"
                      />
                    </div>
                    <div className="field">
                      <label className="label" htmlFor="confirm-pw">
                        Confirm password
                      </label>
                      <input
                        id="confirm-pw"
                        className="input"
                        type="password"
                        value={confirmPw}
                        onChange={(e) => setConfirmPw(e.target.value)}
                        placeholder="Repeat new password"
                        autoComplete="new-password"
                      />
                    </div>
                  </div>
                  {pwError ? (
                    <div className="error-line" style={{ marginTop: 12 }} role="alert">
                      {pwError}
                    </div>
                  ) : null}
                  <button type="submit" className="btn btn-primary" style={{ marginTop: 18 }} disabled={pwBusy}>
                    <ShieldCheck /> {pwBusy ? 'Updating…' : 'Update password'}
                  </button>
                </form>
              </div>

              {live ? (
                <div className="card card-pad" style={{ marginTop: 14 }}>
                  <div className="card-title" style={{ marginBottom: 4 }}>
                    Sessions
                  </div>
                  <div className="tiny faint" style={{ marginBottom: 14 }}>
                    Lost a phone or used a shared computer? Sign out of every device at once.
                  </div>
                  <button type="button" className="btn btn-ghost" onClick={signOutEverywhere}>
                    <LogOut /> Sign out on all devices
                  </button>
                </div>
              ) : (
                <>
              <div className="card card-pad" style={{ marginTop: 14 }}>
                <div className="card-title" style={{ marginBottom: 4 }}>
                  Two-factor authentication
                </div>
                <div className="switch-row" style={{ paddingTop: 10 }}>
                  <div>
                    <div className="t">Authenticator app</div>
                    <div className="d">Require a 6-digit code at every login.</div>
                  </div>
                  <Switch
                    on={twoFa}
                    onChange={(v) => {
                      setTwoFa(v)
                      toast(
                        v ? '2FA enabled' : '2FA disabled',
                        v ? 'Authenticator protection is active.' : 'Your account is less protected.',
                        v ? 'success' : 'error',
                      )
                    }}
                    label="Toggle two-factor authentication"
                  />
                </div>
              </div>

              <div className="card card-pad" style={{ marginTop: 14 }}>
                <div className="between" style={{ marginBottom: 12 }}>
                  <div>
                    <div className="card-title">Active sessions</div>
                    <div className="tiny faint" style={{ marginTop: 3 }}>
                      Devices currently signed in
                    </div>
                  </div>
                  <span className="badge badge-green">2 devices</span>
                </div>
                {[
                  { device: 'MacBook Pro · Chrome', where: 'Mumbai, IN', current: true },
                  { device: 'iPhone 15 · Safari', where: 'Mumbai, IN', current: false },
                ].map((s) => (
                  <div
                    key={s.device}
                    className="row"
                    style={{ gap: 12, padding: '11px 0', borderTop: '1px solid var(--line)' }}
                  >
                    <span className="qa-icon">
                      {s.device.startsWith('iPhone') ? <Smartphone size={14} /> : <Laptop size={14} />}
                    </span>
                    <div className="grow">
                      <div style={{ fontSize: 12.5, fontWeight: 700 }}>
                        {s.device}{' '}
                        {s.current ? (
                          <span className="badge badge-green" style={{ marginLeft: 6 }}>
                            This device
                          </span>
                        ) : null}
                      </div>
                      <div className="tiny faint">{s.where} · active now</div>
                    </div>
                    {!s.current ? (
                      <button
                        type="button"
                        className="text-btn"
                        onClick={() => toast('Session revoked', 'That device has been signed out (demo).', 'info')}
                      >
                        Revoke
                      </button>
                    ) : null}
                  </div>
                ))}
              </div>
                </>
              )}
            </>
          ) : null}

          {tab === 'Notifications' ? (
            <div className="card card-pad">
              <div className="card-title">Notification preferences</div>
              <div className="tiny faint" style={{ marginTop: 3 }}>
                Changes save automatically
              </div>

              <div style={{ marginTop: 10 }}>
                <div className="switch-row">
                  <div>
                    <div className="t">Order updates</div>
                    <div className="d">Delivery started, completed or refilled.</div>
                  </div>
                  <Switch
                    on={state.notifications.orderUpdates}
                    onChange={(v) => updateNotifications({ orderUpdates: v })}
                    label="Order update notifications"
                  />
                </div>
                <div className="switch-row">
                  <div>
                    <div className="t">Email alerts</div>
                    <div className="d">A copy of every alert in your inbox.</div>
                  </div>
                  <Switch
                    on={state.notifications.emailAlerts}
                    onChange={(v) => updateNotifications({ emailAlerts: v })}
                    label="Email alert notifications"
                  />
                </div>
                <div className="switch-row">
                  <div>
                    <div className="t">Promotions & bonuses</div>
                    <div className="d">Occasional offers and bonus credit drops.</div>
                  </div>
                  <Switch
                    on={state.notifications.promotions}
                    onChange={(v) => {
                      updateNotifications({ promotions: v })
                      toast(v ? 'Promotions on' : 'Promotions off', 'Preference saved.', 'info')
                    }}
                    label="Promotional notifications"
                  />
                </div>
                <div className="switch-row">
                  <div>
                    <div className="t">Login alerts</div>
                    <div className="d">Get notified about new device sign-ins.</div>
                  </div>
                  <Switch
                    on={state.notifications.loginAlerts}
                    onChange={(v) => updateNotifications({ loginAlerts: v })}
                    label="Login alert notifications"
                  />
                </div>
              </div>

              <div style={{ marginTop: 16 }}>
                <InfoBox>
                  Transactional emails (receipts and security) are always sent regardless of these
                  settings.
                </InfoBox>
              </div>
            </div>
          ) : null}

          {tab === 'Danger zone' ? (
            <>
              <div className="card card-pad">
                <div className="card-title" style={{ marginBottom: 4 }}>
                  Session
                </div>
                <div className="tiny faint" style={{ marginBottom: 14 }}>
                  {live ? 'Sign out of UGrowSMM on this device.' : 'Sign out of this demo on this device. Your sample data stays saved.'}
                </div>
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => {
                    signOut()
                    toast('Signed out', live ? 'You have been signed out on this device.' : 'Your demo session was closed securely.', 'info')
                  }}
                >
                  <LogOut /> Log out of UGrowSMM
                </button>
              </div>

              <div className="card card-pad" style={{ marginTop: 14 }}>
                <div className="card-title" style={{ marginBottom: 4 }}>
                  Your data
                </div>
                <div className="tiny faint" style={{ marginBottom: 14 }}>
                  Download a full JSON copy of your profile, orders and wallet history.
                </div>
                <button type="button" className="btn btn-ghost" onClick={exportData}>
                  <Download /> Export my data
                </button>
              </div>

              <div className="card card-pad danger-zone" style={{ marginTop: 14 }}>
                <div className="row" style={{ gap: 10, marginBottom: 8 }}>
                  <AlertTriangle size={16} style={{ color: '#be123c' }} />
                  <div className="card-title">Delete account</div>
                </div>
                <p className="small" style={{ color: '#475467', lineHeight: 1.6 }}>
                  {live
                    ? 'Permanently delete your account, order history, API key and wallet. You can delete only when no order is running and no payout is being processed. This cannot be undone.'
                    : 'Permanently remove this account, its order history, API key and wallet balance. This action cannot be undone.'}
                </p>
                <div className="dashed-divider" />
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={() => {
                    setDeleteText('')
                    setDeleteOpen(true)
                  }}
                >
                  <Trash2 /> Delete my account
                </button>
              </div>
            </>
          ) : null}
        </div>
      </div>

      <Modal open={deleteOpen} onClose={() => setDeleteOpen(false)} labelledBy="delete-title">
        <ModalHead
          id="delete-title"
          title={live ? 'Delete your account?' : 'Delete this demo account?'}
          subtitle={live ? 'This permanently removes your profile, orders, wallet history and API key.' : 'This wipes your profile, orders, wallet history and API key from this browser.'}
          onClose={() => setDeleteOpen(false)}
        />
        <div className="modal-icon danger">
          <Trash2 />
        </div>
        {live && state.balance + state.referral.earned - state.referral.withdrawn > 0 ? (
          <InfoBox warn>
            You still have {formatINR(state.balance)} in your wallet and {formatINR(Math.max(0, state.referral.earned - state.referral.withdrawn))} in referral earnings. These will be lost when the account is deleted. Withdraw or use them first if you want them.
          </InfoBox>
        ) : null}
        <p className="small muted" style={{ lineHeight: 1.6 }}>
          Type <b style={{ color: '#be123c' }}>DELETE</b> below to confirm. You’ll be returned to
          the sign-in screen.
        </p>
        <div className="field" style={{ marginTop: 14 }}>
          <input
            className="input"
            value={deleteText}
            onChange={(e) => setDeleteText(e.target.value)}
            placeholder="DELETE"
            aria-label="Type DELETE to confirm"
            autoFocus
          />
        </div>
        <div className="modal-actions">
          <button type="button" className="btn btn-ghost" onClick={() => setDeleteOpen(false)}>
            Keep account
          </button>
          <button
            type="button"
            className="btn btn-danger"
            disabled={deleting || deleteText.trim() !== 'DELETE'}
            onClick={async () => {
              if (live) {
                setDeleting(true)
                const { error } = await rpc('delete_my_account')
                setDeleting(false)
                if (error) {
                  return toast(
                    'Could not delete account',
                    error === 'running_orders'
                      ? 'You have an order that is still running. You can delete the account once it is completed.'
                      : error === 'pending_payout'
                        ? 'A payout request is being processed. You can delete the account once it is paid or rejected.'
                        : error === 'admin_account'
                          ? 'Admin accounts cannot be deleted here.'
                          : 'Please try again in a minute, or raise a ticket from Support.',
                    'error',
                  )
                }
                setDeleteOpen(false)
                signOut()
                toast('Account deleted', 'Your account and data were removed.', 'info')
                return
              }
              setDeleteOpen(false)
              deleteAccount()
              toast('Account deleted', 'Your demo data was cleared. Sign in to start fresh.', 'info')
            }}
          >
            <Trash2 /> {deleting ? 'Deleting…' : 'Delete forever'}
          </button>
        </div>
      </Modal>
    </div>
  )
}
