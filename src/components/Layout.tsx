import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  ArrowRight,
  Bell,
  Crown,
  Gift,
  History,
  ShieldCheck,
  LifeBuoy,
  ChevronRight,
  KeyRound,
  LayoutDashboard,
  ListOrdered,
  LogOut,
  Menu,
  Plus,
  Search,
  Settings,
  ShoppingBag,
  Sparkles,
  Wallet,
  X,
  Zap,
} from 'lucide-react'
import { isProState, useStore } from '../lib/store'
import { ProAvatar, ProTag } from './ProBits'
import { formatINR, timeAgo } from '../lib/data'
import { LogoGlyph, Wordmark } from './Logo'
import SiteFooter from './SiteFooter'
import BonusClaim from './BonusClaim'
import { canAccessAdmin } from '../lib/admins'

const PRIMARY_NAV = [
  { to: '/', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/new-order', label: 'New order', icon: ShoppingBag },
  { to: '/orders', label: 'Orders', icon: ListOrdered },
  { to: '/services', label: 'Services', icon: Zap },
]

const SECONDARY_NAV = [
  { to: '/add-funds', label: 'Add funds', icon: Wallet },
  { to: '/referral', label: 'Refer & earn', icon: Gift },
  { to: '/api', label: 'API & keys', icon: KeyRound },
  { to: '/support', label: 'Support', icon: LifeBuoy },
  { to: '/settings', label: 'Settings', icon: Settings },
]

const PAGE_META: Record<string, { title: string; crumb: string }> = {
  '/referral': { title: 'Refer & earn', crumb: 'Referral' },
  '/pro': { title: 'Pro membership', crumb: 'Pro' },
  '/billing': { title: 'Payments & withdrawals', crumb: 'Billing' },
  '/support': { title: 'Support', crumb: 'Support' },
  '/': { title: 'Overview', crumb: 'Overview' },
  '/new-order': { title: 'New order', crumb: 'New order' },
  '/orders': { title: 'Order history', crumb: 'Orders' },
  '/services': { title: 'Services', crumb: 'Services' },
  '/add-funds': { title: 'Add funds', crumb: 'Wallet' },
  '/api': { title: 'API & keys', crumb: 'Developer' },
  '/settings': { title: 'Account settings', crumb: 'Settings' },
}

const initials = (name: string) =>
  name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const { state } = useStore()
  const activeOrders = state.orders.filter(
    (o) => o.status === 'In progress' || o.status === 'Pending',
  ).length

  return (
    <nav aria-label="Main navigation" style={{ display: 'grid', gap: 18 }}>
      <div className="nav-group">
        <div className="nav-label">Workspace</div>
        {PRIMARY_NAV.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={onNavigate}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <Icon />
            <span>{label}</span>
            {to === '/new-order' ? <span className="nav-badge hot">HOT</span> : null}
            {to === '/orders' && activeOrders > 0 ? (
              <span className="nav-badge">{activeOrders}</span>
            ) : null}
          </NavLink>
        ))}
      </div>

      <div className="nav-group">
        <div className="nav-label">Billing</div>
        <NavLink
          to="/pro"
          onClick={onNavigate}
          className={({ isActive }) => `nav-item nav-pro ${isActive ? 'active' : ''}`}
        >
          <Crown fill="currentColor" />
          <span>{isProState(state) ? 'Pro membership' : 'Become Pro'}</span>
          {isProState(state) ? null : <span className="nav-badge pro">30%</span>}
        </NavLink>
        {SECONDARY_NAV.slice(0, 2).map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            onClick={onNavigate}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <Icon />
            <span>{label}</span>
          </NavLink>
        ))}
        <NavLink
          to="/billing"
          onClick={onNavigate}
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
        >
          <History />
          <span>Payments &amp; withdrawals</span>
        </NavLink>
      </div>

      <div className="nav-group">
        <div className="nav-label">Account</div>
        {SECONDARY_NAV.slice(2).map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            onClick={onNavigate}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <Icon />
            <span>{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  )
}

