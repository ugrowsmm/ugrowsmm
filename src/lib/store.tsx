import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import {
  SERVICES,
  priceOf,
  seedOrders,
  seedTransactions,
  type Order,
  type OrderStatus,
  type Transaction,
  BONUS_MIN_TOPUP,
  BONUS_SERVICE_ID,
  BONUS_VIEWS,
} from './data'
import { apiReady, rpc } from './api'
import { supabase } from './supabase'
import { PRO_DISCOUNT_PERCENT, PRO_PRICE_MONTH, PRO_PRICE_YEAR, PRO_REFERRAL_PERCENT, REFERRAL_PERCENT_DEFAULT } from './config'

export { REFERRAL_PERCENT_DEFAULT, PRO_REFERRAL_PERCENT, PRO_DISCOUNT_PERCENT }

export type ProPlan = 'monthly' | 'yearly'
export const PRO_PLANS: Record<ProPlan, { price: number; days: number; label: string }> = {
  monthly: { price: PRO_PRICE_MONTH, days: 30, label: 'Monthly' },
  yearly: { price: PRO_PRICE_YEAR, days: 365, label: 'Yearly' },
}

/** Pro is active while its end date is in the future. */
export const isProState = (s: { pro: { until: string } }) => !!s.pro.until && new Date(s.pro.until).getTime() > Date.now()
/** Price a Pro member pays: normal rate minus the Pro discount. */
export const proRate = (rate: number, pro: boolean) => (pro ? Math.round(rate * (1 - PRO_DISCOUNT_PERCENT / 100) * 100) / 100 : rate)
/** Referral funds the user can still use (withdraw or spend on orders). */
export const referralAvailable = (r: { earned: number; withdrawn: number; spent: number }) =>
  Math.max(0, Math.round((r.earned - r.withdrawn - r.spent) * 100) / 100)
/** Cashback % for this user's code: an admin-set value wins, otherwise Pro earns the Pro rate. */
export const referralPercentOf = (s: { codePercents: Record<string, number>; referral: { code: string }; pro: { until: string } }) =>
  s.codePercents[s.referral.code] ?? (isProState(s) ? PRO_REFERRAL_PERCENT : REFERRAL_PERCENT_DEFAULT)

export interface Profile {
  name: string
  email: string
  username: string
  phone: string
  country: string
  joined: string
}

export interface NotificationPrefs {
  orderUpdates: boolean
  emailAlerts: boolean
  promotions: boolean
  loginAlerts: boolean
}

export interface Withdrawal {
  id: string
  amount: number
  method: string
  details: string
  status: string
  createdAt: string
}

export type TicketStatus = 'Open' | 'Resolved'

export interface Ticket {
  id: string
  type: string
  orderId: string
  subject: string
  message: string
  status: TicketStatus
  createdAt: string
  resolvedAt?: string
}

export interface AccountProfile { email: string; name: string; code: string; refBy: string }

export interface AppState {
  real: boolean
  pro: { until: string; plan: string }
  tickets: Ticket[]
  refBy: string
  bonus: 'none' | 'ready' | 'claimed'
  unpaid: number
  referral: { code: string; earned: number; withdrawn: number; spent: number }
  withdrawals: Withdrawal[]
  codePercents: Record<string, number>
  logins: { email: string; at: string }[]
  signedIn: boolean
  profile: Profile
  balance: number
  orders: Order[]
  transactions: Transaction[]
  apiKey: string
  apiEnabled: boolean
  notifications: NotificationPrefs
}

type ToastKind = 'success' | 'error' | 'info'

export interface ToastItem {
  id: number
  title: string
  body?: string
  kind: ToastKind
}

interface PlaceOrderInput {
  serviceId: string
  link: string
  quantity: number
  dripfeed: boolean
  /** comments / list services (and custom-comment packages): one entry per line. */
  comments?: string
  /** poll services: the answer number to vote for. */
  answer?: number
  /** note services: message or instructions. */
  note?: string
  /** auto services: quantity range per post, number of posts and delay in minutes. */
  auto?: { min: number; max: number; posts: number; delay: number }
  /** which balance pays for the order (default: wallet). */
  payWith?: 'wallet' | 'referral'
}

