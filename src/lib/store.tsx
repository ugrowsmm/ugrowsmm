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
  seedOrders,
  seedTransactions,
  type Order,
  type OrderStatus,
  type Transaction,
  MARKUP,
  BONUS_MIN_TOPUP,
  BONUS_SERVICE_ID,
  BONUS_VIEWS,
} from './data'
import { apiReady, callApi, TOKEN_KEY } from './api'
import { REFERRAL_PERCENT_DEFAULT } from './config'

export { REFERRAL_PERCENT_DEFAULT }

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
  tickets: Ticket[]
  refBy: string
  bonus: 'none' | 'ready' | 'claimed'
  unpaid: number
  referral: { code: string; earned: number; withdrawn: number }
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
  signInAccount: (p: AccountProfile, token: string) => void
  signOut: () => void
  requestWithdraw: (amount: number, method: string, details: string) => Promise<{ ok: boolean; error?: string }>
  claimBonus: (link: string) => Promise<{ ok: boolean; error?: string }>
  refreshAccount: () => Promise<void>
  adminCredit: (kind: 'paid' | 'unpaid', amount: number) => void
  adminDemoOrders: (count: number) => void
  adminReferralEarning: (amount: number) => void
  setCashback: (code: string, percent: number) => void
  addTicket: (ticket: Ticket) => void
  syncTickets: (rows: Ticket[]) => void
  adminSetTicketStatus: (id: string, status: TicketStatus) => void
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
  refBy: '',
  bonus: 'none',
  unpaid: 0,
  referral: { code: 'UGAARAV', earned: 0, withdrawn: 0 },
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

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch {
      /* demo runs fine without persistence */
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
        setToasts((prev) => prev.filter((t) => t.id !== id))
      }, 4500)
      timers.current.push(timer)
    },
    [],
  )

  const signIn = useCallback((email: string) => {
    void callApi('logLogin', { email, ref: localStorage.getItem('ug_ref') ?? '' })
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
  const signInAccount = useCallback((p: AccountProfile, token: string) => {
    try { localStorage.setItem(TOKEN_KEY, token) } catch { /* ignore */ }
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
        referral: { code: p.code, earned: 0, withdrawn: 0 },
        profile: { name: p.name, email: p.email, username: p.email.split('@')[0], phone: '', country: 'India', joined: now.slice(0, 10) },
        apiKey: 'ug_live_' + rnd,
        logins: [{ email: p.email, at: now }],
      }
    })
  }, [])

  const signOut = useCallback(() => {
    void callApi('logout')
    try { localStorage.removeItem(TOKEN_KEY) } catch { /* ignore */ }
    setState((prev) => ({ ...prev, signedIn: false }))
  }, [])

  useEffect(() => {
    const expired = () => {
      try { localStorage.removeItem(TOKEN_KEY) } catch { /* ignore */ }
      setState((prev) => (prev.signedIn && prev.real ? { ...prev, signedIn: false } : prev))
    }
    window.addEventListener('ug-auth-expired', expired)
    return () => window.removeEventListener('ug-auth-expired', expired)
  }, [])

  const stateRef = useRef(state)
  stateRef.current = state

  /** Real accounts: the server (Google Sheet ledger) is the only source of truth for money, orders and referral earnings. */
  const refreshAccount = useCallback(async () => {
    if (!apiReady() || !stateRef.current.real) return
    const r: any = await callApi('account', { email: stateRef.current.profile.email })
    if (r.error || !Array.isArray(r.orders)) return
    setState((prev) =>
      prev.real
        ? {
            ...prev,
            balance: r.balance,
            unpaid: r.unpaid,
            referral: { ...prev.referral, earned: r.referral.earned, withdrawn: r.referral.withdrawn },
            orders: r.orders,
            transactions: r.transactions,
            withdrawals: r.withdrawals,
            bonus: r.bonus,
            codePercents: { ...prev.codePercents, [prev.referral.code]: r.percent },
          }
        : prev,
    )
  }, [])

  useEffect(() => {
    if (!state.signedIn || !state.real) return
    void refreshAccount()
    const t = window.setInterval(() => void refreshAccount(), 30000)
    const onVis = () => { if (document.visibilityState === 'visible') void refreshAccount() }
    document.addEventListener('visibilitychange', onVis)
    return () => { window.clearInterval(t); document.removeEventListener('visibilitychange', onVis) }
  }, [state.signedIn, state.real, refreshAccount])

  const placeOrder = useCallback(
    async ({ serviceId, link, quantity, dripfeed }: PlaceOrderInput): Promise<PlaceOrderResult> => {
      const service = SERVICES.find((s) => s.id === serviceId)
      if (!service) return { ok: false, error: 'Please choose a service to continue.' }
      if (!link.trim()) return { ok: false, error: 'Add the target link for this order.' }
      if (!/^[a-z0-9-]+(\.[a-z0-9-]+)+/i.test(link.trim().replace(/^https?:\/\//, '')))
        return { ok: false, error: 'That link doesn’t look right. Check the URL and try again.' }
      if (!Number.isFinite(quantity) || quantity < service.min)
        return { ok: false, error: `Minimum quantity for this service is ${service.min.toLocaleString('en-IN')}.` }
      if (quantity > service.max)
        return { ok: false, error: `Maximum quantity for this service is ${service.max.toLocaleString('en-IN')}.` }

      const charge = Math.round(((service.rate * quantity) / 1000) * 100) / 100

      if (state.real && apiReady()) {
        const r: any = await callApi('placeOrder', { email: state.profile.email, serviceId, link: link.trim(), quantity })
        if (r.error) {
          const msg: Record<string, string> = {
            insufficient_balance: 'Insufficient balance. Add funds to place this order.',
            service_unavailable: 'This service is not available right now. Please pick another one.',
            invalid_quantity: 'That quantity is outside the allowed range for this service.',
            invalid_link: 'That link doesn’t look right. Check the URL and try again.',
            provider_error: 'The service provider could not accept this order. You were not charged. Please try again.',
          }
          return { ok: false, error: msg[r.error] ?? 'Could not place the order. You were not charged. Please try again.' }
        }
        await refreshAccount()
        const placed = stateRef.current.orders.find((o) => o.id === r.id)
        return { ok: true, order: placed ?? ({ id: r.id, serviceId, serviceName: service.name, platform: service.platform, link: link.trim(), quantity, charge, startCount: 0, status: 'Pending', progress: 0, createdAt: new Date().toISOString() } as Order) }
      }

      const mock = state.unpaid >= charge
      if (!mock && charge > state.balance)
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
        balance: mock ? prev.balance : Math.round((prev.balance - charge) * 100) / 100,
        unpaid: mock ? Math.round((prev.unpaid - charge) * 100) / 100 : prev.unpaid,
        orders: [order, ...prev.orders],
        transactions: [
          {
            id: 'TX-' + Math.floor(5600 + Math.random() * 300),
            type: 'order',
            label: `${service.name} · ${quantity.toLocaleString('en-IN')}`,
            amount: charge,
            createdAt: new Date().toISOString(),
          },
          ...prev.transactions,
        ],
      }))

      // Real orders go to the provider through Apps Script; unpaid-credit (demo) orders never do.
      if (!mock) void callApi('placeOrder', { email: state.profile.email, serviceId, link, quantity, providerRate: service.rate / MARKUP })

      return { ok: true, order }
    },
    [state.balance, state.unpaid, state.profile.email, state.real, refreshAccount],
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
      const avail = Math.round((state.referral.earned - state.referral.withdrawn) * 100) / 100
      if (!(amount >= 100)) return { ok: false, error: 'Minimum withdrawal is ₹100.' }
      if (amount > avail) return { ok: false, error: 'Amount is more than your available referral funds.' }
      if (state.real && apiReady()) {
        const r: any = await callApi('requestWithdraw', { email: state.profile.email, amount, upi: method === 'UPI' ? details : '', bank: method === 'Bank' ? details : '' })
        if (r.error) return { ok: false, error: r.error === 'exceeds available referral funds' ? 'Amount is more than your available referral funds.' : 'Could not send the request. Please try again.' }
        await refreshAccount()
        return { ok: true }
      }
      const w: Withdrawal = { id: 'WD-' + Math.floor(1000 + Math.random() * 8999), amount, method, details, status: 'Processing', createdAt: new Date().toISOString() }
      setState((prev) => ({ ...prev, referral: { ...prev.referral, withdrawn: prev.referral.withdrawn + amount }, withdrawals: [w, ...prev.withdrawals] }))
      void callApi('requestWithdraw', { email: state.profile.email, amount, upi: method === 'UPI' ? details : '', bank: method === 'Bank' ? details : '' })
      return { ok: true }
    },
    [state.referral, state.profile.email, state.real, refreshAccount],
  )

  const claimBonus = useCallback(
    async (link: string) => {
      if (state.bonus !== 'ready') return { ok: false, error: 'No bonus available.' }
      if (!/instagram\.com\//i.test(link)) return { ok: false, error: 'Paste a valid Instagram link.' }
      if (state.real && apiReady()) {
        const r: any = await callApi('claimBonus', { email: state.profile.email, link })
        if (r.error) return { ok: false, error: 'Could not claim the bonus right now. Please try again.' }
        await refreshAccount()
        return { ok: true }
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
      void callApi('claimBonus', { email: state.profile.email, link })
      return { ok: true }
    },
    [state.bonus, state.profile.email, state.real, refreshAccount],
  )

  const adminCredit = useCallback((kind: 'paid' | 'unpaid', amount: number) => {
    setState((prev) => ({
      ...prev,
      balance: kind === 'paid' ? Math.round((prev.balance + amount) * 100) / 100 : prev.balance,
      unpaid: kind === 'unpaid' ? Math.round((prev.unpaid + amount) * 100) / 100 : prev.unpaid,
      transactions: [{ id: 'TX-' + Math.floor(5600 + Math.random() * 300), type: 'deposit', label: kind === 'paid' ? 'Credit added' : 'Promo credit', amount, createdAt: new Date().toISOString(), method: 'Admin' }, ...prev.transactions],
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

  const setCashback = useCallback((code: string, percent: number) => {
    setState((prev) => ({ ...prev, codePercents: { ...prev.codePercents, [code]: percent } }))
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
      setCashback,
      addTicket,
      syncTickets,
      adminSetTicketStatus,
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
      setCashback,
      addTicket,
      syncTickets,
      adminSetTicketStatus,
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