function SidebarFooter({ onNavigate }: { onNavigate?: () => void }) {
  const { state, signOut, toast } = useStore()
  const navigate = useNavigate()

  return (
    <div className="sidebar-foot">
      <div className="sidebar-balance">
        <div className="label">
          <Sparkles size={11} /> Available balance
        </div>
        <div className="value mono">{formatINR(state.balance)}</div>
        <Link
          to="/add-funds"
          onClick={onNavigate}
          className="btn btn-lime btn-sm btn-block"
          style={{ height: 34 }}
        >
          <Plus /> Add funds
        </Link>
      </div>

      <div className="row" style={{ gap: 4 }}>
        <Link
          to="/settings"
          onClick={onNavigate}
          className="sidebar-user"
          style={{ flex: 1 }}
        >
          <ProAvatar pro={isProState(state)}><span className="avatar">{initials(state.profile.name)}</span></ProAvatar>
          <span className="grow">
            <span className="name" style={{ display: 'block' }}>
              {state.profile.name}
              {isProState(state) ? <Crown size={12} fill="currentColor" className="pro-name-crown" aria-label="Pro member" /> : null}
            </span>
            <span className="mail" style={{ display: 'block' }}>
              {state.profile.email}
            </span>
          </span>
        </Link>
        <button
          type="button"
          className="icon-btn"
          aria-label="Log out"
          title="Log out"
          onClick={() => {
            signOut()
            toast('Signed out', 'Your demo session was closed securely.', 'info')
            navigate('/login', { replace: true })
          }}
          style={{ width: 34, height: 34, flexShrink: 0 }}
        >
          <LogOut size={15} />
        </button>
      </div>
    </div>
  )
}