interface PlaceOrderResult {
  ok: boolean
  error?: string
  order?: Order
}

interface StoreValue {
  state: AppState
  toasts: ToastItem[]
  toast: (title: string, body?: string, kind?: ToastKind) => void
  dismissToast: (id: number) => void
  signIn: (email: string) => void
  signInAccount: (p: AccountProfile) => void
  signOut: () => void
  requestWithdraw: (amount: number, method: string, details: string) => Promise<{ ok: boolean; error?: string }>
  claimBonus: (link: string) => Promise<{ ok: boolean; error?: string }>
  refreshAccount: () => Promise<void>
  adminCredit: (kind: 'paid' | 'unpaid', amount: number) => void
  adminDemoOrders: (count: number) => void
  adminReferralEarning: (amount: number) => void
  adminDebit: (kind: 'paid' | 'unpaid', amount: number) => void
  setCashback: (code: string, percent: number | null) => void
  addTicket: (ticket: Ticket) => void
  syncTickets: (rows: Ticket[]) => void
  adminSetTicketStatus: (id: string, status: TicketStatus) => void
  buyPro: (plan: ProPlan) => Promise<{ ok: boolean; error?: string }>
  adminSetPro: (days: number) => void
  adminSetOrderStatus: (id: string, status: OrderStatus, refund: boolean) => void
  adminSetWithdrawalStatus: (id: string, status: string) => void
  placeOrder: (input: PlaceOrderInput) => Promise<PlaceOrderResult>
  addFunds: (amount: number, method: string) => void
  regenerateKey: () => string
  updateProfile: (patch: Partial<Profile>) => void
  updateNotifications: (patch: Partial<NotificationPrefs>) => void
  toggleApi: () => void
  deleteAccount: () => void
  justDeleted: boolean
  clearJustDeleted: () => void
}

const STORAGE_KEY = 'ugrowsmm.demo.v1'
const LEGACY_STORAGE_KEY = 'ugrowssm.demo.v1'

const makeKey = () =>
  'nxr_live_' +
  Array.from({ length: 32 }, () =>
    'abcdefghijklmnopqrstuvwxyz0123456789'.charAt(Math.floor(Math.random() * 36)),
  ).join('')

const initialState = (): AppState => ({
  real: false,
  signedIn: false,
  pro: { until: '', plan: '' },
  refBy: '',
  bonus: 'none',
  unpaid: 0,
  referral: { code: 'UGAARAV', earned: 0, withdrawn: 0, spent: 0 },
  withdrawals: [],
  tickets: [],
  codePercents: {},
  logins: [],
  profile: {
    name: 'Aarav Mehta',
    email: 'aarav@ugrowsmm.com',
    username: 'aarav.mehta',
    phone: '+91 98765 43210',
    country: 'India',
    joined: '2026-02-14',
  },
  balance: 2480.5,
  orders: seedOrders(),
  transactions: seedTransactions(),
  apiKey: 'nxr_live_7f3k9q2m8x4v1b6n0c5z3l9p2w8r',
  apiEnabled: true,
  notifications: {
    orderUpdates: true,
    emailAlerts: true,
    promotions: false,
    loginAlerts: true,
  },
})

const loadState = (): AppState => {
  try {
    let raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      // migrate data saved before the UGrowSMM rename
      const legacy = localStorage.getItem(LEGACY_STORAGE_KEY)
      if (legacy) {
        raw = legacy.replace(/aarav@ugrowssm\.com/g, 'aarav@ugrowsmm.com')
        localStorage.setItem(STORAGE_KEY, raw)
        localStorage.removeItem(LEGACY_STORAGE_KEY)
      }
    }
    if (!raw) return initialState()
    const parsed = JSON.parse(raw) as Partial<AppState>
    const base = initialState()
    return {
      ...base,
      ...parsed,
      profile: { ...base.profile, ...parsed.profile },
      notifications: { ...base.notifications, ...parsed.notifications },
      pro: { ...base.pro, ...parsed.pro },
      referral: { ...base.referral, ...parsed.referral },
      withdrawals: Array.isArray(parsed.withdrawals) ? parsed.withdrawals : [],
      tickets: Array.isArray(parsed.tickets) ? parsed.tickets : [],
      logins: Array.isArray(parsed.logins) ? parsed.logins : [],
      codePercents: { ...parsed.codePercents },
      orders: Array.isArray(parsed.orders) ? parsed.orders : base.orders,
      transactions: Array.isArray(parsed.transactions) ? parsed.transactions : base.transactions,
    }
  } catch {
    return initialState()
  }
}

const StoreContext = createContext<StoreValue | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(loadState)
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const [justDeleted, setJustDeleted] = useState(false)
  const toastId = useRef(0)
  const timers = useRef<number[]>([])
  const lastSnap = useRef('') // last account data from the server: if nothing changed, nothing re-renders

  // Saving the whole state is a synchronous JSON.stringify: do it once things settle (not on every tiny update),
  // and flush immediately when the tab is hidden or closed so nothing is lost.
  const saveRef = useRef<AppState>(state)
  saveRef.current = state
  useEffect(() => {
    const save = () => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(saveRef.current))
      } catch {
        /* demo runs fine without persistence */
      }
    }
    const t = window.setTimeout(save, 400)
    const flush = () => { window.clearTimeout(t); save() }
    const onHide = () => { if (document.visibilityState === 'hidden') flush() }
    document.addEventListener('visibilitychange', onHide)
    window.addEventListener('pagehide', flush)
    return () => {
      window.clearTimeout(t)
      document.removeEventListener('visibilitychange', onHide)
      window.removeEventListener('pagehide', flush)
    }
  }, [state])

  useEffect(
    () => () => {
      timers.current.forEach((t) => window.clearTimeout(t))
    },
    [],
  )

  const dismissToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const toast = useCallback(
    (title: string, body?: string, kind: ToastKind = 'success') => {
      toastId.current += 1
      const id = toastId.current
      setToasts((prev) => [...prev.slice(-2), { id, title, body, kind }])
      const timer = window.setTimeout(() => {
        timers.current = timers.current.filter((x) => x !== timer)
        setToasts((prev) => prev.filter((t) => t.id !== id))
      }, 4500)
      timers.current.push(timer)
    },
    [],
  )

  const signIn = useCallback((email: string) => {
    setState((prev) => ({
      ...prev,
      signedIn: true,
      refBy: prev.refBy || (() => { try { const r = localStorage.getItem('ug_ref') ?? ''; return r === prev.referral.code ? '' : r } catch { return '' } })(),
      logins: [{ email: email.trim() || prev.profile.email, at: new Date().toISOString() }, ...prev.logins].slice(0, 50),
      profile: {
        ...prev.profile,
        email: email.trim() || prev.profile.email,
      },
    }))
  }, [])

  /** Real account (email + password + OTP verified). Another account on the same browser always starts clean. */
  const signInAccount = useCallback((p: AccountProfile) => {
    lastSnap.current = ''
    setState((prev) => {
      const now = new Date().toISOString()
      if (prev.real && prev.profile.email === p.email) {
        return { ...prev, signedIn: true, refBy: p.refBy, referral: { ...prev.referral, code: p.code || prev.referral.code }, profile: { ...prev.profile, name: p.name || prev.profile.name }, logins: [{ email: p.email, at: now }, ...prev.logins].slice(0, 50) }
      }
      const rnd = Array.from(crypto.getRandomValues(new Uint8Array(16)), (x) => x.toString(16).padStart(2, '0')).join('')
      return {
        ...initialState(),
        real: true,
        signedIn: true,
        refBy: p.refBy,
        balance: 0,
        orders: [],
        transactions: [],
        referral: { code: p.code, earned: 0, withdrawn: 0, spent: 0 },
        profile: { name: p.name, email: p.email, username: p.email.split('@')[0], phone: '', country: 'India', joined: now.slice(0, 10) },
        apiKey: 'ug_live_' + rnd,
        logins: [{ email: p.email, at: now }],
      }
    })
  }, [])

  const signOut = useCallback(() => {
    lastSnap.current = ''
    if (apiReady()) void supabase.auth.signOut().catch(() => undefined)
    setState((prev) => ({ ...prev, signedIn: false }))
  }, [])

  // the session lives in Supabase: when it ends (expired, signed out elsewhere) the panel signs out too
  useEffect(() => {
    if (!apiReady()) return
    const expired = () => setState((prev) => (prev.signedIn && prev.real ? { ...prev, signedIn: false } : prev))
    window.addEventListener('ug-auth-expired', expired)
    const { data } = supabase.auth.onAuthStateChange((event) => { if (event === 'SIGNED_OUT') expired() })
    void supabase.auth.getSession().then(({ data: d }) => { if (!d.session) expired() })
    return () => { window.removeEventListener('ug-auth-expired', expired); data.subscription.unsubscribe() }
  }, [])

  const stateRef = useRef(state)
  stateRef.current = state

  /** Real accounts: the database is the only source of truth for money, orders, referral earnings and tickets. */
  const refreshAccount = useCallback(async () => {
    if (!apiReady() || !stateRef.current.real) return
    const { data: r, error } = await rpc<any>('get_account')
    if (error || !r || !Array.isArray(r.orders)) return
    // the same answer as last time (the normal case every 30 seconds): skip the update, so the page does no work at all
    const snap = JSON.stringify(r)
    if (snap === lastSnap.current) return
    lastSnap.current = snap
    setState((prev) =>
      prev.real
        ? {
            ...prev,
            profile: { ...prev.profile, name: r.profile?.name ?? prev.profile.name },
            balance: Number(r.balance),
            unpaid: Number(r.unpaid),
            referral: { code: r.profile?.code ?? prev.referral.code, earned: Number(r.referral.earned), withdrawn: Number(r.referral.withdrawn), spent: Number(r.referral.spent) || 0 },
            pro: { until: String(r.pro?.until ?? ''), plan: String(r.pro?.plan ?? '') },
            orders: r.orders,
            transactions: r.transactions,
            withdrawals: r.withdrawals,
            tickets: r.tickets,
            bonus: r.bonus,
            codePercents: { ...prev.codePercents, [r.profile?.code ?? prev.referral.code]: Number(r.percent) },
          }
        : prev,
    )
  }, [])

  useEffect(() => {
    if (!state.signedIn || !state.real) return
    void refreshAccount()
    // hidden tabs do not poll (saves database load); the visibilitychange handler below refreshes when the tab returns
    const t = window.setInterval(() => { if (document.visibilityState === 'visible') void refreshAccount() }, 30000)
    const onVis = () => { if (document.visibilityState === 'visible') void refreshAccount() }
    document.addEventListener('visibilitychange', onVis)
    return () => { window.clearInterval(t); document.removeEventListener('visibilitychange', onVis) }
  }, [state.signedIn, state.real, refreshAccount])

  const placeOrder = useCallback(
    async ({ serviceId, link, quantity, dripfeed, comments, answer, auto, payWith = 'wallet' }: PlaceOrderInput): Promise<PlaceOrderResult> => {
      const service = SERVICES.find((s) => s.id === serviceId)
      if (!service) return { ok: false, error: 'Please choose a service to continue.' }
      if (!link.trim()) return { ok: false, error: service.mode === 'auto' ? 'Add the username or profile link to boost.' : 'Add the target link for this order.' }
      if (service.mode !== 'auto' && !/^[a-z0-9-]+(\.[a-z0-9-]+)+/i.test(link.trim().replace(/^https?:\/\//, '')))
        return { ok: false, error: 'That link doesn’t look right. Check the URL and try again.' }

      const lines = (comments ?? '').split('\n').map((l) => l.trim()).filter(Boolean)
      if (service.mode === 'package') {
        // one flat price, no quantity; some packages also need the buyer's own comment lines
        if (service.lines !== undefined && lines.length !== service.lines)
          return { ok: false, error: `This package needs exactly ${service.lines} comment${service.lines === 1 ? '' : 's'}, one per line.` }
        quantity = 1
      } else if (service.mode === 'comments' || service.mode === 'list') {
        if (lines.length === 0) return { ok: false, error: service.mode === 'list' ? 'Paste your list, one entry per line.' : 'Add your comments, one comment per line.' }
        quantity = lines.length
      } else if (service.mode === 'poll') {
        if (!Number.isInteger(answer) || (answer ?? 0) < 1) return { ok: false, error: 'Enter the poll answer number you want votes for.' }
      } else if (service.mode === 'auto') {
        if (!auto || !(auto.posts >= 1)) return { ok: false, error: 'Choose how many new posts to boost.' }
        if (auto.min < service.min || auto.max > service.max || auto.min > auto.max)
          return { ok: false, error: `Quantity per post must be between ${service.min.toLocaleString('en-IN')} and ${service.max.toLocaleString('en-IN')}.` }
        quantity = auto.max * auto.posts // the most this subscription can use; charged up front
      }

      if (service.mode !== 'package') {
        if (!Number.isFinite(quantity) || (service.mode !== 'auto' && quantity < service.min))
          return { ok: false, error: `Minimum quantity for this service is ${service.min.toLocaleString('en-IN')}.` }
        if (service.mode !== 'auto' && quantity > service.max)
          return { ok: false, error: `Maximum quantity for this service is ${service.max.toLocaleString('en-IN')}.` }
      }

      // Pro members pay the Pro rate on their own orders
      const charge = priceOf({ mode: service.mode, rate: proRate(service.rate, isProState(state)) }, quantity)

      if (state.real && apiReady()) {
        // Services and provider ordering are switched on in the next step
        return { ok: false, error: 'Ordering opens very soon. Your balance is safe, please check back shortly.' }
      }

      const fromReferral = payWith === 'referral'
      const mock = !fromReferral && state.unpaid >= charge
      if (fromReferral && charge > referralAvailable(state.referral))
        return { ok: false, error: 'Not enough referral funds for this order. Pay from your wallet or add funds.' }
      if (!fromReferral && !mock && charge > state.balance)
        return { ok: false, error: 'Insufficient balance. Add funds to place this order.' }

      const id = 'NX-' + Math.floor(88300 + Math.random() * 600)
      const order: Order = {
        id,
        serviceId: service.id,
        serviceName: mock ? `${service.name} (Demo)` : service.name,
        platform: service.platform,
        link: link.trim().replace(/^https?:\/\//, '').replace(/\/$/, ''),
        quantity,
        charge,
        startCount: Math.floor(Math.random() * 15000),
        status: 'In progress',
        progress: 2,
        createdAt: new Date().toISOString(),
        dripfeed,
        mock,
      }

      setState((prev) => ({
        ...prev,
        balance: mock || fromReferral ? prev.balance : Math.round((prev.balance - charge) * 100) / 100,
        unpaid: mock ? Math.round((prev.unpaid - charge) * 100) / 100 : prev.unpaid,
        referral: fromReferral ? { ...prev.referral, spent: Math.round((prev.referral.spent + charge) * 100) / 100 } : prev.referral,
        orders: [order, ...prev.orders],
        transactions: [
          {
            id: 'TX-' + Math.floor(5600 + Math.random() * 300),
            type: 'order',
            label: (service.mode === 'package' ? service.name : `${service.name} · ${quantity.toLocaleString('en-IN')}`) + (fromReferral ? ' · Referral funds' : ''),
            amount: charge,
            createdAt: new Date().toISOString(),
          },
          ...prev.transactions,
        ],
      }))

      // Real orders go to the provider through Apps Script; unpaid-credit (demo) orders never do.

      return { ok: true, order }
    },
    [state.balance, state.unpaid, state.referral, state.pro, state.profile.email, state.real, refreshAccount],
  )

  const addFunds = useCallback((amount: number, method: string) => {
    setState((prev) => ({
      ...prev,
      balance: Math.round((prev.balance + amount) * 100) / 100,
      bonus: prev.bonus === 'none' && prev.refBy && amount >= BONUS_MIN_TOPUP ? 'ready' : prev.bonus,
      transactions: [
        {
          id: 'TX-' + Math.floor(5600 + Math.random() * 300),
          type: 'deposit',
          label: 'Wallet top-up',
          amount,
          createdAt: new Date().toISOString(),
          method,
        },
        ...prev.transactions,
      ],
    }))
  }, [])

  const requestWithdraw = useCallback(
    async (amount: number, method: string, details: string) => {
      const avail = referralAvailable(state.referral)
      if (!(amount >= 100)) return { ok: false, error: 'Minimum withdrawal is ₹100.' }
      if (amount > avail) return { ok: false, error: 'Amount is more than your available referral funds.' }
      if (state.real && apiReady()) {
        const { error } = await rpc('request_withdrawal', { p_amount: amount, p_method: method, p_details: details })
        if (error) return { ok: false, error: error === 'exceeds_available' ? 'Amount is more than your available referral funds.' : error === 'min_amount' ? 'Minimum withdrawal is ₹100.' : 'Could not send the request. Please try again.' }
        await refreshAccount()
        return { ok: true }
      }
      const w: Withdrawal = { id: 'WD-' + Math.floor(1000 + Math.random() * 8999), amount, method, details, status: 'Processing', createdAt: new Date().toISOString() }
      setState((prev) => ({ ...prev, referral: { ...prev.referral, withdrawn: prev.referral.withdrawn + amount }, withdrawals: [w, ...prev.withdrawals] }))
      return { ok: true }
    },
    [state.referral, state.profile.email, state.real, refreshAccount],
  )

  const claimBonus = useCallback(
    async (link: string) => {
      if (state.bonus !== 'ready') return { ok: false, error: 'No bonus available.' }
      if (!/instagram\.com\//i.test(link)) return { ok: false, error: 'Paste a valid Instagram link.' }
      if (state.real && apiReady()) {
        return { ok: false, error: 'Bonus claiming opens very soon. Your bonus is saved, please check back shortly.' }
      }
      const order: Order = {
        id: 'BONUS-' + Math.floor(1000 + Math.random() * 8999),
        serviceId: BONUS_SERVICE_ID,
        serviceName: `Instagram Views ${BONUS_VIEWS.toLocaleString('en-IN')} (Free bonus)`,
        platform: 'instagram',
        link,
        quantity: BONUS_VIEWS,
        charge: 0,
        startCount: 0,
        status: 'Pending',
        progress: 0,
        createdAt: new Date().toISOString(),
        bonus: true,
      }
      setState((prev) => ({ ...prev, bonus: 'claimed', orders: [order, ...prev.orders] }))
      return { ok: true }
    },
    [state.bonus, state.profile.email, state.real, refreshAccount],
  )

  /** Pro membership paid from the wallet. Real accounts: the database takes the money and sets the end date. */
  const buyPro = useCallback(
    async (plan: ProPlan) => {
      const p = PRO_PLANS[plan]
      if (state.real && apiReady()) {
        const { error } = await rpc('buy_pro', { p_plan: plan })
        if (error) return { ok: false, error: error === 'insufficient' ? 'Not enough wallet balance. Add funds and try again.' : 'Could not activate Pro. Please try again.' }
        await refreshAccount()
        return { ok: true }
      }
      if (state.balance < p.price) return { ok: false, error: 'Not enough wallet balance. Add funds and try again.' }
      setState((prev) => {
        const base = isProState(prev) ? new Date(prev.pro.until).getTime() : Date.now()
        return {
          ...prev,
          balance: Math.round((prev.balance - p.price) * 100) / 100,
          pro: { until: new Date(base + p.days * 864e5).toISOString(), plan },
          transactions: [{ id: 'TX-' + Math.floor(5600 + Math.random() * 300), type: 'order' as const, label: `Pro membership · ${p.label}`, amount: p.price, createdAt: new Date().toISOString() }, ...prev.transactions],
        }
      })
      return { ok: true }
    },
    [state.balance, state.real, refreshAccount],
  )

  /** Demo mode only (admin acts on the local account). days = 0 removes Pro. */
  const adminSetPro = useCallback((days: number) => {
    setState((prev) => ({
      ...prev,
      pro: days > 0 ? { until: new Date((isProState(prev) ? new Date(prev.pro.until).getTime() : Date.now()) + days * 864e5).toISOString(), plan: 'admin' } : { until: '', plan: '' },
    }))
  }, [])

  const adminCredit = useCallback((kind: 'paid' | 'unpaid', amount: number) => {
    setState((prev) => ({
      ...prev,
      balance: kind === 'paid' ? Math.round((prev.balance + amount) * 100) / 100 : prev.balance,
      unpaid: kind === 'unpaid' ? Math.round((prev.unpaid + amount) * 100) / 100 : prev.unpaid,
      transactions: [{ id: 'TX-' + Math.floor(5600 + Math.random() * 300), type: 'deposit', label: kind === 'paid' ? 'Credit added' : 'Promo credit', amount, createdAt: new Date().toISOString(), method: 'Admin' }, ...prev.transactions],
    }))
  }, [])

  const adminDebit = useCallback((kind: 'paid' | 'unpaid', amount: number) => {
    setState((prev) => ({
      ...prev,
      balance: kind === 'paid' ? Math.max(0, Math.round((prev.balance - amount) * 100) / 100) : prev.balance,
      unpaid: kind === 'unpaid' ? Math.max(0, Math.round((prev.unpaid - amount) * 100) / 100) : prev.unpaid,
      transactions: [{ id: 'TX-' + Math.floor(5600 + Math.random() * 300), type: 'adjustment', label: kind === 'paid' ? 'Wallet adjustment' : 'Promo credit removed', amount, createdAt: new Date().toISOString(), method: 'Admin' }, ...prev.transactions],
    }))
  }, [])

  const adminDemoOrders = useCallback((count: number) => {
    const picks = [...SERVICES].sort(() => Math.random() - 0.5).slice(0, count)
    const demo: Order[] = picks.map((svc) => {
      const quantity = Math.min(svc.max, Math.max(svc.min, svc.min * (1 + Math.floor(Math.random() * 9))))
      return {
        id: 'DEMO-' + Math.floor(1000 + Math.random() * 8999), serviceId: svc.id, serviceName: `${svc.name} (Demo)`, platform: svc.platform,
        link: 'instagram.com/your.page', quantity, charge: Math.round(((svc.rate * quantity) / 1000) * 100) / 100,
        startCount: Math.floor(Math.random() * 9000), status: Math.random() > 0.4 ? 'In progress' : 'Completed',
        progress: 20 + Math.floor(Math.random() * 75), createdAt: new Date(Date.now() - Math.random() * 6e7).toISOString(), mock: true,
      }
    })
    setState((prev) => ({ ...prev, orders: [...demo, ...prev.orders] }))
  }, [])

  const adminReferralEarning = useCallback((amount: number) => {
    setState((prev) => ({ ...prev, referral: { ...prev.referral, earned: prev.referral.earned + amount } }))
  }, [])

  /** percent = null puts the code back to the default (10%, or the Pro rate while Pro). */
  const setCashback = useCallback((code: string, percent: number | null) => {
    setState((prev) => {
      const next = { ...prev.codePercents }
      if (percent === null) delete next[code]
      else next[code] = percent
      return { ...prev, codePercents: next }
    })
  }, [])

  const addTicket = useCallback((ticket: Ticket) => {
    setState((prev) => ({ ...prev, tickets: [ticket, ...prev.tickets] }))
  }, [])

  /** Pulls the latest ticket statuses from the backend (admin resolves tickets there). */
  const syncTickets = useCallback((rows: Ticket[]) => {
    setState((prev) => {
      const byId = new Map(rows.map((r) => [r.id, r]))
      const merged = prev.tickets.map((t) => (byId.has(t.id) ? { ...t, status: byId.get(t.id)!.status, resolvedAt: byId.get(t.id)!.resolvedAt } : t))
      const known = new Set(prev.tickets.map((t) => t.id))
      const extra = rows.filter((r) => !known.has(r.id))
      return { ...prev, tickets: [...merged, ...extra].sort((a, b) => b.createdAt.localeCompare(a.createdAt)) }
    })
  }, [])

  const adminSetTicketStatus = useCallback((id: string, status: TicketStatus) => {
    setState((prev) => ({
      ...prev,
      tickets: prev.tickets.map((t) => (t.id === id ? { ...t, status, resolvedAt: status === 'Resolved' ? new Date().toISOString() : undefined } : t)),
    }))
  }, [])

  /** Manual override for orders whose automatic status is stuck. Canceled can refund the charge to the wallet. */
  const adminSetOrderStatus = useCallback((id: string, status: OrderStatus, refund: boolean) => {
    setState((prev) => {
      const order = prev.orders.find((o) => o.id === id)
      if (!order) return prev
      const doRefund = refund && status === 'Canceled' && order.status !== 'Canceled' && order.charge > 0 && !order.mock
      return {
        ...prev,
        balance: doRefund ? Math.round((prev.balance + order.charge) * 100) / 100 : prev.balance,
        transactions: doRefund
          ? [{ id: 'TX-' + Math.floor(5600 + Math.random() * 300), type: 'refund' as const, label: `Refund · ${order.serviceName} #${order.id}`, amount: order.charge, createdAt: new Date().toISOString() }, ...prev.transactions]
          : prev.transactions,
        orders: prev.orders.map((o) => (o.id === id ? { ...o, status, progress: status === 'Completed' ? 100 : status === 'Pending' ? 0 : o.progress } : o)),
      }
    })
  }, [])

  /** Payout review: Processing -> Paid or Rejected. A rejected payout returns the amount to referral earnings. */
  const adminSetWithdrawalStatus = useCallback((id: string, status: string) => {
    setState((prev) => {
      const w = prev.withdrawals.find((x) => x.id === id)
      if (!w) return prev
      const giveBack = status === 'Rejected' && w.status !== 'Rejected'
      const takeBack = status !== 'Rejected' && w.status === 'Rejected'
      const delta = giveBack ? -w.amount : takeBack ? w.amount : 0
      return {
        ...prev,
        referral: { ...prev.referral, withdrawn: Math.max(0, prev.referral.withdrawn + delta) },
        withdrawals: prev.withdrawals.map((x) => (x.id === id ? { ...x, status } : x)),
      }
    })
  }, [])

  const regenerateKey = useCallback(() => {
    const key = makeKey()
    setState((prev) => ({ ...prev, apiKey: key }))
    return key
  }, [])

  const updateProfile = useCallback((patch: Partial<Profile>) => {
    setState((prev) => ({ ...prev, profile: { ...prev.profile, ...patch } }))
  }, [])

  const updateNotifications = useCallback((patch: Partial<NotificationPrefs>) => {
    setState((prev) => ({ ...prev, notifications: { ...prev.notifications, ...patch } }))
  }, [])

  const toggleApi = useCallback(() => {
    setState((prev) => ({ ...prev, apiEnabled: !prev.apiEnabled }))
  }, [])

  const deleteAccount = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch {
      /* ignore */
    }
    const blank = initialState()
    setState({ ...blank, orders: [], transactions: [], balance: 0, signedIn: false })
    setJustDeleted(true)
  }, [])

  const clearJustDeleted = useCallback(() => setJustDeleted(false), [])

  const value = useMemo<StoreValue>(
    () => ({
      state,
      toasts,
      toast,
      dismissToast,
      signIn,
      signInAccount,
      signOut,
      requestWithdraw,
      claimBonus,
      refreshAccount,
      adminCredit,
      adminDemoOrders,
      adminReferralEarning,
      adminDebit,
      setCashback,
      addTicket,
      syncTickets,
      adminSetTicketStatus,
      buyPro,
      adminSetPro,
      adminSetOrderStatus,
      adminSetWithdrawalStatus,
      placeOrder,
      addFunds,
      regenerateKey,
      updateProfile,
      updateNotifications,
      toggleApi,
      deleteAccount,
      justDeleted,
      clearJustDeleted,
    }),
    [
      state,
      toasts,
      toast,
      dismissToast,
      signIn,
      signInAccount,
      signOut,
      requestWithdraw,
      claimBonus,
      refreshAccount,
      adminCredit,
      adminDemoOrders,
      adminReferralEarning,
      adminDebit,
      setCashback,
      addTicket,
      syncTickets,
      adminSetTicketStatus,
      buyPro,
      adminSetPro,
      adminSetOrderStatus,
      adminSetWithdrawalStatus,
      placeOrder,
      addFunds,
      regenerateKey,
      updateProfile,
      updateNotifications,
      toggleApi,
      deleteAccount,
      justDeleted,
      clearJustDeleted,
    ],
  )

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore() {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore must be used inside StoreProvider')
  return ctx
}