function Topbar({ onMenu }: { onMenu: () => void }) {
  const { state, signOut, toast } = useStore()
  const notifications = [
    ...state.orders.slice(0, 3).map((o) => ({
      id: 'o' + o.id,
      title: `Order #${o.id} · ${o.status}${o.status === 'In progress' ? ` (${o.progress}%)` : ''}`,
      time: timeAgo(o.createdAt),
      tone: 'cyan',
      icon: 'order',
    })),
    ...state.transactions
      .filter((t) => t.type === 'deposit')
      .slice(0, 2)
      .map((t) => ({ id: 't' + t.id + t.createdAt, title: `${formatINR(t.amount)} wallet top-up successful`, time: timeAgo(t.createdAt), tone: 'green', icon: 'wallet' })),
  ].slice(0, 4)
  const location = useLocation()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const popRef = useRef<HTMLDivElement>(null)
  const meta = PAGE_META[location.pathname] ?? { title: 'Overview', crumb: 'Overview' }

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (popRef.current && !popRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
        setNotifOpen(false)
      }
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])

  useEffect(() => {
    setMenuOpen(false)
    setNotifOpen(false)
  }, [location.pathname])

  useEffect(() => {
    document.title = `${meta.title} — UGrowSMM`
  }, [meta.title])

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault()
    navigate(query.trim() ? `/services?q=${encodeURIComponent(query.trim())}` : '/services')
  }

  return (
    <header className="topbar">
      <button className="icon-btn mobile-only" aria-label="Open menu" onClick={onMenu} type="button">
        <Menu size={17} />
      </button>

      <Link to="/" className="topbar-brand">
        <span className="brand-mark">
          <LogoGlyph size={18} />
        </span>
        <Wordmark />
      </Link>

      <div className="grow topbar-copy" style={{ minWidth: 0 }}>
        <div className="crumb">
          <span className="hide-mobile">UGrowSMM</span>
          <ChevronRight size={11} className="hide-mobile" />
          <strong>{meta.crumb}</strong>
        </div>
        <div className="topbar-title hide-mobile">{meta.title}</div>
      </div>

      <div className="topbar-actions">
        <form className="searchbox" onSubmit={submitSearch} role="search">
          <Search size={15} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search services…"
            aria-label="Search services"
          />
          <kbd>↵</kbd>
        </form>

        <Link to="/add-funds" className="pill hide-mobile" style={{ height: 30, padding: '0 10px', gap: 6 }}>
          <Wallet size={12} style={{ color: '#0ea5e9' }} />
          <b style={{ color: '#101828' }}>{formatINR(state.balance)}</b>
        </Link>

        {isProState(state) ? <ProTag compact={false} /> : null}

        <div style={{ position: 'relative' }} ref={popRef}>
          <div className="row" style={{ gap: 8 }}>
            <button
              type="button"
              className="icon-btn"
              aria-label="Notifications"
              onClick={() => {
                setNotifOpen((v) => !v)
                setMenuOpen(false)
              }}
            >
              <Bell size={17} />
              <span className="dot" />
            </button>
            <button
              type="button"
              onClick={() => {
                setMenuOpen((v) => !v)
                setNotifOpen(false)
              }}
              aria-label={`Account menu — ${initials(state.profile.name)}`}
              style={{ background: 'none', border: 0, padding: 0, cursor: 'pointer' }}
            >
              <ProAvatar pro={isProState(state)}>
                <span className="avatar" aria-hidden="true">
                  {initials(state.profile.name)}
                </span>
              </ProAvatar>
            </button>
          </div>

          {notifOpen ? (
            <div className="popover" role="menu" aria-label="Notifications">
              <div className="between" style={{ padding: '10px 12px 8px' }}>
                <b style={{ fontSize: 12.5 }}>Notifications</b>
                {notifications.length ? <span className="pill lime">{notifications.length} recent</span> : null}
              </div>
              {notifications.length === 0 ? <div className="notif-row"><div className="grow"><div className="d">No notifications yet. Order updates and top-ups show up here.</div></div></div> : null}
              {notifications.map((n) => (
                <div key={n.id} className="notif-row">
                  <span className={`qa-icon ${n.tone}`} style={{ width: 30, height: 30 }}>
                    {n.icon === 'wallet' ? (
                      <Wallet size={13} />
                    ) : n.icon === 'order' ? (
                      <ShoppingBag size={13} />
                    ) : (
                      <Sparkles size={13} />
                    )}
                  </span>
                  <div className="grow">
                    <div className="t">{n.title}</div>
                    <div className="d">{n.time}</div>
                  </div>
                </div>
              ))}
              <button
                type="button"
                className="popover-foot"
                onClick={() => {
                  setNotifOpen(false)
                  navigate('/orders')
                }}
              >
                View all activity <ArrowRight size={12} />
              </button>
            </div>
          ) : null}

          {menuOpen ? (
            <div className="popover" role="menu" aria-label="Account" style={{ width: 224 }}>
              <div style={{ padding: '11px 12px' }}>
                <div style={{ fontSize: 12.5, fontWeight: 700 }}>{state.profile.name}</div>
                <div style={{ fontSize: 10.5, color: '#5b6472' }}>{state.profile.email}</div>
              </div>
              <hr className="divider" />
              <Link to="/settings" className="popover-item" role="menuitem">
                <Settings size={14} /> Account settings
              </Link>
              <Link to="/api" className="popover-item" role="menuitem">
                <KeyRound size={14} /> API key
              </Link>
              <Link to="/add-funds" className="popover-item" role="menuitem">
                <Wallet size={14} /> Add funds
              </Link>
              <Link to="/billing" className="popover-item" role="menuitem">
                <History size={14} /> Payments &amp; withdrawals
              </Link>
              <Link to="/pro" className="popover-item pro-item" role="menuitem">
                <Crown size={14} fill="currentColor" /> {isProState(state) ? 'Pro membership' : 'Become a Pro member'}
              </Link>
              {canAccessAdmin(state.profile.email) ? (
                <Link to="/admin" className="popover-item" role="menuitem">
                  <ShieldCheck size={14} /> Admin panel
                </Link>
              ) : null}
              <hr className="divider" />
              <button
                type="button"
                className="popover-item danger"
                role="menuitem"
                onClick={() => {
                  signOut()
                  toast('Signed out', 'Your demo session was closed securely.', 'info')
                  navigate('/login', { replace: true })
                }}
              >
                <LogOut size={14} /> Log out
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  )
}

function BottomNav() {
  const { state } = useStore()
  const activeOrders = state.orders.filter(
    (o) => o.status === 'In progress' || o.status === 'Pending',
  ).length

  return (
    <nav className="bottom-nav" aria-label="Quick navigation">
      <div className="bottom-nav-inner">
        <NavLink to="/" end className={({ isActive }) => `bn-item ${isActive ? 'active' : ''}`}>
          <LayoutDashboard />
          <span>Home</span>
        </NavLink>
        <NavLink to="/orders" className={({ isActive }) => `bn-item ${isActive ? 'active' : ''}`}>
          <span style={{ position: 'relative', display: 'inline-flex' }}>
            <ListOrdered />
            {activeOrders > 0 ? (
              <i
                style={{
                  position: 'absolute',
                  top: -3,
                  right: -5,
                  width: 13,
                  height: 13,
                  borderRadius: 99,
                  background: '#0ea5e9',
                  color: '#ffffff',
                  fontSize: 8,
                  fontWeight: 800,
                  display: 'grid',
                  placeItems: 'center',
                  fontStyle: 'normal',
                }}
              >
                {activeOrders}
              </i>
            ) : null}
          </span>
          <span>Orders</span>
        </NavLink>
        <NavLink
          to="/new-order"
          className={({ isActive }) => `bn-fab ${isActive ? 'active' : ''}`}
          aria-label="Create new order"
        >
          <span className="fab">
            <Plus />
          </span>
          <span>Order</span>
        </NavLink>
        <NavLink to="/add-funds" className={({ isActive }) => `bn-item ${isActive ? 'active' : ''}`}>
          <Wallet />
          <span>Wallet</span>
        </NavLink>
        <NavLink to="/referral" className={({ isActive }) => `bn-item ${isActive ? 'active' : ''}`}>
          <Gift />
          <span>Referral</span>
        </NavLink>
      </div>
    </nav>
  )
}

function MobileDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const panelRef = useRef<HTMLDivElement>(null)
  const closeRef = useRef(onClose)
  closeRef.current = onClose

  useEffect(() => {
    if (!open) return
    const previouslyFocused = document.activeElement as HTMLElement | null
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeRef.current()
        return
      }
      if (e.key !== 'Tab') return

      const node = panelRef.current
      if (!node) return
      const focusables = Array.from(
        node.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'),
      ).filter((el) => el.offsetParent !== null)
      if (focusables.length === 0) return

      const first = focusables[0]
      const last = focusables[focusables.length - 1]
      const activeEl = document.activeElement
      if (e.shiftKey && (activeEl === first || activeEl === node)) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && (activeEl === last || activeEl === node)) {
        e.preventDefault()
        first.focus()
      }
    }

    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', onKey)
    const raf = requestAnimationFrame(() => {
      panelRef.current?.querySelector<HTMLElement>('[aria-label="Close menu"]')?.focus()
    })

    return () => {
      cancelAnimationFrame(raf)
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
      if (previouslyFocused?.isConnected) previouslyFocused.focus({ preventScroll: true })
    }
  }, [open])

  if (!open) return null

  return (
    <>
      <div className="drawer-backdrop" onClick={onClose} role="presentation" />
      <div
        ref={panelRef}
        className="drawer"
        data-lenis-prevent
        role="dialog"
        aria-modal="true"
        aria-label="Menu"
        tabIndex={-1}
      >
        <div className="between">
          <Link to="/" className="brand" onClick={onClose}>
            <span className="brand-mark">
              <LogoGlyph size={23} />
            </span>
            <span>
              <Wordmark />
              <span className="brand-sub">SMM Panel</span>
            </span>
          </Link>
          <button className="icon-btn" onClick={onClose} aria-label="Close menu" type="button">
            <X size={16} />
          </button>
        </div>
        <SidebarNav onNavigate={onClose} />
        <SidebarFooter onNavigate={onClose} />
      </div>
    </>
  )
}

export default function Layout() {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const { state } = useStore()
  const bonusReady = state.bonus === 'ready'

  return (
    <div className="app">
      <aside className="sidebar">
        <Link to="/" className="brand">
          <span className="brand-mark">
            <LogoGlyph size={23} />
          </span>
          <span>
            <Wordmark />
            <span className="brand-sub">SMM Panel</span>
          </span>
        </Link>

        <SidebarNav />
        <SidebarFooter />
      </aside>

      <div className="main">
        <Topbar onMenu={() => setDrawerOpen(true)} />
        <main className="app-main">
          {bonusReady ? <div style={{ padding: '14px clamp(14px,3vw,32px) 0' }}><BonusClaim /></div> : null}
          <Outlet />
        </main>
        <SiteFooter />
      </div>

      <MobileDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
      <BottomNav />
    </div>
  )
}
